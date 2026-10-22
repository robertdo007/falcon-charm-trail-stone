export type TapeDir = "up" | "down" | "flat";
export type Frame = "1h" | "4h" | "1d";

export const FRAMES: { id: Frame; label: string; hint: string }[] = [
  { id: "1h", label: "1H", hint: "one Binance hour" },
  { id: "4h", label: "4H", hint: "the 4-hour archive" },
  { id: "1d", label: "1D", hint: "one UTC day" },
];

type Hour = { t: number; open: number; close: number; dir: TapeDir };

export type FrameTape = {
  dirs: TapeDir[];
  times: number[];
  from: string | null;
  to: string | null;
};

export const FRAME_MS: Record<Frame, number> = {
  "1h": 3_600_000,
  "4h": 14_400_000,
  "1d": 86_400_000,
};

export type NextStat = {
  frame: Frame;
  pattern: TapeDir[];
  total: number;
  countUp: number;
  countDown: number;
  countFlat: number;
  next: TapeDir | "tie" | null;
  candles: number;
  from: string | null;
  to: string | null;
};

const WORD: Record<string, TapeDir> = {
  up: "up",
  u: "up",
  "+": "up",
  "1": "up",
  long: "up",
  len: "up",
  lên: "up",
  down: "down",
  d: "down",
  "-": "down",
  "0": "down",
  short: "down",
  xuong: "down",
  xuống: "down",
  flat: "flat",
  f: "flat",
  "=": "flat",
};

export function parseSequence(raw: string): TapeDir[] | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;
  const tokens = /[\s,;|/]+/.test(text)
    ? text.split(/[\s,;|/]+/).filter(Boolean)
    : [...text];
  const dirs: TapeDir[] = [];
  for (const token of tokens) {
    const dir = WORD[token];
    if (!dir) return null;
    dirs.push(dir);
  }
  return dirs.length > 0 ? dirs : null;
}

export function parseHourlyCsv(text: string): Hour[] {
  const lines = text.split("\n");
  const hours: Hour[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < 5) continue;
    const t = Date.parse(parts[0] ?? "");
    const close = Number(parts[1]);
    const change = Number(parts[2]);
    const dir = parts[4]?.trim();
    if (!Number.isFinite(t) || !Number.isFinite(close) || !Number.isFinite(change)) {
      continue;
    }
    if (dir !== "up" && dir !== "down" && dir !== "flat") continue;
    hours.push({ t, open: close - change, close, dir });
  }
  hours.sort((a, b) => a.t - b.t);
  return hours;
}

function stamp(t: number): string {
  return new Date(t).toISOString().replace(".000Z", "Z");
}

function dirsOf(hours: Hour[]): FrameTape {
  return {
    dirs: hours.map((h) => h.dir),
    times: hours.map((h) => h.t),
    from: hours[0] ? stamp(hours[0].t) : null,
    to: hours[hours.length - 1] ? stamp(hours[hours.length - 1].t) : null,
  };
}

function resample(hours: Hour[], spanHours: number): FrameTape {
  const byTime = new Map<number, Hour>();
  for (const hour of hours) byTime.set(hour.t, hour);
  const span = spanHours * 3_600_000;
  const step = 3_600_000;
  const seen = new Set<number>();
  const out: Hour[] = [];
  for (const hour of hours) {
    const start = Math.floor(hour.t / span) * span;
    if (seen.has(start)) continue;
    seen.add(start);
    let open = 0;
    let close = 0;
    let complete = true;
    for (let i = 0; i < spanHours; i++) {
      const bar = byTime.get(start + i * step);
      if (!bar) {
        complete = false;
        break;
      }
      if (i === 0) open = bar.open;
      close = bar.close;
    }
    if (!complete) continue;
    const dir: TapeDir = close > open ? "up" : close < open ? "down" : "flat";
    out.push({ t: start, open, close, dir });
  }
  return dirsOf(out);
}

export function tapesFromHours(hours: Hour[]): Record<Frame, FrameTape> {
  return {
    "1h": dirsOf(hours),
    "4h": resample(hours, 4),
    "1d": resample(hours, 24),
  };
}

export function nextAfter(dirs: TapeDir[], pattern: TapeDir[]): Omit<
  NextStat,
  "frame" | "candles" | "from" | "to"
> {
  let total = 0;
  let countUp = 0;
  let countDown = 0;
  let countFlat = 0;
  const plen = pattern.length;
  const last = dirs.length - plen - 1;
  for (let i = 0; i <= last; i++) {
    let match = true;
    for (let j = 0; j < plen; j++) {
      if (dirs[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (!match) continue;
    const next = dirs[i + plen];
    total += 1;
    if (next === "up") countUp += 1;
    else if (next === "down") countDown += 1;
    else countFlat += 1;
  }
  const top = Math.max(countUp, countDown, countFlat);
  const winners = [
    countUp === top ? "up" : null,
    countDown === top ? "down" : null,
    countFlat === top ? "flat" : null,
  ].filter((d): d is TapeDir => d !== null);
  return {
    pattern,
    total,
    countUp,
    countDown,
    countFlat,
    next: total === 0 ? null : winners.length === 1 ? winners[0] : "tie",
  };
}

const VN_OFFSET_MS = 7 * 3_600_000;
const MAX_SLICE = 300;

export function vietnamLocalToUtc(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const utc = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
  );
  if (!Number.isFinite(utc)) return null;
  return utc - VN_OFFSET_MS;
}

export function sequenceFromTime(
  tape: FrameTape,
  frame: Frame,
  startMs: number,
  now = Date.now(),
): { dirs: TapeDir[]; from: number; to: number } | { error: string } {
  const span = FRAME_MS[frame];
  let end = -1;
  for (let i = tape.times.length - 1; i >= 0; i--) {
    if (tape.times[i] + span <= now) {
      end = i;
      break;
    }
  }
  if (end < 0) return { error: "No closed candle in this archive yet." };

  let start = -1;
  for (let i = 0; i <= end; i++) {
    const open = tape.times[i];
    if (open <= startMs && startMs < open + span) {
      start = i;
      break;
    }
    if (open >= startMs) {
      start = i;
      break;
    }
  }
  if (start < 0) return { error: "That time is after the latest closed candle." };

  const dirs = tape.dirs.slice(start, end + 1);
  if (dirs.length > MAX_SLICE) {
    return {
      error: `That range is ${dirs.length} candles. Pick a start within the last 300 candles.`,
    };
  }
  return { dirs, from: tape.times[start], to: tape.times[end] };
}

let cached: Promise<Record<Frame, FrameTape>> | null = null;

function fetchCsv(path: string): Promise<string> {
  return fetch(path).then((res) => {
    if (!res.ok) throw new Error(`${path} ${res.status}`);
    return res.text();
  });
}

export function loadTapes(): Promise<Record<Frame, FrameTape>> {
  cached ??= Promise.all([
    fetchCsv("/btc_1h_analysis.csv"),
    fetchCsv("/btc_4h_analysis.csv"),
  ]).then(([hourText, fourText]) => {
    const hours = parseHourlyCsv(hourText);
    return {
      "1h": dirsOf(hours),
      "4h": dirsOf(parseHourlyCsv(fourText)),
      "1d": resample(hours, 24),
    };
  });
  return cached;
}
