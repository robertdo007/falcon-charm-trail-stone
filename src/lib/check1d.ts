import type { DailyMarket, Outcome } from "./polymarket";

export type TapeDir = "up" | "down" | "flat";

export type PatternHit = {
  length: number;
  pattern: string;
  patternDirs: TapeDir[];
  total: number;
  up: number;
  down: number;
  flat: number;
  countUp: number;
  countDown: number;
  countFlat: number;
  score: number;
};

export type Check1dResult = {
  seriesLength: number;
  from: string | null;
  to: string | null;
  current: TapeDir[];
  history: PatternHit[];
  longest: PatternHit | null;
  signal: Outcome | null;
};

function toDir(winner: Outcome): TapeDir {
  if (winner === "Up") return "up";
  if (winner === "Down") return "down";
  return "flat";
}

function isSettled(
  market: DailyMarket,
): market is DailyMarket & { winner: Outcome } {
  return Boolean(market.closed && market.winner);
}

export function settledTape(markets: DailyMarket[]): {
  dates: string[];
  dirs: TapeDir[];
} {
  const settled = [...markets].filter(isSettled).sort((a, b) => (a.date < b.date ? -1 : 1));
  return {
    dates: settled.map((m) => m.date),
    dirs: settled.map((m) => toDir(m.winner)),
  };
}

export function analyzePattern(
  dirs: TapeDir[],
  pattern: TapeDir[],
): { total: number; countUp: number; countDown: number; countFlat: number } {
  let total = 0;
  let countUp = 0;
  let countDown = 0;
  let countFlat = 0;
  const plen = pattern.length;
  const lastStart = dirs.length - plen - 1;
  for (let i = 0; i <= lastStart; i++) {
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
  return { total, countUp, countDown, countFlat };
}

function toHit(
  length: number,
  pattern: TapeDir[],
  stats: ReturnType<typeof analyzePattern>,
): PatternHit {
  const { total, countUp, countDown, countFlat } = stats;
  const pct = (n: number) => (total > 0 ? Number(((n / total) * 100).toFixed(2)) : 0);
  return {
    length,
    pattern: pattern.join(" "),
    patternDirs: pattern,
    total,
    up: pct(countUp),
    down: pct(countDown),
    flat: pct(countFlat),
    countUp,
    countDown,
    countFlat,
    score: countUp - countDown,
  };
}

export function findLongestCheck1d(markets: DailyMarket[]): Check1dResult {
  const { dates, dirs } = settledTape(markets);
  const empty: Check1dResult = {
    seriesLength: dirs.length,
    from: dates[0] ?? null,
    to: dates[dates.length - 1] ?? null,
    current: [],
    history: [],
    longest: null,
    signal: null,
  };
  if (dirs.length < 2) return empty;

  const history: PatternHit[] = [];
  const maxLen = dirs.length - 1;
  for (let length = 1; length <= maxLen; length++) {
    const pattern = dirs.slice(-length);
    const stats = analyzePattern(dirs, pattern);
    if (stats.total === 0) break;
    history.push(toHit(length, pattern, stats));
  }

  const longest = history[history.length - 1] ?? null;
  let signal: Outcome | null = null;
  if (longest && longest.total > 0) {
    if (longest.countUp > longest.countDown) signal = "Up";
    else if (longest.countDown > longest.countUp) signal = "Down";
    else signal = "Tie";
  }

  return {
    seriesLength: dirs.length,
    from: dates[0] ?? null,
    to: dates[dates.length - 1] ?? null,
    current: longest?.patternDirs ?? dirs.slice(-1),
    history,
    longest,
    signal,
  };
}

export function parseHourArchive(text: string): {
  dates: string[];
  dirs: TapeDir[];
} {
  const lines = text.split("\n");
  const dates: string[] = [];
  const dirs: TapeDir[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const first = line.indexOf(",");
    const last = line.lastIndexOf(",");
    if (first <= 0 || last <= first) continue;
    const dir = line.slice(last + 1).trim();
    if (dir !== "up" && dir !== "down" && dir !== "flat") continue;
    dates.push(line.slice(0, first));
    dirs.push(dir);
  }
  return { dates, dirs };
}

export function findLongestInArchive(
  archive: { dates: string[]; dirs: TapeDir[] },
  recent: TapeDir[],
): Check1dResult {
  const { dates, dirs } = archive;
  const probe = recent.length > 0 ? recent : dirs;
  const empty: Check1dResult = {
    seriesLength: dirs.length,
    from: dates[0] ?? null,
    to: dates[dates.length - 1] ?? null,
    current: [],
    history: [],
    longest: null,
    signal: null,
  };
  if (dirs.length < 2 || probe.length < 1) return empty;

  const history: PatternHit[] = [];
  const maxLen = Math.min(probe.length, dirs.length - 1);
  for (let length = 1; length <= maxLen; length++) {
    const pattern = probe.slice(-length);
    const stats = analyzePattern(dirs, pattern);
    if (stats.total === 0) break;
    history.push(toHit(length, pattern, stats));
  }

  const longest = history[history.length - 1] ?? null;
  let signal: Outcome | null = null;
  if (longest && longest.total > 0) {
    if (longest.countUp > longest.countDown) signal = "Up";
    else if (longest.countDown > longest.countUp) signal = "Down";
    else signal = "Tie";
  }

  return {
    seriesLength: dirs.length,
    from: dates[0] ?? null,
    to: dates[dates.length - 1] ?? null,
    current: longest?.patternDirs ?? probe.slice(-1),
    history,
    longest,
    signal,
  };
}

let hourArchive: Promise<{ dates: string[]; dirs: TapeDir[] }> | null = null;

export function loadHourArchive(): Promise<{ dates: string[]; dirs: TapeDir[] }> {
  hourArchive ??= fetch("/btc_1h_analysis.csv")
    .then((res) => {
      if (!res.ok) throw new Error(`Hourly archive ${res.status}`);
      return res.text();
    })
    .then(parseHourArchive);
  return hourArchive;
}

export function isCheck1dCommand(raw: string): boolean {
  return raw.trim().toLowerCase().replace(/\s+/g, "") === "check1d";
}
