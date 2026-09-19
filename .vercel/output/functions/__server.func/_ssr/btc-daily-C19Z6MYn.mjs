import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/btc-daily-C19Z6MYn.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getBtcDailyMarkets_createServerFn_handler = createServerRpc({
	id: "ffb165f0040bf0108ea6dcaa0ce379476db97c6e0f34600030bc550fe42e0845",
	name: "getBtcDailyMarkets",
	filename: "src/lib/btc-daily.ts"
}, (opts) => getBtcDailyMarkets.__executeServer(opts));
var getBtcDailyMarkets = createServerFn({ method: "GET" }).handler(getBtcDailyMarkets_createServerFn_handler, async () => {
	const { loadBtcDailyMarkets } = await import("./polymarket.server-XWS0ZgbD.mjs");
	return loadBtcDailyMarkets();
});
//#endregion
export { getBtcDailyMarkets_createServerFn_handler };
