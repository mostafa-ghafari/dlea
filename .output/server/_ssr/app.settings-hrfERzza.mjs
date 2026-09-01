import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { A as get, E as fetchProfile, J as usePortfolios, M as post, R as updateProfile, Z as useSubscription } from "./api-CQV86vH5.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { o as useCurrentUser, r as fullName } from "./router-DPngkkDa.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { Et as CircleCheck, Pt as Camera, Vt as Bell, Z as Link2, a as User, bt as Copy, gt as Download, jt as Check, q as LoaderCircle, vt as CreditCard } from "../_libs/lucide-react.mjs";
import { i as AvatarImage, n as Avatar, r as AvatarFallback, t as AppShell } from "./AppShell-Cx40ixlT.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BXfiFzvV.mjs";
import { t as Label } from "./label-AutfcB-T.mjs";
import { t as Switch } from "./switch-Cp8Exbjp.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-DO3DZj4v.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.settings-hrfERzza.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const user = useCurrentUser();
	const subscription = useSubscription();
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [firstName, setFirstName] = (0, import_react.useState)(user?.firstName ?? "");
	const [lastName, setLastName] = (0, import_react.useState)(user?.lastName ?? "");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [avatarUrl, setAvatarUrl] = (0, import_react.useState)(null);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const fileRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		fetchProfile().then((p) => {
			setProfile(p);
			setFirstName(p.firstName);
			setLastName(p.lastName);
			setPhone(p.phone);
			setAvatarUrl(p.avatar);
		}).catch(() => {});
	}, []);
	const name = fullName(user);
	const initials = name.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join(".") || "کاربر";
	async function handleSave() {
		setSaving(true);
		try {
			const updated = await updateProfile({
				firstName,
				lastName,
				phone
			});
			setProfile(updated);
			const stored = user ? {
				...user,
				firstName,
				lastName
			} : null;
			if (stored) localStorage.setItem("dlea:user", JSON.stringify(stored));
			toast.success("پروفایل ذخیره شد");
		} catch (e) {
			toast.error(String(e instanceof Error ? e.message : "خطا در ذخیره"));
		}
		setSaving(false);
	}
	async function handleAvatarUpload(file) {
		setUploading(true);
		try {
			const updated = await updateProfile({ avatarFile: file });
			setAvatarUrl(updated.avatar);
			toast.success("عکس پروفایل آپلود شد");
		} catch (e) {
			toast.error(String(e instanceof Error ? e.message : "خطا در آپلود عکس"));
		}
		setUploading(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "تنظیمات",
		subtitle: "مدیریت حساب، اشتراک و اتصالات",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "profile",
			dir: "rtl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
						value: "profile",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "ml-1 h-4 w-4" }), "پروفایل"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
						value: "subscription",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "ml-1 h-4 w-4" }), "اشتراک"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
						value: "mt",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "ml-1 h-4 w-4" }), "متاتریدر"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
						value: "notifications",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "ml-1 h-4 w-4" }), "اعلان‌ها"]
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "profile",
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-surface p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
											className: "h-16 w-16",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, {
												src: avatarUrl ?? void 0,
												alt: name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
												className: "bg-primary/20 text-lg font-bold text-primary",
												children: initials
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											ref: fileRef,
											type: "file",
											accept: "image/*",
											className: "hidden",
											onChange: (e) => {
												const file = e.target.files?.[0];
												if (file) handleAvatarUpload(file);
											}
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-semibold",
										children: name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-sm text-muted-foreground",
										children: user?.email ?? ""
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										className: "mr-auto",
										disabled: uploading,
										onClick: () => fileRef.current?.click(),
										children: [uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "ml-1 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "ml-1 h-4 w-4" }), uploading ? "در حال آپلود..." : "تغییر عکس"]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 grid gap-4 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نام" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: firstName,
											onChange: (e) => setFirstName(e.target.value),
											className: "bg-secondary/60"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نام خانوادگی" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: lastName,
											onChange: (e) => setLastName(e.target.value),
											className: "bg-secondary/60"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "ایمیل" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											defaultValue: user?.email ?? "",
											className: "bg-secondary/60",
											disabled: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "موبایل" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: phone,
											onChange: (e) => setPhone(e.target.value),
											placeholder: "شماره موبایل",
											className: "bg-secondary/60 tabular",
											dir: "ltr"
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: handleSave,
									disabled: saving,
									className: "bg-primary text-primary-foreground hover:bg-primary/90",
									children: [saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "ml-1 h-4 w-4 animate-spin" }) : null, "ذخیره تغییرات"]
								})
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "subscription",
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 lg:grid-cols-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "card-surface p-6 lg:col-span-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-sm text-muted-foreground",
										children: "اشتراک فعلی"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 text-2xl font-bold",
										children: subscription?.plan ?? "رایگان"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										className: subscription ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
										children: subscription ? "فعال" : "بدون اشتراک"
									})]
								}),
								subscription && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-6 grid gap-4 sm:grid-cols-3 text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-muted-foreground",
											children: "شروع"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-1 tabular",
											children: subscription.startDate
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-muted-foreground",
											children: "پایان"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-1 tabular",
											children: subscription.endDate
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-muted-foreground",
											children: "مبلغ ماهانه"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-1 tabular",
											children: subscription.price
										})] })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-6 flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/app/billing",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											className: "bg-primary text-primary-foreground hover:bg-primary/90",
											children: "خرید / تمدید اشتراک"
										})
									}), subscription && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										children: "مشاهده فاکتورها"
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "card-surface p-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-semibold",
									children: "کد تخفیف"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "کد را وارد کنید",
										className: "bg-secondary/60"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										children: "اعمال"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 rounded-lg bg-primary/10 p-3 text-sm text-primary",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "ml-1 inline h-4 w-4" }), "پرداخت از طریق زرین‌پال"]
								})
							]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "mt",
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetaTraderTab, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "notifications",
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "card-surface space-y-4 p-6",
						children: [
							{
								t: "یادآوری ثبت ژورنال",
								d: "شب‌ها اگر ژورنال ثبت نشده باشد یادآوری کن."
							},
							{
								t: "هشدار نزدیک شدن به سقف ریسک",
								d: "وقتی ۸۰٪ ضرر روزانه رخ داد."
							},
							{
								t: "گزارش هفتگی AI",
								d: "خلاصه عملکرد هفتگی به ایمیل ارسال شود."
							},
							{
								t: "رفتار غیرعادی معاملاتی",
								d: "شناسایی FOMO یا Revenge Trading."
							}
						].map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between rounded-lg bg-secondary/40 p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-medium",
								children: n.t
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-muted-foreground",
								children: n.d
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, { defaultChecked: i < 3 })]
						}, i))
					})
				})
			]
		})
	});
}
function MetaTraderTab() {
	const portfolios = usePortfolios();
	const [mt, setMt] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [platform, setPlatform] = (0, import_react.useState)("mt5");
	const [broker, setBroker] = (0, import_react.useState)("");
	const [server, setServer] = (0, import_react.useState)("");
	const [account, setAccount] = (0, import_react.useState)("");
	const [portfolioId, setPortfolioId] = (0, import_react.useState)("");
	const [copied, setCopied] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		get("mt/status/").then((d) => {
			setMt(d);
			if (d.connected) {
				setPlatform(d.platform ?? "mt5");
				setBroker(d.broker ?? "");
				setServer(d.server ?? "");
				setAccount(d.account ?? "");
				if (d.portfolioId) setPortfolioId(d.portfolioId);
			}
		}).catch(() => setMt({ connected: false })).finally(() => setLoading(false));
	}, []);
	async function handleConnect() {
		if (!account.trim()) {
			toast.error("شماره حساب الزامی است");
			return;
		}
		if (!portfolioId) {
			toast.error("یک پرتفولیوی مقصد انتخاب کن");
			return;
		}
		setSaving(true);
		try {
			const data = await post("mt/connect/", {
				platform,
				broker: broker.trim(),
				server: server.trim(),
				account: account.trim(),
				portfolioId
			});
			setMt(data);
			toast.success("اتصال متاتریدر برقرار شد — حالا EA را نصب کن");
		} catch (e) {
			toast.error(String(e instanceof Error ? e.message : "خطا در اتصال"));
		}
		setSaving(false);
	}
	function copy(value, key) {
		navigator.clipboard?.writeText(value).then(() => {
			setCopied(key);
			setTimeout(() => setCopied(""), 1500);
		}, () => toast.error("کپی ناموفق بود"));
	}
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "card-surface grid place-items-center p-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" })
	});
	const connected = mt?.connected;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card-surface p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-semibold",
					children: "اتصال حساب متاتریدر"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "معاملات بسته‌شده با نصب یک EA (اکسپرت) به‌صورت خودکار همگام می‌شوند."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid gap-4 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نسخه" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: platform,
								onValueChange: setPlatform,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "bg-secondary/60",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "mt5",
									children: "MT5"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "mt4",
									children: "MT4"
								})] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "بروکر" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: broker,
								onChange: (e) => setBroker(e.target.value),
								placeholder: "IC Markets",
								className: "bg-secondary/60"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "سرور" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: server,
								onChange: (e) => setServer(e.target.value),
								placeholder: "ICMarkets-Live01",
								className: "bg-secondary/60"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "شماره حساب" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: account,
								onChange: (e) => setAccount(e.target.value),
								placeholder: "12345678",
								className: "bg-secondary/60 tabular"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 sm:col-span-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "پرتفولیوی مقصد" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: portfolioId,
									onValueChange: setPortfolioId,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "bg-secondary/60",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "انتخاب پرتفولیو" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: portfolios.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
										value: String(p.id),
										children: [
											p.name,
											" — ",
											p.broker
										]
									}, p.id)) })]
								}),
								portfolios.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-amber-500",
									children: "اول از بخش پرتفولیوها یک پرتفولیو بساز."
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						disabled: saving || portfolios.length === 0,
						className: "bg-primary text-primary-foreground hover:bg-primary/90",
						onClick: handleConnect,
						children: [saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "ml-1 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "ml-1 h-4 w-4" }), connected ? "به‌روزرسانی اتصال" : "اتصال"]
					})
				})
			]
		}), connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-semibold",
							children: "اتصال فعال"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							className: "bg-primary/15 text-primary",
							children: "فعال"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-4 space-y-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted-foreground",
									children: "حساب"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "tabular",
									children: mt?.account
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted-foreground",
									children: "سرور"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: mt?.server || "—" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted-foreground",
									children: "نسخه"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: mt?.platform?.toUpperCase() })]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-semibold",
							children: "توکن و آدرس وب‌هوک"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: "این دو مقدار را هنگام نصب EA وارد کن."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "آدرس وب‌هوک" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									readOnly: true,
									value: mt?.webhookUrl ?? "",
									dir: "ltr",
									className: "bg-secondary/60 font-mono text-xs"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "icon",
									variant: "outline",
									onClick: () => copy(mt?.webhookUrl ?? "", "url"),
									children: copied === "url" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4 text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" })
								})]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "توکن" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									readOnly: true,
									value: mt?.token ?? "",
									dir: "ltr",
									className: "bg-secondary/60 font-mono text-xs"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "icon",
									variant: "outline",
									onClick: () => copy(mt?.token ?? "", "token"),
									children: copied === "token" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4 text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" })
								})]
							})] })]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-semibold",
							children: "نصب EA (اکسپرت)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
							className: "mt-3 list-inside list-decimal space-y-1.5 text-sm text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									"فایل ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										dir: "ltr",
										className: "font-mono",
										children: "DleaSync.mq5"
									}),
									" را دانلود کن."
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "در MT5: File → Open Data Folder → پوشه MQL5/Experts." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "فایل را آنجا بگذار و در MetaEditor باز کن و F7 بزن (Compile)." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "در MT5: Tools → Options → Expert Advisors → «Allow WebRequest» را تیک بزن و آدرس وب‌هوک را اضافه کن." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "EA را روی چارت بکش، توکن و آدرس وب‌هوک را وارد کن و Algo Trading را فعال کن." })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/mt/DleaSync.mq5",
							download: true,
							className: "mt-4 inline-block",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								className: "gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-4 w-4" }), " دانلود DleaSync.mq5"]
							})
						})
					]
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "card-surface grid place-items-center p-12 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary/60 text-muted-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "h-7 w-7" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mt-4 font-semibold",
					children: "هنوز متصل نیستی"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-xs text-sm text-muted-foreground",
					children: "فرم کنار را پر کن و «اتصال» را بزن تا توکن وب‌هوک برایت ساخته شود."
				})
			]
		})]
	});
}
//#endregion
export { SettingsPage as component };
