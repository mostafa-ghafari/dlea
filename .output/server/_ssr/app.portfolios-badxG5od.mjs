import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { K as usePlanLimits, L as updatePortfolio, T as fetchPortfolios, d as deletePortfolio, s as createPortfolio } from "./api-CQV86vH5.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { s as useHasPortfolio } from "./router-DPngkkDa.mjs";
import { n as cn, t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { Jt as ArchiveRestore, M as Plus, Nt as ChartColumn, Z as Link2, bt as Copy, f as Trash2, ht as EllipsisVertical, qt as Archive, r as Wallet, x as SquarePen } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, d as DropdownMenuItem, f as DropdownMenuLabel, i as DialogDescription, l as DropdownMenu, m as DropdownMenuTrigger, n as DialogClose, o as DialogHeader, p as DropdownMenuSeparator, r as DialogContent, s as DialogTitle, t as Dialog, u as DropdownMenuContent } from "./dropdown-menu-CAJl4ZNo.mjs";
import { t as AppShell } from "./AppShell-Cx40ixlT.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BXfiFzvV.mjs";
import { t as Label } from "./label-AutfcB-T.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.portfolios-badxG5od.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Portfolios() {
	const [portfolios, setPortfolios] = (0, import_react.useState)([]);
	const [, setHasPortfolio] = useHasPortfolio();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [loaded, setLoaded] = (0, import_react.useState)(false);
	const limits = usePlanLimits();
	const atPortfolioLimit = limits.maxPortfolios > 0 && portfolios.length >= limits.maxPortfolios;
	const [name, setName] = (0, import_react.useState)("");
	const [broker, setBroker] = (0, import_react.useState)("");
	const [balance, setBalance] = (0, import_react.useState)("");
	const [currency, setCurrency] = (0, import_react.useState)("USD");
	const [leverage, setLeverage] = (0, import_react.useState)("1:100");
	const [strategy, setStrategy] = (0, import_react.useState)("");
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [editForm, setEditForm] = (0, import_react.useState)({
		name: "",
		broker: "",
		strategy: "",
		balance: "",
		leverage: "1:100",
		currency: "USD"
	});
	function openEdit(p) {
		setEditing(p);
		setEditForm({
			name: p.name,
			broker: p.broker,
			strategy: p.strategy,
			balance: String(p.balance),
			leverage: p.leverage,
			currency: p.currency
		});
	}
	async function saveEdit(e) {
		e.preventDefault();
		if (!editing) return;
		if (!editForm.name.trim()) {
			toast.error("نام پرتفولیو الزامی است");
			return;
		}
		try {
			const updated = await updatePortfolio(editing.id, {
				name: editForm.name.trim(),
				broker: editForm.broker.trim() || editing.broker,
				strategy: editForm.strategy.trim() || "",
				balance: Number(editForm.balance) || editing.balance,
				leverage: editForm.leverage,
				currency: editForm.currency
			});
			setPortfolios((list) => list.map((p) => p.id === editing.id ? updated : p));
			toast.success("پرتفولیو به‌روزرسانی شد");
		} catch (err) {
			toast.error(`به‌روزرسانی پرتفولیو ناموفق بود: ${err instanceof Error ? err.message : err}`);
			return;
		}
		setEditing(null);
	}
	async function toggleArchive(p) {
		const next = p.status === "آرشیو" ? "فعال" : "آرشیو";
		try {
			const updated = await updatePortfolio(p.id, { status: next });
			setPortfolios((list) => list.map((x) => x.id === p.id ? updated : x));
			toast.success(next === "آرشیو" ? `${p.name} آرشیو شد` : `${p.name} از آرشیو خارج شد`);
		} catch (err) {
			toast.error(`تغییر وضعیت پرتفولیو ناموفق بود: ${err instanceof Error ? err.message : err}`);
		}
	}
	async function remove(p) {
		try {
			await deletePortfolio(p.id);
			setPortfolios((list) => list.filter((x) => x.id !== p.id));
			toast.success(`پرتفولیو «${p.name}» حذف شد`);
		} catch (err) {
			toast.error(`حذف پرتفولیو ناموفق بود: ${err instanceof Error ? err.message : err}`);
		}
	}
	async function duplicate(p) {
		try {
			const created = await createPortfolio({
				name: `${p.name} (کپی)`,
				broker: p.broker,
				type: p.type,
				balance: p.balance,
				initial: p.initial,
				leverage: p.leverage,
				currency: p.currency,
				trades: 0,
				status: p.status,
				strategy: p.strategy
			});
			setPortfolios((list) => [...list, created]);
			toast.success("کپی پرتفولیو ساخته شد");
		} catch (err) {
			toast.error(`ساخت کپی ناموفق بود: ${err instanceof Error ? err.message : err}`);
		}
	}
	(0, import_react.useEffect)(() => {
		let alive = true;
		fetchPortfolios().then((list) => {
			if (!alive) return;
			setPortfolios(list);
			setLoaded(true);
		}).catch(() => alive && toast.error("دریافت پرتفولیوها از سرور ممکن نشد"));
		return () => {
			alive = false;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (loaded && portfolios.length === 0) setOpen(true);
	}, [loaded, portfolios.length]);
	async function submit(e) {
		e.preventDefault();
		if (!name.trim() || !broker.trim()) {
			toast.error("نام و بروکر الزامی است");
			return;
		}
		const initial = Number(balance) || 0;
		try {
			const created = await createPortfolio({
				name: name.trim(),
				broker: broker.trim(),
				type: "استاندارد",
				balance: initial,
				initial,
				leverage,
				currency,
				trades: 0,
				status: "فعال",
				strategy: strategy.trim() || ""
			});
			setPortfolios((p) => [...p, created]);
			setHasPortfolio(true);
			toast.success(`پرتفولیو «${created.name}» ساخته شد`);
		} catch (err) {
			toast.error(`ساخت پرتفولیو ناموفق بود: ${err instanceof Error ? err.message : err}`);
			return;
		}
		setStrategy("");
		setName("");
		setBroker("");
		setBalance("");
		setCurrency("USD");
		setLeverage("1:100");
		setOpen(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "پرتفولیوها",
		subtitle: "مدیریت حساب‌های معاملاتی",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			className: "bg-primary text-primary-foreground hover:bg-primary/90",
			onClick: () => setOpen(true),
			disabled: atPortfolioLimit,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "ml-1 h-4 w-4" }), atPortfolioLimit ? "سقف پرتفولیو پر شد" : "پرتفولیو جدید"]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open,
				onOpenChange: setOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: submit,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "پرتفولیو جدید" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "یک حساب معاملاتی جدید اضافه کن. بعداً می‌توانی به MT4/MT5 متصل کنی." })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid gap-4 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 sm:col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نام پرتفولیو" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: name,
										onChange: (e) => setName(e.target.value),
										placeholder: "پرتفوی اصلی",
										className: "bg-secondary/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 sm:col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نام استراتژی" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: strategy,
										onChange: (e) => setStrategy(e.target.value),
										placeholder: "Order Block لندن",
										className: "bg-secondary/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "بروکر" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: broker,
										onChange: (e) => setBroker(e.target.value),
										placeholder: "IC Markets",
										className: "bg-secondary/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "موجودی اولیه" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										value: balance,
										onChange: (e) => setBalance(e.target.value),
										className: "bg-secondary/60 tabular"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "ارز" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: currency,
										onValueChange: setCurrency,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "bg-secondary/60",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
											"USD",
											"USDT",
											"EUR",
											"IRR"
										].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: c,
											children: c
										}, c)) })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "لوریج" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: leverage,
										onValueChange: setLeverage,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "bg-secondary/60",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
											"1:1",
											"1:30",
											"1:100",
											"1:200",
											"1:500"
										].map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: l,
											children: l
										}, l)) })]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
							className: "mt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									children: "انصراف"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								className: "bg-primary text-primary-foreground hover:bg-primary/90",
								children: "ایجاد پرتفولیو"
							})]
						})
					]
				}) })
			}),
			limits.maxPortfolios > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-2.5 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "h-4 w-4 text-muted-foreground" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted-foreground",
						children: [
							portfolios.length,
							" از ",
							limits.maxPortfolios,
							" پرتفولیو استفاده شده"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-2 h-1.5 flex-1 overflow-hidden rounded-full bg-secondary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("h-full rounded-full transition-all", portfolios.length >= limits.maxPortfolios ? "bg-destructive" : "bg-primary"),
							style: { width: `${Math.min(100, portfolios.length / limits.maxPortfolios * 100)}%` }
						})
					}),
					atPortfolioLimit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/app/billing",
						className: "text-xs font-medium text-primary hover:underline",
						children: "ارتقا پلن →"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
				children: portfolios.map((p) => {
					const pnl = p.balance - p.initial;
					const pct = p.initial ? pnl / p.initial * 100 : 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-surface p-5 transition-all hover:border-primary/40",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "h-5 w-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-semibold",
										children: p.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted-foreground",
										children: p.broker
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, {
									dir: "rtl",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "icon",
											className: "h-8 w-8",
											"aria-label": "گزینه‌های پرتفولیو",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EllipsisVertical, { className: "h-4 w-4" })
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
										align: "start",
										className: "w-52",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuLabel, { children: p.name }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onSelect: () => openEdit(p),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "ml-2 h-4 w-4" }), "ویرایش پرتفولیو"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onSelect: () => toast.success(`اتصال ${p.name} به متاتریدر شروع شد`),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "ml-2 h-4 w-4" }), "اتصال به متاتریدر"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onSelect: () => toast.info(`گزارش عملکرد ${p.name} در حال آماده‌سازی است`),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { className: "ml-2 h-4 w-4" }), "گزارش عملکرد"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onSelect: () => duplicate(p),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "ml-2 h-4 w-4" }), "ساخت کپی"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onSelect: () => toggleArchive(p),
												children: [p.status === "آرشیو" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArchiveRestore, { className: "ml-2 h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "ml-2 h-4 w-4" }), p.status === "آرشیو" ? "خروج از آرشیو" : "آرشیو کردن"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												className: "text-destructive focus:text-destructive",
												onSelect: () => remove(p),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "ml-2 h-4 w-4" }), "حذف پرتفولیو"]
											})
										]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg bg-secondary/40 p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-muted-foreground",
										children: "موجودی فعلی"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-1 text-lg font-bold tabular",
										children: ["$", p.balance.toLocaleString()]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg bg-secondary/40 p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-muted-foreground",
										children: "سود / زیان"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `mt-1 text-lg font-bold tabular ${pnl >= 0 ? "gain" : "loss"}`,
										children: [
											pnl >= 0 ? "+" : "",
											"$",
											pnl.toLocaleString()
										]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 grid grid-cols-3 gap-2 text-xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "لوریج:"
										}),
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular",
											children: p.leverage
										})
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "ارز:"
										}),
										" ",
										p.currency
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "معاملات:"
										}),
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular",
											children: p.trades
										})
									] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 flex items-center justify-between border-t border-border pt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: p.status === "فعال" ? "border-primary/40 bg-primary/10 text-primary" : "",
									children: p.status
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `text-sm font-medium tabular ${pct >= 0 ? "gain" : "loss"}`,
									children: [
										pct >= 0 ? "+" : "",
										pct.toFixed(2),
										"٪"
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										variant: "outline",
										className: "flex-1",
										onClick: () => toast.success(`اتصال ${p.name} به متاتریدر شروع شد`),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "ml-1 h-3 w-3" }), "اتصال MT"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "outline",
										"aria-label": "ویرایش",
										onClick: () => openEdit(p),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "h-3 w-3" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "outline",
										"aria-label": "آرشیو",
										onClick: () => toggleArchive(p),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "h-3 w-3" })
									})
								]
							})
						]
					}, p.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!editing,
				onOpenChange: (o) => !o && setEditing(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: saveEdit,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "ویرایش پرتفولیو" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "اطلاعات حساب معاملاتی را به‌روزرسانی کن." })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid gap-4 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 sm:col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نام پرتفولیو" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: editForm.name,
										onChange: (e) => setEditForm({
											...editForm,
											name: e.target.value
										}),
										className: "bg-secondary/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 sm:col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نام استراتژی" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: editForm.strategy,
										onChange: (e) => setEditForm({
											...editForm,
											strategy: e.target.value
										}),
										className: "bg-secondary/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "بروکر" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: editForm.broker,
										onChange: (e) => setEditForm({
											...editForm,
											broker: e.target.value
										}),
										className: "bg-secondary/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "موجودی فعلی" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										value: editForm.balance,
										onChange: (e) => setEditForm({
											...editForm,
											balance: e.target.value
										}),
										className: "bg-secondary/60 tabular"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "ارز" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: editForm.currency,
										onValueChange: (v) => setEditForm({
											...editForm,
											currency: v
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "bg-secondary/60",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
											"USD",
											"USDT",
											"EUR",
											"IRR"
										].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: c,
											children: c
										}, c)) })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "لوریج" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: editForm.leverage,
										onValueChange: (v) => setEditForm({
											...editForm,
											leverage: v
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "bg-secondary/60",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
											"1:1",
											"1:30",
											"1:100",
											"1:200",
											"1:500"
										].map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: l,
											children: l
										}, l)) })]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
							className: "mt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => setEditing(null),
								children: "انصراف"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								className: "bg-primary text-primary-foreground hover:bg-primary/90",
								children: "ذخیره تغییرات"
							})]
						})
					]
				}) })
			})
		]
	});
}
//#endregion
export { Portfolios as component };
