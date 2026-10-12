import { AppShell } from "@/components/AppShell";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  confirmPaymentOrder,
  fetchPaymentOrder,
  invalidateCache,
  type PaymentOrder,
} from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/payment/result")({
  head: () => ({
    meta: [
      { title: "نتیجه پرداخت | Dlea AI" },
      {
        name: "description",
        content:
          "نتیجه پرداخت اشتراک: وضعیت تراکنش، کد رهگیری و پلنی که روی حساب فعال شد.",
      },
      { property: "og:title", content: "نتیجه پرداخت" },
      { property: "og:description", content: "وضعیت تراکنش و کد رهگیری." },
    ],
  }),
  component: PaymentResultPage,
});

/** What the gateway sent the browser back with (see `_to_billing`). */
type GatewayReturn = {
  state: string;
  orderId: string | null;
  ref: string | null;
  reason: string | null;
};

/**
 * The gateway redirects to `?status=…&order=…&ref=…` on a fresh page load, so
 * the query string is read once from the location — the same contract the
 * billing page reads, which keeps one shape for both entry points.
 */
function readGatewayReturn(): GatewayReturn | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const state = params.get("status");
  if (!state) return null;
  return {
    state,
    orderId: params.get("order"),
    ref: params.get("ref"),
    reason: params.get("reason"),
  };
}

const COPY: Record<
  string,
  { title: string; body: string; tone: "ok" | "bad" | "wait" }
> = {
  success: {
    title: "پرداخت با موفقیت انجام شد",
    body: "اشتراک روی حساب شما فعال شد. از همین حالا می‌توانید از امکانات پلن استفاده کنید.",
    tone: "ok",
  },
  pending: {
    title: "نتیجه پرداخت هنوز تأیید نشده است",
    body: "اگر مبلغ از حساب شما کسر شده است، چند لحظه بعد دوباره بررسی کنید؛ نتیجه از درگاه گرفته می‌شود و پلن فعال می‌شود.",
    tone: "wait",
  },
  failed: {
    title: "پرداخت انجام نشد",
    body: "مبلغی از حساب شما کسر نشده است. می‌توانید سفارش را دوباره ثبت کنید یا با پشتیبانی تماس بگیرید.",
    tone: "bad",
  },
  unknown: {
    title: "سفارش این پرداخت پیدا نشد",
    body: "اگر مبلغی کسر شده است، کد رهگیری تراکنش را برای پشتیبانی بفرستید تا دستی بررسی شود.",
    tone: "bad",
  },
};

function PaymentResultPage() {
  // The query string is read after mount, never while rendering: this app also
  // renders on the server, where `window` does not exist, and a first render
  // that disagrees with the server markup breaks hydration. The billing page
  // reads its gateway return in an effect for exactly the same reason.
  const [gateway, setGateway] = useState<GatewayReturn | null>(null);
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [state, setState] = useState("unknown");
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const landed = readGatewayReturn();
    if (!landed) return;
    setGateway(landed);
    setState(landed.state);
    if (!landed.orderId) return;
    // The tracking code, the plan and the amount live on the order, not in the
    // query string (a URL is user-editable, the order row is not).
    setLoading(true);
    fetchPaymentOrder(landed.orderId)
      .then((o) => {
        setOrder(o);
        // The callback may not have settled the order yet (gateway slow, tab
        // closed too early): trust the stored status over the URL.
        if (o.status === "موفق") setState("success");
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (state === "success") {
      invalidateCache("subscription");
      invalidateCache("profile");
      invalidateCache("plans");
    }
  }, [state]);

  const recheck = useCallback(async () => {
    if (!gateway?.orderId) return;
    setChecking(true);
    try {
      const fresh = await confirmPaymentOrder(gateway.orderId);
      setOrder(fresh);
      if (fresh.status === "موفق") {
        setState("success");
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
  }, [gateway?.orderId]);

  const copy = COPY[state] ?? COPY.unknown;
  const trackingCode = order?.referenceId || gateway?.ref || "";

  return (
    <AppShell title="نتیجه پرداخت" subtitle="وضعیت تراکنش و پلنی که خریدید">
      <div className="mx-auto max-w-3xl">
        <div
          className={`card-surface p-6 sm:p-8 ${
            copy.tone === "ok"
              ? "border-primary/40"
              : copy.tone === "bad"
                ? "border-destructive/40"
                : "border-border"
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={`grid h-16 w-16 place-items-center rounded-2xl ${
                copy.tone === "ok"
                  ? "bg-primary/10 text-primary"
                  : copy.tone === "bad"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-secondary/60 text-muted-foreground"
              }`}
            >
              {loading ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : copy.tone === "ok" ? (
                <BadgeCheck className="h-8 w-8" />
              ) : copy.tone === "wait" ? (
                <RefreshCw className="h-7 w-7" />
              ) : (
                <XCircle className="h-8 w-8" />
              )}
            </div>
            <h2 className="mt-4 text-xl font-bold">{copy.title}</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {gateway?.reason && copy.tone !== "ok"
                ? gateway.reason
                : copy.body}
            </p>
            {trackingCode && (
              <Badge
                variant="outline"
                className="mt-3 border-primary/40 bg-primary/10 text-primary tabular"
              >
                کد رهگیری: {trackingCode}
              </Badge>
            )}
          </div>

          {(order || loading) && (
            <div className="mt-7 grid gap-4 border-t border-border pt-5 text-sm sm:grid-cols-2">
              <Detail
                label="پلن"
                value={order ? `${order.plan}` : "—"}
                hint={
                  order
                    ? order.cycle === "yearly"
                      ? "دوره سالانه (۱۲ ماه)"
                      : "دوره ماهانه"
                    : undefined
                }
              />
              <Detail label="مبلغ پرداخت‌شده" value={order?.amount ?? "—"} />
              {order && order.discountRial > 0 && (
                <Detail
                  label="تخفیف اعمال‌شده"
                  value={`${(order.discountRial / 10).toLocaleString("fa-IR")} تومان`}
                  hint={
                    order.couponCode ? `کد: ${order.couponCode}` : undefined
                  }
                />
              )}
              <Detail
                label="شماره کارت"
                value={order?.cardNumber || "—"}
                mono
              />
              <Detail
                label="زمان پرداخت"
                value={
                  order?.paidAt
                    ? new Date(order.paidAt).toLocaleString("fa-IR")
                    : "—"
                }
              />
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {copy.tone === "wait" && gateway?.orderId && (
              <Button variant="outline" disabled={checking} onClick={recheck}>
                {checking ? (
                  <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="ml-1 h-4 w-4" />
                )}
                بررسی مجدد پرداخت
              </Button>
            )}
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link to="/app/dashboard">
                <ArrowLeft className="ml-1 h-4 w-4" />
                ورود به داشبورد
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/app/billing">
                <CreditCard className="ml-1 h-4 w-4" />
                {copy.tone === "ok" ? "مشاهده اشتراک" : "بازگشت به خرید اشتراک"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Detail({
  label,
  value,
  hint,
  mono = false,
}: {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className={`mt-1 ${mono ? "font-mono text-xs" : ""} tabular`}>
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}
