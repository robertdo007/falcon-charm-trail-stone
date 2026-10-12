import { createFileRoute } from "@tanstack/react-router";
import { TIMEFRAMES, type Timeframe } from "@/lib/polymarket";

export const Route = createFileRoute("/api/btc-daily")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const tf: Timeframe =
          new URL(request.url).searchParams.get("tf") === "15m" ? "15m" : "1d";
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