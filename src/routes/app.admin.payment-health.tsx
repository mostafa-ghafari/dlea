import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  Info,
  Loader2,
  RefreshCw,
  ShieldAlert,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNum } from "@/components/admin-context";
import {
  fetchPaymentHealth,
  invalidateCache,
  runPaymentHealthCheck,
  type PaymentHealthStatus,
  type PaymentHealthReport,
} from "@/lib/api";

export const Route = createFileRoute("/app/admin/payment-health")({
  head: () => ({ meta: [{ title: "سلامت درگاه پرداخت" }] }),
  component: PaymentHealthPage,
});

const STATUS_STYLE: Record<
  PaymentHealthStatus,
  { label: string; icon: LucideIcon; text: string; border: string }
> = {
  pass: {
    label: "سالم",
    icon: CheckCircle2,
    text: "text-emerald-500",
    border: "border-emerald-500/30 bg-emerald-500/5",
  },
  fail: {
    label: "خراب",
    icon: XCircle,
    text: "text-destructive",
    border: "border-destructive/40 bg-destructive/5",
  },
  warn: {
    label: "هشدار",
    icon: AlertTriangle,
    text: "text-amber-500",
    border: "border-amber-500/30 bg-amber-500/5",
  },
  skipped: {
    label: "اجرا نشده",
    icon: HelpCircle,
    text: "text-muted-foreground",
    border: "border-border/60 bg-background/40",
  },
  info: {
    label: "اطلاع",
    icon: Info,
    text: "text-sky-500",
    border: "border-sky-500/25 bg-sky-500/5",
  },
};

/** Exact thousands-separated number (formatNum abbreviates to «میلیون»). */
function exact(n: number) {
  return n.toLocaleString("fa-IR");
}

function PaymentHealthPage() {
  const [report, setReport] = useState<PaymentHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    try {
      setReport(await fetchPaymentHealth());
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "دریافت وضعیت درگاه پرداخت ممکن نشد",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runLiveCheck() {
    setChecking(true);
    try {
      const data = await runPaymentHealthCheck();
      setReport(data);
      // The live result is newer than anything a cached GET would return.
      invalidateCache("admin/payment-health/");
      if (data.summary.failed > 0) {
        toast.error(
          `${formatNum(data.summary.failed)} بررسی ناموفق بود — جزئیات را پایین ببین`,
        );
      } else if (data.summary.warned > 0) {
        toast.warning("بررسی انجام شد؛ خطای حیاتی نبود ولی هشدارها را ببین");
      } else {
        toast.success("بررسی زنده انجام شد؛ همه‌چیز سالم است");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "اجرای بررسی زنده ممکن نشد",
      );
    } finally {
      setChecking(false);
    }
  }

  if (loading && !report) {
    return (
      <div className="card-surface flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        در حال خواندن وضعیت درگاه…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header
        report={report}
        checking={checking}
        onRun={runLiveCheck}
        onRefresh={load}
      />
      {report && (
        <>
          <Summary report={report} />
          <Checks report={report} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Plans report={report} />
            <Orders report={report} />
          </div>
          {report.orders.recentFailed.length > 0 && (
            <FailedOrders report={report} />
          )}
          <ResultCodes report={report} />
        </>
      )}
    </div>
  );
}

function Header({
  report,
  checking,
  onRun,
  onRefresh,
}: {
  report: PaymentHealthReport | null;
  checking: boolean;
  onRun: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="card-surface flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">سلامت درگاه پرداخت</h2>
          {report && (
            <>
              <Badge
                variant="outline"
                className={
                  report.sandbox
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                }
              >
                {report.sandbox ? "حالت آزمایشی" : "درگاه واقعی"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                مرچنت: {report.merchant || "—"}
              </Badge>
              {report.live ? (
                <Badge
                  variant="outline"
                  className="border-primary/40 bg-primary/10 text-primary text-xs"
                >
                  بررسی زنده
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-xs text-muted-foreground"
                >
                  بدون تماس با درگاه
                </Badge>
              )}
            </>
          )}
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          با یک کلیک بررسی می‌شود که درگاه در دسترس است، مرزهای مبلغ ما با درگاه
          یکی است، آدرس بازگشت خریدار معتبر است، هیچ سفارشی بدون پرداخت تأییدشده
          تسویه نمی‌شود و خطاهای اخیر چه کدی از درگاه گرفته‌اند. بررسی زنده سشن
          آزمایشی باز می‌کند (بلااستفاده، بدون جابه‌جایی پول). همین بررسی‌ها در
          پایان هر استقرار هم اجرا می‌شوند.
        </p>
        {report && (
          <p className="text-xs text-muted-foreground tabular">
            آخرین بررسی: {new Date(report.checkedAt).toLocaleString("fa-IR")}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" onClick={onRefresh} disabled={checking}>
          <RefreshCw className="h-4 w-4" />
          به‌روزرسانی
        </Button>
        <Button onClick={onRun} disabled={checking}>
          {checking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          {checking ? "در حال بررسی…" : "اجرای بررسی"}
        </Button>
      </div>
    </div>
  );
}

function Summary({ report }: { report: PaymentHealthReport }) {
  const tiles = [
    { label: "سالم", value: report.summary.passed, tone: "text-emerald-500" },
    { label: "ناموفق", value: report.summary.failed, tone: "text-destructive" },
    { label: "هشدار", value: report.summary.warned, tone: "text-amber-500" },
    {
      label: "اجرا نشده",
      value: report.summary.skipped,
      tone: "text-muted-foreground",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="card-surface p-4">
          <div className="text-sm text-muted-foreground">{tile.label}</div>
          <div className={`mt-2 text-2xl font-bold tabular ${tile.tone}`}>
            {formatNum(tile.value)}
          </div>
        </div>
      ))}
      <div className="card-surface p-4 lg:col-span-2">
        <div className="text-sm text-muted-foreground">آدرس بازگشت خریدار</div>
        <div className="mt-2 break-all text-sm" dir="ltr">
          {report.callbackUrl}
        </div>
      </div>
      <div className="card-surface p-4 lg:col-span-2">
        <div className="text-sm text-muted-foreground">مرزهای مبلغ درگاه</div>
        <div className="mt-2 text-sm tabular">
          {exact(report.amounts.minRial)} تا {exact(report.amounts.maxRial)}{" "}
          ریال
          <span className="text-muted-foreground">
            {" "}
            ({exact(report.amounts.minToman)} تا{" "}
            {exact(report.amounts.maxToman)} تومان)
          </span>
        </div>
      </div>
    </div>
  );
}

function Checks({ report }: { report: PaymentHealthReport }) {
  return (
    <div className="card-surface p-5">
      <h3 className="mb-3 text-sm font-bold">بررسی‌ها</h3>
      <ul className="space-y-2">
        {report.checks.map((check, index) => {
          const style = STATUS_STYLE[check.status] ?? STATUS_STYLE.info;
          const Icon = style.icon;
          return (
            <li
              key={`${check.id}-${index}`}
              className={`flex items-start gap-3 rounded-xl border p-3 ${style.border}`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.text}`} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{check.title}</span>
                  <span className={`text-xs ${style.text}`}>{style.label}</span>
                </div>
                {check.detail && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {check.detail}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Plans({ report }: { report: PaymentHealthReport }) {
  return (
    <div className="card-surface p-5">
      <h3 className="mb-3 text-sm font-bold">مبلغ پلن‌ها و محدودهٔ درگاه</h3>
      {report.plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">پلنی تعریف نشده است.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="py-2 text-right">پلن</th>
              <th className="py-2 text-right">ماهانه</th>
              <th className="py-2 text-right">سالانه</th>
              <th className="py-2 text-right">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {report.plans.map((plan) => {
              const style = STATUS_STYLE[plan.status] ?? STATUS_STYLE.info;
              return (
                <tr
                  key={plan.slug}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-2">
                    {plan.name}
                    <div className="text-xs text-muted-foreground">
                      {plan.slug}
                      {!plan.sellable && " — فروش آنلاین ندارد"}
                    </div>
                  </td>
                  <td className="py-2 tabular">
                    {plan.monthlyRial > 0
                      ? `${exact(plan.monthlyRial)} ریال`
                      : "—"}
                  </td>
                  <td className="py-2 tabular">
                    {plan.yearlyRial > 0
                      ? `${exact(plan.yearlyRial)} ریال`
                      : "—"}
                  </td>
                  <td className="py-2">
                    <span className={`text-xs ${style.text}`}>
                      {style.label}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {plan.detail}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Orders({ report }: { report: PaymentHealthReport }) {
  const { orders } = report;
  return (
    <div className="card-surface p-5">
      <h3 className="mb-3 text-sm font-bold">وضعیت سفارش‌ها</h3>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="در انتظار" value={orders.pending} />
        <Stat
          label="بلاتکلیف (قبل از امروز)"
          value={orders.stuck}
          tone={orders.stuck > 0 ? "text-amber-500" : undefined}
        />
        <Stat
          label={`ناموفق (${formatNum(orders.failedWindowDays)} روز)`}
          value={orders.failedRecent}
          tone={orders.failedRecent > 0 ? "text-destructive" : undefined}
        />
      </div>
      {orders.oldestStuck && (
        <p className="mt-3 text-xs text-muted-foreground">
          قدیمی‌ترین سفارش بلاتکلیف: #{orders.oldestStuck.id} —{" "}
          {orders.oldestStuck.user} — {orders.oldestStuck.plan} —{" "}
          {orders.oldestStuck.date}
        </p>
      )}
      <div className="mt-3 rounded-xl border border-border/60 bg-background/40 p-3">
        <div className="text-xs text-muted-foreground">آخرین پرداخت موفق</div>
        {orders.lastPaid ? (
          <div className="mt-1 text-sm">
            #{orders.lastPaid.id} — {orders.lastPaid.plan} —{" "}
            {orders.lastPaid.amount}
            {orders.lastPaid.referenceId && (
              <span className="text-muted-foreground">
                {" "}
                — کد رهگیری {orders.lastPaid.referenceId}
              </span>
            )}
            <span className="text-muted-foreground">
              {" "}
              — {orders.lastPaid.date}
            </span>
          </div>
        ) : (
          <div className="mt-1 text-sm text-muted-foreground">
            هیچ پرداخت تأییدشده‌ای ثبت نشده است.
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-bold tabular ${tone ?? ""}`}>
        {formatNum(value)}
      </div>
    </div>
  );
}

function FailedOrders({ report }: { report: PaymentHealthReport }) {
  return (
    <div className="card-surface p-5">
      <h3 className="mb-3 text-sm font-bold">
        خطاهای اخیر درگاه ({formatNum(report.orders.failedRecent)})
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="py-2 text-right">سفارش</th>
            <th className="py-2 text-right">کاربر</th>
            <th className="py-2 text-right">مبلغ</th>
            <th className="py-2 text-right">کد درگاه</th>
            <th className="py-2 text-right">تاریخ</th>
          </tr>
        </thead>
        <tbody>
          {report.orders.recentFailed.map((order) => (
            <tr
              key={order.id}
              className="border-b border-border/50 last:border-0"
            >
              <td className="py-2 tabular">#{order.id}</td>
              <td className="py-2">
                {order.user}
                <div className="text-xs text-muted-foreground">
                  {order.plan}
                </div>
              </td>
              <td className="py-2 tabular">{order.amount}</td>
              <td className="py-2">
                <Badge
                  variant="outline"
                  className="border-destructive/40 bg-destructive/10 text-destructive tabular"
                >
                  {order.code === null ? "بدون پاسخ" : order.code}
                </Badge>
                <div className="mt-1 text-xs text-muted-foreground">
                  {order.message}
                  {order.stage && ` (${order.stage})`}
                </div>
              </td>
              <td className="py-2 text-xs text-muted-foreground tabular">
                {order.date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted-foreground">
        «بدون پاسخ» یعنی درگاه جوابی نداد (قطعی شبکه یا تنظیمات نامعتبر)؛ در آن
        حالت سفارش باز می‌ماند و از صفحهٔ خرید اشتراک با «بررسی مجدد» قابل تسویه
        است.
      </p>
    </div>
  );
}

function ResultCodes({ report }: { report: PaymentHealthReport }) {
  const seen = new Set(
    report.orders.recentFailed
      .map((order) => order.code)
      .filter((code): code is number => code !== null),
  );
  return (
    <div className="card-surface p-5">
      <h3 className="mb-1 text-sm font-bold">کدهای درگاه</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        کدهایی که با رنگ پررنگ آمده‌اند در خطاهای اخیر دیده شده‌اند.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {report.codes.map((code) => (
          <div
            key={code.code}
            className={`flex items-center gap-3 rounded-xl border p-2.5 text-xs ${
              seen.has(code.code)
                ? "border-destructive/40 bg-destructive/5"
                : "border-border/60"
            }`}
          >
            <span className="tabular w-10 shrink-0 font-bold">{code.code}</span>
            <span className="text-muted-foreground">{code.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
