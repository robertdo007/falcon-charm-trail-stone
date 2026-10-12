import {
  TIMEFRAMES,
  parseGammaEvent,
  trimUpcoming,
  uniqueByDate,
  type DailyMarket,
  type Timeframe,
} from "./polymarket";

const GAMMA = "https://gamma-api.polymarket.com";
const PAGE = 100;
const CACHE_MS = 2 * 60 * 1000;

type Cache = { at: number; markets: DailyMarket[] };
const caches = new Map<Timeframe, Cache>();

async function fetchPage(seriesId: string, offset: number): Promise<unknown[]> {
  const url = new URL(`${GAMMA}/events`);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("limit", String(PAGE));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("order", "endDate");
  url.searchParams.set("ascending", "false");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 18_000);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "btc-daily-tape/1.0",
      },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(`Polymarket Gamma ${res.status}`);
    }
    const body: unknown = await res.json();
    return Array.isArray(body) ? body : [];
  } finally {
    clearTimeout(timer);
  }
}

export async function loadBtcMarkets(
  tf: Timeframe = "1d",
): Promise<DailyMarket[]> {
  const hit = caches.get(tf);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.markets;

  const spec = TIMEFRAMES[tf];
  const offsets = Array.from({ length: spec.pages }, (_, i) => i * PAGE);
  const pages = await Promise.all(
    offsets.map((offset) => fetchPage(spec.seriesId, offset)),
  );
  const parsed = pages
    .flat()
    .map((event) => parseGammaEvent(event, tf))
    .filter((m): m is DailyMarket => m !== null);
  const markets = trimUpcoming(uniqueByDate(parsed), tf);
  caches.set(tf, { at: Date.now(), markets });
  return markets;
}

export function loadBtcDailyMarkets(): Promise<DailyMarket[]> {
  return loadBtcMarkets("1d");
}