import fs from "node:fs/promises";
import path from "node:path";

export const ownerLockPath = (filePath: string) => path.join(path.dirname(filePath), `~$${path.basename(filePath)}`);
export async function isWorkbookLocked(filePath: string) {
  try { await fs.access(ownerLockPath(filePath)); return true; } catch { return false; }
}
