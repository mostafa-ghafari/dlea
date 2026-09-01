import { x as useParams, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { Q as useTrades, z as updateTradeScreenshots } from "./api-CQV86vH5.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as useLocalState } from "./router-DPngkkDa.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { Et as CircleCheck, Wt as ArrowRight, rt as Images, wt as CircleX } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./AppShell-Cx40ixlT.mjs";
import { t as ImageUploader } from "./ImageUploader-Di3egqvW.mjs";
import { t as useSetTitle } from "./page-context-DymtNkyQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.trades._id-KLI6kltj.js
var import_jsx_runtime = require_jsx_runtime();
function Row({ label, value, tone }) {
	useSetTitle("معامله پیدا نشد", "شناسه معامله معتبر نیست");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between border-b border-border/50 py-2.5 last:border-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `text-sm font-medium tabular ${tone ?? ""}`,
			children: value
		})]
	});
}
function TradeDetail() {
	const { id } = useParams({ from: "/app/trades/$id" });
	const trade = useTrades().find((t) => t.id === id);
	const [shots, setShots] = useLocalState(`tj:trade-shots:${id}`, trade?.screenshots ?? []);
	function saveShots(next) {
		setShots(next);
		if (!trade) return;
		updateTradeScreenshots(trade.id, next).then(() => toast.success("اسکرین‌شات‌ها در سرور ذخیره شد")).catch((err) => toast.error(`ذخیره اسکرین‌شات ناموفق بود: ${err instanceof Error ? err.message : err}`));
	}
	if (!trade) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "card-surface p-8 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "این معامله در سیستم موجود نیست."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/app/trades",
			className: "mt-4 inline-block",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				children: "بازگشت به معاملات"
			})
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: `معامله ${trade.symbol}`,
		subtitle: `شناسه ${trade.id} • تیکت ${trade.ticket}`,
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/app/trades",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				children: ["بازگشت ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "mr-1 h-4 w-4" })]
			})
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface p-6 lg:col-span-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-xl font-bold",
								children: trade.symbol
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: trade.side === "buy" ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive",
								children: trade.side === "buy" ? "خرید" : "فروش"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								children: trade.strategy
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "outline",
								className: trade.followedPlan ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive",
								children: [trade.followedPlan ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "ml-1 h-3 w-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "ml-1 h-3 w-3" }), trade.followedPlan ? "طبق پلن" : "خارج از پلن"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `mt-4 text-3xl font-bold tabular ${trade.pnl >= 0 ? "gain" : "loss"}`,
						children: [
							trade.pnl >= 0 ? "+" : "",
							"$",
							trade.pnl
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid gap-x-8 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "قیمت ورود",
								value: String(trade.entry)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "قیمت خروج",
								value: String(trade.exit)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Stop Loss",
								value: String(trade.sl)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Take Profit",
								value: String(trade.tp)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "حجم (Lot)",
								value: String(trade.volume)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "R:R",
								value: String(trade.rr)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "پیپ",
								value: String(trade.pips),
								tone: trade.pips >= 0 ? "gain" : "loss"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "کمیسیون",
								value: `$${trade.commission}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "سواپ",
								value: `$${trade.swap}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "مالیات",
								value: `$${trade.taxes}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "زمان باز شدن",
								value: trade.openTime
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "زمان بسته شدن",
								value: trade.closeTime
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "مدت",
								value: trade.duration
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "Magic",
								value: String(trade.magic)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "پرتفولیو",
								value: trade.portfolio
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "احساس",
								value: trade.emotion
							})
						]
					}),
					trade.comment && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 rounded-lg border border-border bg-secondary/40 p-4 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground",
							children: "کامنت متاتریدر"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1",
							children: trade.comment
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface space-y-4 p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Images, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-semibold",
							children: "اسکرین‌شات‌های چارت"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "هر تعداد تصویر می‌توانی اضافه یا حذف کنی؛ تصاویر به‌صورت خودکار فشرده می‌شوند."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageUploader, {
						images: shots,
						onChange: saveShots,
						label: "تصاویر معامله",
						hint: "چارت قبل/بعد از ورود یا Report History"
					})
				]
			})]
		})
	});
}
//#endregion
export { TradeDetail as component };
