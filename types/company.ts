export const announcementStatuses = [
  "เปิดรับ",
  "Rolling",
  "ยังไม่เปิดรอบ",
  "ปิดรับแล้ว",
  "ไม่พบประกาศปัจจุบัน",
] as const;

export const evidenceLevels = ["A", "B", "C"] as const;
export const userStatusValues = [
  "ไม่รับ",
  "ติดต่อแล้ว",
  "กำลังดำเนินการ",
  "รับแล้ว",
  "เลยช่วง",
  "ไม่มี",
] as const;

export type AnnouncementStatus = (typeof announcementStatuses)[number];
export type EvidenceLevel = (typeof evidenceLevels)[number];
export type UserStatus = (typeof userStatusValues)[number] | null;

export interface CompanyRecord {
  id: string;
  order: number;
  companyName: string;
  business: string | null;
  techRoles: string[];
  thailandLocation: string | null;
  workMode: string | null;
  contact: string | null;
  applicationUrl: string | null;
  announcementStatus: AnnouncementStatus;
  applicationWindow: string | null;
  applicationDeadline: string | null;
  internshipPeriod: string | null;
  programTypes: string[];
  qualificationsNotes: string | null;
  primarySourceUrl: string | null;
  secondarySourceUrl: string | null;
  verifiedAt: string | null;
  evidenceLevel: EvidenceLevel;
  userStatus: UserStatus;
  contactedAt: string | null;
  followUpAt: string | null;
  personalNotes: string | null;
}

export type CompanyInput = Omit<CompanyRecord, "id" | "order">;

export interface WorkbookSnapshot {
  records: CompanyRecord[];
  version: string;
  lastModifiedAt: string;
  total: number;
  sourceFileName: string;
  syncStatus: "synced" | "reading" | "writing" | "locked" | "error";
  errorMessage?: string;
}
