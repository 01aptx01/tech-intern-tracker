'use client';
import { Download, Moon, Plus, Sun } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { SyncIndicator } from '@/components/sync/sync-indicator';
import { useHydrated } from '@/hooks/use-hydrated';
import type { WorkbookSnapshot } from '@/types/company';

type Props = {
  status: WorkbookSnapshot['syncStatus'];
  lastCheckedAt: string;
  fileModifiedAt: string;
  onSync: () => void;
  onAdd: () => void;
};

export function DashboardHeader({
  status,
  lastCheckedAt,
  fileModifiedAt,
  onSync,
  onAdd,
}: Props) {
  const hydrated = useHydrated();
  const [, renderTheme] = useState(0);
  const dark = !hydrated || document.documentElement.dataset.theme !== 'light';
  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem('tracker-theme', next);
    renderTheme((version) => version + 1);
  };
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            TI
          </span>
          <div>
            <h1>Tech Internship Tracker</h1>
            <p>ข้อมูลจาก Excel · จัดเก็บบนเครื่องนี้</p>
          </div>
        </div>
        <div className="header-actions">
          <SyncIndicator
            status={status}
            lastCheckedAt={lastCheckedAt}
            fileModifiedAt={fileModifiedAt}
            onSync={onSync}
          />
          <button
            className="icon-button"
            onClick={toggle}
            aria-label={dark ? 'ใช้ธีมสว่าง' : 'ใช้ธีมมืด'}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            className="icon-button"
            href="/api/excel"
            prefetch={false}
            download
            aria-label="ดาวน์โหลด Excel"
          >
            <Download size={18} />
          </Link>
          <button
            className="primary-button"
            onClick={onAdd}
            aria-label="เพิ่มบริษัท"
          >
            <Plus size={18} aria-hidden="true" /> <span>เพิ่มบริษัท</span>
          </button>
        </div>
      </div>
    </header>
  );
}
