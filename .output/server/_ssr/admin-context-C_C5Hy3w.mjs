import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { B as updateUser, C as fetchPayments, O as fetchUsers, f as deleteUser, h as fetchAdminStats, m as fetchAdminCharts, p as fetchAdminAiApis, w as fetchPlans } from "./api-CQV86vH5.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as usePlatform } from "./router-DPngkkDa.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { $ as LifeBuoy, D as Send, I as Pencil, M as Plus, O as Search, Ot as ChevronRight, T as ShieldAlert, U as Megaphone, W as Mail, Yt as Activity, f as Trash2, ht as EllipsisVertical, kt as ChevronLeft, pt as Eye, vt as CreditCard } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, d as DropdownMenuItem, i as DialogDescription, l as DropdownMenu, m as DropdownMenuTrigger, n as DialogClose, o as DialogHeader, p as DropdownMenuSeparator, r as DialogContent, s as DialogTitle, t as Dialog, u as DropdownMenuContent } from "./dropdown-menu-CAJl4ZNo.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BXfiFzvV.mjs";
import { t as Textarea } from "./textarea-Cp94w9lz.mjs";
import { t as RichTextEditor } from "./RichTextEditor-DDB2UcoM.mjs";
import { t as Label } from "./label-AutfcB-T.mjs";
import { t as Switch } from "./switch-Cp8Exbjp.mjs";
import { a as XAxis, c as Bar, d as ResponsiveContainer, f as Tooltip, i as YAxis, o as Area, r as BarChart, s as CartesianGrid, t as AreaChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-context-C_C5Hy3w.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AdminContext = (0, import_react.createContext)({
	userQuery: "",
	setUserQuery: () => {},
	paymentQuery: "",
	setPaymentQuery: () => {},
	stats: null,
	aiApis: null
});
function useAdminContext() {
	return (0, import_react.useContext)(AdminContext);
}
function AdminProvider({ children }) {
	const [userQuery, setUserQuery] = (0, import_react.useState)("");
	const [paymentQuery, setPaymentQuery] = (0, import_react.useState)("");
	const stats = useAdminStats();
	const aiApis = useAdminAiApis();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminContext.Provider, {
		value: {
			userQuery,
			setUserQuery,
			paymentQuery,
			setPaymentQuery,
			stats,
			aiApis
		},
		children
	});
}
function useAdminStats() {
	const [stats, setStats] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		fetchAdminStats().then(setStats).catch(() => {});
	}, []);
	return stats;
}
function useAdminAiApis() {
	const [data, setData] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		fetchAdminAiApis().then(setData).catch(() => {});
	}, []);
	return data;
}
function formatNum(n) {
	if (n >= 1e9) return (n / 1e9).toLocaleString("fa-IR", { maximumFractionDigits: 1 }) + " میلیارد";
	if (n >= 1e6) return (n / 1e6).toLocaleString("fa-IR", { maximumFractionDigits: 1 }) + " میلیون";
	if (n >= 1e3) return (n / 1e3).toLocaleString("fa-IR", { maximumFractionDigits: 1 }) + " هزار";
	return n.toLocaleString("fa-IR");
}
function TableSearch({ value, onChange, placeholder }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mb-4 max-w-xs",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			value,
			onChange: (e) => onChange(e.target.value),
			placeholder,
			className: "bg-secondary/60 pr-9"
		})]
	});
}
function AdminDashboard() {
	const { stats } = useAdminContext();
	const charts = useAdminCharts();
	const totalUsers = stats?.total_users ?? 0;
	const userGrowthData = charts?.user_growth ?? [];
	const revenueData = charts?.revenue ?? [];
	const planDistribution = charts?.plan_distribution ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-lg font-bold",
					children: "رشد کاربران"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "۷ ماه اخیر"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400",
					children: "+۵۲٪ رشد"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
				width: "100%",
				height: 260,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
					data: userGrowthData,
					margin: {
						top: 5,
						right: 10,
						left: -10,
						bottom: 0
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
							id: "colorUsers",
							x1: "0",
							y1: "0",
							x2: "0",
							y2: "1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "5%",
								stopColor: "#22c55e",
								stopOpacity: .4
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "95%",
								stopColor: "#22c55e",
								stopOpacity: .02
							})]
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
							strokeDasharray: "3 3",
							stroke: "#374151",
							strokeOpacity: .5
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
							dataKey: "month",
							tick: {
								fontSize: 11,
								fill: "#9ca3af"
							},
							tickLine: false,
							axisLine: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
							tick: {
								fontSize: 11,
								fill: "#9ca3af"
							},
							tickLine: false,
							axisLine: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
							contentStyle: {
								backgroundColor: "#1f2937",
								border: "1px solid #374151",
								borderRadius: 12,
								color: "#f9fafb",
								boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
							},
							labelStyle: {
								color: "#f9fafb",
								fontWeight: 600,
								marginBottom: 4
							},
							itemStyle: { color: "#d1d5db" }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
							type: "monotone",
							dataKey: "users",
							stroke: "#22c55e",
							strokeWidth: 2.5,
							fill: "url(#colorUsers)",
							dot: false,
							activeDot: {
								r: 5,
								fill: "#22c55e",
								strokeWidth: 2,
								stroke: "hsl(var(--background))"
							}
						})
					]
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm lg:col-span-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-6 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-lg font-bold",
						children: "درآمد ماهانه"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "میلیون تومان"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400",
						children: "+۲۲٪"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: 220,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						data: revenueData,
						margin: {
							top: 5,
							right: 10,
							left: -10,
							bottom: 0
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								strokeDasharray: "3 3",
								stroke: "#374151",
								strokeOpacity: .5,
								vertical: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "month",
								tick: {
									fontSize: 10,
									fill: "#9ca3af"
								},
								tickLine: false,
								axisLine: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								tick: {
									fontSize: 10,
									fill: "#9ca3af"
								},
								tickLine: false,
								axisLine: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								contentStyle: {
									backgroundColor: "#1f2937",
									border: "1px solid #374151",
									borderRadius: 12,
									color: "#f9fafb",
									boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
								},
								labelStyle: {
									color: "#f9fafb",
									fontWeight: 600
								},
								itemStyle: { color: "#d1d5db" }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "revenue",
								fill: "#22c55e",
								radius: [
									6,
									6,
									0,
									0
								],
								barSize: 32
							})
						]
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm lg:col-span-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-lg font-bold",
							children: "توزیع پلن‌ها"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: "توزیع فعلی کاربران"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-4",
						children: planDistribution.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-1.5 flex items-center justify-between text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: p.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular text-muted-foreground",
								children: p.value.toLocaleString()
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-2 overflow-hidden rounded-full bg-secondary/80",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full rounded-full transition-all duration-500",
								style: {
									width: `${p.value / totalUsers * 100}%`,
									backgroundColor: p.color
								}
							})
						})] }, p.name))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid grid-cols-2 gap-4 rounded-xl bg-secondary/30 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground",
							children: "نرخ تبدیل"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 text-lg font-bold",
							children: "۳۹٪"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground",
							children: "MRR"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 text-lg font-bold",
							children: "۱۱۸M"
						})] })]
					})
				]
			})]
		})]
	});
}
function useAdminCharts() {
	const [charts, setCharts] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		fetchAdminCharts().then(setCharts).catch(() => {});
	}, []);
	return charts;
}
var REPORT_LINES = {
	free: 4,
	pro: 10,
	promax: 20,
	vip: 20
};
function planToRow(p) {
	return {
		id: p.id,
		name: p.name,
		price: p.price === "—" ? "غیرقابل فروش" : `${p.price} تومان`,
		users: p.users,
		portfolios: p.portfolioLimit.includes("نامحدود") ? "نامحدود" : "۱",
		reportLines: REPORT_LINES[p.id] ?? 10,
		sellable: p.sellable,
		features: p.features.join("، ")
	};
}
function PlansManager() {
	const [plans, setPlans] = (0, import_react.useState)([]);
	const [editing, setEditing] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let alive = true;
		fetchPlans().then((list) => alive && setPlans(list.map(planToRow))).catch(() => alive && toast.error("دریافت پلن‌ها از سرور ممکن نشد"));
		return () => {
			alive = false;
		};
	}, []);
	function save(e) {
		e.preventDefault();
		if (!editing) return;
		setPlans((list) => list.map((p) => p.id === editing.id ? editing : p));
		toast.success(`پلن ${editing.name} به‌روزرسانی شد`);
		setEditing(null);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
		children: plans.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card-surface p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-semibold",
						children: p.name
					}), !p.sellable && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						className: "border-accent/40 bg-accent/10 text-accent",
						children: "فقط مدیر"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 text-2xl font-bold tabular",
					children: p.price
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 space-y-1 text-xs text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["پرتفولیو: ", p.portfolios] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "tabular",
							children: ["خطوط گزارش AI: ", p.reportLines]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: p.features })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 text-sm text-muted-foreground tabular",
					children: [p.users, " کاربر فعال"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					className: "mt-4 w-full",
					onClick: () => setEditing(p),
					children: "ویرایش پلن"
				})
			]
		}, p.id))
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: editing !== null,
		onOpenChange: (o) => !o && setEditing(null),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, { children: editing && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: save,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["ویرایش پلن ", editing.name] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "قیمت، سقف‌ها و امکانات پلن را تغییر بده." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نام پلن" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: editing.name,
										onChange: (e) => setEditing({
											...editing,
											name: e.target.value
										}),
										className: "bg-secondary/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "قیمت" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: editing.price,
										onChange: (e) => setEditing({
											...editing,
											price: e.target.value
										}),
										className: "tabular bg-secondary/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "سقف پرتفولیو" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: editing.portfolios,
										onChange: (e) => setEditing({
											...editing,
											portfolios: e.target.value
										}),
										className: "bg-secondary/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "خطوط گزارش AI (۲ تا ۲۰)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										min: 2,
										max: 20,
										value: editing.reportLines,
										onChange: (e) => setEditing({
											...editing,
											reportLines: Math.max(2, Math.min(20, Number(e.target.value) || 2))
										}),
										className: "tabular bg-secondary/60"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "امکانات" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: editing.features,
								onChange: (e) => setEditing({
									...editing,
									features: e.target.value
								}),
								className: "bg-secondary/60"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between rounded-lg bg-secondary/40 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm",
								children: "قابل فروش به کاربران"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: editing.sellable,
								onCheckedChange: (v) => setEditing({
									...editing,
									sellable: v
								})
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
						children: "ذخیره تغییرات"
					})]
				})
			]
		}) })
	})] });
}
var PLAN_OPTIONS = [
	"رایگان",
	"Pro",
	"Pro Max",
	"VIP"
];
var ROLE_OPTIONS = [
	{
		value: "trader",
		label: "تریدر"
	},
	{
		value: "professional",
		label: "حرفه‌ای"
	},
	{
		value: "master",
		label: "استاد"
	},
	{
		value: "admin",
		label: "مدیر"
	},
	{
		value: "vip",
		label: "ویژه"
	},
	{
		value: "trader-vip",
		label: "تریدر ویژه"
	},
	{
		value: "professional-vip",
		label: "حرفه‌ای ویژه"
	},
	{
		value: "master-vip",
		label: "استاد ویژه"
	}
];
function UsersManager() {
	const { userQuery, setUserQuery } = useAdminContext();
	const [rows, setRows] = (0, import_react.useState)([]);
	const [totalCount, setTotalCount] = (0, import_react.useState)(0);
	const [planTarget, setPlanTarget] = (0, import_react.useState)(null);
	const [userPage, setUserPage] = (0, import_react.useState)(1);
	const USER_PAGE_SIZE = 20;
	const userTotalPages = Math.max(1, Math.ceil(totalCount / USER_PAGE_SIZE));
	(0, import_react.useEffect)(() => {
		setUserPage(1);
	}, [userQuery]);
	(0, import_react.useEffect)(() => {
		let alive = true;
		fetchUsers(userPage, USER_PAGE_SIZE, userQuery).then((page) => {
			if (alive) {
				setRows(page.results);
				setTotalCount(page.count);
			}
		}).catch(() => alive && toast.error("دریافت کاربران از سرور ممکن نشد"));
		return () => {
			alive = false;
		};
	}, [userPage, userQuery]);
	const [newPlan, setNewPlan] = (0, import_react.useState)("Pro");
	const [details, setDetails] = (0, import_react.useState)(null);
	const [removeTarget, setRemoveTarget] = (0, import_react.useState)(null);
	const [emailTarget, setEmailTarget] = (0, import_react.useState)(null);
	const [newEmail, setNewEmail] = (0, import_react.useState)("");
	const [roleTarget, setRoleTarget] = (0, import_react.useState)(null);
	const [newRole, setNewRole] = (0, import_react.useState)("trader");
	const [userPaymentsList, setUserPaymentsList] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		let alive = true;
		fetchPayments().then((list) => alive && setUserPaymentsList(list)).catch(() => alive && toast.error("دریافت پرداخت‌ها از سرور ممکن نشد"));
		return () => {
			alive = false;
		};
	}, []);
	const userSafePage = Math.min(userPage, userTotalPages);
	const userPayments = (name) => userPaymentsList.filter((p) => p.user === name);
	async function applyPlan() {
		if (!planTarget) return;
		try {
			const updated = await updateUser(planTarget.id, { plan: newPlan });
			setRows((list) => list.map((u) => u.id === planTarget.id ? updated : u));
			toast.success(`پلن ${planTarget.name} بدون پرداخت به ${newPlan} تغییر کرد`);
			setPlanTarget(null);
		} catch (err) {
			toast.error(`تغییر پلن ناموفق بود: ${err instanceof Error ? err.message : err}`);
		}
	}
	async function applyEmail() {
		if (!emailTarget) return;
		const value = newEmail.trim();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
			toast.error("ایمیل معتبر نیست");
			return;
		}
		try {
			const updated = await updateUser(emailTarget.id, { email: value });
			setRows((list) => list.map((u) => u.id === emailTarget.id ? updated : u));
			toast.success("ایمیل کاربر تغییر کرد و در Audit Log ثبت شد");
			setEmailTarget(null);
		} catch (err) {
			toast.error(`تغییر ایمیل ناموفق بود: ${err instanceof Error ? err.message : err}`);
		}
	}
	async function applyRole() {
		if (!roleTarget) return;
		try {
			const updated = await updateUser(roleTarget.id, { role: newRole });
			setRows((list) => list.map((u) => u.id === roleTarget.id ? updated : u));
			const rl = ROLE_OPTIONS.find((r) => r.value === newRole)?.label ?? newRole;
			toast.success(`نقش ${roleTarget.name} به «${rl}» تغییر کرد`);
			setRoleTarget(null);
		} catch (err) {
			toast.error(`تغییر نقش ناموفق بود: ${err instanceof Error ? err.message : err}`);
		}
	}
	async function removeUser() {
		if (!removeTarget) return;
		try {
			await deleteUser(removeTarget.id);
			setRows((list) => list.filter((u) => u.id !== removeTarget.id));
			toast.success(`کاربر ${removeTarget.name} حذف شد`);
			setRemoveTarget(null);
		} catch (err) {
			toast.error(`حذف کاربر ناموفق بود: ${err instanceof Error ? err.message : err}`);
		}
	}
	async function toggleStatus(u) {
		const next = u.status === "فعال" ? "غیرفعال" : "فعال";
		try {
			const updated = await updateUser(u.id, { status: next });
			setRows((list) => list.map((r) => r.id === u.id ? updated : r));
			toast.success(`وضعیت ${u.name} به ${next} تغییر کرد`);
		} catch (err) {
			toast.error(`تغییر وضعیت ناموفق بود: ${err instanceof Error ? err.message : err}`);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "card-surface p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableSearch, {
				value: userQuery,
				onChange: setUserQuery,
				placeholder: "جستجوی کاربر، ایمیل، پلن..."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full min-w-[860px] text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-3 text-right",
								children: "کاربر"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-3 text-right",
								children: "ایمیل"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-3 text-right",
								children: "نقش"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-3 text-right",
								children: "پلن"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-3 text-right",
								children: "وضعیت"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-3 text-right",
								children: "تاریخ عضویت"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-3 text-right",
								children: "تراکنش‌ها"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "py-3" })
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [rows.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/50 last:border-0 hover:bg-secondary/30",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 font-medium",
								children: u.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 text-muted-foreground",
								children: u.email
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: u.role === "vip" || u.role?.includes("vip") ? "border-accent/40 bg-accent/10 text-accent" : u.role === "admin" ? "border-destructive/40 bg-destructive/10 text-destructive" : u.role === "master" || u.role === "master-vip" ? "border-primary/40 bg-primary/10 text-primary" : u.role === "professional" || u.role === "professional-vip" ? "border-secondary-foreground/30 bg-secondary/20" : "",
									children: ROLE_OPTIONS.find((r) => r.value === u.role)?.label ?? u.role ?? "تریدر"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: u.plan === "Pro Max" ? "border-primary/40 bg-primary/10 text-primary" : "",
									children: u.plan
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: u.status === "فعال" ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive",
									children: u.status
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3 text-xs text-muted-foreground tabular",
								children: u.joined
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "py-3 text-xs tabular text-muted-foreground",
								children: [userPayments(u.name).length, " مورد"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "icon",
										className: "h-8 w-8",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EllipsisVertical, { className: "h-4 w-4" })
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
									align: "end",
									className: "w-52",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
											onSelect: () => setDetails(u),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "ml-2 h-4 w-4" }), " جزئیات و ریز تراکنش‌ها"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
											onSelect: () => {
												setNewPlan(u.plan);
												setPlanTarget(u);
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "ml-2 h-4 w-4" }), " تغییر پلن بدون پرداخت"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
											onSelect: () => {
												setNewEmail(u.email);
												setEmailTarget(u);
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "ml-2 h-4 w-4" }), " تغییر ایمیل کاربر"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
											onSelect: () => {
												setNewRole(u.role ?? "trader");
												setRoleTarget(u);
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "ml-2 h-4 w-4" }), " تغییر نقش"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
											onSelect: () => toggleStatus(u),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "ml-2 h-4 w-4" }),
												" ",
												u.status === "فعال" ? "غیرفعال کردن" : "فعال کردن"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
											className: "text-destructive focus:text-destructive",
											onSelect: () => setRemoveTarget(u),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "ml-2 h-4 w-4" }), " حذف کاربر"]
										})
									]
								})] })
							})
						]
					}, u.id)), rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 8,
						className: "py-8 text-center text-sm text-muted-foreground",
						children: "کاربری پیدا نشد."
					}) })] })]
				})
			}),
			totalCount > USER_PAGE_SIZE && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-center justify-between text-sm text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					"نمایش ",
					(userSafePage - 1) * USER_PAGE_SIZE + 1,
					"–",
					Math.min(userSafePage * USER_PAGE_SIZE, totalCount),
					" از ",
					totalCount,
					" کاربر"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							disabled: userSafePage <= 1,
							onClick: () => setUserPage((p) => Math.max(1, p - 1)),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })
						}),
						Array.from({ length: Math.min(userTotalPages, 7) }, (_, i) => {
							let pageNum;
							if (userTotalPages <= 7) pageNum = i + 1;
							else if (userSafePage <= 4) pageNum = i + 1;
							else if (userSafePage >= userTotalPages - 3) pageNum = userTotalPages - 6 + i;
							else pageNum = userSafePage - 3 + i;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: pageNum === userSafePage ? "default" : "outline",
								size: "sm",
								className: pageNum === userSafePage ? "bg-primary text-primary-foreground" : "",
								onClick: () => setUserPage(pageNum),
								children: pageNum
							}, pageNum);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							disabled: userSafePage >= userTotalPages,
							onClick: () => setUserPage((p) => Math.min(userTotalPages, p + 1)),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" })
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: emailTarget !== null,
				onOpenChange: (o) => !o && setEmailTarget(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["تغییر ایمیل ", emailTarget?.name] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "تغییر ایمیل فقط توسط مدیر ممکن است و به‌صورت خودکار در Audit Log ثبت می‌شود." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "ایمیل جدید" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							dir: "ltr",
							value: newEmail,
							onChange: (e) => setNewEmail(e.target.value),
							className: "bg-secondary/60 text-left"
						})]
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
							onClick: applyEmail,
							className: "bg-primary text-primary-foreground hover:bg-primary/90",
							children: "ثبت ایمیل جدید"
						})]
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: roleTarget !== null,
				onOpenChange: (o) => !o && setRoleTarget(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["تغییر نقش ", roleTarget?.name] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "نقش کاربر را انتخاب کنید." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نقش جدید" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: newRole,
							onValueChange: setNewRole,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								className: "bg-secondary/60",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: ROLE_OPTIONS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: r.value,
								children: r.label
							}, r.value)) })]
						})]
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
							onClick: applyRole,
							className: "bg-primary text-primary-foreground hover:bg-primary/90",
							children: "اعمال نقش"
						})]
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: planTarget !== null,
				onOpenChange: (o) => !o && setPlanTarget(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, { children: ["تغییر پلن ", planTarget?.name] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "پلن به‌صورت دستی و بدون نیاز به پرداخت اعمال می‌شود." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "پلن جدید" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: newPlan,
							onValueChange: setNewPlan,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								className: "bg-secondary/60",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: PLAN_OPTIONS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: p,
								children: p
							}, p)) })]
						})]
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
							onClick: applyPlan,
							className: "bg-primary text-primary-foreground hover:bg-primary/90",
							children: "اعمال پلن"
						})]
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: details !== null,
				onOpenChange: (o) => !o && setDetails(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "max-w-2xl",
					children: details && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: details.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: details.email })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid gap-3 sm:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg border border-border bg-secondary/40 p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted-foreground",
										children: "پلن"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 font-medium",
										children: details.plan
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg border border-border bg-secondary/40 p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted-foreground",
										children: "وضعیت"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 font-medium",
										children: details.status
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg border border-border bg-secondary/40 p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted-foreground",
										children: "عضویت"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 font-medium tabular",
										children: details.joined
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "text-sm font-semibold",
								children: "ریز تراکنش‌ها"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 overflow-x-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
									className: "w-full min-w-[420px] text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b border-border text-xs text-muted-foreground",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-2 text-right",
												children: "شناسه"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-2 text-right",
												children: "پلن"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-2 text-right",
												children: "مبلغ"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-2 text-right",
												children: "تاریخ"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "py-2 text-right",
												children: "وضعیت"
											})
										]
									}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [userPayments(details.name).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: "border-b border-border/50 last:border-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-2 text-xs tabular text-muted-foreground",
												children: p.id
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-2",
												children: p.plan
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-2 tabular",
												children: p.amount
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-2 text-xs tabular text-muted-foreground",
												children: p.date
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "py-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "outline",
													className: p.status === "موفق" ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive",
													children: p.status
												})
											})
										]
									}, p.id)), userPayments(details.name).length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										colSpan: 5,
										className: "py-6 text-center text-xs text-muted-foreground",
										children: "تراکنشی ثبت نشده است."
									}) })] })]
								})
							})]
						})
					] })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: removeTarget !== null,
				onOpenChange: (o) => !o && setRemoveTarget(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "حذف کاربر" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
						"کاربر «",
						removeTarget?.name,
						"» و تمام داده‌هایش حذف می‌شود. این عمل قابل بازگشت نیست."
					] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
						className: "mt-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								children: "انصراف"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "destructive",
							onClick: removeUser,
							children: "حذف قطعی"
						})]
					})]
				})
			})
		]
	});
}
var NEWS_CATEGORIES = [
	"تخفیف",
	"آپدیت",
	"اطلاعیه",
	"آموزش"
];
function NewsManager() {
	const { news, saveNews, deleteNews, pushNotification } = usePlatform();
	const [draft, setDraft] = (0, import_react.useState)(null);
	function blank() {
		return {
			id: `N-${Date.now()}`,
			title: "",
			summary: "",
			body: "",
			category: "اطلاعیه",
			date: (/* @__PURE__ */ new Date()).toLocaleDateString("fa-IR"),
			pinned: false
		};
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "card-surface p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 font-semibold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, { className: "h-4 w-4 text-primary" }), " اخبار و اطلاعیه‌ها"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					className: "bg-primary text-primary-foreground hover:bg-primary/90",
					onClick: () => setDraft(blank()),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "ml-1 h-4 w-4" }), " خبر جدید"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-2",
				children: [news.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/50 p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							children: n.category
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium",
							children: n.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground tabular",
							children: n.date
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mr-auto flex gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								className: "h-8 w-8",
								"aria-label": "ویرایش خبر",
								onClick: () => setDraft(n),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-3.5 w-3.5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								className: "h-8 w-8 text-destructive hover:text-destructive",
								"aria-label": "حذف خبر",
								onClick: () => {
									deleteNews(n.id);
									toast.success("خبر حذف شد");
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
							})]
						})
					]
				}, n.id)), news.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-8 text-center text-sm text-muted-foreground",
					children: "خبری ثبت نشده است."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: draft !== null,
				onOpenChange: (o) => !o && setDraft(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "max-h-[85vh] max-w-2xl overflow-y-auto",
					children: draft && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: news.some((n) => n.id === draft.id) ? "ویرایش خبر" : "خبر جدید" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "خبر منتشرشده در صفحه اخبار و اعلانات کاربران نمایش داده می‌شود." })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "عنوان" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: draft.title,
										onChange: (e) => setDraft({
											...draft,
											title: e.target.value
										}),
										className: "bg-secondary/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "دسته‌بندی" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: draft.category,
										onValueChange: (v) => setDraft({
											...draft,
											category: v
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "bg-secondary/60",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: NEWS_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: c,
											children: c
										}, c)) })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "خلاصه (برای اعلان)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: draft.summary,
										onChange: (e) => setDraft({
											...draft,
											summary: e.target.value
										}),
										className: "bg-secondary/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "متن کامل" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichTextEditor, {
										value: draft.body,
										onChange: (body) => setDraft({
											...draft,
											body
										}),
										placeholder: "متن کامل خبر را اینجا بنویس...",
										minHeight: 200
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between rounded-lg border border-border p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "سنجاق کردن به بالای لیست" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										checked: draft.pinned,
										onCheckedChange: (v) => setDraft({
											...draft,
											pinned: v
										})
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
							className: "mt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									children: "انصراف"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "bg-primary text-primary-foreground hover:bg-primary/90",
								onClick: () => {
									if (!draft.title.trim() || !draft.summary.trim()) {
										toast.error("عنوان و خلاصه الزامی است");
										return;
									}
									const isNew = !news.some((n) => n.id === draft.id);
									saveNews(draft);
									if (isNew) pushNotification({
										kind: "news",
										title: draft.title,
										desc: draft.summary,
										link: `/app/news/${draft.id}`
									});
									toast.success(isNew ? "خبر منتشر شد" : "خبر به‌روزرسانی شد");
									setDraft(null);
								},
								children: "ذخیره و انتشار"
							})]
						})
					] })
				})
			})
		]
	});
}
var TICKET_STATUSES = [
	"باز",
	"در حال بررسی",
	"پاسخ داده شد",
	"بسته"
];
function TicketsManager() {
	const { tickets, replyTicket, setTicketStatus } = usePlatform();
	const [activeId, setActiveId] = (0, import_react.useState)(tickets[0]?.id ?? null);
	const [reply, setReply] = (0, import_react.useState)("");
	const active = tickets.find((t) => t.id === activeId) ?? tickets[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4 lg:grid-cols-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2",
			children: [tickets.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setActiveId(t.id),
				className: `card-surface w-full p-4 text-right ${active?.id === t.id ? "border-primary/50" : ""}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground tabular",
							children: t.id
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							children: t.status
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 text-sm font-medium",
						children: t.subject
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 text-xs text-muted-foreground",
						children: [
							t.user,
							" • ",
							t.topic
						]
					})
				]
			}, t.id)), tickets.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "card-surface p-6 text-center text-sm text-muted-foreground",
				children: "تیکتی وجود ندارد."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "lg:col-span-2",
			children: active && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2 border-b border-border pb-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LifeBuoy, { className: "h-4 w-4 text-primary" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold",
								children: active.subject
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: active.email
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mr-auto w-40",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: active.status,
									onValueChange: (v) => setTicketStatus(active.id, v),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "h-8 bg-secondary/60 text-xs",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: TICKET_STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: s,
										children: s
									}, s)) })]
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 space-y-3",
						children: active.messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `rounded-lg border p-3 text-sm ${m.author === "admin" ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/40"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between text-xs text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: m.authorName }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "tabular",
										children: m.time
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 whitespace-pre-line leading-relaxed",
									children: m.body
								}),
								m.attachments.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 flex flex-wrap gap-2",
									children: m.attachments.map((src, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src,
										alt: "پیوست",
										className: "h-16 w-16 rounded border border-border object-cover"
									}, i))
								})
							]
						}, m.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-2 border-t border-border pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							rows: 3,
							value: reply,
							onChange: (e) => setReply(e.target.value),
							placeholder: "پاسخ پشتیبانی...",
							className: "bg-secondary/60"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "bg-primary text-primary-foreground hover:bg-primary/90",
							onClick: () => {
								if (!reply.trim()) {
									toast.error("متن پاسخ خالی است");
									return;
								}
								replyTicket(active.id, {
									author: "admin",
									body: reply.trim(),
									attachments: []
								});
								setReply("");
								toast.success("پاسخ ارسال و اعلان برای کاربر ایجاد شد");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "ml-1 h-4 w-4" }), " ارسال پاسخ"]
						})]
					})
				]
			})
		})]
	});
}
function AdminPagination({ page, totalPages, onPageChange }) {
	if (totalPages <= 1) return null;
	const pages = [];
	const addPage = (p) => {
		if (!pages.includes(p)) pages.push(p);
	};
	addPage(0);
	for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) addPage(i);
	addPage(totalPages - 1);
	const withEllipsis = [];
	let prev = -1;
	for (const p of pages) {
		if (typeof p === "number" && prev !== -1 && p - prev > 1) withEllipsis.push("...");
		withEllipsis.push(p);
		if (typeof p === "number") prev = p;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 flex items-center justify-center gap-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				size: "icon",
				className: "h-8 w-8",
				disabled: page === 0,
				onClick: () => onPageChange(page - 1),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })
			}),
			withEllipsis.map((p, i) => p === "..." ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex h-8 w-8 items-center justify-center text-muted-foreground",
				children: "…"
			}, `e${i}`) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: p === page ? "default" : "outline",
				size: "icon",
				className: "h-8 w-8",
				onClick: () => onPageChange(p),
				children: (p + 1).toLocaleString("fa-IR")
			}, p)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				size: "icon",
				className: "h-8 w-8",
				disabled: page >= totalPages - 1,
				onClick: () => onPageChange(page + 1),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" })
			})
		]
	});
}
var AUDIT_PAGE_SIZE = 8;
function AuditLogPanel() {
	const { audit } = usePlatform();
	const [page, setPage] = (0, import_react.useState)(0);
	const totalPages = Math.max(1, Math.ceil(audit.length / AUDIT_PAGE_SIZE));
	const safePage = Math.min(page, totalPages - 1);
	const paged = audit.slice(safePage * AUDIT_PAGE_SIZE, (safePage + 1) * AUDIT_PAGE_SIZE);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "card-surface p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 font-semibold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "h-4 w-4 text-accent" }), " Audit Log — تغییرات حساس"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs text-muted-foreground",
					children: [audit.length.toLocaleString("fa-IR"), " رکورد"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-2",
				children: [paged.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background/50 p-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground tabular",
							children: a.time
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: "border-accent/40 bg-accent/10 text-accent",
							children: a.action
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: a.target
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: a.details
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mr-auto text-xs text-muted-foreground",
							children: a.actor
						})
					]
				}, a.id)), audit.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-8 text-center text-sm text-muted-foreground",
					children: "رویدادی ثبت نشده است."
				})]
			}),
			totalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminPagination, {
				page: safePage,
				totalPages,
				onPageChange: setPage
			})
		]
	});
}
//#endregion
export { PlansManager as a, UsersManager as c, NewsManager as i, formatNum as l, AdminProvider as n, TableSearch as o, AuditLogPanel as r, TicketsManager as s, AdminDashboard as t, useAdminContext as u };
