import { AppShell } from "@/components/AppShell";
import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, Plus, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ImageUploader } from "@/components/ImageUploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePlatform, type TicketStatus, type TicketTopic } from "@/lib/platform-store";
import { useCurrentUser } from "@/lib/app-state";

export const Route = createFileRoute("/app/support")({
  head: () => ({
    meta: [
      { title: "پشتیبانی و تیکت‌ها | Dlea AI" },
      { name: "description", content: "ارسال تیکت پشتیبانی فنی، پرداخت و اشتراک و پیگیری تاریخچه گفتگو با تیم پشتیبانی." },
      { property: "og:title", content: "پشتیبانی و تیکت‌ها" },
      { property: "og:description", content: "ثبت تیکت جدید و پیگیری پاسخ تیم پشتیبانی." },
    ],
  }),
  component: SupportPage,
});

export const topics: TicketTopic[] = ["فنی", "پرداخت", "حساب کاربری", "اشتراک", "سایر"];

export function statusClass(status: TicketStatus) {
  if (status === "باز") return "border-primary/40 bg-primary/10 text-primary";
  if (status === "در حال بررسی") return "border-accent/40 bg-accent/10 text-accent";
  if (status === "پاسخ داده شد") return "border-primary/40 bg-primary/10 text-primary";
  return "border-border bg-secondary/60 text-muted-foreground";
}

function SupportPage() {
  const { tickets, createTicket, replyTicket } = usePlatform();
  const currentUser = useCurrentUser();
  const mine = tickets.filter((t) => !currentUser || t.email === currentUser.email);

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState<TicketTopic>("فنی");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(mine[0]?.id ?? null);
  const [reply, setReply] = useState("");
  const [replyFiles, setReplyFiles] = useState<string[]>([]);

  const active = mine.find((t) => t.id === activeId) ?? mine[0];

  return (
    <AppShell title="پشتیبانی" subtitle="ارسال تیکت و پیگیری درخواست‌ها" actions={
      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setOpen(true)}>
        <Plus className="ml-1 h-4 w-4" />تیکت جدید
      </Button>
    }>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ثبت تیکت پشتیبانی</DialogTitle>
              <DialogDescription>موضوع را انتخاب و مشکل را با جزئیات توضیح بده.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>عنوان تیکت</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="مثلاً: خطا در ایمپورت فایل" className="bg-secondary/60" />
              </div>
              <div className="space-y-2">
                <Label>موضوع</Label>
                <Select value={topic} onValueChange={(v) => setTopic(v as TicketTopic)}>
                  <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>شرح مشکل</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="bg-secondary/60" />
              </div>
              <ImageUploader images={files} onChange={setFiles} label="فایل / اسکرین‌شات" hint="در صورت نیاز تصویر خطا را پیوست کن" />
            </div>
            <DialogFooter className="mt-6">
              <DialogClose asChild><Button variant="outline">انصراف</Button></DialogClose>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  if (!subject.trim() || !body.trim()) {
                    toast.error("عنوان و شرح مشکل را کامل کن");
                    return;
                  }
                  const id = createTicket({ subject: subject.trim(), topic, body: body.trim(), attachments: files });
                  setActiveId(id);
                  setSubject("");
                  setBody("");
                  setFiles([]);
                  setOpen(false);
                  toast.success(`تیکت ${id} ثبت شد`);
                }}
              >
                ارسال تیکت
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3">
          {mine.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`card-surface w-full p-4 text-right transition-colors ${active?.id === t.id ? "border-primary/50" : "hover:border-primary/30"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground tabular">{t.id}</span>
                <Badge variant="outline" className={statusClass(t.status)}>{t.status}</Badge>
              </div>
              <div className="mt-2 text-sm font-medium">{t.subject}</div>
              <div className="mt-1 text-xs text-muted-foreground">{t.topic} • {t.updatedAt}</div>
            </button>
          ))}
          {mine.length === 0 && (
            <div className="card-surface p-6 text-center text-sm text-muted-foreground">
              هنوز تیکتی ثبت نکردی.
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {active ? (
            <div className="card-surface flex h-full flex-col p-6">
              <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
                <LifeBuoy className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">{active.subject}</h2>
                <Badge variant="outline">{active.topic}</Badge>
                <Badge variant="outline" className={statusClass(active.status)}>{active.status}</Badge>
                <span className="mr-auto text-xs text-muted-foreground tabular">{active.id}</span>
              </div>

              <div className="mt-4 flex-1 space-y-3">
                {active.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-lg border p-4 text-sm ${m.author === "admin" ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/40"}`}
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{m.authorName}</span>
                      <span className="tabular">{m.time}</span>
                    </div>
                    <p className="mt-2 leading-relaxed whitespace-pre-line">{m.body}</p>
                    {m.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.attachments.map((src, i) => (
                          <img key={i} src={src} alt="پیوست تیکت" className="h-20 w-20 rounded-md border border-border object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {active.status !== "بسته" && (
                <div className="mt-5 space-y-3 border-t border-border pt-4">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={3}
                    placeholder="پاسخ خود را بنویس..."
                    className="bg-secondary/60"
                  />
                  <ImageUploader images={replyFiles} onChange={setReplyFiles} label="پیوست" hint="اختیاری" />
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      if (!reply.trim()) {
                        toast.error("متن پیام خالی است");
                        return;
                      }
                      replyTicket(active.id, { author: "user", body: reply.trim(), attachments: replyFiles });
                      setReply("");
                      setReplyFiles([]);
                      toast.success("پیام ارسال شد");
                    }}
                  >
                    <Send className="ml-1 h-4 w-4" /> ارسال پیام
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="card-surface p-10 text-center text-sm text-muted-foreground">
              تیکتی برای نمایش وجود ندارد.
            </div>
          )}
        </div>
      </div>
    </AppShell>
);
}
