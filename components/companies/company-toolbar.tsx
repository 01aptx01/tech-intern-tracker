'use client';
import { Check, Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [openUpward, setOpenUpward] = useState(false);

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

  const updatePlacement = useCallback(() => {
    if (!detailsRef.current?.open) return;
    const rect = detailsRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // If space below is tight and more room exists above, open upward to avoid page overflow
    setOpenUpward(spaceBelow < 460 && spaceAbove > spaceBelow);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        detailsRef.current?.open &&
        !detailsRef.current.contains(event.target as Node)
      ) {
        detailsRef.current.open = false;
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && detailsRef.current?.open) {
        detailsRef.current.open = false;
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePlacement);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePlacement);
    };
  }, [updatePlacement]);

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
            placeholder="ค้นหาชื่อ ชื่อเต็ม โครงการ สายงาน ที่ตั้ง หรือหมายเหตุ…"
            aria-label="ค้นหาบริษัท"
          />
          <kbd aria-hidden="true">Ctrl K</kbd>
        </label>
        <details
          ref={detailsRef}
          className="filter-menu"
          onToggle={updatePlacement}
        >
          <summary>
            <Filter size={17} />
            ตัวกรอง{activeCount > 0 && <span>{activeCount}</span>}
          </summary>
          <div className={`filter-popover${openUpward ? ' open-up' : ''}`}>
            <div className="filter-popover-header">
              <div className="filter-popover-title">
                <SlidersHorizontal size={15} className="filter-title-icon" aria-hidden="true" />
                <span>ตัวกรองการค้นหา</span>
                {activeCount > 0 && (
                  <span className="filter-header-badge">{activeCount}</span>
                )}
              </div>
              {activeCount > 0 && (
                <button type="button" className="filter-reset-header-btn" onClick={clear}>
                  <RotateCcw size={13} aria-hidden="true" />
                  <span>ล้างตัวกรอง</span>
                </button>
              )}
            </div>

            <div className="filter-popover-cols">
              <div className="filter-col">
                <FilterGroup
                  title="สถานะประกาศ"
                  values={announcementStatuses}
                  selected={filters.announcementStatuses}
                  onToggle={(value) => toggle('announcementStatuses', value)}
                  searchable={false}
                />
                <FilterGroup
                  title="สาย Tech"
                  values={options.techRoles}
                  selected={filters.techRoles}
                  onToggle={(value) => toggle('techRoles', value)}
                  searchable={true}
                  scrollable={true}
                />
                <FilterGroup
                  title="ประเภทโปรแกรม"
                  values={options.programTypes}
                  selected={filters.programTypes}
                  onToggle={(value) => toggle('programTypes', value)}
                  searchable={false}
                />
                <FilterGroup
                  title="ระดับหลักฐาน"
                  values={evidenceLevels}
                  selected={filters.evidenceLevels}
                  onToggle={(value) => toggle('evidenceLevels', value)}
                  compact
                  searchable={false}
                />
              </div>

              <div className="filter-col">
                <FilterGroup
                  title="สถานะของคุณ"
                  values={userStatusValues}
                  selected={filters.userStatuses}
                  onToggle={(value) => toggle('userStatuses', value)}
                  searchable={false}
                />
                <FilterGroup
                  title="ที่ตั้ง"
                  values={options.locations}
                  selected={filters.locations}
                  onToggle={(value) => toggle('locations', value)}
                  searchable={true}
                  scrollable={true}
                />
                <FilterGroup
                  title="รูปแบบทำงาน"
                  values={options.workModes}
                  selected={filters.workModes}
                  onToggle={(value) => toggle('workModes', value)}
                  searchable={true}
                  scrollable={true}
                />
                <div className="filter-select-wrapper">
                  <label className="filter-select">
                    <span className="filter-select-label">Deadline</span>
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
                </div>
              </div>
            </div>
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
  searchable,
  compact = false,
  scrollable,
}: {
  title: string;
  values: readonly string[];
  selected: readonly string[];
  onToggle: (value: string) => void;
  searchable?: boolean;
  compact?: boolean;
  scrollable?: boolean;
}) {
  const [filterText, setFilterText] = useState('');
  const hasSearch = searchable !== undefined ? searchable : values.length > 15;
  const isScrollable = scrollable !== undefined ? scrollable : hasSearch;

  const filteredValues = useMemo(() => {
    if (!filterText.trim()) return values;
    const q = filterText.toLowerCase().trim();
    return values.filter((v) => v.toLowerCase().includes(q));
  }, [values, filterText]);

  const displayedValues = useMemo(() => {
    if (filterText.trim()) {
      return filteredValues.slice(0, 40);
    }
    if (hasSearch && values.length > 12) {
      const selectedSet = new Set(selected);
      const selectedItems = values.filter((v) => selectedSet.has(v));
      const unselectedItems = values.filter((v) => !selectedSet.has(v));
      return [
        ...selectedItems,
        ...unselectedItems.slice(0, Math.max(0, 12 - selectedItems.length)),
      ];
    }
    return values;
  }, [values, filteredValues, filterText, hasSearch, selected]);

  if (!values.length) return null;

  return (
    <fieldset
      className={`filter-group${compact ? ' filter-group-compact' : ''}${
        isScrollable ? ' filter-group-scrollable' : ''
      }`}
    >
      <div className="filter-group-header">
        <legend>{title}</legend>
        {selected.length > 0 && (
          <span className="filter-group-count">{selected.length}</span>
        )}
      </div>
      {hasSearch && (
        <div className="filter-group-search">
          <Search size={13} className="filter-search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder={`ค้นหา ${title}...`}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            aria-label={`ค้นหา ${title}`}
          />
          {filterText && (
            <button
              type="button"
              onClick={() => setFilterText('')}
              aria-label="ล้างการค้นหา"
            >
              ×
            </button>
          )}
        </div>
      )}
      <div className="filter-group-items">
        {displayedValues.map((value) => (
          <label key={value} title={value} className="filter-chip-label">
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
            />
            <span className="filter-chip">
              <Check size={13} className="filter-chip-check" aria-hidden="true" />
              <span className="filter-chip-text">{value}</span>
            </span>
          </label>
        ))}
        {displayedValues.length === 0 && (
          <p className="filter-empty-text">ไม่พบรายการ</p>
        )}
      </div>
      {hasSearch && !filterText && values.length > displayedValues.length && (
        <p className="filter-hint">
          แสดง {displayedValues.length} จาก {values.length} รายการ (พิมพ์ค้นหาเพื่อดูเพิ่มเติม)
        </p>
      )}
    </fieldset>
  );
}
