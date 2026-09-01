import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { C as fetchPayments } from "./api-CQV86vH5.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { Ot as ChevronRight, kt as ChevronLeft } from "../_libs/lucide-react.mjs";
import { o as TableSearch, u as useAdminContext } from "./admin-context-C_C5Hy3w.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.admin.payments--Uaj5EJA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminPaymentsPage() {
	const { paymentQuery, setPaymentQuery } = useAdminContext();
	const [payments, setPayments] = (0, import_react.useState)([]);
	const [payPage, setPayPage] = (0, import_react.useState)(1);
	const PAY_PAGE_SIZE = 20;
	(0, import_react.useEffect)(() => {
		let alive = true;
		fetchPayments().then((list) => alive && setPayments(list)).catch(() => alive && toast.error("دریافت پرداخت‌ها از سرور ممکن نشد"));
		return () => {
			alive = false;
		};
	}, []);
	const filteredPayments = (0, import_react.useMemo)(() => {
		const q = paymentQuery.trim().toLowerCase();
		if (!q) return payments;
		return payments.filter((p) => [
			p.id,
			p.user,
			p.plan,
			p.amount,
			p.status
		].some((v) => String(v).toLowerCase().includes(q)));
	}, [paymentQuery, payments]);
	(0, import_react.useEffect)(() => {
		setPayPage(1);
	}, [paymentQuery]);
	const payTotalPages = Math.max(1, Math.ceil(filteredPayments.length / PAY_PAGE_SIZE));
	const paySafePage = Math.min(payPage, payTotalPages);
	const paginatedPayments = filteredPayments.slice((paySafePage - 1) * PAY_PAGE_SIZE, paySafePage * PAY_PAGE_SIZE);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "card-surface p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableSearch, {
				value: paymentQuery,
				onChange: setPaymentQuery,
				placeholder: "جستجوی پرداخت، کاربر، پلن..."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border text-xs text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-3 text-right",
							children: "شناسه"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-3 text-right",
							children: "کاربر"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-3 text-right",
							children: "پلن"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-3 text-right",
							children: "مبلغ"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-3 text-right",
							children: "تاریخ"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-3 text-right",
							children: "وضعیت"
						})
					]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: paginatedPayments.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border/50 last:border-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-3 text-xs tabular text-muted-foreground",
							children: p.id
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-3",
							children: p.user
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-3",
							children: p.plan
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-3 tabular",
							children: p.amount
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-3 text-xs text-muted-foreground tabular",
							children: p.date
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: p.status === "موفق" ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive",
								children: p.status
							})
						})
					]
				}, p.id)) })]
			}),
			filteredPayments.length > PAY_PAGE_SIZE && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-center justify-between text-sm text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					"نمایش ",
					(paySafePage - 1) * PAY_PAGE_SIZE + 1,
					"–",
					Math.min(paySafePage * PAY_PAGE_SIZE, filteredPayments.length),
					" از ",
					filteredPayments.length,
					" پرداخت"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							disabled: paySafePage <= 1,
							onClick: () => setPayPage((p) => Math.max(1, p - 1)),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })
						}),
						Array.from({ length: Math.min(payTotalPages, 7) }, (_, i) => {
							let pageNum;
							if (payTotalPages <= 7) pageNum = i + 1;
							else if (paySafePage <= 4) pageNum = i + 1;
							else if (paySafePage >= payTotalPages - 3) pageNum = payTotalPages - 6 + i;
							else pageNum = paySafePage - 3 + i;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: pageNum === paySafePage ? "default" : "outline",
								size: "sm",
								className: pageNum === paySafePage ? "bg-primary text-primary-foreground" : "",
								onClick: () => setPayPage(pageNum),
								children: pageNum
							}, pageNum);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							disabled: paySafePage >= payTotalPages,
							onClick: () => setPayPage((p) => Math.min(payTotalPages, p + 1)),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" })
						})
					]
				})]
			})
		]
	});
}
//#endregion
export { AdminPaymentsPage as component };
