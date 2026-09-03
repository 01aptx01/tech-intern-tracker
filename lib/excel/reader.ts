import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import ExcelJS from 'exceljs';
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
  lastDataRow: number;
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

export async function loadWorkbookState(
  fileOverride?: string,
): Promise<WorkbookState> {
  const filePath = fileOverride ?? getExcelConfig().filePath;
  const [bytes, stat] = await Promise.all([
    fs.readFile(filePath),
    fs.stat(filePath),
  ]);

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(bytes as never);
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
  let needsIdRepair = !hasRecordIdHeader;
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
