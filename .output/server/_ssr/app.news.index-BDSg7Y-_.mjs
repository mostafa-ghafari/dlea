import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { l as usePlatform } from "./router-DPngkkDa.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { N as Pin, U as Megaphone } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./AppShell-Cx40ixlT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.news.index-BDSg7Y-_.js
var import_jsx_runtime = require_jsx_runtime();
function categoryClass(cat) {
	if (cat === "تخفیف") return "border-accent/40 bg-accent/10 text-accent";
	if (cat === "آپدیت") return "border-primary/40 bg-primary/10 text-primary";
	return "border-border bg-secondary/60 text-muted-foreground";
}
function NewsPage() {
	const { news } = usePlatform();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "اخبار و اطلاعیه‌ها",
		subtitle: "آخرین تخفیف‌ها، آپدیت‌ها و اطلاعیه‌های پلتفرم",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4",
			children: [news.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/app/news/$id",
				params: { id: n.id },
				className: "card-surface block p-6 transition-colors hover:border-primary/40",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-base font-semibold",
							children: n.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: categoryClass(n.category),
							children: n.category
						}),
						n.pinned && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: "outline",
							className: "border-primary/40 bg-primary/10 text-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "ml-1 h-3 w-3" }), " مهم"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mr-auto text-xs text-muted-foreground tabular",
							children: n.date
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm leading-relaxed text-muted-foreground",
					children: n.summary
				})]
			}, n.id)), news.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "card-surface p-10 text-center text-sm text-muted-foreground",
				children: "خبری منتشر نشده است."
			})]
		})
	});
}
//#endregion
export { categoryClass, NewsPage as component };
