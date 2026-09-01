import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as API_BASE } from "./api-CQV86vH5.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { Gt as ArrowLeft, K as Lock, Mt as ChartLine, W as Mail, q as LoaderCircle, tt as KeyRound } from "../_libs/lucide-react.mjs";
import { t as Label } from "./label-AutfcB-T.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/forgot-password-2tSWNkh1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ForgotPasswordPage() {
	const navigate = useNavigate();
	const [step, setStep] = (0, import_react.useState)("email");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [email, setEmail] = (0, import_react.useState)("");
	const [code, setCode] = (0, import_react.useState)([
		"",
		"",
		"",
		"",
		"",
		""
	]);
	const [newPassword, setNewPassword] = (0, import_react.useState)("");
	const [confirmPassword, setConfirmPassword] = (0, import_react.useState)("");
	async function handleSendCode(e) {
		e.preventDefault();
		if (!email.trim()) {
			toast.error("ایمیل الزامی است");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`${API_BASE}/auth/password-reset-request/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim() })
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || "ارسال کد تایید ناموفق بود");
				setLoading(false);
				return;
			}
			toast.success("کد تایید به ایمیل شما ارسال شد");
			setStep("code");
		} catch {
			toast.error("خطا در اتصال به سرور");
		}
		setLoading(false);
	}
	async function handleVerifyCode(e) {
		e.preventDefault();
		const fullCode = code.join("");
		if (fullCode.length !== 6) {
			toast.error("کد تایید باید ۶ رقمی باشد");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`${API_BASE}/auth/password-reset-verify/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email.trim(),
					code: fullCode
				})
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || "کد تایید نادرست است");
				setLoading(false);
				return;
			}
			toast.success("کد تایید شد");
			setStep("new-password");
		} catch {
			toast.error("خطا در اتصال به سرور");
		}
		setLoading(false);
	}
	async function handleResetPassword(e) {
		e.preventDefault();
		if (newPassword.length < 8) {
			toast.error("رمز عبور باید حداقل ۸ کاراکتر باشد");
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error("رمزهای عبور مطابقت ندارند");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`${API_BASE}/auth/password-reset-confirm/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email.trim(),
					code: code.join(""),
					password: newPassword
				})
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || "تغییر رمز عبور ناموفق بود");
				setLoading(false);
				return;
			}
			toast.success("رمز عبور با موفقیت تغییر کرد");
			navigate({ to: "/login" });
		} catch {
			toast.error("خطا در اتصال به سرور");
		}
		setLoading(false);
	}
	function handleCodeInput(index, value) {
		const digit = value.replace(/\D/g, "").slice(-1);
		const newCode = [...code];
		newCode[index] = digit;
		setCode(newCode);
		if (digit && index < 5) document.getElementById(`code-${index + 1}`)?.focus();
	}
	function handleCodeKeyDown(index, e) {
		if (e.key === "Backspace" && !code[index] && index > 0) document.getElementById(`code-${index - 1}`)?.focus();
	}
	function handleCodePaste(e) {
		e.preventDefault();
		const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
		const newCode = pasted.split("").concat(Array(6 - pasted.length).fill(""));
		setCode(newCode);
		const focusIndex = Math.min(pasted.length, 5);
		document.getElementById(`code-${focusIndex}`)?.focus();
	}
	const { icon: StepIcon, title, desc } = {
		email: {
			icon: Mail,
			title: "بازیابی رمز عبور",
			desc: "ایمیل خود را وارد کنید تا کد تایید برایتان ارسال شود."
		},
		code: {
			icon: KeyRound,
			title: "کد تایید",
			desc: `کد ۶ رقمی ارسال شده به ${email} را وارد کنید.`
		},
		"new-password": {
			icon: Lock,
			title: "رمز جدید",
			desc: "رمز عبور جدید خود را انتخاب کنید."
		}
	}[step];
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
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-6 flex items-center justify-center gap-2",
							children: [
								"email",
								"code",
								"new-password"
							].map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${step === s ? "bg-primary text-primary-foreground" : [
										"email",
										"code",
										"new-password"
									].indexOf(step) > i ? "bg-primary/30 text-primary" : "bg-secondary text-muted-foreground"}`,
									children: i + 1
								}), i < 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `h-0.5 w-8 ${[
									"email",
									"code",
									"new-password"
								].indexOf(step) > i ? "bg-primary" : "bg-secondary"}` })]
							}, s))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-6 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepIcon, { className: "h-6 w-6" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-xl font-bold",
									children: title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: desc
								})
							]
						}),
						step === "email" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleSendCode,
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "reset-email",
									children: "ایمیل"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "reset-email",
									type: "email",
									value: email,
									onChange: (e) => setEmail(e.target.value),
									placeholder: "you@example.com",
									className: "bg-secondary/60",
									autoFocus: true
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "submit",
								disabled: loading,
								className: "w-full bg-primary text-primary-foreground hover:bg-primary/90",
								children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "ml-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-1 h-4 w-4" }), "ارسال کد تایید"]
							})]
						}),
						step === "code" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleVerifyCode,
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "کد ۶ رقمی" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex justify-center gap-2",
										dir: "ltr",
										children: code.map((digit, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: `code-${i}`,
											type: "text",
											inputMode: "numeric",
											maxLength: 1,
											value: digit,
											onChange: (e) => handleCodeInput(i, e.target.value),
											onKeyDown: (e) => handleCodeKeyDown(i, e),
											onPaste: i === 0 ? handleCodePaste : void 0,
											className: "h-12 w-12 text-center text-lg font-bold tabular bg-secondary/60",
											autoFocus: i === 0
										}, i))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "submit",
									disabled: loading,
									className: "w-full bg-primary text-primary-foreground hover:bg-primary/90",
									children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "ml-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-1 h-4 w-4" }), "تایید کد"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "w-full text-center text-xs text-muted-foreground hover:text-primary",
									onClick: () => {
										setCode([
											"",
											"",
											"",
											"",
											"",
											""
										]);
										handleSendCode(new Event("submit"));
									},
									children: "ارسال مجدد کد"
								})
							]
						}),
						step === "new-password" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleResetPassword,
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "new-pw",
										children: "رمز عبور جدید"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "new-pw",
										type: "password",
										value: newPassword,
										onChange: (e) => setNewPassword(e.target.value),
										placeholder: "حداقل ۸ کاراکتر",
										className: "bg-secondary/60",
										autoFocus: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "confirm-pw",
										children: "تکرار رمز عبور"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "confirm-pw",
										type: "password",
										value: confirmPassword,
										onChange: (e) => setConfirmPassword(e.target.value),
										placeholder: "رمز عبور را دوباره وارد کنید",
										className: "bg-secondary/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "submit",
									disabled: loading,
									className: "w-full bg-primary text-primary-foreground hover:bg-primary/90",
									children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "ml-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-1 h-4 w-4" }), "تغییر رمز عبور"]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 text-center text-sm text-muted-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						className: "text-primary hover:underline",
						children: "← بازگشت به ورود"
					})
				})
			]
		})
	});
}
//#endregion
export { ForgotPasswordPage as component };
