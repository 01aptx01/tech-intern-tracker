"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Bar, BarChart, XAxis, YAxis } from "recharts";
import { announcementStatuses, type CompanyRecord } from "@/types/company";
import { roleCategoryCounts } from "@/lib/companies/analytics";

const colors = ["#22c55e", "#818cf8", "#f59e0b", "#f43f5e", "#64748b"];
export function StatusCharts({ records }: { records: CompanyRecord[] }) {
  const statuses = announcementStatuses.map((name) => ({ name, value: records.filter((record) => record.announcementStatus === name).length }));
  const roles = roleCategoryCounts(records);
  return <section className="chart-grid" aria-label="กราฟภาพรวม">
    <article className="panel chart-card"><div className="panel-heading"><div><p className="eyebrow">ANNOUNCEMENT</p><h2>สถานะประกาศ</h2></div></div><div className="chart-body"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={statuses} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={2}>{statuses.map((item, index) => <Cell key={item.name} fill={colors[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><ul className="chart-legend">{statuses.map((item, index) => <li key={item.name}><span style={{ background: colors[index] }} />{item.name}<b>{item.value}</b></li>)}</ul></div><p className="sr-only">{statuses.map((item) => `${item.name} ${item.value} บริษัท`).join(", ")}</p></article>
    <article className="panel chart-card"><div className="panel-heading"><div><p className="eyebrow">TECH FOCUS</p><h2>สายงานที่เกี่ยวข้อง</h2></div></div><ResponsiveContainer width="100%" height={260}><BarChart data={roles} layout="vertical" margin={{ left: 8, right: 24 }}><XAxis type="number" hide /><YAxis type="category" dataKey="category" width={112} tick={{ fill: "currentColor", fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="count" fill="#2dd4bf" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer><p className="sr-only">{roles.map((item) => `${item.category} ${item.count} บริษัท`).join(", ")}</p></article>
  </section>;
}
