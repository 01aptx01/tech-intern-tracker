import type ExcelJS from 'exceljs';
import { AppError } from '@/lib/api/errors';
import { allHeaders, HEADER_ROW, RECORD_ID_COLUMN } from './constants';

export const normalizeHeader = (value: unknown) =>
  typeof value === 'string' ? value.normalize('NFKC').trim() : '';

export function validateAndMapHeaders(worksheet: ExcelJS.Worksheet) {
  const seen = new Set<string>();
  const columnMap = new Map<string, number>();
  for (
    let column = 1;
    column <= Math.max(allHeaders.length, worksheet.columnCount);
    column += 1
  ) {
    const actual = normalizeHeader(worksheet.getCell(HEADER_ROW, column).value);
    if (actual) {
      if (seen.has(actual))
        throw new AppError(
          'INVALID_WORKBOOK',
          `พบชื่อ header ซ้ำที่คอลัมน์ ${column}`,
          500,
          false,
        );
      seen.add(actual);
      columnMap.set(actual, column);
    }
  }
  allHeaders.forEach((expected, index) => {
    const normalized = normalizeHeader(expected);
    if (columnMap.get(normalized) !== index + 1)
      throw new AppError(
        'INVALID_WORKBOOK',
        `Header แถว 4 ไม่ตรงกับ schema ที่คอลัมน์ ${index + 1}`,
        500,
        false,
      );
  });
  return {
    columnMap,
    hasRecordIdHeader: columnMap.get('_record_id') === RECORD_ID_COLUMN,
  };
}
