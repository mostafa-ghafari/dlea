import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { D as Send, P as Phone, V as MessageCircle, W as Mail } from "../_libs/lucide-react.mjs";
import { t as Textarea } from "./textarea-Cp94w9lz.mjs";
import { t as Label } from "./label-AutfcB-T.mjs";
import { t as LegalPage } from "./LegalPage-CBj8eOLf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/contact-DuhAYBQ0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var channels = [
	{
		icon: Mail,
		label: "ایمیل پشتیبانی",
		value: "support@traderjournal.ai"
	},
	{
		icon: MessageCircle,
		label: "تلگرام",
		value: "@traderjournal_support"
	},
	{
		icon: Phone,
		label: "تلفن",
		value: "۰۲۱-۹۱۰۰۰۰۰۰"
	}
];
function ContactPage() {
	const [form, setForm] = (0, import_react.useState)({
		name: "",
		email: "",
		message: ""
	});
	function submit(e) {
		e.preventDefault();
		if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
			toast.error("همه فیلدها را کامل کن");
			return;
		}
		toast.success("پیام شما ثبت شد — تیم پشتیبانی به‌زودی پاسخ می‌دهد");
		setForm({
			name: "",
			email: "",
			message: ""
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LegalPage, {
		title: "تماس با ما",
		intro: "هر سوال، پیشنهاد یا مشکلی داری برای ما بنویس. معمولاً در کمتر از ۲۴ ساعت کاری پاسخ می‌دهیم.",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-4 md:grid-cols-3",
			children: channels.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(c.icon, { className: "h-5 w-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 text-xs text-muted-foreground",
						children: c.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-sm font-medium break-all",
						children: c.value
					})
				]
			}, c.label))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "card-surface space-y-4 p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold",
					children: "ارسال پیام"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نام و نام خانوادگی" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: form.name,
							onChange: (e) => setForm({
								...form,
								name: e.target.value
							}),
							placeholder: "علی رضایی",
							className: "bg-secondary/60"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "ایمیل" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "email",
							value: form.email,
							onChange: (e) => setForm({
								...form,
								email: e.target.value
							}),
							placeholder: "you@example.com",
							className: "bg-secondary/60"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "پیام" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						rows: 5,
						value: form.message,
						onChange: (e) => setForm({
							...form,
							message: e.target.value
						}),
						placeholder: "متن پیام...",
						className: "bg-secondary/60"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "submit",
					className: "bg-primary text-primary-foreground hover:bg-primary/90",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "ml-1 h-4 w-4" }), " ارسال پیام"]
				})
			]
		})]
	});
}
//#endregion
export { ContactPage as component };
