import { AlertCircle, CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";
import type { WorkbookSnapshot } from "@/types/company";

type Props = {
  status: WorkbookSnapshot["syncStatus"];
  lastCheckedAt: string;
  fileModifiedAt: string;
  onSync: () => void;
};

export function SyncIndicator({ status, lastCheckedAt, fileModifiedAt, onSync }: Props) {
  const value = status === "error" ? { icon: AlertCircle, label: "ซิงก์มีปัญหา", className: "sync-error" }
    : status === "locked" ? { icon: LockKeyhole, label: "Excel ถูกล็อก", className: "sync-warn" }
    : status === "reading" || status === "writing" ? { icon: LoaderCircle, label: "กำลังตรวจ Excel", className: "sync-warn" }
    : { icon: CheckCircle2, label: "ซิงก์อัตโนมัติ", className: "sync-ok" };
  const Icon = value.icon;
  const checkedTime = new Date(lastCheckedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  const fileTime = new Date(fileModifiedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
  return <button type="button" className={`sync-pill ${value.className}`} onClick={onSync} disabled={status === "reading" || status === "writing"} aria-label={`${value.label} ตรวจข้อมูลตอนนี้`} title={`คลิกเพื่อตรวจตอนนี้ · ไฟล์ Excel แก้ไขล่าสุด ${fileTime}`}>
    <Icon className={status === "reading" || status === "writing" ? "spin" : undefined} size={15} aria-hidden="true" />
    <span className="sync-label-full" aria-live="polite">{value.label}</span>
    <span className="sync-label-short" aria-hidden="true">ซิงก์</span>
    <span className="sync-time">ตรวจ {checkedTime}</span>
  </button>;
}
