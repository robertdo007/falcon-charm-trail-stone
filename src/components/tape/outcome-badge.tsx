import { cn } from "@/lib/utils";
import type { MarketPhase, Outcome } from "@/lib/polymarket";

export function OutcomeBadge({
  outcome,
  phase,
  size = "md",
}: {
  outcome: Outcome | null;
  phase?: MarketPhase;
  size?: "sm" | "md";
}) {
  const label = outcome ?? (phase === "next" ? "Next" : "Live");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium uppercase tracking-wide",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        outcome === "Up" && "bg-up-dim text-up",
        outcome === "Down" && "bg-down-dim text-down",
        outcome === "Tie" && "bg-raised text-muted",
        outcome === null && phase === "next" && "bg-raised text-muted",
        outcome === null && phase !== "next" && "bg-raised text-live",
      )}
    >
      {label}
    </span>
  );
}