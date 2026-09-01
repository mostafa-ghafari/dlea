import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as API_BASE } from "./api-CQV86vH5.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { Gt as ArrowLeft, Mt as ChartLine, q as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as Label } from "./label-AutfcB-T.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-BSutX9tf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var GOOGLE_CLIENT_ID = "604447884984-9bl6a66i13r5jcroovkdabsidttgnpel.apps.googleusercontent.com";
function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [googleLoading, setGoogleLoading] = (0, import_react.useState)(false);
	(0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const script = document.createElement("script");
		script.src = "https://accounts.google.com/gsi/client";
		script.async = true;
		script.onload = () => {
			if (window.google) window.google.accounts.id.initialize({
				client_id: GOOGLE_CLIENT_ID,
				callback: handleGoogleCredential
			});
		};
		document.head.appendChild(script);
		return () => {
			document.head.removeChild(script);
		};
	}, []);
	async function handleGoogleCredential(response) {
		setGoogleLoading(true);
		try {
			const res = await fetch(`${API_BASE}/auth/google/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ credential: response.credential })
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || "خطا در ورود با گوگل");
				setGoogleLoading(false);
				return;
			}
			localStorage.setItem("dlea:access", data.access);
			localStorage.setItem("dlea:refresh", data.refresh);
			localStorage.setItem("dlea:user", JSON.stringify(data.user));
			toast.success(`خوش آمدید ${data.user.firstName || ""}`);
			if (data.role === "admin") navigate({ to: "/app/admin/dashboard" });
			else navigate({ to: "/app/dashboard" });
		} catch {
			toast.error("خطا در اتصال به سرور");
			setGoogleLoading(false);
		}
	}
	async function handleLogin(e) {
		e.preventDefault();
		if (!email.trim()) {
			toast.error("ایمیل الزامی است");
			return;
		}
		if (!password.trim()) {
			toast.error("رمز عبور الزامی است");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`${API_BASE}/auth/login/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email.trim(),
					password
				})
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || "خطا در ورود");
				setLoading(false);
				return;
			}
			localStorage.setItem("dlea:access", data.access);
			localStorage.setItem("dlea:refresh", data.refresh);
			localStorage.setItem("dlea:user", JSON.stringify(data.user));
			toast.success(`خوش آمدید ${data.user.firstName || ""}`);
			if (data.role === "admin") navigate({ to: "/app/admin/dashboard" });
			else navigate({ to: "/app/dashboard" });
		} catch {
			toast.error("خطا در اتصال به سرور");
		}
		setLoading(false);
	}
	function handleGoogleLogin() {
		if (window.google) {
			setGoogleLoading(true);
			window.google.accounts.id.prompt((notification) => {
				if (notification.isNotDisplayed()) setGoogleLoading(false);
			});
		} else toast.error("سرویس گوگل هنوز بارگذاری نشده است. لطفاً صفحه را رفرش کنید.");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "hero-bg flex min-h-screen items-center justify-center px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "mb-8 flex items-center justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[var(--shadow-glow)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartLine, { className: "h-5 w-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-lg font-bold",
						children: ["Dlea ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-primary",
							children: "AI"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-2xl font-bold",
							children: "ورود به حساب"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: "اطلاعات حساب خود را وارد کنید."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "mt-6 space-y-4",
							onSubmit: handleLogin,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "email",
										children: "ایمیل"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "email",
										type: "email",
										value: email,
										onChange: (e) => setEmail(e.target.value),
										placeholder: "you@example.com",
										className: "bg-secondary/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "password",
											children: "رمز عبور"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/forgot-password",
											className: "text-xs text-primary hover:underline",
											children: "فراموشی رمز؟"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "password",
										type: "password",
										value: password,
										onChange: (e) => setPassword(e.target.value),
										placeholder: "••••••••",
										className: "bg-secondary/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "submit",
									disabled: loading,
									className: "mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90",
									children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "ml-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-1 h-4 w-4" }), "ورود"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative my-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute inset-0 flex items-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-full border-t border-border" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "relative flex justify-center text-xs",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "bg-card px-3 text-muted-foreground",
									children: "یا"
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "w-full gap-2",
							onClick: handleGoogleLogin,
							disabled: googleLoading,
							children: [googleLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
								className: "h-5 w-5",
								viewBox: "0 0 24 24",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z",
										fill: "#4285F4"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
										fill: "#34A853"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z",
										fill: "#FBBC05"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z",
										fill: "#EA4335"
									})
								]
							}), "ورود با Google"]
						}),
						false
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 text-center text-sm text-muted-foreground",
					children: [
						"حساب ندارید?",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/signup",
							className: "text-primary hover:underline",
							children: "ثبت‌نام کنید"
						})
					]
				})
			]
		})
	});
}
//#endregion
export { LoginPage as component };
