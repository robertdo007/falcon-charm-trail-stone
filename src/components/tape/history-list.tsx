import { useMemo, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { changePct, marketPhase, toCsv, type DailyMarket, type Timeframe } from "@/lib/polymarket";
import { formatBtc, formatPct, formatUsd, formatWindow } from "@/lib/utils";
import { OutcomeBadge } from "./outcome-badge";

type Filter = "all" | "Up" | "Down" | "open";

export function HistoryList({
  markets,
  timeframe = "1d",
}: {
  markets: DailyMarket[];
  timeframe?: Timeframe;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [visible, setVisible] = useState(40);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[\s_]+/g, "-");
    return markets.filter((m) => {
      if (filter === "open" && m.closed) return false;
      if (filter === "Up" && m.winner !== "Up") return false;
      if (filter === "Down" && m.winner !== "Down") return false;
      if (!q) return true;
      const hay = `${m.date} ${m.title} ${m.slug} ${m.winner ?? "live"}`
        .toLowerCase()
        .replace(/[\s_]+/g, "-");
      return hay.includes(q);
    });
  }, [markets, query, filter]);

  const slice = filtered.slice(0, visible);

  function downloadCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      timeframe === "15m"
        ? "polymarket-btc-15m.csv"
        : timeframe === "1h"
          ? "polymarket-btc-1h.csv"
          : "polymarket-btc-daily.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="min-w-0 rounded-xl border border-line bg-surface p-4 shadow-panel md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium tracking-tight">
            {timeframe === "15m"
              ? "15m history"
              : timeframe === "1h"
                ? "1h history"
                : "Daily history"}
          </h2>
          <p className="text-xs text-muted">
            {filtered.length}{" "}
            {timeframe === "15m"
              ? "windows"
              : timeframe === "1h"
                ? "hours"
                : "days"}{" "}
            · close and Polymarket volume per session
          </p>
        </div>
        <button
          type="button"
          onClick={downloadCsv}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-raised px-3 text-sm text-fg transition-colors duration-150 hover:bg-line"
        >
          <Download className="size-4" strokeWidth={2} />
          Export CSV
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisible(40);
          }}
          placeholder="Search date or title"
          className="min-h-11 flex-1 rounded-md border border-line bg-raised px-3 text-sm text-fg outline-none placeholder:text-subtle focus:border-accent"
        />
        <div className="grid grid-cols-4 gap-1 rounded-md border border-line bg-raised p-1">
          {(["all", "Up", "Down", "open"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f);
                setVisible(40);
              }}
              className={[
                "min-h-9 rounded-sm px-2 text-xs font-medium capitalize",
                filter === f ? "bg-accent text-accent-fg" : "text-muted",
              ].join(" ")}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {slice.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No sessions match that filter.</p>
      ) : (
        <>
          <div
            className={
              timeframe !== "1d"
                ? "mt-4 hidden grid-cols-[9.5rem_4.5rem_minmax(0,1fr)_minmax(0,1fr)_4.75rem_1.25rem] gap-3 px-1 text-[11px] uppercase tracking-wider text-subtle sm:grid"
                : "mt-4 hidden grid-cols-[6.5rem_4.5rem_minmax(0,1fr)_minmax(0,1fr)_4.75rem_1.25rem] gap-3 px-1 text-[11px] uppercase tracking-wider text-subtle sm:grid"
            }
          >
            <span>{timeframe === "1d" ? "Date" : "Window"}</span>
            <span>Result</span>
            <span>Close</span>
            <span>Volume</span>
            <span className="text-right">Move</span>
            <span />
          </div>
          <ul className="mt-1 divide-y divide-line">
            {slice.map((m) => (
              <HistoryRow key={m.id} market={m} wide={timeframe !== "1d"} />
            ))}
          </ul>
        </>
      )}

      {visible < filtered.length ? (
        <button
          type="button"
          onClick={() => setVisible((n) => n + 40)}
          className="mt-3 flex min-h-11 w-full items-center justify-center rounded-md border border-line text-sm text-muted transition-colors duration-150 hover:bg-raised hover:text-fg"
        >
          Load more
        </button>
      ) : null}
    </section>
  );
}

function HistoryRow({
  market,
  wide,
}: {
  market: DailyMarket;
  wide: boolean;
}) {
  const pct = changePct(market);
  const moveTone =
    pct === null ? "text-muted" : pct >= 0 ? "text-up" : "text-down";
  const close = market.btcClose ? formatBtc(market.btcClose) : "—";
  const volume = market.volume > 0 ? formatUsd(market.volume) : "—";
  const cols = wide
    ? "sm:grid-cols-[9.5rem_4.5rem_minmax(0,1fr)_minmax(0,1fr)_4.75rem_1.25rem]"
    : "sm:grid-cols-[6.5rem_4.5rem_minmax(0,1fr)_minmax(0,1fr)_4.75rem_1.25rem]";

  return (
    <li className="py-3">
      <a
        href={market.url}
        target="_blank"
        rel="noreferrer"
        className={`flex flex-col gap-2 sm:grid sm:items-center sm:gap-3 ${cols}`}
      >
        <span className="font-mono text-sm tabular-nums text-muted">
          {formatWindow(market.date)}
        </span>
        <OutcomeBadge outcome={market.winner} phase={marketPhase(market)} size="sm" />
        <span className="flex items-baseline justify-between gap-3 sm:block">
          <span className="text-[11px] uppercase tracking-wider text-subtle sm:hidden">
            Close
          </span>
          <span className="font-mono text-sm tabular-nums text-fg">{close}</span>
        </span>
        <span className="flex items-baseline justify-between gap-3 sm:block">
          <span className="text-[11px] uppercase tracking-wider text-subtle sm:hidden">
            Volume
          </span>
          <span className="font-mono text-sm tabular-nums text-muted">
            {volume}
          </span>
        </span>
        <span
          className={`font-mono text-sm tabular-nums sm:text-right ${moveTone}`}
        >
          {pct === null ? "—" : formatPct(pct)}
        </span>
        <ExternalLink className="size-3.5 shrink-0 self-center text-subtle" strokeWidth={2} />
      </a>
    </li>
  );
}
