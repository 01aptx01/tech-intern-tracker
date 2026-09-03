'use client';
import { AlertCircle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { CompanyDirectory } from '@/components/companies/company-directory';
import { CompanyForm } from '@/components/companies/company-form';
import { ConflictDialog } from '@/components/sync/conflict-dialog';
import { FileLockAlert } from '@/components/sync/file-lock-alert';
import {
  ClientApiError,
  createCompany,
  patchCompany,
  removeCompany,
  type CompaniesResponse,
} from '@/lib/api/client';
import { emptyCompanyInput, recordToInput } from '@/lib/companies/mapper';
import { companiesKey, useCompanies } from '@/hooks/use-companies';
import { useExcelEvents } from '@/hooks/use-excel-events';
import type { CompanyInput, CompanyRecord, UserStatus } from '@/types/company';
import { DashboardHeader } from './dashboard-header';
import { DeadlinePanel } from './deadline-panel';
import { KpiGrid } from './kpi-grid';
import { StatusCharts } from './status-chart';

type Toast = { message: string; kind: 'success' | 'error' } | null;
export function DashboardShell({
  initialData,
}: {
  initialData: CompaniesResponse;
}) {
  const queryClient = useQueryClient();
  const companies = useCompanies(initialData);
  const [editorRecord, setEditorRecord] = useState<
    CompanyRecord | null | undefined
  >(undefined);
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [conflictDraft, setConflictDraft] = useState<CompanyInput | null>(null);
  const [draftForRetry, setDraftForRetry] = useState<CompanyInput | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const notify = useCallback(
    (message: string, kind: 'error' | 'success' = 'success') => {
      setToast({ message, kind });
    },
    [],
  );
  useExcelEvents(notify);
  const response = companies.data;
  const records = response.data.records;
  const version = response.meta.version;
  const syncStatus = response.data.syncStatus;
  const updateCache = (next: {
    data: { records: CompanyRecord[]; total: number };
    meta: { version: string; lastModifiedAt: string };
  }) => {
    queryClient.setQueryData<CompaniesResponse>(companiesKey, {
      data: {
        records: next.data.records,
        total: next.data.total,
        syncStatus: 'synced',
      },
      meta: next.meta,
    });
  };
  const handleError = (error: unknown, draft?: CompanyInput) => {
    const api = error instanceof ClientApiError ? error : null;
    if (api?.detail.code === 'VERSION_CONFLICT')
      setConflictDraft(draft ?? emptyCompanyInput());
    if (api?.detail.code === 'WORKBOOK_LOCKED') setLocked(true);
    const message =
      api?.detail.message ??
      (error instanceof Error ? error.message : 'ดำเนินการไม่สำเร็จ');
    setServerError(message);
    notify(message, 'error');
  };
  const submit = async (input: CompanyInput) => {
    setBusy(true);
    setServerError(null);
    try {
      const next = editorRecord
        ? await patchCompany(editorRecord.id, version, input)
        : await createCompany(version, input);
      updateCache(next);
      setEditorRecord(undefined);
      setLocked(false);
      notify('บันทึกลง Excel แล้ว');
    } catch (error) {
      handleError(error, input);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (confirmationName: string) => {
    if (!editorRecord) return;
    setBusy(true);
    setServerError(null);
    try {
      const next = await removeCompany(
        editorRecord.id,
        version,
        confirmationName,
      );
      updateCache(next);
      setEditorRecord(undefined);
      notify('ลบรายการและบันทึก backup แล้ว');
    } catch (error) {
      handleError(error, recordToInput(editorRecord));
    } finally {
      setBusy(false);
    }
  };
  const quickStatus = async (record: CompanyRecord, status: UserStatus) => {
    try {
      const next = await patchCompany(record.id, version, {
        userStatus: status,
      });
      updateCache(next);
      notify('บันทึกสถานะแล้ว');
    } catch (error) {
      handleError(error, recordToInput(record));
    }
  };
  const syncNow = async () => {
    const result = await companies.refetch({ cancelRefetch: false });
    if (result.error) {
      handleError(result.error);
      return;
    }
    if (result.data?.data.syncStatus === 'error') {
      const message =
        result.data.data.errorMessage ?? 'ไม่สามารถอ่านไฟล์ Excel รุ่นล่าสุดได้';
      setServerError(message);
      notify(message, 'error');
      return;
    }
    setLocked(false);
    notify('ตรวจและซิงก์ข้อมูลจาก Excel ล่าสุดแล้ว');
  };
  const retry = () => {
    if (draftForRetry) void submit(draftForRetry);
  };
  const effectiveSyncStatus = companies.isFetching ? 'reading' : syncStatus;
  const lastCheckedAt = new Date(companies.dataUpdatedAt).toISOString();
  return (
    <>
      <a href="#company-directory" className="skip-link">
        ข้ามไปยังรายชื่อบริษัท
      </a>
      <DashboardHeader
        status={effectiveSyncStatus}
        lastCheckedAt={lastCheckedAt}
        fileModifiedAt={response.meta.lastModifiedAt}
        onSync={() => void syncNow()}
        onAdd={() => {
          const draft = emptyCompanyInput();
          setEditorRecord(null);
          setDraftForRetry(draft);
          setServerError(null);
        }}
      />
      <main className="app-main">
        <section className="hero">
          <div>
            <p className="eyebrow" lang="en">
              PERSONAL APPLICATION WORKSPACE
            </p>
            <h2>
              วางแผนฝึกงานให้ชัด
              <br />
              <span>ก่อนโอกาสจะผ่านไป</span>
            </h2>
            <p>
              ค้นหา คัดกรอง และติดตามทุกบริษัทจากที่เดียว ข้อมูลทุกการแก้ไขบันทึกกลับ Excel พร้อม
              backup อัตโนมัติ
            </p>
          </div>
          <button
            className="secondary-button"
            onClick={() => void syncNow()}
            disabled={companies.isFetching}
          >
            <RefreshCw
              size={17}
              className={companies.isFetching ? 'spin' : ''}
            />
            ซิงก์ตอนนี้
          </button>
        </section>
        {syncStatus === 'error' && (
          <div className="sync-error-banner" role="alert">
            <AlertCircle size={19} />
            <span>
              <strong>ใช้ข้อมูลล่าสุดที่อ่านสำเร็จ</strong>
              {response.data.errorMessage
                ? ` · ${response.data.errorMessage}`
                : ' Excel รุ่นล่าสุดอ่านไม่สำเร็จ'}
            </span>
            <button className="secondary-button" onClick={() => void syncNow()}>
              ลองอ่านใหม่
            </button>
          </div>
        )}
        {locked && <FileLockAlert onRetry={retry} busy={busy} />}
        <KpiGrid records={records} />
        <CompanyDirectory
          records={records}
          mutationsDisabled={syncStatus === 'error'}
          onOpen={(record) => {
            setEditorRecord(record);
            setDraftForRetry(recordToInput(record));
            setServerError(null);
          }}
          onQuickStatus={quickStatus}
        />
        <div className="insight-grid">
          <StatusCharts records={records} />
          <DeadlinePanel
            records={records}
            onOpen={(record) => {
              setEditorRecord(record);
              setDraftForRetry(recordToInput(record));
              setServerError(null);
            }}
          />
        </div>
      </main>
      {editorRecord !== undefined && (
        <CompanyForm
          record={editorRecord}
          initialValues={
            editorRecord ? recordToInput(editorRecord) : emptyCompanyInput()
          }
          busy={busy}
          locked={locked}
          mutationsDisabled={syncStatus === 'error'}
          serverError={serverError}
          onSubmit={submit}
          onDelete={remove}
          onDraftChange={setDraftForRetry}
          onClose={() => setEditorRecord(undefined)}
        />
      )}
      {conflictDraft && (
        <ConflictDialog
          draft={conflictDraft}
          onReload={() => {
            setConflictDraft(null);
            void companies.refetch();
          }}
          onClose={() => setConflictDraft(null)}
        />
      )}
      {toast && (
        <output
          className={`toast toast-${toast.kind}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {toast.kind === 'success' ? (
            <CheckCircle2 size={18} aria-hidden="true" />
          ) : (
            <AlertCircle size={18} aria-hidden="true" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} aria-label="ปิดข้อความ">
            <X size={16} aria-hidden="true" />
          </button>
        </output>
      )}
    </>
  );
}
