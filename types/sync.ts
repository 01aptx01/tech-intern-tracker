export type WorkbookEvent =
  | { type: "workbook.changed"; version: string; at: string; source: "app" | "excel" }
  | { type: "sync.error"; at: string; message: string }
  | { type: "lock.changed"; at: string; locked: boolean };
