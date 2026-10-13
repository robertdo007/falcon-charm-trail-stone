import { createFileRoute, Link } from "@tanstack/react-router";
import { getBtcMarkets } from "@/lib/btc-daily";
import {
  computeStats,
  parseTimeframe,
  pickHero,
  TIMEFRAMES,
  type Timeframe,
} from "@/lib/polymarket";
import { Check1dPanel } from "@/components/tape/check1d-panel";
import { HistoryList } from "@/components/tape/history-list";
import { LiveCard } from "@/components/tape/live-card";
import { MonthlySplit } from "@/components/tape/monthly-split";
import { OutcomeCalendar } from "@/components/tape/outcome-calendar";
import { StatsRow } from "@/components/tape/stats-row";
import { OutcomeBadge } from "@/components/tape/outcome-badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    tf: parseTimeframe(search.tf),
  }),
  loaderDeps: ({ search }) => ({ tf: search.tf }),
  loader: ({ deps }) => getBtcMarkets({ data: { tf: deps.tf } }),
  pendingComponent: Pending,
  component: Home,
});

function Home() {
  const markets = Route.useLoaderData();
  const { tf } = Route.useSearch();
  const spec = TIMEFRAMES[tf];
  const stats = computeStats(markets);
  const live = pickHero(markets);
  const tape = markets.filter((m) => m.closed).slice(0, tf === "1d" ? 28 : 48);

  return (
    <main className="mx-auto flex min-h-dvh min-w-0 max-w-6xl flex-col gap-5 px-4 py-6 pb-16 md:gap-6 md:px-6 md:py-10">
      <header className="flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-subtle">
            Polymarket
          </p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight md:text-4xl">
            {spec.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">{spec.blurb}</p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <TfSwitch tf={tf} />
          <p className="font-mono text-xs tabular-nums text-subtle">
            {markets.length} sessions indexed
          </p>
        </div>
      </header>

      {tape.length > 0 ? (
        <div className="flex flex-nowrap gap-1 overflow-x-auto pb-1">
          {[...tape].reverse().map((m) => (
            <a
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="shrink-0"
              title={`${m.date} ${m.winner ?? ""}`}
            >
              <OutcomeBadge outcome={m.winner} size="sm" />
            </a>
          ))}
        </div>
      ) : null}

      <LiveCard market={live} timeframe={tf} />
      <Check1dPanel
        key={tf}
        markets={markets}
        command={spec.command}
        unit={spec.unit}
      />
      <StatsRow stats={stats} timeframe={tf} />

      <div className="grid min-w-0 gap-4 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <OutcomeCalendar markets={markets} timeframe={tf} />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <MonthlySplit markets={markets} timeframe={tf} />
        </div>
      </div>

      <HistoryList key={tf} markets={markets} timeframe={tf} />

      <footer className="pt-2 text-xs text-subtle">{spec.footer}</footer>
    </main>
  );
}

function TfSwitch({ tf }: { tf: Timeframe }) {
  return (
    <div className="inline-flex rounded-md border border-line bg-raised p-1">
      {(["1d", "1h", "15m"] as const).map((id) => (
        <Link
          key={id}
          to="/"
          search={{ tf: id }}
          className={cn(
            "inline-flex min-h-11 min-w-14 items-center justify-center rounded-sm px-3 text-sm font-medium",
            tf === id ? "bg-accent text-accent-fg" : "text-muted",
          )}
        >
          {TIMEFRAMES[id].label}
        </Link>
      ))}
    </div>
  );
}

function Pending() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-5 px-4 py-6 md:px-6 md:py-10">
      <div className="h-20 max-w-md animate-pulse rounded-lg bg-surface" />
      <div className="h-48 animate-pulse rounded-xl bg-surface" />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-surface" />
        ))}
      </div>
      <p className="text-sm text-muted">Loading Polymarket history…</p>
    </main>
  );
}
