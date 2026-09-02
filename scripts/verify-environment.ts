import fs from "node:fs/promises";
import { getExcelConfig } from "@/lib/excel/config";
import { loadWorkbookState } from "@/lib/excel/reader";

const config = getExcelConfig();
await fs.access(config.filePath);
await fs.mkdir(config.backupDir, { recursive: true });
const state = await loadWorkbookState(config.filePath);
console.log(`พร้อมใช้งาน: ${state.sourceFileName} (${state.records.length} บริษัท)`);
