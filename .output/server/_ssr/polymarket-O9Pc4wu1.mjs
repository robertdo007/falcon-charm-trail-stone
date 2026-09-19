import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/polymarket-O9Pc4wu1.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function parseJsonArray(value) {
	if (Array.isArray(value)) return value;
	if (typeof value === "string") try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
	return [];
}
function asNumber(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim()) {
		const n = Number(value);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}
function formatUsd(value) {
	if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
	if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(1)}k`;
	return `$${value.toFixed(0)}`;
}
function formatBtc(value) {
	return value.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2
	});
}
function formatVolume(value) {
	return value.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0
	});
}
function formatPct(value) {
	return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}
function etParts(dateKey) {
	const [y, m, d] = dateKey.split("-").map(Number);
	const date = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1, 16));
	const fmt = (opts) => date.toLocaleDateString("en-US", {
		timeZone: "America/New_York",
		...opts
	});
	return {
		y: y ?? 2026,
		date,
		fmt
	};
}
function etDateKey(iso) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/New_York",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).formatToParts(new Date(iso));
	return `${parts.find((p) => p.type === "year")?.value}-${parts.find((p) => p.type === "month")?.value}-${parts.find((p) => p.type === "day")?.value}`;
}
function formatEtDay(dateKey) {
	const { fmt } = etParts(dateKey);
	return `${fmt({ weekday: "short" })}, ${fmt({ month: "short" })} ${fmt({ day: "numeric" })}, ${fmt({ year: "numeric" })}`;
}
function formatEtShort(dateKey) {
	const { y, fmt } = etParts(dateKey);
	return `${fmt({ month: "short" })} ${fmt({ day: "numeric" })} '${String(y).slice(2)}`;
}
var POLYMARKET_EVENT_URL = "https://polymarket.com/event";
function asString(value) {
	return typeof value === "string" && value.length > 0 ? value : null;
}
function pickWinner(outcomes, prices, closed) {
	if (!closed) return null;
	const upIdx = outcomes.findIndex((o) => o.toLowerCase() === "up");
	const downIdx = outcomes.findIndex((o) => o.toLowerCase() === "down");
	const up = upIdx >= 0 ? prices[upIdx] ?? 0 : 0;
	const down = downIdx >= 0 ? prices[downIdx] ?? 0 : 0;
	if (up >= .99 && down <= .01) return "Up";
	if (down >= .99 && up <= .01) return "Down";
	if (Math.abs(up - down) < .05) return "Tie";
	return up > down ? "Up" : "Down";
}
function metadataPrices(raw) {
	if (!raw || typeof raw !== "object") return {
		open: null,
		close: null
	};
	const rec = raw;
	return {
		open: asNumber(rec.priceToBeat),
		close: asNumber(rec.finalPrice)
	};
}
function parseGammaEvent(raw) {
	if (!raw || typeof raw !== "object") return null;
	const event = raw;
	const slug = asString(event.slug);
	if (!slug || !slug.startsWith("bitcoin-up-or-down-on-")) return null;
	const market = (Array.isArray(event.markets) ? event.markets : [])[0] ?? {};
	const outcomes = parseJsonArray(market.outcomes);
	const prices = parseJsonArray(market.outcomePrices).map((p) => asNumber(p) ?? 0);
	const closed = Boolean(event.closed ?? market.closed);
	const endAt = asString(event.endDate) ?? asString(market.endDate);
	if (!endAt) return null;
	const upIdx = outcomes.findIndex((o) => o.toLowerCase() === "up");
	const downIdx = outcomes.findIndex((o) => o.toLowerCase() === "down");
	const { open, close } = metadataPrices(event.eventMetadata);
	return {
		id: asString(event.id) ?? slug,
		slug,
		title: asString(event.title) ?? asString(market.question) ?? slug,
		date: etDateKey(endAt),
		endAt,
		startAt: asString(event.startTime) ?? asString(market.eventStartTime) ?? asString(event.startDate),
		closed,
		winner: pickWinner(outcomes, prices, closed),
		upPrice: upIdx >= 0 ? prices[upIdx] ?? null : null,
		downPrice: downIdx >= 0 ? prices[downIdx] ?? null : null,
		volume: asNumber(event.volume) ?? asNumber(market.volume) ?? 0,
		btcOpen: open,
		btcClose: close,
		url: `${POLYMARKET_EVENT_URL}/${slug}`
	};
}
function uniqueByDate(markets) {
	const map = /* @__PURE__ */ new Map();
	for (const m of markets) {
		const prev = map.get(m.date);
		if (!prev || m.volume > prev.volume) map.set(m.date, m);
	}
	return [...map.values()].sort((a, b) => a.date < b.date ? 1 : -1);
}
function marketPhase(market, now = Date.now()) {
	if (market.closed) return "settled";
	const end = Date.parse(market.endAt);
	const start = market.startAt ? Date.parse(market.startAt) : end - 864e5;
	if (Number.isFinite(start) && now < start) return "next";
	if (Number.isFinite(end) && now >= end) return "settled";
	return "live";
}
function pickHero(markets) {
	const now = Date.now();
	const live = markets.find((m) => marketPhase(m, now) === "live");
	if (live) return live;
	return markets.filter((m) => marketPhase(m, now) === "next").sort((a, b) => Date.parse(a.endAt) - Date.parse(b.endAt))[0] ?? markets[0] ?? null;
}
function computeStats(markets) {
	const resolved = markets.filter((m) => m.closed && m.winner);
	const upDays = resolved.filter((m) => m.winner === "Up").length;
	const downDays = resolved.filter((m) => m.winner === "Down").length;
	const ties = resolved.filter((m) => m.winner === "Tie").length;
	const volume = markets.reduce((s, m) => s + m.volume, 0);
	let longestUp = 0;
	let longestDown = 0;
	let run = 0;
	let runOutcome = null;
	const chronological = [...resolved].reverse();
	for (const m of chronological) {
		if (m.winner === runOutcome) run += 1;
		else {
			runOutcome = m.winner;
			run = 1;
		}
		if (runOutcome === "Up") longestUp = Math.max(longestUp, run);
		if (runOutcome === "Down") longestDown = Math.max(longestDown, run);
	}
	const newest = resolved[0];
	let currentStreak = null;
	if (newest?.winner) {
		let length = 0;
		for (const m of resolved) {
			if (m.winner !== newest.winner) break;
			length += 1;
		}
		currentStreak = {
			outcome: newest.winner,
			length
		};
	}
	const moves = resolved.map((m) => m.btcOpen && m.btcClose ? Math.abs((m.btcClose - m.btcOpen) / m.btcOpen) * 100 : null).filter((n) => n !== null);
	const avgAbsMove = moves.length > 0 ? moves.reduce((s, n) => s + n, 0) / moves.length : null;
	return {
		resolved: resolved.length,
		upDays,
		downDays,
		ties,
		upPct: resolved.length ? upDays / resolved.length * 100 : 0,
		volume,
		currentStreak,
		longestUp,
		longestDown,
		avgAbsMove
	};
}
function changePct(market) {
	if (!market.btcOpen || !market.btcClose) return null;
	return (market.btcClose - market.btcOpen) / market.btcOpen * 100;
}
function toCsv(markets) {
	const header = [
		"date",
		"outcome",
		"status",
		"btc_open",
		"btc_close",
		"change_pct",
		"volume_usd",
		"up_price",
		"down_price",
		"slug",
		"url"
	];
	const rows = markets.map((m) => {
		const pct = changePct(m);
		return [
			m.date,
			m.winner ?? "",
			m.closed ? "resolved" : "open",
			m.btcOpen ?? "",
			m.btcClose ?? "",
			pct === null ? "" : pct.toFixed(4),
			m.volume.toFixed(2),
			m.upPrice ?? "",
			m.downPrice ?? "",
			m.slug,
			m.url
		].join(",");
	});
	return [header.join(","), ...rows].join("\n");
}
//#endregion
export { formatEtDay as a, formatUsd as c, parseGammaEvent as d, pickHero as f, formatBtc as i, formatVolume as l, uniqueByDate as m, cn as n, formatEtShort as o, toCsv as p, computeStats as r, formatPct as s, changePct as t, marketPhase as u };
