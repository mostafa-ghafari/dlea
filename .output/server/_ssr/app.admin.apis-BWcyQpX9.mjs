import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { M as Plus, ht as EllipsisVertical, yt as Cpu } from "../_libs/lucide-react.mjs";
import { l as formatNum, u as useAdminContext } from "./admin-context-C_C5Hy3w.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.admin.apis-BWcyQpX9.js
var import_jsx_runtime = require_jsx_runtime();
function AdminApisPage() {
	const { aiApis } = useAdminContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "card-surface p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-semibold",
				children: "APIهای فعال"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				className: "bg-primary text-primary-foreground hover:bg-primary/90",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "ml-1 h-4 w-4" }), "افزودن API"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 space-y-3",
			children: [!aiApis ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-sm text-muted-foreground py-4 text-center",
				children: "در حال بارگذاری..."
			}) : aiApis.apis.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-sm text-muted-foreground py-4 text-center",
				children: [
					"هنوز درخواست AI ثبت نشده.",
					aiApis.gemini_configured && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block mt-1 text-primary",
						children: "Gemini API متصل است."
					}),
					!aiApis.gemini_configured && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block mt-1 text-amber-500",
						children: "Gemini API تنظیم نشده."
					})
				]
			}) : aiApis.apis.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-4 rounded-lg border border-border bg-secondary/40 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, { className: "h-4 w-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: a.name
							}), i === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								className: "bg-primary text-primary-foreground",
								children: "پیش‌فرض"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs text-muted-foreground tabular",
							children: ["endpoint: ", a.endpoint]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-sm tabular",
						children: [formatNum(a.requests), " درخواست"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EllipsisVertical, { className: "h-4 w-4" })
					})
				]
			}, a.name + i)), aiApis?.gemini_configured === false && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400",
				children: "برای فعال‌سازی AI Coach، کلید Gemini API را در فایل backend/.env تنظیم کنید."
			})]
		})]
	});
}
//#endregion
export { AdminApisPage as component };
