import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { A as Redo2, B as Minus, Bt as Bold, J as List, Y as ListOrdered, Z as Link2, ct as Heading1, h as TextAlignCenter, it as ImagePlus, j as Quote, m as TextAlignEnd, mt as Eraser, nt as Italic, o as Undo2, ot as Heading3, p as TextAlignStart, s as Underline, st as Heading2, xt as CodeXml, y as Strikethrough } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/RichTextEditor-DDB2UcoM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RichTextEditor({ value, onChange, placeholder = "متن ژورنال را اینجا بنویس...", minHeight = 220 }) {
	const ref = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	const [empty, setEmpty] = (0, import_react.useState)(!value);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (el && el.innerHTML !== value) el.innerHTML = value || "";
		setEmpty(!value || value === "<br>");
	}, []);
	function sync() {
		const el = ref.current;
		if (!el) return;
		const html = el.innerHTML;
		setEmpty(!el.textContent?.trim() && !el.querySelector("img"));
		onChange(html);
	}
	function exec(command, arg) {
		ref.current?.focus();
		document.execCommand(command, false, arg);
		sync();
	}
	function insertHtml(html) {
		ref.current?.focus();
		document.execCommand("insertHTML", false, html);
		sync();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden rounded-lg border border-border bg-secondary/20",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-1 border-b border-border bg-secondary/50 p-1.5",
				children: [
					[
						[
							{
								icon: Bold,
								label: "توپر",
								run: () => exec("bold")
							},
							{
								icon: Italic,
								label: "ایتالیک",
								run: () => exec("italic")
							},
							{
								icon: Underline,
								label: "زیرخط",
								run: () => exec("underline")
							},
							{
								icon: Strikethrough,
								label: "خط‌خورده",
								run: () => exec("strikeThrough")
							}
						],
						[
							{
								icon: Heading1,
								label: "تیتر ۱",
								run: () => exec("formatBlock", "<h2>")
							},
							{
								icon: Heading2,
								label: "تیتر ۲",
								run: () => exec("formatBlock", "<h3>")
							},
							{
								icon: Heading3,
								label: "تیتر ۳",
								run: () => exec("formatBlock", "<h4>")
							},
							{
								icon: Quote,
								label: "نقل‌قول",
								run: () => exec("formatBlock", "<blockquote>")
							},
							{
								icon: CodeXml,
								label: "کد",
								run: () => exec("formatBlock", "<pre>")
							}
						],
						[
							{
								icon: List,
								label: "لیست نامرتب",
								run: () => exec("insertUnorderedList")
							},
							{
								icon: ListOrdered,
								label: "لیست شماره‌دار",
								run: () => exec("insertOrderedList")
							},
							{
								icon: Minus,
								label: "خط جداکننده",
								run: () => insertHtml("<hr />")
							}
						],
						[
							{
								icon: TextAlignEnd,
								label: "راست‌چین",
								run: () => exec("justifyRight")
							},
							{
								icon: TextAlignCenter,
								label: "وسط‌چین",
								run: () => exec("justifyCenter")
							},
							{
								icon: TextAlignStart,
								label: "چپ‌چین",
								run: () => exec("justifyLeft")
							}
						],
						[{
							icon: Link2,
							label: "لینک",
							run: () => {
								const url = window.prompt("آدرس لینک:");
								if (url) exec("createLink", url);
							}
						}, {
							icon: ImagePlus,
							label: "تصویر داخل متن",
							run: () => fileRef.current?.click()
						}],
						[
							{
								icon: Undo2,
								label: "بازگردانی",
								run: () => exec("undo")
							},
							{
								icon: Redo2,
								label: "تکرار",
								run: () => exec("redo")
							},
							{
								icon: Eraser,
								label: "پاک کردن قالب",
								run: () => exec("removeFormat")
							}
						]
					].map((g, gi) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-0.5",
						children: [gi > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mx-1 h-5 w-px bg-border" }), g.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							title: c.label,
							"aria-label": c.label,
							onMouseDown: (e) => e.preventDefault(),
							onClick: c.run,
							className: "grid h-7 w-7 place-items-center rounded text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(c.icon, { className: "h-3.5 w-3.5" })
						}, c.label))]
					}, gi)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mx-1 h-5 w-px bg-border" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						onMouseDown: (e) => e.stopPropagation(),
						onChange: (e) => {
							if (e.target.value) exec("foreColor", e.target.value);
							e.target.value = "";
						},
						className: "h-7 rounded bg-background/60 px-1 text-[11px] text-muted-foreground outline-none",
						defaultValue: "",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "رنگ متن"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "#22c55e",
								children: "سبز"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "#ef4444",
								children: "قرمز"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "#eab308",
								children: "زرد"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "#3b82f6",
								children: "آبی"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "#ffffff",
								children: "سفید"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				type: "file",
				accept: "image/jpeg,image/png,image/heic,image/heif",
				className: "hidden",
				onChange: (e) => {
					const file = e.target.files?.[0];
					e.target.value = "";
					if (!file) return;
					const fr = new FileReader();
					fr.onload = () => insertHtml(`<img src="${String(fr.result)}" alt="تصویر ژورنال" style="max-width:100%;border-radius:8px" />`);
					fr.readAsDataURL(file);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [empty && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "pointer-events-none absolute right-4 top-3 text-sm text-muted-foreground",
					children: placeholder
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					ref,
					contentEditable: true,
					suppressContentEditableWarning: true,
					dir: "rtl",
					onInput: sync,
					onBlur: sync,
					style: { minHeight },
					className: "rte-content max-w-none px-4 py-3 text-sm leading-relaxed outline-none"
				})]
			})
		]
	});
}
/** Read-only renderer for stored journal HTML. */
function RichTextView({ html, className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `rte-content text-sm leading-relaxed ${className}`,
		dangerouslySetInnerHTML: { __html: html }
	});
}
//#endregion
export { RichTextView as n, RichTextEditor as t };
