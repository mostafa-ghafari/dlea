import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { C as Shield, Et as CircleCheck, Ft as Calendar, Gt as ArrowLeft, Mt as ChartLine, Nt as ChartColumn, Rt as Brain, S as Sparkles, c as Trophy, g as Target, t as Zap, zt as BookOpen } from "../_libs/lucide-react.mjs";
import { t as ThemeToggle } from "./theme-CkMg7ySe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-4ndxdKlt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Progressive scroll reveal for landing sections.
* Elements marked with `data-reveal` fade/slide in as they enter the viewport.
*/
function ScrollReveal() {
	(0, import_react.useEffect)(() => {
		const nodes = Array.from(document.querySelectorAll("[data-reveal]"));
		if (nodes.length === 0) return;
		if (!("IntersectionObserver" in window)) {
			nodes.forEach((n) => n.classList.add("reveal-in"));
			return;
		}
		nodes.forEach((n) => n.classList.add("reveal"));
		const io = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add("reveal-in");
					io.unobserve(entry.target);
				}
			});
		}, {
			threshold: .12,
			rootMargin: "0px 0px -60px 0px"
		});
		nodes.forEach((n) => io.observe(n));
		return () => io.disconnect();
	}, []);
	return null;
}
function fa(n, decimals) {
	return n.toLocaleString("fa-IR", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals
	});
}
/** Counts from zero up to `value` when the element scrolls into view. */
function CountUp({ value, decimals = 0, prefix = "", suffix = "", duration = 1400, className, signed = false }) {
	const ref = (0, import_react.useRef)(null);
	const [display, setDisplay] = (0, import_react.useState)(0);
	const started = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		const run = () => {
			if (started.current) return;
			started.current = true;
			if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
				setDisplay(value);
				return;
			}
			const start = performance.now();
			const tick = (now) => {
				const p = Math.min((now - start) / duration, 1);
				const eased = 1 - Math.pow(1 - p, 3);
				setDisplay(value * eased);
				if (p < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		};
		if (!("IntersectionObserver" in window)) {
			run();
			return;
		}
		const io = new IntersectionObserver((entries) => {
			entries.forEach((e) => {
				if (e.isIntersecting) {
					run();
					io.disconnect();
				}
			});
		}, { threshold: .3 });
		io.observe(el);
		return () => io.disconnect();
	}, [value, duration]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		ref,
		className,
		children: [
			signed && value > 0 ? "+" : "",
			prefix,
			fa(display, decimals),
			suffix
		]
	});
}
var features = [
	{
		icon: BookOpen,
		title: "ژورنال حرفه‌ای",
		desc: "ثبت جامع معاملات، احساسات و درس‌های آموخته‌شده در یک محیط منظم."
	},
	{
		icon: Brain,
		title: "مربی هوشمند AI",
		desc: "تحلیل عمیق سبک معامله‌گری شما و پیشنهادهای شخصی‌سازی‌شده برای رشد."
	},
	{
		icon: Shield,
		title: "مدیریت ریسک",
		desc: "تعریف قوانین شخصی و کنترل خودکار پایبندی به آن‌ها در هر معامله."
	},
	{
		icon: Zap,
		title: "اتصال متاتریدر",
		desc: "همگام‌سازی خودکار معاملات از MT4/MT5 بدون نیاز به ثبت دستی."
	},
	{
		icon: ChartColumn,
		title: "داشبورد کامل",
		desc: "Win Rate، Profit Factor، Drawdown و ده‌ها متریک حرفه‌ای در یک نگاه."
	},
	{
		icon: Calendar,
		title: "تقویم معاملاتی",
		desc: "نقشه رنگی روزهای سودده و زیان‌ده برای شناسایی الگوهای عملکردی."
	},
	{
		icon: Target,
		title: "اهداف و پیشرفت",
		desc: "تعیین هدف ماهانه و پیگیری میزان تحقق آن با نمودارهای شفاف."
	},
	{
		icon: Trophy,
		title: "سیستم نشان",
		desc: "کسب دستاورد برای حفظ انگیزه و ساخت عادات معاملاتی سالم."
	}
];
var plans = [
	{
		name: "رایگان",
		price: "۰",
		unit: "تومان",
		tagline: "برای شروع ژورنال‌نویسی",
		features: [
			"۱ پرتفولیو",
			"۵۰ معامله در ماه",
			"ژورنال ساده",
			"آمار پایه"
		],
		cta: "شروع رایگان",
		highlight: false
	},
	{
		name: "Pro",
		price: "۲۰۰,۰۰۰",
		unit: "تومان / ماه",
		tagline: "برای معامله‌گران فعال",
		features: [
			"پرتفولیو نامحدود",
			"معاملات نامحدود",
			"اتصال MetaTrader",
			"تحلیل هوش مصنوعی",
			"گزارش‌های حرفه‌ای",
			"نمودارهای کامل"
		],
		cta: "انتخاب Pro",
		highlight: true
	},
	{
		name: "Pro Max",
		price: "۵۰۰,۰۰۰",
		unit: "تومان / ماه",
		tagline: "مربی شخصی معامله‌گری",
		features: [
			"پرتفولیو نامحدود",
			"تمامی امکانات Pro",
			"AI پیشرفته + مربی شخصی",
			"تحلیل روانشناسی",
			"گزارش‌های اختصاصی",
			"دسترسی زودهنگام به قابلیت‌های جدید"
		],
		cta: "انتخاب Pro Max",
		highlight: false
	}
];
function Landing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollReveal, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[var(--shadow-glow)]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartLine, { className: "h-5 w-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-bold",
								children: ["Dlea ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-primary",
									children: "AI"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "hidden items-center gap-6 text-sm text-muted-foreground md:flex",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#features",
									className: "hover:text-foreground",
									children: "امکانات"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#pricing",
									className: "hover:text-foreground",
									children: "تعرفه‌ها"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#how",
									className: "hover:text-foreground",
									children: "چگونه کار می‌کند"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#faq",
									className: "hover:text-foreground",
									children: "سوالات متداول"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, { className: "h-9 w-9" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/login",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "sm",
										children: "ورود"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/signup",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										className: "bg-primary text-primary-foreground hover:bg-primary/90",
										children: "ثبت‌نام رایگان"
									})
								})
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "hero-bg relative overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto max-w-3xl text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "outline",
								className: "mb-6 border-primary/40 bg-primary/10 text-primary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "ml-1.5 h-3 w-3" }), "مربی هوشمند معامله‌گری"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								className: "text-4xl font-bold leading-tight tracking-tight md:text-6xl",
								children: [
									"ژورنال هوشمند برای",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "bg-gradient-to-l from-primary via-primary to-accent bg-clip-text text-transparent",
										children: "معامله‌گران حرفه‌ای"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mx-auto mt-6 max-w-2xl text-lg text-muted-foreground",
								children: "معاملات، احساسات و اشتباهات خود را ثبت کنید. هوش مصنوعی مثل یک مربی شخصی عملکرد شما را تحلیل کرده و مسیر رشد را نشان می‌دهد."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-8 flex flex-wrap justify-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/signup",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "lg",
										className: "h-12 bg-primary px-6 text-primary-foreground shadow-[var(--shadow-glow)] hover:bg-primary/90",
										children: ["شروع رایگان", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-1 h-4 w-4" })]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#features",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "lg",
										variant: "outline",
										className: "h-12 border-border bg-secondary/40 px-6",
										children: "مشاهده امکانات"
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 gain" }), " بدون نیاز به کارت"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 gain" }), " اتصال MT4/MT5"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 gain" }), " کاملاً فارسی"]
									})
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto mt-16 max-w-5xl",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "card-surface overflow-hidden rounded-2xl p-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-background/40 p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid gap-4 md:grid-cols-4",
									children: [
										{
											label: "سود کل",
											value: 12480,
											prefix: "$",
											suffix: "",
											decimals: 0,
											change: 24.8,
											positive: true
										},
										{
											label: "Win Rate",
											value: 68,
											prefix: "",
											suffix: "٪",
											decimals: 0,
											change: 4.2,
											positive: true
										},
										{
											label: "Profit Factor",
											value: 2.14,
											prefix: "",
											suffix: "",
											decimals: 2,
											change: .3,
											positive: true
										},
										{
											label: "Max Drawdown",
											value: -8.2,
											prefix: "",
											suffix: "٪",
											decimals: 1,
											change: -1.1,
											positive: false
										}
									].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-lg border border-border bg-card p-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-xs text-muted-foreground",
												children: s.label
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-2 text-2xl font-bold tabular",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CountUp, {
													value: s.value,
													decimals: s.decimals,
													prefix: s.prefix,
													suffix: s.suffix
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: `mt-1 text-xs tabular ${s.positive ? "gain" : "loss"}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CountUp, {
													value: s.change,
													decimals: 1,
													signed: true,
													suffix: s.label === "Profit Factor" ? "" : "٪"
												})
											})
										]
									}, s.label))
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-4 h-48 rounded-lg border border-border bg-gradient-to-b from-primary/10 to-transparent p-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
										viewBox: "0 0 400 120",
										className: "h-full w-full",
										preserveAspectRatio: "none",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
												id: "g1",
												x1: "0",
												y1: "0",
												x2: "0",
												y2: "1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
													offset: "0%",
													stopColor: "var(--color-primary)",
													stopOpacity: "0.4"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
													offset: "100%",
													stopColor: "var(--color-primary)",
													stopOpacity: "0"
												})]
											}) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
												className: "chart-area",
												d: "M0,90 L30,85 L60,70 L90,75 L120,55 L150,60 L180,40 L210,45 L240,30 L270,35 L300,25 L330,20 L360,15 L400,10 L400,120 L0,120 Z",
												fill: "url(#g1)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
												className: "chart-line",
												d: "M0,90 L30,85 L60,70 L90,75 L120,55 L150,60 L180,40 L210,45 L240,30 L270,35 L300,25 L330,20 L360,15 L400,10",
												fill: "none",
												stroke: "var(--color-primary)",
												strokeWidth: "2"
											})
										]
									})
								})]
							})
						})
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				"data-reveal": true,
				id: "features",
				className: "border-t border-border bg-background py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-7xl px-4 md:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto max-w-2xl text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: "mb-4",
								children: "امکانات"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-3xl font-bold md:text-4xl",
								children: "هرآنچه یک معامله‌گر حرفه‌ای نیاز دارد"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-muted-foreground",
								children: "از ثبت ساده تا تحلیل هوشمند — یک پلتفرم کامل برای رشد سیستماتیک."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
						children: features.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "card-surface group p-5 transition-all hover:border-primary/40",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(f.icon, { className: "h-5 w-5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-semibold",
									children: f.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1.5 text-sm leading-relaxed text-muted-foreground",
									children: f.desc
								})
							]
						}, f.title))
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				"data-reveal": true,
				id: "how",
				className: "border-t border-border bg-secondary/20 py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-7xl px-4 md:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto max-w-2xl text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: "mb-4",
							children: "فرآیند"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-3xl font-bold md:text-4xl",
							children: "در سه گام ساده"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-14 grid gap-6 md:grid-cols-3",
						children: [
							{
								num: "۰۱",
								title: "ثبت معاملات",
								desc: "دستی یا با اتصال مستقیم به متاتریدر."
							},
							{
								num: "۰۲",
								title: "نوشتن ژورنال",
								desc: "دلیل ورود، احساسات و درس‌های هر معامله."
							},
							{
								num: "۰۳",
								title: "تحلیل با AI",
								desc: "دریافت گزارش شخصی و پیشنهادهای رشد."
							}
						].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "card-surface relative overflow-hidden p-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-5xl font-bold text-primary/20 tabular",
									children: s.num
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-4 text-lg font-semibold",
									children: s.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-muted-foreground",
									children: s.desc
								})
							]
						}, s.num))
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				"data-reveal": true,
				id: "pricing",
				className: "border-t border-border bg-background py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-7xl px-4 md:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto max-w-2xl text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: "mb-4",
								children: "تعرفه‌ها"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-3xl font-bold md:text-4xl",
								children: "پلن مناسب خود را انتخاب کنید"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-muted-foreground",
								children: "همیشه می‌توانید بعداً ارتقا دهید."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-14 grid gap-6 md:grid-cols-3",
						children: plans.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `card-surface relative flex flex-col p-6 ${p.highlight ? "border-primary/60 shadow-[var(--shadow-glow)]" : ""}`,
							children: [
								p.highlight && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									className: "absolute -top-3 right-6 bg-primary text-primary-foreground",
									children: "محبوب‌ترین"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-lg font-semibold",
									children: p.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm text-muted-foreground",
									children: p.tagline
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-3xl font-bold tabular md:text-4xl",
										children: p.price
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted-foreground md:text-sm",
										children: p.unit
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-6 flex-1 space-y-3 text-sm",
									children: p.features.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-start gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: f })]
									}, f))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/signup",
									className: "mt-6",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										className: `w-full ${p.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`,
										variant: p.highlight ? "default" : "outline",
										children: p.cta
									})
								})
							]
						}, p.name))
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				"data-reveal": true,
				id: "faq",
				className: "border-t border-border bg-secondary/20 py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-3xl px-4 md:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: "mb-4",
								children: "سوالات متداول"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-3xl font-bold md:text-4xl",
								children: "پرسش‌های رایج معامله‌گران"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-muted-foreground",
								children: "هرچه لازم است قبل از شروع بدانید."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-12 divide-y divide-border rounded-2xl border border-border bg-card",
						children: [
							{
								q: "آیا برای استفاده به کارت بانکی نیاز دارم؟",
								a: "خیر. نسخه رایگان کامل و بدون نیاز به کارت بانکی در دسترس است. تنها هنگام ارتقا به Pro یا Pro Max پرداخت انجام می‌شود."
							},
							{
								q: "چگونه به متاتریدر متصل می‌شوم؟",
								a: "در نسخه Pro، با نصب یک اکسپرت (EA) روی MT4/MT5 معاملات به‌صورت خودکار و لحظه‌ای همگام‌سازی می‌شوند. نیازی به ثبت دستی نیست."
							},
							{
								q: "داده‌های معاملات من امن هستند؟",
								a: "بله. تمام داده‌ها به‌صورت رمزنگاری‌شده ذخیره می‌شوند و هیچ‌کس جز شما به آن‌ها دسترسی ندارد. رمز عبور بروکر شما هرگز ذخیره نمی‌شود."
							},
							{
								q: "مربی هوشمند AI چطور کار می‌کند؟",
								a: "هوش مصنوعی الگوهای رفتاری، نقاط قوت و ضعف شما را از روی تاریخچه معاملات و ژورنال‌ها تحلیل می‌کند و گزارش‌های شخصی روزانه و هفتگی ارائه می‌دهد."
							},
							{
								q: "آیا می‌توانم پلن خود را تغییر دهم؟",
								a: "بله، در هر زمان می‌توانید ارتقا یا کاهش سطح دهید. مبلغ باقیمانده به‌صورت اعتبار در حساب شما محاسبه می‌شود."
							},
							{
								q: "از کدام بازارها پشتیبانی می‌کنید؟",
								a: "فارکس، کریپتو، طلا، نقره، شاخص‌ها (US30, NAS100, ...)، سهام آمریکا و کالاها. اگر بازار خاصی نیاز دارید به ما اطلاع دهید."
							},
							{
								q: "آیا اپلیکیشن موبایل دارید؟",
								a: "نسخه وب کاملاً واکنش‌گرا و روی موبایل و تبلت به‌خوبی کار می‌کند. اپ اختصاصی iOS/Android در نقشه راه ما قرار دارد."
							}
						].map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
							className: "group px-6 py-5 [&_summary::-webkit-details-marker]:hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
								className: "flex cursor-pointer items-center justify-between gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base font-medium",
									children: item.q
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-secondary/60 text-muted-foreground transition-transform group-open:rotate-45",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-lg leading-none",
										children: "+"
									})
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm leading-relaxed text-muted-foreground",
								children: item.a
							})]
						}, i))
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				"data-reveal": true,
				className: "border-t border-border bg-background py-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-4xl px-4 text-center md:px-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-3xl font-bold md:text-4xl",
							children: "آماده تبدیل شدن به یک معامله‌گر منظم هستید؟"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mx-auto mt-4 max-w-xl text-muted-foreground",
							children: "همین امروز رایگان ثبت‌نام کنید و اولین گزارش هوشمند خود را دریافت کنید."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/signup",
							className: "mt-8 inline-block",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "lg",
								className: "h-12 bg-primary px-8 text-primary-foreground shadow-[var(--shadow-glow)] hover:bg-primary/90",
								children: ["شروع رایگان", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-2 h-4 w-4" })]
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "border-t border-border py-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row md:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartLine, { className: "h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "© ۱۴۰۳ Dlea AI — تمام حقوق محفوظ است." })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/terms",
								className: "hover:text-foreground",
								children: "قوانین"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/privacy",
								className: "hover:text-foreground",
								children: "حریم خصوصی"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/contact",
								className: "hover:text-foreground",
								children: "تماس"
							})
						]
					})]
				})
			})
		]
	});
}
//#endregion
export { Landing as component };
