import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ExcelRepository } from '@/lib/excel/repository';
import { AppError } from '@/lib/api/errors';
import { eventBus } from '@/lib/events/workbook-event-bus';
import { ownerLockPath } from '@/lib/excel/lock';
import { createTestWorkbook } from '@/tests/fixtures/create-test-workbook';

let directory: string;
let filePath: string;
let backupDir: string;
let repository: ExcelRepository;

async function styledCellCount() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet('บริษัทฝึกงาน')!;
  let count = 0;
  sheet.eachRow((row) =>
    row.eachCell((cell) => {
      if (Object.keys(cell.style).length > 0) count += 1;
    }),
  );
  return count;
}

beforeEach(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), 'tracker-test-'));
  filePath = path.join(directory, 'tracker.xlsx');
  backupDir = path.join(directory, 'backups');
  await createTestWorkbook(filePath);
  repository = new ExcelRepository({
    filePath,
    backupDir,
    appOrigin: 'http://127.0.0.1:3000',
  });
});
afterEach(async () => {
  await repository.close();
  await fs.rm(directory, { recursive: true, force: true });
});

describe('Excel repository round-trip', () => {
  it('repairs invalid or duplicate record IDs', async () => {
    await createTestWorkbook(filePath, { includeIds: true });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet('บริษัทฝึกงาน')!;
    sheet.getCell('W6').value = sheet.getCell('W5').value;
    await workbook.xlsx.writeFile(filePath);
    const snapshot = await repository.initialize();
    expect(new Set(snapshot.records.map((record) => record.id)).size).toBe(2);
    expect(
      snapshot.records.every((record) => /^[0-9a-f-]{36}$/i.test(record.id)),
    ).toBe(true);
  });

  it('initializes stable hidden IDs and preserves styles on patch', async () => {
    const initial = await repository.initialize();
    expect(initial.records).toHaveLength(2);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    expect(workbook.getWorksheet('บริษัทฝึกงาน')!.getColumn(23).hidden).toBe(true);
    const before = await styledCellCount();
    const next = await repository.update(
      initial.records[0].id,
      initial.version,
      { personalNotes: 'Interview booked' },
    );
    expect(next.records[0].personalNotes).toBe('Interview booked');
    expect(await styledCellCount()).toBeGreaterThanOrEqual(before);
    const repaired = new ExcelJS.Workbook();
    await repaired.xlsx.readFile(filePath);
    const formatting = (
      repaired.getWorksheet('บริษัทฝึกงาน') as unknown as {
        conditionalFormattings: { rules: { formulae?: string[] }[] }[];
      }
    ).conditionalFormattings;
    expect(
      formatting
        .flatMap((item) => item.rules.flatMap((rule) => rule.formulae ?? []))
        .join(' '),
    ).not.toContain('undefined');
  });

  it('adds and deletes rows while expanding table, validation and summary', async () => {
    const initial = await repository.initialize();
    const created = await repository.create(initial.version, {
      companyName: 'Gamma Cloud',
      fullCompanyName: 'Gamma Cloud Company Limited',
      business: 'Cloud',
      techRoles: ['DevOps'],
      thailandLocation: 'Bangkok',
      workMode: 'Hybrid',
      contact: null,
      applicationUrl: 'https://example.com/gamma',
      announcementStatus: 'เปิดรับ',
      applicationWindow: null,
      applicationDeadline: '2026-09-25',
      internshipPeriod: null,
      programTypes: ['Co-op'],
      openPrograms: ['Cloud Internship 2027'],
      qualificationsNotes: null,
      primarySourceUrl: 'https://example.com/gamma/source',
      secondarySourceUrl: null,
      verifiedAt: '2026-09-03',
      evidenceLevel: 'A',
      userStatus: null,
      contactedAt: null,
      followUpAt: null,
      personalNotes: null,
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const main = workbook.getWorksheet('บริษัทฝึกงาน')!;
    expect(main.getCell('S7').dataValidation.type).toBe('list');
    expect(
      Object.keys(
        (main as unknown as { dataValidations: { model: object } })
          .dataValidations.model,
      ),
    ).toHaveLength(3);
    expect(
      (
        main.getTable('InternshipTracker') as unknown as {
          model: { tableRef: string };
        }
      ).model.tableRef,
    ).toBe('A4:Y7');
    expect(main.getCell('X7').value).toBe('Gamma Cloud Company Limited');
    expect(main.getCell('Y7').value).toBe('Cloud Internship 2027');
    const summaryFormula = workbook
      .getWorksheet('สรุปและลำดับดำเนินการ')!
      .getCell('B5').value as ExcelJS.CellFormulaValue;
    expect(summaryFormula.formula).toContain('B5:B7');
    const gamma = created.records.find(
      (record) => record.companyName === 'Gamma Cloud',
    )!;
    const deleted = await repository.delete(
      gamma.id,
      created.version,
      gamma.companyName,
    );
    expect(deleted.records).toHaveLength(2);
    const after = new ExcelJS.Workbook();
    await after.xlsx.readFile(filePath);
    expect(
      (
        after
          .getWorksheet('บริษัทฝึกงาน')!
          .getTable('InternshipTracker') as unknown as {
          model: { tableRef: string };
        }
      ).model.tableRef,
    ).toBe('A4:Y6');
    expect(
      Object.keys(
        (
          after.getWorksheet('บริษัทฝึกงาน') as unknown as {
            dataValidations: { model: object };
          }
        ).dataValidations.model,
      ),
    ).toHaveLength(2);
    expect((await fs.readdir(backupDir)).length).toBeGreaterThanOrEqual(3);
  });

  it('rejects stale versions and owner locks without changing the workbook', async () => {
    const initial = await repository.initialize();
    await expect(
      repository.update(initial.records[0].id, '0'.repeat(64), {
        userStatus: 'ติดต่อแล้ว',
      }),
    ).rejects.toMatchObject({
      code: 'VERSION_CONFLICT',
    } satisfies Partial<AppError>);
    await fs.writeFile(ownerLockPath(filePath), 'locked');
    await expect(
      repository.update(initial.records[0].id, initial.version, {
        userStatus: 'ติดต่อแล้ว',
      }),
    ).rejects.toMatchObject({
      code: 'WORKBOOK_LOCKED',
    } satisfies Partial<AppError>);
    await fs.unlink(ownerLockPath(filePath));
    expect(
      (await repository.getSnapshot({ fresh: true })).records[0].userStatus,
    ).toBeNull();
  });

  it('detects an external Excel change and refreshes the snapshot', async () => {
    const initial = await repository.initialize();
    const changed = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        reject(new Error('watcher timeout'));
      }, 8_000);
      const unsubscribe = eventBus.subscribe((event) => {
        if (event.type === 'workbook.changed' && event.source === 'excel') {
          clearTimeout(timeout);
          unsubscribe();
          resolve();
        }
      });
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    workbook.getWorksheet('บริษัทฝึกงาน')!.getCell('V5').value = 'External edit';
    await workbook.xlsx.writeFile(filePath);
    await changed;
    const refreshed = await repository.getSnapshot();
    expect(refreshed.version).not.toBe(initial.version);
    expect(refreshed.records[0].personalNotes).toBe('External edit');
  });
});
