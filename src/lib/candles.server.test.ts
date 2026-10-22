import { afterEach, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CSV_HEADER } from "./candles-csv.ts";
import { getCandleTail } from "./candles.server.ts";

const HOUR = 3_600_000;
const T0 = Date.parse("2026-10-16T08:00:00.000Z");
const SEED =
  `${CSV_HEADER}\n` +
  "2026-10-16T08:00:00.000Z,82248.09,-41.91,-0.0509,down\n" +
  "2026-10-16T09:00:00.000Z,82066.01,-182.08,-0.2214,down\n";
const kline = (t: number, open: string, close: string) => [t, open, "0", "0", close, "0"];

let dir = "";
let clock = T0;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "candles-"));
  process.env.CANDLE_DIR = dir;
  await writeFile(join(dir, "btc_1h_analysis.csv"), SEED);
  await writeFile(join(dir, "btc_4h_analysis.csv"), SEED);
  clock += HOUR; // move past the retry throttle between tests
  mock.method(Date, "now", () => clock);
});

afterEach(() => {
  mock.restoreAll();
  delete process.env.CANDLE_DIR;
});

describe("getCandleTail", () => {
  it("appends closed candles from Binance to the csv and returns only the new rows", async () => {
    clock = T0 + 4 * HOUR + 60_000; // 12:01 — candles 10:00 and 11:00 are closed, 12:00 is open
    const calls: string[] = [];
    mock.method(globalThis, "fetch", async (url: string) => {
      calls.push(String(url));
      return Response.json([
        kline(T0 + 2 * HOUR, "82066.01", "82100.51"),
        kline(T0 + 3 * HOUR, "82100.51", "82000.00"),
        kline(T0 + 4 * HOUR, "82000.00", "82500.00"),
      ]);
    });

    const result = await getCandleTail("1h", T0 + HOUR);
    assert.equal(result.added, 2);
    assert.equal(result.stale, false);
    assert.equal(
      result.csv,
      `${CSV_HEADER}\n2026-10-16T10:00:00.000Z,82100.51,34.50,0.0420,up\n2026-10-16T11:00:00.000Z,82000.00,-100.51,-0.1224,down\n`,
    );
    assert.match(calls[0], /interval=1h/);
    assert.match(calls[0], new RegExp(`startTime=${T0 + 2 * HOUR}\\b`));
    const saved = await readFile(join(dir, "btc_1h_analysis.csv"), "utf8");
    assert.equal(saved, SEED + result.csv.slice(CSV_HEADER.length + 1));
  });

  it("does not call Binance when the archive is already current", async () => {
    clock = T0 + 2 * HOUR + 60_000; // the 10:00 candle has not closed yet
    const fetchMock = mock.method(globalThis, "fetch", async () => Response.json([]));
    const result = await getCandleTail("1h", 0);
    assert.equal(fetchMock.mock.callCount(), 0);
    assert.equal(result.added, 0);
    assert.equal(result.csv, SEED);
  });

  it("serves the existing rows and flags stale when Binance fails", async () => {
    clock = T0 + 10 * HOUR; // 4H span: the candle after 09:00 closes at 21:00, so 18:00 needs data
    mock.method(globalThis, "fetch", async () => new Response("blocked", { status: 451 }));
    const result = await getCandleTail("4h", T0);
    assert.equal(result.stale, true);
    assert.equal(result.added, 0);
    assert.equal(
      result.csv,
      `${CSV_HEADER}\n2026-10-16T09:00:00.000Z,82066.01,-182.08,-0.2214,down\n`,
    );
    assert.equal(await readFile(join(dir, "btc_4h_analysis.csv"), "utf8"), SEED);
  });
});
