import { eventBus } from "@/lib/events/workbook-event-bus";
import { getExcelRepository } from "@/lib/excel/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await getExcelRepository().initialize();
  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (event: unknown) => {
        if (!closed) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      const unsubscribe = eventBus.subscribe(send);
      const timer = setInterval(() => send({ type: "heartbeat", at: new Date().toISOString() }), 20_000);
      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        unsubscribe();
        try { controller.close(); } catch { /* connection already closed */ }
      };
      request.signal.addEventListener("abort", cleanup, { once: true });
      send({ type: "connected", at: new Date().toISOString() });
    },
    cancel() { cleanup(); },
  });
  return new Response(stream, { headers: {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  } });
}
