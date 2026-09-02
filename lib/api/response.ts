import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { AppError, toAppError } from "./errors";

const noStore = { "Cache-Control": "no-store" };

export const ok = <T>(data: T, snapshot: { version: string; lastModifiedAt: string }) => NextResponse.json(
  { data, meta: { version: snapshot.version, lastModifiedAt: snapshot.lastModifiedAt } },
  { headers: noStore },
);

export function validationFailure(error: ZodError) {
  const flattened = error.flatten();
  return NextResponse.json({ error: {
    code: "VALIDATION_ERROR",
    message: "กรุณาตรวจสอบข้อมูลที่กรอก",
    retryable: false,
    fieldErrors: flattened.fieldErrors,
  } }, { status: 422, headers: noStore });
}

export function fail(error: unknown) {
  const appError = error instanceof AppError ? error : toAppError(error);
  return NextResponse.json({ error: {
    code: appError.code,
    message: appError.message,
    retryable: appError.retryable,
    operationId: appError.operationId,
    fieldErrors: appError.fieldErrors,
  } }, { status: appError.status, headers: noStore });
}
