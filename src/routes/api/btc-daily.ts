import { createFileRoute } from "@tanstack/react-router";
import { parseTimeframe, TIMEFRAMES } from "@/lib/polymarket";

export const Route = createFileRoute("/api/btc-daily")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const tf = parseTimeframe(new URL(request.url).searchParams.get("tf"));
        const spec = TIMEFRAMES[tf];
        const { loadBtcMarkets } = await import("@/lib/polymarket.server.ts");
        const markets = await loadBtcMarkets(tf);
        return Response.json({
          source: `https://gamma-api.polymarket.com/events?series_id=${spec.seriesId}`,
          series: spec.seriesId,
          timeframe: tf,
          count: markets.length,
          markets,
        });
      },
    },
  },
});