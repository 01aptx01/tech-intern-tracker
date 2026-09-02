"use client";
import { AlertCircle, CheckCircle2, RefreshCw, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { CompanyDirectory } from "@/components/companies/company-directory";
import { CompanyForm } from "@/components/companies/company-form";
import { ConflictDialog } from "@/components/sync/conflict-dialog";
import { FileLockAlert } from "@/components/sync/file-lock-alert";
import { ClientApiError, createCompany, patchCompany, removeCompany, type CompaniesResponse } from "@/lib/api/client";
import { emptyCompanyInput, recordToInput } from "@/lib/companies/mapper";
import { companiesKey, useCompanies } from "@/hooks/use-companies";
import { useExcelEvents } from "@/hooks/use-excel-events";
import type { CompanyInput, CompanyRecord, UserStatus } from "@/types/company";
import { DashboardHeader } from "./dashboard-header";
import { DeadlinePanel } from "./deadline-panel";
import { KpiGrid } from "./kpi-grid";
import { StatusCharts } from "./status-chart";

type Toast = { message: string; kind: "success" | "error" } | null;
export function DashboardShell({ initialData }: { initialData: CompaniesResponse }) {
  const queryClient = useQueryClient();
  const companies = useCompanies(initialData);
  const [drawer, setDrawer] = useState<CompanyRecord | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [conflictDraft, setConflictDraft] = useState<CompanyInput | null>(null);
  const [draftForRetry, setDraftForRetry] = useState<CompanyInput | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const notify = useCallback((message: string, kind: "error" | "success" = "success") => { setToast({ message, kind }); window.setTimeout(() => setToast(null), 4_000); }, []);
  useExcelEvents(notify);
  const response = companies.data;
  const records = response.data.records;
  const version = response.meta.version;
  const syncStatus = response.data.syncStatus;
  const updateCache = (next: { data: { records: CompanyRecord[]; total: number }; meta: { version: string; lastModifiedAt: string } }) => {
    queryClient.setQueryData<CompaniesResponse>(companiesKey, { data: { records: next.data.records, total: next.data.total, syncStatus: "synced" }, meta: next.meta });
  };
  const handleError = (error: unknown, draft?: CompanyInput) => {
    const api = error instanceof ClientApiError ? error : null;
    if (api?.detail.code === "VERSION_CONFLICT") setConflictDraft(draft ?? emptyCompanyInput());
    if (api?.detail.code === "WORKBOOK_LOCKED") setLocked(true);
    const message = api?.detail.message ?? (error instanceof Error ? error.message : "ดำเนินการไม่สำเร็จ");
    setServerError(message);
    notify(message, "error");
  };
  const submit = async (input: CompanyInput) => {
    setBusy(true); setServerError(null);
    try {
      const next = drawer ? await patchCompany(drawer.id, version, input) : await createCompany(version, input);
      updateCache(next); setDrawer(undefined); setLocked(false); notify("บันทึกลง Excel แล้ว");
    } catch (error) { handleError(error, input); } finally { setBusy(false); }
  };
  const remove = async (confirmationName: string) => {
    if (!drawer) return;
    setBusy(true); setServerError(null);
    try { const next = await removeCompany(drawer.id, version, confirmationName); updateCache(next); setDrawer(undefined); notify("ลบรายการและบันทึก backup แล้ว"); }
    catch (error) { handleError(error, recordToInput(drawer)); } finally { setBusy(false); }
  };
  const quickStatus = async (record: CompanyRecord, status: UserStatus) => {
    try { const next = await patchCompany(record.id, version, { userStatus: status }); updateCache(next); notify("บันทึกสถานะแล้ว"); }
    catch (error) { handleError(error, recordToInput(record)); }
  };
  const retry = () => { if (draftForRetry) void submit(draftForRetry); };
  return <>
    <a href="#company-directory" className="skip-link">ข้ามไปยังรายชื่อบริษัท</a>
    <DashboardHeader status={syncStatus} lastModifiedAt={response.meta.lastModifiedAt} onAdd={() => { const draft = emptyCompanyInput(); setDrawer(null); setDraftForRetry(draft); setServerError(null); }} />
    <main className="app-main"><section className="hero"><div><p className="eyebrow">PERSONAL APPLICATION WORKSPACE</p><h2>วางแผนฝึกงานให้ชัด<br /><span>ก่อนโอกาสจะผ่านไป</span></h2><p>ค้นหา คัดกรอง และติดตามทุกบริษัทจากที่เดียว ข้อมูลทุกการแก้ไขบันทึกกลับ Excel พร้อม backup อัตโนมัติ</p></div><button className="secondary-button" onClick={() => void companies.refetch()} disabled={companies.isFetching}><RefreshCw size={17} className={companies.isFetching ? "spin" : ""} />รีเฟรชข้อมูล</button></section>
      {syncStatus === "error" && <div className="sync-error-banner" role="alert"><AlertCircle size={19} /><span><strong>ใช้ข้อมูลล่าสุดที่อ่านสำเร็จ</strong>{response.data.errorMessage ? ` · ${response.data.errorMessage}` : " Excel รุ่นล่าสุดอ่านไม่สำเร็จ"}</span><button className="secondary-button" onClick={() => void companies.refetch()}>ลองอ่านใหม่</button></div>}
      {locked && <FileLockAlert onRetry={retry} busy={busy} />}
      <KpiGrid records={records} />
      <CompanyDirectory records={records} mutationsDisabled={syncStatus === "error"} onOpen={(record) => { setDrawer(record); setDraftForRetry(recordToInput(record)); setServerError(null); }} onQuickStatus={quickStatus} />
      <div className="insight-grid"><StatusCharts records={records} /><DeadlinePanel records={records} onOpen={(record) => { setDrawer(record); setDraftForRetry(recordToInput(record)); setServerError(null); }} /></div>
    </main>
    {drawer !== undefined && <CompanyForm record={drawer} initialValues={drawer ? recordToInput(drawer) : emptyCompanyInput()} busy={busy} locked={locked} mutationsDisabled={syncStatus === "error"} serverError={serverError} onSubmit={submit} onDelete={remove} onDraftChange={setDraftForRetry} onClose={() => setDrawer(undefined)} />}
    {conflictDraft && <ConflictDialog draft={conflictDraft} onReload={() => { setConflictDraft(null); void companies.refetch(); }} onClose={() => setConflictDraft(null)} />}
    {toast && <div className={`toast toast-${toast.kind}`} aria-live="polite">{toast.kind === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}<span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="ปิดข้อความ"><X size={16} /></button></div>}
  </>;
}
