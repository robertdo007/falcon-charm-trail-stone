import { asNumber, etDateKey, parseJsonArray } from "./utils";

export const BTC_DAILY_SERIES_ID = "41";
export const POLYMARKET_EVENT_URL = "https://polymarket.com/event";

export type Outcome = "Up" | "Down" | "Tie";
export type MarketPhase = "live" | "next" | "settled";

export type DailyMarket = {
  id: string;
  slug: string;
  title: string;
  date: string;
  endAt: string;
  startAt: string | null;
  closed: boolean;
  winner: Outcome | null;
  upPrice: number | null;
  downPrice: number | null;
  volume: number;
  btcOpen: number | null;
  btcClose: number | null;
  url: string;
};

export type DailyStats = {
  resolved: number;
  upDays: number;
  downDays: number;
  ties: number;
  upPct: number;
  volume: number;
  currentStreak: { outcome: Outcome; length: number } | null;
  longestUp: number;
  longestDown: number;
  avgAbsMove: number | null;
};

type GammaMarket = {
  id?: unknown;
  slug?: unknown;
  question?: unknown;
  outcomes?: unknown;
  outcomePrices?: unknown;
  volume?: unknown;
  volumeNum?: unknown;
  volumeClob?: unknown;
  closed?: unknown;
  endDate?: unknown;
  eventStartTime?: unknown;
  startDate?: unknown;
};

type GammaEvent = {
  id?: unknown;
  slug?: unknown;
  title?: unknown;
  closed?: unknown;
  endDate?: unknown;
  startTime?: unknown;
  startDate?: unknown;
  volume?: unknown;
  volume24hr?: unknown;
  eventMetadata?: unknown;
  markets?: unknown;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function pickWinner(
  outcomes: string[],
  prices: number[],
  closed: boolean,
): Outcome | null {
  if (!closed) return null;
  const upIdx = outcomes.findIndex((o) => o.toLowerCase() === "up");
  const downIdx = outcomes.findIndex((o) => o.toLowerCase() === "down");
  const up = upIdx >= 0 ? (prices[upIdx] ?? 0) : 0;
  const down = downIdx >= 0 ? (prices[downIdx] ?? 0) : 0;
  if (up >= 0.99 && down <= 0.01) return "Up";
  if (down >= 0.99 && up <= 0.01) return "Down";
  if (Math.abs(up - down) < 0.05) return "Tie";
  return up > down ? "Up" : "Down";
}

function metadataPrices(raw: unknown): {
  open: number | null;
  close: number | null;
} {
  if (!raw || typeof raw !== "object") return { open: null, close: null };
  const rec = raw as Record<string, unknown>;
  return {
    open: asNumber(rec.priceToBeat),
    close: asNumber(rec.finalPrice),
  };
}

export function parseGammaEvent(raw: unknown): DailyMarket | null {
  if (!raw || typeof raw !== "object") return null;
  const event = raw as GammaEvent;
  const slug = asString(event.slug);
  if (!slug || !slug.startsWith("bitcoin-up-or-down-on-")) return null;

  const markets = Array.isArray(event.markets)
    ? (event.markets as GammaMarket[])
    : [];
  const market = markets[0] ?? {};
  const outcomes = parseJsonArray<string>(market.outcomes);
  const prices = parseJsonArray<string | number>(market.outcomePrices).map(
    (p) => asNumber(p) ?? 0,
  );
  const closed = Boolean(event.closed ?? market.closed);
  const endAt = asString(event.endDate) ?? asString(market.endDate);
  if (!endAt) return null;

  const upIdx = outcomes.findIndex((o) => o.toLowerCase() === "up");
  const downIdx = outcomes.findIndex((o) => o.toLowerCase() === "down");
  const { open, close } = metadataPrices(event.eventMetadata);

  return {
    id: asString(event.id) ?? slug,
    slug,
    title: asString(event.title) ?? asString(market.question) ?? slug,
    date: etDateKey(endAt),
    endAt,
    startAt:
      asString(event.startTime) ??
      asString(market.eventStartTime) ??
      asString(event.startDate),
    closed,
    winner: pickWinner(outcomes, prices, closed),
    upPrice: upIdx >= 0 ? (prices[upIdx] ?? null) : null,
    downPrice: downIdx >= 0 ? (prices[downIdx] ?? null) : null,
    volume:
      asNumber(event.volume) ??
      asNumber(market.volume) ??
      asNumber(market.volumeNum) ??
      asNumber(market.volumeClob) ??
      asNumber(event.volume24hr) ??
      0,
    btcOpen: open,
    btcClose: close,
    url: `${POLYMARKET_EVENT_URL}/${slug}`,
  };
}

export function uniqueByDate(markets: DailyMarket[]): DailyMarket[] {
  const map = new Map<string, DailyMarket>();
  for (const m of markets) {
    const prev = map.get(m.date);
    if (!prev || m.volume > prev.volume) map.set(m.date, m);
  }
  return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function marketPhase(
  market: DailyMarket,
  now = Date.now(),
): MarketPhase {
  if (market.closed) return "settled";
  const end = Date.parse(market.endAt);
  const start = market.startAt ? Date.parse(market.startAt) : end - 86_400_000;
  if (Number.isFinite(start) && now < start) return "next";
  if (Number.isFinite(end) && now >= end) return "settled";
  return "live";
}

export function pickHero(markets: DailyMarket[]): DailyMarket | null {
  const now = Date.now();
  const live = markets.find((m) => marketPhase(m, now) === "live");
  if (live) return live;
  const upcoming = markets
    .filter((m) => marketPhase(m, now) === "next")
    .sort((a, b) => Date.parse(a.endAt) - Date.parse(b.endAt));
  return upcoming[0] ?? markets[0] ?? null;
}

export function computeStats(markets: DailyMarket[]): DailyStats {
  const resolved = markets.filter((m) => m.closed && m.winner);
  const upDays = resolved.filter((m) => m.winner === "Up").length;
  const downDays = resolved.filter((m) => m.winner === "Down").length;
  const ties = resolved.filter((m) => m.winner === "Tie").length;
  const volume = markets.reduce((s, m) => s + m.volume, 0);

  let longestUp = 0;
  let longestDown = 0;
  let run = 0;
  let runOutcome: Outcome | null = null;
  const chronological = [...resolved].reverse();
  for (const m of chronological) {
    if (m.winner === runOutcome) {
      run += 1;
    } else {
      runOutcome = m.winner;
      run = 1;
    }
    if (runOutcome === "Up") longestUp = Math.max(longestUp, run);
    if (runOutcome === "Down") longestDown = Math.max(longestDown, run);
  }

  const newest = resolved[0];
  let currentStreak: DailyStats["currentStreak"] = null;
  if (newest?.winner) {
    let length = 0;
    for (const m of resolved) {
      if (m.winner !== newest.winner) break;
      length += 1;
    }
    currentStreak = { outcome: newest.winner, length };
  }

  const moves = resolved
    .map((m) =>
      m.btcOpen && m.btcClose
        ? Math.abs((m.btcClose - m.btcOpen) / m.btcOpen) * 100
        : null,
    )
    .filter((n): n is number => n !== null);
  const avgAbsMove =
    moves.length > 0 ? moves.reduce((s, n) => s + n, 0) / moves.length : null;

  return {
    resolved: resolved.length,
    upDays,
    downDays,
    ties,
    upPct: resolved.length ? (upDays / resolved.length) * 100 : 0,
    volume,
    currentStreak,
    longestUp,
    longestDown,
    avgAbsMove,
  };
}

export function changePct(market: DailyMarket): number | null {
  if (!market.btcOpen || !market.btcClose) return null;
  return ((market.btcClose - market.btcOpen) / market.btcOpen) * 100;
}

export function toCsv(markets: DailyMarket[]): string {
  const header = [
    "date",
    "outcome",
    "status",
    "btc_open",
    "btc_close",
    "change_pct",
    "volume_usd",
    "up_price",
    "down_price",
    "slug",
    "url",
  ];
  const rows = markets.map((m) => {
    const pct = changePct(m);
    return [
      m.date,
      m.winner ?? "",
      m.closed ? "resolved" : "open",
      m.btcOpen ?? "",
      m.btcClose ?? "",
      pct === null ? "" : pct.toFixed(4),
      m.volume.toFixed(2),
      m.upPrice ?? "",
      m.downPrice ?? "",
      m.slug,
      m.url,
    ].join(",");
  });
  return [header.join(","), ...rows].join("\n");
}
