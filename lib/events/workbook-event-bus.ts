import type { WorkbookEvent } from "@/types/sync";

type Listener = (event: WorkbookEvent) => void;

export class WorkbookEventBus {
  private readonly listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: WorkbookEvent) {
    for (const listener of this.listeners) listener(event);
  }

  clear() { this.listeners.clear(); }
}

const globals = globalThis as typeof globalThis & { __trackerEventBus?: WorkbookEventBus };
export const eventBus = globals.__trackerEventBus ??= new WorkbookEventBus();
