import { randomUUID } from "node:crypto";

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 500,
    public retryable = status >= 500 || status === 409 || status === 423,
    public operationId = randomUUID(),
    public fieldErrors?: Record<string, string[]>,
  ) { super(message); this.name = "AppError"; }
}

export function toAppError(error: unknown, fallbackCode = "INVALID_WORKBOOK") {
  if (error instanceof AppError) return error;
  const candidate = error as { code?: string; status?: number; message?: string };
  if (candidate?.code === "ENOENT") return new AppError("WORKBOOK_NOT_FOUND", "ไม่พบไฟล์ Excel ที่กำหนด", 404, false);
  if (candidate?.code === "EACCES" || candidate?.code === "EPERM") return new AppError("WORKBOOK_LOCKED", "Excel กำลังใช้งานไฟล์นี้อยู่ กรุณาบันทึกและปิดไฟล์ก่อนลองอีกครั้ง", 423, true);
  return new AppError(fallbackCode, candidate?.message || "เกิดข้อผิดพลาดที่ไม่คาดคิด", candidate?.status || 500);
}
