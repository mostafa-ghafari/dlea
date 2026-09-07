import { useState } from "react";
import { toast } from "sonner";
import { LifeBuoy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlatform, type TicketStatus } from "@/lib/platform-store";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TICKET_STATUSES: TicketStatus[] = [
  "باز",
  "در حال بررسی",
  "پاسخ داده شد",
  "بسته",
];

export function TicketsManager() {
  const { tickets, replyTicket, setTicketStatus } = usePlatform();
  const [activeId, setActiveId] = useState<string | null>(
    tickets[0]?.id ?? null,
  );
  const [reply, setReply] = useState("");
  const active = tickets.find((t) => t.id === activeId) ?? tickets[0];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-2">
        {tickets.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`card-surface w-full p-4 text-right ${active?.id === t.id ? "border-primary/50" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground tabular">
                {t.id}
              </span>
              <Badge variant="outline">{t.status}</Badge>
            </div>
            <div className="mt-2 text-sm font-medium">{t.subject}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {t.user} • {t.topic}
            </div>
          </button>
        ))}
        {tickets.length === 0 && (
          <div className="card-surface p-6 text-center text-sm text-muted-foreground">
            تیکتی وجود ندارد.
          </div>
        )}
      </div>
      <div className="lg:col-span-2">
        {active && (
          <div className="card-surface p-5">
            <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
              <LifeBuoy className="h-4 w-4 text-primary" />
              <span className="font-semibold">{active.subject}</span>
              <span className="text-xs text-muted-foreground">
                {active.email}
              </span>
              <div className="mr-auto w-40">
                <Select
                  value={active.status}
                  onValueChange={(v) =>
                    setTicketStatus(active.id, v as TicketStatus)
                  }
                >
                  <SelectTrigger className="h-8 bg-secondary/60 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {active.messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg border p-3 text-sm ${m.author === "admin" ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/40"}`}
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{m.authorName}</span>
                    <span className="tabular">{m.time}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line leading-relaxed">
                    {m.body}
                  </p>
                  {m.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.attachments.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt="پیوست"
                          className="h-16 w-16 rounded border border-border object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <Textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="پاسخ پشتیبانی..."
                className="bg-secondary/60"
              />
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  if (!reply.trim()) {
                    toast.error("متن پاسخ خالی است");
                    return;
                  }
                  replyTicket(active.id, {
                    author: "admin",
                    body: reply.trim(),
                    attachments: [],
                  });
                  setReply("");
                  toast.success("پاسخ ارسال و اعلان برای کاربر ایجاد شد");
                }}
              >
                <Send className="ml-1 h-4 w-4" /> ارسال پاسخ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
