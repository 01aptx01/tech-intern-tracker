import { describe, expect, it } from "vitest";
import { recordToInput } from "@/lib/companies/mapper";
import type { CompanyRecord } from "@/types/company";

describe("recordToInput", () => {
  it("never sends technical id or order in an edit payload", () => {
    const record = { id: "5fc69a3f-00ef-4d7f-b0b4-62169972867d", order: 1, companyName: "Example", business: null, techRoles: [], thailandLocation: null, workMode: null, contact: null, applicationUrl: null, announcementStatus: "เปิดรับ", applicationWindow: null, applicationDeadline: null, internshipPeriod: null, programTypes: [], qualificationsNotes: null, primarySourceUrl: null, secondarySourceUrl: null, verifiedAt: null, evidenceLevel: "A", userStatus: null, contactedAt: null, followUpAt: null, personalNotes: null } satisfies CompanyRecord;
    const input = recordToInput(record);
    expect(input).not.toHaveProperty("id");
    expect(input).not.toHaveProperty("order");
  });
});
