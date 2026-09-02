import type { CompanyInput, CompanyRecord } from "@/types/company";

export const emptyCompanyInput = (): CompanyInput => ({
  companyName: "", business: null, techRoles: [], thailandLocation: null, workMode: null, contact: null,
  applicationUrl: null, announcementStatus: "ไม่พบประกาศปัจจุบัน", applicationWindow: null,
  applicationDeadline: null, internshipPeriod: null, programTypes: [], qualificationsNotes: null,
  primarySourceUrl: null, secondarySourceUrl: null, verifiedAt: null, evidenceLevel: "C", userStatus: null,
  contactedAt: null, followUpAt: null, personalNotes: null,
});

export function recordToInput(record: CompanyRecord): CompanyInput {
  const { id: _id, order: _order, ...input } = record;
  return input;
}
