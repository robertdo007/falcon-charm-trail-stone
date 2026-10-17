import { asNumber, etDateKey, etDateTimeKey, parseJsonArray } from "./utils";

export const BTC_DAILY_SERIES_ID = "41";
export const POLYMARKET_EVENT_URL = "https://polymarket.com/event";

export type Timeframe = "1d" | "1h" | "15m";

export function parseTimeframe(value: unknown): Timeframe {
  if (value === "1h" || value === "15m" || value === "1d") return value;
  if (value && typeof value === "object" && "tf" in value) {
    return parseTimeframe((value as { tf?: unknown }).tf);
  }
  return "1d";
}

export const TIMEFRAMES: Record<
  Timeframe,
  {
    seriesId: string;
    slugPrefix: string;
    slugExclude?: string;
    pages: number;
    label: string;
    title: string;
    command: string;
    unit: string;
    blurb: string;
    resolveNote: string;
    footer: string;
    spanMinutes: number;
    leadMinutes: number;
  }
> = {
  "1d": {
    seriesId: BTC_DAILY_SERIES_ID,
    slugPrefix: "bitcoin-up-or-down-on-",
    pages: 8,
    label: "1D",
    title: "BTC Daily Tape",
    command: "check1d",
    unit: "days",
    blurb:
      "Every Bitcoin Up or Down daily market, resolved against Binance noon ET. Run check1d to find the longest recent tape that already printed in this history.",
    resolveNote: "Resolves on Binance BTC/USDT noon ET close vs prior noon.",
    footer:
      "Not financial advice. check1d uses Polymarket noon-ET settlements, not Binance calendar-day candles.",
    spanMinutes: 0,
    leadMinutes: 0,
  },
  "1h": {
    seriesId: "10114",
    slugPrefix: "bitcoin-up-or-down-",
    slugExclude: "bitcoin-up-or-down-on-",
    pages: 8,
    label: "1H",
    title: "BTC 1h Tape",
    command: "check1h",
    unit: "hours",
    blurb:
      "Bitcoin Up or Down hourly markets on the Binance BTC/USDT 1H candle. Run check1h to search that live streak through the full archive, about 80,000 hours since 2017.",
    resolveNote: "Resolves on the Binance BTC/USDT 1 hour candle: close vs open.",
    footer:
      "Not financial advice. check1h counts hits in the Binance 1H archive. The streak itself is the latest settled Polymarket hours.",
    spanMinutes: 60,
    leadMinutes: 70,
  },
  "15m": {
    seriesId: "10192",
    slugPrefix: "btc-updown-15m-",
    pages: 12,
    label: "15m",
    title: "BTC 15m Tape",
    command: "check15m",
    unit: "windows",
    blurb:
      "Bitcoin Up or Down 15-minute windows, settled on Chainlink BTC/USD. Run check15m on this tape — the latest stretch Polymarket has published, not the full archive.",
    resolveNote:
      "Resolves on Chainlink BTC/USD at the end of the 15-minute window vs the open.",
    footer:
      "Not financial advice. check15m uses Polymarket settlements on Chainlink BTC/USD.",
    spanMinutes: 15,
    leadMinutes: 20,
  },
};

export type LiveQuote = {
  open: number | null;
  current: number | null;
};

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
  open: number | null,
  close: number | null,
  officialClosed: boolean,
  upOnEqual: boolean,
): Outcome | null {
  if (open != null && close != null) {
    if (close > open) return "Up";
    if (close < open) return "Down";
    return upOnEqual ? "Up" : "Tie";
  }
  const upIdx = outcomes.findIndex((o) => o.toLowerCase() === "up");
  const downIdx = outcomes.findIndex((o) => o.toLowerCase() === "down");
  const up = upIdx >= 0 ? (prices[upIdx] ?? 0) : 0;
  const down = downIdx >= 0 ? (prices[downIdx] ?? 0) : 0;
  if (up >= 0.99 && down <= 0.01) return "Up";
  if (down >= 0.99 && up <= 0.01) return "Down";
  if (!officialClosed) return null;
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

export function parseGammaEvent(
  raw: unknown,
  tf: Timeframe = "1d",
): DailyMarket | null {
  if (!raw || typeof raw !== "object") return null;
  const event = raw as GammaEvent;
  const slug = asString(event.slug);
  const spec = TIMEFRAMES[tf];
  if (!slug || !slug.startsWith(spec.slugPrefix)) return null;
  if (spec.slugExclude && slug.startsWith(spec.slugExclude)) return null;

  const markets = Array.isArray(event.markets)
    ? (event.markets as GammaMarket[])
    : [];
  const market = markets[0] ?? {};
  const outcomes = parseJsonArray<string>(market.outcomes);
  const prices = parseJsonArray<string | number>(market.outcomePrices).map(
    (p) => asNumber(p) ?? 0,
  );
  const endAt = asString(event.endDate) ?? asString(market.endDate);
  if (!endAt) return null;

  const upIdx = outcomes.findIndex((o) => o.toLowerCase() === "up");
  const downIdx = outcomes.findIndex((o) => o.toLowerCase() === "down");
  const { open, close } = metadataPrices(event.eventMetadata);
  const officialClosed = Boolean(event.closed ?? market.closed);
  const winner = pickWinner(
    outcomes,
    prices,
    open,
    close,
    officialClosed,
    tf === "1h",
  );
  const closed = officialClosed || winner !== null;
  const startAt =
    asString(event.startTime) ??
    asString(market.eventStartTime) ??
    asString(event.startDate);

  return {
    id: asString(event.id) ?? slug,
    slug,
    title: asString(event.title) ?? asString(market.question) ?? slug,
    date: sessionKey(tf, slug, endAt, startAt),
    endAt,
    startAt,
    closed,
    winner,
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

function sessionKey(
  tf: Timeframe,
  slug: string,
  endAt: string,
  startAt: string | null,
): string {
  if (tf === "1d") return etDateKey(endAt);
  if (tf === "15m") {
    const stamp = slug.match(/-(\d{9,})$/)?.[1];
    const iso = stamp
      ? new Date(Number(stamp) * 1000).toISOString()
      : (startAt ?? endAt);
    return etDateTimeKey(iso);
  }
  const startMs = startAt
    ? Date.parse(startAt)
    : Date.parse(endAt) - TIMEFRAMES[tf].spanMinutes * 60_000;
  return etDateTimeKey(new Date(startMs).toISOString());
}

export function trimUpcoming(
  markets: DailyMarket[],
  tf: Timeframe,
  now = Date.now(),
): DailyMarket[] {
  const lead = TIMEFRAMES[tf].leadMinutes;
  if (lead <= 0) return markets;
  const horizon = now + lead * 60_000;
  return markets.filter((m) => {
    if (m.closed || marketPhase(m, now) !== "next") return true;
    const start = m.startAt ? Date.parse(m.startAt) : Number.POSITIVE_INFINITY;
    return start <= horizon;
  });
}

export function uniqueByDate(markets: DailyMarket[]): DailyMarket[] {
  const map = new Map<string, DailyMarket>();
  for (const m of markets) {
    const prev = map.get(m.date);
    if (!prev) {
      map.set(m.date, m);
      continue;
    }
    if (m.closed !== prev.closed) {
      map.set(m.date, m.closed ? m : prev);
      continue;
    }
    if (m.volume > prev.volume) map.set(m.date, m);
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
