import { NextResponse } from "next/server";
import { deleteCompanySchema, patchCompanySchema } from "@/lib/companies/schema";
import { deleteCompany, updateCompany } from "@/lib/excel/repository";
import { isValidMutationRequest } from "@/lib/api/origin-guard";
import { fail, ok, validationFailure } from "@/lib/api/response";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

function invalidOrigin() {
  return NextResponse.json({ error: { code: "INVALID_ORIGIN", message: "คำขอนี้ไม่ได้มาจากแอปในเครื่อง", retryable: false } }, { status: 403 });
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    if (!isValidMutationRequest(request)) return invalidOrigin();
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: { code: "BAD_REQUEST", message: "JSON ไม่ถูกต้อง", retryable: false } }, { status: 400 }); }
    const parsed = patchCompanySchema.safeParse(body);
    if (!parsed.success) return validationFailure(parsed.error);
    const { id } = await params;
    const snapshot = await updateCompany(id, parsed.data.baseVersion, parsed.data.changes);
    return ok({ record: snapshot.records.find((record) => record.id === id), records: snapshot.records, total: snapshot.total }, snapshot);
  } catch (error) { return fail(error); }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    if (!isValidMutationRequest(request)) return invalidOrigin();
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: { code: "BAD_REQUEST", message: "JSON ไม่ถูกต้อง", retryable: false } }, { status: 400 }); }
    const parsed = deleteCompanySchema.safeParse(body);
    if (!parsed.success) return validationFailure(parsed.error);
    const { id } = await params;
    const snapshot = await deleteCompany(id, parsed.data.baseVersion, parsed.data.confirmationName);
    return ok({ records: snapshot.records, total: snapshot.total }, snapshot);
  } catch (error) { return fail(error); }
}
