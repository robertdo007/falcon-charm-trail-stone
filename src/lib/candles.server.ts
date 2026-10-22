import { access, copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  appendRows,
  CANDLE_SPAN_MS,
  klinesToRows,
  lastOpenTime,
  needsUpdate,
  tailOf,
  type CandleFrame,
} from "./candles-csv.ts";

// Keeps public/btc_{1h,4h}_analysis.csv current. Every request checks the last candle in the file;
// if a newer candle has already closed on Binance, the missing candles are fetched and appended.
// Production (Docker) serves the files from .output/public; set CANDLE_DIR (e.g. a Railway volume)
// to keep appended candles across redeploys. If the file cannot be written the fresh candles are
// still returned to the caller, just not persisted.

const FILE_NAME: Record<CandleFrame, string> = {
  "1h": "btc_1h_analysis.csv",
  "4h": "btc_4h_analysis.csv",
};
const KLINES_URL = "https://data-api.binance.vision/api/v3/klines";
const PAGE_LIMIT = 1000;
const MAX_PAGES = 5;
const RETRY_AFTER_MS = 15_000;

type Refreshed = { csv: string; added: number; stale: boolean };

const inflight = new Map<CandleFrame, Promise<Refreshed>>();
const lastAttempt = new Map<CandleFrame, number>();

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function bundledDirs(): string[] {
  return [join(process.cwd(), ".output", "public"), join(process.cwd(), "public")];
}

async function resolveFile(frame: CandleFrame): Promise<string | null> {
  const name = FILE_NAME[frame];
  let seed: string | null = null;
  for (const dir of bundledDirs()) {
    if (await exists(join(dir, name))) {
      seed = join(dir, name);
      break;
    }
  }
  const custom = process.env.CANDLE_DIR?.trim();
  if (!custom) return seed;
  const target = join(custom, name);
  if (await exists(target)) return target;
  if (!seed) return null;
  try {
    await mkdir(custom, { recursive: true });
    await copyFile(seed, target);
    return target;
  } catch {
    return seed;
  }
}

async function writeAtomic(path: string, text: string): Promise<void> {
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, text, "utf8");
  await rename(tmp, path);
}

async function fetchRows(frame: CandleFrame, lastOpen: number, now: number): Promise<string[]> {
  const span = CANDLE_SPAN_MS[frame];
  const rows: string[] = [];
  let start = lastOpen + span;
  for (let page = 0; page < MAX_PAGES && start + span <= now; page += 1) {
    const url = `${KLINES_URL}?symbol=BTCUSDT&interval=${frame}&startTime=${start}&limit=${PAGE_LIMIT}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`Binance klines ${res.status}`);
    const klines: unknown = await res.json();
    if (!Array.isArray(klines) || klines.length === 0) break;
    rows.push(...klinesToRows(klines, span, start - 1, now));
    if (klines.length < PAGE_LIMIT) break;
    const tail: unknown = klines[klines.length - 1];
    start = Number(Array.isArray(tail) ? tail[0] : Number.NaN) + span;
    if (!Number.isFinite(start)) break;
  }
  return rows;
}

async function refresh(frame: CandleFrame, afterHint: number): Promise<Refreshed> {
  const span = CANDLE_SPAN_MS[frame];
  const path = await resolveFile(frame);
  let csv = path ? await readFile(path, "utf8") : "";
  const last = lastOpenTime(csv) ?? (afterHint > 0 ? afterHint : null);
  const now = Date.now();
  if (last === null || !needsUpdate(last, span, now)) return { csv, added: 0, stale: false };

  if (now - (lastAttempt.get(frame) ?? 0) < RETRY_AFTER_MS) return { csv, added: 0, stale: true };
  lastAttempt.set(frame, now);
  try {
    const rows = await fetchRows(frame, last, now);
    if (rows.length === 0) return { csv, added: 0, stale: false };
    csv = appendRows(csv, rows);
    if (path) await writeAtomic(path, csv).catch(() => undefined);
    return { csv, added: rows.length, stale: false };
  } catch {
    return { csv, added: 0, stale: true };
  }
}

/**
 * Makes sure the archive for `frame` is current, then returns the CSV rows (with header)
 * whose open time is after `afterMs`. `stale` means Binance could not be reached.
 */
export async function getCandleTail(
  frame: CandleFrame,
  afterMs: number,
): Promise<{ csv: string; added: number; stale: boolean }> {
  let job = inflight.get(frame);
  if (!job) {
    job = refresh(frame, afterMs).finally(() => inflight.delete(frame));
    inflight.set(frame, job);
  }
  const { csv, added, stale } = await job;
  return { csv: tailOf(csv, afterMs), added, stale };
}
