import { NextResponse } from "next/server";
import { createCompanySchema } from "@/lib/companies/schema";
import { createCompany, getSnapshot } from "@/lib/excel/repository";
import { isValidMutationRequest } from "@/lib/api/origin-guard";
import { fail, ok, validationFailure } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getSnapshot({ fresh: true });
    return ok({ records: snapshot.records, total: snapshot.total, syncStatus: snapshot.syncStatus, errorMessage: snapshot.errorMessage }, snapshot);
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    if (!isValidMutationRequest(request)) return NextResponse.json({ error: { code: "INVALID_ORIGIN", message: "คำขอนี้ไม่ได้มาจากแอปในเครื่อง", retryable: false } }, { status: 403 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: { code: "BAD_REQUEST", message: "JSON ไม่ถูกต้อง", retryable: false } }, { status: 400 }); }
    const parsed = createCompanySchema.safeParse(body);
    if (!parsed.success) return validationFailure(parsed.error);
    const snapshot = await createCompany(parsed.data.baseVersion, parsed.data.record);
    return ok({ record: snapshot.records.at(-1), records: snapshot.records, total: snapshot.total }, snapshot);
  } catch (error) { return fail(error); }
}
