import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { Ot as ChevronRight, Yt as Activity, kt as ChevronLeft } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.admin.logs-DEtov2hX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var LOGS_PAGE_SIZE = 8;
var ALL_LOGS = [
	{
		t: "12:04:32",
		l: "INFO",
		m: "New user registered: maryam@example.com"
	},
	{
		t: "12:03:11",
		l: "INFO",
		m: "AI analysis completed for user U1"
	},
	{
		t: "11:58:07",
		l: "WARN",
		m: "Rate limit approaching for API openai_prod"
	},
	{
		t: "11:45:22",
		l: "INFO",
		m: "Payment successful: PY1 — ۲,۰۰۰,۰۰۰ تومان"
	},
	{
		t: "11:32:00",
		l: "ERROR",
		m: "MetaTrader sync failed for portfolio P4"
	},
	{
		t: "11:20:15",
		l: "INFO",
		m: "User session started: ahmad@domain.com"
	},
	{
		t: "11:15:44",
		l: "WARN",
		m: "API key expiry approaching: binance_prod"
	},
	{
		t: "11:02:33",
		l: "INFO",
		m: "News article published: بروزرسانی سیستم"
	},
	{
		t: "10:58:12",
		l: "ERROR",
		m: "Database connection timeout on replica-2"
	},
	{
		t: "10:45:00",
		l: "INFO",
		m: "Backup completed successfully"
	},
	{
		t: "10:30:22",
		l: "INFO",
		m: "New subscription activated: PRO plan"
	},
	{
		t: "10:22:11",
		l: "WARN",
		m: "Memory usage at 85% on worker-3"
	},
	{
		t: "10:10:05",
		l: "INFO",
		m: "Scheduled job completed: daily-report"
	},
	{
		t: "09:55:30",
		l: "ERROR",
		m: "Email delivery failed to test@domain.com"
	},
	{
		t: "09:40:18",
		l: "INFO",
		m: "Cache cleared for product catalog"
	},
	{
		t: "09:30:00",
		l: "INFO",
		m: "System health check passed"
	},
	{
		t: "09:15:42",
		l: "WARN",
		m: "Rate limit approaching for API deepseek_prod"
	},
	{
		t: "09:00:10",
		l: "INFO",
		m: "Server restart completed successfully"
	},
	{
		t: "08:45:55",
		l: "INFO",
		m: "New API key generated for admin"
	},
	{
		t: "08:30:20",
		l: "ERROR",
		m: "WebSocket connection dropped for dashboard"
	}
];
function AdminLogsPage() {
	const [page, setPage] = (0, import_react.useState)(0);
	const totalPages = Math.ceil(ALL_LOGS.length / LOGS_PAGE_SIZE);
	const paged = ALL_LOGS.slice(page * LOGS_PAGE_SIZE, (page + 1) * LOGS_PAGE_SIZE);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "card-surface p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs text-muted-foreground",
					children: [ALL_LOGS.length.toLocaleString("fa-IR"), " رویداد"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 space-y-2 font-mono text-xs",
				children: paged.map((log, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 rounded border border-border bg-background/50 p-2.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground tabular",
							children: log.t
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: log.l === "ERROR" ? "border-destructive/40 bg-destructive/10 text-destructive" : log.l === "WARN" ? "border-accent/40 bg-accent/10 text-accent" : "border-primary/40 bg-primary/10 text-primary",
							children: log.l
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex-1 truncate",
							children: log.m
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-3 w-3 text-muted-foreground" })
					]
				}, i))
			}),
			totalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-center justify-center gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "icon",
						className: "h-8 w-8",
						disabled: page === 0,
						onClick: () => setPage(page - 1),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })
					}),
					Array.from({ length: totalPages }, (_, i) => i).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: p === page ? "default" : "outline",
						size: "icon",
						className: "h-8 w-8",
						onClick: () => setPage(p),
						children: (p + 1).toLocaleString("fa-IR")
					}, p)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "icon",
						className: "h-8 w-8",
						disabled: page >= totalPages - 1,
						onClick: () => setPage(page + 1),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" })
					})
				]
			})
		]
	});
}
//#endregion
export { AdminLogsPage as component };
