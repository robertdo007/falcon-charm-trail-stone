import { ExternalLink } from "lucide-react";
import { marketPhase, type DailyMarket, type Timeframe, TIMEFRAMES } from "@/lib/polymarket";
import { formatBtc, formatSessionTitle, formatVolume } from "@/lib/utils";
import { OutcomeBadge } from "./outcome-badge";

function implied(price: number | null): string {
  if (price === null) return "—";
  return `${Math.round(price * 100)}¢`;
}

const PHASE_LABEL = {
  live: "Live now",
  next: "Next session",
  settled: "Settled",
} as const;

export function LiveCard({
  market,
  timeframe = "1d",
}: {
  market: DailyMarket | null;
  timeframe?: Timeframe;
}) {
  const spec = TIMEFRAMES[timeframe];
  if (!market) {
    return (
      <section className="rounded-xl border border-line bg-surface p-5 shadow-panel md:p-6">
        <p className="text-sm text-muted">No live market right now.</p>
      </section>
    );
  }

  const phase = marketPhase(market);
  const favored =
    (market.upPrice ?? 0) >= (market.downPrice ?? 0) ? "Up" : "Down";

  return (
    <section className="rounded-xl border border-line bg-surface p-5 shadow-panel md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-subtle">
            {PHASE_LABEL[phase]}
          </p>
          <h2 className="mt-1 text-xl font-medium tracking-tight md:text-2xl">
            {formatSessionTitle(market.date, spec.spanMinutes)}
          </h2>
          <p className="mt-1 text-sm text-muted">{spec.resolveNote}</p>
        </div>
        <OutcomeBadge outcome={market.winner} phase={phase} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <OddsCell
          label="Up"
          value={implied(market.upPrice)}
          tone="up"
          active={favored === "Up" && phase !== "settled"}
        />
        <OddsCell
          label="Down"
          value={implied(market.downPrice)}
          tone="down"
          active={favored === "Down" && phase !== "settled"}
        />
        <OddsCell
          label="Price to beat"
          value={market.btcOpen ? formatBtc(market.btcOpen) : "—"}
        />
        <OddsCell
          label={phase === "settled" ? "Close" : "Volume"}
          value={
            phase === "settled" && market.btcClose
              ? formatBtc(market.btcClose)
              : formatVolume(market.volume)
          }
        />
      </div>

      <a
        href={market.url}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity duration-150 hover:opacity-90"
      >
        Open on Polymarket
        <ExternalLink className="size-3.5" strokeWidth={2} />
      </a>
    </section>
  );
}

function OddsCell({
  label,
  value,
  tone,
  active,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
  active?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-md border px-3 py-3",
        active && tone === "up" ? "border-up/40 bg-up-dim" : "",
        active && tone === "down" ? "border-down/40 bg-down-dim" : "",
        !active ? "border-line bg-raised" : "",
      ].join(" ")}
    >
      <p className="text-xs uppercase tracking-wider text-subtle">{label}</p>
      <p
        className={[
          "mt-1 font-mono text-lg tabular-nums",
          tone === "up" ? "text-up" : "",
          tone === "down" ? "text-down" : "",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}
