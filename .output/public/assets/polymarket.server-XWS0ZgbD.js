import { i as parseGammaEvent, s as uniqueByDate } from "./polymarket-O9Pc4wu1.js";
//#region src/lib/polymarket.server.ts
var GAMMA = "https://gamma-api.polymarket.com";
var PAGE = 100;
var MAX_PAGES = 8;
var CACHE_MS = 12e4;
var cache = null;
async function fetchPage(offset) {
	const url = new URL(`${GAMMA}/events`);
	url.searchParams.set("series_id", "41");
	url.searchParams.set("limit", String(PAGE));
	url.searchParams.set("offset", String(offset));
	url.searchParams.set("order", "endDate");
	url.searchParams.set("ascending", "false");
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), 18e3);
	try {
		const res = await fetch(url, {
			headers: {
				Accept: "application/json",
				"User-Agent": "btc-daily-tape/1.0"
			},
			signal: ctrl.signal
		});
		if (!res.ok) throw new Error(`Polymarket Gamma ${res.status}`);
		const body = await res.json();
		return Array.isArray(body) ? body : [];
	} finally {
		clearTimeout(timer);
	}
}
async function loadBtcDailyMarkets() {
	if (cache && Date.now() - cache.at < CACHE_MS) return cache.markets;
	const offsets = Array.from({ length: MAX_PAGES }, (_, i) => i * PAGE);
	const parsed = (await Promise.all(offsets.map((offset) => fetchPage(offset)))).flat().map(parseGammaEvent).filter((m) => m !== null);
	const markets = uniqueByDate(parsed);
	cache = {
		at: Date.now(),
		markets
	};
	return markets;
}
//#endregion
export { loadBtcDailyMarkets };
