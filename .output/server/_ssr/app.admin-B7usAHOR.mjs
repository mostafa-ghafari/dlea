import { f as useRouterState, h as Outlet } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { i as Users, u as TrendingUp, vt as CreditCard, yt as Cpu } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./AppShell-Cx40ixlT.mjs";
import { l as formatNum, n as AdminProvider, u as useAdminContext } from "./admin-context-C_C5Hy3w.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.admin-B7usAHOR.js
var import_jsx_runtime = require_jsx_runtime();
/** Pages that should show the stats row */
var STATS_ROUTES = ["/app/admin/dashboard", "/app/admin/users"];
function AdminLayout() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const showStats = STATS_ROUTES.some((r) => pathname === r);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "پنل مدیریت",
		subtitle: "مدیریت کاربران، اشتراک‌ها، APIها و تنظیمات سیستم",
		children: [showStats && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminStatsRow, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
		})]
	}) });
}
/** Stats cards shown across all admin sub-pages */
function AdminStatsRow() {
	const { stats } = useAdminContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4",
		children: [
			{
				label: "کل کاربران",
				value: formatNum(stats?.total_users ?? 0),
				icon: Users,
				color: "from-blue-500/20 to-blue-600/5",
				iconColor: "text-blue-500"
			},
			{
				label: "اشتراک‌های فعال",
				value: formatNum(stats?.active_subscriptions ?? 0),
				icon: CreditCard,
				color: "from-emerald-500/20 to-emerald-600/5",
				iconColor: "text-emerald-500"
			},
			{
				label: "درآمد ماهانه",
				value: `${formatNum(stats?.monthly_revenue ?? 0)} تومان`,
				icon: TrendingUp,
				color: "from-amber-500/20 to-amber-600/5",
				iconColor: "text-amber-500"
			},
			{
				label: "درخواست‌های AI",
				value: formatNum(stats?.ai_calls ?? 0),
				icon: Cpu,
				color: "from-purple-500/20 to-purple-600/5",
				iconColor: "text-purple-500"
			}
		].map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${k.color} p-3 sm:p-5 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-primary/5`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-medium text-muted-foreground",
					children: k.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `grid h-10 w-10 place-items-center rounded-xl bg-background/50 ${k.iconColor}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(k.icon, { className: "h-5 w-5" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 text-xl font-bold tracking-tight sm:text-2xl",
				style: {
					wordBreak: "break-word",
					lineHeight: 1.3
				},
				children: k.value
			})]
		}, k.label))
	});
}
//#endregion
export { AdminLayout as component };
