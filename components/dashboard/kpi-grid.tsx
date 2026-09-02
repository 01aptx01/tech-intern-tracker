import { Building2, CalendarClock, CircleCheckBig, Send, Sparkles } from "lucide-react";
import { dashboardAnalytics } from "@/lib/companies/analytics";
import type { CompanyRecord } from "@/types/company";

export function KpiGrid({ records }: { records: CompanyRecord[] }) {
  const stats = dashboardAnalytics(records);
  const cards = [
    { label: "บริษัททั้งหมด", value: stats.total, icon: Building2, tone: "teal" },
    { label: "เปิดรับ + Rolling", value: stats.openOrRolling, icon: Sparkles, tone: "indigo" },
    { label: "ใกล้ deadline 14 วัน", value: stats.deadline14, icon: CalendarClock, tone: "amber" },
    { label: "กำลังดำเนินการ", value: stats.inProgress, icon: Send, tone: "sky" },
    { label: "รับแล้ว", value: stats.accepted, icon: CircleCheckBig, tone: "green" },
  ];
  return <section className="kpi-grid" aria-label="ภาพรวม"><h2 className="sr-only">ภาพรวม</h2>{cards.map(({ label, value, icon: Icon, tone }) => <article className={`kpi-card tone-${tone}`} key={label}><span className="kpi-icon"><Icon size={19} /></span><p>{label}</p><strong>{value}</strong></article>)}</section>;
}
