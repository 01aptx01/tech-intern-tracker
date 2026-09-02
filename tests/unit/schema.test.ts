import { describe, expect, it } from "vitest";
import { companyInputSchema } from "@/lib/companies/schema";
import { emptyCompanyInput } from "@/lib/companies/mapper";

describe("company schema", () => {
  it("accepts a complete empty-safe record", () => expect(companyInputSchema.safeParse({ ...emptyCompanyInput(), companyName: "Example" }).success).toBe(true));
  it("rejects non-http URLs", () => expect(companyInputSchema.safeParse({ ...emptyCompanyInput(), companyName: "Example", applicationUrl: "javascript:alert(1)" }).success).toBe(false));
  it("turns empty optional fields into null", () => expect(companyInputSchema.parse({ ...emptyCompanyInput(), companyName: "Example", applicationUrl: "" }).applicationUrl).toBeNull());
});
