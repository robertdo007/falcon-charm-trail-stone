import { useMemo, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import {
  findLongestCheck1d,
  isCheck1dCommand,
  type PatternHit,
  type TapeDir,
} from "@/lib/check1d";
import type { DailyMarket } from "@/lib/polymarket";
import { OutcomeBadge } from "./outcome-badge";

export function Check1dPanel({ markets }: { markets: DailyMarket[] }) {
  const [input, setInput] = useState("");
  const [ran, setRan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const result = useMemo(
    () => (ran ? findLongestCheck1d(markets) : null),
    [ran, markets],
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isCheck1dCommand(input)) {
      setError("Type check1d then run. Uses Polymarket daily Up/Down tape.");
      setRan(false);
      return;
    }
    setError(null);
    setRan(true);
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5 shadow-panel md:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-subtle">
            Command
          </p>
          <h2 className="mt-1 text-lg font-medium tracking-tight">check1d</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Pull the live Polymarket daily tape, take the latest Up/Down streak,
            and grow it until that sequence no longer appears in history.
          </p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-4 flex flex-col gap-2 sm:flex-row"
      >
        <label className="sr-only" htmlFor="check1d-cmd">
          Command
        </label>
        <input
          id="check1d-cmd"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="check1d"
          autoComplete="off"
          className="min-h-11 flex-1 rounded-md border border-line bg-raised px-3 font-mono text-sm text-fg outline-none placeholder:text-subtle focus:border-accent"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity duration-150 hover:opacity-90"
        >
          <Search className="size-4" strokeWidth={2} />
          Run
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-down">{error}</p> : null}

      {result ? <Check1dResultView result={result} /> : null}
    </section>
  );
}

function Check1dResultView({
  result,
}: {
  result: ReturnType<typeof findLongestCheck1d>;
}) {
  if (result.history.length === 0) {
    return (
      <p className="mt-5 text-sm text-muted">
        No repeating pattern in {result.seriesLength} settled Polymarket days.
      </p>
    );
  }

  const longest = result.longest;
  const lean =
    result.signal === "Up"
      ? "Next day leaned Up after this tape"
      : result.signal === "Down"
        ? "Next day leaned Down after this tape"
        : "No edge after this tape";

  return (
    <div className="mt-5 flex flex-col gap-5">
      <div className="rounded-lg border border-line bg-raised p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-subtle">
              Longest hit · {result.seriesLength} settled days
            </p>
            <p className="mt-1 text-sm text-muted">
              {result.from} → {result.to}
            </p>
          </div>
          {longest ? (
            <div className="flex items-center gap-2">
              <OutcomeBadge outcome={result.signal} />
              <span className="font-mono text-sm tabular-nums text-muted">
                {longest.total} hits · score {longest.score}
              </span>
            </div>
          ) : null}
        </div>
        {longest ? (
          <>
            <DirTape dirs={longest.patternDirs} />
            <p className="mt-3 text-sm text-muted">{lean}</p>
            <p className="mt-1 font-mono text-xs tabular-nums text-subtle">
              Up {longest.up}% ({longest.countUp}) · Down {longest.down}% (
              {longest.countDown})
              {longest.countFlat > 0
                ? ` · Flat ${longest.flat}% (${longest.countFlat})`
                : ""}
            </p>
          </>
        ) : null}
      </div>

      <ol className="flex flex-col gap-2">
        {[...result.history].reverse().map((hit) => (
          <PatternRow key={hit.length} hit={hit} highlight={hit === longest} />
        ))}
      </ol>
    </div>
  );
}

function PatternRow({
  hit,
  highlight,
}: {
  hit: PatternHit;
  highlight: boolean;
}) {
  return (
    <li
      className={[
        "rounded-md border px-3 py-3",
        highlight ? "border-accent/30 bg-raised" : "border-line bg-bg",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-wider text-subtle">
          Length {hit.length}
        </p>
        <p className="font-mono text-xs tabular-nums text-muted">
          {hit.total} times · score {hit.score}
        </p>
      </div>
      <p className="mt-1 break-all font-mono text-xs text-fg">{hit.pattern}</p>
      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-up" style={{ width: `${hit.up}%` }} />
        <div className="h-full bg-down" style={{ width: `${hit.down}%` }} />
      </div>
      <p className="mt-2 font-mono text-xs tabular-nums text-subtle">
        Up {hit.up}% ({hit.countUp}) · Down {hit.down}% ({hit.countDown})
      </p>
    </li>
  );
}

function DirTape({ dirs }: { dirs: TapeDir[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1">
      {dirs.map((d, i) => (
        <span
          key={`${d}-${i}`}
          className={[
            "inline-flex min-w-9 items-center justify-center rounded-full px-2 py-0.5 font-mono text-xs uppercase",
            d === "up" && "bg-up-dim text-up",
            d === "down" && "bg-down-dim text-down",
            d === "flat" && "bg-raised text-muted",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {d}
        </span>
      ))}
    </div>
  );
}
