import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { AppError } from '@/lib/api/errors';
import {
  cleanText,
  normalizeCompanyName,
  splitTags,
} from '@/lib/companies/normalize';
import { companyRecordSchema } from '@/lib/companies/schema';
import type { CompanyRecord, WorkbookSnapshot } from '@/types/company';
import { getExcelConfig } from './config';
import {
  DATA_START_ROW,
  FULL_COMPANY_NAME_COLUMN,
  MAIN_SHEET,
  OPEN_PROGRAMS_COLUMN,
  RECORD_ID_COLUMN,
  REQUIRED_SHEETS,
} from './constants';
import { excelDateToDateOnly } from './date';
import { validateAndMapHeaders } from './headers';
import { hashWorkbook } from './snapshot';

export interface WorkbookState {
  workbook: ExcelJS.Workbook;
  worksheet: ExcelJS.Worksheet;
  records: CompanyRecord[];
  rowById: Map<string, number>;
  version: string;
  lastModifiedAt: string;
  sourceFileName: string;
  needsIdRepair: boolean;
  needsValidationRepair: boolean;
  lastDataRow: number;
}

/**
 * Some Excel-compatible exporters emit OOXML with a prefixed spreadsheet
 * namespace and package-absolute relationship targets. ExcelJS expects the
 * canonical default namespace and package-relative targets. Normalize only
 * that exporter variation in memory; the source workbook bytes are never
 * changed by the reader.
 */
async function normalizeExporterOoxml(bytes: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(bytes);

  for (const name of Object.keys(zip.files)) {
    if (!name.endsWith('.xml') && !name.endsWith('.rels')) continue;
    const entry = zip.files[name];
    if (entry.dir) continue;

    let xml = await entry.async('string');
    if (name.endsWith('.xml')) {
      xml = xml
        .replaceAll('</x:', '</')
        .replaceAll('<x:', '<')
        .replaceAll(
          'xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
          'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
        );
    }

    if (name.endsWith('.rels')) {
      const ownerPath = name
        .replace(/\/_rels\/([^/]+)$/, '/$1')
        .replace(/^_rels\/\.rels$/, '');
      const sourceDirectory = path.posix.dirname(ownerPath);
      xml = xml.replace(
        /Target="\/xl\/([^"]+)"/g,
        (_match, target: string) =>
          `Target="${path.posix.relative(sourceDirectory, `xl/${target}`)}"`,
      );
    }

    zip.file(name, xml);
  }

  return zip.generateAsync({ type: 'nodebuffer' });
}

async function loadExcelWorkbook(bytes: Buffer): Promise<{
  workbook: ExcelJS.Workbook;
  normalized: boolean;
}> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(bytes as never);
    return { workbook, normalized: false };
  } catch (firstError) {
    try {
      const normalizedBytes = await normalizeExporterOoxml(bytes);
      const normalizedWorkbook = new ExcelJS.Workbook();
      await normalizedWorkbook.xlsx.load(normalizedBytes as never);
      return { workbook: normalizedWorkbook, normalized: true };
    } catch {
      throw firstError;
    }
  }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolveCellValue(
  cell: ExcelJS.Cell,
  preferHyperlink = false,
): unknown {
  const value = cell.value;
  if (value === null || value === undefined) return null;
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date
  )
    return value;
  if ('error' in value)
    throw new AppError(
      'INVALID_WORKBOOK',
      `พบ formula error ที่ ${cell.address}`,
      500,
      false,
    );
  if ('formula' in value || 'sharedFormula' in value) {
    const result = value.result;
    if (result && typeof result === 'object' && 'error' in result)
      throw new AppError(
        'INVALID_WORKBOOK',
        `พบ formula error ที่ ${cell.address}`,
        500,
        false,
      );
    return result ?? null;
  }
  if ('richText' in value)
    return value.richText.map((part) => part.text).join('');
  if ('hyperlink' in value)
    return preferHyperlink ? value.hyperlink : value.text;
  return null;
}

function fieldErrorMessage(
  row: number,
  issues: { path: PropertyKey[]; message: string }[],
) {
  return `ข้อมูลแถว ${row} ไม่ถูกต้อง: ${issues.map((issue) => `${String(issue.path[0])}: ${issue.message}`).join(', ')}`;
}

function hasFunctionalDataValidations(worksheet: ExcelJS.Worksheet) {
  // Do not force a migration for legacy fixtures/workbooks that simply do not
  // have a validation on a column yet. Do repair exporter output that contains
  // an explicit but non-functional `any` validation.
  return [9, 18, 19].every((column) => {
    const validation = worksheet.getCell(DATA_START_ROW, column).dataValidation;
    return !validation || validation.type === 'list';
  });
}

function hasRequiredViewState(worksheet: ExcelJS.Worksheet) {
  const view = worksheet.views?.find((item) => item.state === 'frozen');
  const splitView = view as (typeof view & { xSplit?: number; ySplit?: number }) | undefined;
  return splitView?.xSplit === 2 && splitView.ySplit === 4;
}

function hasNativeSourceHyperlinks(worksheet: ExcelJS.Worksheet) {
  return [8, 15, 16].every((column) => {
    const value = worksheet.getCell(DATA_START_ROW, column).value;
    return value === null ||
      (typeof value === 'object' && 'hyperlink' in value && Boolean(value.hyperlink));
  });
}

export async function loadWorkbookState(
  fileOverride?: string,
): Promise<WorkbookState> {
  const filePath = fileOverride ?? getExcelConfig().filePath;
  const [bytes, stat] = await Promise.all([
    fs.readFile(filePath),
    fs.stat(filePath),
  ]);

  let workbook: ExcelJS.Workbook;
  let normalized = false;
  try {
    const loaded = await loadExcelWorkbook(bytes);
    workbook = loaded.workbook;
    normalized = loaded.normalized;
  } catch {
    throw new AppError(
      'INVALID_WORKBOOK',
      'ไฟล์ Excel เสียหรืออ่านไม่สำเร็จ',
      500,
      false,
    );
  }

  for (const sheetName of REQUIRED_SHEETS) {
    if (!workbook.getWorksheet(sheetName))
      throw new AppError('INVALID_WORKBOOK', `ไม่พบชีต ${sheetName}`, 500, false);
  }
  const worksheet = workbook.getWorksheet(MAIN_SHEET)!;
  const { hasRecordIdHeader } = validateAndMapHeaders(worksheet);
  const records: CompanyRecord[] = [];
  const rowById = new Map<string, number>();
  const companyNames = new Set<string>();
  // A zero-width technical column is visually hidden in the latest normalized
  // workbook, but ExcelJS still reports `hidden: false`. Treat that as a
  // one-time technical repair so the first app write persists a real hidden
  // column and save verification remains deterministic.
  let needsIdRepair =
    !hasRecordIdHeader || !worksheet.getColumn(RECORD_ID_COLUMN).hidden;
  const needsValidationRepair =
    normalized && !hasFunctionalDataValidations(worksheet);
  if (normalized) {
    needsIdRepair =
      needsIdRepair ||
      needsValidationRepair ||
      !hasRequiredViewState(worksheet) ||
      !hasNativeSourceHyperlinks(worksheet);
  }
  let lastDataRow = DATA_START_ROW - 1;

  for (
    let rowNumber = DATA_START_ROW;
    rowNumber <= worksheet.rowCount;
    rowNumber += 1
  ) {
    const row = worksheet.getRow(rowNumber);
    const companyName = cleanText(resolveCellValue(row.getCell(2)));
    const rawId = cleanText(resolveCellValue(row.getCell(RECORD_ID_COLUMN)));
    if (!companyName && !rawId) continue;
    if (!companyName)
      throw new AppError(
        'INVALID_WORKBOOK',
        `แถว ${rowNumber} มี record ID แต่ไม่มีชื่อบริษัท`,
        500,
        false,
      );

    let id = rawId;
    if (!id || !uuidPattern.test(id) || rowById.has(id)) {
      id = randomUUID();
      needsIdRepair = true;
    }
    const value = (column: number, hyperlink = false) =>
      resolveCellValue(row.getCell(column), hyperlink);
    const candidate: CompanyRecord = {
      id,
      order: Number(value(1)) || records.length + 1,
      companyName,
      fullCompanyName: cleanText(value(FULL_COMPANY_NAME_COLUMN)),
      business: cleanText(value(3)),
      techRoles: splitTags(value(4)),
      thailandLocation: cleanText(value(5)),
      workMode: cleanText(value(6)),
      contact: cleanText(value(7)),
      applicationUrl: cleanText(value(8, true)),
      announcementStatus: cleanText(
        value(9),
      ) as CompanyRecord['announcementStatus'],
      applicationWindow: cleanText(value(10)),
      applicationDeadline: excelDateToDateOnly(value(11)),
      internshipPeriod: cleanText(value(12)),
      programTypes: splitTags(value(13)),
      openPrograms: splitTags(value(OPEN_PROGRAMS_COLUMN)),
      qualificationsNotes: cleanText(value(14)),
      primarySourceUrl: cleanText(value(15, true)),
      secondarySourceUrl: cleanText(value(16, true)),
      verifiedAt: excelDateToDateOnly(value(17)),
      evidenceLevel: cleanText(value(18)) as CompanyRecord['evidenceLevel'],
      userStatus: cleanText(value(19)) as CompanyRecord['userStatus'],
      contactedAt: excelDateToDateOnly(value(20)),
      followUpAt: excelDateToDateOnly(value(21)),
      personalNotes: cleanText(value(22)),
    };
    const parsed = companyRecordSchema.safeParse(candidate);
    if (!parsed.success)
      throw new AppError(
        'INVALID_WORKBOOK',
        fieldErrorMessage(rowNumber, parsed.error.issues),
        500,
        false,
      );
    const normalizedName = normalizeCompanyName(parsed.data.companyName);
    if (companyNames.has(normalizedName))
      throw new AppError(
        'INVALID_WORKBOOK',
        `พบชื่อบริษัทซ้ำที่แถว ${rowNumber}`,
        500,
        false,
      );
    companyNames.add(normalizedName);
    records.push(parsed.data);
    rowById.set(id, rowNumber);
    lastDataRow = rowNumber;
  }

  return {
    workbook,
    worksheet,
    records,
    rowById,
    version: hashWorkbook(bytes),
    lastModifiedAt: stat.mtime.toISOString(),
    sourceFileName: path.basename(filePath),
    needsIdRepair,
    needsValidationRepair,
    lastDataRow,
  };
}

export function toSnapshot(
  state: WorkbookState,
  syncStatus: WorkbookSnapshot['syncStatus'] = 'synced',
): WorkbookSnapshot {
  return {
    records: state.records,
    version: state.version,
    lastModifiedAt: state.lastModifiedAt,
    total: state.records.length,
    sourceFileName: state.sourceFileName,
    syncStatus,
  };
}
