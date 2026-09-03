'use client';
import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  type PieLabelRenderProps,
} from 'recharts';
import { announcementStatuses, type CompanyRecord } from '@/types/company';
import { roleCategoryCounts } from '@/lib/companies/analytics';

const colors = [
  'var(--chart-success)',
  'var(--chart-info)',
  'var(--chart-warning)',
  'var(--chart-danger)',
  'var(--chart-neutral)',
];
const renderStatusLabel = ({ name, value }: PieLabelRenderProps) =>
  `${String(name)}: ${String(value)}`;
export function StatusCharts({ records }: { records: CompanyRecord[] }) {
  const statuses = announcementStatuses.map((status, index) => ({
    name: `${index + 1}. ${status}`,
    status,
    value: records.filter((record) => record.announcementStatus === status)
      .length,
    fill: colors[index],
  }));
  const roles = roleCategoryCounts(records);
  return (
    <section className="chart-grid" aria-label="กราฟภาพรวม">
      <article className="panel chart-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow" lang="en">
              ANNOUNCEMENT
            </p>
            <h2>สถานะประกาศ</h2>
          </div>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statuses}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={76}
                paddingAngle={2}
                label={renderStatusLabel}
                labelLine
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <ol className="chart-legend">
            {statuses.map((item, index) => (
              <li key={item.status}>
                <span
                  className="chart-dot"
                  aria-hidden="true"
                  style={{ background: colors[index] }}
                />
                <span>
                  {index + 1}. {item.status}
                </span>
                <b>{item.value}</b>
              </li>
            ))}
          </ol>
        </div>
        <p className="sr-only">
          {statuses
            .map((item) => `${item.status} ${item.value} บริษัท`)
            .join(', ')}
        </p>
      </article>
      <article className="panel chart-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow" lang="en">
              TECH FOCUS
            </p>
            <h2>สายงานที่เกี่ยวข้อง</h2>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={roles}
            layout="vertical"
            margin={{ left: 8, right: 24 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="category"
              width={112}
              tick={{ fill: 'currentColor', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip />
            <Bar dataKey="count" fill="var(--primary)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="sr-only">
          {roles
            .map((item) => `${item.category} ${item.count} บริษัท`)
            .join(', ')}
        </p>
      </article>
    </section>
  );
}
