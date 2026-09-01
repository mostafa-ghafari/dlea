import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { Z as useSubscription, q as usePlans } from "./api-CQV86vH5.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { Lt as CalendarClock, S as Sparkles, jt as Check, vt as CreditCard } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./AppShell-Cx40ixlT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.billing-DTz5hmtE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function BillingPage() {
	const [coupon, setCoupon] = (0, import_react.useState)("");
	const [cycle, setCycle] = (0, import_react.useState)("monthly");
	const plans = usePlans();
	const sub = useSubscription() ?? {
		plan: "رایگان",
		startDate: "—",
		endDate: "—",
		totalDays: 1,
		daysLeft: 0,
		price: "—"
	};
	const pct = Math.max(0, Math.round(sub.daysLeft / sub.totalDays * 100));
	const sellable = plans.filter((p) => p.sellable && p.id !== "free");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "خرید اشتراک",
		subtitle: " plan مورد نظر خود را انتخاب کنید",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-6 lg:col-span-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm text-muted-foreground",
								children: "اشتراک فعلی"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-2xl font-bold",
								children: sub.plan
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								className: "bg-primary text-primary-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarClock, { className: "ml-1 h-3 w-3" }),
									sub.daysLeft,
									" روز باقی‌مانده"
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-5 h-2 w-full overflow-hidden rounded-full bg-secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full rounded-full bg-primary transition-all",
								style: { width: `${pct}%` }
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 grid gap-4 text-sm sm:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-muted-foreground",
									children: "شروع"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1 tabular",
									children: sub.startDate
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-muted-foreground",
									children: "پایان"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1 tabular",
									children: sub.endDate
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-muted-foreground",
									children: "مبلغ"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1 tabular",
									children: sub.price
								})] })
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-semibold",
							children: "کد تخفیف"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: coupon,
								onChange: (e) => setCoupon(e.target.value),
								placeholder: "کد را وارد کنید",
								className: "bg-secondary/60"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => coupon.trim() ? toast.success("کد تخفیف اعمال شد") : toast.error("کد تخفیف را وارد کن"),
								children: "اعمال"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 rounded-lg bg-primary/10 p-3 text-sm text-primary",
							children: "پرداخت امن از طریق زرین‌پال"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: cycle === "monthly" ? "default" : "outline",
								size: "sm",
								className: cycle === "monthly" ? "bg-primary text-primary-foreground" : "",
								onClick: () => setCycle("monthly"),
								children: "ماهانه"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: cycle === "yearly" ? "default" : "outline",
								size: "sm",
								className: cycle === "yearly" ? "bg-primary text-primary-foreground" : "",
								onClick: () => setCycle("yearly"),
								children: "سالانه (۲ ماه هدیه)"
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-lg font-semibold",
				children: "انتخاب پلن"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3",
				children: sellable.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `card-surface flex flex-col p-6 ${p.highlight ? "border-primary/50 shadow-[var(--shadow-glow)]" : ""}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-lg font-bold",
								children: p.name
							}), p.highlight && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "outline",
								className: "border-primary/40 bg-primary/10 text-primary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "ml-1 h-3 w-3" }), " پیشنهاد ما"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: p.tagline
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex items-baseline gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-2xl font-bold tabular",
								children: p.price
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: p.unit
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 flex-1 space-y-2 text-sm",
							children: p.features.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: f
								})]
							}, f))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "mt-5 bg-primary text-primary-foreground hover:bg-primary/90",
							onClick: () => toast.success(`انتقال به درگاه پرداخت برای پلن ${p.name} (${cycle === "monthly" ? "ماهانه" : "سالانه"})`),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "ml-1 h-4 w-4" }), sub.plan === p.name ? "تمدید اشتراک" : `خرید ${p.name}`]
						})
					]
				}, p.id))
			})
		]
	});
}
//#endregion
export { BillingPage as component };
