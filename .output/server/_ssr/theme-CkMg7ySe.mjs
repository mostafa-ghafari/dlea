import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { v as Sun, z as Moon } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/theme-CkMg7ySe.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KEY = "tj:theme";
function apply(theme) {
	const html = document.documentElement;
	html.classList.toggle("dark", theme === "dark");
	html.classList.toggle("light", theme === "light");
}
/** Dark/light theme state persisted in localStorage (SSR safe). */
function getStoredTheme() {
	if (typeof window === "undefined") return "dark";
	try {
		const raw = window.localStorage.getItem(KEY);
		if (raw === "light" || raw === "dark") return raw;
	} catch {}
	return "dark";
}
if (typeof document !== "undefined") apply(getStoredTheme());
function useTheme() {
	const [theme, setTheme] = (0, import_react.useState)(getStoredTheme);
	return {
		theme,
		setTheme: (0, import_react.useCallback)((next) => {
			setTheme(next);
			apply(next);
			try {
				window.localStorage.setItem(KEY, next);
			} catch {}
		}, [])
	};
}
function ThemeToggle({ className }) {
	const { theme, setTheme } = useTheme();
	const dark = theme === "dark";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		variant: "outline",
		size: "icon",
		"aria-label": dark ? "تغییر به تم روشن" : "تغییر به تم تیره",
		title: dark ? "تم روشن" : "تم تیره",
		className: `h-10 w-10 border-border bg-secondary/60 ${className ?? ""}`,
		onClick: () => setTheme(dark ? "light" : "dark"),
		children: dark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "h-4 w-4" })
	});
}
//#endregion
export { ThemeToggle as t };
