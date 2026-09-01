import { i as __toESM, n as __exportAll$1 } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { S as useRouter, _ as createFileRoute, g as lazyRouteComponent, h as Outlet, l as Scripts, m as createRouter, u as HeadContent, v as createRootRouteWithContext, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { D as fetchTickets, M as post, S as fetchNotifications, T as fetchPortfolios, U as useApi, c as del, g as fetchAudit, j as patch, x as fetchNews } from "./api-CQV86vH5.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-DPngkkDa.js
var router_DPngkkDa_exports = /* @__PURE__ */ __exportAll$1({
	a: () => ONBOARDING_KEY,
	c: () => useHasPortfolio,
	getRouter: () => getRouter,
	i: () => usePlatform,
	l: () => useLocalState,
	n: () => categoryClass,
	o: () => fullName,
	r: () => topics,
	s: () => useCurrentUser,
	t: () => router_exports
});
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var styles_default = "/assets/styles-AvtHHNQE.css";
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
/** Small localStorage-backed state helper (SSR safe). */
function useLocalState(key, initial) {
	const [value, setValue] = (0, import_react.useState)(initial);
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		try {
			const raw = window.localStorage.getItem(key);
			if (raw !== null) setValue(JSON.parse(raw));
		} catch {}
		setReady(true);
	}, [key]);
	return [
		value,
		(0, import_react.useCallback)((next) => {
			setValue((prev) => {
				const resolved = typeof next === "function" ? next(prev) : next;
				try {
					window.localStorage.setItem(key, JSON.stringify(resolved));
				} catch {}
				return resolved;
			});
		}, [key]),
		ready
	];
}
function getCurrentUser() {
	try {
		const raw = window.localStorage.getItem("dlea:user");
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}
function useCurrentUser() {
	const [user, setUser] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setUser(getCurrentUser());
	}, []);
	return user;
}
function fullName(user) {
	if (!user) return "کاربر";
	return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || "کاربر";
}
var ONBOARDING_KEY = "tj:has-portfolio:v2";
/** Onboarding gate: a trader must create a portfolio before anything else. */
function useHasPortfolio() {
	const [manual, setManual, lsReady] = useLocalState(ONBOARDING_KEY, false);
	const { data, loading } = useApi(fetchPortfolios, []);
	return [
		manual || (data?.length ?? 0) > 0,
		setManual,
		lsReady && !loading
	];
}
var PlatformContext = (0, import_react.createContext)(null);
var fa = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
function nowStamp() {
	const d = /* @__PURE__ */ new Date();
	return `${fa(d.getFullYear())}/${fa(d.getMonth() + 1).padStart(2, "۰")}/${fa(d.getDate())} ${fa(d.getHours())}:${String(fa(d.getMinutes())).padStart(2, "۰")}`;
}
function isoDate() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function PlatformProvider({ children }) {
	const [news, setNews] = (0, import_react.useState)([]);
	const [tickets, setTickets] = (0, import_react.useState)([]);
	const [notifications, setNotifications] = (0, import_react.useState)([]);
	const [audit, setAudit] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		let alive = true;
		Promise.all([
			fetchNews(),
			fetchTickets(),
			fetchNotifications(),
			fetchAudit()
		]).then(([n, t, notif, a]) => {
			if (!alive) return;
			setNews(n);
			setTickets(t);
			setNotifications(notif);
			setAudit(a);
		}).catch(() => {});
		return () => {
			alive = false;
		};
	}, []);
	const pushNotification = (0, import_react.useCallback)((n) => {
		const item = {
			id: `AN-${Date.now()}`,
			read: false,
			time: n.time ?? nowStamp(),
			...n
		};
		setNotifications((list) => [item, ...list]);
		post("notifications/", {
			kind: item.kind,
			title: item.title,
			desc: item.desc,
			time: isoDate(),
			link: item.link ?? "",
			read: false
		}).catch(() => {});
	}, []);
	const logAudit = (0, import_react.useCallback)((entry) => {
		setAudit((list) => [{
			id: `A-${Date.now()}`,
			time: nowStamp(),
			...entry
		}, ...list]);
		post("audit/", entry).catch(() => {});
	}, []);
	const value = (0, import_react.useMemo)(() => ({
		news,
		tickets,
		notifications,
		audit,
		saveNews: (item) => {
			setNews((list) => list.some((n) => n.id === item.id) ? list.map((n) => n.id === item.id ? item : n) : [item, ...list]);
			post("news/", {
				title: item.title,
				summary: item.summary,
				body: item.body,
				category: item.category,
				date: isoDate(),
				pinned: item.pinned
			}).catch(() => {});
		},
		deleteNews: (id) => {
			setNews((list) => list.filter((n) => n.id !== id));
			del(`news/${id}/`).catch(() => {});
		},
		createTicket: ({ subject, topic, body, attachments }) => {
			const id = `TK-${Math.floor(1e3 + Math.random() * 9e3)}`;
			const stamp = nowStamp();
			const current = getCurrentUser();
			const authorName = fullName(current);
			const ticket = {
				id,
				subject,
				topic,
				status: "باز",
				user: authorName,
				email: current?.email ?? "",
				createdAt: stamp,
				updatedAt: stamp,
				messages: [{
					id: `M-${Date.now()}`,
					author: "user",
					authorName,
					body,
					time: stamp,
					attachments
				}]
			};
			setTickets((list) => [ticket, ...list]);
			post("tickets/", {
				subject,
				topic,
				status: "باز",
				user: ticket.user,
				email: ticket.email
			}).then((created) => {
				if (created?.id) post(`tickets/${created.id}/reply/`, {
					author: "user",
					body,
					attachments
				}).catch(() => {});
			}).catch(() => {});
			return id;
		},
		replyTicket: (id, { author, body, attachments }) => {
			const stamp = nowStamp();
			setTickets((list) => list.map((t) => t.id === id ? {
				...t,
				updatedAt: stamp,
				status: author === "admin" ? "پاسخ داده شد" : t.status === "بسته" ? "باز" : t.status,
				messages: [...t.messages, {
					id: `M-${Date.now()}`,
					author,
					authorName: author === "admin" ? "پشتیبانی" : fullName(getCurrentUser()),
					body,
					time: stamp,
					attachments
				}]
			} : t));
			post(`tickets/${id}/reply/`, {
				author,
				body,
				attachments
			}).catch(() => {});
			if (author === "admin") pushNotification({
				kind: "ticket",
				title: `پاسخ جدید برای تیکت ${id}`,
				desc: body.slice(0, 70),
				link: "/app/support"
			});
		},
		setTicketStatus: (id, status) => {
			setTickets((list) => list.map((t) => t.id === id ? {
				...t,
				status,
				updatedAt: nowStamp()
			} : t));
			post(`tickets/${id}/set_status/`, { status }).catch(() => {});
		},
		markAllRead: () => {
			setNotifications((list) => list.map((n) => ({
				...n,
				read: true
			})));
			post("notifications/read_all/").catch(() => {});
		},
		markRead: (id) => {
			setNotifications((list) => list.map((n) => n.id === id ? {
				...n,
				read: true
			} : n));
			patch(`notifications/${id}/`, { read: true }).catch(() => {});
		},
		pushNotification,
		logAudit
	}), [
		news,
		tickets,
		notifications,
		audit,
		pushNotification,
		logAudit
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlatformContext.Provider, {
		value,
		children
	});
}
function usePlatform() {
	const ctx = (0, import_react.useContext)(PlatformContext);
	if (!ctx) throw new Error("usePlatform must be used inside PlatformProvider");
	return ctx;
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "dark flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "۴۰۴"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "صفحه پیدا نشد"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "صفحه‌ای که دنبال آن هستید وجود ندارد یا جابه‌جا شده است."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "بازگشت به خانه"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "dark flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "این صفحه بارگذاری نشد"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "مشکلی پیش آمد. می‌توانید دوباره تلاش کنید یا به صفحه اصلی بازگردید."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "تلاش دوباره"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
						children: "بازگشت به خانه"
					})]
				})
			]
		})
	});
}
var Route$34 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Dlea AI — ژورنال هوشمند معامله‌گران" },
			{
				name: "description",
				content: "پلتفرم حرفه‌ای ژورنال‌نویسی معامله‌گران بازارهای مالی با تحلیل هوش مصنوعی، مدیریت ریسک و اتصال مستقیم به متاتریدر."
			},
			{
				property: "og:title",
				content: "Dlea AI — ژورنال هوشمند معامله‌گران"
			},
			{
				property: "og:description",
				content: "ژورنال‌نویسی، تحلیل عملکرد و مربی هوشمند معامله‌گری در یک پلتفرم."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.png",
				type: "image/png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "fa",
		dir: "rtl",
		className: "dark",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-background text-foreground antialiased",
			children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})]
		})]
	});
}
function RootComponent() {
	const { queryClient } = Route$34.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PlatformProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
			position: "top-center",
			richColors: true
		})] })
	});
}
var $$splitComponentImporter$33 = () => import("./routes-4ndxdKlt.mjs");
var Route$33 = createFileRoute("/")({
	head: () => ({ meta: [{ title: "Dlea AI — ژورنال هوشمند معامله‌گران بازارهای مالی" }, {
		name: "description",
		content: "ثبت معاملات، تحلیل روانشناسی، مدیریت ریسک و مربی هوشمند برای معامله‌گران فارکس، کریپتو و شاخص‌ها."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$33, "component")
});
var $$splitComponentImporter$32 = () => import("./app-DpnSEiVG.mjs");
var Route$32 = createFileRoute("/app")({ component: lazyRouteComponent($$splitComponentImporter$32, "component") });
var $$splitComponentImporter$31 = () => import("./contact-DuhAYBQ0.mjs");
var Route$31 = createFileRoute("/contact")({
	head: () => ({ meta: [
		{ title: "تماس با ما | Dlea AI" },
		{
			name: "description",
			content: "ارتباط با تیم پشتیبانی Dlea AI برای سوالات فنی، اشتراک و همکاری با مربیان معاملاتی."
		},
		{
			property: "og:title",
			content: "تماس با ما"
		},
		{
			property: "og:description",
			content: "سوال، پیشنهاد یا مشکل فنی داری؟ با تیم Dlea AI در تماس باش."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$31, "component")
});
var $$splitComponentImporter$30 = () => import("./forgot-password-2tSWNkh1.mjs");
var Route$30 = createFileRoute("/forgot-password")({
	head: () => ({ meta: [{ title: "بازیابی رمز عبور — Dlea AI" }] }),
	component: lazyRouteComponent($$splitComponentImporter$30, "component")
});
var $$splitComponentImporter$29 = () => import("./login-BSutX9tf.mjs");
var Route$29 = createFileRoute("/login")({
	head: () => ({ meta: [{ title: "ورود — Dlea AI" }] }),
	component: lazyRouteComponent($$splitComponentImporter$29, "component")
});
var $$splitComponentImporter$28 = () => import("./privacy-BvzEeQA8.mjs");
var Route$28 = createFileRoute("/privacy")({
	head: () => ({ meta: [
		{ title: "حریم خصوصی | Dlea AI" },
		{
			name: "description",
			content: "سیاست حریم خصوصی Dlea AI: چه داده‌هایی جمع‌آوری می‌شود، چگونه نگهداری می‌شود و حقوق شما نسبت به داده‌ها."
		},
		{
			property: "og:title",
			content: "سیاست حریم خصوصی"
		},
		{
			property: "og:description",
			content: "نحوه جمع‌آوری، نگهداری و حذف داده‌های کاربران در Dlea AI."
		},
		{
			property: "og:type",
			content: "article"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$28, "component")
});
var $$splitComponentImporter$27 = () => import("./signup-DImp9Fy-.mjs");
var Route$27 = createFileRoute("/signup")({
	head: () => ({ meta: [{ title: "ثبت‌نام — Dlea AI" }] }),
	component: lazyRouteComponent($$splitComponentImporter$27, "component")
});
var $$splitComponentImporter$26 = () => import("./terms-BOwFKyae.mjs");
var Route$26 = createFileRoute("/terms")({
	head: () => ({ meta: [
		{ title: "قوانین و شرایط استفاده | Dlea AI" },
		{
			name: "description",
			content: "شرایط استفاده از پلتفرم ژورنال معاملاتی Dlea AI شامل حساب کاربری، اشتراک، بازپرداخت و مسئولیت‌ها."
		},
		{
			property: "og:title",
			content: "قوانین و شرایط استفاده"
		},
		{
			property: "og:description",
			content: "شرایط استفاده، اشتراک و مسئولیت‌های کاربران Dlea AI."
		},
		{
			property: "og:type",
			content: "article"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$26, "component")
});
var $$splitComponentImporter$25 = () => import("./app.achievements-Cjpa-Kz5.mjs");
var Route$25 = createFileRoute("/app/achievements")({
	head: () => ({ meta: [{ title: "نشان‌ها" }] }),
	component: lazyRouteComponent($$splitComponentImporter$25, "component")
});
/** Each achievement gets its own icon + color scheme for visual variety */
var $$splitComponentImporter$24 = () => import("./app.admin-B7usAHOR.mjs");
var Route$24 = createFileRoute("/app/admin")({
	head: () => ({ meta: [{ title: "پنل مدیریت" }] }),
	component: lazyRouteComponent($$splitComponentImporter$24, "component")
});
/** Pages that should show the stats row */
/** Stats cards shown across all admin sub-pages */
var $$splitComponentImporter$23 = () => import("./app.ai-coach-B8ctmx7z.mjs");
var Route$23 = createFileRoute("/app/ai-coach")({
	head: () => ({ meta: [
		{ title: "مربی هوشمند | Dlea AI" },
		{
			name: "description",
			content: "گزارش کامل مربی هوش مصنوعی با تمرکز بر نقاط ضعف و راهکار رفع آن‌ها، قابل جابه‌جایی بین روزها، هفته‌ها، ماه‌ها و سال‌های گذشته."
		},
		{
			property: "og:title",
			content: "مربی هوشمند Dlea AI"
		},
		{
			property: "og:description",
			content: "تحلیل رفتار معامله‌گری و برنامه عملی رفع ضعف‌ها."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$23, "component")
});
var $$splitComponentImporter$22 = () => import("./app.billing-DTz5hmtE.mjs");
var Route$22 = createFileRoute("/app/billing")({
	head: () => ({ meta: [
		{ title: "خرید و تمدید اشتراک | Dlea AI" },
		{
			name: "description",
			content: "وضعیت اشتراک، روزهای باقی‌مانده و خرید یا تمدید پلن‌های Pro و Pro Max ژورنال معاملاتی."
		},
		{
			property: "og:title",
			content: "خرید اشتراک"
		},
		{
			property: "og:description",
			content: "پلن مناسب خود را انتخاب و اشتراک را تمدید کنید."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$22, "component")
});
var $$splitComponentImporter$21 = () => import("./app.calendar-C5LaMcFR.mjs");
var Route$21 = createFileRoute("/app/calendar")({
	head: () => ({ meta: [{ title: "تقویم معاملاتی" }] }),
	component: lazyRouteComponent($$splitComponentImporter$21, "component")
});
var $$splitComponentImporter$20 = () => import("./app.dashboard-uNx8kotH.mjs");
var Route$20 = createFileRoute("/app/dashboard")({
	head: () => ({ meta: [{ title: "داشبورد — Dlea AI" }] }),
	component: lazyRouteComponent($$splitComponentImporter$20, "component")
});
var $$splitComponentImporter$19 = () => import("./app.goals-BgQqz3Gd.mjs");
var Route$19 = createFileRoute("/app/goals")({
	head: () => ({ meta: [{ title: "اهداف معاملاتی" }] }),
	component: lazyRouteComponent($$splitComponentImporter$19, "component")
});
var $$splitComponentImporter$18 = () => import("./app.journal-6uohM3no.mjs");
var Route$18 = createFileRoute("/app/journal")({
	head: () => ({ meta: [
		{ title: "ژورنال معاملاتی | Dlea AI" },
		{
			name: "description",
			content: "ثبت، ویرایش، گروه‌بندی و فیلتر ژورنال‌های معاملاتی همراه با اسکرین‌شات و ویرایشگر پیشرفته."
		},
		{
			property: "og:title",
			content: "ژورنال معاملاتی"
		},
		{
			property: "og:description",
			content: "ژورنال‌های خود را با ویرایشگر پیشرفته بنویسید، گروه‌بندی و فیلتر کنید."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$18, "component")
});
var $$splitComponentImporter$17 = () => import("./app.portfolios-badxG5od.mjs");
var Route$17 = createFileRoute("/app/portfolios")({
	head: () => ({ meta: [{ title: "پرتفولیوها" }] }),
	component: lazyRouteComponent($$splitComponentImporter$17, "component")
});
var $$splitComponentImporter$16 = () => import("./app.risk-Ckzrj1_E.mjs");
var Route$16 = createFileRoute("/app/risk")({
	head: () => ({ meta: [{ title: "مدیریت ریسک" }] }),
	component: lazyRouteComponent($$splitComponentImporter$16, "component")
});
var $$splitComponentImporter$15 = () => import("./app.settings-hrfERzza.mjs");
var Route$15 = createFileRoute("/app/settings")({
	head: () => ({ meta: [{ title: "تنظیمات" }] }),
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
var $$splitComponentImporter$14 = () => import("./app.support-BNT839rm.mjs");
var Route$14 = createFileRoute("/app/support")({
	head: () => ({ meta: [
		{ title: "پشتیبانی و تیکت‌ها | Dlea AI" },
		{
			name: "description",
			content: "ارسال تیکت پشتیبانی فنی، پرداخت و اشتراک و پیگیری تاریخچه گفتگو با تیم پشتیبانی."
		},
		{
			property: "og:title",
			content: "پشتیبانی و تیکت‌ها"
		},
		{
			property: "og:description",
			content: "ثبت تیکت جدید و پیگیری پاسخ تیم پشتیبانی."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
var topics = [
	"فنی",
	"پرداخت",
	"حساب کاربری",
	"اشتراک",
	"سایر"
];
var $$splitComponentImporter$13 = () => import("./app.admin.apis-BWcyQpX9.mjs");
var Route$13 = createFileRoute("/app/admin/apis")({ component: lazyRouteComponent($$splitComponentImporter$13, "component") });
var $$splitComponentImporter$12 = () => import("./app.admin.audit-DBjh-U1I.mjs");
var Route$12 = createFileRoute("/app/admin/audit")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
var $$splitComponentImporter$11 = () => import("./app.admin.dashboard-CGBs_SXF.mjs");
var Route$11 = createFileRoute("/app/admin/dashboard")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./app.admin.logs-DEtov2hX.mjs");
var Route$10 = createFileRoute("/app/admin/logs")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./app.admin.news-C58Tr3l3.mjs");
var Route$9 = createFileRoute("/app/admin/news")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./app.admin.payments--Uaj5EJA.mjs");
var Route$8 = createFileRoute("/app/admin/payments")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./app.admin.plans-DgRsUpuG.mjs");
var Route$7 = createFileRoute("/app/admin/plans")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./app.admin.tickets-S1R4dBzL.mjs");
var Route$6 = createFileRoute("/app/admin/tickets")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./app.admin.users-Kl8-8er-.mjs");
var Route$5 = createFileRoute("/app/admin/users")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./app.news.index-BDSg7Y-_.mjs");
var Route$4 = createFileRoute("/app/news/")({
	head: () => ({ meta: [
		{ title: "اخبار و اطلاعیه‌ها | Dlea AI" },
		{
			name: "description",
			content: "آخرین اخبار، تخفیف‌ها، آپدیت‌های پلتفرم و اطلاعیه‌های تیم Dlea AI."
		},
		{
			property: "og:title",
			content: "اخبار و اطلاعیه‌ها"
		},
		{
			property: "og:description",
			content: "تخفیف‌ها، آپدیت‌ها و اطلاعیه‌های پلتفرم ژورنال معاملاتی."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
function categoryClass(cat) {
	if (cat === "تخفیف") return "border-accent/40 bg-accent/10 text-accent";
	if (cat === "آپدیت") return "border-primary/40 bg-primary/10 text-primary";
	return "border-border bg-secondary/60 text-muted-foreground";
}
var $$splitComponentImporter$3 = () => import("./app.news._id-CN2YYkDL.mjs");
var Route$3 = createFileRoute("/app/news/$id")({
	head: () => ({ meta: [
		{ title: "جزئیات خبر | Dlea AI" },
		{
			name: "description",
			content: "متن کامل خبر، اطلاعیه یا آپدیت منتشرشده در پلتفرم ژورنال معاملاتی."
		},
		{
			property: "og:title",
			content: "جزئیات خبر"
		},
		{
			property: "og:description",
			content: "متن کامل اطلاعیه پلتفرم."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./app.trades.index-CE3Zd-Zc.mjs");
var Route$2 = createFileRoute("/app/trades/")({
	head: () => ({ meta: [{ title: "معاملات" }] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
/** Screenshot count for a trade (stored per-trade in localStorage). */
var $$splitComponentImporter$1 = () => import("./app.trades._id-KLI6kltj.mjs");
var Route$1 = createFileRoute("/app/trades/$id")({
	head: () => ({ meta: [
		{ title: "جزئیات معامله | Dlea AI" },
		{
			name: "description",
			content: "مشاهده کامل جزئیات معامله فارکس همراه با اسکرین‌شات‌های چارت، سود/زیان، پیپ و R:R."
		},
		{
			property: "og:title",
			content: "جزئیات معامله"
		},
		{
			property: "og:description",
			content: "جزئیات کامل معامله و مدیریت اسکرین‌شات‌های چارت."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./app.trades.new-y_4vgkPU.mjs");
var Route = createFileRoute("/app/trades/new")({
	head: () => ({ meta: [
		{ title: "افزودن معامله — ایمپورت یا اتصال متاتریدر" },
		{
			name: "description",
			content: "معاملات را از فایل گزارش متاتریدر ایمپورت کن یا حساب MT4/MT5 را متصل کن تا معاملات خودکار جمع‌آوری شوند."
		},
		{
			property: "og:title",
			content: "افزودن معامله"
		},
		{
			property: "og:description",
			content: "ایمپورت گزارش متاتریدر یا اتصال خودکار حساب معاملاتی."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
/** Extracts closed-deal rows from a MetaTrader CSV or HTML statement. */
var IndexRoute = Route$33.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$34
});
var AppRoute = Route$32.update({
	id: "/app",
	path: "/app",
	getParentRoute: () => Route$34
});
var ContactRoute = Route$31.update({
	id: "/contact",
	path: "/contact",
	getParentRoute: () => Route$34
});
var ForgotPasswordRoute = Route$30.update({
	id: "/forgot-password",
	path: "/forgot-password",
	getParentRoute: () => Route$34
});
var LoginRoute = Route$29.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$34
});
var PrivacyRoute = Route$28.update({
	id: "/privacy",
	path: "/privacy",
	getParentRoute: () => Route$34
});
var SignupRoute = Route$27.update({
	id: "/signup",
	path: "/signup",
	getParentRoute: () => Route$34
});
var TermsRoute = Route$26.update({
	id: "/terms",
	path: "/terms",
	getParentRoute: () => Route$34
});
var AppAchievementsRoute = Route$25.update({
	id: "/achievements",
	path: "/achievements",
	getParentRoute: () => AppRoute
});
var AppAdminRoute = Route$24.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => AppRoute
});
var AppAiCoachRoute = Route$23.update({
	id: "/ai-coach",
	path: "/ai-coach",
	getParentRoute: () => AppRoute
});
var AppBillingRoute = Route$22.update({
	id: "/billing",
	path: "/billing",
	getParentRoute: () => AppRoute
});
var AppCalendarRoute = Route$21.update({
	id: "/calendar",
	path: "/calendar",
	getParentRoute: () => AppRoute
});
var AppDashboardRoute = Route$20.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => AppRoute
});
var AppGoalsRoute = Route$19.update({
	id: "/goals",
	path: "/goals",
	getParentRoute: () => AppRoute
});
var AppJournalRoute = Route$18.update({
	id: "/journal",
	path: "/journal",
	getParentRoute: () => AppRoute
});
var AppPortfoliosRoute = Route$17.update({
	id: "/portfolios",
	path: "/portfolios",
	getParentRoute: () => AppRoute
});
var AppRiskRoute = Route$16.update({
	id: "/risk",
	path: "/risk",
	getParentRoute: () => AppRoute
});
var AppSettingsRoute = Route$15.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => AppRoute
});
var AppSupportRoute = Route$14.update({
	id: "/support",
	path: "/support",
	getParentRoute: () => AppRoute
});
var AppAdminApisRoute = Route$13.update({
	id: "/apis",
	path: "/apis",
	getParentRoute: () => AppAdminRoute
});
var AppAdminAuditRoute = Route$12.update({
	id: "/audit",
	path: "/audit",
	getParentRoute: () => AppAdminRoute
});
var AppAdminDashboardRoute = Route$11.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => AppAdminRoute
});
var AppAdminLogsRoute = Route$10.update({
	id: "/logs",
	path: "/logs",
	getParentRoute: () => AppAdminRoute
});
var AppAdminNewsRoute = Route$9.update({
	id: "/news",
	path: "/news",
	getParentRoute: () => AppAdminRoute
});
var AppAdminPaymentsRoute = Route$8.update({
	id: "/payments",
	path: "/payments",
	getParentRoute: () => AppAdminRoute
});
var AppAdminPlansRoute = Route$7.update({
	id: "/plans",
	path: "/plans",
	getParentRoute: () => AppAdminRoute
});
var AppAdminTicketsRoute = Route$6.update({
	id: "/tickets",
	path: "/tickets",
	getParentRoute: () => AppAdminRoute
});
var AppAdminUsersRoute = Route$5.update({
	id: "/users",
	path: "/users",
	getParentRoute: () => AppAdminRoute
});
var AppNewsIndexRoute = Route$4.update({
	id: "/news/",
	path: "/news/",
	getParentRoute: () => AppRoute
});
var AppNewsIdRoute = Route$3.update({
	id: "/news/$id",
	path: "/news/$id",
	getParentRoute: () => AppRoute
});
var AppTradesIndexRoute = Route$2.update({
	id: "/trades/",
	path: "/trades/",
	getParentRoute: () => AppRoute
});
var AppTradesIdRoute = Route$1.update({
	id: "/trades/$id",
	path: "/trades/$id",
	getParentRoute: () => AppRoute
});
var AppTradesNewRoute = Route.update({
	id: "/trades/new",
	path: "/trades/new",
	getParentRoute: () => AppRoute
});
var AppAdminRouteChildren = {
	AppAdminApisRoute,
	AppAdminAuditRoute,
	AppAdminDashboardRoute,
	AppAdminLogsRoute,
	AppAdminNewsRoute,
	AppAdminPaymentsRoute,
	AppAdminPlansRoute,
	AppAdminTicketsRoute,
	AppAdminUsersRoute
};
var AppRouteChildren = {
	AppAchievementsRoute,
	AppAdminRoute: AppAdminRoute._addFileChildren(AppAdminRouteChildren),
	AppAiCoachRoute,
	AppBillingRoute,
	AppCalendarRoute,
	AppDashboardRoute,
	AppGoalsRoute,
	AppJournalRoute,
	AppPortfoliosRoute,
	AppRiskRoute,
	AppSettingsRoute,
	AppSupportRoute,
	AppNewsIdRoute,
	AppTradesIdRoute,
	AppTradesNewRoute,
	AppNewsIndexRoute,
	AppTradesIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AppRoute: AppRoute._addFileChildren(AppRouteChildren),
	ContactRoute,
	ForgotPasswordRoute,
	LoginRoute,
	PrivacyRoute,
	SignupRoute,
	TermsRoute
};
var routeTree = Route$34._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var getRouter = () => {
	const queryClient = new QueryClient({ defaultOptions: { queries: {
		staleTime: 6e4,
		gcTime: 3e5,
		refetchOnWindowFocus: false,
		refetchOnMount: false
	} } });
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 3e4,
		defaultGcTime: 3e5,
		defaultStaleTime: 3e4
	});
};
//#endregion
export { topics as a, useLocalState as c, router_DPngkkDa_exports as i, usePlatform as l, categoryClass as n, useCurrentUser as o, fullName as r, useHasPortfolio as s, ONBOARDING_KEY as t };
