import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { F as updateJournalEntry, I as updateJournalFavorite, N as renameJournalGroup, a as createJournalEntry, b as fetchJournalGroups, o as createJournalGroup, u as deleteJournalGroup, y as fetchJournalEntries } from "./api-CQV86vH5.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { Et as CircleCheck, I as Pencil, O as Search, b as Star, dt as FolderPlus, f as Trash2, jt as Check, lt as Funnel, ut as Folder, wt as CircleX, zt as BookOpen } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, c as DialogTrigger, i as DialogDescription, n as DialogClose, o as DialogHeader, r as DialogContent, s as DialogTitle, t as Dialog } from "./dropdown-menu-CAJl4ZNo.mjs";
import { t as AppShell } from "./AppShell-Cx40ixlT.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BXfiFzvV.mjs";
import { t as Textarea } from "./textarea-Cp94w9lz.mjs";
import { n as RichTextView, t as RichTextEditor } from "./RichTextEditor-DDB2UcoM.mjs";
import { t as Label } from "./label-AutfcB-T.mjs";
import { t as Switch } from "./switch-Cp8Exbjp.mjs";
import { t as ImageUploader } from "./ImageUploader-Di3egqvW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.journal-6uohM3no.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var EMOTIONS = [
	"آرام",
	"متمرکز",
	"طمع",
	"ترس",
	"انتقام"
];
var emptyDraft = {
	title: "",
	tradeId: "",
	symbol: "EURUSD",
	emotion: "آرام",
	mistakes: "",
	lesson: "",
	plan: true,
	favorite: false,
	groupId: null,
	html: "",
	images: []
};
function JournalPage() {
	const [entries, setEntries] = (0, import_react.useState)([]);
	const [groups, setGroups] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		let alive = true;
		Promise.all([fetchJournalGroups(), fetchJournalEntries()]).then(([g, e]) => {
			if (!alive) return;
			setGroups(g);
			setEntries(e);
		}).catch(() => alive && toast.error("دریافت ژورنال از سرور ممکن نشد"));
		return () => {
			alive = false;
		};
	}, []);
	const [editorOpen, setEditorOpen] = (0, import_react.useState)(false);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [draft, setDraft] = (0, import_react.useState)(emptyDraft);
	const [groupOpen, setGroupOpen] = (0, import_react.useState)(false);
	const [newGroup, setNewGroup] = (0, import_react.useState)("");
	const [editingGroupId, setEditingGroupId] = (0, import_react.useState)(null);
	const [groupNameDraft, setGroupNameDraft] = (0, import_react.useState)("");
	const [filterOpen, setFilterOpen] = (0, import_react.useState)(false);
	const [query, setQuery] = (0, import_react.useState)("");
	const [planFilter, setPlanFilter] = (0, import_react.useState)("all");
	const [emotionFilter, setEmotionFilter] = (0, import_react.useState)("all");
	const [symbolFilter, setSymbolFilter] = (0, import_react.useState)("all");
	const [groupFilter, setGroupFilter] = (0, import_react.useState)("all");
	const [favOnly, setFavOnly] = (0, import_react.useState)(false);
	const [periodFilter, setPeriodFilter] = (0, import_react.useState)("all");
	const symbols = (0, import_react.useMemo)(() => Array.from(new Set(entries.map((e) => e.symbol).filter(Boolean))), [entries]);
	const months = (0, import_react.useMemo)(() => Array.from(new Set(entries.map((e) => e.month))), [entries]);
	const filtered = (0, import_react.useMemo)(() => {
		return entries.filter((e) => {
			if (query && !`${e.title} ${e.tradeId} ${e.symbol} ${e.emotion}`.toLowerCase().includes(query.toLowerCase())) return false;
			if (planFilter === "yes" && !e.plan) return false;
			if (planFilter === "no" && e.plan) return false;
			if (emotionFilter !== "all" && e.emotion !== emotionFilter) return false;
			if (symbolFilter !== "all" && e.symbol !== symbolFilter) return false;
			if (groupFilter !== "all" && (e.groupId ?? "none") !== groupFilter) return false;
			if (favOnly && !e.favorite) return false;
			if (periodFilter !== "all" && e.month !== periodFilter) return false;
			return true;
		});
	}, [
		entries,
		query,
		planFilter,
		emotionFilter,
		symbolFilter,
		groupFilter,
		favOnly,
		periodFilter
	]);
	const activeFilters = Boolean(query) || planFilter !== "all" || emotionFilter !== "all" || symbolFilter !== "all" || groupFilter !== "all" || periodFilter !== "all" || favOnly;
	function clearFilters() {
		setQuery("");
		setPlanFilter("all");
		setEmotionFilter("all");
		setSymbolFilter("all");
		setGroupFilter("all");
		setPeriodFilter("all");
		setFavOnly(false);
	}
	function openEdit(entry) {
		setEditingId(entry.id);
		setDraft({
			title: entry.title,
			tradeId: entry.tradeId,
			symbol: entry.symbol,
			emotion: entry.emotion,
			mistakes: entry.mistakes,
			lesson: entry.lesson,
			plan: entry.plan,
			favorite: entry.favorite,
			groupId: entry.groupId,
			html: entry.html,
			images: entry.images
		});
		setEditorOpen(true);
	}
	async function toggleFavorite(id, favorite) {
		try {
			const updated = await updateJournalFavorite(id, !favorite);
			setEntries((list) => list.map((e) => e.id === id ? updated : e));
			toast.success(favorite ? "از علاقه‌مندی‌ها حذف شد" : "به علاقه‌مندی‌ها اضافه شد");
		} catch (err) {
			toast.error(`تغییر وضعیت ژورنال ناموفق بود: ${err instanceof Error ? err.message : err}`);
		}
	}
	async function submit(ev) {
		ev.preventDefault();
		if (!draft.title.trim()) {
			toast.error("عنوان ژورنال را وارد کنید");
			return;
		}
		const payload = {
			title: draft.title.trim(),
			symbol: draft.symbol,
			tradeId: draft.tradeId,
			emotion: draft.emotion,
			mistakes: draft.mistakes,
			lesson: draft.lesson,
			plan: draft.plan,
			favorite: draft.favorite,
			group_id: draft.groupId,
			html: draft.html,
			images: draft.images
		};
		try {
			if (editingId) {
				const updated = await updateJournalEntry(editingId, payload);
				setEntries((list) => list.map((e) => e.id === editingId ? updated : e));
				toast.success("ژورنال ویرایش شد");
			} else {
				const created = await createJournalEntry(payload);
				setEntries((list) => [created, ...list]);
				toast.success("ژورنال با موفقیت ثبت شد");
			}
		} catch (err) {
			toast.error(`ثبت ژورنال ناموفق بود: ${err instanceof Error ? err.message : err}`);
			return;
		}
		setEditorOpen(false);
		setEditingId(null);
		setDraft(emptyDraft);
	}
	async function createGroup(ev) {
		ev.preventDefault();
		if (!newGroup.trim()) {
			toast.error("نام گروه را وارد کنید");
			return;
		}
		try {
			const created = await createJournalGroup({
				name: newGroup.trim(),
				color: "primary"
			});
			setGroups((g) => [...g, created]);
			setNewGroup("");
			setGroupOpen(false);
			toast.success("گروه جدید ساخته شد");
		} catch (err) {
			toast.error(`ساخت گروه ناموفق بود: ${err instanceof Error ? err.message : err}`);
		}
	}
	async function renameGroup(id) {
		if (!groupNameDraft.trim()) {
			toast.error("نام گروه نمی‌تواند خالی باشد");
			return;
		}
		try {
			const updated = await renameJournalGroup(id, { name: groupNameDraft.trim() });
			setGroups((g) => g.map((x) => x.id === id ? updated : x));
			setEditingGroupId(null);
			setGroupNameDraft("");
			toast.success("نام گروه ویرایش شد");
		} catch (err) {
			toast.error(`ویرایش گروه ناموفق بود: ${err instanceof Error ? err.message : err}`);
		}
	}
	async function deleteGroup(id) {
		try {
			await deleteJournalGroup(id);
			setGroups((g) => g.filter((x) => x.id !== id));
			setEntries((list) => list.map((e) => e.groupId === id ? {
				...e,
				groupId: null
			} : e));
			if (groupFilter === id) setGroupFilter("all");
			toast.success("گروه حذف شد؛ ژورنال‌های آن بدون گروه شدند");
		} catch (err) {
			toast.error(`حذف گروه ناموفق بود: ${err instanceof Error ? err.message : err}`);
		}
	}
	const groupName = (id) => groups.find((g) => g.id === id)?.name ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "ژورنال معاملاتی",
		subtitle: "یادداشت و تحلیل معاملات",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			onClick: () => setGroupOpen(true),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPlus, { className: "ml-1 h-4 w-4" }), "گروه‌ها"]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: groupOpen,
				onOpenChange: setGroupOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: createGroup,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "مدیریت گروه‌های ژورنال" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "ژورنال‌ها را در گروه‌های دلخواه دسته‌بندی کن." })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نام گروه" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: newGroup,
									onChange: (e) => setNewGroup(e.target.value),
									placeholder: "مثلاً سشن نیویورک",
									className: "bg-secondary/60"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 pt-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs text-muted-foreground",
											children: "گروه‌های موجود — قابل ویرایش و حذف"
										}),
										groups.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground",
											children: "هنوز گروهی نساخته‌ای."
										}),
										groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "h-4 w-4 shrink-0 text-primary" }), editingGroupId === g.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: groupNameDraft,
												onChange: (e) => setGroupNameDraft(e.target.value),
												className: "h-8 bg-background/60"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												size: "icon",
												variant: "ghost",
												className: "h-8 w-8",
												onClick: () => renameGroup(g.id),
												"aria-label": "ذخیره نام گروه",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4 text-primary" })
											})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "min-w-0 flex-1 truncate text-sm",
													children: g.name
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													type: "button",
													size: "icon",
													variant: "ghost",
													className: "h-8 w-8",
													"aria-label": "ویرایش گروه",
													onClick: () => {
														setEditingGroupId(g.id);
														setGroupNameDraft(g.name);
													},
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-3.5 w-3.5" })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													type: "button",
													size: "icon",
													variant: "ghost",
													className: "h-8 w-8 text-destructive",
													"aria-label": "حذف گروه",
													onClick: () => deleteGroup(g.id),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
												})
											] })]
										}, g.id))
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
							className: "mt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									children: "انصراف"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								className: "bg-primary text-primary-foreground hover:bg-primary/90",
								children: "ساخت گروه"
							})]
						})
					]
				}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
				open: filterOpen,
				onOpenChange: setFilterOpen,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "ml-1 h-4 w-4" }), "فیلترها"]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-h-[85vh] overflow-y-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "فیلتر ژورنال" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "نتایج را با معیارهای زیر محدود کن." })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "جستجو" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: query,
											onChange: (e) => setQuery(e.target.value),
											placeholder: "عنوان، نماد، شناسه معامله...",
											className: "bg-secondary/60 pr-9"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-4 sm:grid-cols-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "دارایی" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: symbolFilter,
												onValueChange: setSymbolFilter,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: "bg-secondary/60",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "all",
													children: "همه"
												}), symbols.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: s,
													children: s
												}, s))] })]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "احساس" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: emotionFilter,
												onValueChange: setEmotionFilter,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: "bg-secondary/60",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "all",
													children: "همه"
												}), EMOTIONS.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: e,
													children: e
												}, e))] })]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "گروه" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: groupFilter,
												onValueChange: setGroupFilter,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: "bg-secondary/60",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "all",
														children: "همه"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "none",
														children: "بدون گروه"
													}),
													groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: g.id,
														children: g.name
													}, g.id))
												] })]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "دوره" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: periodFilter,
												onValueChange: setPeriodFilter,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: "bg-secondary/60",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "all",
													children: "همه"
												}), months.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: m,
													children: m
												}, m))] })]
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "پایبندی به پلن" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: planFilter,
										onValueChange: (v) => setPlanFilter(v),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "bg-secondary/60",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "all",
												children: "همه"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "yes",
												children: "فقط طبق پلن"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "no",
												children: "فقط خارج از پلن"
											})
										] })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between rounded-lg bg-secondary/40 p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-sm",
										children: "فقط علاقه‌مندی‌ها"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										checked: favOnly,
										onCheckedChange: setFavOnly
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
							className: "mt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => {
									clearFilters();
									toast.success("فیلترها پاک شد");
								},
								children: "پاک کردن"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "bg-primary text-primary-foreground hover:bg-primary/90",
									children: "اعمال"
								})
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: editorOpen,
				onOpenChange: setEditorOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "max-h-[90vh] max-w-3xl overflow-y-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: submit,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: editingId ? "ویرایش ژورنال" : "ژورنال جدید" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "یادداشت خود درباره یک معامله را با ویرایشگر پیشرفته بنویس." })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-3 sm:grid-cols-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2 sm:col-span-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "عنوان" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: draft.title,
												onChange: (e) => setDraft({
													...draft,
													title: e.target.value
												}),
												className: "bg-secondary/60"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نماد" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: draft.symbol,
												onChange: (e) => setDraft({
													...draft,
													symbol: e.target.value.toUpperCase()
												}),
												placeholder: "EURUSD",
												className: "tabular bg-secondary/60"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-3 sm:grid-cols-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "شناسه معامله" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: draft.tradeId,
													onChange: (e) => setDraft({
														...draft,
														tradeId: e.target.value
													}),
													placeholder: "T-1043",
													className: "tabular bg-secondary/60"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "احساس" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
													value: draft.emotion,
													onValueChange: (v) => setDraft({
														...draft,
														emotion: v
													}),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
														className: "bg-secondary/60",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: EMOTIONS.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: e,
														children: e
													}, e)) })]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "گروه" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
													value: draft.groupId ?? "none",
													onValueChange: (v) => setDraft({
														...draft,
														groupId: v === "none" ? null : v
													}),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
														className: "bg-secondary/60",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "none",
														children: "بدون گروه"
													}), groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: g.id,
														children: g.name
													}, g.id))] })]
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "توضیحات کامل ژورنال" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichTextEditor, {
											value: draft.html,
											onChange: (html) => setDraft((d) => ({
												...d,
												html
											}))
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageUploader, {
										images: draft.images,
										onChange: (images) => setDraft((d) => ({
											...d,
											images
										})),
										label: "اسکرین‌شات ژورنال"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-3 sm:grid-cols-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "اشتباهات" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
												rows: 2,
												value: draft.mistakes,
												onChange: (e) => setDraft({
													...draft,
													mistakes: e.target.value
												}),
												className: "bg-secondary/60"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "درس آموخته‌شده" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
												rows: 2,
												value: draft.lesson,
												onChange: (e) => setDraft({
													...draft,
													lesson: e.target.value
												}),
												className: "bg-secondary/60"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-3 sm:grid-cols-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between rounded-lg bg-secondary/40 p-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-sm",
												children: "طبق پلن معامله شد؟"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
												checked: draft.plan,
												onCheckedChange: (v) => setDraft({
													...draft,
													plan: v
												})
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between rounded-lg bg-secondary/40 p-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-sm",
												children: "علاقه‌مندی"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
												checked: draft.favorite,
												onCheckedChange: (v) => setDraft({
													...draft,
													favorite: v
												})
											})]
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
								className: "mt-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "outline",
										children: "انصراف"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									className: "bg-primary text-primary-foreground hover:bg-primary/90",
									children: editingId ? "ذخیره تغییرات" : "ثبت ژورنال"
								})]
							})
						]
					})
				})
			}),
			activeFilters && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex flex-wrap items-center gap-2 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted-foreground",
						children: "فیلتر فعال:"
					}),
					query && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						variant: "outline",
						children: ["جستجو: ", query]
					}),
					symbolFilter !== "all" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						variant: "outline",
						children: ["نماد: ", symbolFilter]
					}),
					emotionFilter !== "all" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						variant: "outline",
						children: ["احساس: ", emotionFilter]
					}),
					groupFilter !== "all" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						variant: "outline",
						children: ["گروه: ", groupFilter === "none" ? "بدون گروه" : groupName(groupFilter)]
					}),
					periodFilter !== "all" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						variant: "outline",
						children: ["دوره: ", periodFilter]
					}),
					planFilter !== "all" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						children: planFilter === "yes" ? "طبق پلن" : "خارج از پلن"
					}),
					favOnly && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						children: "فقط علاقه‌مندی‌ها"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "text-primary hover:underline",
						onClick: clearFilters,
						children: "پاک کردن"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "card-surface col-span-full p-12 text-center text-sm text-muted-foreground",
					children: "هیچ ژورنالی با این فیلتر پیدا نشد."
				}), filtered.map((j) => {
					const hasImages = j.images.length > 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: `card-surface p-6 ${hasImages ? "lg:col-span-2" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "h-4 w-4" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-semibold",
									children: j.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular",
											children: j.date
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular",
											children: j.symbol
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular",
											children: j.tradeId
										}),
										groupName(j.groupId) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "h-3 w-3" }), groupName(j.groupId)]
										})] })
									]
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => toggleFavorite(j.id, j.favorite),
										"aria-label": "علاقه‌مندی",
										className: `grid h-8 w-8 place-items-center rounded-lg border transition-colors ${j.favorite ? "border-warning/40 bg-warning/10 text-warning" : "border-border text-muted-foreground hover:text-foreground"}`,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `h-4 w-4 ${j.favorite ? "fill-current" : ""}` })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => openEdit(j),
										"aria-label": "ویرایش ژورنال",
										className: "grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-primary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
										variant: "outline",
										className: j.plan ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive",
										children: [j.plan ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "ml-1 h-3 w-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "ml-1 h-3 w-3" }), j.plan ? "طبق پلن" : "خارج از پلن"]
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `mt-5 gap-5 ${hasImages ? "grid lg:grid-cols-2" : "block"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3 text-sm",
								children: [
									j.html && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichTextView, { html: j.html }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs font-medium text-muted-foreground",
										children: "احساس"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1",
										children: j.emotion
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs font-medium text-muted-foreground",
										children: "اشتباهات"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 text-foreground/90",
										children: j.mistakes
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-lg border border-primary/30 bg-primary/5 p-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs font-medium text-primary",
											children: "درس آموخته‌شده"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-1 text-foreground/90",
											children: j.lesson
										})]
									})
								]
							}), hasImages && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-2 gap-2 self-start",
								children: j.images.map((src, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src,
									alt: `اسکرین‌شات ژورنال ${j.title} شماره ${i + 1}`,
									loading: "lazy",
									className: "h-40 w-full rounded-lg border border-border object-cover"
								}, i))
							})]
						})]
					}, j.id);
				})]
			})
		]
	});
}
//#endregion
export { JournalPage as component };
