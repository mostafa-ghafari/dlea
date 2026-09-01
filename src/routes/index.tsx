import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  Brain,
  CheckCircle2,
  LineChart,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Zap,
  BookOpen,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CountUp } from "@/components/CountUp";
import { ThemeToggle } from "@/lib/theme";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dlea AI — ژورنال هوشمند معامله‌گران بازارهای مالی" },
      {
        name: "description",
        content:
          "ثبت معاملات، تحلیل روانشناسی، مدیریت ریسک و مربی هوشمند برای معامله‌گران فارکس، کریپتو و شاخص‌ها.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: BookOpen, title: "ژورنال حرفه‌ای", desc: "ثبت جامع معاملات، احساسات و درس‌های آموخته‌شده در یک محیط منظم." },
  { icon: Brain, title: "مربی هوشمند AI", desc: "تحلیل عمیق سبک معامله‌گری شما و پیشنهادهای شخصی‌سازی‌شده برای رشد." },
  { icon: Shield, title: "مدیریت ریسک", desc: "تعریف قوانین شخصی و کنترل خودکار پایبندی به آن‌ها در هر معامله." },
  { icon: Zap, title: "اتصال متاتریدر", desc: "همگام‌سازی خودکار معاملات از MT4/MT5 بدون نیاز به ثبت دستی." },
  { icon: BarChart3, title: "داشبورد کامل", desc: "Win Rate، Profit Factor، Drawdown و ده‌ها متریک حرفه‌ای در یک نگاه." },
  { icon: Calendar, title: "تقویم معاملاتی", desc: "نقشه رنگی روزهای سودده و زیان‌ده برای شناسایی الگوهای عملکردی." },
  { icon: Target, title: "اهداف و پیشرفت", desc: "تعیین هدف ماهانه و پیگیری میزان تحقق آن با نمودارهای شفاف." },
  { icon: Trophy, title: "سیستم نشان", desc: "کسب دستاورد برای حفظ انگیزه و ساخت عادات معاملاتی سالم." },
];

const plans = [
  {
    name: "رایگان",
    price: "۰",
    unit: "تومان",
    tagline: "برای شروع ژورنال‌نویسی",
    features: ["۱ پرتفولیو", "۵۰ معامله در ماه", "ژورنال ساده", "آمار پایه"],
    cta: "شروع رایگان",
    highlight: false,
  },
  {
    name: "Pro",
    price: "۲۰۰,۰۰۰",
    unit: "تومان / ماه",
    tagline: "برای معامله‌گران فعال",
    features: [
      "پرتفولیو نامحدود",
      "معاملات نامحدود",
      "اتصال MetaTrader",
      "تحلیل هوش مصنوعی",
      "گزارش‌های حرفه‌ای",
      "نمودارهای کامل",
    ],
    cta: "انتخاب Pro",
    highlight: true,
  },
  {
    name: "Pro Max",
    price: "۵۰۰,۰۰۰",
    unit: "تومان / ماه",
    tagline: "مربی شخصی معامله‌گری",
    features: [
      "پرتفولیو نامحدود",
      "تمامی امکانات Pro",
      "AI پیشرفته + مربی شخصی",
      "تحلیل روانشناسی",
      "گزارش‌های اختصاصی",
      "دسترسی زودهنگام به قابلیت‌های جدید",
    ],
    cta: "انتخاب Pro Max",
    highlight: false,
  },
];


function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScrollReveal />
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[var(--shadow-glow)]">
              <LineChart className="h-5 w-5" />
            </div>
            <span className="font-bold">Dlea <span className="text-primary">AI</span></span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">امکانات</a>
            <a href="#pricing" className="hover:text-foreground">تعرفه‌ها</a>
            <a href="#how" className="hover:text-foreground">چگونه کار می‌کند</a>
            <a href="#faq" className="hover:text-foreground">سوالات متداول</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-9 w-9" />

            <Link to="/login">
              <Button variant="ghost" size="sm">ورود</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                ثبت‌نام رایگان
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-bg relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-6 border-primary/40 bg-primary/10 text-primary">
              <Sparkles className="ml-1.5 h-3 w-3" />
              مربی هوشمند معامله‌گری
            </Badge>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              ژورنال هوشمند برای{" "}
              <span className="bg-gradient-to-l from-primary via-primary to-accent bg-clip-text text-transparent">
                معامله‌گران حرفه‌ای
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              معاملات، احساسات و اشتباهات خود را ثبت کنید. هوش مصنوعی مثل یک مربی شخصی
              عملکرد شما را تحلیل کرده و مسیر رشد را نشان می‌دهد.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="h-12 bg-primary px-6 text-primary-foreground shadow-[var(--shadow-glow)] hover:bg-primary/90">
                  شروع رایگان
                  <ArrowLeft className="mr-1 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="h-12 border-border bg-secondary/40 px-6">
                  مشاهده امکانات
                </Button>
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 gain" /> بدون نیاز به کارت</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 gain" /> اتصال MT4/MT5</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 gain" /> کاملاً فارسی</div>
            </div>
          </div>

          {/* Preview card */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="card-surface overflow-hidden rounded-2xl p-1">
              <div className="rounded-xl bg-background/40 p-6">
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    { label: "سود کل", value: 12480, prefix: "$", suffix: "", decimals: 0, change: 24.8, positive: true },
                    { label: "Win Rate", value: 68, prefix: "", suffix: "٪", decimals: 0, change: 4.2, positive: true },
                    { label: "Profit Factor", value: 2.14, prefix: "", suffix: "", decimals: 2, change: 0.3, positive: true },
                    { label: "Max Drawdown", value: -8.2, prefix: "", suffix: "٪", decimals: 1, change: -1.1, positive: false },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-border bg-card p-4">
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                      <div className="mt-2 text-2xl font-bold tabular">
                        <CountUp value={s.value} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
                      </div>
                      <div className={`mt-1 text-xs tabular ${s.positive ? "gain" : "loss"}`}>
                        <CountUp value={s.change} decimals={1} signed suffix={s.label === "Profit Factor" ? "" : "٪"} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-48 rounded-lg border border-border bg-gradient-to-b from-primary/10 to-transparent p-4">
                  <svg viewBox="0 0 400 120" className="h-full w-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      className="chart-area"
                      d="M0,90 L30,85 L60,70 L90,75 L120,55 L150,60 L180,40 L210,45 L240,30 L270,35 L300,25 L330,20 L360,15 L400,10 L400,120 L0,120 Z"
                      fill="url(#g1)"
                    />
                    <path
                      className="chart-line"
                      d="M0,90 L30,85 L60,70 L90,75 L120,55 L150,60 L180,40 L210,45 L240,30 L270,35 L300,25 L330,20 L360,15 L400,10"
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* Features */}
      <section data-reveal id="features" className="border-t border-border bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">امکانات</Badge>
            <h2 className="text-3xl font-bold md:text-4xl">هرآنچه یک معامله‌گر حرفه‌ای نیاز دارد</h2>
            <p className="mt-4 text-muted-foreground">
              از ثبت ساده تا تحلیل هوشمند — یک پلتفرم کامل برای رشد سیستماتیک.
            </p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="card-surface group p-5 transition-all hover:border-primary/40">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section data-reveal id="how" className="border-t border-border bg-secondary/20 py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">فرآیند</Badge>
            <h2 className="text-3xl font-bold md:text-4xl">در سه گام ساده</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { num: "۰۱", title: "ثبت معاملات", desc: "دستی یا با اتصال مستقیم به متاتریدر." },
              { num: "۰۲", title: "نوشتن ژورنال", desc: "دلیل ورود، احساسات و درس‌های هر معامله." },
              { num: "۰۳", title: "تحلیل با AI", desc: "دریافت گزارش شخصی و پیشنهادهای رشد." },
            ].map((s) => (
              <div key={s.num} className="card-surface relative overflow-hidden p-6">
                <div className="text-5xl font-bold text-primary/20 tabular">{s.num}</div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section data-reveal id="pricing" className="border-t border-border bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">تعرفه‌ها</Badge>
            <h2 className="text-3xl font-bold md:text-4xl">پلن مناسب خود را انتخاب کنید</h2>
            <p className="mt-4 text-muted-foreground">همیشه می‌توانید بعداً ارتقا دهید.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`card-surface relative flex flex-col p-6 ${p.highlight ? "border-primary/60 shadow-[var(--shadow-glow)]" : ""}`}
              >
                {p.highlight && (
                  <Badge className="absolute -top-3 right-6 bg-primary text-primary-foreground">
                    محبوب‌ترین
                  </Badge>
                )}
                <div className="text-lg font-semibold">{p.name}</div>
                <div className="text-sm text-muted-foreground">{p.tagline}</div>
                <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-3xl font-bold tabular md:text-4xl">{p.price}</span>
                  <span className="text-xs text-muted-foreground md:text-sm">{p.unit}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="mt-6">
                  <Button
                    className={`w-full ${p.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                    variant={p.highlight ? "default" : "outline"}
                  >
                    {p.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section data-reveal id="faq" className="border-t border-border bg-secondary/20 py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <div className="text-center">
            <Badge variant="outline" className="mb-4">سوالات متداول</Badge>
            <h2 className="text-3xl font-bold md:text-4xl">پرسش‌های رایج معامله‌گران</h2>
            <p className="mt-4 text-muted-foreground">هرچه لازم است قبل از شروع بدانید.</p>
          </div>
          <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card">
            {[
              { q: "آیا برای استفاده به کارت بانکی نیاز دارم؟", a: "خیر. نسخه رایگان کامل و بدون نیاز به کارت بانکی در دسترس است. تنها هنگام ارتقا به Pro یا Pro Max پرداخت انجام می‌شود." },
              { q: "چگونه به متاتریدر متصل می‌شوم؟", a: "در نسخه Pro، با نصب یک اکسپرت (EA) روی MT4/MT5 معاملات به‌صورت خودکار و لحظه‌ای همگام‌سازی می‌شوند. نیازی به ثبت دستی نیست." },
              { q: "داده‌های معاملات من امن هستند؟", a: "بله. تمام داده‌ها به‌صورت رمزنگاری‌شده ذخیره می‌شوند و هیچ‌کس جز شما به آن‌ها دسترسی ندارد. رمز عبور بروکر شما هرگز ذخیره نمی‌شود." },
              { q: "مربی هوشمند AI چطور کار می‌کند؟", a: "هوش مصنوعی الگوهای رفتاری، نقاط قوت و ضعف شما را از روی تاریخچه معاملات و ژورنال‌ها تحلیل می‌کند و گزارش‌های شخصی روزانه و هفتگی ارائه می‌دهد." },
              { q: "آیا می‌توانم پلن خود را تغییر دهم؟", a: "بله، در هر زمان می‌توانید ارتقا یا کاهش سطح دهید. مبلغ باقیمانده به‌صورت اعتبار در حساب شما محاسبه می‌شود." },
              { q: "از کدام بازارها پشتیبانی می‌کنید؟", a: "فارکس، کریپتو، طلا، نقره، شاخص‌ها (US30, NAS100, ...)، سهام آمریکا و کالاها. اگر بازار خاصی نیاز دارید به ما اطلاع دهید." },
              { q: "آیا اپلیکیشن موبایل دارید؟", a: "نسخه وب کاملاً واکنش‌گرا و روی موبایل و تبلت به‌خوبی کار می‌کند. اپ اختصاصی iOS/Android در نقشه راه ما قرار دارد." },
            ].map((item, i) => (
              <details key={i} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4">
                  <span className="text-base font-medium">{item.q}</span>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-secondary/60 text-muted-foreground transition-transform group-open:rotate-45">
                    <span className="text-lg leading-none">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-reveal className="border-t border-border bg-background py-20">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-8">
          <h2 className="text-3xl font-bold md:text-4xl">
            آماده تبدیل شدن به یک معامله‌گر منظم هستید؟
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            همین امروز رایگان ثبت‌نام کنید و اولین گزارش هوشمند خود را دریافت کنید.
          </p>
          <Link to="/signup" className="mt-8 inline-block">
            <Button size="lg" className="h-12 bg-primary px-8 text-primary-foreground shadow-[var(--shadow-glow)] hover:bg-primary/90">
              شروع رایگان
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row md:px-8">
          <div className="flex items-center gap-2">
            <LineChart className="h-4 w-4 text-primary" />
            <span>© ۱۴۰۳ Dlea AI — تمام حقوق محفوظ است.</span>
          </div>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-foreground">قوانین</Link>
            <Link to="/privacy" className="hover:text-foreground">حریم خصوصی</Link>
            <Link to="/contact" className="hover:text-foreground">تماس</Link>
          </div>

        </div>
      </footer>
    </div>
  );
}
