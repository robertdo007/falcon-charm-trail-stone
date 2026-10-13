import { createServerFn } from "@tanstack/react-start";
import { parseTimeframe, type DailyMarket, type Timeframe } from "./polymarket";

export const getBtcMarkets = createServerFn({ method: "GET" })
  .inputValidator((input: unknown): Timeframe => parseTimeframe(input))
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