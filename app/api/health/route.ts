import { NextResponse } from "next/server";
import { getExcelConfig } from "@/lib/excel/config";
import { isWorkbookLocked } from "@/lib/excel/lock";
import { getSnapshot } from "@/lib/excel/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = getExcelConfig();
    const [snapshot, locked] = await Promise.all([getSnapshot({ fresh: true }), isWorkbookLocked(config.filePath)]);
    return NextResponse.json({ status: snapshot.syncStatus === "error" ? "degraded" : "ok", workbookReadable: true, workbookLocked: locked, version: snapshot.version }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "degraded", workbookReadable: false, workbookLocked: false, version: null }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
