import { createServerFn } from "@tanstack/react-start";
import type { DailyMarket } from "./polymarket";

export const getBtcDailyMarkets = createServerFn({ method: "GET" }).handler(
  async (): Promise<DailyMarket[]> => {
    const { loadBtcDailyMarkets } = await import("./polymarket.server.ts");
    return loadBtcDailyMarkets();
  },
);
