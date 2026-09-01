import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/page-context-DymtNkyQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
require_jsx_runtime();
var PageContext = (0, import_react.createContext)({
	meta: { title: "" },
	setMeta: () => {}
});
function usePageMeta() {
	return (0, import_react.useContext)(PageContext);
}
function useSetTitle(title, subtitle, actions) {
	const { setMeta } = usePageMeta();
	setMeta({
		title,
		subtitle,
		actions
	});
}
//#endregion
export { useSetTitle as t };
