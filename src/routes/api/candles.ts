import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/candles")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const frame = params.get("frame");
        if (frame !== "1h" && frame !== "4h") {
          return new Response("frame must be 1h or 4h", { status: 400 });
        }
        const after = Number(params.get("after") ?? 0);
        const { getCandleTail } = await import("@/lib/candles.server.ts");
        const { csv, added, stale } = await getCandleTail(
          frame,
          Number.isFinite(after) && after > 0 ? after : 0,
        );
        return new Response(csv, {
          headers: {
            "content-type": "text/csv; charset=utf-8",
            "cache-control": "no-store",
            "x-candles-added": String(added),
            "x-candles-stale": stale ? "1" : "0",
          },
        });
      },
    },
  },
});
