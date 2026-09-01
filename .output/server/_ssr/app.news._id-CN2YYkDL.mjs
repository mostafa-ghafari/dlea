import { x as useParams, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { l as usePlatform, n as categoryClass } from "./router-DPngkkDa.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { U as Megaphone, Wt as ArrowRight } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./AppShell-Cx40ixlT.mjs";
import { t as useSetTitle } from "./page-context-DymtNkyQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.news._id-CN2YYkDL.js
var import_jsx_runtime = require_jsx_runtime();
function NewsDetail() {
	useSetTitle("خبر پیدا نشد", "این خبر حذف شده یا وجود ندارد");
	const { id } = useParams({ from: "/app/news/$id" });
	const { news } = usePlatform();
	const item = news.find((n) => n.id === id);
	if (!item) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "card-surface p-8 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/app/news",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				children: "بازگشت به اخبار"
			})
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: item.title,
		subtitle: `${item.category} • ${item.date}`,
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/app/news",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				children: ["بازگشت ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "mr-1 h-4 w-4" })]
			})
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "card-surface mx-auto max-w-3xl p-6 sm:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: categoryClass(item.category),
							children: item.category
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground tabular",
							children: item.date
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 text-2xl font-bold leading-relaxed",
					children: item.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 rounded-lg border border-border bg-secondary/40 p-4 text-sm leading-relaxed text-muted-foreground",
					children: item.summary
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 space-y-4 text-sm leading-8",
					children: item.body.split("\n").filter(Boolean).map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: p }, i))
				})
			]
		})
	});
}
//#endregion
export { NewsDetail as component };
