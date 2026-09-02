"use client";
import { Download, Moon, Plus, Sun } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SyncIndicator } from "@/components/sync/sync-indicator";
import type { WorkbookSnapshot } from "@/types/company";

export function DashboardHeader({ status, lastModifiedAt, onAdd }: { status: WorkbookSnapshot["syncStatus"]; lastModifiedAt: string; onAdd: () => void }) {
  const [dark, setDark] = useState(() => typeof document === "undefined" || document.documentElement.dataset.theme !== "light");
  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("tracker-theme", next);
    setDark(!dark);
  };
  return <header className="app-header"><div className="header-inner">
    <div className="brand"><span className="brand-mark" aria-hidden="true">TI</span><div><h1>Tech Internship Tracker</h1><p>ข้อมูลจาก Excel · จัดเก็บบนเครื่องนี้</p></div></div>
    <nav className="header-actions" aria-label="เครื่องมือหลัก">
      <SyncIndicator status={status} lastModifiedAt={lastModifiedAt} />
      <button className="icon-button" onClick={toggle} aria-label={dark ? "ใช้ธีมสว่าง" : "ใช้ธีมมืด"}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
      <Link className="icon-button" href="/api/excel" prefetch={false} download aria-label="ดาวน์โหลด Excel"><Download size={18} /></Link>
      <button className="primary-button" onClick={onAdd}><Plus size={18} /> <span>เพิ่มบริษัท</span></button>
    </nav>
  </div></header>;
}
