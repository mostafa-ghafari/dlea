import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone, Send } from "lucide-react";
import { useState } from "react";
import { LegalPage } from "@/components/LegalPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تماس با ما | Dlea AI" },
      { name: "description", content: "ارتباط با تیم پشتیبانی Dlea AI برای سوالات فنی، اشتراک و همکاری با مربیان معاملاتی." },
      { property: "og:title", content: "تماس با ما" },
      { property: "og:description", content: "سوال، پیشنهاد یا مشکل فنی داری؟ با تیم Dlea AI در تماس باش." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const channels = [
  { icon: Mail, label: "ایمیل پشتیبانی", value: "support@traderjournal.ai" },
  { icon: MessageCircle, label: "تلگرام", value: "@traderjournal_support" },
  { icon: Phone, label: "تلفن", value: "۰۲۱-۹۱۰۰۰۰۰۰" },
];

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("همه فیلدها را کامل کن");
      return;
    }
    toast.success("پیام شما ثبت شد — تیم پشتیبانی به‌زودی پاسخ می‌دهد");
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <LegalPage
      title="تماس با ما"
      intro="هر سوال، پیشنهاد یا مشکلی داری برای ما بنویس. معمولاً در کمتر از ۲۴ ساعت کاری پاسخ می‌دهیم."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {channels.map((c) => (
          <div key={c.label} className="card-surface p-5">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <c.icon className="h-5 w-5" />
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-sm font-medium break-all">{c.value}</div>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="card-surface space-y-4 p-6">
        <h2 className="text-lg font-semibold">ارسال پیام</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>نام و نام خانوادگی</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="علی رضایی"
              className="bg-secondary/60"
            />
          </div>
          <div className="space-y-2">
            <Label>ایمیل</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="bg-secondary/60"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>پیام</Label>
          <Textarea
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="متن پیام..."
            className="bg-secondary/60"
          />
        </div>
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Send className="ml-1 h-4 w-4" /> ارسال پیام
        </Button>
      </form>
    </LegalPage>
  );
}
