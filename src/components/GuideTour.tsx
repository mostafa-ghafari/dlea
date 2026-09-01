import { HelpCircle, ArrowLeft, ArrowRight, Check, Wallet, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalState } from "@/lib/app-state";

export type TourStep = { title: string; body: string };

/** Per-section guide tours — shown automatically on first visit only. */
export const tours: Record<string, TourStep[]> = {
  "/app/dashboard": [
    { title: "خوش آمدی به داشبورد", body: "اینجا خلاصه عملکرد کل حساب فارکس تو را می‌بینی: سود کل، نرخ برد و Profit Factor." },
    { title: "نمودار Equity", body: "روند رشد سرمایه در ۳۰ روز اخیر. خط نقطه‌چین موجودی و خط پُر اکوییتی است." },
    { title: "آخرین معاملات", body: "شش معامله آخر همیشه اینجاست؛ برای جزئیات کامل به بخش معاملات برو." },
  ],
  "/app/portfolios": [
    { title: "اولین قدم: پرتفولیو", body: "قبل از هر کاری باید حداقل یک پرتفولیو بسازی. بقیه بخش‌ها تا آن زمان قفل هستند." },
    { title: "اتصال متاتریدر", body: "با دکمه «اتصال MT» تمام فیلدهای معامله مستقیماً از MT4/MT5 خوانده می‌شود." },
    { title: "نام استراتژی", body: "برای هر پرتفولیو می‌توانی یک نام استراتژی ثبت کنی؛ فعلاً فقط برای برچسب‌گذاری." },
  ],
  "/app/trades": [
    { title: "جدول معاملات", body: "تمام معاملات دریافتی از متاتریدر اینجاست. روی هر ردیف کلیک کن تا جزئیات کامل باز شود." },
    { title: "شخصی‌سازی ستون‌ها", body: "با دکمه «ستون‌ها» انتخاب کن کدام فیلدها نمایش داده شوند و ترتیبشان چه باشد." },
    { title: "اسکرین‌شات", body: "در صفحه جزئیات هر معامله می‌توانی چند تصویر چارت یا Report History آپلود کنی." },
  ],
  "/app/journal": [
    { title: "ژورنال بلوکی", body: "ادیتور بلوکی مثل Notion: تیتر، لیست، نقل‌قول و تصویر داخل متن." },
    { title: "دسته‌بندی زمانی", body: "ژورنال‌ها هفته‌به‌هفته و ماه‌به‌ماه گروه‌بندی می‌شوند." },
    { title: "ویرایش", body: "هر ژورنال ثبت‌شده قابل ویرایش است؛ روی دکمه ویرایش کارت بزن." },
  ],
  "/app/ai-coach": [
    { title: "مربی هوشمند", body: "مدل مربی را انتخاب کن؛ هر مدل لحن و عمق تحلیل متفاوتی دارد." },
    { title: "آرشیو گزارش‌ها", body: "گزارش هفتگی در پایان هر هفته و گزارش ماهانه در پایان ماه خودکار بایگانی می‌شود." },
    { title: "استفاده از تاریخچه", body: "گزارش جدید با در نظر گرفتن گزارش‌های قبلی ساخته می‌شود تا روند بهبود دیده شود." },
  ],
  "/app/achievements": [
    { title: "نشان‌ها", body: "۱۶ نشان که هر کدام به یک قاعده محاسباتی مشخص وصل هستند." },
    { title: "ریست ماهانه", body: "ابتدای هر ماه میلادی نشان‌ها ریست می‌شوند اما آرشیو تاریخی حفظ می‌ماند." },
    { title: "ارتقای نقش", body: "هرچه نشان بیشتری بگیری نقشت ارتقا می‌یابد و هرگز کاهش پیدا نمی‌کند." },
  ],
  "/app/calendar": [{ title: "تقویم معاملاتی", body: "روزهای سبز سودده و قرمز زیان‌ده هستند؛ الگوهای زمانی خودت را پیدا کن." }],
  "/app/risk": [{ title: "مدیریت ریسک", body: "قوانین شخصی‌ات را تعریف کن تا هنگام نزدیک شدن به سقف ریسک هشدار بگیری." }],
  "/app/goals": [{ title: "اهداف", body: "هدف ماهانه تعریف کن و درصد پیشرفتش را دنبال کن." }],
  "/app/billing": [
    { title: "اشتراک", body: "روزهای باقی‌مانده اشتراکت اینجا و روی آواتار کاربری نمایش داده می‌شود." },
    { title: "خرید و تمدید", body: "پلن دلخواه را انتخاب کن؛ پرداخت ماهانه یا سالانه با کد تخفیف." },
  ],
  "/app/trades/new": [
    { title: "ایمپورت معاملات", body: "گزارش History متاتریدر را به‌صورت CSV/HTML/XLSX بارگذاری کن." },
    { title: "اتصال خودکار", body: "با رمز Investor حساب را متصل کن تا معاملات خودکار جمع‌آوری شوند." },
  ],
  "/app/settings": [{ title: "تنظیمات", body: "پروفایل، اشتراک، اعلان‌ها و اتصال متاتریدر را اینجا مدیریت کن." }],
  "/app/admin": [
    { title: "پنل مدیریت", body: "کاربران، پرداخت‌ها، پلن‌ها و لینک‌های ثبت‌نام اختصاصی." },
    { title: "مدیریت فیلدها", body: "تعیین کن کدام فیلدهای متاتریدر اساساً در اختیار کاربران قرار بگیرد." },
    { title: "تنظیم گزارش AI", body: "تعداد خطوط گزارش تولیدی هوش مصنوعی را بین ۲ تا ۲۰ خط تنظیم کن." },
  ],
};

const PORTFOLIO_GATE_KEY = "tj:portfolio-gate-seen";

/** When there's no portfolio, show a single reminder dialog instead of the section guide. */
function PortfolioReminderDialog() {
  const [open, setOpen] = useState(false);
  const [seen, setSeen, ready] = useLocalState<boolean>(PORTFOLIO_GATE_KEY, false);

  useEffect(() => {
    if (!ready || seen) return;
    setOpen(true);
  }, [ready, seen]);

  if (seen) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setSeen(true); setOpen(false); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
            <Wallet className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">برای شروع، اول پرتفولیو بساز</DialogTitle>
          <DialogDescription className="text-center leading-relaxed">
            تمام بخش‌های پلتفرم (معاملات، ژورنال، اهداف و ...) نیاز به حداقل یک پرتفولیو دارند.
            تا زمانی که پرتفولیو نسازی، امکان استفاده از این بخش‌ها وجود ندارد.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 justify-center">
          <Link to="/app/portfolios">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setSeen(true)}>
              <Plus className="ml-1 h-4 w-4" /> ساخت پرتفولیو
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Guide: opens automatically on the first visit of a section, or manually via the help icon. */
export function GuideTour({ path, locked }: { path: string; locked?: boolean }) {
  const steps = tours[path];
  const [seen, setSeen, ready] = useLocalState<Record<string, boolean>>("tj:tours-seen:v2", {});
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // NOTE: hooks must run unconditionally — keep this effect BEFORE any early return.
  useEffect(() => {
    if (!ready) return;
    if (locked) return;
    if (!tours[path]) return;
    if (seen[path]) return;
    setIndex(0);
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, path, locked]);

  // When locked (no portfolio), show portfolio reminder instead of section guide
  if (locked) {
    return <PortfolioReminderDialog />;
  }

  if (!steps || steps.length === 0) return null;
  const step = steps[Math.min(index, steps.length - 1)]!;
  const last = index >= steps.length - 1;


  function finish() {
    setSeen({ ...seen, [path]: true });
    setOpen(false);
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 border-border bg-secondary/60"
        aria-label="راهنمای این بخش"
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) finish();
          else setOpen(true);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-xs font-bold text-primary tabular">
                {index + 1}
              </span>
              {step.title}
            </DialogTitle>
            <DialogDescription className="pt-2 text-right leading-relaxed">{step.body}</DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex items-center justify-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-1.5 bg-border"}`}
              />
            ))}
          </div>

          <DialogFooter className="mt-5 gap-2 sm:justify-between">
            <Button variant="ghost" size="sm" onClick={finish}>
              رد کردن راهنما
            </Button>
            <div className="flex gap-2">
              {index > 0 && (
                <Button variant="outline" size="sm" onClick={() => setIndex((i) => i - 1)}>
                  <ArrowRight className="ml-1 h-3.5 w-3.5" /> قبلی
                </Button>
              )}
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => (last ? finish() : setIndex((i) => i + 1))}
              >
                {last ? (
                  <>
                    <Check className="ml-1 h-3.5 w-3.5" /> فهمیدم
                  </>
                ) : (
                  <>
                    بعدی <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
