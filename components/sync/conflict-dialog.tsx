'use client';
import { AlertTriangle, Clipboard, RefreshCw, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useDocumentScrollLock } from '@/hooks/use-document-scroll-lock';

export function ConflictDialog({
  draft,
  onReload,
  onClose,
}: {
  draft: unknown;
  onReload: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  useDocumentScrollLock();
  useEffect(() => {
    const dialog = dialogRef.current;
    const returnFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    primaryActionRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="dialog-card"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="conflict-title"
      aria-describedby="conflict-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <span className="dialog-icon">
        <AlertTriangle aria-hidden="true" />
      </span>
      <h2 id="conflict-title">ไฟล์ Excel มีการเปลี่ยนแปลง</h2>
      <p id="conflict-description">
        ข้อมูลถูกแก้หลังจากที่หน้านี้โหลด ระบบจึงหยุดเพื่อไม่ให้เขียนทับข้อมูลล่าสุด
      </p>
      <div className="dialog-actions">
        <button
          ref={primaryActionRef}
          className="primary-button"
          onClick={onReload}
        >
          <RefreshCw size={17} aria-hidden="true" />
          โหลดข้อมูลล่าสุด
        </button>
        <button
          className="secondary-button"
          onClick={() =>
            void navigator.clipboard.writeText(JSON.stringify(draft, null, 2))
          }
        >
          <Clipboard size={17} aria-hidden="true" />
          คัดลอกข้อมูลที่กรอก
        </button>
        <button className="text-button" onClick={onClose}>
          <X size={17} aria-hidden="true" />
          ยกเลิก
        </button>
      </div>
    </dialog>
  );
}
