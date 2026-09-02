import { describe, expect, it } from "vitest";
import { categoriesFor, dashboardAnalytics, daysUntil } from "@/lib/companies/analytics";
import type { CompanyRecord } from "@/types/company";

const record: CompanyRecord = { id: "5fc69a3f-00ef-4d7f-b0b4-62169972867d", order: 1, companyName: "Example", business: null, techRoles: ["Software Engineer", "Data Engineer", "DevOps"], thailandLocation: null, workMode: null, contact: null, applicationUrl: null, announcementStatus: "เปิดรับ", applicationWindow: null, applicationDeadline: "2026-09-10", internshipPeriod: null, programTypes: [], qualificationsNotes: null, primarySourceUrl: null, secondarySourceUrl: null, verifiedAt: null, evidenceLevel: "A", userStatus: "กำลังดำเนินการ", contactedAt: null, followUpAt: null, personalNotes: null };
describe("analytics", () => {
  it("classifies roles into all applicable groups", () => expect(categoriesFor(record)).toEqual(expect.arrayContaining(["SWE", "AI/Data", "DevOps/Cloud"])));
  it("counts dashboard states and deadlines", () => expect(dashboardAnalytics([record], new Date("2026-09-03T12:00:00Z"))).toMatchObject({ total: 1, open: 1, deadline14: 1, inProgress: 1 }));
  it("handles missing deadlines", () => expect(daysUntil(null)).toBeNull());
});
