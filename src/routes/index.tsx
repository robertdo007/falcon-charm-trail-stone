import { createFileRoute } from "@tanstack/react-router";
import { getBtcDailyMarkets } from "@/lib/btc-daily";
import { computeStats, pickHero } from "@/lib/polymarket";
import { Check1dPanel } from "@/components/tape/check1d-panel";
import { HistoryList } from "@/components/tape/history-list";
import { LiveCard } from "@/components/tape/live-card";
import { MonthlySplit } from "@/components/tape/monthly-split";
import { OutcomeCalendar } from "@/components/tape/outcome-calendar";
import { StatsRow } from "@/components/tape/stats-row";
import { OutcomeBadge } from "@/components/tape/outcome-badge";

export const Route = createFileRoute("/")({
  loader: () => getBtcDailyMarkets(),
  pendingComponent: Pending,
  component: Home,
});

function Home() {
  const markets = Route.useLoaderData();
  const stats = computeStats(markets);
  const live = pickHero(markets);
  const tape = markets.filter((m) => m.closed).slice(0, 28);

  return (
    <main className="mx-auto flex min-h-dvh min-w-0 max-w-6xl flex-col gap-5 px-4 py-6 pb-16 md:gap-6 md:px-6 md:py-10">
      <header className="flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-subtle">
            Polymarket
          </p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight md:text-4xl">
            BTC Daily Tape
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Every Bitcoin Up or Down daily market, resolved against Binance noon
            ET. Run check1d to find the longest recent tape that already printed
            in this history.
          </p>
        </div>
        <p className="font-mono text-xs tabular-nums text-subtle">
          {markets.length} sessions indexed
        </p>
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

      <LiveCard market={live} />
      <Check1dPanel markets={markets} />
      <StatsRow stats={stats} />

      <div className="grid min-w-0 gap-4 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <OutcomeCalendar markets={markets} />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <MonthlySplit markets={markets} />
        </div>
      </div>

      <HistoryList markets={markets} />

      <footer className="pt-2 text-xs text-subtle">
        Not financial advice. check1d uses Polymarket noon-ET settlements, not
        Binance calendar-day candles.
      </footer>
    </main>
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
