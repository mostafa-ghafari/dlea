import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { K as usePlanLimits, Q as useTrades, W as useDashboard, Z as useSubscription } from "./api-CQV86vH5.mjs";
import { l as usePlatform } from "./router-DPngkkDa.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { F as Percent, Ht as Award, Kt as ArrowDownRight, Lt as CalendarClock, N as Pin, O as Search, S as Sparkles, U as Megaphone, Ut as ArrowUpRight, Yt as Activity, _t as DollarSign, d as TrendingDown, u as TrendingUp } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./AppShell-Cx40ixlT.mjs";
import { a as XAxis, c as Bar, d as ResponsiveContainer, f as Tooltip, i as YAxis, l as Pie, n as PieChart, o as Area, r as BarChart, s as CartesianGrid, t as AreaChart, u as Cell } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.dashboard-uNx8kotH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var faDigits = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
var formatMoney = (n) => {
	return (n > 0 ? "+$" : n < 0 ? "-$" : "$") + faDigits(Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 }));
};
function DashboardPage() {
	const { news } = usePlatform();
	const limits = usePlanLimits();
	useSubscription();
	const dashboard = useDashboard();
	const trades = useTrades();
	const equityCurve = dashboard?.equityCurve ?? [];
	const winLossData = dashboard?.winLossData ?? [];
	const monthlyPerformance = dashboard?.monthlyPerformance ?? [];
	const economicEvents = dashboard?.economicEvents ?? [];
	const totalPnl = dashboard?.totalPnl ?? 0;
	const winRate = dashboard?.winRate ?? 0;
	const profitFactor = dashboard?.profitFactor ?? 0;
	const maxDrawdown = dashboard?.maxDrawdown ?? 0;
	const bestTrade = dashboard?.bestTrade ?? null;
	const worstTrade = dashboard?.worstTrade ?? null;
	const winnerPct = winLossData.find((w) => w.name === "برنده")?.value ?? 0;
	const loserPct = 100 - winnerPct;
	const kpis = [
		{
			label: "سود کل",
			value: formatMoney(totalPnl),
			positive: totalPnl >= 0,
			icon: DollarSign,
			sub: totalPnl >= 0 ? "سود خالص کل معاملات" : "زیان خالص کل معاملات"
		},
		{
			label: "نرخ برد",
			value: faDigits(winRate) + "٪",
			positive: winRate >= 50,
			icon: Percent,
			sub: `${faDigits(dashboard?.tradeCount ?? 0)} معامله`
		},
		{
			label: "Profit Factor",
			value: faDigits(profitFactor),
			positive: profitFactor >= 1,
			icon: TrendingUp,
			sub: "سود ناخالص ÷ زیان ناخالص"
		},
		{
			label: "Max Drawdown",
			value: faDigits(maxDrawdown) + "٪",
			positive: false,
			icon: TrendingDown,
			sub: "حداکثر افت حساب"
		}
	];
	const [tradeQuery, setTradeQuery] = (0, import_react.useState)("");
	const recentTrades = (0, import_react.useMemo)(() => {
		const q = tradeQuery.trim().toLowerCase();
		return (q ? trades.filter((t) => [
			t.symbol,
			t.id,
			t.strategy,
			t.date
		].some((v) => String(v).toLowerCase().includes(q))) : trades).slice(0, 6);
	}, [trades, tradeQuery]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "داشبورد",
		subtitle: "خلاصه عملکرد و آمار کلی حساب شما",
		children: [
			limits.slug === "free" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-gradient-to-l from-primary/5 to-primary/10 px-4 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-5 w-5 shrink-0 text-primary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: "پلن رایگان فعال است."
							}),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "برای دسترسی به هوش مصنوعی، مدیریت ریسک و اتصال متاتریدر، پلن خود را ارتقا دهید."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/app/billing",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "bg-primary text-primary-foreground hover:bg-primary/90",
							children: "ارتقا پلن"
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
				children: kpis.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm text-muted-foreground",
								children: s.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `grid h-8 w-8 place-items-center rounded-lg ${s.positive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s.icon, { className: "h-4 w-4" })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 text-2xl font-bold tabular",
							children: s.value
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `mt-1 flex items-center gap-1 text-xs tabular ${s.positive ? "gain" : "loss"}`,
							children: [s.positive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "h-3 w-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownRight, { className: "h-3 w-3" }), s.sub]
						})
					]
				}, s.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-4 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-5 lg:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-semibold",
							children: "نمودار Equity"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "۳۰ روز اخیر"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: "outline",
							className: "border-primary/40 bg-primary/10 text-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "ml-1 h-3 w-3" }), "زنده"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 h-72",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
							data: equityCurve,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
									id: "eq",
									x1: "0",
									y1: "0",
									x2: "0",
									y2: "1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
										offset: "0%",
										stopColor: "oklch(0.75 0.17 155)",
										stopOpacity: .4
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
										offset: "100%",
										stopColor: "oklch(0.75 0.17 155)",
										stopOpacity: 0
									})]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
									strokeDasharray: "3 3",
									stroke: "oklch(0.28 0.02 255)",
									vertical: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
									dataKey: "day",
									stroke: "oklch(0.68 0.02 255)",
									fontSize: 11,
									tickLine: false,
									axisLine: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
									stroke: "oklch(0.68 0.02 255)",
									fontSize: 11,
									tickLine: false,
									axisLine: false
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
									background: "oklch(0.185 0.022 255)",
									border: "1px solid oklch(0.28 0.02 255)",
									borderRadius: 8
								} }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
									type: "monotone",
									dataKey: "equity",
									stroke: "oklch(0.75 0.17 155)",
									strokeWidth: 2,
									fill: "url(#eq)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
									type: "monotone",
									dataKey: "balance",
									stroke: "oklch(0.68 0.16 245)",
									strokeWidth: 1.5,
									fillOpacity: 0,
									strokeDasharray: "4 4"
								})
							]
						}) })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-semibold",
							children: "نرخ برد / باخت"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [faDigits(dashboard?.tradeCount ?? 0), " معامله"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 h-56",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PieChart, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
								data: winLossData,
								dataKey: "value",
								innerRadius: 55,
								outerRadius: 80,
								paddingAngle: 4,
								children: winLossData.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: e.color }, i))
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
								background: "oklch(0.185 0.022 255)",
								border: "1px solid oklch(0.28 0.02 255)",
								borderRadius: 8
							} })] }) })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-primary/10 p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: "برنده"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-lg font-bold gain tabular",
									children: [faDigits(winnerPct), "٪"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-destructive/10 p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: "بازنده"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-lg font-bold loss tabular",
									children: [faDigits(loserPct), "٪"]
								})]
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-semibold",
							children: "عملکرد ماهانه"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "سود/زیان به دلار"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 h-64",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
								data: monthlyPerformance,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
										strokeDasharray: "3 3",
										stroke: "oklch(0.28 0.02 255)",
										vertical: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
										dataKey: "month",
										stroke: "oklch(0.68 0.02 255)",
										fontSize: 11,
										tickLine: false,
										axisLine: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
										stroke: "oklch(0.68 0.02 255)",
										fontSize: 11,
										tickLine: false,
										axisLine: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
										background: "oklch(0.185 0.022 255)",
										border: "1px solid oklch(0.28 0.02 255)",
										borderRadius: 8
									} }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										dataKey: "pnl",
										radius: [
											6,
											6,
											0,
											0
										],
										children: monthlyPerformance.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: e.pnl >= 0 ? "oklch(0.75 0.17 155)" : "oklch(0.65 0.23 25)" }, i))
									})
								]
							}) })
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarClock, { className: "h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-semibold",
								children: "تقویم اقتصادی"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "رویدادهای مهم امروز بازار فارکس"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 max-h-64 space-y-2 overflow-y-auto pl-1",
							children: economicEvents.map((ev) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-12 shrink-0 text-xs text-muted-foreground tabular",
										children: ev.time
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "grid h-7 w-11 shrink-0 place-items-center rounded-md bg-secondary text-[11px] font-bold",
										children: ev.currency
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "truncate text-sm",
											children: ev.title
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-[11px] text-muted-foreground tabular",
											children: [
												"پیش‌بینی ",
												ev.forecast,
												" • قبلی ",
												ev.previous
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: ev.impact === "high" ? "border-destructive/40 bg-destructive/10 text-destructive" : ev.impact === "medium" ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-muted-foreground",
										children: ev.impact === "high" ? "بالا" : ev.impact === "medium" ? "متوسط" : "کم"
									})
								]
							}, ev.id))
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-4 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-5 lg:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-semibold",
							children: "آخرین معاملات"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: tradeQuery,
									onChange: (e) => setTradeQuery(e.target.value),
									placeholder: "جستجو...",
									className: "h-8 w-40 bg-secondary/60 pr-8 text-xs"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "outline",
								children: [trades.length, " معامله"]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border text-xs text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 text-right font-medium",
										children: "نماد"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 text-right font-medium",
										children: "نوع"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 text-right font-medium",
										children: "حجم"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 text-right font-medium",
										children: "R:R"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 text-right font-medium",
										children: "سود/زیان"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 text-right font-medium",
										children: "تاریخ"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 text-right font-medium",
										children: "جزئیات"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: recentTrades.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border/50 last:border-0 hover:bg-secondary/30",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 font-medium",
										children: t.symbol
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: t.side === "buy" ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive",
											children: t.side === "buy" ? "خرید" : "فروش"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 tabular",
										children: t.volume
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 tabular",
										children: t.rr
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: `py-3 tabular font-medium ${t.pnl >= 0 ? "gain" : "loss"}`,
										children: [
											t.pnl >= 0 ? "+" : "",
											"$",
											t.pnl
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 text-xs text-muted-foreground tabular",
										children: t.date
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/app/trades/$id",
											params: { id: t.id },
											className: "text-xs text-primary hover:underline",
											children: "جزئیات"
										})
									})
								]
							}, t.id)) })]
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-surface p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-sm text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "h-4 w-4 text-primary" }), "بهترین معامله"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 text-lg font-bold",
								children: bestTrade?.symbol ?? "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "gain text-2xl font-bold tabular",
								children: bestTrade ? formatMoney(bestTrade.pnl) : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 text-xs text-muted-foreground",
								children: bestTrade ? `R:R ${faDigits(bestTrade.rr)} • ${bestTrade.date}` : "هنوز معامله‌ای ثبت نشده"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-surface p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-sm text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingDown, { className: "h-4 w-4 text-destructive" }), "بدترین معامله"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 text-lg font-bold",
								children: worstTrade?.symbol ?? "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "loss text-2xl font-bold tabular",
								children: worstTrade ? formatMoney(worstTrade.pnl) : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 text-xs text-muted-foreground",
								children: worstTrade ? `R:R ${faDigits(worstTrade.rr)} • ${worstTrade.date}` : "هنوز معامله‌ای ثبت نشده"
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface mt-6 p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-semibold",
							children: "آخرین اخبار و اطلاعیه‌ها"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/app/news",
						className: "text-xs text-primary hover:underline",
						children: "مشاهده همه"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 grid gap-3 md:grid-cols-3",
					children: [...news].sort((a, b) => Number(b.pinned) - Number(a.pinned)).slice(0, 3).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/app/news/$id",
						params: { id: n.id },
						className: "rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/40 hover:bg-secondary/50",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: "text-[10px]",
										children: n.category
									}),
									n.pinned && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "h-3 w-3 text-primary" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mr-auto text-[11px] text-muted-foreground tabular",
										children: n.date
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 text-sm font-medium",
								children: n.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 line-clamp-2 text-xs text-muted-foreground",
								children: n.summary
							})
						]
					}, n.id))
				})]
			})
		]
	});
}
//#endregion
export { DashboardPage as component };
