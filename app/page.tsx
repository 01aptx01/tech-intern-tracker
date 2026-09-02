import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSnapshot } from "@/lib/excel/repository";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const snapshot = await getSnapshot();
  return <DashboardShell initialData={{
    data: { records: snapshot.records, total: snapshot.total, syncStatus: snapshot.syncStatus, errorMessage: snapshot.errorMessage },
    meta: { version: snapshot.version, lastModifiedAt: snapshot.lastModifiedAt },
  }} />;
}
