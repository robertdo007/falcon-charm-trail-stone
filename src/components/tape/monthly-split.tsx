import type { DailyMarket } from "@/lib/polymarket";

type MonthRow = { key: string; label: string; up: number; down: number };

export function MonthlySplit({ markets }: { markets: DailyMarket[] }) {
  const map = new Map<string, MonthRow>();
  for (const m of markets) {
    if (!m.closed || !m.winner || m.winner === "Tie") continue;
    const key = m.date.slice(0, 7);
    const row = map.get(key) ?? {
      key,
      label: monthLabel(key),
      up: 0,
      down: 0,
    };
    if (m.winner === "Up") row.up += 1;
    else row.down += 1;
    map.set(key, row);
  }
  const rows = [...map.values()].slice(0, 10);

  return (
    <section className="min-w-0 rounded-xl border border-line bg-surface p-4 md:p-5">
      <h2 className="text-sm font-medium tracking-tight">Monthly split</h2>
      <div className="mt-4 flex flex-col gap-2.5">
        {rows.map((row) => {
          const total = row.up + row.down || 1;
          const upPct = (row.up / total) * 100;
          return (
            <div key={row.key} className="flex items-center gap-2 sm:gap-3">
              <span className="w-16 shrink-0 font-mono text-xs text-muted">
                {row.label}
              </span>
              <div className="flex h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-raised">
                <div className="h-full bg-up" style={{ width: `${upPct}%` }} />
                <div
                  className="h-full bg-down"
                  style={{ width: `${100 - upPct}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-subtle">
                {row.up}U {row.down}D
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, 1));
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}
