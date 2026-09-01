import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as API_BASE } from "./api-CQV86vH5.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as cn, t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { B as Minus, Et as CircleCheck, Gt as ArrowLeft, Mt as ChartLine, W as Mail, q as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as Label } from "./label-AutfcB-T.mjs";
import { n as jt, t as Lt } from "../_libs/input-otp.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/signup-DImp9Fy-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var InputOTP = import_react.forwardRef(({ className, containerClassName, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lt, {
	ref,
	containerClassName: cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName),
	className: cn("disabled:cursor-not-allowed", className),
	...props
}));
InputOTP.displayName = "InputOTP";
var InputOTPGroup = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex items-center", className),
	...props
}));
InputOTPGroup.displayName = "InputOTPGroup";
var InputOTPSlot = import_react.forwardRef(({ index, className, ...props }, ref) => {
	const { char, hasFakeCaret, isActive } = import_react.useContext(jt).slots[index];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref,
		className: cn("relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md", isActive && "z-10 ring-1 ring-ring", className),
		...props,
		children: [char, hasFakeCaret && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute inset-0 flex items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 w-px animate-caret-blink bg-foreground duration-1000" })
		})]
	});
});
InputOTPSlot.displayName = "InputOTPSlot";
var InputOTPSeparator = import_react.forwardRef(({ ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	role: "separator",
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {})
}));
InputOTPSeparator.displayName = "InputOTPSeparator";
var GOOGLE_CLIENT_ID = "604447884984-9bl6a66i13r5jcroovkdabsidttgnpel.apps.googleusercontent.com";
function SignupPage() {
	const navigate = useNavigate();
	const [step, setStep] = (0, import_react.useState)("form");
	const [firstName, setFirstName] = (0, import_react.useState)("");
	const [lastName, setLastName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [otp, setOtp] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [googleLoading, setGoogleLoading] = (0, import_react.useState)(false);
	const [countdown, setCountdown] = (0, import_react.useState)(0);
	const [debugOtp, setDebugOtp] = (0, import_react.useState)("");
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
				toast.error(data.error || "خطا در ثبت‌نام با گوگل");
				setGoogleLoading(false);
				return;
			}
			localStorage.setItem("dlea:access", data.access);
			localStorage.setItem("dlea:refresh", data.refresh);
			localStorage.setItem("dlea:user", JSON.stringify(data.user));
			setStep("done");
			toast.success("ثبت‌نام با موفقیت انجام شد");
			setTimeout(() => navigate({ to: "/app/dashboard" }), 600);
		} catch {
			toast.error("خطا در اتصال به سرور");
		}
		setGoogleLoading(false);
	}
	function startCountdown() {
		setCountdown(60);
		const iv = setInterval(() => {
			setCountdown((c) => {
				if (c <= 1) {
					clearInterval(iv);
					return 0;
				}
				return c - 1;
			});
		}, 1e3);
	}
	async function handleSendOtp(e) {
		e.preventDefault();
		if (!firstName.trim() || !lastName.trim()) {
			toast.error("نام و نام خانوادگی الزامی است");
			return;
		}
		if (!email.trim()) {
			toast.error("ایمیل الزامی است");
			return;
		}
		if (!email.includes("@")) {
			toast.error("ایمیل معتبر نیست");
			return;
		}
		if (password.length < 8) {
			toast.error("رمز عبور باید حداقل ۸ کاراکتر باشد");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`${API_BASE}/auth/send-otp/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email.trim(),
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					password
				})
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || "خطا در ارسال کد");
				setLoading(false);
				return;
			}
			setDebugOtp(data.debug_otp || "");
			setStep("otp");
			startCountdown();
			toast.success(`کد تأیید به ${email} ارسال شد`);
		} catch {
			toast.error("خطا در اتصال به سرور");
		}
		setLoading(false);
	}
	async function handleVerifyOtp() {
		if (otp.length !== 6) {
			toast.error("کد تأیید ۶ رقمی را وارد کنید");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`${API_BASE}/auth/verify-otp/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email.trim(),
					otp,
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					password
				})
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || "خطا در تأیید کد");
				setLoading(false);
				return;
			}
			localStorage.setItem("dlea:access", data.access);
			localStorage.setItem("dlea:refresh", data.refresh);
			localStorage.setItem("dlea:user", JSON.stringify(data.user));
			setStep("done");
			toast.success("ثبت‌نام با موفقیت انجام شد");
			setTimeout(() => navigate({ to: "/app/dashboard" }), 600);
		} catch {
			toast.error("خطا در اتصال به سرور");
		}
		setLoading(false);
	}
	async function handleResendOtp() {
		if (countdown > 0) return;
		setLoading(true);
		try {
			const res = await fetch(`${API_BASE}/auth/send-otp/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim() })
			});
			const data = await res.json();
			if (res.ok) {
				setDebugOtp(data.debug_otp || "");
				startCountdown();
				toast.success(`کد جدید به ${email} ارسال شد`);
			}
		} catch {}
		setLoading(false);
	}
	function handleGoogleSignup() {
		if (window.google) window.google.accounts.id.prompt();
		else toast.error("سرویس گوگل هنوز بارگذاری نشده است. لطفاً صفحه را رفرش کنید.");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "hero-bg flex min-h-screen items-center justify-center px-4 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-4xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
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
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "card-surface grid overflow-hidden md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-l border-border bg-secondary/20 p-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-semibold",
							children: "با پلن رایگان شروع کنید"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: "همیشه می‌توانید بعداً ارتقا دهید."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-6 space-y-3 text-sm",
							children: [
								"۱ پرتفولیو رایگان",
								"۵۰ معامله در ماه",
								"ژورنال کامل",
								"آمار پایه",
								"بدون نیاز به کارت اعتباری"
							].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: f })]
							}, f))
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-8",
					children: [
						step === "form" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-2xl font-bold",
								children: "ساخت حساب جدید"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "mt-6 space-y-4",
								onSubmit: handleSendOtp,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "firstName",
												children: "نام"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "firstName",
												value: firstName,
												onChange: (e) => setFirstName(e.target.value),
												placeholder: "علی",
												className: "bg-secondary/60"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "lastName",
												children: "نام خانوادگی"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "lastName",
												value: lastName,
												onChange: (e) => setLastName(e.target.value),
												placeholder: "رضایی",
												className: "bg-secondary/60"
											})]
										})]
									}),
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
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "password",
											children: "رمز عبور"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "password",
											type: "password",
											value: password,
											onChange: (e) => setPassword(e.target.value),
											placeholder: "حداقل ۸ کاراکتر",
											className: "bg-secondary/60"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										type: "submit",
										disabled: loading,
										className: "mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90",
										children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "ml-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-1 h-4 w-4" }), "ارسال کد تأیید"]
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
								onClick: handleGoogleSignup,
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
								}), "ثبت‌نام با Google"]
							}),
							false,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-xs text-muted-foreground",
								children: "با ثبت‌نام، قوانین و حریم خصوصی را می‌پذیرید."
							})
						] }),
						step === "otp" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-7 w-7" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mt-4 text-2xl font-bold",
									children: "تأیید ایمیل"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-sm text-muted-foreground",
									children: [
										"کد ۶ رقمی به ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium text-foreground",
											children: email
										}),
										" ارسال شد"
									]
								}),
								debugOtp && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-amber-600 dark:text-amber-400 font-medium",
											children: "🔑 کد تأیید (dev):"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-2xl font-mono font-bold tracking-widest text-amber-700 dark:text-amber-300",
											dir: "ltr",
											children: debugOtp
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-amber-600/70 dark:text-amber-400/70",
											children: "این کد در حالت توسعه نمایش داده می‌شود"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-6 flex justify-center",
									dir: "ltr",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InputOTP, {
										maxLength: 6,
										value: otp,
										onChange: setOtp,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InputOTPGroup, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputOTPSlot, { index: 0 }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputOTPSlot, { index: 1 }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputOTPSlot, { index: 2 })
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(InputOTPGroup, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputOTPSlot, { index: 3 }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputOTPSlot, { index: 4 }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InputOTPSlot, { index: 5 })
										] })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									disabled: loading || otp.length !== 6,
									onClick: handleVerifyOtp,
									className: "mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90",
									children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "ml-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-1 h-4 w-4" }), "تأیید و ساخت حساب"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: countdown > 0,
									onClick: handleResendOtp,
									className: "mt-4 text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed",
									children: countdown > 0 ? `ارسال مجدد بعد از ${countdown} ثانیه` : "ارسال مجدد کد"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setStep("form"),
									className: "mt-2 block w-full text-xs text-muted-foreground hover:underline",
									children: "بازگشت به فرم ثبت‌نام"
								})
							]
						}),
						step === "done" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center py-8",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-500/15 text-green-500",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-8 w-8" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mt-4 text-2xl font-bold",
									children: "ثبت‌نام موفق! 🎉"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-muted-foreground",
									children: "در حال انتقال به داشبورد..."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 text-center text-sm text-muted-foreground",
							children: [
								"حساب دارید?",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/login",
									className: "text-primary hover:underline",
									children: "وارد شوید"
								})
							]
						})
					]
				})]
			})]
		})
	});
}
//#endregion
export { SignupPage as component };
