import type { AnnouncementStatus, EvidenceLevel, UserStatus } from "./company";

export type DeadlineFilter = "all" | "14" | "30" | "overdue" | "none";
export type SortKey = "default" | "companyName" | "applicationDeadline" | "followUpAt" | "announcementStatus";
export type SortDirection = "asc" | "desc";
export interface CompanyFilters {
  query: string;
  announcementStatuses: AnnouncementStatus[];
  userStatuses: Exclude<UserStatus, null>[];
  techRoles: string[];
  programTypes: string[];
  evidenceLevels: EvidenceLevel[];
  locations: string[];
  workModes: string[];
  deadline: DeadlineFilter;
}
