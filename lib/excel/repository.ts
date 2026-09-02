import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Mutex } from "async-mutex";
import { AppError, toAppError } from "@/lib/api/errors";
import { normalizeCompanyName } from "@/lib/companies/normalize";
import { companyRecordSchema } from "@/lib/companies/schema";
import { eventBus } from "@/lib/events/workbook-event-bus";
import type { CompanyInput, CompanyRecord, WorkbookSnapshot } from "@/types/company";
import { createBackup } from "./backup";
import { type ExcelConfig, getExcelConfig } from "./config";
import { isWorkbookLocked } from "./lock";
import { loadWorkbookState, toSnapshot, type WorkbookState } from "./reader";
import { WorkbookWatcher } from "./watcher";
import { prepareAdd, prepareDelete, preparePatch, prepareTechnicalIds, saveAndVerify } from "./writer";

const globals = globalThis as typeof globalThis & {
  __trackerMutex?: Mutex;
  __trackerRepository?: ExcelRepository;
};
const writeMutex = globals.__trackerMutex ??= new Mutex();

export class ExcelRepository {
  private snapshot: WorkbookSnapshot | null = null;
  private watcher: WorkbookWatcher | null = null;
  private initializing: Promise<WorkbookSnapshot> | null = null;

  constructor(private readonly config: ExcelConfig) {}

  initialize() {
    if (!this.initializing) this.initializing = this.initializeOnce().catch((error) => { this.initializing = null; throw error; });
    return this.initializing;
  }

  private async initializeOnce() {
    const state = await loadWorkbookState(this.config.filePath);
    this.snapshot = state.needsIdRepair ? await this.repairIds(state) : toSnapshot(state);
    this.watcher = new WorkbookWatcher(this.config.filePath, { refresh: () => this.refreshFromDisk() });
    this.watcher.start();
    return this.snapshot;
  }

  private async repairIds(initialState?: WorkbookState) {
    return writeMutex.runExclusive(async () => {
      const state = initialState ?? await loadWorkbookState(this.config.filePath);
      if (!state.needsIdRepair) return toSnapshot(state);
      if (await isWorkbookLocked(this.config.filePath)) throw new AppError("WORKBOOK_LOCKED", "Excel กำลังใช้งานไฟล์นี้อยู่ กรุณาบันทึกและปิดไฟล์ก่อนลองอีกครั้ง", 423, true);
      await createBackup(this.config.filePath, this.config.backupDir);
      prepareTechnicalIds(state);
      await saveAndVerify(state, this.config.filePath, state.records);
      return toSnapshot(await loadWorkbookState(this.config.filePath));
    });
  }

  async getSnapshot(options: { fresh?: boolean } = {}) {
    if (!this.snapshot) await this.initialize();
    if (options.fresh) {
      try { await this.refreshFromDisk(); }
      catch { /* Return the last valid snapshot with an error state. */ }
    }
    return this.snapshot!;
  }

  async refreshFromDisk() {
    const previousVersion = this.snapshot?.version;
    try {
      const state = await loadWorkbookState(this.config.filePath);
      this.snapshot = state.needsIdRepair ? await this.repairIds(state) : toSnapshot(state);
      return {
        version: this.snapshot.version,
        lastModifiedAt: this.snapshot.lastModifiedAt,
        changed: previousVersion !== undefined && previousVersion !== this.snapshot.version,
      };
    } catch (error) {
      if (this.snapshot) {
        this.snapshot = { ...this.snapshot, syncStatus: "error", errorMessage: error instanceof Error ? error.message : "อ่านไฟล์ไม่สำเร็จ" };
      }
      throw error;
    }
  }

  private async mutate(
    baseVersion: string,
    transform: (state: WorkbookState) => { records: CompanyRecord[]; verify?: (actual: CompanyRecord[]) => boolean },
  ) {
    return writeMutex.runExclusive(async () => {
      try {
        const state = await loadWorkbookState(this.config.filePath);
        if (state.version !== baseVersion) throw new AppError("VERSION_CONFLICT", "ไฟล์ Excel มีการเปลี่ยนแปลงหลังจากที่หน้านี้โหลด", 409, true);
        if (await isWorkbookLocked(this.config.filePath)) throw new AppError("WORKBOOK_LOCKED", "Excel กำลังใช้งานไฟล์นี้อยู่ กรุณาบันทึกและปิดไฟล์ก่อนลองอีกครั้ง", 423, true);
        await createBackup(this.config.filePath, this.config.backupDir);
        const result = transform(state);
        await saveAndVerify(state, this.config.filePath, result.records, result.verify);
        const next = toSnapshot(await loadWorkbookState(this.config.filePath));
        this.snapshot = next;
        eventBus.emit({ type: "workbook.changed", version: next.version, at: next.lastModifiedAt, source: "app" });
        return next;
      } catch (error) {
        throw toAppError(error, "WRITE_FAILED");
      }
    });
  }

  async create(baseVersion: string, input: CompanyInput) {
    return this.mutate(baseVersion, (state) => {
      if (state.records.some((record) => normalizeCompanyName(record.companyName) === normalizeCompanyName(input.companyName))) {
        throw new AppError("DUPLICATE_COMPANY", "มีบริษัทชื่อนี้อยู่แล้ว", 409, false);
      }
      const record = companyRecordSchema.parse({ ...input, id: randomUUID(), order: state.records.length + 1 });
      prepareAdd(state, record);
      return { records: [...state.records, record], verify: (records) => records.some((item) => item.id === record.id) };
    });
  }

  async update(id: string, baseVersion: string, changes: Partial<CompanyInput>) {
    return this.mutate(baseVersion, (state) => {
      const current = state.records.find((record) => record.id === id);
      if (!current) throw new AppError("RECORD_NOT_FOUND", "ไม่พบรายการบริษัทนี้", 404, false);
      const next = companyRecordSchema.parse({ ...current, ...changes });
      if (state.records.some((record) => record.id !== id && normalizeCompanyName(record.companyName) === normalizeCompanyName(next.companyName))) {
        throw new AppError("DUPLICATE_COMPANY", "มีบริษัทชื่อนี้อยู่แล้ว", 409, false);
      }
      const fields = Object.keys(changes) as (keyof CompanyInput)[];
      preparePatch(state, next, fields);
      const records = state.records.map((record) => record.id === id ? next : record);
      return {
        records,
        verify: (actual) => {
          const saved = actual.find((record) => record.id === id);
          return Boolean(saved && fields.every((field) => JSON.stringify(saved[field]) === JSON.stringify(next[field])));
        },
      };
    });
  }

  async delete(id: string, baseVersion: string, confirmationName: string) {
    return this.mutate(baseVersion, (state) => {
      const current = state.records.find((record) => record.id === id);
      if (!current) throw new AppError("RECORD_NOT_FOUND", "ไม่พบรายการบริษัทนี้", 404, false);
      if (current.companyName !== confirmationName) throw new AppError("VALIDATION_ERROR", "ชื่อยืนยันไม่ตรงกับชื่อบริษัท", 422, false);
      const records = state.records.filter((record) => record.id !== id).map((record, index) => ({ ...record, order: index + 1 }));
      prepareDelete(state, id, records);
      return { records, verify: (actual) => !actual.some((record) => record.id === id) };
    });
  }

  async download() {
    await this.getSnapshot({ fresh: true });
    return fs.readFile(this.config.filePath);
  }

  async close() { await this.watcher?.close(); }
}

export function getExcelRepository() {
  return globals.__trackerRepository ??= new ExcelRepository(getExcelConfig());
}

export const getSnapshot = (options?: { fresh?: boolean }) => getExcelRepository().getSnapshot(options);
export const createCompany = (baseVersion: string, input: CompanyInput) => getExcelRepository().create(baseVersion, input);
export const updateCompany = (id: string, baseVersion: string, changes: Partial<CompanyInput>) => getExcelRepository().update(id, baseVersion, changes);
export const deleteCompany = (id: string, baseVersion: string, confirmationName: string) => getExcelRepository().delete(id, baseVersion, confirmationName);
export const downloadWorkbook = () => getExcelRepository().download();
