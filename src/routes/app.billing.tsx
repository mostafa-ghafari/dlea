import { AppShell } from "@/components/AppShell";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  CalendarClock,
  Check,
  CreditCard,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  confirmPaymentOrder,
  fetchPaymentOrder,
  invalidateCache,
  startCheckout,
  usePlans,
  useSubscription,
  type PaymentOrder,
  type Subscription,
} from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/billing")({
  head: () => ({
    meta: [
      { title: "خرید و تمدید اشتراک | Dlea AI" },
      {
        name: "description",
        content:
          "وضعیت اشتراک، روزهای باقی‌مانده و خرید یا تمدید پلن‌های Pro و Pro Max ژورنال معاملاتی.",
      },
      { property: "og:title", content: "خرید اشتراک" },
      {
        property: "og:description",
        content: "پلن مناسب خود را انتخاب و اشتراک را تمدید کنید.",
      },
    ],
  }),
  component: BillingPage,
});

/** What the bank sent the browser back with (see the callback endpoint). */
type GatewayReturn = {
  state: string;
  orderId: string | null;
  ref: string | null;
  reason: string | null;
};

/** Gateway redirects land on `?status=…&order=…&ref=…`; read it once, then clean the URL. */
function useGatewayReturn(): [
  GatewayReturn | null,
  (r: GatewayReturn | null) => void,
] {
  const [result, setResult] = useState<GatewayReturn | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const state = params.get("status");
    if (!state) return;

    const landed: GatewayReturn = {
      state,
      orderId: params.get("order"),
      ref: params.get("ref"),
      reason: params.get("reason"),
    };
    setResult(landed);

    if (state === "success") {
      // The plan and the days-left badge changed on the server.
      invalidateCache("subscription");
      invalidateCache("profile");
      invalidateCache("plans");
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  return [result, setResult];
}

function BillingPage() {
  const [coupon, setCoupon] = useState("");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [gateway, setGateway] = useGatewayReturn();
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [checking, setChecking] = useState(false);
  const plans = usePlans();
  const subscription: Subscription | null = useSubscription();
  const sub: Subscription = subscription ?? {
    plan: "رایگان",
    startDate: "—",
    endDate: "—",
    totalDays: 1,
    daysLeft: 0,
    price: "—",
  };
  const pct = Math.max(0, Math.round((sub.daysLeft / sub.totalDays) * 100));
  const sellable = plans.filter((p) => p.sellable && p.id !== "free");

  // Pull the order behind the redirect so the tracking code and the card the
  // buyer paid with can be shown, not just the status word.
  useEffect(() => {
    if (!gateway?.orderId) return;
    let alive = true;
    fetchPaymentOrder(gateway.orderId)
      .then((o) => alive && setOrder(o))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [gateway?.orderId]);

  async function buy(planId: string) {
    setBusyPlan(planId);
    try {
      const session = await startCheckout(planId, cycle);
      // Full navigation, not a router push: the bank owns the next page.
      window.location.href = session.paymentUrl;
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "اتصال به درگاه پرداخت ممکن نشد",
      );
      setBusyPlan(null);
    }
  }

  const recheck = useCallback(async () => {
    if (!gateway?.orderId) return;
    setChecking(true);
    try {
      const fresh = await confirmPaymentOrder(gateway.orderId);
      setOrder(fresh);
      if (fresh.status === "موفق") {
        invalidateCache("subscription");
        invalidateCache("profile");
        setGateway({ ...gateway, state: "success", ref: fresh.referenceId });
        toast.success(
          fresh.referenceId
            ? `پرداخت تأیید شد — کد رهگیری: ${fresh.referenceId}`
            : "پرداخت تأیید شد",
        );
      } else {
        toast.error(fresh.detail || `وضعیت پرداخت: ${fresh.status}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "بررسی پرداخت ممکن نشد");
    } finally {
      setChecking(false);
    }
  }, [gateway, setGateway]);

  const trackingCode = order?.referenceId || gateway?.ref || "";

  return (
    <AppShell title="خرید اشتراک" subtitle=" plan مورد نظر خود را انتخاب کنید">
      {gateway && (
        <div
          className={`card-surface mb-4 p-5 ${
            gateway.state === "success"
              ? "border-primary/40"
              : gateway.state === "failed"
                ? "border-destructive/40"
                : "border-border"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {gateway.state === "success" ? (
                <BadgeCheck className="mt-0.5 h-5 w-5 text-primary" />
              ) : gateway.state === "failed" || gateway.state === "unknown" ? (
                <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
              ) : (
                <RefreshCw className="mt-0.5 h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <div className="font-semibold">
                  {gateway.state === "success"
                    ? "پرداخت با موفقیت انجام شد"
                    : gateway.state === "pending"
                      ? "نتیجه پرداخت هنوز تأیید نشده است"
                      : gateway.state === "unknown"
                        ? "سفارش این پرداخت پیدا نشد"
                        : "پرداخت انجام نشد"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {gateway.state === "success"
                    ? "اشتراک روی حساب شما فعال شد."
                    : gateway.reason ||
                      "اگر مبلغ از حساب شما کسر شده است، چند لحظه بعد دوباره بررسی کنید."}
                </div>
              </div>
            </div>
            {gateway.state === "pending" && gateway.orderId && (
              <Button
                variant="outline"
                size="sm"
                disabled={checking}
                onClick={recheck}
              >
                {checking ? (
                  <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="ml-1 h-4 w-4" />
                )}
                بررسی مجدد پرداخت
              </Button>
            )}
          </div>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-muted-foreground">کد رهگیری</div>
              <div className="mt-1 tabular">{trackingCode || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">پلن</div>
              <div className="mt-1">
                {order?.plan ?? "—"}
                {order
                  ? ` (${order.cycle === "yearly" ? "سالانه" : "ماهانه"})`
                  : ""}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">مبلغ</div>
              <div className="mt-1 tabular">{order?.amount ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">شماره کارت</div>
              <div className="mt-1 tabular">{order?.cardNumber || "—"}</div>
            </div>
          </div>
        </div>
      )}

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
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <div className="text-muted-foreground">شروع</div>
              <div className="mt-1 tabular">{sub.startDate}</div>
            </div>
            <div>
              <div className="text-muted-foreground">پایان</div>
              <div className="mt-1 tabular">{sub.endDate}</div>
            </div>
            <div>
              <div className="text-muted-foreground">مبلغ</div>
              <div className="mt-1 tabular">{sub.price}</div>
            </div>
          </div>
        </div>

        <div className="card-surface p-6">
          <div className="font-semibold">کد تخفیف</div>
          <div className="mt-3 flex gap-2">
            <Input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="کد را وارد کنید"
              className="bg-secondary/60"
            />
            <Button
              variant="outline"
              onClick={() =>
                coupon.trim()
                  ? toast.success("کد تخفیف اعمال شد")
                  : toast.error("کد تخفیف را وارد کن")
              }
            >
              اعمال
            </Button>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-sm text-primary">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            پرداخت امن با تمام کارت‌های عضو شتاب، از طریق درگاه زیبال
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant={cycle === "monthly" ? "default" : "outline"}
              size="sm"
              className={
                cycle === "monthly" ? "bg-primary text-primary-foreground" : ""
              }
              onClick={() => setCycle("monthly")}
            >
              ماهانه
            </Button>
            <Button
              variant={cycle === "yearly" ? "default" : "outline"}
              size="sm"
              className={
                cycle === "yearly" ? "bg-primary text-primary-foreground" : ""
              }
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
                <Badge
                  variant="outline"
                  className="border-primary/40 bg-primary/10 text-primary"
                >
                  <Check className="ml-1 h-3 w-3" /> پیشنهاد ما
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
              disabled={busyPlan !== null}
              onClick={() => buy(p.id)}
            >
              {busyPlan === p.id ? (
                <Loader2 className="ml-1 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="ml-1 h-4 w-4" />
              )}
              {busyPlan === p.id
                ? "در حال انتقال به درگاه…"
                : sub.plan === p.name
                  ? "تمدید اشتراک"
                  : `خرید ${p.name}`}
            </Button>
            <div className="mt-2 text-center text-xs text-muted-foreground">
              {cycle === "yearly" ? "پرداخت سالانه (۱۲ ماه)" : "پرداخت ماهانه"}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
