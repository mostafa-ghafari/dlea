import { AppShell } from "@/components/AppShell";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Check, CreditCard, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlans, useSubscription, type Subscription } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/billing")({
  head: () => ({
    meta: [
      { title: "خرید و تمدید اشتراک | Dlea AI" },
      { name: "description", content: "وضعیت اشتراک، روزهای باقی‌مانده و خرید یا تمدید پلن‌های Pro و Pro Max ژورنال معاملاتی." },
      { property: "og:title", content: "خرید اشتراک" },
      { property: "og:description", content: "پلن مناسب خود را انتخاب و اشتراک را تمدید کنید." },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const [coupon, setCoupon] = useState("");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const plans = usePlans();
  const subscription: Subscription | null = useSubscription();
  const sub: Subscription = subscription ?? { plan: "رایگان", startDate: "—", endDate: "—", totalDays: 1, daysLeft: 0, price: "—" };
  const pct = Math.max(0, Math.round((sub.daysLeft / sub.totalDays) * 100));
  const sellable = plans.filter((p) => p.sellable && p.id !== "free");

  return (
    <AppShell title="خرید اشتراک" subtitle=" plan مورد نظر خود را انتخاب کنید">
    <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-surface p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">اشتراک فعلی</div>
              <div className="mt-1 text-2xl font-bold">{sub.plan}</div>
            </div>
            <Badge className="bg-primary text-primary-foreground">
              <CalendarClock className="ml-1 h-3 w-3" />
              {sub.daysLeft} روز باقی‌مانده
            </Badge>
          </div>

          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>

          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
            <div><div className="text-muted-foreground">شروع</div><div className="mt-1 tabular">{sub.startDate}</div></div>
            <div><div className="text-muted-foreground">پایان</div><div className="mt-1 tabular">{sub.endDate}</div></div>
            <div><div className="text-muted-foreground">مبلغ</div><div className="mt-1 tabular">{sub.price}</div></div>
          </div>
        </div>

        <div className="card-surface p-6">
          <div className="font-semibold">کد تخفیف</div>
          <div className="mt-3 flex gap-2">
            <Input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="کد را وارد کنید" className="bg-secondary/60" />
            <Button
              variant="outline"
              onClick={() => (coupon.trim() ? toast.success("کد تخفیف اعمال شد") : toast.error("کد تخفیف را وارد کن"))}
            >
              اعمال
            </Button>
          </div>
          <div className="mt-4 rounded-lg bg-primary/10 p-3 text-sm text-primary">
            پرداخت امن از طریق زرین‌پال
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant={cycle === "monthly" ? "default" : "outline"}
              size="sm"
              className={cycle === "monthly" ? "bg-primary text-primary-foreground" : ""}
              onClick={() => setCycle("monthly")}
            >
              ماهانه
            </Button>
            <Button
              variant={cycle === "yearly" ? "default" : "outline"}
              size="sm"
              className={cycle === "yearly" ? "bg-primary text-primary-foreground" : ""}
              onClick={() => setCycle("yearly")}
            >
              سالانه (۲ ماه هدیه)
            </Button>
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">انتخاب پلن</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sellable.map((p) => (
          <div
            key={p.id}
            className={`card-surface flex flex-col p-6 ${p.highlight ? "border-primary/50 shadow-[var(--shadow-glow)]" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">{p.name}</div>
              {p.highlight && (
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                  <Sparkles className="ml-1 h-3 w-3" /> پیشنهاد ما
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{p.tagline}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular">{p.price}</span>
              <span className="text-xs text-muted-foreground">{p.unit}</span>
            </div>
            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => toast.success(`انتقال به درگاه پرداخت برای پلن ${p.name} (${cycle === "monthly" ? "ماهانه" : "سالانه"})`)}
            >
              <CreditCard className="ml-1 h-4 w-4" />
              {sub.plan === p.name ? "تمدید اشتراک" : `خرید ${p.name}`}
            </Button>
          </div>
        ))}
      </div>
    </AppShell>
);
}
