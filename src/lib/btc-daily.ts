import { createServerFn } from "@tanstack/react-start";
import type { DailyMarket, Timeframe } from "./polymarket";

function asTimeframe(input: unknown): Timeframe {
  if (input === "15m") return "15m";
  if (input && typeof input === "object" && "tf" in input) {
    return (input as { tf?: unknown }).tf === "15m" ? "15m" : "1d";
  }
  return "1d";
}

export const getBtcMarkets = createServerFn({ method: "GET" })
  .inputValidator(asTimeframe)
  .handler(async ({ data }): Promise<DailyMarket[]> => {
    const { loadBtcMarkets } = await import("./polymarket.server.ts");
    return loadBtcMarkets(data);
  });

export const getBtcDailyMarkets = createServerFn({ method: "GET" }).handler(
  async (): Promise<DailyMarket[]> => {
    const { loadBtcDailyMarkets } = await import("./polymarket.server.ts");
    return loadBtcDailyMarkets();
  },
);