import path from "node:path";
import fs from "node:fs";
import { AppError } from "@/lib/api/errors";

export interface ExcelConfig { filePath: string; backupDir: string; appOrigin: string; }

export function getExcelConfig(): ExcelConfig {
  const filePath = process.env.EXCEL_FILE_PATH;
  if (!filePath) throw new AppError("INVALID_WORKBOOK", "ยังไม่ได้ตั้งค่า EXCEL_FILE_PATH", 500, false);
  if (!path.isAbsolute(filePath)) throw new AppError("INVALID_WORKBOOK", "EXCEL_FILE_PATH ต้องเป็น absolute path", 500, false);
  if (path.extname(filePath).toLowerCase() !== ".xlsx") throw new AppError("INVALID_WORKBOOK", "EXCEL_FILE_PATH ต้องชี้ไปยังไฟล์ .xlsx", 500, false);
  if (!fs.existsSync(filePath)) throw new AppError("WORKBOOK_NOT_FOUND", "ไม่พบไฟล์ Excel ที่กำหนด", 404, false);
  return {
    filePath,
    backupDir: process.env.EXCEL_BACKUP_DIR || path.join(path.dirname(filePath), "backups"),
    appOrigin: process.env.APP_ORIGIN || "http://127.0.0.1:3000",
  };
}

export function safeSourceFileName(filePath: string) { return path.basename(filePath); }
