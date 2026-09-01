import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { Gt as ArrowLeft, Mt as ChartLine } from "../_libs/lucide-react.mjs";
import { t as ThemeToggle } from "./theme-CkMg7ySe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/LegalPage-CBj8eOLf.js
var import_jsx_runtime = require_jsx_runtime();
/** Shared shell for the public legal / contact pages. */
function LegalPage({ title, intro, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-16 max-w-4xl items-center justify-between px-4 md:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartLine, { className: "h-5 w-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-bold",
							children: ["Dlea ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-primary",
								children: "AI"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								children: ["بازگشت ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-1 h-3.5 w-3.5" })]
							})
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-4xl px-4 py-14 md:px-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-3xl font-bold md:text-4xl",
						children: title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-2xl leading-relaxed text-muted-foreground",
						children: intro
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-10 space-y-4",
						children
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "border-t border-border py-8 text-center text-sm text-muted-foreground",
				children: "© ۱۴۰۳ Dlea AI"
			})
		]
	});
}
function LegalSection({ title, body }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "card-surface p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-lg font-semibold",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm leading-relaxed text-muted-foreground",
			children: body
		})]
	});
}
//#endregion
export { LegalSection as n, LegalPage as t };
