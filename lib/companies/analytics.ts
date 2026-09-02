import type { CompanyRecord } from "@/types/company";

export const roleCategories = ["SWE", "AI/Data", "QA", "DevOps/Cloud", "Cybersecurity", "IT/Infrastructure"] as const;
export type RoleCategory = (typeof roleCategories)[number];

const roleMatchers: Record<RoleCategory, RegExp> = {
  SWE: /software|developer|frontend|front-end|backend|back-end|full.?stack|mobile|web|programmer|วิศวกรซอฟต์แวร์/i,
  "AI/Data": /\bai\b|machine learning|data|analytics|business intelligence|bi engineer|nlp|computer vision/i,
  QA: /\bqa\b|quality assurance|software test|tester|testing|sdet/i,
  "DevOps/Cloud": /devops|cloud|platform engineer|site reliability|\bsre\b|kubernetes|infrastructure as code/i,
  Cybersecurity: /cyber|security|soc analyst|penetration|information security/i,
  "IT/Infrastructure": /\bit\b|information technology|infrastructure|network|system administrator|helpdesk|support engineer/i,
};

export function categoriesFor(record: CompanyRecord): RoleCategory[] {
  const searchable = record.techRoles.join(" ");
  return roleCategories.filter((category) => roleMatchers[category].test(searchable));
}

export function roleCategoryCounts(records: CompanyRecord[]) {
  return roleCategories.map((category) => ({
    category,
    count: records.filter((record) => categoriesFor(record).includes(category)).length,
  }));
}

export function daysUntil(dateOnly: string | null, today = new Date()): number | null {
  if (!dateOnly) return null;
  const target = new Date(`${dateOnly}T12:00:00Z`);
  const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12));
  return Math.ceil((target.getTime() - base.getTime()) / 86_400_000);
}

export function dashboardAnalytics(records: CompanyRecord[], today = new Date()) {
  const open = records.filter((record) => record.announcementStatus === "เปิดรับ").length;
  const rolling = records.filter((record) => record.announcementStatus === "Rolling").length;
  return {
    total: records.length,
    open,
    rolling,
    openOrRolling: open + rolling,
    deadline14: records.filter((record) => {
      const days = daysUntil(record.applicationDeadline, today);
      return record.announcementStatus === "เปิดรับ" && days !== null && days >= 0 && days <= 14;
    }).length,
    inProgress: records.filter((record) => record.userStatus === "กำลังดำเนินการ").length,
    accepted: records.filter((record) => record.userStatus === "รับแล้ว").length,
  };
}
