import { marketPhase, type DailyMarket } from "@/lib/polymarket";
import { cn, formatEtShort } from "@/lib/utils";

type MonthRow = {
  key: string;
  label: string;
  days: number;
  cells: (DailyMarket | undefined)[];
  up: number;
  down: number;
};

export function MonthlySplit({ markets }: { markets: DailyMarket[] }) {
  const byDate = new Map(markets.map((m) => [m.date, m]));
  const map = new Map<string, MonthRow>();

  for (const m of markets) {
    const key = m.date.slice(0, 7);
    if (map.has(key)) continue;
    map.set(key, buildMonth(key, byDate));
  }

  const rows = [...map.values()].slice(0, 8);

  return (
    <section className="min-w-0 rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium tracking-tight">Monthly split</h2>
        <p className="text-xs text-subtle">From the 1st</p>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {rows.map((row) => {
          const total = row.up + row.down || 1;
          const upPct = (row.up / total) * 100;
          return (
            <div key={row.key} className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3">
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
              <div className="mt-1.5 min-w-0 overflow-x-auto">
                <div
                  className="grid gap-0.5"
                  style={{
                    gridTemplateColumns: `repeat(${row.days}, minmax(0.5rem, 1fr))`,
                  }}
                >
                  {row.cells.map((m, i) => {
                    const day = i + 1;
                    const date = `${row.key}-${String(day).padStart(2, "0")}`;
                    return (
                      <div
                        key={date}
                        title={
                          m
                            ? `${formatEtShort(date)} · ${m.winner ?? (marketPhase(m) === "live" ? "Live" : "Next")}`
                            : `${formatEtShort(date)} · day ${day}`
                        }
                        className={cn(
                          "aspect-square min-h-2 rounded-xs",
                          !m && "bg-raised",
                          m?.winner === "Up" && "bg-up",
                          m?.winner === "Down" && "bg-down",
                          m?.winner === "Tie" && "bg-muted",
                          m && !m.winner && marketPhase(m) === "live" && "bg-live",
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function buildMonth(
  key: string,
  byDate: Map<string, DailyMarket>,
): MonthRow {
  const [y, m] = key.split("-").map(Number);
  const year = y ?? 2026;
  const month = m ?? 1;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (DailyMarket | undefined)[] = [];
  let up = 0;
  let down = 0;
  for (let day = 1; day <= days; day += 1) {
    const date = `${key}-${String(day).padStart(2, "0")}`;
    const market = byDate.get(date);
    cells.push(market);
    if (market?.closed && market.winner === "Up") up += 1;
    if (market?.closed && market.winner === "Down") down += 1;
  }
  return {
    key,
    label: monthLabel(key),
    days,
    cells,
    up,
    down,
  };
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
