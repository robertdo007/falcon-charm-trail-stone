// Pure helpers (no I/O, safe in browser and server) for the BTC candle archives in public/*.csv.
// Row format: date (candle OPEN time, ISO UTC),close,change (close-open),change_percent,direction.

export type CandleFrame = "1h" | "4h";

export const CSV_HEADER = "date,close,change,change_percent,direction";

export const CANDLE_SPAN_MS: Record<CandleFrame, number> = {
  "1h": 3_600_000,
  "4h": 14_400_000,
};

/** Open time (ms) of the last data row, or null for an empty / header-only file. */
export function lastOpenTime(csv: string): number | null {
  let end = csv.length;
  while (end > 0 && (csv[end - 1] === "\n" || csv[end - 1] === "\r")) end -= 1;
  if (end === 0) return null;
  const start = csv.lastIndexOf("\n", end - 1) + 1;
  const first = csv.slice(start, end).split(",")[0] ?? "";
  const t = Date.parse(first);
  return Number.isFinite(t) ? t : null;
}

/** True once the candle after `lastOpen` has fully closed, i.e. the archive is missing data. */
export function needsUpdate(lastOpen: number, spanMs: number, now: number): boolean {
  return lastOpen + 2 * spanMs <= now;
}

/**
 * Binance klines ([openTime, open, high, low, close, ...]) -> CSV rows.
 * Keeps only candles opened after `afterOpen` that have fully closed by `now`.
 */
export function klinesToRows(
  klines: unknown,
  spanMs: number,
  afterOpen: number,
  now: number,
): string[] {
  if (!Array.isArray(klines)) return [];
  const rows: string[] = [];
  for (const kline of klines) {
    if (!Array.isArray(kline)) continue;
    const t = Number(kline[0]);
    const open = Number(kline[1]);
    const close = Number(kline[4]);
    if (!Number.isFinite(t) || !Number.isFinite(open) || !Number.isFinite(close)) continue;
    if (t <= afterOpen || t + spanMs > now) continue;
    const cents = Math.round(close * 100) - Math.round(open * 100);
    const dir = cents > 0 ? "up" : cents < 0 ? "down" : "flat";
    rows.push(
      [
        new Date(t).toISOString(),
        close.toFixed(2),
        (cents / 100).toFixed(2),
        ((cents / 100 / open) * 100).toFixed(4),
        dir,
      ].join(","),
    );
  }
  return rows;
}

export function appendRows(csv: string, rows: string[]): string {
  if (rows.length === 0) return csv;
  const base = csv.trim() === "" ? `${CSV_HEADER}\n` : csv.endsWith("\n") ? csv : `${csv}\n`;
  return `${base}${rows.join("\n")}\n`;
}

/** Header plus every data row whose open time is strictly after `afterMs`. */
export function tailOf(csv: string, afterMs: number): string {
  const lines = csv.split("\n");
  const out: string[] = [];
  for (let i = lines.length - 1; i >= 1; i -= 1) {
    const line = lines[i];
    if (!line) continue;
    const t = Date.parse(line.slice(0, line.indexOf(",")));
    if (!Number.isFinite(t)) continue;
    if (t <= afterMs) break;
    out.push(line);
  }
  out.reverse();
  return `${CSV_HEADER}\n${out.length ? `${out.join("\n")}\n` : ""}`;
}

/** Drop the header line from a CSV chunk. */
export function withoutHeader(csv: string): string {
  const nl = csv.indexOf("\n");
  return nl === -1 ? "" : csv.slice(nl + 1);
}
