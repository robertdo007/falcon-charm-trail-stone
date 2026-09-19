import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/btc-daily")({
  server: {
    handlers: {
      GET: async () => {
        const { loadBtcDailyMarkets } = await import(
          "@/lib/polymarket.server.ts"
        );
        const markets = await loadBtcDailyMarkets();
        return Response.json({
          source: "https://gamma-api.polymarket.com/events?series_id=41",
          series: "btc-up-or-down-daily",
          count: markets.length,
          markets,
        });
      },
    },
  },
});
