import { AlertCircle, CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";
import type { WorkbookSnapshot } from "@/types/company";

export function SyncIndicator({ status, lastModifiedAt }: { status: WorkbookSnapshot["syncStatus"]; lastModifiedAt: string }) {
  const value = status === "error" ? { icon: AlertCircle, label: "ซิงก์มีปัญหา", className: "sync-error" }
    : status === "locked" ? { icon: LockKeyhole, label: "Excel ถูกล็อก", className: "sync-warn" }
    : status === "reading" || status === "writing" ? { icon: LoaderCircle, label: "กำลังซิงก์", className: "sync-warn" }
    : { icon: CheckCircle2, label: "ซิงก์แล้ว", className: "sync-ok" };
  const Icon = value.icon;
  return <span className={`sync-pill ${value.className}`} role="status"><Icon size={15} aria-hidden="true" /><span>{value.label}</span><time className="sync-time" dateTime={lastModifiedAt}>{new Date(lastModifiedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</time></span>;
}
