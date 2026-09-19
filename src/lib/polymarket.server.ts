import {
  BTC_DAILY_SERIES_ID,
  parseGammaEvent,
  uniqueByDate,
  type DailyMarket,
} from "./polymarket";

const GAMMA = "https://gamma-api.polymarket.com";
const PAGE = 100;
const MAX_PAGES = 8;
const CACHE_MS = 2 * 60 * 1000;

type Cache = { at: number; markets: DailyMarket[] };
let cache: Cache | null = null;

async function fetchPage(offset: number): Promise<unknown[]> {
  const url = new URL(`${GAMMA}/events`);
  url.searchParams.set("series_id", BTC_DAILY_SERIES_ID);
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

export async function loadBtcDailyMarkets(): Promise<DailyMarket[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.markets;

  const offsets = Array.from({ length: MAX_PAGES }, (_, i) => i * PAGE);
  const pages = await Promise.all(offsets.map((offset) => fetchPage(offset)));
  const parsed = pages
    .flat()
    .map(parseGammaEvent)
    .filter((m): m is DailyMarket => m !== null);
  const markets = uniqueByDate(parsed);
  cache = { at: Date.now(), markets };
  return markets;
}
