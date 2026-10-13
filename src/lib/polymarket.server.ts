import {
  TIMEFRAMES,
  parseGammaEvent,
  trimUpcoming,
  uniqueByDate,
  type DailyMarket,
  type LiveQuote,
  type Timeframe,
} from "./polymarket";
import { asNumber } from "./utils";

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

const QUOTE_VARIANT: Record<Timeframe, string> = {
  "1d": "daily",
  "1h": "hourly",
  "15m": "fifteen",
};

type QuoteCache = { key: string; at: number; quote: LiveQuote };
let quoteCache: QuoteCache | null = null;

function windowStart(tf: Timeframe, endAt: string): string | null {
  const end = Date.parse(endAt);
  if (!Number.isFinite(end)) return null;
  const span =
    tf === "1d" ? 86_400_000 : tf === "1h" ? 3_600_000 : 15 * 60_000;
  return new Date(end - span).toISOString();
}

async function binanceLast(): Promise<number | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8_000);
  try {
    const res = await fetch(
      "https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT",
      { signal: ctrl.signal, headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const body: unknown = await res.json();
    if (!body || typeof body !== "object") return null;
    return asNumber((body as { price?: unknown }).price);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function loadLiveQuote(
  tf: Timeframe,
  endAt: string,
): Promise<LiveQuote> {
  const start = windowStart(tf, endAt);
  const empty: LiveQuote = { open: null, current: null };
  if (!start) return empty;
  const key = `${tf}|${start}|${endAt}`;
  if (quoteCache && quoteCache.key === key && Date.now() - quoteCache.at < 8_000) {
    return quoteCache.quote;
  }

  const url = new URL("https://polymarket.com/api/crypto/crypto-price");
  url.searchParams.set("symbol", "BTC");
  url.searchParams.set("variant", QUOTE_VARIANT[tf]);
  url.searchParams.set("eventStartTime", start);
  url.searchParams.set("endDate", new Date(endAt).toISOString());

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8_000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "btc-daily-tape/1.0",
      },
    });
    if (!res.ok) return empty;
    const body: unknown = await res.json();
    if (!body || typeof body !== "object") return empty;
    const rec = body as { openPrice?: unknown; closePrice?: unknown };
    const open = asNumber(rec.openPrice);
    let current = asNumber(rec.closePrice);
    if (current === null) current = await binanceLast();
    const quote = { open, current };
    quoteCache = { key, at: Date.now(), quote };
    return quote;
  } catch {
    const current = await binanceLast();
    return { open: null, current };
  } finally {
    clearTimeout(timer);
  }
}