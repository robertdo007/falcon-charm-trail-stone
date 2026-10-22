import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
  FRAMES,
  loadTapes,
  nextAfter,
  parseSequence,
  type Frame,
  type NextStat,
  type TapeDir,
} from "@/lib/sequence";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [frame, setFrame] = useState<Frame>("1h");
  const [raw, setRaw] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NextStat | null>(null);

  async function run() {
    const pattern = parseSequence(raw);
    if (!pattern) {
      setResult(null);
      setError("Enter candles as up, down, or flat. Example: up down up up");
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const tapes = await loadTapes();
      const tape = tapes[frame];
      const stat = nextAfter(tape.dirs, pattern);
      setResult({
        frame,
        candles: tape.dirs.length,
        from: tape.from,
        to: tape.to,
        ...stat,
      });
    } catch {
      setResult(null);
      setError("Could not load the hourly archive.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh min-w-0 max-w-3xl flex-col gap-5 px-4 py-6 pb-16 md:px-6 md:py-10">
      <header className="border-b border-line pb-5">
        <p className="font-mono text-xs uppercase tracking-widest text-subtle">
          Binance BTC/USDT
        </p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight md:text-4xl">
          Next candle
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Pick 1H, 4H, or 1D, type a candle sequence, and see which way the
          next candle went every time that sequence already printed.
        </p>
      </header>

      <section className="rounded-xl border border-line bg-surface p-5 shadow-panel md:p-6">
        <div className="flex flex-col gap-4">
          <div className="inline-flex w-fit rounded-md border border-line bg-raised p-1">
            {FRAMES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setFrame(item.id);
                  setResult(null);
                }}
                className={cn(
                  "inline-flex min-h-11 min-w-14 items-center justify-center rounded-sm px-3 text-sm font-medium",
                  frame === item.id ? "bg-accent text-accent-fg" : "text-muted",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-subtle">
              Sequence · {FRAMES.find((item) => item.id === frame)?.hint}
            </span>
            <textarea
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
              rows={3}
              placeholder="up down up up"
              className="min-h-24 w-full resize-y rounded-md border border-line bg-raised px-3 py-3 font-mono text-sm text-fg outline-none placeholder:text-subtle focus:border-accent"
            />
          </label>
          <button
            type="button"
            onClick={() => void run()}
            disabled={running}
            className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity duration-150 hover:opacity-90 disabled:opacity-60"
          >
            <Search className="size-4" strokeWidth={2} />
            {running ? "Searching…" : "Run"}
          </button>
        </div>
        {error ? <p className="mt-4 text-sm text-down">{error}</p> : null}
        {result ? <Result result={result} /> : null}
      </section>

      <footer className="text-xs text-subtle">
        Not financial advice. 4H uses its own archive. 1D is a UTC day built
        from the hourly file. A tie close is flat.
      </footer>
    </main>
  );
}

function Result({ result }: { result: NextStat }) {
  const pct = (n: number) =>
    result.total > 0 ? `${((n / result.total) * 100).toFixed(1)}%` : "—";
  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-line pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-subtle">
            Next
          </p>
          <p
            className={cn(
              "mt-1 font-mono text-4xl font-medium uppercase tracking-tight",
              result.next === "up" && "text-up",
              result.next === "down" && "text-down",
              (result.next === "flat" || result.next === "tie" || result.next === null) &&
                "text-muted",
            )}
          >
            {result.next === null ? "None" : result.next}
          </p>
        </div>
        <p className="font-mono text-xs tabular-nums text-subtle">
          {result.total} hits in {result.candles.toLocaleString("en-US")}{" "}
          {result.frame} candles
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        {result.pattern.map((dir, i) => (
          <Chip key={`${dir}-${i}`} dir={dir} />
        ))}
        <span className="inline-flex items-center px-1 text-subtle">→</span>
        <Chip dir={result.next === "tie" || result.next === null ? "flat" : result.next} label={result.next ?? "none"} ghost />
      </div>
      {result.total === 0 ? (
        <p className="text-sm text-muted">
          That sequence never appeared with a candle after it.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Count label="Up" value={result.countUp} share={pct(result.countUp)} tone="up" />
          <Count
            label="Down"
            value={result.countDown}
            share={pct(result.countDown)}
            tone="down"
          />
          <Count label="Flat" value={result.countFlat} share={pct(result.countFlat)} />
        </div>
      )}
      {result.next === "tie" ? (
        <p className="text-sm text-muted">Two outcomes tied, so there is no single next candle.</p>
      ) : null}
      <p className="font-mono text-xs text-subtle">
        {formatBound(result.from)} → {formatBound(result.to)}
      </p>
    </div>
  );
}

function Chip({
  dir,
  ghost,
  label,
}: {
  dir: TapeDir;
  ghost?: boolean;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-12 items-center justify-center rounded-full px-2 py-0.5 font-mono text-xs uppercase",
        ghost && "border border-dashed border-line text-muted",
        !ghost && dir === "up" && "bg-up-dim text-up",
        !ghost && dir === "down" && "bg-down-dim text-down",
        !ghost && dir === "flat" && "bg-raised text-muted",
      )}
    >
      {label ?? dir}
    </span>
  );
}

function Count({
  label,
  value,
  share,
  tone,
}: {
  label: string;
  value: number;
  share: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="rounded-md border border-line bg-raised px-3 py-3">
      <p className="text-xs uppercase tracking-wider text-subtle">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-lg tabular-nums",
          tone === "up" && "text-up",
          tone === "down" && "text-down",
        )}
      >
        {value}
      </p>
      <p className="font-mono text-xs tabular-nums text-muted">{share}</p>
    </div>
  );
}

function formatBound(value: string | null): string {
  if (!value) return "—";
  return value.replace("T", " ").replace("Z", " UTC");
}
