import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import ExcelJS from 'exceljs';
import { AppError, toAppError } from '@/lib/api/errors';
import { roleCategoryCounts } from '@/lib/companies/analytics';
import { joinTags, safeExcelText } from '@/lib/companies/normalize';
import type { CompanyRecord } from '@/types/company';
import type { WorkbookState } from './reader';
import {
  DATA_START_ROW,
  fieldColumns,
  HEADER_ROW,
  LAST_DATA_COLUMN,
  MAIN_SHEET,
  RECORD_ID_COLUMN,
  SUMMARY_SHEET,
  TECHNICAL_HEADER,
} from './constants';
import { dateOnlyToExcelDate } from './date';
import { loadWorkbookState } from './reader';

type MutableTableModel = { tableRef?: string; autoFilterRef?: string };

function cloneValue<T>(value: T): T {
  return value === undefined ? value : structuredClone(value);
}

function setCell(
  cell: ExcelJS.Cell,
  field: keyof CompanyRecord,
  value: CompanyRecord[keyof CompanyRecord],
) {
  if (
    field === 'techRoles' ||
    field === 'programTypes' ||
    field === 'openPrograms'
  ) {
    cell.value = safeExcelText(joinTags(value as string[]));
    return;
  }
  if (
    field === 'applicationDeadline' ||
    field === 'verifiedAt' ||
    field === 'contactedAt' ||
    field === 'followUpAt'
  ) {
    cell.value = dateOnlyToExcelDate(value as string | null);
    cell.numFmt = 'yyyy-mm-dd';
    return;
  }
  if (
    field === 'applicationUrl' ||
    field === 'primarySourceUrl' ||
    field === 'secondarySourceUrl'
  ) {
    const url = value as string | null;
    cell.value = url ? { text: url, hyperlink: url } : null;
    return;
  }
  if (typeof value === 'string' || value === null) {
    cell.value = safeExcelText(value);
    return;
  }
  cell.value = value as ExcelJS.CellValue;
}

export function writeRecordCells(
  worksheet: ExcelJS.Worksheet,
  rowNumber: number,
  record: CompanyRecord,
  fields?: (keyof CompanyRecord)[],
) {
  const keys = fields ?? (Object.keys(fieldColumns) as (keyof CompanyRecord)[]);
  for (const field of keys)
    setCell(
      worksheet.getCell(rowNumber, fieldColumns[field]),
      field,
      record[field],
    );
}

function copyRowPresentation(
  worksheet: ExcelJS.Worksheet,
  from: number,
  to: number,
) {
  const source = worksheet.getRow(from);
  const target = worksheet.getRow(to);
  target.height = source.height;
  for (let column = 1; column <= LAST_DATA_COLUMN; column += 1) {
    const sourceCell = source.getCell(column);
    const targetCell = target.getCell(column);
    targetCell.style = cloneValue(sourceCell.style);
    if (sourceCell.dataValidation?.type)
      targetCell.dataValidation = cloneValue(sourceCell.dataValidation);
    targetCell.protection = cloneValue(sourceCell.protection);
  }
}

function trimDataValidations(worksheet: ExcelJS.Worksheet, lastRow: number) {
  const validations = (
    worksheet as unknown as {
      dataValidations: { model: Record<string, ExcelJS.DataValidation> };
    }
  ).dataValidations.model;
  for (const [address, validation] of Object.entries(validations)) {
    const row = Number(address.match(/\d+$/)?.[0]);
    if (!validation?.type || (row >= DATA_START_ROW && row > lastRow))
      delete validations[address];
  }
}

function updateTableRange(worksheet: ExcelJS.Worksheet, lastRow: number) {
  const tables = Object.values(
    (worksheet as unknown as { tables: Record<string, ExcelJS.Table> }).tables,
  );
  for (const table of tables) {
    const model = (table as unknown as { model: MutableTableModel }).model;
    const current = model.tableRef ?? 'A4:V4';
    const endColumn = current.split(':')[1]?.replace(/\d+/g, '') || 'V';
    model.tableRef = `A${HEADER_ROW}:${endColumn}${Math.max(lastRow, HEADER_ROW)}`;
    model.autoFilterRef = model.tableRef;
  }
}

function updateConditionalFormatting(
  worksheet: ExcelJS.Worksheet,
  lastRow: number,
) {
  const rangeEnd = Math.max(lastRow, DATA_START_ROW);
  const items = (
    worksheet as unknown as {
      conditionalFormattings: {
        ref: string;
        rules: { formulae?: string[] }[];
      }[];
    }
  ).conditionalFormattings;
  for (const item of items) {
    if (item.ref.startsWith('I5:I'))
      item.ref = `I${DATA_START_ROW}:I${rangeEnd}`;
    if (item.ref.startsWith('S5:S'))
      item.ref = `S${DATA_START_ROW}:S${rangeEnd}`;
    const values = item.ref.startsWith('I5:I')
      ? ['เปิดรับ', 'Rolling', 'ปิดรับแล้ว']
      : item.ref.startsWith('S5:S')
        ? ['รับแล้ว', 'ไม่รับ', 'กำลังดำเนินการ', 'ติดต่อแล้ว', 'เลยช่วง', 'ไม่มี']
        : [];
    item.rules.forEach((rule, index) => {
      if (
        values[index] &&
        rule.formulae?.some((formula) => formula.includes('"undefined"'))
      ) {
        const column = item.ref[0];
        rule.formulae = [
          `NOT(ISERROR(SEARCH("${values[index]}",${column}${DATA_START_ROW})))`,
        ];
      }
    });
  }
}

function updateSubtitle(worksheet: ExcelJS.Worksheet, count: number) {
  const cell = worksheet.getCell(2, 1);
  if (typeof cell.value === 'string')
    cell.value = cell.value.replace(/\|\s*\d+\s*บริษัท/, `| ${count} บริษัท`);
}

function replaceFormulaLastRow(
  formula: string,
  oldLastRow: number,
  newLastRow: number,
) {
  return formula.replace(
    new RegExp(`([A-Z]+${DATA_START_ROW}:[A-Z]+)${oldLastRow}(?!\\d)`, 'g'),
    `$1${newLastRow}`,
  );
}

function updateSummary(
  workbook: ExcelJS.Workbook,
  records: CompanyRecord[],
  oldLastRow: number,
  newLastRow: number,
) {
  const summary = workbook.getWorksheet(SUMMARY_SHEET);
  if (!summary) return;
  summary.eachRow((row) =>
    row.eachCell((cell) => {
      const value = cell.value;
      if (
        value &&
        typeof value === 'object' &&
        'formula' in value &&
        typeof value.formula === 'string'
      ) {
        cell.value = {
          formula: replaceFormulaLastRow(value.formula, oldLastRow, newLastRow),
        };
      }
    }),
  );
  roleCategoryCounts(records).forEach(({ count }, index) => {
    summary.getCell(5 + index, 5).value = count;
  });

  for (let row = 19; row <= 24; row += 1) {
    for (let column = 1; column <= 6; column += 1)
      summary.getCell(row, column).value = null;
  }
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12),
  );
  const end = new Date(today.getTime() + 14 * 86_400_000);
  const urgent = records
    .filter(
      (record) =>
        record.announcementStatus === 'เปิดรับ' && record.applicationDeadline,
    )
    .filter((record) => {
      const date = new Date(`${record.applicationDeadline}T12:00:00Z`);
      return date >= today && date <= end;
    })
    .sort((a, b) =>
      (a.applicationDeadline ?? '').localeCompare(b.applicationDeadline ?? ''),
    )
    .slice(0, 6);
  urgent.forEach((record, index) => {
    const row = 19 + index;
    summary.getCell(row, 1).value = safeExcelText(record.companyName);
    summary.getCell(row, 2).value = record.announcementStatus;
    summary.getCell(row, 3).value = safeExcelText(record.applicationWindow);
    summary.getCell(row, 4).value = dateOnlyToExcelDate(
      record.applicationDeadline,
    );
    summary.getCell(row, 4).numFmt = 'yyyy-mm-dd';
    summary.getCell(row, 5).value = record.applicationUrl
      ? { text: record.applicationUrl, hyperlink: record.applicationUrl }
      : null;
    summary.getCell(row, 6).value = record.userStatus;
  });
}

export function prepareTechnicalIds(state: WorkbookState) {
  const { worksheet, records, rowById } = state;
  worksheet.getCell(HEADER_ROW, RECORD_ID_COLUMN).value = TECHNICAL_HEADER;
  worksheet.getColumn(RECORD_ID_COLUMN).hidden = true;
  records.forEach(
    (record) =>
      (worksheet.getCell(rowById.get(record.id)!, RECORD_ID_COLUMN).value =
        record.id),
  );
}

export function preparePatch(
  state: WorkbookState,
  nextRecord: CompanyRecord,
  fields: (keyof CompanyRecord)[],
) {
  const rowNumber = state.rowById.get(nextRecord.id);
  if (!rowNumber)
    throw new AppError('RECORD_NOT_FOUND', 'ไม่พบรายการบริษัทนี้', 404, false);
  writeRecordCells(state.worksheet, rowNumber, nextRecord, fields);
  updateConditionalFormatting(state.worksheet, state.lastDataRow);
}

export function prepareAdd(state: WorkbookState, record: CompanyRecord) {
  const rowNumber = Math.max(state.lastDataRow + 1, DATA_START_ROW);
  state.worksheet.insertRow(rowNumber, [], 'i');
  if (rowNumber > DATA_START_ROW)
    copyRowPresentation(state.worksheet, rowNumber - 1, rowNumber);
  writeRecordCells(state.worksheet, rowNumber, record);
  state.worksheet.getColumn(RECORD_ID_COLUMN).hidden = true;
  const records = [...state.records, record];
  updateTableRange(state.worksheet, rowNumber);
  updateConditionalFormatting(state.worksheet, rowNumber);
  trimDataValidations(state.worksheet, rowNumber);
  updateSubtitle(state.worksheet, records.length);
  updateSummary(state.workbook, records, state.lastDataRow, rowNumber);
}

export function prepareDelete(
  state: WorkbookState,
  id: string,
  records: CompanyRecord[],
) {
  const rowNumber = state.rowById.get(id);
  if (!rowNumber)
    throw new AppError('RECORD_NOT_FOUND', 'ไม่พบรายการบริษัทนี้', 404, false);
  state.worksheet.spliceRows(rowNumber, 1);
  records.forEach((record, index) => {
    record.order = index + 1;
    state.worksheet.getCell(DATA_START_ROW + index, 1).value = record.order;
  });
  const newLastRow = Math.max(DATA_START_ROW + records.length - 1, HEADER_ROW);
  updateTableRange(state.worksheet, newLastRow);
  updateConditionalFormatting(state.worksheet, newLastRow);
  trimDataValidations(state.worksheet, newLastRow);
  updateSubtitle(state.worksheet, records.length);
  updateSummary(
    state.workbook,
    records,
    state.lastDataRow,
    Math.max(newLastRow, DATA_START_ROW),
  );
}

export async function saveAndVerify(
  state: WorkbookState,
  filePath: string,
  expectedRecords: CompanyRecord[],
  verify?: (actual: CompanyRecord[]) => boolean,
) {
  const directory = path.dirname(filePath);
  const token = randomUUID();
  const temporaryPath = path.join(
    directory,
    `.${path.basename(filePath)}.${token}.tmp.xlsx`,
  );
  const rollbackPath = path.join(
    directory,
    `.${path.basename(filePath)}.${token}.rollback.xlsx`,
  );
  try {
    state.workbook.calcProperties.fullCalcOnLoad = true;
    await state.workbook.xlsx.writeFile(temporaryPath);
    const checked = await loadWorkbookState(temporaryPath);
    const ids = new Set(checked.records.map((record) => record.id));
    if (
      checked.records.length !== expectedRecords.length ||
      ids.size !== checked.records.length ||
      (verify && !verify(checked.records))
    ) {
      throw new AppError(
        'WRITE_FAILED',
        'ตรวจสอบไฟล์ชั่วคราวไม่ผ่าน จึงไม่แก้ไฟล์จริง',
        500,
        true,
      );
    }
    const main = checked.workbook.getWorksheet(MAIN_SHEET)!;
    if (!main.getColumn(RECORD_ID_COLUMN).hidden)
      throw new AppError('WRITE_FAILED', 'คอลัมน์เทคนิคไม่ได้ถูกซ่อน', 500, true);

    await fs.rename(filePath, rollbackPath);
    try {
      await fs.rename(temporaryPath, filePath);
    } catch (error) {
      await fs.rename(rollbackPath, filePath);
      throw error;
    }
    await fs.unlink(rollbackPath).catch(() => {
      /* A stale rollback copy is safer than reporting a false write failure. */
    });
  } catch (error) {
    await Promise.allSettled([
      fs.unlink(temporaryPath),
      fs.access(rollbackPath).then(() => fs.rename(rollbackPath, filePath)),
    ]);
    throw toAppError(error, 'WRITE_FAILED');
  }
}
