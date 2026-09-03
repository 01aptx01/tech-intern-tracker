// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SyncIndicator } from "@/components/sync/sync-indicator";

const timestamps = {
  lastCheckedAt: "2026-09-03T10:30:00.000Z",
  fileModifiedAt: "2026-09-03T09:15:00.000Z",
};

describe("SyncIndicator", () => {
  it("explains automatic sync and lets the user check immediately", async () => {
    const onSync = vi.fn();
    render(<SyncIndicator status="synced" {...timestamps} onSync={onSync} />);

    const button = screen.getByRole("button", { name: "ซิงก์อัตโนมัติ ตรวจข้อมูลตอนนี้" });
    expect(button).toHaveAttribute("title", expect.stringContaining("คลิกเพื่อตรวจตอนนี้"));
    await userEvent.click(button);
    expect(onSync).toHaveBeenCalledOnce();
  });

  it("prevents duplicate checks while a read is in progress", () => {
    render(<SyncIndicator status="reading" {...timestamps} onSync={vi.fn()} />);
    expect(screen.getByRole("button", { name: "กำลังตรวจ Excel ตรวจข้อมูลตอนนี้" })).toBeDisabled();
  });
});
