import type { DailyStats } from "@/lib/polymarket";
import { formatUsd } from "@/lib/utils";

export function StatsRow({ stats }: { stats: DailyStats }) {
  const items = [
    { label: "Resolved days", value: String(stats.resolved) },
    {
      label: "Up / Down",
      value: `${stats.upDays} / ${stats.downDays}`,
      hint: `${stats.upPct.toFixed(1)}% up`,
    },
    {
      label: "Current streak",
      value: stats.currentStreak
        ? `${stats.currentStreak.length} ${stats.currentStreak.outcome}`
        : "—",
    },
    {
      label: "Longest run",
      value: `${stats.longestUp}U · ${stats.longestDown}D`,
    },
    { label: "Total volume", value: formatUsd(stats.volume) },
    {
      label: "Avg |move|",
      value: stats.avgAbsMove ? `${stats.avgAbsMove.toFixed(2)}%` : "—",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-line bg-surface px-3 py-3 md:px-4"
        >
          <p className="text-xs uppercase tracking-wider text-subtle">
            {item.label}
          </p>
          <p className="mt-1 font-mono text-base tabular-nums md:text-lg">
            {item.value}
          </p>
          {"hint" in item && item.hint ? (
            <p className="mt-0.5 text-xs text-muted">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </section>
  );
}
