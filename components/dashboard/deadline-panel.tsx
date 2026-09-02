import { ArrowUpRight, CalendarClock } from "lucide-react";
import { daysUntil } from "@/lib/companies/analytics";
import type { CompanyRecord } from "@/types/company";

export function DeadlinePanel({ records, onOpen }: { records: CompanyRecord[]; onOpen: (record: CompanyRecord) => void }) {
  const urgent = records.filter((record) => record.announcementStatus === "เปิดรับ" && record.applicationDeadline)
    .filter((record) => { const days = daysUntil(record.applicationDeadline); return days !== null && days >= 0 && days <= 30; })
    .sort((a, b) => (a.applicationDeadline ?? "").localeCompare(b.applicationDeadline ?? ""));
  return <section className="panel deadline-panel"><div className="panel-heading"><div><p className="eyebrow">NEXT 30 DAYS</p><h2><CalendarClock size={18} /> Deadline ที่ควรจัดการก่อน</h2></div><span className="count-chip">{urgent.length} รายการ</span></div>
    {urgent.length ? <div className="deadline-list">{urgent.map((record) => <button key={record.id} onClick={() => onOpen(record)}><span><strong>{record.companyName}</strong><small>{record.applicationWindow || "เปิดรับสมัคร"}</small></span><span className="deadline-date">{record.applicationDeadline}<ArrowUpRight size={15} /></span></button>)}</div> : <p className="empty-copy">ไม่มี deadline ภายใน 30 วัน</p>}
  </section>;
}
