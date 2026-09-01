import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { H as useAiInsights, U as useApi, _ as fetchCoachPeriods, k as generateCoachReport } from "./api-CQV86vH5.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { Ot as ChevronRight, Q as Lightbulb, Rt as Brain, S as Sparkles, X as ListChecks, g as Target, k as RefreshCw, kt as ChevronLeft, l as TriangleAlert, u as TrendingUp, w as ShieldCheck, yt as Cpu } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./AppShell-Cx40ixlT.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BXfiFzvV.mjs";
import { t as Progress } from "./progress-ChzuiZwr.mjs";
import { i as TabsTrigger, r as TabsList, t as Tabs } from "./tabs-DO3DZj4v.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.ai-coach-B8ctmx7z.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var scopeLabels = {
	daily: "روزانه",
	weekly: "هفتگی",
	monthly: "ماهانه",
	yearly: "سالانه"
};
var severityStyle = {
	"بحرانی": "border-destructive/50 bg-destructive/15 text-destructive",
	"مهم": "border-accent/50 bg-accent/10 text-accent",
	"قابل بهبود": "border-border bg-secondary/60 text-muted-foreground"
};
function AiCoach() {
	const insights = useAiInsights();
	const periodsApi = useApi(fetchCoachPeriods);
	const coachPeriods = periodsApi.data ?? [];
	const [generating, setGenerating] = (0, import_react.useState)(false);
	const models = insights?.models ?? [];
	const [model, setModel] = (0, import_react.useState)(void 0);
	(0, import_react.useEffect)(() => {
		if (models.length > 0) setModel((prev) => {
			if (prev && models.some((m) => m.id === prev)) return prev;
			return models[0].id;
		});
	}, [models]);
	const activeModel = models.find((m) => m.id === model) ?? models[0] ?? {
		id: "coach-pro",
		name: "Coach Pro",
		desc: ""
	};
	const [scope, setScope] = (0, import_react.useState)("weekly");
	const list = (0, import_react.useMemo)(() => coachPeriods.filter((p) => p.scope === scope), [scope, coachPeriods]);
	const [index, setIndex] = (0, import_react.useState)(0);
	const period = list[Math.min(index, list.length - 1)];
	function changeScope(next) {
		setScope(next);
		setIndex(0);
	}
	async function runNewAnalysis() {
		if (generating) return;
		setGenerating(true);
		try {
			await generateCoachReport(scope, model);
			toast.success(`تحلیل ${scopeLabels[scope]} با ${activeModel.name} ساخته شد و در لیست بازه‌ها ذخیره شد.`);
			await periodsApi.reload();
			setIndex(0);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "خطا در ساخت تحلیل");
		} finally {
			setGenerating(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "مربی هوشمند AI",
		subtitle: "تحلیل عملکرد در هر بازه زمانی؛ با تمرکز روی ضعف‌ها و راهکار رفع آن‌ها",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			className: "bg-primary text-primary-foreground hover:bg-primary/90",
			disabled: generating,
			onClick: runNewAnalysis,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `ml-1 h-4 w-4 ${generating ? "animate-spin" : ""}` }), generating ? "در حال تحلیل با Gemini..." : "تحلیل جدید"]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "card-surface p-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, { className: "h-5 w-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-semibold",
									children: "مدل مربی هوشمند"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: activeModel.desc
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: model ?? "",
							onValueChange: setModel,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								className: "bg-secondary/60 md:max-w-sm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "انتخاب مدل..." })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: models.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: m.id,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col text-right",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: m.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] text-muted-foreground",
										children: m.desc
									})]
								})
							}, m.id)) })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
							variant: "outline",
							className: "border-primary/40 bg-primary/10 text-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "ml-1 h-3 w-3" }), " فعال"]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "card-surface mt-6 p-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tabs, {
						value: scope,
						onValueChange: (v) => changeScope(v),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsList, {
							className: "bg-secondary/60",
							children: Object.keys(scopeLabels).map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: k,
								children: scopeLabels[k]
							}, k))
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								size: "icon",
								className: "h-9 w-9",
								disabled: index >= list.length - 1,
								onClick: () => setIndex((i) => Math.min(i + 1, list.length - 1)),
								"aria-label": "بازه قبلی",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: period?.id ?? "",
								onValueChange: (v) => setIndex(list.findIndex((p) => p.id === v)),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "h-9 min-w-[190px] bg-secondary/60 text-sm",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: list.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: p.id,
									children: p.label
								}, p.id)) })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								size: "icon",
								className: "h-9 w-9",
								disabled: index <= 0,
								onClick: () => setIndex((i) => Math.max(i - 1, 0)),
								"aria-label": "بازه بعدی",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" })
							})
						]
					})]
				})
			}),
			!period ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "card-surface mt-6 p-8 text-center text-sm text-muted-foreground",
				children: "گزارشی برای این بازه بایگانی نشده است."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "card-surface hero-bg mt-6 overflow-hidden p-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[var(--shadow-glow)]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-6 w-6" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
											className: "text-lg font-bold",
											children: [
												"گزارش ",
												scopeLabels[period.scope],
												" — ",
												period.label
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											variant: "outline",
											className: "border-primary/40 bg-primary/10 text-primary",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "ml-1 h-3 w-3" }), "هوش مصنوعی"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: `tabular ${period.net.startsWith("-") ? "loss" : "gain"}`,
											children: period.net
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											variant: "outline",
											className: "tabular",
											children: ["Win Rate: ", period.winRate]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1 text-xs text-muted-foreground tabular",
									children: period.range
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm leading-relaxed text-foreground/90",
									children: period.summary
								})
							]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4",
					children: period.scores.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-surface p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm text-muted-foreground",
								children: s.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex items-baseline gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-3xl font-bold tabular",
									children: s.value
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm text-muted-foreground",
									children: "/ ۱۰۰"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
								value: s.value,
								className: "mt-3 h-1.5"
							})
						]
					}, s.label))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface mt-6 p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-semibold",
							children: "آمار بازه"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6",
						children: period.stats.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-border bg-secondary/40 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-muted-foreground",
								children: s.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-sm font-bold tabular",
								children: s.value
							})]
						}, s.label))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface mt-6 border-destructive/25 p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-5 w-5 text-destructive" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-semibold",
								children: "نقاط ضعف و راهکار رفع آن‌ها"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: "border-destructive/40 bg-destructive/10 text-destructive",
								children: "اولویت اصلی این بازه"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 space-y-4",
						children: period.weaknesses.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-destructive/20 bg-destructive/5 p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium",
											children: w.title
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: severityStyle[w.severity],
											children: w.severity
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 text-xs text-muted-foreground",
									children: w.impact
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex items-start gap-2 rounded-lg bg-background/50 p-3 text-xs text-foreground/90",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold text-accent",
											children: "راهکار:"
										}),
										" ",
										w.solution
									] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "mt-3 grid gap-2 sm:grid-cols-2",
									children: w.steps.map((st, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-start gap-2 rounded-lg border border-border bg-background/40 p-2.5 text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid h-4 w-4 shrink-0 place-items-center rounded-full bg-destructive/20 text-[10px] font-bold text-destructive tabular",
											children: i + 1
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-foreground/90",
											children: st
										})]
									}, i))
								})
							]
						}, w.title))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface mt-6 p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-5 w-5 text-primary" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-semibold",
								children: "نقاط قوت — ادامه بده"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: "border-primary/40 bg-primary/10 text-primary",
								children: "تشویق"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 grid gap-3 lg:grid-cols-2",
						children: period.strengths.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-lg border border-primary/20 bg-primary/5 p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm font-medium",
									children: s.title
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex items-start gap-2 rounded-md bg-background/40 p-2.5 text-xs text-foreground/90",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-primary",
										children: "پایدار نگه‌دار:"
									}),
									" ",
									s.keepDoing
								] })]
							})]
						}, s.title))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid gap-4 lg:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-surface p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListChecks, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-semibold",
								children: "نکات کلیدی بازه"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 space-y-2 text-sm",
							children: period.highlights.map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start gap-2 rounded-lg border border-border bg-secondary/30 p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-foreground/90",
									children: h
								})]
							}, i))
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "card-surface p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, { className: "h-5 w-5 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-semibold",
									children: "برنامه عملی بازه بعد"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-4 space-y-2 text-sm",
								children: period.actionPlan.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-start gap-2 rounded-lg border border-border bg-secondary/40 p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/20 text-[10px] font-bold text-accent tabular",
										children: i + 1
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-foreground/90",
										children: a
									})]
								}, i))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-[11px] text-muted-foreground",
								children: "گزارش‌های گذشته به‌عنوان زمینه (Context) برای سنجش روند بهبود در تحلیل‌های بعدی استفاده می‌شوند."
							})
						]
					})]
				})
			] })
		]
	});
}
//#endregion
export { AiCoach as component };
