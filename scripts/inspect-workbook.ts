import { getExcelConfig } from "@/lib/excel/config";
import { loadWorkbookState } from "@/lib/excel/reader";

const config = getExcelConfig();
const state = await loadWorkbookState(config.filePath);
console.log(JSON.stringify({
  file: state.sourceFileName,
  version: state.version,
  worksheets: state.workbook.worksheets.map((sheet) => sheet.name),
  records: state.records.length,
  lastDataRow: state.lastDataRow,
  hiddenRecordId: state.worksheet.getColumn(23).hidden,
  needsIdRepair: state.needsIdRepair,
}, null, 2));
