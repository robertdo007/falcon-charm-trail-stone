import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  appendRows,
  CSV_HEADER,
  klinesToRows,
  lastOpenTime,
  needsUpdate,
  tailOf,
  withoutHeader,
} from "./candles-csv.ts";

const HOUR = 3_600_000;
const T0 = Date.parse("2026-10-16T08:00:00.000Z");
const CSV =
  `${CSV_HEADER}\n` +
  "2026-10-16T08:00:00.000Z,82248.09,-41.91,-0.0509,down\n" +
  "2026-10-16T09:00:00.000Z,82066.01,-182.08,-0.2214,down\n";

describe("lastOpenTime / needsUpdate", () => {
  it("reads the last row and ignores trailing blank lines", () => {
    assert.equal(lastOpenTime(CSV), T0 + HOUR);
    assert.equal(lastOpenTime(`${CSV}\n\n`), T0 + HOUR);
    assert.equal(lastOpenTime(CSV.replaceAll("\n", "\r\n")), T0 + HOUR);
  });
  it("returns null for empty or header-only files", () => {
    assert.equal(lastOpenTime(""), null);
    assert.equal(lastOpenTime(`${CSV_HEADER}\n`), null);
  });
  it("needs an update only once the next candle has closed", () => {
    const last = T0 + HOUR; // 09:00 candle; the 10:00 candle closes at 11:00
    assert.equal(needsUpdate(last, HOUR, last + 2 * HOUR - 1), false);
    assert.equal(needsUpdate(last, HOUR, last + 2 * HOUR), true);
  });
});

describe("klinesToRows", () => {
  const kline = (t: number, open: string, close: string) => [t, open, "0", "0", close, "0"];
  it("formats closed candles like the existing archive", () => {
    const rows = klinesToRows(
      [kline(T0 + 2 * HOUR, "82066.01", "82100.51"), kline(T0 + 3 * HOUR, "82100.51", "82000.00")],
      HOUR,
      T0 + HOUR,
      T0 + 10 * HOUR,
    );
    assert.deepEqual(rows, [
      "2026-10-16T10:00:00.000Z,82100.51,34.50,0.0420,up",
      "2026-10-16T11:00:00.000Z,82000.00,-100.51,-0.1224,down",
    ]);
  });
  it("skips the still-open candle, old candles and junk; flat when unchanged", () => {
    const now = T0 + 4 * HOUR + 1_000; // the 12:00 candle (T0+4h) is still open
    const rows = klinesToRows(
      [
        kline(T0 + HOUR, "1", "2"), // not after `afterOpen`
        kline(T0 + 3 * HOUR, "100.00", "100.00"),
        kline(T0 + 4 * HOUR, "100.00", "101.00"), // open candle
        ["bad"],
        null,
      ],
      HOUR,
      T0 + HOUR,
      now,
    );
    assert.deepEqual(rows, ["2026-10-16T11:00:00.000Z,100.00,0.00,0.0000,flat"]);
    assert.deepEqual(klinesToRows({ code: -1121 }, HOUR, 0, now), []);
  });
});

describe("appendRows / tailOf / withoutHeader", () => {
  it("appends after the existing rows, adding a newline if needed", () => {
    const row = "2026-10-16T10:00:00.000Z,82100.51,34.50,0.0420,up";
    assert.equal(appendRows(CSV, [row]), `${CSV}${row}\n`);
    assert.equal(appendRows(CSV.trimEnd(), [row]), `${CSV}${row}\n`);
    assert.equal(appendRows(CSV, []), CSV);
    assert.equal(appendRows("", [row]), `${CSV_HEADER}\n${row}\n`);
  });
  it("replaces the last row when it is the same candle (exported while still open)", () => {
    const settled = "2026-10-16T09:00:00.000Z,82018.01,-230.08,-0.2797,down";
    const next = "2026-10-16T10:00:00.000Z,82100.51,82.50,0.1006,up";
    assert.equal(
      appendRows(CSV, [settled, next]),
      `${CSV_HEADER}\n2026-10-16T08:00:00.000Z,82248.09,-41.91,-0.0509,down\n${settled}\n${next}\n`,
    );
  });
  it("returns only rows after the given time, always with a header", () => {
    assert.equal(
      tailOf(CSV, T0),
      `${CSV_HEADER}\n2026-10-16T09:00:00.000Z,82066.01,-182.08,-0.2214,down\n`,
    );
    assert.equal(tailOf(CSV, T0 + HOUR), `${CSV_HEADER}\n`);
    assert.equal(tailOf(CSV, 0), CSV);
  });
  it("strips the header", () => {
    assert.equal(withoutHeader(CSV), CSV.slice(CSV_HEADER.length + 1));
    assert.equal(withoutHeader(CSV_HEADER), "");
  });
});
