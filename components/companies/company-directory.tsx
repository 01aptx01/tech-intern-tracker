'use client';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
  Save,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { CompanyToolbar } from './company-toolbar';
import { StatusBadge } from './status-badge';
import { filterCompanies, sortCompanies } from '@/lib/companies/filters';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  userStatusValues,
  type CompanyRecord,
  type UserStatus,
} from '@/types/company';
import type { CompanyFilters, SortDirection, SortKey } from '@/types/filters';

const initialFilters: CompanyFilters = {
  query: '',
  announcementStatuses: [],
  userStatuses: [],
  techRoles: [],
  programTypes: [],
  evidenceLevels: [],
  locations: [],
  workModes: [],
  deadline: 'all',
};

type Props = {
  records: CompanyRecord[];
  mutationsDisabled?: boolean;
  onOpen: (record: CompanyRecord) => void;
  onQuickStatus: (record: CompanyRecord, status: UserStatus) => Promise<void>;
};
export function CompanyDirectory({
  records,
  mutationsDisabled = false,
  onOpen,
  onQuickStatus,
}: Props) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const [filters, setFilters] = useState(initialFilters);
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [shown, setShown] = useState({
    roles: true,
    location: true,
    deadline: true,
    status: true,
    followUp: true,
  });
  const effective = useMemo(
    () => ({ ...filters, query: debounced }),
    [debounced, filters],
  );
  const filtered = useMemo(
    () =>
      sortCompanies(
        filterCompanies(records, effective),
        sortKey,
        sortDirection,
      ),
    [records, effective, sortKey, sortDirection],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const options = useMemo(
    () => ({
      techRoles: [
        ...new Set(records.flatMap((record) => record.techRoles)),
      ].sort(),
      programTypes: [
        ...new Set(records.flatMap((record) => record.programTypes)),
      ].sort(),
      locations: [
        ...new Set(
          records
            .map((record) => record.thailandLocation)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
      workModes: [
        ...new Set(
          records
            .map((record) => record.workMode)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
    }),
    [records],
  );
  const quick = async (record: CompanyRecord, status: UserStatus) => {
    setSavingId(record.id);
    try {
      await onQuickStatus(record, status);
    } finally {
      setSavingId(null);
    }
  };
  const sort = (key: SortKey) => {
    if (sortKey === key)
      setSortDirection((value) => (value === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };
  return (
    <section
      id="company-directory"
      className="panel directory"
      aria-labelledby="directory-title"
    >
      <div className="directory-heading">
        <div>
          <p className="eyebrow" lang="en">
            SEARCHABLE DIRECTORY
          </p>
          <h2 id="directory-title">บริษัทฝึกงาน</h2>
        </div>
        <details className="column-picker">
          <summary>คอลัมน์</summary>
          <div>
            {Object.entries({
              roles: 'สาย Tech',
              location: 'ที่ตั้ง',
              deadline: 'Deadline',
              status: 'สถานะของคุณ',
              followUp: 'Follow-up',
            }).map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={shown[key as keyof typeof shown]}
                  onChange={() =>
                    setShown((current) => ({
                      ...current,
                      [key]: !current[key as keyof typeof current],
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </details>
      </div>
      <CompanyToolbar
        query={query}
        onQuery={(value) => {
          setQuery(value);
          setPage(1);
        }}
        filters={filters}
        onFilters={(value) => {
          setFilters(value);
          setPage(1);
        }}
        options={options}
        resultCount={filtered.length}
        total={records.length}
      />
      <output className="sr-only" aria-live="polite" aria-atomic="true">
        ผลลัพธ์ {filtered.length} จาก {records.length} บริษัท หน้า {safePage} จาก{' '}
        {pages}
      </output>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <Sortable
                label="ชื่อที่รู้จัก"
                active={sortKey === 'companyName'}
                direction={sortDirection}
                onClick={() => sort('companyName')}
              />
              {shown.roles && <th scope="col">สาย Tech</th>}
              {shown.location && <th scope="col">ที่ตั้ง</th>}
              <Sortable
                label="สถานะประกาศ"
                active={sortKey === 'announcementStatus'}
                direction={sortDirection}
                onClick={() => sort('announcementStatus')}
              />
              {shown.deadline && (
                <Sortable
                  label="Deadline"
                  active={sortKey === 'applicationDeadline'}
                  direction={sortDirection}
                  onClick={() => sort('applicationDeadline')}
                />
              )}
              {shown.status && <th scope="col">สถานะของคุณ</th>}
              {shown.followUp && (
                <Sortable
                  label="Follow-up"
                  active={sortKey === 'followUpAt'}
                  direction={sortDirection}
                  onClick={() => sort('followUpAt')}
                />
              )}
              <th scope="col">
                <span className="sr-only">ดำเนินการ</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((record) => (
              <tr key={record.id}>
                <td>
                  <button
                    className="company-name"
                    onClick={() => onOpen(record)}
                  >
                    <Highlight text={record.companyName} query={debounced} />
                  </button>
                  {record.fullCompanyName && (
                    <small>
                      <Highlight
                        text={record.fullCompanyName}
                        query={debounced}
                      />
                    </small>
                  )}
                  <small>{record.business || 'ไม่ระบุประเภทธุรกิจ'}</small>
                  {record.openPrograms.length > 0 && (
                    <small>โครงการ: {record.openPrograms.join(' · ')}</small>
                  )}
                </td>
                {shown.roles && (
                  <td>
                    <div className="tag-list">
                      {record.techRoles.slice(0, 3).map((role) => (
                        <span key={role}>
                          <Highlight text={role} query={debounced} />
                        </span>
                      ))}
                      {record.techRoles.length > 3 && (
                        <span>+{record.techRoles.length - 3}</span>
                      )}
                    </div>
                  </td>
                )}
                {shown.location && (
                  <td className="muted-cell">
                    {record.thailandLocation || '—'}
                  </td>
                )}
                <td>
                  <StatusBadge status={record.announcementStatus} />
                </td>
                {shown.deadline && (
                  <td className="date-cell">
                    {record.applicationDeadline || '—'}
                  </td>
                )}
                {shown.status && (
                  <td>
                    <label className="quick-status">
                      <span className="sr-only">
                        สถานะของคุณสำหรับ {record.companyName}
                      </span>
                      <select
                        disabled={mutationsDisabled || savingId === record.id}
                        value={record.userStatus ?? ''}
                        onChange={(event) =>
                          void quick(
                            record,
                            (event.target.value || null) as UserStatus,
                          )
                        }
                      >
                        <option value="">ยังไม่ระบุ</option>
                        {userStatusValues.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                      {savingId === record.id && (
                        <Save size={13} className="saving-icon" />
                      )}
                    </label>
                  </td>
                )}
                {shown.followUp && (
                  <td className="date-cell">{record.followUpAt || '—'}</td>
                )}
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      onClick={() => onOpen(record)}
                      aria-label={`แก้ไข ${record.companyName}`}
                    >
                      <Pencil size={16} />
                    </button>
                    {record.applicationUrl && (
                      <a
                        className="icon-button"
                        href={record.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`เปิดหน้าสมัคร ${record.companyName}`}
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mobile-cards">
        {visible.map((record) => (
          <article key={record.id} className="company-card">
            <div className="card-top">
              <div>
                <button className="company-name" onClick={() => onOpen(record)}>
                  {record.companyName}
                </button>
                {record.fullCompanyName && <p>{record.fullCompanyName}</p>}
                <p>{record.thailandLocation || 'ไม่ระบุที่ตั้ง'}</p>
              </div>
              <StatusBadge status={record.announcementStatus} />
            </div>
            <div className="tag-list">
              {record.techRoles.slice(0, 3).map((role) => (
                <span key={role}>{role}</span>
              ))}
            </div>
            <dl>
              <div>
                <dt>โครงการที่เปิดรับ</dt>
                <dd>{record.openPrograms.join(', ') || '—'}</dd>
              </div>
              <div>
                <dt>Deadline</dt>
                <dd>{record.applicationDeadline || '—'}</dd>
              </div>
              <div>
                <dt>Follow-up</dt>
                <dd>{record.followUpAt || '—'}</dd>
              </div>
            </dl>
            <div className="card-actions">
              <select
                disabled={mutationsDisabled || savingId === record.id}
                aria-label={`สถานะของคุณสำหรับ ${record.companyName}`}
                value={record.userStatus ?? ''}
                onChange={(event) =>
                  void quick(record, (event.target.value || null) as UserStatus)
                }
              >
                <option value="">ยังไม่ระบุ</option>
                {userStatusValues.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <button
                className="secondary-button"
                onClick={() => onOpen(record)}
              >
                ดูรายละเอียด
              </button>
            </div>
          </article>
        ))}
      </div>
      {!visible.length && (
        <div className="empty-state">
          <Search size={28} />
          <h3>ไม่พบผลลัพธ์</h3>
          <p>ลองใช้คำค้นอื่นหรือล้างตัวกรองที่เลือกไว้</p>
          <button
            className="secondary-button"
            onClick={() => {
              setQuery('');
              setFilters(initialFilters);
            }}
          >
            ล้างทั้งหมด
          </button>
        </div>
      )}
      <footer className="pagination">
        <p>
          หน้า {safePage} จาก {pages}
        </p>
        <label>
          แสดง{' '}
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="50">50</option>
            <option value={Math.max(records.length, 1)}>ทั้งหมด</option>
          </select>
        </label>
        <div>
          <button
            className="icon-button"
            disabled={safePage === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            aria-label="หน้าก่อนหน้า"
          >
            <ChevronLeft />
          </button>
          <button
            className="icon-button"
            disabled={safePage === pages}
            onClick={() => setPage((value) => Math.min(pages, value + 1))}
            aria-label="หน้าถัดไป"
          >
            <ChevronRight />
          </button>
        </div>
      </footer>
    </section>
  );
}

function Sortable({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <th
      scope="col"
      aria-sort={
        active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'
      }
    >
      <button onClick={onClick}>
        {label}
        <span aria-hidden="true">
          {active ? (direction === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
        </span>
      </button>
    </th>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!tokens.length) return text;
  const matcher = new RegExp(`(${tokens.join('|')})`, 'gi');
  return text
    .split(matcher)
    .map((part, index) =>
      tokens.some((token) => new RegExp(`^${token}$`, 'i').test(part)) ? (
        <mark key={`${part}-${index}`}>{part}</mark>
      ) : (
        part
      ),
    );
}
