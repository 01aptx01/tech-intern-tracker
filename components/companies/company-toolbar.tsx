'use client';
import { Check, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import {
  announcementStatuses,
  evidenceLevels,
  userStatusValues,
} from '@/types/company';
import type { CompanyFilters, DeadlineFilter } from '@/types/filters';

type Options = {
  techRoles: string[];
  programTypes: string[];
  locations: string[];
  workModes: string[];
};
type Props = {
  query: string;
  onQuery: (value: string) => void;
  filters: CompanyFilters;
  onFilters: (value: CompanyFilters) => void;
  options: Options;
  resultCount: number;
  total: number;
};

export function CompanyToolbar({
  query,
  onQuery,
  filters,
  onFilters,
  options,
  resultCount,
  total,
}: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'k' &&
        !isEditing
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
  const toggle = <K extends keyof CompanyFilters>(key: K, value: string) => {
    const current = filters[key] as string[];
    onFilters({
      ...filters,
      [key]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    });
  };
  const activeCount =
    filters.announcementStatuses.length +
    filters.userStatuses.length +
    filters.techRoles.length +
    filters.programTypes.length +
    filters.evidenceLevels.length +
    filters.locations.length +
    filters.workModes.length +
    (filters.deadline === 'all' ? 0 : 1);
  const clear = () =>
    onFilters({
      ...filters,
      announcementStatuses: [],
      userStatuses: [],
      techRoles: [],
      programTypes: [],
      evidenceLevels: [],
      locations: [],
      workModes: [],
      deadline: 'all',
    });
  return (
    <div className="directory-toolbar">
      <div className="toolbar-row">
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onQuery('');
            }}
            placeholder="ค้นหาบริษัท สายงาน ที่ตั้ง ติดต่อ หรือหมายเหตุ…"
            aria-label="ค้นหาบริษัท"
          />
          <kbd aria-hidden="true">Ctrl K</kbd>
        </label>
        <details className="filter-menu">
          <summary>
            <Filter size={17} />
            ตัวกรอง{activeCount > 0 && <span>{activeCount}</span>}
          </summary>
          <div className="filter-popover">
            <FilterGroup
              title="สถานะประกาศ"
              values={announcementStatuses}
              selected={filters.announcementStatuses}
              onToggle={(value) => toggle('announcementStatuses', value)}
            />
            <FilterGroup
              title="สถานะของคุณ"
              values={userStatusValues}
              selected={filters.userStatuses}
              onToggle={(value) => toggle('userStatuses', value)}
            />
            <FilterGroup
              title="สาย Tech"
              values={options.techRoles}
              selected={filters.techRoles}
              onToggle={(value) => toggle('techRoles', value)}
            />
            <FilterGroup
              title="ประเภทโปรแกรม"
              values={options.programTypes}
              selected={filters.programTypes}
              onToggle={(value) => toggle('programTypes', value)}
            />
            <FilterGroup
              title="ระดับหลักฐาน"
              values={evidenceLevels}
              selected={filters.evidenceLevels}
              onToggle={(value) => toggle('evidenceLevels', value)}
            />
            <FilterGroup
              title="ที่ตั้ง"
              values={options.locations}
              selected={filters.locations}
              onToggle={(value) => toggle('locations', value)}
            />
            <FilterGroup
              title="รูปแบบทำงาน"
              values={options.workModes}
              selected={filters.workModes}
              onToggle={(value) => toggle('workModes', value)}
            />
            <label className="filter-select">
              <span>Deadline</span>
              <select
                value={filters.deadline}
                onChange={(event) =>
                  onFilters({
                    ...filters,
                    deadline: event.target.value as DeadlineFilter,
                  })
                }
              >
                <option value="all">ทั้งหมด</option>
                <option value="14">ภายใน 14 วัน</option>
                <option value="30">ภายใน 30 วัน</option>
                <option value="overdue">เลยกำหนด</option>
                <option value="none">ไม่มี deadline</option>
              </select>
            </label>
            {activeCount > 0 && (
              <button className="clear-filter" onClick={clear}>
                <X size={15} />
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </details>
        <button className="mobile-filter-button" aria-label="เปิดตัวกรอง">
          <SlidersHorizontal size={18} />
          <span>{activeCount || ''}</span>
        </button>
      </div>
      <div className="result-row">
        <p>
          ผลลัพธ์ <strong>{resultCount}</strong> จาก {total} บริษัท
        </p>
        {activeCount > 0 && <button onClick={clear}>ล้างตัวกรองทั้งหมด</button>}
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  values,
  selected,
  onToggle,
}: {
  title: string;
  values: readonly string[];
  selected: readonly string[];
  onToggle: (value: string) => void;
}) {
  if (!values.length) return null;
  return (
    <fieldset className="filter-group">
      <legend>{title}</legend>
      <div>
        {values.map((value) => (
          <label key={value}>
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
            />
            <span>
              <Check size={13} aria-hidden="true" />
              {value}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
