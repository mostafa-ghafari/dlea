import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { P as updateGoal, i as createGoal, l as deleteGoal, v as fetchGoals } from "./api-CQV86vH5.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { I as Pencil, M as Plus, f as Trash2, g as Target } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, i as DialogDescription, n as DialogClose, o as DialogHeader, r as DialogContent, s as DialogTitle, t as Dialog } from "./dropdown-menu-CAJl4ZNo.mjs";
import { t as AppShell } from "./AppShell-Cx40ixlT.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BXfiFzvV.mjs";
import { t as Label } from "./label-AutfcB-T.mjs";
import { t as Progress } from "./progress-ChzuiZwr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.goals-BgQqz3Gd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function GoalsPage() {
	const [goals, setGoals] = (0, import_react.useState)([]);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [title, setTitle] = (0, import_react.useState)("");
	const [type, setType] = (0, import_react.useState)("سود");
	const [editId, setEditId] = (0, import_react.useState)(null);
	const [editTitle, setEditTitle] = (0, import_react.useState)("");
	const [editProgress, setEditProgress] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		let alive = true;
		fetchGoals().then((list) => alive && setGoals(list)).catch(() => alive && toast.error("دریافت اهداف از سرور ممکن نشد"));
		return () => {
			alive = false;
		};
	}, []);
	async function submit(e) {
		e.preventDefault();
		if (!title.trim()) {
			toast.error("عنوان هدف را وارد کنید");
			return;
		}
		try {
			const created = await createGoal({
				title: title.trim(),
				progress: 0
			});
			setGoals((g) => [...g, created]);
			toast.success(`هدف «${created.title}» اضافه شد`);
		} catch (err) {
			toast.error(`ثبت هدف ناموفق بود: ${err instanceof Error ? err.message : err}`);
			return;
		}
		setTitle("");
		setType("سود");
		setOpen(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "اهداف",
		subtitle: "تعیین و پیگیری اهداف معاملاتی",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			className: "bg-primary text-primary-foreground hover:bg-primary/90",
			onClick: () => setOpen(true),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "ml-1 h-4 w-4" }), "هدف جدید"]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open,
				onOpenChange: setOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: submit,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "هدف معاملاتی جدید" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "یک هدف قابل اندازه‌گیری تعریف کن تا پیشرفتت را دنبال کنیم." })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "عنوان هدف" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: title,
										onChange: (e) => setTitle(e.target.value),
										placeholder: "مثلاً: ۱۵٪ سود ماهانه",
										className: "bg-secondary/60"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "نوع هدف" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: type,
										onValueChange: setType,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "bg-secondary/60",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
											"سود",
											"ریسک",
											"نظم",
											"یادگیری"
										].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: t,
											children: t
										}, t)) })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "مقدار هدف" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											placeholder: "۱۵",
											className: "bg-secondary/60 tabular"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "مهلت (روز)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											placeholder: "۳۰",
											className: "bg-secondary/60 tabular"
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
								children: "ثبت هدف"
							})]
						})
					]
				}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-2",
				children: [goals.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "card-surface p-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, { className: "h-4 w-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-semibold",
										children: g.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex shrink-0 gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "icon",
											className: "h-8 w-8",
											"aria-label": "ویرایش هدف",
											onClick: () => {
												setEditId(g.id);
												setEditTitle(g.title);
												setEditProgress(g.progress);
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-3.5 w-3.5" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "icon",
											className: "h-8 w-8 text-destructive hover:text-destructive",
											"aria-label": "حذف هدف",
											onClick: async () => {
												try {
													await deleteGoal(g.id);
													setGoals((list) => list.filter((x) => x.id !== g.id));
													toast.success(`هدف «${g.title}» حذف شد`);
												} catch (err) {
													toast.error(`حذف هدف ناموفق بود: ${err instanceof Error ? err.message : err}`);
												}
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 flex items-center justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "پیشرفت"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-bold tabular gain",
										children: [g.progress, "٪"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
									value: g.progress,
									className: "mt-2 h-2"
								})
							]
						})]
					})
				}, g.id)), goals.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "card-surface p-8 text-center text-sm text-muted-foreground md:col-span-2",
					children: "هنوز هدفی تعریف نکردی — با دکمه «هدف جدید» شروع کن."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: editId !== null,
				onOpenChange: (o) => !o && setEditId(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "ویرایش هدف" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "عنوان و درصد پیشرفت هدف را به‌روزرسانی کن." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "عنوان هدف" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: editTitle,
								onChange: (e) => setEditTitle(e.target.value),
								className: "bg-secondary/60"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "پیشرفت (٪)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								min: 0,
								max: 100,
								value: editProgress,
								onChange: (e) => setEditProgress(Math.max(0, Math.min(100, Number(e.target.value) || 0))),
								className: "bg-secondary/60 tabular"
							})]
						})]
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
							className: "bg-primary text-primary-foreground hover:bg-primary/90",
							onClick: async () => {
								if (!editTitle.trim() || !editId) {
									toast.error("عنوان هدف را وارد کنید");
									return;
								}
								try {
									const updated = await updateGoal(editId, {
										title: editTitle.trim(),
										progress: editProgress
									});
									setGoals((list) => list.map((x) => x.id === editId ? updated : x));
									toast.success("هدف به‌روزرسانی شد");
								} catch (err) {
									toast.error(`ویرایش هدف ناموفق بود: ${err instanceof Error ? err.message : err}`);
									return;
								}
								setEditId(null);
							},
							children: "ذخیره تغییرات"
						})]
					})
				] })
			})
		]
	});
}
//#endregion
export { GoalsPage as component };
