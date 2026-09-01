import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as topics, l as usePlatform } from "./router-DPngkkDa.mjs";
import { t as Button } from "./button-BpE9Czok.mjs";
import { t as Input } from "./input-NvmijQlt.mjs";
import { t as Badge } from "./badge-DHlcf1ty.mjs";
import { $ as LifeBuoy, D as Send, M as Plus } from "../_libs/lucide-react.mjs";
import { a as DialogFooter, i as DialogDescription, n as DialogClose, o as DialogHeader, r as DialogContent, s as DialogTitle, t as Dialog } from "./dropdown-menu-CAJl4ZNo.mjs";
import { t as AppShell } from "./AppShell-Cx40ixlT.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BXfiFzvV.mjs";
import { t as Textarea } from "./textarea-Cp94w9lz.mjs";
import { t as Label } from "./label-AutfcB-T.mjs";
import { t as ImageUploader } from "./ImageUploader-Di3egqvW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app.support-BNT839rm.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function statusClass(status) {
	if (status === "باز") return "border-primary/40 bg-primary/10 text-primary";
	if (status === "در حال بررسی") return "border-accent/40 bg-accent/10 text-accent";
	if (status === "پاسخ داده شد") return "border-primary/40 bg-primary/10 text-primary";
	return "border-border bg-secondary/60 text-muted-foreground";
}
function SupportPage() {
	const { tickets, createTicket, replyTicket } = usePlatform();
	const mine = tickets.filter((t) => t.email === "ali@example.com");
	const [subject, setSubject] = (0, import_react.useState)("");
	const [topic, setTopic] = (0, import_react.useState)("فنی");
	const [body, setBody] = (0, import_react.useState)("");
	const [files, setFiles] = (0, import_react.useState)([]);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [activeId, setActiveId] = (0, import_react.useState)(mine[0]?.id ?? null);
	const [reply, setReply] = (0, import_react.useState)("");
	const [replyFiles, setReplyFiles] = (0, import_react.useState)([]);
	const active = mine.find((t) => t.id === activeId) ?? mine[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "پشتیبانی",
		subtitle: "ارسال تیکت و پیگیری درخواست‌ها",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			className: "bg-primary text-primary-foreground hover:bg-primary/90",
			onClick: () => setOpen(true),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "ml-1 h-4 w-4" }), "تیکت جدید"]
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open,
			onOpenChange: setOpen,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "max-h-[85vh] overflow-y-auto",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "ثبت تیکت پشتیبانی" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "موضوع را انتخاب و مشکل را با جزئیات توضیح بده." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "عنوان تیکت" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: subject,
									onChange: (e) => setSubject(e.target.value),
									placeholder: "مثلاً: خطا در ایمپورت فایل",
									className: "bg-secondary/60"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "موضوع" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: topic,
									onValueChange: (v) => setTopic(v),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "bg-secondary/60",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: topics.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: t,
										children: t
									}, t)) })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "شرح مشکل" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									value: body,
									onChange: (e) => setBody(e.target.value),
									rows: 5,
									className: "bg-secondary/60"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageUploader, {
								images: files,
								onChange: setFiles,
								label: "فایل / اسکرین‌شات",
								hint: "در صورت نیاز تصویر خطا را پیوست کن"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
						className: "mt-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								children: "انصراف"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "bg-primary text-primary-foreground hover:bg-primary/90",
							onClick: () => {
								if (!subject.trim() || !body.trim()) {
									toast.error("عنوان و شرح مشکل را کامل کن");
									return;
								}
								const id = createTicket({
									subject: subject.trim(),
									topic,
									body: body.trim(),
									attachments: files
								});
								setActiveId(id);
								setSubject("");
								setBody("");
								setFiles([]);
								setOpen(false);
								toast.success(`تیکت ${id} ثبت شد`);
							},
							children: "ارسال تیکت"
						})]
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [mine.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setActiveId(t.id),
					className: `card-surface w-full p-4 text-right transition-colors ${active?.id === t.id ? "border-primary/50" : "hover:border-primary/30"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground tabular",
								children: t.id
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: statusClass(t.status),
								children: t.status
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 text-sm font-medium",
							children: t.subject
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 text-xs text-muted-foreground",
							children: [
								t.topic,
								" • ",
								t.updatedAt
							]
						})
					]
				}, t.id)), mine.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "card-surface p-6 text-center text-sm text-muted-foreground",
					children: "هنوز تیکتی ثبت نکردی."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "lg:col-span-2",
				children: active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "card-surface flex h-full flex-col p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2 border-b border-border pb-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LifeBuoy, { className: "h-4 w-4 text-primary" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-semibold",
									children: active.subject
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									children: active.topic
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: statusClass(active.status),
									children: active.status
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mr-auto text-xs text-muted-foreground tabular",
									children: active.id
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 flex-1 space-y-3",
							children: active.messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `rounded-lg border p-4 text-sm ${m.author === "admin" ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/40"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between text-xs text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: m.authorName }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular",
											children: m.time
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 leading-relaxed whitespace-pre-line",
										children: m.body
									}),
									m.attachments.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-3 flex flex-wrap gap-2",
										children: m.attachments.map((src, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src,
											alt: "پیوست تیکت",
											className: "h-20 w-20 rounded-md border border-border object-cover"
										}, i))
									})
								]
							}, m.id))
						}),
						active.status !== "بسته" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 space-y-3 border-t border-border pt-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									value: reply,
									onChange: (e) => setReply(e.target.value),
									rows: 3,
									placeholder: "پاسخ خود را بنویس...",
									className: "bg-secondary/60"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageUploader, {
									images: replyFiles,
									onChange: setReplyFiles,
									label: "پیوست",
									hint: "اختیاری"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									className: "bg-primary text-primary-foreground hover:bg-primary/90",
									onClick: () => {
										if (!reply.trim()) {
											toast.error("متن پیام خالی است");
											return;
										}
										replyTicket(active.id, {
											author: "user",
											body: reply.trim(),
											attachments: replyFiles
										});
										setReply("");
										setReplyFiles([]);
										toast.success("پیام ارسال شد");
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "ml-1 h-4 w-4" }), " ارسال پیام"]
								})
							]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "card-surface p-10 text-center text-sm text-muted-foreground",
					children: "تیکتی برای نمایش وجود ندارد."
				})
			})]
		})]
	});
}
//#endregion
export { SupportPage as component, statusClass };
