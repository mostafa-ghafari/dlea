import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useNavigate, d as useLocation, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime, n as AvatarFallback$1, r as AvatarImage$1, t as Avatar$1 } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { $ as useUsers, G as useJournalEntries, K as usePlanLimits, Q as useTrades, X as useRole, Y as useProfile, Z as useSubscription, n as ROLE_NAMES } from "./api-CQV86vH5.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as useLocalState, l as usePlatform, o as useCurrentUser, r as fullName, s as useHasPortfolio, t as ONBOARDING_KEY } from "./router-DPngkkDa.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as cn, t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { $ as LifeBuoy, At as ChevronDown, E as Settings, G as LogOut, Gt as ArrowLeft, H as Menu, It as CalendarDays, K as Lock, L as PanelRightOpen, M as Plus, Mt as ChartLine, O as Search, R as PanelRightClose, S as Sparkles, T as ShieldAlert, Tt as CircleQuestionMark, U as Megaphone, Vt as Bell, Wt as ArrowRight, Yt as Activity, c as Trophy, et as LayoutDashboard, g as Target, i as Users, jt as Check, l as TriangleAlert, n as X, r as Wallet, u as TrendingUp, vt as CreditCard, w as ShieldCheck, yt as Cpu, zt as BookOpen } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay, c as DialogTrigger, i as DialogDescription, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { a as DialogFooter, d as DropdownMenuItem, f as DropdownMenuLabel, i as DialogDescription$1, l as DropdownMenu, m as DropdownMenuTrigger, o as DialogHeader, p as DropdownMenuSeparator, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1, u as DropdownMenuContent } from "./dropdown-menu-CAJl4ZNo.mjs";
import { t as ThemeToggle } from "./theme-CkMg7ySe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AppShell-Cx40ixlT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Avatar = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar$1, {
	ref,
	className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
	...props
}));
Avatar.displayName = Avatar$1.displayName;
var AvatarImage = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage$1, {
	ref,
	className: cn("aspect-square h-full w-full", className),
	...props
}));
AvatarImage.displayName = AvatarImage$1.displayName;
var AvatarFallback = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback$1, {
	ref,
	className: cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className),
	...props
}));
AvatarFallback.displayName = AvatarFallback$1.displayName;
var Sheet = Dialog;
var SheetTrigger = DialogTrigger;
var SheetPortal = DialogPortal;
var SheetOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
SheetOverlay.displayName = DialogOverlay.displayName;
var sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out", {
	variants: { side: {
		top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
		bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
		left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
		right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
	} },
	defaultVariants: { side: "right" }
});
var SheetContent = import_react.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
	ref,
	className: cn(sheetVariants({ side }), className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	}), children]
})] }));
SheetContent.displayName = DialogContent.displayName;
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
SheetFooter.displayName = "SheetFooter";
var SheetTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
	ref,
	className: cn("text-lg font-semibold text-foreground", className),
	...props
}));
SheetTitle.displayName = DialogTitle.displayName;
var SheetDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
SheetDescription.displayName = DialogDescription.displayName;
/** Per-section guide tours — shown automatically on first visit only. */
var tours = {
	"/app/dashboard": [
		{
			title: "خوش آمدی به داشبورد",
			body: "اینجا خلاصه عملکرد کل حساب فارکس تو را می‌بینی: سود کل، نرخ برد و Profit Factor."
		},
		{
			title: "نمودار Equity",
			body: "روند رشد سرمایه در ۳۰ روز اخیر. خط نقطه‌چین موجودی و خط پُر اکوییتی است."
		},
		{
			title: "آخرین معاملات",
			body: "شش معامله آخر همیشه اینجاست؛ برای جزئیات کامل به بخش معاملات برو."
		}
	],
	"/app/portfolios": [
		{
			title: "اولین قدم: پرتفولیو",
			body: "قبل از هر کاری باید حداقل یک پرتفولیو بسازی. بقیه بخش‌ها تا آن زمان قفل هستند."
		},
		{
			title: "اتصال متاتریدر",
			body: "با دکمه «اتصال MT» تمام فیلدهای معامله مستقیماً از MT4/MT5 خوانده می‌شود."
		},
		{
			title: "نام استراتژی",
			body: "برای هر پرتفولیو می‌توانی یک نام استراتژی ثبت کنی؛ فعلاً فقط برای برچسب‌گذاری."
		}
	],
	"/app/trades": [
		{
			title: "جدول معاملات",
			body: "تمام معاملات دریافتی از متاتریدر اینجاست. روی هر ردیف کلیک کن تا جزئیات کامل باز شود."
		},
		{
			title: "شخصی‌سازی ستون‌ها",
			body: "با دکمه «ستون‌ها» انتخاب کن کدام فیلدها نمایش داده شوند و ترتیبشان چه باشد."
		},
		{
			title: "اسکرین‌شات",
			body: "در صفحه جزئیات هر معامله می‌توانی چند تصویر چارت یا Report History آپلود کنی."
		}
	],
	"/app/journal": [
		{
			title: "ژورنال بلوکی",
			body: "ادیتور بلوکی مثل Notion: تیتر، لیست، نقل‌قول و تصویر داخل متن."
		},
		{
			title: "دسته‌بندی زمانی",
			body: "ژورنال‌ها هفته‌به‌هفته و ماه‌به‌ماه گروه‌بندی می‌شوند."
		},
		{
			title: "ویرایش",
			body: "هر ژورنال ثبت‌شده قابل ویرایش است؛ روی دکمه ویرایش کارت بزن."
		}
	],
	"/app/ai-coach": [
		{
			title: "مربی هوشمند",
			body: "مدل مربی را انتخاب کن؛ هر مدل لحن و عمق تحلیل متفاوتی دارد."
		},
		{
			title: "آرشیو گزارش‌ها",
			body: "گزارش هفتگی در پایان هر هفته و گزارش ماهانه در پایان ماه خودکار بایگانی می‌شود."
		},
		{
			title: "استفاده از تاریخچه",
			body: "گزارش جدید با در نظر گرفتن گزارش‌های قبلی ساخته می‌شود تا روند بهبود دیده شود."
		}
	],
	"/app/achievements": [
		{
			title: "نشان‌ها",
			body: "۱۶ نشان که هر کدام به یک قاعده محاسباتی مشخص وصل هستند."
		},
		{
			title: "ریست ماهانه",
			body: "ابتدای هر ماه میلادی نشان‌ها ریست می‌شوند اما آرشیو تاریخی حفظ می‌ماند."
		},
		{
			title: "ارتقای نقش",
			body: "هرچه نشان بیشتری بگیری نقشت ارتقا می‌یابد و هرگز کاهش پیدا نمی‌کند."
		}
	],
	"/app/calendar": [{
		title: "تقویم معاملاتی",
		body: "روزهای سبز سودده و قرمز زیان‌ده هستند؛ الگوهای زمانی خودت را پیدا کن."
	}],
	"/app/risk": [{
		title: "مدیریت ریسک",
		body: "قوانین شخصی‌ات را تعریف کن تا هنگام نزدیک شدن به سقف ریسک هشدار بگیری."
	}],
	"/app/goals": [{
		title: "اهداف",
		body: "هدف ماهانه تعریف کن و درصد پیشرفتش را دنبال کن."
	}],
	"/app/billing": [{
		title: "اشتراک",
		body: "روزهای باقی‌مانده اشتراکت اینجا و روی آواتار کاربری نمایش داده می‌شود."
	}, {
		title: "خرید و تمدید",
		body: "پلن دلخواه را انتخاب کن؛ پرداخت ماهانه یا سالانه با کد تخفیف."
	}],
	"/app/trades/new": [{
		title: "ایمپورت معاملات",
		body: "گزارش History متاتریدر را به‌صورت CSV/HTML/XLSX بارگذاری کن."
	}, {
		title: "اتصال خودکار",
		body: "با رمز Investor حساب را متصل کن تا معاملات خودکار جمع‌آوری شوند."
	}],
	"/app/settings": [{
		title: "تنظیمات",
		body: "پروفایل، اشتراک، اعلان‌ها و اتصال متاتریدر را اینجا مدیریت کن."
	}],
	"/app/admin": [
		{
			title: "پنل مدیریت",
			body: "کاربران، پرداخت‌ها، پلن‌ها و لینک‌های ثبت‌نام اختصاصی."
		},
		{
			title: "مدیریت فیلدها",
			body: "تعیین کن کدام فیلدهای متاتریدر اساساً در اختیار کاربران قرار بگیرد."
		},
		{
			title: "تنظیم گزارش AI",
			body: "تعداد خطوط گزارش تولیدی هوش مصنوعی را بین ۲ تا ۲۰ خط تنظیم کن."
		}
	]
};
var PORTFOLIO_GATE_KEY = "tj:portfolio-gate-seen";
/** When there's no portfolio, show a single reminder dialog instead of the section guide. */
function PortfolioReminderDialog() {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [seen, setSeen, ready] = useLocalState(PORTFOLIO_GATE_KEY, false);
	(0, import_react.useEffect)(() => {
		if (!ready || seen) return;
		setOpen(true);
	}, [ready, seen]);
	if (seen) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog$1, {
		open,
		onOpenChange: (o) => {
			if (!o) {
				setSeen(true);
				setOpen(false);
			}
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
			className: "max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "h-6 w-6" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
					className: "text-center",
					children: "برای شروع، اول پرتفولیو بساز"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
					className: "text-center leading-relaxed",
					children: "تمام بخش‌های پلتفرم (معاملات، ژورنال، اهداف و ...) نیاز به حداقل یک پرتفولیو دارند. تا زمانی که پرتفولیو نسازی، امکان استفاده از این بخش‌ها وجود ندارد."
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, {
				className: "mt-2 justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/app/portfolios",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "bg-primary text-primary-foreground hover:bg-primary/90",
						onClick: () => setSeen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "ml-1 h-4 w-4" }), " ساخت پرتفولیو"]
					})
				})
			})]
		})
	});
}
/** Guide: opens automatically on the first visit of a section, or manually via the help icon. */
function GuideTour({ path, locked }) {
	const steps = tours[path];
	const [seen, setSeen, ready] = useLocalState("tj:tours-seen:v2", {});
	const [open, setOpen] = (0, import_react.useState)(false);
	const [index, setIndex] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		if (locked) return;
		if (!tours[path]) return;
		if (seen[path]) return;
		setIndex(0);
		setOpen(true);
	}, [
		ready,
		path,
		locked
	]);
	if (locked) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortfolioReminderDialog, {});
	if (!steps || steps.length === 0) return null;
	const step = steps[Math.min(index, steps.length - 1)];
	const last = index >= steps.length - 1;
	function finish() {
		setSeen({
			...seen,
			[path]: true
		});
		setOpen(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		variant: "outline",
		size: "icon",
		className: "h-10 w-10 border-border bg-secondary/60",
		"aria-label": "راهنمای این بخش",
		onClick: () => {
			setIndex(0);
			setOpen(true);
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleQuestionMark, { className: "h-4 w-4" })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog$1, {
		open,
		onOpenChange: (o) => {
			if (!o) finish();
			else setOpen(true);
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
			className: "max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle$1, {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-xs font-bold text-primary tabular",
						children: index + 1
					}), step.title]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
					className: "pt-2 text-right leading-relaxed",
					children: step.body
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 flex items-center justify-center gap-1.5",
					children: steps.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-1.5 bg-border"}` }, i))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "mt-5 gap-2 sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "sm",
						onClick: finish,
						children: "رد کردن راهنما"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [index > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => setIndex((i) => i - 1),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "ml-1 h-3.5 w-3.5" }), " قبلی"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							className: "bg-primary text-primary-foreground hover:bg-primary/90",
							onClick: () => last ? finish() : setIndex((i) => i + 1),
							children: last ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "ml-1 h-3.5 w-3.5" }), " فهمیدم"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["بعدی ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-1 h-3.5 w-3.5" })] })
						})]
					})]
				})
			]
		})
	})] });
}
var nav = [
	{
		to: "/app/dashboard",
		icon: LayoutDashboard,
		label: "داشبورد",
		feature: null,
		admin: false
	},
	{
		to: "/app/portfolios",
		icon: Wallet,
		label: "پرتفولیوها",
		feature: "portfolios",
		admin: false
	},
	{
		to: "/app/trades",
		icon: ChartLine,
		label: "معاملات",
		feature: "trades",
		admin: false
	},
	{
		to: "/app/journal",
		icon: BookOpen,
		label: "ژورنال",
		feature: "journal",
		admin: false
	},
	{
		to: "/app/ai-coach",
		icon: Sparkles,
		label: "مربی هوشمند",
		feature: "ai-coach",
		admin: false
	},
	{
		to: "/app/calendar",
		icon: CalendarDays,
		label: "تقویم معاملاتی",
		feature: "calendar",
		admin: false
	},
	{
		to: "/app/risk",
		icon: ShieldCheck,
		label: "مدیریت ریسک",
		feature: "risk",
		admin: false
	},
	{
		to: "/app/goals",
		icon: Target,
		label: "اهداف",
		feature: "goals",
		admin: false
	},
	{
		to: "/app/achievements",
		icon: Trophy,
		label: "نشان‌ها",
		feature: "achievements",
		admin: false
	},
	{
		to: "/app/news",
		icon: Megaphone,
		label: "اخبار و اطلاعیه‌ها",
		feature: "news",
		admin: false
	},
	{
		to: "/app/support",
		icon: LifeBuoy,
		label: "پشتیبانی",
		feature: "support",
		admin: false
	},
	{
		to: "/app/settings",
		icon: Settings,
		label: "تنظیمات",
		feature: "settings",
		admin: false
	},
	{
		to: "/app/billing",
		icon: CreditCard,
		label: "خرید اشتراک",
		feature: null,
		admin: false
	},
	{
		to: "/app/admin/dashboard",
		icon: LayoutDashboard,
		label: "داشبورد مدیریت",
		feature: null,
		admin: true
	},
	{
		to: "/app/admin/users",
		icon: Users,
		label: "مدیریت کاربران",
		feature: null,
		admin: true
	},
	{
		to: "/app/admin/payments",
		icon: CreditCard,
		label: "پرداخت‌ها",
		feature: null,
		admin: true
	},
	{
		to: "/app/admin/plans",
		icon: TrendingUp,
		label: "مدیریت پلن‌ها",
		feature: null,
		admin: true
	},
	{
		to: "/app/admin/news",
		icon: Megaphone,
		label: "اخبار (مدیریت)",
		feature: null,
		admin: true
	},
	{
		to: "/app/admin/tickets",
		icon: LifeBuoy,
		label: "پشتیبانی (مدیریت)",
		feature: null,
		admin: true
	},
	{
		to: "/app/admin/apis",
		icon: Cpu,
		label: "API هوش مصنوعی",
		feature: null,
		admin: true
	},
	{
		to: "/app/admin/audit",
		icon: ShieldAlert,
		label: "Audit Log",
		feature: null,
		admin: true
	},
	{
		to: "/app/admin/logs",
		icon: Activity,
		label: "لاگ‌ها",
		feature: null,
		admin: true
	}
];
var staticNotifications = [{
	id: "S-1",
	kind: "system",
	title: "نزدیک به سقف ریسک روزانه",
	desc: "به ۸۰٪ ریسک روزانه رسیدی.",
	time: "۵ دقیقه پیش",
	link: "/app/risk",
	read: false
}, {
	id: "S-2",
	kind: "system",
	title: "نشان جدید کسب کردی",
	desc: "«۷ روز پایبند به پلن» فعال شد.",
	time: "دیروز",
	link: "/app/achievements",
	read: false
}];
function notifIcon(kind) {
	if (kind === "news") return Megaphone;
	if (kind === "ticket") return LifeBuoy;
	return TriangleAlert;
}
function UserBlock({ compact = false }) {
	const user = useCurrentUser();
	const profile = useProfile();
	const name = fullName(user);
	const initials = name.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join(".") || "کاربر";
	const subscription = useSubscription();
	const roleData = useRole();
	const roleKey = roleData?.effective ?? "trader";
	const roleName = ROLE_NAMES[roleKey] ?? "تریدر";
	const daysLeft = subscription?.daysLeft ?? 0;
	const totalDays = subscription?.totalDays ?? 1;
	const isAdmin = roleData?.effective === "admin";
	const planName = isAdmin ? null : subscription?.plan ?? "رایگان";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			className: cn("flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2.5 text-right transition-colors hover:bg-sidebar-accent/70", compact && "border-0 bg-transparent p-1.5 hover:bg-sidebar-accent/40"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
					className: "h-9 w-9",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, {
						src: profile?.avatar ?? void 0,
						alt: name,
						className: "object-cover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
						className: "bg-primary/20 text-primary text-xs font-bold",
						children: initials
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "truncate text-sm font-medium",
						children: name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-0.5 flex flex-wrap items-center gap-1",
						children: [
							planName && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: cn("h-4 px-1.5 text-[10px]", subscription ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-secondary/60 text-muted-foreground"),
								children: planName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: cn("h-4 border-accent/40 bg-accent/10 px-1.5 text-[10px] text-accent", isAdmin && "border-primary/40 bg-primary/10 text-primary"),
								children: isAdmin ? "مدیر" : roleName
							}),
							!isAdmin && subscription && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "outline",
								className: "h-4 border-border bg-secondary/60 px-1.5 text-[10px] text-muted-foreground tabular",
								children: [daysLeft, " روز"]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 shrink-0 text-muted-foreground" })
			]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
		align: "start",
		className: "w-56",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuLabel, { children: "حساب کاربری" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-2 py-2",
				children: isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-muted-foreground",
					children: "حساب مدیریتی — بدون محدودیت"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted-foreground",
							children: ["اشتراک ", subscription?.plan ?? "—"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-medium text-primary tabular",
							children: [daysLeft, " روز باقی‌مانده"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full rounded-full bg-primary",
							style: { width: `${Math.round(daysLeft / totalDays * 100)}%` }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-[10px] text-muted-foreground",
						children: subscription ? `پایان: ${subscription.endDate}` : "هنوز اشتراکی فعال نیست"
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/app/billing",
					className: "cursor-pointer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "ml-2 h-4 w-4" }), " خرید / تمدید اشتراک"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/app/settings",
					className: "cursor-pointer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "ml-2 h-4 w-4" }), " تنظیمات پروفایل"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/app/portfolios",
					className: "cursor-pointer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "ml-2 h-4 w-4" }), " پرتفولیوها"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
				className: "cursor-pointer text-destructive focus:text-destructive",
				onSelect: () => {
					localStorage.removeItem("dlea:access");
					localStorage.removeItem("dlea:refresh");
					localStorage.removeItem("dlea:user");
					localStorage.removeItem(ONBOARDING_KEY);
					window.location.href = "/login";
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "ml-2 h-4 w-4" }), " خروج از حساب"]
			})
		]
	})] });
}
function NavList({ onNavigate, collapsed = false }) {
	const location = useLocation();
	const limits = usePlanLimits();
	const roleData = useRole();
	const roleLoaded = roleData !== null;
	const isAdmin = roleData?.effective === "admin";
	const [lockedFeature, setLockedFeature] = (0, import_react.useState)(null);
	const navigate = useNavigate();
	const regularItems = !roleLoaded ? [] : isAdmin ? [] : nav.filter((item) => !item.admin);
	const adminItems = nav.filter((item) => item.admin);
	function isActive(item) {
		return location.pathname === item.to;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-1",
			children: regularItems.map((item) => {
				const active = isActive(item);
				const Icon = item.icon;
				const locked = item.feature !== null && !limits.features.includes(item.feature);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setLockedFeature(item.feature),
					title: collapsed ? item.label : void 0,
					className: cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all", collapsed && "justify-center px-0", "text-sidebar-foreground/40 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground/60"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("h-4 w-4 shrink-0 opacity-50") }),
						!collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate",
							children: item.label
						}),
						!collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "mr-auto h-3 w-3 text-amber-500" })
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: item.to,
					onClick: onNavigate,
					title: collapsed ? item.label : void 0,
					className: cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all", collapsed && "justify-center px-0", active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("h-4 w-4 shrink-0", active && "text-primary") }),
						!collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate",
							children: item.label
						}),
						active && !collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mr-auto h-1.5 w-1.5 rounded-full bg-primary" })
					]
				}) }, item.to);
			})
		}),
		isAdmin && adminItems.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			!collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
				children: "مدیریت"
			}),
			collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-2 mx-3 border-t border-sidebar-border" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1",
				children: adminItems.map((item) => {
					const active = isActive(item);
					const Icon = item.icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							navigate({ to: item.to });
							onNavigate?.();
						},
						title: collapsed ? item.label : void 0,
						className: cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all", collapsed && "justify-center px-0", active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("h-4 w-4 shrink-0", active && "text-primary") }),
							!collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: item.label
							}),
							active && !collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mr-auto h-1.5 w-1.5 rounded-full bg-primary" })
						]
					}) }, item.to);
				})
			})
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog$1, {
			open: lockedFeature !== null,
			onOpenChange: () => setLockedFeature(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
				className: "max-w-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle$1, {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-5 w-5 text-amber-500" }), " این بخش قفل است"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription$1, { children: [
					lockedFeature === "ai-coach" && "مربی هوشمند فقط در پلن Pro و بالاتر فعال است.",
					lockedFeature === "risk" && "مدیریت ریسک فقط در پلن Pro و بالاتر فعال است.",
					lockedFeature === "mt-connection" && "اتصال MetaTrader فقط در پلن Pro و بالاتر فعال است.",
					lockedFeature === "reports" && "گزارش‌های پیشرفته فقط در پلن Pro و بالاتر فعال است.",
					lockedFeature === "psychology" && "تحلیل روانشناسی فقط در پلن Pro Max فعال است.",
					!"ai-coach risk mt-connection reports psychology".includes(lockedFeature ?? "") && `این بخش نیاز به ارتقای پلن دارد.`
				] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "w-full bg-primary text-primary-foreground",
					onClick: () => {
						setLockedFeature(null);
						navigate({ to: "/app/billing" });
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "ml-2 h-4 w-4" }), " ارتقای پلن"]
				})]
			})
		})
	] });
}
var adminStaticNotifications = [
	{
		id: "AS-1",
		kind: "system",
		title: "کاربر جدید ثبت‌نام کرد",
		desc: "یک کاربر جدید به تازگی در سیستم ثبت‌نام کرده است.",
		time: "۱۰ دقیقه پیش",
		link: "/app/admin/users",
		read: false
	},
	{
		id: "AS-2",
		kind: "system",
		title: "اشتراک جدید فعال شد",
		desc: "یک کاربر اشتراک Pro را فعال کرد.",
		time: "۱ ساعت پیش",
		link: "/app/admin/payments",
		read: false
	},
	{
		id: "AS-3",
		kind: "system",
		title: "تیکت پشتیبانی جدید",
		desc: "یک تیکت پشتیبانی جدید نیاز به بررسی دارد.",
		time: "۳ ساعت پیش",
		link: "/app/admin/tickets",
		read: false
	}
];
function NotificationsMenu() {
	const { notifications, markAllRead, markRead } = usePlatform();
	const navigate = useNavigate();
	const isAdminNotif = useRole()?.effective === "admin";
	const all = isAdminNotif ? [...notifications, ...adminStaticNotifications] : [...notifications, ...staticNotifications];
	const unread = all.filter((n) => !n.read).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			size: "icon",
			className: "relative h-10 w-10 border-border bg-secondary/60",
			"aria-label": "اعلان‌ها",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-4 w-4" }), unread > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground",
				children: unread
			})]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
		align: "end",
		className: "w-80",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuLabel, {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAdminNotif ? "اعلان‌های مدیریت" : "اعلان‌ها" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						markAllRead();
						toast.success("همه اعلان‌ها خوانده شد");
					},
					className: "text-[11px] text-primary hover:underline",
					children: "علامت‌گذاری همه"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-h-80 overflow-y-auto",
				children: all.map((n) => {
					const Icon = notifIcon(n.kind);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
						className: "cursor-pointer items-start gap-3 py-2.5",
						onSelect: () => {
							markRead(n.id);
							if (n.link) navigate({ to: n.link });
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", n.kind === "news" && "bg-accent/15 text-accent", n.kind === "ticket" && "bg-primary/15 text-primary", n.kind === "system" && "bg-destructive/15 text-destructive"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate text-sm font-medium",
										children: n.title
									}), !n.read && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 shrink-0 rounded-full bg-primary" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: n.desc
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1 text-[10px] text-muted-foreground/70",
									children: n.time
								})
							]
						})]
					}, n.id);
				})
			})
		]
	})] });
}
/** Global search across pages, trades and journal entries. */
function GlobalSearch() {
	const navigate = useNavigate();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [q, setQ] = (0, import_react.useState)("");
	const trades = useTrades();
	const journalEntries = useJournalEntries();
	const isAdmin = useRole()?.effective === "admin";
	const allUsers = useUsers();
	const adminPages = nav.filter((n) => n.admin);
	const userPages = nav.filter((n) => !n.admin);
	const results = (0, import_react.useMemo)(() => {
		const term = q.trim().toLowerCase();
		if (isAdmin) {
			if (!term) return {
				pages: adminPages,
				trades: [],
				journals: [],
				users: []
			};
			return {
				pages: adminPages.filter((n) => n.label.toLowerCase().includes(term)),
				trades: [],
				journals: [],
				users: allUsers.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(term)).slice(0, 6)
			};
		}
		if (!term) return {
			pages: userPages.slice(0, 5),
			trades: [],
			journals: [],
			users: []
		};
		return {
			pages: userPages.filter((n) => n.label.toLowerCase().includes(term)),
			trades: trades.filter((t) => `${t.symbol} ${t.id} ${t.ticket} ${t.strategy}`.toLowerCase().includes(term)).slice(0, 6),
			journals: journalEntries.filter((j) => `${j.title} ${j.symbol ?? ""}`.toLowerCase().includes(term)).slice(0, 5),
			users: []
		};
	}, [
		q,
		trades,
		journalEntries,
		isAdmin,
		allUsers
	]);
	function go(to) {
		setOpen(false);
		setQ("");
		navigate({ to });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick: () => setOpen(true),
		className: "relative flex h-10 w-full min-w-0 max-w-md items-center rounded-md border border-border bg-secondary/60 pr-9 pl-3 text-right text-sm text-muted-foreground transition-colors hover:border-primary/40",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "truncate",
			children: isAdmin ? "جستجو در بخش‌های مدیریت..." : "جستجو در صفحات، معاملات و ژورنال..."
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog$1, {
		open,
		onOpenChange: setOpen,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
			className: "max-w-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, { children: "جستجوی سریع" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, { children: isAdmin ? "نام بخش مدیریت را بنویس." : "نام صفحه، نماد معامله، شماره تیکت یا عنوان ژورنال را بنویس." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					autoFocus: true,
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "مثلاً EURUSD یا ژورنال",
					className: "mt-2 bg-secondary/60"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 max-h-80 space-y-4 overflow-y-auto",
					children: [
						results.pages.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-1 text-[11px] text-muted-foreground",
							children: "صفحات"
						}), results.pages.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => go(p.to),
							className: "flex w-full items-center gap-2 rounded-md px-2 py-2 text-right text-sm hover:bg-secondary/70",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(p.icon, { className: "h-4 w-4 text-primary" }),
								" ",
								p.label
							]
						}, p.to))] }),
						results.trades.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-1 text-[11px] text-muted-foreground",
							children: "معاملات"
						}), results.trades.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => go(`/app/trades/${t.id}`),
							className: "flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-right text-sm hover:bg-secondary/70",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								t.symbol,
								" • ",
								t.id
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: cn("tabular", t.pnl >= 0 ? "gain" : "loss"),
								children: ["$", t.pnl]
							})]
						}, t.id))] }),
						results.journals.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-1 text-[11px] text-muted-foreground",
							children: "ژورنال‌ها"
						}), results.journals.map((j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => go("/app/journal"),
							className: "flex w-full items-center gap-2 rounded-md px-2 py-2 text-right text-sm hover:bg-secondary/70",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "h-4 w-4 text-primary" }),
								" ",
								j.title
							]
						}, j.id))] }),
						results.users && results.users.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-1 text-[11px] text-muted-foreground",
							children: "کاربران"
						}), results.users.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => go("/app/admin/users"),
							className: "flex w-full items-center gap-2 rounded-md px-2 py-2 text-right text-sm hover:bg-secondary/70",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-4 w-4 text-primary" }),
								" ",
								u.name,
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-muted-foreground",
									children: [
										"(",
										u.email,
										")"
									]
								})
							]
						}, u.id))] }),
						q.trim() && results.pages.length + results.trades.length + results.journals.length + (results.users?.length ?? 0) === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "py-8 text-center text-sm text-muted-foreground",
							children: "نتیجه‌ای پیدا نشد."
						})
					]
				})
			]
		})
	})] });
}
/** Onboarding gate: the first mandatory action is creating a portfolio. */
function PortfolioGate() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid place-items-center py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card-surface max-w-lg p-8 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "h-7 w-7" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-5 text-xl font-bold",
					children: "اول یک پرتفولیو بساز"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm leading-relaxed text-muted-foreground",
					children: "برای شروع کار با ژورنال، ساخت اولین پرتفولیو الزامی است. تا زمانی که پرتفولیو نسازی، بقیه بخش‌ها در دسترس نیستند."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/app/portfolios",
					className: "mt-6 inline-block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "bg-primary text-primary-foreground hover:bg-primary/90",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "ml-1 h-4 w-4" }), " ساخت اولین پرتفولیو"]
					})
				})
			]
		})
	});
}
function AppShell({ children, title, subtitle, actions }) {
	const [mobileOpen, setMobileOpen] = (0, import_react.useState)(false);
	const [collapsed, setCollapsed] = useLocalState("tj:sidebar-collapsed", false);
	const location = useLocation();
	const [hasPortfolio, , onboardingReady] = useHasPortfolio();
	const user = useCurrentUser();
	const profile = useProfile();
	const initials = fullName(user).split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join(".") || "کاربر";
	const roleData2 = useRole();
	const roleLoaded = roleData2 !== null;
	const isAdminUser = roleData2?.effective === "admin";
	const locked = roleLoaded && !isAdminUser && onboardingReady && !hasPortfolio && location.pathname !== "/app/portfolios";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-background text-foreground",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-screen",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: cn("hidden shrink-0 border-l border-sidebar-border bg-sidebar transition-all duration-200 lg:flex lg:flex-col", collapsed ? "w-[74px]" : "w-64"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("flex h-16 items-center gap-2 border-b border-sidebar-border px-5", collapsed && "justify-center px-2"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[var(--shadow-glow)]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartLine, { className: "h-5 w-5" })
						}), !collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col leading-tight",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-bold",
								children: "Dlea AI"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-muted-foreground",
								children: "ژورنال هوشمند معامله‌گران"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("border-b border-sidebar-border p-3", collapsed && "flex justify-center px-2"),
						children: collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
							className: "h-9 w-9",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, {
								src: profile?.avatar ?? void 0,
								alt: "avatar",
								className: "object-cover"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
								className: "bg-primary/20 text-xs font-bold text-primary",
								children: initials
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserBlock, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "flex-1 overflow-y-auto p-3",
						children: [!collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
							children: "منو"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavList, { collapsed })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border-t border-sidebar-border p-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							className: cn("w-full gap-2 border-sidebar-border bg-sidebar-accent/40", collapsed && "px-0"),
							"aria-label": collapsed ? "باز کردن منو" : "جمع کردن منو",
							onClick: () => setCollapsed(!collapsed),
							children: collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelRightOpen, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelRightClose, { className: "h-4 w-4" }), " جمع کردن منو"] })
						})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-1 flex-col overflow-x-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
							open: mobileOpen,
							onOpenChange: setMobileOpen,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "icon",
									className: "h-10 w-10 border-border bg-secondary/60 lg:hidden",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "h-4 w-4" })
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
								side: "right",
								className: "w-72 border-l border-sidebar-border bg-sidebar p-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
										className: "sr-only",
										children: "منوی اصلی"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex h-16 items-center gap-2 border-b border-sidebar-border px-5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[var(--shadow-glow)]",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartLine, { className: "h-5 w-5" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col leading-tight",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm font-bold",
												children: "Dlea AI"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-muted-foreground",
												children: "ژورنال هوشمند معامله‌گران"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "border-b border-sidebar-border p-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserBlock, {})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
										className: "flex-1 overflow-y-auto p-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
											children: "منو"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavList, { onNavigate: () => setMobileOpen(false) })]
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "min-w-0 max-w-md flex-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlobalSearch, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex shrink-0 items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GuideTour, {
										path: location.pathname,
										locked
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotificationsMenu, {}),
									roleLoaded && !isAdminUser && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/app/trades/new",
										className: "hidden sm:block",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											className: "h-10 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), "معامله جدید"]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/app/trades/new",
										className: "sm:hidden",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "icon",
											className: "h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" })
										})
									})] })
								]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border-b border-border bg-background/40 px-4 py-6 md:px-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "truncate text-2xl font-bold tracking-tight",
									children: locked ? "شروع کار" : title
								}), subtitle && !locked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: subtitle
								})]
							}), actions && !locked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "shrink-0",
								children: actions
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
						className: "flex-1 p-4 md:p-8",
						children: locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortfolioGate, {}) : children
					})
				]
			})]
		})
	});
}
//#endregion
export { AvatarImage as i, Avatar as n, AvatarFallback as r, AppShell as t };
