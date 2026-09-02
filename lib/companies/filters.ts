import type { CompanyFilters, SortDirection, SortKey } from "@/types/filters";
import type { CompanyRecord } from "@/types/company";
import { daysUntil } from "./analytics";
import { normalizeSearch } from "./normalize";

const collator = new Intl.Collator("th", { sensitivity: "base", numeric: true });
const statusOrder: Record<CompanyRecord["announcementStatus"], number> = {
  "เปิดรับ": 0,
  Rolling: 1,
  "ยังไม่เปิดรอบ": 2,
  "ปิดรับแล้ว": 3,
  "ไม่พบประกาศปัจจุบัน": 4,
};

export function matchesSearch(record: CompanyRecord, query: string) {
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const haystack = normalizeSearch([
    record.companyName, record.business, ...record.techRoles, record.thailandLocation, record.workMode,
    record.contact, record.applicationWindow, record.internshipPeriod, ...record.programTypes,
    record.qualificationsNotes, record.personalNotes,
  ].filter(Boolean).join(" "));
  return tokens.every((token) => haystack.includes(token));
}

function includesAny(actual: string | null, selected: string[]) {
  return selected.length === 0 || (actual !== null && selected.includes(actual));
}

export function filterCompanies(records: CompanyRecord[], filters: CompanyFilters, today = new Date()) {
  return records.filter((record) => {
    if (!matchesSearch(record, filters.query)) return false;
    if (!includesAny(record.announcementStatus, filters.announcementStatuses)) return false;
    if (!includesAny(record.userStatus, filters.userStatuses)) return false;
    if (!includesAny(record.evidenceLevel, filters.evidenceLevels)) return false;
    if (filters.techRoles.length && !filters.techRoles.some((role) => record.techRoles.includes(role))) return false;
    if (filters.programTypes.length && !filters.programTypes.some((type) => record.programTypes.includes(type))) return false;
    if (filters.locations.length && !filters.locations.includes(record.thailandLocation ?? "")) return false;
    if (filters.workModes.length && !filters.workModes.includes(record.workMode ?? "")) return false;
    if (filters.deadline !== "all") {
      const days = daysUntil(record.applicationDeadline, today);
      if (filters.deadline === "none" && days !== null) return false;
      if (filters.deadline === "overdue" && (days === null || days >= 0)) return false;
      if (filters.deadline === "14" && (days === null || days < 0 || days > 14)) return false;
      if (filters.deadline === "30" && (days === null || days < 0 || days > 30)) return false;
    }
    return true;
  });
}

export function sortCompanies(records: CompanyRecord[], key: SortKey = "default", direction: SortDirection = "asc") {
  const factor = direction === "asc" ? 1 : -1;
  return [...records].sort((a, b) => {
    if (key === "default") {
      const byStatus = statusOrder[a.announcementStatus] - statusOrder[b.announcementStatus];
      if (byStatus) return byStatus;
      if (a.announcementStatus === "เปิดรับ") {
        const aDate = a.applicationDeadline ?? "9999-12-31";
        const bDate = b.applicationDeadline ?? "9999-12-31";
        const byDeadline = collator.compare(aDate, bDate);
        if (byDeadline) return byDeadline;
      }
      return collator.compare(a.companyName, b.companyName);
    }
    const value = (record: CompanyRecord) => {
      if (key === "companyName") return record.companyName;
      if (key === "applicationDeadline") return record.applicationDeadline ?? "9999-12-31";
      if (key === "followUpAt") return record.followUpAt ?? "9999-12-31";
      return record.announcementStatus;
    };
    return collator.compare(value(a), value(b)) * factor;
  });
}
