import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { J as usePortfolios, r as bulkImportTrades } from "./api-CQV86vH5.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { Et as CircleCheck, St as CloudUpload, Z as Link2, ft as FileSpreadsheet, q as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./AppShell-Cx40ixlT.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BXfiFzvV.mjs";
import { t as Label } from "./label-AutfcB-T.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-DO3DZj4v.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.trades.new-y_4vgkPU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ACCEPT = ".csv,.htm,.html,.xlsx,.xls";
function splitCsvLine(line) {
	const out = [];
	let cur = "";
	let quoted = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === "\"") {
			if (quoted && line[i + 1] === "\"") {
				cur += "\"";
				i++;
			} else quoted = !quoted;
		} else if ((ch === "," || ch === ";" || ch === "	") && !quoted) {
			out.push(cur.trim());
			cur = "";
		} else cur += ch;
	}
	out.push(cur.trim());
	return out;
}
/** Extracts closed-deal rows from a MetaTrader CSV or HTML statement. */
function parseStatement(text, isHtml) {
	const rows = [];
	if (isHtml) (text.match(/<tr[\s\S]*?<\/tr>/gi) ?? []).forEach((tr) => {
		const cells = (tr.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? []).map((c) => c.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim());
		if (cells.length >= 6) rows.push(cells);
	});
	else text.split(/\r?\n/).filter((l) => l.trim().length > 0).forEach((l) => rows.push(splitCsvLine(l)));
	const num = (v) => Number(String(v).replace(/[^\d.\-]/g, ""));
	const trades = [];
	rows.forEach((c) => {
		const symbolIdx = c.findIndex((v) => /^[A-Za-z]{6}(\.[a-z]+)?$|^(XAUUSD|XAGUSD|US30|NAS100)/i.test(v.trim()));
		const sideIdx = c.findIndex((v) => /^(buy|sell)$/i.test(v.trim()));
		if (symbolIdx === -1 || sideIdx === -1) return;
		const ticket = c.find((v) => /^\d{6,}$/.test(v.trim())) ?? "-";
		const times = c.filter((v) => /\d{4}[./-]\d{2}[./-]\d{2}[ T]\d{2}:\d{2}/.test(v));
		const numbers = c.filter((v) => /^-?[\d\s,]*\.?\d+$/.test(v.trim()) && v.trim() !== ticket);
		const profitRaw = numbers.length ? numbers[numbers.length - 1] : "0";
		const volumeRaw = c[sideIdx + 1] && num(c[sideIdx + 1]) ? c[sideIdx + 1] : numbers[0] ?? "0";
		trades.push({
			ticket,
			symbol: c[symbolIdx].toUpperCase(),
			side: c[sideIdx].toLowerCase() === "buy" ? "خرید" : "فروش",
			volume: String(num(volumeRaw) || 0),
			openTime: times[0] ?? "-",
			closeTime: times[1] ?? "-",
			profit: String(num(profitRaw) || 0)
		});
	});
	return trades;
}
function normalizeMtDate(raw) {
	const cleaned = raw.replace(/\./g, "-").trim();
	if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(cleaned)) return (/:\d{2}$/.test(cleaned) ? cleaned : `${cleaned}:00`).replace(" ", "T");
	return (/* @__PURE__ */ new Date()).toISOString();
}
function ImportPanel() {
	const inputRef = (0, import_react.useRef)(null);
	const navigate = useNavigate();
	const portfolios = usePortfolios();
	const [file, setFile] = (0, import_react.useState)(null);
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [parsed, setParsed] = (0, import_react.useState)([]);
	const [portfolioId, setPortfolioId] = (0, import_react.useState)("");
	async function pick(f) {
		if (!f) return;
		if (!/\.(csv|html?|xlsx?|xls)$/i.test(f.name)) {
			toast.error("فرمت فایل پشتیبانی نمی‌شود (CSV، HTML یا Excel)");
			return;
		}
		setFile(f);
		setParsed([]);
		if (/\.(csv|html?)$/i.test(f.name)) try {
			const rows = parseStatement(await f.text(), /\.html?$/i.test(f.name));
			setParsed(rows);
			if (rows.length === 0) toast.warning("معامله‌ای در فایل شناسایی نشد — ساختار گزارش را بررسی کن");
			else toast.success(`${rows.length} معامله در فایل «${f.name}» شناسایی شد`);
		} catch {
			toast.error("خواندن فایل ناموفق بود");
		}
		else toast.success(`فایل «${f.name}» انتخاب شد — پیش‌نمایش فقط برای CSV/HTML است`);
	}
	async function startImport() {
		if (!file) {
			toast.error("ابتدا فایل گزارش متاتریدر را انتخاب کن");
			return;
		}
		if (parsed.length === 0) {
			toast.error("معامله‌ای در فایل شناسایی نشد — از CSV یا HTML استفاده کن");
			return;
		}
		if (!portfolioId) {
			toast.error("پرتفولیوی مقصد را انتخاب کن");
			return;
		}
		const pid = Number(portfolioId);
		const items = parsed.map((t) => ({
			ticket: t.ticket === "-" ? `IMP-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e3)}` : t.ticket,
			symbol: t.symbol,
			side: t.side === "خرید" ? "buy" : "sell",
			volume: Number(t.volume) || 0,
			pnl: Number(t.profit) || 0,
			entry: 0,
			exit: 0,
			sl: 0,
			tp: 0,
			rr: 0,
			pips: 0,
			commission: 0,
			swap: 0,
			taxes: 0,
			open_time: normalizeMtDate(t.openTime),
			close_time: normalizeMtDate(t.closeTime),
			magic: 0,
			comment: "",
			reason: "Client",
			strategy: "",
			portfolio_id: pid,
			followedPlan: true,
			emotion: "آرام",
			screenshots: []
		}));
		setBusy(true);
		try {
			const res = await bulkImportTrades(items);
			if (res.created === 0) {
				toast.error("هیچ معامله‌ای ثبت نشد — داده‌های فایل را بررسی کن");
				setBusy(false);
				return;
			}
			toast.success(`${res.created} معامله از فایل «${file.name}» ایمپورت شد`);
			navigate({ to: "/app/trades" });
		} catch (err) {
			setBusy(false);
			toast.error(`ایمپورت ناموفق بود: ${err instanceof Error ? err.message : err}`);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4 lg:grid-cols-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card-surface space-y-4 p-6 lg:col-span-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-semibold",
						children: "ایمپورت گزارش معاملات"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"از متاتریدر خروجی ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: "History / Report"
						}),
						" بگیر و فایل را اینجا بارگذاری کن. تمام فیلدها (Ticket، Symbol، Volume، Swap، Commission و ...) به‌صورت خودکار خوانده می‌شود."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					onDragOver: (e) => {
						e.preventDefault();
						setDragging(true);
					},
					onDragLeave: () => setDragging(false),
					onDrop: (e) => {
						e.preventDefault();
						setDragging(false);
						pick(e.dataTransfer.files?.[0] ?? null);
					},
					onClick: () => inputRef.current?.click(),
					className: `flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border bg-secondary/30 hover:bg-secondary/50"}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudUpload, { className: "mx-auto h-9 w-9 text-muted-foreground" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm",
							children: file ? file.name : "فایل را بکش و رها کن یا کلیک کن"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: "CSV, HTML, XLSX — حداکثر ۱۰ مگابایت"
						})
					] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: inputRef,
					type: "file",
					accept: ACCEPT,
					className: "hidden",
					onChange: (e) => pick(e.target.files?.[0] ?? null)
				}),
				parsed.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-border bg-secondary/30 p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-medium",
							children: "پیش‌نمایش معاملات شناسایی‌شده"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: "outline",
							className: "border-primary/40 bg-primary/10 text-primary tabular",
							children: [parsed.length, " معامله"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "max-h-64 overflow-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full min-w-[560px] text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border text-xs text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 text-right",
										children: "تیکت"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 text-right",
										children: "نماد"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 text-right",
										children: "نوع"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 text-right",
										children: "حجم"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 text-right",
										children: "زمان باز"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 text-right",
										children: "سود/زیان"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: parsed.slice(0, 50).map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border/40 last:border-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 text-xs tabular text-muted-foreground",
										children: t.ticket
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 font-medium",
										children: t.symbol
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2",
										children: t.side
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 tabular",
										children: t.volume
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 text-xs tabular text-muted-foreground",
										children: t.openTime
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: `py-2 tabular ${Number(t.profit) >= 0 ? "gain" : "loss"}`,
										children: t.profit
									})
								]
							}, `${t.ticket}-${i}`)) })]
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "پرتفولیو مقصد" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: portfolioId,
							onValueChange: setPortfolioId,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								className: "bg-secondary/60",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "انتخاب پرتفولیو" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [portfolios.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "none",
								disabled: true,
								children: "اول یک پرتفولیو بساز"
							}), portfolios.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: p.id,
								children: p.name
							}, p.id))] })]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نسخه متاتریدر" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							defaultValue: "mt5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								className: "bg-secondary/60",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "mt4",
								children: "MT4"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "mt5",
								children: "MT5"
							})] })]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 pt-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: startImport,
						disabled: busy,
						className: "bg-primary text-primary-foreground hover:bg-primary/90",
						children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "ml-1 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudUpload, { className: "ml-1 h-4 w-4" }), "شروع ایمپورت"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => {
							setFile(null);
							setParsed([]);
						},
						children: "پاک کردن"
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card-surface space-y-3 p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-semibold",
				children: "راهنمای خروجی گرفتن"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "space-y-3 text-sm text-muted-foreground",
				children: [
					"در متاتریدر به تب History برو.",
					"بازه زمانی دلخواه را انتخاب کن.",
					"راست‌کلیک → Report → گزینه HTML یا XLSX.",
					"فایل ذخیره‌شده را اینجا بارگذاری کن."
				].map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-5 w-5 shrink-0 place-items-center rounded-md bg-primary/15 text-[11px] font-bold text-primary tabular",
						children: i + 1
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t })]
				}, i))
			})]
		})]
	});
}
function ConnectPanel() {
	const [connected, setConnected] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4 lg:grid-cols-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card-surface space-y-4 p-6 lg:col-span-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-semibold",
						children: "اتصال مستقیم متاتریدر"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "با رمز Investor (فقط خواندنی) حساب را متصل کن تا معاملات جدید به‌صورت خودکار جمع‌آوری شوند."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نسخه" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								defaultValue: "mt5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "bg-secondary/60",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "mt4",
									children: "MT4"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "mt5",
									children: "MT5"
								})] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "سرور بروکر" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "ICMarkets-Live01",
								className: "bg-secondary/60"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "شماره حساب" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "12345678",
								className: "bg-secondary/60 tabular"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "رمز Investor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "password",
								placeholder: "••••••••",
								className: "bg-secondary/60"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 sm:col-span-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "دوره همگام‌سازی" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								defaultValue: "15",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "bg-secondary/60",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "5",
										children: "هر ۵ دقیقه"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "15",
										children: "هر ۱۵ دقیقه"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "60",
										children: "هر ساعت"
									})
								] })]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 pt-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						disabled: busy,
						onClick: () => {
							setBusy(true);
							setTimeout(() => {
								setBusy(false);
								setConnected(true);
								toast.success("حساب متصل شد — معاملات به‌صورت خودکار همگام می‌شوند");
							}, 1200);
						},
						className: "bg-primary text-primary-foreground hover:bg-primary/90",
						children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "ml-1 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "ml-1 h-4 w-4" }), "اتصال حساب"]
					}), connected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						variant: "outline",
						className: "border-primary/40 bg-primary/10 text-primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "ml-1 h-3 w-3" }), " متصل"]
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card-surface space-y-3 p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-semibold",
				children: "مزایای اتصال خودکار"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2 text-sm text-muted-foreground",
				children: [
					"ثبت خودکار همه معاملات بدون کار دستی",
					"دریافت کامل Swap، Commission و Ticket ID",
					"هشدار لحظه‌ای نزدیک شدن به سقف ریسک",
					"به‌روزرسانی داشبورد و گزارش‌های AI"
				].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-start gap-2 rounded-lg border border-border bg-secondary/40 p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t })]
				}, t))
			})]
		})]
	});
}
function NewTrade() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "افزودن معامله",
		subtitle: "ایمپورت فایل یا اتصال متاتریدر",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "import",
			dir: "rtl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
					value: "import",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "ml-1 h-4 w-4" }), "ایمپورت فایل"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
					value: "connect",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "ml-1 h-4 w-4" }), "اتصال متاتریدر"]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "import",
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImportPanel, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "connect",
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConnectPanel, {})
				})
			]
		})
	});
}
//#endregion
export { NewTrade as component };
