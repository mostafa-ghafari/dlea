import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { A as get, U as useApi } from "./api-CQV86vH5.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { Ot as ChevronRight, kt as ChevronLeft } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./AppShell-Cx40ixlT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.calendar-C5LaMcFR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var weekdays = [
	"ش",
	"ی",
	"د",
	"س",
	"چ",
	"پ",
	"ج"
];
var JALALI_MONTHS = [
	"",
	"فروردین",
	"اردیبهشت",
	"خرداد",
	"تیر",
	"مرداد",
	"شهریور",
	"مهر",
	"آبان",
	"آذر",
	"دی",
	"بهمن",
	"اسفند"
];
function useDefaultJalali() {
	return (0, import_react.useMemo)(() => {
		const now = /* @__PURE__ */ new Date();
		const gY = now.getFullYear();
		const gM = now.getMonth() + 1;
		const gD = now.getDate();
		return {
			year: Math.floor(gY + (gM > 2 ? 0 : -1) + (gD > 21 ? 1 : 0) - 621),
			month: Math.max(1, Math.min(12, gM <= 3 ? gM + 9 : gM - 3))
		};
	}, []);
}
function useCalendar(year, month) {
	return useApi(() => get(`calendar/?year=${year}&month=${month}`), [year, month]);
}
function CalendarPage() {
	const def = useDefaultJalali();
	const [year, setYear] = (0, import_react.useState)(def.year);
	const [month, setMonth] = (0, import_react.useState)(def.month);
	const { data: calDays } = useCalendar(year, month);
	const days = calDays ?? [];
	const totalPnl = days.reduce((s, d) => s + d.pnl, 0);
	const winDays = days.filter((d) => d.day && d.pnl > 0).length;
	const loseDays = days.filter((d) => d.day && d.pnl < 0).length;
	function prevMonth() {
		if (month === 1) {
			setMonth(12);
			setYear((y) => y - 1);
		} else setMonth((m) => m - 1);
	}
	function nextMonth() {
		if (month === 12) {
			setMonth(1);
			setYear((y) => y + 1);
		} else setMonth((m) => m + 1);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "تقویم معاملاتی",
		subtitle: `${JALALI_MONTHS[month]} ${year}`,
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "icon",
					onClick: prevMonth,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-32 text-center font-medium",
					children: [
						JALALI_MONTHS[month],
						" ",
						year
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "icon",
					onClick: nextMonth,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" })
				})
			]
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted-foreground",
						children: "مجموع ماه"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `mt-2 text-2xl font-bold tabular ${totalPnl >= 0 ? "gain" : "loss"}`,
						children: [
							totalPnl >= 0 ? "+" : "",
							"$",
							totalPnl.toFixed(0)
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted-foreground",
						children: "روزهای سودده"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 text-2xl font-bold tabular gain",
						children: winDays
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted-foreground",
						children: "روزهای زیان‌ده"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 text-2xl font-bold tabular loss",
						children: loseDays
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted-foreground",
						children: "بهترین روز"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 text-2xl font-bold tabular gain",
						children: ["+$", days.length ? Math.max(...days.map((d) => d.pnl)).toFixed(0) : "0"]
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "card-surface mt-6 p-2 sm:p-4 md:p-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-7 gap-1 sm:gap-2",
				children: [weekdays.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pb-2 text-center text-[10px] font-medium text-muted-foreground sm:text-xs",
					children: w
				}, w)), days.map((c, i) => {
					if (!c.day) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "aspect-square" }, i);
					const intensity = Math.min(Math.abs(c.pnl) / 800, 1);
					const bg = c.pnl > 0 ? `oklch(0.55 ${.1 * intensity + .05} 155 / ${.18 + intensity * .4})` : c.pnl < 0 ? `oklch(0.55 ${.15 * intensity + .05} 25 / ${.18 + intensity * .4})` : "transparent";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						title: c.pnl !== 0 ? `${c.pnl > 0 ? "+" : ""}$${c.pnl} — ${c.trades} معامله` : void 0,
						className: "flex aspect-square min-w-0 flex-col justify-between overflow-hidden rounded-md border border-border p-1 transition-all hover:border-primary/50 sm:rounded-lg sm:p-2 sm:hover:scale-105",
						style: { background: bg },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[10px] leading-none text-foreground/80 tabular sm:text-xs",
							children: c.day
						}), c.pnl !== 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `truncate text-[9px] font-bold leading-tight tabular sm:text-xs ${c.pnl > 0 ? "gain" : "loss"}`,
								children: [
									c.pnl > 0 ? "+" : "",
									"$",
									Math.abs(c.pnl) >= 1e3 ? `${(c.pnl / 1e3).toFixed(1)}k` : c.pnl
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-0.5 hidden text-[10px] text-muted-foreground sm:block",
								children: [c.trades, " معامله"]
							})]
						})]
					}, i);
				})]
			})
		})]
	});
}
//#endregion
export { CalendarPage as component };
