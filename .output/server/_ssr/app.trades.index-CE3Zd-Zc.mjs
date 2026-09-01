import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { K as usePlanLimits, Q as useTrades } from "./api-CQV86vH5.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as useLocalState } from "./router-DPngkkDa.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { Et as CircleCheck, M as Plus, Ot as ChevronRight, gt as Download, kt as ChevronLeft, lt as Funnel, rt as Images, wt as CircleX } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, c as DialogTrigger, i as DialogDescription, n as DialogClose, o as DialogHeader, r as DialogContent, s as DialogTitle, t as Dialog } from "./dropdown-menu-CAJl4ZNo.mjs";
import { t as AppShell } from "./AppShell-Cx40ixlT.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BXfiFzvV.mjs";
import { t as Label } from "./label-AutfcB-T.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.trades.index-CE3Zd-Zc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function TradesPage() {
	const navigate = useNavigate();
	const trades = useTrades();
	const limits = usePlanLimits();
	const [query, setQuery] = (0, import_react.useState)("");
	const [side, setSide] = (0, import_react.useState)("all");
	const [plan, setPlan] = (0, import_react.useState)("all");
	const [result, setResult] = (0, import_react.useState)("all");
	const [filterOpen, setFilterOpen] = (0, import_react.useState)(false);
	const [page, setPage] = (0, import_react.useState)(1);
	const PAGE_SIZE = 20;
	const filtered = (0, import_react.useMemo)(() => trades.filter((t) => {
		const q = query.trim().toLowerCase();
		if (q && ![
			t.symbol,
			t.id,
			t.ticket,
			t.strategy,
			t.date
		].some((v) => String(v).toLowerCase().includes(q))) return false;
		if (side !== "all" && t.side !== side) return false;
		if (plan === "yes" && !t.followedPlan) return false;
		if (plan === "no" && t.followedPlan) return false;
		if (result === "win" && t.pnl < 0) return false;
		if (result === "loss" && t.pnl >= 0) return false;
		return true;
	}), [
		query,
		side,
		plan,
		result,
		trades
	]);
	(0, import_react.useEffect)(() => {
		setPage(1);
	}, [
		query,
		side,
		plan,
		result
	]);
	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "معاملات",
		subtitle: "لیست تمام معاملات ثبت‌شده",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				onClick: () => toast.success("خروجی CSV به‌زودی آماده می‌شود"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "ml-1 h-4 w-4" }), "خروجی"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/app/trades/new",
				onClick: (e) => {
					if (limits.maxTradesPerMonth > 0) {
						const now = /* @__PURE__ */ new Date();
						if (trades.filter((t) => {
							const d = new Date(t.date);
							return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
						}).length >= limits.maxTradesPerMonth) {
							e.preventDefault();
							toast.error(`سقف ${limits.maxTradesPerMonth} معامله ماهانه (${limits.slug.toUpperCase()}) پر شده. پلن خود را ارتقا دهید.`);
						}
					}
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "bg-primary text-primary-foreground hover:bg-primary/90",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "ml-1 h-4 w-4" }), "معامله جدید"]
				})
			})]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card-surface p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "جستجوی نماد، شناسه، استراتژی...",
						className: "max-w-xs bg-secondary/60"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
						open: filterOpen,
						onOpenChange: setFilterOpen,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "ml-1 h-4 w-4" }), "فیلترها"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "فیلتر معاملات" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "معاملات را بر اساس معیارهای زیر فیلتر کن." })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نوع معامله" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: side,
											onValueChange: (v) => setSide(v),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "bg-secondary/60",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "all",
													children: "همه"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "buy",
													children: "فقط خرید"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "sell",
													children: "فقط فروش"
												})
											] })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "پایبندی به پلن" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: plan,
											onValueChange: (v) => setPlan(v),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "bg-secondary/60",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "all",
													children: "همه"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "yes",
													children: "طبق پلن"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "no",
													children: "خارج از پلن"
												})
											] })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نتیجه" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: result,
											onValueChange: (v) => setResult(v),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "bg-secondary/60",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "all",
													children: "همه"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "win",
													children: "فقط برنده"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "loss",
													children: "فقط بازنده"
												})
											] })]
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
								className: "mt-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									onClick: () => {
										setSide("all");
										setPlan("all");
										setResult("all");
										toast.success("فیلترها پاک شد");
									},
									children: "پاک کردن"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										className: "bg-primary text-primary-foreground hover:bg-primary/90",
										children: "اعمال"
									})
								})]
							})
						] })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border text-xs text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-3 text-right font-medium",
									children: "شناسه"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-3 text-right font-medium",
									children: "نماد"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-3 text-right font-medium",
									children: "نوع"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-3 text-right font-medium",
									children: "ورود"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-3 text-right font-medium",
									children: "خروج"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-3 text-right font-medium",
									children: "حجم"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-3 text-right font-medium",
									children: "R:R"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-3 text-right font-medium",
									children: "سود/زیان"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-3 text-right font-medium",
									children: "پلن"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-3 text-right font-medium",
									children: "تاریخ"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-3 text-right font-medium",
									children: "اسکرین‌شات"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-3 text-right font-medium",
									children: "جزئیات"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [paginated.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							onClick: () => navigate({
								to: "/app/trades/$id",
								params: { id: t.id }
							}),
							className: "cursor-pointer border-b border-border/50 hover:bg-secondary/30 last:border-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-3 text-xs tabular text-muted-foreground",
									children: t.id
								}),
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
									children: t.entry
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-3 tabular",
									children: t.exit
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
									className: "py-3",
									children: t.followedPlan ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "h-4 w-4 text-destructive" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-3 text-xs text-muted-foreground tabular",
									children: t.date
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShotsCell, {
										id: t.id,
										initial: t.screenshots
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/app/trades/$id",
										params: { id: t.id },
										onClick: (e) => e.stopPropagation(),
										className: "text-xs text-primary hover:underline",
										children: "مشاهده"
									})
								})
							]
						}, t.id)), paginated.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 12,
							className: "py-8 text-center text-sm text-muted-foreground",
							children: "معامله‌ای یافت نشد."
						}) })] })]
					})
				}),
				filtered.length > PAGE_SIZE && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex items-center justify-between text-sm text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"نمایش ",
						(safePage - 1) * PAGE_SIZE + 1,
						"–",
						Math.min(safePage * PAGE_SIZE, filtered.length),
						" از ",
						filtered.length,
						" معامله"
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								size: "sm",
								disabled: safePage <= 1,
								onClick: () => setPage((p) => Math.max(1, p - 1)),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })
							}),
							Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
								let pageNum;
								if (totalPages <= 7) pageNum = i + 1;
								else if (safePage <= 4) pageNum = i + 1;
								else if (safePage >= totalPages - 3) pageNum = totalPages - 6 + i;
								else pageNum = safePage - 3 + i;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: pageNum === safePage ? "default" : "outline",
									size: "sm",
									className: pageNum === safePage ? "bg-primary text-primary-foreground" : "",
									onClick: () => setPage(pageNum),
									children: pageNum
								}, pageNum);
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								size: "sm",
								disabled: safePage >= totalPages,
								onClick: () => setPage((p) => Math.min(totalPages, p + 1)),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" })
							})
						]
					})]
				})
			]
		})
	});
}
/** Screenshot count for a trade (stored per-trade in localStorage). */
function ShotsCell({ id, initial }) {
	const [shots] = useLocalState(`tj:trade-shots:${id}`, initial);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: `inline-flex items-center gap-1 text-xs tabular ${shots.length ? "text-primary" : "text-muted-foreground"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Images, { className: "h-3.5 w-3.5" }), shots.length ? shots.length : "افزودن"]
	});
}
//#endregion
export { TradesPage as component };
