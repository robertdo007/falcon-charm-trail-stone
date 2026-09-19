import { i as __toESM } from "../_runtime.mjs";
import { R as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as formatEtDay, c as formatUsd, f as pickHero, i as formatBtc, l as formatVolume, n as cn, o as formatEtShort, p as toCsv, r as computeStats, s as formatPct, t as changePct, u as marketPhase } from "./polymarket-O9Pc4wu1.mjs";
import { i as Download, n as Search, r as ExternalLink } from "../_libs/lucide-react.mjs";
import { n as Route$1 } from "./router-CnUS8eik.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D0YWjwL6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function toDir(winner) {
	if (winner === "Up") return "up";
	if (winner === "Down") return "down";
	return "flat";
}
function isSettled(market) {
	return Boolean(market.closed && market.winner);
}
function settledTape(markets) {
	const settled = [...markets].filter(isSettled).sort((a, b) => a.date < b.date ? -1 : 1);
	return {
		dates: settled.map((m) => m.date),
		dirs: settled.map((m) => toDir(m.winner))
	};
}
function analyzePattern(dirs, pattern) {
	let total = 0;
	let countUp = 0;
	let countDown = 0;
	let countFlat = 0;
	const plen = pattern.length;
	const lastStart = dirs.length - plen - 1;
	for (let i = 0; i <= lastStart; i++) {
		let match = true;
		for (let j = 0; j < plen; j++) if (dirs[i + j] !== pattern[j]) {
			match = false;
			break;
		}
		if (!match) continue;
		const next = dirs[i + plen];
		total += 1;
		if (next === "up") countUp += 1;
		else if (next === "down") countDown += 1;
		else countFlat += 1;
	}
	return {
		total,
		countUp,
		countDown,
		countFlat
	};
}
function toHit(length, pattern, stats) {
	const { total, countUp, countDown, countFlat } = stats;
	const pct = (n) => total > 0 ? Number((n / total * 100).toFixed(2)) : 0;
	return {
		length,
		pattern: pattern.join(" "),
		patternDirs: pattern,
		total,
		up: pct(countUp),
		down: pct(countDown),
		flat: pct(countFlat),
		countUp,
		countDown,
		countFlat,
		score: countUp - countDown
	};
}
function findLongestCheck1d(markets) {
	const { dates, dirs } = settledTape(markets);
	const empty = {
		seriesLength: dirs.length,
		from: dates[0] ?? null,
		to: dates[dates.length - 1] ?? null,
		current: [],
		history: [],
		longest: null,
		signal: null
	};
	if (dirs.length < 2) return empty;
	const history = [];
	const maxLen = dirs.length - 1;
	for (let length = 1; length <= maxLen; length++) {
		const pattern = dirs.slice(-length);
		const stats = analyzePattern(dirs, pattern);
		if (stats.total === 0) break;
		history.push(toHit(length, pattern, stats));
	}
	const longest = history[history.length - 1] ?? null;
	let signal = null;
	if (longest && longest.total > 0) {
		if (longest.countUp > longest.countDown) signal = "Up";
		else if (longest.countDown > longest.countUp) signal = "Down";
		else signal = "Tie";
	}
	return {
		seriesLength: dirs.length,
		from: dates[0] ?? null,
		to: dates[dates.length - 1] ?? null,
		current: longest?.patternDirs ?? dirs.slice(-1),
		history,
		longest,
		signal
	};
}
function isCheck1dCommand(raw) {
	return raw.trim().toLowerCase().replace(/\s+/g, "") === "check1d";
}
function OutcomeBadge({ outcome, size = "md" }) {
	const label = outcome ?? "Live";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full font-medium uppercase tracking-wide", size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs", outcome === "Up" && "bg-up-dim text-up", outcome === "Down" && "bg-down-dim text-down", outcome === "Tie" && "bg-raised text-muted", outcome === null && "bg-raised text-live"),
		children: label
	});
}
function Check1dPanel({ markets }) {
	const [input, setInput] = (0, import_react.useState)("");
	const [ran, setRan] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const result = (0, import_react.useMemo)(() => ran ? findLongestCheck1d(markets) : null, [ran, markets]);
	function onSubmit(e) {
		e.preventDefault();
		if (!isCheck1dCommand(input)) {
			setError("Type check1d then run. Uses Polymarket daily Up/Down tape.");
			setRan(false);
			return;
		}
		setError(null);
		setRan(true);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl border border-line bg-surface p-5 shadow-panel md:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs uppercase tracking-widest text-subtle",
						children: "Command"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 text-lg font-medium tracking-tight",
						children: "check1d"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 max-w-xl text-sm text-muted",
						children: "Pull the live Polymarket daily tape, take the latest Up/Down streak, and grow it until that sequence no longer appears in history."
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit,
				className: "mt-4 flex flex-col gap-2 sm:flex-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "sr-only",
						htmlFor: "check1d-cmd",
						children: "Command"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						id: "check1d-cmd",
						value: input,
						onChange: (e) => setInput(e.target.value),
						placeholder: "check1d",
						autoComplete: "off",
						className: "min-h-11 flex-1 rounded-md border border-line bg-raised px-3 font-mono text-sm text-fg outline-none placeholder:text-subtle focus:border-accent"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "submit",
						className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity duration-150 hover:opacity-90",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
							className: "size-4",
							strokeWidth: 2
						}), "Run"]
					})
				]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-down",
				children: error
			}) : null,
			result ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check1dResultView, { result }) : null
		]
	});
}
function Check1dResultView({ result }) {
	if (result.history.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "mt-5 text-sm text-muted",
		children: [
			"No repeating pattern in ",
			result.seriesLength,
			" settled Polymarket days."
		]
	});
	const longest = result.longest;
	const lean = result.signal === "Up" ? "Next day leaned Up after this tape" : result.signal === "Down" ? "Next day leaned Down after this tape" : "No edge after this tape";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5 flex flex-col gap-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-lg border border-line bg-raised p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-xs uppercase tracking-widest text-subtle",
					children: [
						"Longest hit · ",
						result.seriesLength,
						" settled days"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted",
					children: [
						result.from,
						" → ",
						result.to
					]
				})] }), longest ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OutcomeBadge, { outcome: result.signal }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-mono text-sm tabular-nums text-muted",
						children: [
							longest.total,
							" hits · score ",
							longest.score
						]
					})]
				}) : null]
			}), longest ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DirTape, { dirs: longest.patternDirs }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: lean
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 font-mono text-xs tabular-nums text-subtle",
					children: [
						"Up ",
						longest.up,
						"% (",
						longest.countUp,
						") · Down ",
						longest.down,
						"% (",
						longest.countDown,
						")",
						longest.countFlat > 0 ? ` · Flat ${longest.flat}% (${longest.countFlat})` : ""
					]
				})
			] }) : null]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "flex flex-col gap-2",
			children: [...result.history].reverse().map((hit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PatternRow, {
				hit,
				highlight: hit === longest
			}, hit.length))
		})]
	});
}
function PatternRow({ hit, highlight }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: ["rounded-md border px-3 py-3", highlight ? "border-accent/30 bg-raised" : "border-line bg-bg"].join(" "),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-xs uppercase tracking-wider text-subtle",
					children: ["Length ", hit.length]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-xs tabular-nums text-muted",
					children: [
						hit.total,
						" times · score ",
						hit.score
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 break-all font-mono text-xs text-fg",
				children: hit.pattern
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex h-1.5 overflow-hidden rounded-full bg-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full bg-up",
					style: { width: `${hit.up}%` }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full bg-down",
					style: { width: `${hit.down}%` }
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 font-mono text-xs tabular-nums text-subtle",
				children: [
					"Up ",
					hit.up,
					"% (",
					hit.countUp,
					") · Down ",
					hit.down,
					"% (",
					hit.countDown,
					")"
				]
			})
		]
	});
}
function DirTape({ dirs }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-3 flex flex-wrap gap-1",
		children: dirs.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: [
				"inline-flex min-w-9 items-center justify-center rounded-full px-2 py-0.5 font-mono text-xs uppercase",
				d === "up" && "bg-up-dim text-up",
				d === "down" && "bg-down-dim text-down",
				d === "flat" && "bg-raised text-muted"
			].filter(Boolean).join(" "),
			children: d
		}, `${d}-${i}`))
	});
}
function HistoryList({ markets }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [visible, setVisible] = (0, import_react.useState)(40);
	const filtered = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase().replace(/[\s_]+/g, "-");
		return markets.filter((m) => {
			if (filter === "open" && m.closed) return false;
			if (filter === "Up" && m.winner !== "Up") return false;
			if (filter === "Down" && m.winner !== "Down") return false;
			if (!q) return true;
			return `${m.date} ${m.title} ${m.slug} ${m.winner ?? "live"}`.toLowerCase().replace(/[\s_]+/g, "-").includes(q);
		});
	}, [
		markets,
		query,
		filter
	]);
	const slice = filtered.slice(0, visible);
	function downloadCsv() {
		const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "polymarket-btc-daily.csv";
		a.click();
		URL.revokeObjectURL(url);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "min-w-0 rounded-xl border border-line bg-surface p-4 shadow-panel md:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium tracking-tight",
					children: "Daily history"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted",
					children: [filtered.length, " days · sourced from Polymarket Gamma"]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: downloadCsv,
					className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-raised px-3 text-sm text-fg transition-colors duration-150 hover:bg-line",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
						className: "size-4",
						strokeWidth: 2
					}), "Export CSV"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: query,
					onChange: (e) => {
						setQuery(e.target.value);
						setVisible(40);
					},
					placeholder: "Search date or title",
					className: "min-h-11 flex-1 rounded-md border border-line bg-raised px-3 text-sm text-fg outline-none placeholder:text-subtle focus:border-accent"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-4 gap-1 rounded-md border border-line bg-raised p-1",
					children: [
						"all",
						"Up",
						"Down",
						"open"
					].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							setFilter(f);
							setVisible(40);
						},
						className: ["min-h-9 rounded-sm px-2 text-xs font-medium capitalize", filter === f ? "bg-accent text-accent-fg" : "text-muted"].join(" "),
						children: f === "all" ? "All" : f
					}, f))
				})]
			}),
			slice.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-sm text-muted",
				children: "No days match that filter."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 divide-y divide-line",
				children: slice.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistoryRow, { market: m }, m.id))
			}),
			visible < filtered.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setVisible((n) => n + 40),
				className: "mt-3 flex min-h-11 w-full items-center justify-center rounded-md border border-line text-sm text-muted transition-colors duration-150 hover:bg-raised hover:text-fg",
				children: "Load more"
			}) : null
		]
	});
}
function HistoryRow({ market }) {
	const pct = changePct(market);
	const moveTone = pct === null ? "text-muted" : pct >= 0 ? "text-up" : "text-down";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
		className: "py-3",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
			href: market.url,
			target: "_blank",
			rel: "noreferrer",
			className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-24 shrink-0 font-mono text-sm tabular-nums text-muted",
						children: formatEtShort(market.date)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OutcomeBadge, {
						outcome: market.winner,
						size: "sm"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden truncate text-sm text-subtle md:inline",
						children: market.btcOpen && market.btcClose ? `${formatBtc(market.btcOpen)} → ${formatBtc(market.btcClose)}` : market.closed ? "Resolved" : "Open"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-4 pl-24 sm:pl-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `font-mono text-sm tabular-nums ${moveTone}`,
						children: pct === null ? "—" : formatPct(pct)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-sm tabular-nums text-muted",
						children: formatVolume(market.volume)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, {
						className: "size-3.5 shrink-0 text-subtle",
						strokeWidth: 2
					})
				]
			})]
		})
	});
}
function implied(price) {
	if (price === null) return "—";
	return `${Math.round(price * 100)}¢`;
}
var PHASE_LABEL = {
	live: "Live now",
	next: "Next session",
	settled: "Settled"
};
function LiveCard({ market }) {
	if (!market) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "rounded-xl border border-line bg-surface p-5 shadow-panel md:p-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "No live daily market right now."
		})
	});
	const phase = marketPhase(market);
	const favored = (market.upPrice ?? 0) >= (market.downPrice ?? 0) ? "Up" : "Down";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl border border-line bg-surface p-5 shadow-panel md:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs uppercase tracking-widest text-subtle",
						children: PHASE_LABEL[phase]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 text-xl font-medium tracking-tight md:text-2xl",
						children: formatEtDay(market.date)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "Resolves on Binance BTC/USDT noon ET close vs prior noon."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OutcomeBadge, { outcome: market.winner })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsCell, {
						label: "Up",
						value: implied(market.upPrice),
						tone: "up",
						active: favored === "Up" && phase !== "settled"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsCell, {
						label: "Down",
						value: implied(market.downPrice),
						tone: "down",
						active: favored === "Down" && phase !== "settled"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsCell, {
						label: "Price to beat",
						value: market.btcOpen ? formatBtc(market.btcOpen) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OddsCell, {
						label: phase === "settled" ? "Close" : "Volume",
						value: phase === "settled" && market.btcClose ? formatBtc(market.btcClose) : formatVolume(market.volume)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: market.url,
				target: "_blank",
				rel: "noreferrer",
				className: "mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity duration-150 hover:opacity-90",
				children: ["Open on Polymarket", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, {
					className: "size-3.5",
					strokeWidth: 2
				})]
			})
		]
	});
}
function OddsCell({ label, value, tone, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: [
			"rounded-md border px-3 py-3",
			active && tone === "up" ? "border-up/40 bg-up-dim" : "",
			active && tone === "down" ? "border-down/40 bg-down-dim" : "",
			!active ? "border-line bg-raised" : ""
		].join(" "),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs uppercase tracking-wider text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: [
				"mt-1 font-mono text-lg tabular-nums",
				tone === "up" ? "text-up" : "",
				tone === "down" ? "text-down" : ""
			].join(" "),
			children: value
		})]
	});
}
function MonthlySplit({ markets }) {
	const map = /* @__PURE__ */ new Map();
	for (const m of markets) {
		if (!m.closed || !m.winner || m.winner === "Tie") continue;
		const key = m.date.slice(0, 7);
		const row = map.get(key) ?? {
			key,
			label: monthLabel(key),
			up: 0,
			down: 0
		};
		if (m.winner === "Up") row.up += 1;
		else row.down += 1;
		map.set(key, row);
	}
	const rows = [...map.values()].slice(0, 10);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "min-w-0 rounded-xl border border-line bg-surface p-4 md:p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-sm font-medium tracking-tight",
			children: "Monthly split"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex flex-col gap-2.5",
			children: rows.map((row) => {
				const total = row.up + row.down || 1;
				const upPct = row.up / total * 100;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 sm:gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-16 shrink-0 font-mono text-xs text-muted",
							children: row.label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-raised",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full bg-up",
								style: { width: `${upPct}%` }
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full bg-down",
								style: { width: `${100 - upPct}%` }
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "w-16 shrink-0 text-right font-mono text-xs tabular-nums text-subtle",
							children: [
								row.up,
								"U ",
								row.down,
								"D"
							]
						})
					]
				}, row.key);
			})
		})]
	});
}
function monthLabel(key) {
	const [y, m] = key.split("-").map(Number);
	return new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, 1)).toLocaleDateString("en-US", {
		month: "short",
		year: "2-digit",
		timeZone: "UTC"
	});
}
var WEEKDAYS = [
	"M",
	"T",
	"W",
	"T",
	"F",
	"S",
	"S"
];
function mondayIndex(dateKey) {
	const [y, m, d] = dateKey.split("-").map(Number);
	const utc = Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1);
	return (new Date(utc).getUTCDay() + 6) % 7;
}
function addDays(dateKey, days) {
	const [y, m, d] = dateKey.split("-").map(Number);
	return new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, (d ?? 1) + days)).toISOString().slice(0, 10);
}
function OutcomeCalendar({ markets }) {
	const byDate = new Map(markets.map((m) => [m.date, m]));
	const newest = markets[0]?.date;
	if (!newest) return null;
	const gridEnd = addDays(newest, 6 - mondayIndex(newest));
	const cells = [];
	for (let i = 181; i >= 0; i -= 1) cells.push(addDays(gridEnd, -i));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "min-w-0 rounded-xl border border-line bg-surface p-4 md:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium tracking-tight",
					children: "Last 26 weeks"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-subtle",
					children: "Noon ET settlement"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 min-w-0 overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-lg gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-col justify-between py-0.5 text-xs text-subtle",
						children: WEEKDAYS.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "h-3 leading-3",
							children: i % 2 === 0 ? d : ""
						}, `${d}-${i}`))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid w-full grid-flow-col grid-rows-7 gap-1",
						children: cells.map((date) => {
							const m = byDate.get(date);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								title: m ? `${formatEtShort(date)} · ${m.winner ?? "Live"}` : formatEtShort(date),
								className: cn("size-3 rounded-xs sm:size-auto sm:aspect-square sm:min-h-3", !m && "bg-raised", m?.winner === "Up" && "bg-up", m?.winner === "Down" && "bg-down", m?.winner === "Tie" && "bg-muted", m && !m.closed && "bg-live")
							}, date);
						})
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-center gap-4 text-xs text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "inline-block size-2.5 rounded-xs bg-up" }), " Up"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "inline-block size-2.5 rounded-xs bg-down" }), " Down"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "inline-block size-2.5 rounded-xs bg-live" }), " Live"]
					})
				]
			})
		]
	});
}
function StatsRow({ stats }) {
	const items = [
		{
			label: "Resolved days",
			value: String(stats.resolved)
		},
		{
			label: "Up / Down",
			value: `${stats.upDays} / ${stats.downDays}`,
			hint: `${stats.upPct.toFixed(1)}% up`
		},
		{
			label: "Current streak",
			value: stats.currentStreak ? `${stats.currentStreak.length} ${stats.currentStreak.outcome}` : "—"
		},
		{
			label: "Longest run",
			value: `${stats.longestUp}U · ${stats.longestDown}D`
		},
		{
			label: "Total volume",
			value: formatUsd(stats.volume)
		},
		{
			label: "Avg |move|",
			value: stats.avgAbsMove ? `${stats.avgAbsMove.toFixed(2)}%` : "—"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6",
		children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-lg border border-line bg-surface px-3 py-3 md:px-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-wider text-subtle",
					children: item.label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 font-mono text-base tabular-nums md:text-lg",
					children: item.value
				}),
				"hint" in item && item.hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-xs text-muted",
					children: item.hint
				}) : null
			]
		}, item.label))
	});
}
function Home() {
	const markets = Route$1.useLoaderData();
	const stats = computeStats(markets);
	const live = pickHero(markets);
	const tape = markets.filter((m) => m.closed).slice(0, 28);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh min-w-0 max-w-6xl flex-col gap-5 px-4 py-6 pb-16 md:gap-6 md:px-6 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-end md:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs uppercase tracking-widest text-subtle",
						children: "Polymarket"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 text-3xl font-medium tracking-tight md:text-4xl",
						children: "BTC Daily Tape"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 max-w-xl text-sm text-muted",
						children: [
							"Every Bitcoin Up or Down daily market, resolved against Binance noon ET. Type ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-fg",
								children: "check1d"
							}),
							" to find the longest recent tape that already printed in this history."
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-xs tabular-nums text-subtle",
					children: [markets.length, " sessions indexed"]
				})]
			}),
			tape.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-nowrap gap-1 overflow-x-auto pb-1",
				children: tape.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: m.url,
					target: "_blank",
					rel: "noreferrer",
					className: "shrink-0",
					title: `${m.date} ${m.winner ?? ""}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OutcomeBadge, {
						outcome: m.winner,
						size: "sm"
					})
				}, m.id))
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveCard, { market: live }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check1dPanel, { markets }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatsRow, { stats }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid min-w-0 gap-4 lg:grid-cols-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-w-0 lg:col-span-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OutcomeCalendar, { markets })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-w-0 lg:col-span-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonthlySplit, { markets })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistoryList, { markets }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "pt-2 text-xs text-subtle",
				children: "Not financial advice. check1d uses Polymarket noon-ET settlements, not Binance calendar-day candles."
			})
		]
	});
}
//#endregion
export { Home as component };
