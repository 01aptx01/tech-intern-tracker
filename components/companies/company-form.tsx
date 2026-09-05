'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Info,
  Laptop,
  Mail,
  MapPin,
  Pencil,
  Save,
  ShieldCheck,
  Tag,
  Trash2,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { StatusBadge } from '@/components/companies/status-badge';
import { useDocumentScrollLock } from '@/hooks/use-document-scroll-lock';
import { daysUntil } from '@/lib/companies/analytics';
import { splitTags } from '@/lib/companies/normalize';
import { companyInputSchema } from '@/lib/companies/schema';
import {
  announcementStatuses,
  evidenceLevels,
  userStatusValues,
  type CompanyInput,
  type CompanyRecord,
} from '@/types/company';

type Props = {
  record: CompanyRecord | null;
  initialValues: CompanyInput;
  busy: boolean;
  serverError: string | null;
  locked: boolean;
  mutationsDisabled: boolean;
  onSubmit: (value: CompanyInput) => Promise<void>;
  onDelete: (confirmationName: string) => Promise<void>;
  onDraftChange: (value: CompanyInput) => void;
  onClose: () => void;
  initialMode?: 'view' | 'edit';
};

const asInput = (value: string | null) => value ?? '';

export function CompanyForm({
  record,
  initialValues,
  busy,
  serverError,
  locked,
  mutationsDisabled,
  onSubmit,
  onDelete,
  onDraftChange,
  onClose,
  initialMode,
}: Props) {
  const errorRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDialogElement>(null);
  useDocumentScrollLock();

  const [mode, setMode] = useState<'view' | 'edit'>(() => {
    if (initialMode) return initialMode;
    return record ? 'view' : 'edit';
  });
  const [deleteMode, setDeleteMode] = useState(false);
  const [confirmationName, setConfirmationName] = useState('');

  type FormInput = z.input<typeof companyInputSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<FormInput, unknown, CompanyInput>({
    resolver: zodResolver(companyInputSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  const attemptClose = () => {
    if (
      !busy &&
      (!isDirty || mode === 'view' || window.confirm('ละทิ้งข้อมูลที่แก้ไขหรือไม่?'))
    ) {
      onClose();
    }
  };

  useEffect(() => {
    if (serverError) errorRef.current?.focus();
  }, [serverError]);

  useEffect(() => {
    const subscription = watch((value) => onDraftChange(value as CompanyInput));
    return () => subscription.unsubscribe();
  }, [onDraftChange, watch]);

  useEffect(() => {
    const dialog = editorRef.current;
    const returnFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();

    if (mode === 'edit') {
      dialog
        .querySelector<HTMLElement>(
          '.editor-scroll input, .editor-scroll select, .editor-scroll textarea',
        )
        ?.focus();
    } else {
      dialog
        .querySelector<HTMLElement>(
          'button.detail-primary-edit, .editor-header button',
        )
        ?.focus();
    }

    return () => {
      if (dialog.open) dialog.close();
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [mode]);

  const textField = (
    name: keyof CompanyInput,
    label: string,
    options?: {
      area?: boolean;
      type?: string;
      required?: boolean;
      placeholder?: string;
    },
  ) => {
    const fieldError = errors[name]?.message;
    const Input = options?.area ? 'textarea' : 'input';
    return (
      <label className="form-field">
        <span>
          {label}
          {options?.required && (
            <>
              <b aria-hidden="true"> *</b>
              <span className="sr-only"> จำเป็น</span>
            </>
          )}
        </span>
        <Input
          {...register(name)}
          type={options?.type}
          placeholder={options?.placeholder}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? `${name}-error` : undefined}
          className={
            options?.area ? 'form-control form-textarea' : 'form-control'
          }
          defaultValue={asInput(initialValues[name] as string | null)}
          required={options?.required}
        />
        {fieldError && (
          <small id={`${name}-error`} className="field-error">
            {String(fieldError)}
          </small>
        )}
      </label>
    );
  };

  const techRoles = watch('techRoles');
  const programTypes = watch('programTypes');
  const openPrograms = watch('openPrograms');

  // Days until deadline calculation
  const deadlineDays = record ? daysUntil(record.applicationDeadline) : null;

  return (
    <dialog
      ref={editorRef}
      className="company-editor"
      aria-modal="true"
      aria-labelledby="company-form-title"
      onCancel={(event) => {
        event.preventDefault();
        attemptClose();
      }}
    >
      {/* HEADER */}
      <header className="editor-header">
        <div className="editor-header-title-group">
          <p className="eyebrow" lang="en">
            {mode === 'view'
              ? `EXCEL RECORD · ลำดับ ${record?.order ?? '—'}`
              : record
                ? `EXCEL RECORD · แก้ไขข้อมูล`
                : 'EXCEL RECORD · บริษัทใหม่'}
          </p>
          <h2 id="company-form-title">
            {mode === 'view'
              ? record?.companyName
              : record
                ? `แก้ไข ${record.companyName}`
                : 'เพิ่มบริษัทใหม่'}
          </h2>
          {mode === 'view' && record?.fullCompanyName && (
            <p className="editor-subtitle">{record.fullCompanyName}</p>
          )}
        </div>

        <div className="editor-header-actions">
          {mode === 'view' && record && (
            <>
              {record.applicationUrl && (
                <a
                  className="secondary-button header-action-btn"
                  href={record.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="เปิดหน้าสมัครงาน"
                >
                  <ExternalLink size={15} />
                  <span className="btn-label">เปิดหน้าสมัคร</span>
                </a>
              )}
              <button
                type="button"
                className="primary-button header-action-btn detail-primary-edit"
                onClick={() => setMode('edit')}
                aria-label="แก้ไขข้อมูล"
              >
                <Pencil size={15} />
                <span>แก้ไขข้อมูล</span>
              </button>
            </>
          )}

          {mode === 'edit' && record && (
            <button
              type="button"
              className="secondary-button header-action-btn"
              onClick={() => {
                if (
                  !isDirty ||
                  window.confirm('ละทิ้งข้อมูลที่แก้ไขและกลับหน้าดูข้อมูลหรือไม่?')
                ) {
                  setMode('view');
                }
              }}
              aria-label="กลับหน้าดูข้อมูล"
            >
              <ArrowLeft size={15} />
              <span>ดูข้อมูล</span>
            </button>
          )}

          <button
            className="icon-button close-dialog-btn"
            onClick={attemptClose}
            aria-label="ปิด"
          >
            <X size={19} />
          </button>
        </div>
      </header>

      {/* ======================= READ-ONLY VIEW MODE ======================= */}
      {mode === 'view' && record && (
        <div className="detail-view-container">
          <div className="detail-scroll">
            {/* Quick Status Bar */}
            <div className="detail-status-bar">
              <StatusBadge status={record.announcementStatus} />

              <span
                className={`detail-badge user-status-badge ${
                  record.userStatus
                    ? `status-user-${record.userStatus}`
                    : 'status-user-empty'
                }`}
              >
                <UserCheck size={14} />
                <span>สถานะ: {record.userStatus || 'ยังไม่ระบุ'}</span>
              </span>

              <span className="detail-badge evidence-badge">
                <ShieldCheck size={14} />
                <span>หลักฐานระดับ {record.evidenceLevel}</span>
              </span>

              {record.workMode && (
                <span className="detail-badge workmode-badge">
                  <Laptop size={14} />
                  <span>{record.workMode}</span>
                </span>
              )}

              {record.thailandLocation && (
                <span className="detail-badge location-badge">
                  <MapPin size={14} />
                  <span>{record.thailandLocation}</span>
                </span>
              )}
            </div>

            {/* SECTION 1: Opportunities & Deadlines */}
            <section className="detail-card">
              <div className="detail-card-header">
                <div className="card-icon-wrap icon-primary">
                  <CalendarClock size={18} />
                </div>
                <div>
                  <p className="card-eyebrow">OPPORTUNITY & TIMELINE</p>
                  <h3>โอกาสฝึกงานและกำหนดการ</h3>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-item highlight-deadline">
                  <span className="item-label">
                    <Calendar size={14} /> วันปิดรับสมัคร (Deadline)
                  </span>
                  <div className="deadline-val-wrap">
                    <span className="item-value-strong">
                      {record.applicationDeadline || 'ไม่ระบุวันปิดรับชัดเจน'}
                    </span>
                    {deadlineDays !== null && (
                      <span
                        className={`deadline-countdown-chip ${
                          deadlineDays < 0
                            ? 'chip-overdue'
                            : deadlineDays <= 14
                              ? 'chip-urgent'
                              : 'chip-normal'
                        }`}
                      >
                        {deadlineDays < 0
                          ? `เลยกำหนด ${Math.abs(deadlineDays)} วัน`
                          : deadlineDays === 0
                            ? 'ปิดรับวันนี้!'
                            : `เหลืออีก ${deadlineDays} วัน`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="detail-item">
                  <span className="item-label">
                    <Clock size={14} /> ช่วงเปิดรับสมัคร
                  </span>
                  <span className="item-value">
                    {record.applicationWindow || '—'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="item-label">
                    <Briefcase size={14} /> ช่วงเวลาฝึกงาน / สหกิจ
                  </span>
                  <span className="item-value">
                    {record.internshipPeriod || '—'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="item-label">
                    <Tag size={14} /> ประเภทโปรแกรม
                  </span>
                  <div className="tag-pills-wrap">
                    {record.programTypes.length > 0 ? (
                      record.programTypes.map((type) => (
                        <span key={type} className="detail-pill program-pill">
                          {type}
                        </span>
                      ))
                    ) : (
                      <span className="empty-dash">—</span>
                    )}
                  </div>
                </div>

                <div className="detail-item full-width">
                  <span className="item-label">
                    <Building2 size={14} /> โครงการที่เปิดรับ
                  </span>
                  <div className="tag-pills-wrap">
                    {record.openPrograms.length > 0 ? (
                      record.openPrograms.map((prog) => (
                        <span key={prog} className="detail-pill openprog-pill">
                          {prog}
                        </span>
                      ))
                    ) : (
                      <span className="empty-dash">ไม่ระบุโครงการเฉพาะ</span>
                    )}
                  </div>
                </div>

                <div className="detail-item full-width">
                  <span className="item-label">
                    <Laptop size={14} /> สายงาน Tech ที่เกี่ยวข้อง
                  </span>
                  <div className="tag-pills-wrap">
                    {record.techRoles.length > 0 ? (
                      record.techRoles.map((role) => (
                        <span key={role} className="detail-pill tech-pill">
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="empty-dash">ไม่ระบุสายงาน</span>
                    )}
                  </div>
                </div>

                {record.qualificationsNotes && (
                  <div className="detail-item full-width">
                    <span className="item-label">
                      <Info size={14} /> คุณสมบัติและข้อกำหนด
                    </span>
                    <div className="detail-notes-box">
                      {record.qualificationsNotes}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* SECTION 2: Company & Organization Details */}
            <section className="detail-card">
              <div className="detail-card-header">
                <div className="card-icon-wrap icon-info">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="card-eyebrow">COMPANY PROFILE</p>
                  <h3>ข้อมูลองค์กรและการติดต่อ</h3>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="item-label">ธุรกิจ / อุตสาหกรรม</span>
                  <span className="item-value">{record.business || '—'}</span>
                </div>

                <div className="detail-item">
                  <span className="item-label">
                    <MapPin size={14} /> สถานที่ตั้ง / ทำงานในไทย
                  </span>
                  <span className="item-value">
                    {record.thailandLocation || '—'}
                  </span>
                </div>

                <div className="detail-item full-width">
                  <span className="item-label">
                    <Mail size={14} /> ข้อมูลติดต่อ HR / บริษัท
                  </span>
                  <div className="contact-display-box">
                    {record.contact || 'ไม่มีข้อมูลติดต่อระบุไว้'}
                  </div>
                </div>

                {record.applicationUrl && (
                  <div className="detail-item full-width">
                    <span className="item-label">
                      <ExternalLink size={14} /> ลิงก์รับสมัครงานหลัก
                    </span>
                    <a
                      href={record.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-button"
                    >
                      <span>{record.applicationUrl}</span>
                      <ArrowUpRight size={15} />
                    </a>
                  </div>
                )}

                {(record.primarySourceUrl || record.secondarySourceUrl) && (
                  <div className="detail-item full-width">
                    <span className="item-label">
                      <Globe size={14} /> แหล่งข้อมูลอ้างอิง
                    </span>
                    <div className="sources-list">
                      {record.primarySourceUrl && (
                        <a
                          href={record.primarySourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="source-chip"
                        >
                          <span className="source-tag">หลัก</span>
                          <span className="source-url">
                            {record.primarySourceUrl}
                          </span>
                          <ArrowUpRight size={13} />
                        </a>
                      )}
                      {record.secondarySourceUrl && (
                        <a
                          href={record.secondarySourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="source-chip"
                        >
                          <span className="source-tag">เสริม</span>
                          <span className="source-url">
                            {record.secondarySourceUrl}
                          </span>
                          <ArrowUpRight size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="detail-item">
                  <span className="item-label">ตรวจสอบข้อมูลล่าสุด</span>
                  <span className="item-value muted-val">
                    {record.verifiedAt || '—'}
                  </span>
                </div>
              </div>
            </section>

            {/* SECTION 3: Personal Application Tracker */}
            <section className="detail-card tracking-card">
              <div className="detail-card-header">
                <div className="card-icon-wrap icon-warning">
                  <User size={18} />
                </div>
                <div>
                  <p className="card-eyebrow">PERSONAL TRACKING</p>
                  <h3>การติดตามการสมัครส่วนตัว</h3>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="item-label">สถานะการสมัครของคุณ</span>
                  <span className="item-value-highlight">
                    {record.userStatus || 'ยังไม่ได้ระบุสถานะ'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="item-label">
                    <Calendar size={14} /> วันที่ติดต่อ / ยื่นสมัคร
                  </span>
                  <span className="item-value">
                    {record.contactedAt || '—'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="item-label">
                    <CalendarClock size={14} /> กำหนดติดตามครั้งถัดไป
                  </span>
                  <span className="item-value">
                    {record.followUpAt || '—'}
                  </span>
                </div>

                <div className="detail-item full-width">
                  <span className="item-label">
                    <FileText size={14} /> บันทึกส่วนตัว (Personal Notes)
                  </span>
                  <div className="personal-notes-display">
                    {record.personalNotes || (
                      <span className="empty-notes-hint">
                        ยังไม่มีบันทึกส่วนตัว — กดปุ่ม &quot;แก้ไขข้อมูล&quot;
                        ด้านบนหรือล่างเพื่อเพิ่มบันทึกช่วยจำ
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Delete Zone */}
            <div className="detail-delete-area">
              {deleteMode ? (
                <div className="delete-zone">
                  <label className="form-field">
                    <span>
                      พิมพ์ <strong>{record.companyName}</strong> เพื่อยืนยันการลบ
                    </span>
                    <input
                      className="form-control"
                      value={confirmationName}
                      onChange={(event) =>
                        setConfirmationName(event.target.value)
                      }
                      autoComplete="off"
                    />
                  </label>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="danger-button"
                      disabled={
                        busy ||
                        mutationsDisabled ||
                        confirmationName !== record.companyName
                      }
                      onClick={() => void onDelete(confirmationName)}
                    >
                      ลบถาวร
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setDeleteMode(false)}
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="danger-ghost"
                  onClick={() => setDeleteMode(true)}
                >
                  <Trash2 size={16} />
                  ลบรายการนี้
                </button>
              )}
            </div>
          </div>

          {/* Footer in View Mode */}
          <footer className="editor-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={attemptClose}
            >
              ปิด
            </button>
            <button
              type="button"
              className="primary-button detail-primary-edit"
              onClick={() => setMode('edit')}
            >
              <Pencil size={16} />
              แก้ไขข้อมูล
            </button>
          </footer>
        </div>
      )}

      {/* ======================= EDIT / CREATE FORM MODE ======================= */}
      {mode === 'edit' && (
        <form
          onSubmit={(event) => {
            if (record && !isDirty) {
              event.preventDefault();
              setMode('view');
              return;
            }
            void handleSubmit(onSubmit)(event);
          }}
          className="editor-form"
        >
          <div className="editor-scroll">
            {serverError && (
              <div
                ref={errorRef}
                tabIndex={-1}
                className="form-error-summary"
                role="alert"
              >
                {serverError}
              </div>
            )}

            <fieldset>
              <legend>ข้อมูลบริษัท</legend>
              <div className="form-grid">
                <div className="span-2">
                  {textField('companyName', 'ชื่อที่รู้จัก', {
                    required: true,
                  })}
                </div>
                <div className="span-2">
                  {textField('fullCompanyName', 'ชื่อเต็ม / ชื่อจดทะเบียน')}
                </div>
                {textField('business', 'ธุรกิจ')}
                {textField('thailandLocation', 'ที่ตั้ง/สถานที่ฝึกในไทย')}
                <label className="form-field span-2">
                  <span>
                    สาย Tech ที่เกี่ยวข้อง <small>คั่นด้วย ;</small>
                  </span>
                  <input
                    className="form-control"
                    value={techRoles.join('; ')}
                    onChange={(event) =>
                      setValue('techRoles', splitTags(event.target.value), {
                        shouldDirty: true,
                      })
                    }
                  />
                </label>
                {textField('workMode', 'รูปแบบทำงาน')}
              </div>
            </fieldset>

            <fieldset>
              <legend>โอกาสฝึกงาน</legend>
              <div className="form-grid">
                <label className="form-field">
                  <span>
                    สถานะประกาศ <b aria-hidden="true">*</b>
                    <span className="sr-only"> จำเป็น</span>
                  </span>
                  <select
                    className="form-control"
                    required
                    {...register('announcementStatus')}
                  >
                    {announcementStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
                {textField('applicationDeadline', 'วันปิดรับ', {
                  type: 'date',
                })}
                <div className="span-2">
                  {textField('applicationWindow', 'ช่วงเปิดรับ / Deadline')}
                </div>
                <div className="span-2">
                  {textField('internshipPeriod', 'ช่วงฝึกงาน / สหกิจ')}
                </div>
                <label className="form-field span-2">
                  <span>
                    โครงการที่เปิดรับ <small>คั่นด้วย ;</small>
                  </span>
                  <input
                    className="form-control"
                    value={openPrograms.join('; ')}
                    onChange={(event) =>
                      setValue('openPrograms', splitTags(event.target.value), {
                        shouldDirty: true,
                      })
                    }
                    placeholder="เช่น Tech Internship 2027; Young Talent Program"
                  />
                </label>
                <label className="form-field span-2">
                  <span>
                    ประเภทโปรแกรม <small>คั่นด้วย ;</small>
                  </span>
                  <input
                    className="form-control"
                    value={programTypes.join('; ')}
                    onChange={(event) =>
                      setValue('programTypes', splitTags(event.target.value), {
                        shouldDirty: true,
                      })
                    }
                  />
                </label>
                <div className="span-2">
                  {textField('qualificationsNotes', 'คุณสมบัติ / หมายเหตุ', {
                    area: true,
                  })}
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend>ติดต่อและแหล่งข้อมูล</legend>
              <div className="form-grid">
                <div className="span-2">
                  {textField('contact', 'ข้อมูลติดต่อ HR / บริษัท', {
                    area: true,
                  })}
                </div>
                <div className="span-2">
                  {textField('applicationUrl', 'ลิงก์สมัคร / Careers', {
                    type: 'url',
                    placeholder: 'https://',
                  })}
                </div>
                <div className="span-2">
                  {textField('primarySourceUrl', 'แหล่งอ้างอิงหลัก', {
                    type: 'url',
                    placeholder: 'https://',
                  })}
                </div>
                <div className="span-2">
                  {textField('secondarySourceUrl', 'แหล่งอ้างอิงเสริม', {
                    type: 'url',
                    placeholder: 'https://',
                  })}
                </div>
                {textField('verifiedAt', 'ตรวจสอบล่าสุด', { type: 'date' })}
                <label className="form-field">
                  <span>
                    ระดับหลักฐาน <b aria-hidden="true">*</b>
                    <span className="sr-only"> จำเป็น</span>
                  </span>
                  <select
                    className="form-control"
                    required
                    {...register('evidenceLevel')}
                  >
                    {evidenceLevels.map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>การติดตามส่วนตัว</legend>
              <div className="form-grid">
                <label className="form-field">
                  <span>สถานะของคุณ</span>
                  <select
                    className="form-control"
                    {...register('userStatus', {
                      setValueAs: (value) => value || null,
                    })}
                  >
                    <option value="">ยังไม่ระบุ</option>
                    {userStatusValues.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
                {textField('contactedAt', 'วันที่ติดต่อ', { type: 'date' })}
                {textField('followUpAt', 'ติดตามครั้งถัดไป', { type: 'date' })}
                <div className="span-2">
                  {textField('personalNotes', 'หมายเหตุส่วนตัว', {
                    area: true,
                  })}
                </div>
              </div>
            </fieldset>

            {record && (
              <div className="delete-zone">
                {deleteMode ? (
                  <>
                    <label className="form-field">
                      <span>
                        พิมพ์ <strong>{record.companyName}</strong>{' '}
                        เพื่อยืนยันการลบ
                      </span>
                      <input
                        className="form-control"
                        value={confirmationName}
                        onChange={(event) =>
                          setConfirmationName(event.target.value)
                        }
                        autoComplete="off"
                      />
                    </label>
                    <div className="inline-actions">
                      <button
                        type="button"
                        className="danger-button"
                        disabled={
                          busy ||
                          mutationsDisabled ||
                          confirmationName !== record.companyName
                        }
                        onClick={() => void onDelete(confirmationName)}
                      >
                        ลบถาวร
                      </button>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => setDeleteMode(false)}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    className="danger-ghost"
                    onClick={() => setDeleteMode(true)}
                  >
                    <Trash2 size={16} />
                    ลบรายการนี้
                  </button>
                )}
              </div>
            )}
          </div>

          <footer className="editor-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                if (record) {
                  if (
                    !isDirty ||
                    window.confirm('ละทิ้งข้อมูลที่แก้ไขและกลับหน้าดูข้อมูลหรือไม่?')
                  ) {
                    setMode('view');
                  }
                } else {
                  attemptClose();
                }
              }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={busy || mutationsDisabled}
            >
              <Save size={17} />
              {busy
                ? 'กำลังบันทึก…'
                : locked
                  ? 'ลองบันทึกอีกครั้ง'
                  : 'บันทึกลง Excel'}
            </button>
          </footer>
        </form>
      )}
    </dialog>
  );
}
