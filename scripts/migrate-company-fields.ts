import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import ExcelJS from 'exceljs';
import { createBackup } from '@/lib/excel/backup';
import { getExcelConfig } from '@/lib/excel/config';
import { isWorkbookLocked } from '@/lib/excel/lock';
import { loadWorkbookState } from '@/lib/excel/reader';
import { AppError } from '@/lib/api/errors';

const MAIN_SHEET = 'บริษัทฝึกงาน';
const EXPECTED_OLD_HEADER = 'บริษัท';
const KNOWN_NAME_HEADER = 'ชื่อที่รู้จัก';
const FULL_NAME_HEADER = 'ชื่อเต็ม';
const OPEN_PROGRAMS_HEADER = 'โครงการที่เปิดรับ';

type TableModel = {
  tableRef?: string;
  autoFilterRef?: string;
  columns: { name: string; filterButton?: boolean }[];
};
type ValidationModel = { dataValidations: { model: Record<string, unknown> } };
type FormattingModel = { conditionalFormattings: unknown[] };

function formulaList(worksheet: ExcelJS.Worksheet) {
  const formulas: string[] = [];
  worksheet.eachRow((row) =>
    row.eachCell((cell) => {
      const value = cell.value;
      if (
        value &&
        typeof value === 'object' &&
        'formula' in value &&
        typeof value.formula === 'string'
      ) {
        formulas.push(`${cell.address}:${value.formula}`);
      }
    }),
  );
  return formulas;
}

function modelCount(
  worksheet: ExcelJS.Worksheet,
  key: 'validation' | 'formatting',
) {
  if (key === 'validation')
    return Object.keys(
      (worksheet as unknown as ValidationModel).dataValidations.model,
    ).length;
  return (worksheet as unknown as FormattingModel).conditionalFormattings
    .length;
}

const config = getExcelConfig();
if (await isWorkbookLocked(config.filePath)) {
  throw new AppError(
    'WORKBOOK_LOCKED',
    'Excel กำลังใช้งานไฟล์นี้อยู่ กรุณาบันทึกและปิดไฟล์ก่อน migrate',
    423,
    true,
  );
}

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(config.filePath);
const worksheet = workbook.getWorksheet(MAIN_SHEET);
if (!worksheet) throw new Error(`ไม่พบชีต ${MAIN_SHEET}`);

const currentKnownHeader = worksheet.getCell('B4').text.trim();
const alreadyMigrated =
  currentKnownHeader === KNOWN_NAME_HEADER &&
  worksheet.getCell('X4').value === FULL_NAME_HEADER &&
  worksheet.getCell('Y4').value === OPEN_PROGRAMS_HEADER;
if (alreadyMigrated) {
  console.log('Workbook รองรับชื่อที่รู้จัก ชื่อเต็ม และโครงการที่เปิดรับอยู่แล้ว');
  process.exit(0);
}
if (currentKnownHeader !== EXPECTED_OLD_HEADER) {
  throw new Error(
    `Header B4 ไม่ใช่ “${EXPECTED_OLD_HEADER}” จึงหยุด migration เพื่อป้องกันข้อมูลเสีย`,
  );
}

const originalSheetNames = workbook.worksheets.map((sheet) => sheet.name);
const summary = workbook.getWorksheet('สรุปและลำดับดำเนินการ');
if (!summary) throw new Error('ไม่พบชีตสรุปและลำดับดำเนินการ');
const originalFormulas = formulaList(summary);
const originalValidationCount = modelCount(worksheet, 'validation');
const originalFormattingCount = modelCount(worksheet, 'formatting');
const lastDataRow = Math.max(4, worksheet.rowCount);
const ids = Array.from(
  { length: Math.max(0, lastDataRow - 4) },
  (_, index) => worksheet.getCell(5 + index, 23).value,
);

const table = worksheet.getTable('InternshipTracker');
const tableModel = (table as unknown as { model: TableModel }).model;
const originalTableRef = tableModel.tableRef;
if (!originalTableRef?.startsWith('A4:V')) {
  throw new Error(
    `Table range เดิมไม่ตรงกับ schema ที่รองรับ: ${originalTableRef ?? 'ไม่พบ'}`,
  );
}

tableModel.columns[1].name = KNOWN_NAME_HEADER;
tableModel.columns.push(
  { name: '_record_id', filterButton: false },
  { name: FULL_NAME_HEADER, filterButton: false },
  { name: OPEN_PROGRAMS_HEADER, filterButton: false },
);
tableModel.tableRef = `A4:Y${lastDataRow}`;
tableModel.autoFilterRef = tableModel.tableRef;

worksheet.unMergeCells('A1:V1');
worksheet.unMergeCells('A2:V2');
worksheet.mergeCells('A1:Y1');
worksheet.mergeCells('A2:Y2');
worksheet.getCell('B4').value = KNOWN_NAME_HEADER;
worksheet.getCell('X4').value = FULL_NAME_HEADER;
worksheet.getCell('Y4').value = OPEN_PROGRAMS_HEADER;
worksheet.getColumn(23).hidden = true;
worksheet.getColumn(24).width = 34;
worksheet.getColumn(25).width = 34;

for (let row = 4; row <= lastDataRow; row += 1) {
  const presentationSource = worksheet.getCell(row, row === 4 ? 2 : 22);
  for (const column of [24, 25]) {
    const cell = worksheet.getCell(row, column);
    cell.style = structuredClone(presentationSource.style);
    cell.alignment = { ...cell.alignment, vertical: 'top', wrapText: true };
  }
}

const token = randomUUID();
const directory = path.dirname(config.filePath);
const temporaryPath = path.join(
  directory,
  `.${path.basename(config.filePath)}.${token}.tmp.xlsx`,
);
const rollbackPath = path.join(
  directory,
  `.${path.basename(config.filePath)}.${token}.rollback.xlsx`,
);

try {
  workbook.calcProperties.fullCalcOnLoad = true;
  await workbook.xlsx.writeFile(temporaryPath);
  const checked = await loadWorkbookState(temporaryPath);
  const checkedSummary = checked.workbook.getWorksheet('สรุปและลำดับดำเนินการ')!;
  const checkedTable = checked.worksheet.getTable('InternshipTracker');
  const checkedTableRef = (checkedTable as unknown as { model: TableModel })
    .model.tableRef;
  const checkedIds = checked.records.map((record) => record.id);

  if (checked.records.length !== ids.length)
    throw new Error(
      `จำนวน record หลัง migration ไม่ตรงกับไฟล์เดิม (${checked.records.length}/${ids.length})`,
    );
  if (new Set(checkedIds).size !== checkedIds.length)
    throw new Error('พบ UUID ซ้ำหลัง migration');
  if (checkedTableRef !== `A4:Y${lastDataRow}`)
    throw new Error(`Table range หลัง migration ไม่ถูกต้อง: ${checkedTableRef}`);
  if (!checked.worksheet.getColumn(23).hidden)
    throw new Error('คอลัมน์ _record_id ไม่ได้ถูกซ่อน');
  if (
    JSON.stringify(formulaList(checkedSummary)) !==
    JSON.stringify(originalFormulas)
  )
    throw new Error('สูตรในชีตสรุปเปลี่ยนระหว่าง migration');
  if (modelCount(checked.worksheet, 'validation') !== originalValidationCount)
    throw new Error('Data validation เปลี่ยนระหว่าง migration');
  if (modelCount(checked.worksheet, 'formatting') !== originalFormattingCount)
    throw new Error('Conditional formatting เปลี่ยนระหว่าง migration');
  if (
    JSON.stringify(checked.workbook.worksheets.map((sheet) => sheet.name)) !==
    JSON.stringify(originalSheetNames)
  )
    throw new Error('รายชื่อชีตเปลี่ยนระหว่าง migration');

  const backupPath = await createBackup(config.filePath, config.backupDir);
  await fs.rename(config.filePath, rollbackPath);
  try {
    await fs.rename(temporaryPath, config.filePath);
  } catch (error) {
    await fs.rename(rollbackPath, config.filePath);
    throw error;
  }
  await fs.unlink(rollbackPath).catch(() => undefined);
  console.log(
    JSON.stringify({
      migrated: true,
      records: checked.records.length,
      tableRange: checkedTableRef,
      backup: path.basename(backupPath),
    }),
  );
} catch (error) {
  await fs.unlink(temporaryPath).catch(() => undefined);
  await fs
    .access(rollbackPath)
    .then(() => fs.rename(rollbackPath, config.filePath))
    .catch(() => undefined);
  throw error;
}
