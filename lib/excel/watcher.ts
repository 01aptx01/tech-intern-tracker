import path from "node:path";
import chokidar, { type FSWatcher } from "chokidar";
import { eventBus } from "@/lib/events/workbook-event-bus";
import { ownerLockPath } from "./lock";

export interface WatcherCallbacks {
  refresh: () => Promise<{ version: string; lastModifiedAt: string; changed: boolean }>;
}

export class WorkbookWatcher {
  private watcher: FSWatcher | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly filePath: string, private readonly callbacks: WatcherCallbacks) {}

  start() {
    if (this.watcher) return;
    const lockPath = ownerLockPath(this.filePath);
    this.watcher = chokidar.watch([this.filePath, lockPath], {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    });
    this.watcher.on("all", (eventName, changedPath) => {
      if (path.resolve(changedPath) === path.resolve(lockPath)) {
        eventBus.emit({ type: "lock.changed", locked: eventName !== "unlink", at: new Date().toISOString() });
        return;
      }
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => void this.refresh(), 500);
    });
  }

  private async refresh() {
    try {
      const result = await this.callbacks.refresh();
      if (result.changed) eventBus.emit({ type: "workbook.changed", version: result.version, at: result.lastModifiedAt, source: "excel" });
    } catch (error) {
      eventBus.emit({ type: "sync.error", at: new Date().toISOString(), message: error instanceof Error ? error.message : "อ่าน Excel ที่เปลี่ยนแปลงไม่สำเร็จ" });
    }
  }

  async close() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    await this.watcher?.close();
    this.watcher = null;
  }
}
