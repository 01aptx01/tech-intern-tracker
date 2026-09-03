'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, Save, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { useDocumentScrollLock } from '@/hooks/use-document-scroll-lock';
import { companyInputSchema } from '@/lib/companies/schema';
import { splitTags } from '@/lib/companies/normalize';
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
}: Props) {
  const errorRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDialogElement>(null);
  useDocumentScrollLock();
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
    if (!busy && (!isDirty || window.confirm('ละทิ้งข้อมูลที่แก้ไขหรือไม่?'))) onClose();
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
    dialog
      .querySelector<HTMLElement>(
        '.editor-scroll input, .editor-scroll select, .editor-scroll textarea',
      )
      ?.focus();
    return () => {
      if (dialog.open) dialog.close();
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, []);
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
      <header className="editor-header">
        <div>
          <p className="eyebrow" lang="en">
            EXCEL RECORD
          </p>
          <h2 id="company-form-title">
            {record ? `แก้ไข ${record.companyName}` : 'เพิ่มบริษัทใหม่'}
          </h2>
        </div>
        <button className="icon-button" onClick={attemptClose} aria-label="ปิด">
          <X size={19} />
        </button>
      </header>
      <form
        onSubmit={(event) => {
          if (record && !isDirty) {
            event.preventDefault();
            onClose();
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
                {textField('companyName', 'ชื่อบริษัท', { required: true })}
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
              {textField('applicationDeadline', 'วันปิดรับ', { type: 'date' })}
              <div className="span-2">
                {textField('applicationWindow', 'ช่วงเปิดรับ / Deadline')}
              </div>
              <div className="span-2">
                {textField('internshipPeriod', 'ช่วงฝึกงาน / สหกิจ')}
              </div>
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
                {textField('contact', 'ข้อมูลติดต่อ HR / บริษัท', { area: true })}
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
                {textField('personalNotes', 'หมายเหตุส่วนตัว', { area: true })}
              </div>
            </div>
          </fieldset>
          {record?.applicationUrl && (
            <a
              className="source-link"
              href={record.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} />
              เปิดหน้าสมัครอย่างเป็นทางการ
            </a>
          )}
          {record && (
            <div className="delete-zone">
              {deleteMode ? (
                <>
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
            onClick={attemptClose}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={busy || mutationsDisabled}
          >
            <Save size={17} />
            {busy ? 'กำลังบันทึก…' : locked ? 'ลองบันทึกอีกครั้ง' : 'บันทึกลง Excel'}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
