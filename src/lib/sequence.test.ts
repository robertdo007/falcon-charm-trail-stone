import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sequenceFromTime, vietnamLocalToUtc, type FrameTape } from "./sequence.ts";

const HOUR = 3_600_000;
const T0 = Date.parse("2026-10-22T10:00:00.000Z");
const tape: FrameTape = {
  dirs: ["up", "down", "up", "up"],
  times: [T0, T0 + HOUR, T0 + 2 * HOUR, T0 + 3 * HOUR],
  from: null,
  to: null,
};
const now = T0 + 4 * HOUR + 60_000; // every candle in the tape has closed

describe("sequenceFromTime", () => {
  it("slices from the hour containing the start through the last closed candle", () => {
    const result = sequenceFromTime(tape, "1h", T0 + HOUR + 20 * 60_000, now);
    assert.deepEqual(result, { dirs: ["down", "up", "up"], from: T0 + HOUR, to: T0 + 3 * HOUR });
  });
  it("names the archive end in Vietnam time when the start is too late", () => {
    const startMs = vietnamLocalToUtc("2026-10-23T05:00");
    assert.ok(startMs !== null);
    const result = sequenceFromTime(tape, "1h", startMs, now);
    assert.deepEqual(result, {
      error: "That time is after the latest closed candle (opened 22/10/2026 20:00, Vietnam time).",
    });
  });
});
