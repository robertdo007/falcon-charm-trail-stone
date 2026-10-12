import { marketPhase, type DailyMarket, type Timeframe } from "@/lib/polymarket";
import { cn, formatEtShort, formatWindow } from "@/lib/utils";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function mondayIndex(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const utc = Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  const dow = new Date(utc).getUTCDay();
  return (dow + 6) % 7;
}

function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, (d ?? 1) + days));
  return dt.toISOString().slice(0, 10);
}

export function OutcomeCalendar({
  markets,
  timeframe = "1d",
}: {
  markets: DailyMarket[];
  timeframe?: Timeframe;
}) {
  if (timeframe === "15m") return <WindowGrid markets={markets} />;
  const byDate = new Map(markets.map((m) => [m.date, m]));
  const newest = markets[0]?.date;
  if (!newest) return null;

  const endMondayOffset = mondayIndex(newest);
  const gridEnd = addDays(newest, 6 - endMondayOffset);
  const weeks = 26;
  const cells: string[] = [];
  for (let i = weeks * 7 - 1; i >= 0; i -= 1) {
    cells.push(addDays(gridEnd, -i));
  }

  return (
    <section className="min-w-0 rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium tracking-tight">Last 26 weeks</h2>
        <p className="text-xs text-subtle">Noon ET settlement</p>
      </div>
      <div className="mt-3 min-w-0 overflow-x-auto">
        <div className="flex min-w-lg gap-2">
          <div className="flex flex-col justify-between py-0.5 text-xs text-subtle">
            {WEEKDAYS.map((d, i) => (
              <span key={`${d}-${i}`} className="h-3 leading-3">
                {i % 2 === 0 ? d : ""}
              </span>
            ))}
          </div>
          <div className="grid w-full grid-flow-col grid-rows-7 gap-1">
            {cells.map((date) => {
              const m = byDate.get(date);
              return (
                <div
                  key={date}
                  title={
                    m
                      ? `${formatEtShort(date)} · ${m.winner ?? (marketPhase(m) === "live" ? "Live" : "Next")}`
                      : formatEtShort(date)
                  }
                  className={cn(
                    "size-3 rounded-xs sm:size-auto sm:aspect-square sm:min-h-3",
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
      <div className="mt-4 flex items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block size-2.5 rounded-xs bg-up" /> Up
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block size-2.5 rounded-xs bg-down" /> Down
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block size-2.5 rounded-xs bg-live" /> Live
        </span>
      </div>
    </section>
  );
}

function WindowGrid({ markets }: { markets: DailyMarket[] }) {
  const byKey = new Map(markets.map((m) => [m.date, m]));
  const days = [...new Set(markets.map((m) => m.date.slice(0, 10)))].slice(0, 8);
  const slots = Array.from({ length: 96 }, (_, i) => {
    const hh = Math.floor(i / 4);
    const mm = (i % 4) * 15;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  });

  return (
    <section className="min-w-0 rounded-xl border border-line bg-surface p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium tracking-tight">15m windows</h2>
        <p className="text-xs text-subtle">ET · 96 slots a day</p>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {days.map((day) => (
          <div key={day} className="min-w-0">
            <p className="mb-1 font-mono text-xs text-muted">{formatEtShort(day)}</p>
            <div className="overflow-x-auto">
              <div className="grid w-max grid-cols-[repeat(96,0.7rem)] gap-px">
                {slots.map((slot) => {
                  const m = byKey.get(`${day}T${slot}`);
                  return (
                    <div
                      key={slot}
                      title={
                        m
                          ? `${formatWindow(m.date)} · ${m.winner ?? (marketPhase(m) === "live" ? "Live" : "Next")}`
                          : `${formatEtShort(day)} ${slot} ET`
                      }
                      className={cn(
                        "size-2.5 rounded-xs",
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
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block size-2.5 rounded-xs bg-up" /> Up
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block size-2.5 rounded-xs bg-down" /> Down
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block size-2.5 rounded-xs bg-live" /> Live
        </span>
      </div>
    </section>
  );
}
