import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { C as Shield, Et as CircleCheck, l as TriangleAlert } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./AppShell-Cx40ixlT.mjs";
import { t as Label } from "./label-AutfcB-T.mjs";
import { t as Progress } from "./progress-ChzuiZwr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.risk-Ckzrj1_E.js
var import_jsx_runtime = require_jsx_runtime();
var rules = [
	{
		label: "حداکثر ریسک هر معامله",
		value: "۱٪",
		used: 68,
		safe: true
	},
	{
		label: "حداکثر ضرر روزانه",
		value: "۳٪",
		used: 45,
		safe: true
	},
	{
		label: "حداکثر تعداد معاملات روزانه",
		value: "۵",
		used: 80,
		safe: true
	},
	{
		label: "حداکثر ضرر متوالی",
		value: "۳",
		used: 90,
		safe: false
	}
];
function RiskPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "مدیریت ریسک",
		subtitle: "قوانین شخصی خود را تعریف کنید و پایبندی به آن‌ها را بسنجید",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface space-y-4 p-6 lg:col-span-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-semibold",
						children: "تعریف قوانین"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [
							{
								l: "حداکثر ریسک هر معامله (٪)",
								v: "1"
							},
							{
								l: "حداکثر ضرر روزانه (٪)",
								v: "3"
							},
							{
								l: "حداکثر ضرر هفتگی (٪)",
								v: "8"
							},
							{
								l: "حداکثر معاملات روزانه",
								v: "5"
							},
							{
								l: "حداکثر ضرر متوالی",
								v: "3"
							},
							{
								l: "حداقل R:R",
								v: "1.5"
							}
						].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: f.l }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								defaultValue: f.v,
								className: "bg-secondary/60 tabular"
							})]
						}, f.l))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "bg-primary text-primary-foreground hover:bg-primary/90",
						children: "ذخیره قوانین"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-semibold",
						children: "وضعیت پایبندی امروز"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 space-y-5",
					children: rules.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: r.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: r.safe ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive",
								children: r.value
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
							value: r.used,
							className: `mt-2 h-1.5 ${!r.safe ? "[&>div]:bg-destructive" : ""}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 flex items-center gap-1 text-xs",
							children: r.safe ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3 w-3 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted-foreground",
								children: [r.used, "٪ استفاده‌شده"]
							})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-3 w-3 text-destructive" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-destructive",
								children: "نزدیک به حد مجاز"
							})] })
						})
					] }, r.label))
				})]
			})]
		})
	});
}
//#endregion
export { RiskPage as component };
