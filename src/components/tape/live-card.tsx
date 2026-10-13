import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { getLiveBtcQuote } from "@/lib/btc-daily";
import {
  marketPhase,
  TIMEFRAMES,
  type DailyMarket,
  type LiveQuote,
  type Timeframe,
} from "@/lib/polymarket";
import { formatBtc, formatPct, formatSessionTitle, formatVolume } from "@/lib/utils";
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
  initialQuote = null,
}: {
  market: DailyMarket | null;
  timeframe?: Timeframe;
  initialQuote?: LiveQuote | null;
}) {
  const spec = TIMEFRAMES[timeframe];
  const [quote, setQuote] = useState<LiveQuote | null>(initialQuote);

  useEffect(() => {
    setQuote(initialQuote);
  }, [initialQuote, market?.id]);

  useEffect(() => {
    if (!market || marketPhase(market) === "settled") return;
    let stop = false;
    const pull = () => {
      void getLiveBtcQuote({ data: { tf: timeframe, end: market.endAt } })
        .then((next) => {
          if (!stop) setQuote(next);
        })
        .catch(() => undefined);
    };
    pull();
    const timer = setInterval(pull, 15_000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [market, timeframe]);
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
  const beat = market.btcOpen ?? quote?.open ?? null;
  const nowPx = phase === "settled" ? market.btcClose : (quote?.current ?? null);
  const gap = beat != null && nowPx != null ? nowPx - beat : null;
  const gapPct = gap != null && beat ? (gap / beat) * 100 : null;
  const gapTone = gap == null || gap === 0 ? undefined : gap > 0 ? "up" : "down";

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

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
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
          value={beat != null ? formatBtc(beat) : "—"}
        />
        <OddsCell
          label={phase === "settled" ? "Close" : "Now"}
          value={nowPx != null ? formatBtc(nowPx) : "—"}
        />
        <OddsCell
          label="vs beat"
          value={gap == null ? "—" : gap > 0 ? `+${formatBtc(gap)}` : formatBtc(gap)}
          hint={gapPct == null ? undefined : formatPct(gapPct)}
          tone={gapTone}
          active={gapTone != null}
        />
        <OddsCell label="Volume" value={formatVolume(market.volume)} />
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
  hint,
  tone,
  active,
}: {
  label: string;
  value: string;
  hint?: string;
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
      {hint ? (
        <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
