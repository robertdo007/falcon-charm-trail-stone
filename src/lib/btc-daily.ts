import { createServerFn } from "@tanstack/react-start";
import {
  parseTimeframe,
  type DailyMarket,
  type LiveQuote,
  type Timeframe,
} from "./polymarket";

export const getBtcMarkets = createServerFn({ method: "GET" })
  .inputValidator((input: unknown): Timeframe => parseTimeframe(input))
  .handler(async ({ data }): Promise<DailyMarket[]> => {
    const { loadBtcMarkets } = await import("./polymarket.server.ts");
    return loadBtcMarkets(data);
  });

export const getLiveBtcQuote = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const rec =
      input && typeof input === "object"
        ? (input as { tf?: unknown; end?: unknown })
        : {};
    return {
      tf: parseTimeframe(rec.tf ?? input),
      end: typeof rec.end === "string" ? rec.end : "",
    };
  })
  .handler(async ({ data }): Promise<LiveQuote> => {
    const { loadLiveQuote } = await import("./polymarket.server.ts");
    return loadLiveQuote(data.tf, data.end);
  });

export const getBtcDailyMarkets = createServerFn({ method: "GET" }).handler(
  async (): Promise<DailyMarket[]> => {
    const { loadBtcDailyMarkets } = await import("./polymarket.server.ts");
    return loadBtcDailyMarkets();
  },
);