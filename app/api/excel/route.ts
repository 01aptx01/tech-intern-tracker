import { fail } from "@/lib/api/response";
import { downloadWorkbook, getSnapshot } from "@/lib/excel/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [bytes, snapshot] = await Promise.all([downloadWorkbook(), getSnapshot()]);
    return new Response(bytes as BodyInit, { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(snapshot.sourceFileName)}`,
      "Cache-Control": "no-store",
    } });
  } catch (error) { return fail(error); }
}
