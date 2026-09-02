// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompanyToolbar } from "@/components/companies/company-toolbar";
import type { CompanyFilters } from "@/types/filters";

const filters: CompanyFilters = { query: "", announcementStatuses: [], userStatuses: [], techRoles: [], programTypes: [], evidenceLevels: [], locations: [], workModes: [], deadline: "all" };
const options = { techRoles: [], programTypes: [], locations: [], workModes: [] };
describe("CompanyToolbar keyboard search", () => {
  it("focuses search with slash and clears it with Escape", async () => {
    const onQuery = vi.fn();
    render(<CompanyToolbar query="alpha" onQuery={onQuery} filters={filters} onFilters={vi.fn()} options={options} resultCount={1} total={2} />);
    const search = screen.getByRole("textbox", { name: "ค้นหาบริษัท" });
    await userEvent.keyboard("/");
    expect(search).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(onQuery).toHaveBeenLastCalledWith("");
  });
});
