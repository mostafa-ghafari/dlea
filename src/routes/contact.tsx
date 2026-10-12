import { createFileRoute } from "@tanstack/react-router";
import { AtSign, Calendar, Mail, Phone, Send, Users } from "lucide-react";
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
      {
        name: "description",
        content: "ارتباط با تیم Dlea AI برای سوالات فنی، اشتراک و همکاری.",
      },
      { property: "og:title", content: "تماس با ما" },
      {
        property: "og:description",
        content: "سوال، پیشنهاد یا مشکل فنی داری؟ با تیم Dlea AI در تماس باش.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const teamMembers = [
  {
    name: "دکتر رضا غلامرضائی",
    role: "فاندر پروژه",
    photo: "/team/photo3.jpg",
    email: "rezagholamrezaei1377@gmail.com",
    phones: ["09215429539"],
    telegram: "@dlea_admin",
  },
  {
    name: "دکتر ارین خسروی",
    role: "همکار و ادمین",
    photo: "/team/photo4.jpg",
    email: "mani1995mgf@gmail.com",
    phones: ["+98 938 429 0960"],
    telegram: "@Supp20262026",
  },
  {
    name: "دکتر محمد جعفری",
    role: "مشاور",
    photo: "/team/photo1.jpg",
    email: "mohammmdjafar1367@gmail.com",
    phones: ["09130233085"],
    instagram: "jafarii_com",
  },
  {
    name: "مهندس مصطفی غفاری",
    role: "برنامه‌نویس پروژه",
    photo: "/team/photo2.jpg",
    email: "mostafa.ghaffari75@gmail.com",
    phones: ["09134353632"],
    telegram: "@ghaffari_tech",
  },
];

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("همه فیلدها را کامل کن");
      return;
    }
    toast.success(
      "پیام شما ثبت شد — برای پاسخ سریع‌تر از تلگرام یا تلفن استفاده کنید",
    );
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <LegalPage
      title="درباره ما و تماس"
      intro="مجموعه ما در سال ۲۰۱۲ ابتدا با هدف‌گذاری روی مباحث متفرقه آموزشی از جمله اقتصاد و سرمایه‌گذاری مالی روی دامنه Deas شروع به‌کار کرد و بعد از گذشت چندین سال وقفه‌ای در فعالیت ما ایجاد شد و بعدها تحت عنوان دلیا (Dlea) به مباحث سرمایه‌گذاری ادامه دادیم. سپس از سال ۲۰۲۰ وارد فارکس شدیم. آموزش، مشاوره و سیگنالدهی از سال ۲۰۲۱ شروع شد و با همکاری یک مشاور و دو نفر از تحلیلگران با تجربه با عنوان تاپ سیگنال فارکس (topsignal_forex) در تلگرام و اینستاگرام فعالیت داشتیم که تماماً به‌صورت آرشیو موجود است. در نهایت در سال ۲۰۲۵ با بازگشت به عنوان قبلی خودمان پلتفرم Dlea (دلیا) را راه‌اندازی کردیم تا به کامیونیتی تریدران فارکس در ایران کمک کنیم تا بتوانند یک پلتفرم در سطح جهانی برای ژورنال‌نویسی استفاده کنند."
    >
      {/* Timeline */}
      <div className="card-surface p-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">مسیر ما</h2>
        </div>
        <div className="relative mt-6 space-y-6" dir="rtl">
          <div className="absolute right-3 top-2 bottom-2 w-px bg-border" />
          {[
            {
              year: "۲۰۱۲",
              text: "شروع فعالیت با دامنه Deas در حوزه آموزش و سرمایه‌گذاری مالی",
            },
            {
              year: "۲۰۲۰",
              text: "ورود به بازار فارکس و تمرکز بر معاملات ارزی",
            },
            {
              year: "۲۰۲۱",
              text: "آموزش، مشاوره و سیگنالدهی با عنوان تاپ سیگنال فارکس (topsignal_forex)",
            },
            {
              year: "۲۰۲۵",
              text: "راه‌اندازی پلتفرم Dlea (دلیا) برای ژورنال‌نویسی حرفه‌ای تریدران",
            },
          ].map((item) => (
            <div
              key={item.year}
              className="relative flex items-start gap-4 pr-8"
            >
              <div className="absolute right-0 top-1 h-6 w-6 rounded-full border-2 border-primary bg-background" />
              <div>
                <div className="text-sm font-bold text-primary tabular">
                  {item.year}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {item.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="card-surface p-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">تیم ما</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {teamMembers.map((m) => (
            <div
              key={m.name}
              className="rounded-lg border border-border bg-secondary/40 p-4"
            >
              <div className="flex items-center gap-3">
                <img
                  src={m.photo}
                  alt={`عکس ${m.name}`}
                  loading="lazy"
                  className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
                />
                <div>
                  <div className="text-sm font-semibold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.role}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {m.email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span className="break-all">{m.email}</span>
                  </div>
                )}
                {m.phones.map((p) => (
                  <div
                    key={p}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <span dir="ltr">{p}</span>
                  </div>
                ))}
                {m.telegram && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Send className="h-3.5 w-3.5 text-primary" />
                    <a
                      href={`https://t.me/${m.telegram.slice(1)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                      className="hover:text-primary"
                    >
                      {m.telegram}
                    </a>
                  </div>
                )}
                {m.instagram && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AtSign className="h-3.5 w-3.5 text-primary" />
                    <a
                      href={`https://instagram.com/${m.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                      className="hover:text-primary"
                    >
                      {m.instagram}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact form */}
      <form onSubmit={submit} className="card-surface space-y-4 p-6">
        <h2 className="text-lg font-bold">ارسال پیام</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>نام و نام خانوادگی</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="نام خود را وارد کنید"
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
        <Button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Send className="ml-1 h-4 w-4" /> ارسال پیام
        </Button>
      </form>
    </LegalPage>
  );
}
