import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function formatUsd(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatBtc(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export function formatVolume(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function etParts(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1, 16));
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    date.toLocaleDateString("en-US", { timeZone: "America/New_York", ...opts });
  return { y: y ?? 2026, date, fmt };
}

export function etDateKey(iso: string): string {
  const parts = etFormatParts(iso, false);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function etDateTimeKey(iso: string): string {
  const parts = etFormatParts(iso, true);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function formatEtDay(dateKey: string): string {
  const { fmt } = etParts(dateKey);
  return `${fmt({ weekday: "short" })}, ${fmt({ month: "short" })} ${fmt({ day: "numeric" })}, ${fmt({ year: "numeric" })}`;
}

export function formatEtShort(dateKey: string): string {
  const day = dateKey.slice(0, 10);
  const { y, fmt } = etParts(day);
  return `${fmt({ month: "short" })} ${fmt({ day: "numeric" })} '${String(y).slice(2)}`;
}

export function formatWindow(dateKey: string): string {
  if (!dateKey.includes("T")) return formatEtShort(dateKey);
  const time = dateKey.slice(11, 16);
  return `${formatEtShort(dateKey.slice(0, 10))} ${clockLabel(time)}`;
}

export function formatSessionTitle(dateKey: string, spanMinutes = 0): string {
  if (!dateKey.includes("T") || spanMinutes <= 0) return formatEtDay(dateKey.slice(0, 10));
  const [hh, mm] = dateKey.slice(11, 16).split(":").map(Number);
  const start = (hh ?? 0) * 60 + (mm ?? 0);
  const end = (start + spanMinutes) % (24 * 60);
  return `${formatEtDay(dateKey.slice(0, 10))} · ${clockLabel(padHm(start))}–${clockLabel(padHm(end))} ET`;
}

function etFormatParts(iso: string, withTime: boolean) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime
      ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const }
      : {}),
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  let hour = get("hour");
  if (hour === "24") hour = "00";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour,
    minute: get("minute"),
  };
}

function padHm(totalMinutes: number): string {
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function clockLabel(hhmm: string): string {
  const [hh, mm] = hhmm.split(":").map(Number);
  const hour = hh ?? 0;
  const suffix = hour >= 12 ? "p" : "a";
  const h12 = hour % 12 || 12;
  return `${h12}:${String(mm ?? 0).padStart(2, "0")}${suffix}`;
}
