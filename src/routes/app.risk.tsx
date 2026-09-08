import { AppShell } from "@/components/AppShell";
import { createFileRoute } from "@tanstack/react-router";
import { Shield, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useActivePortfolioId, useLocalState } from "@/lib/app-state";
import { fetchTrades, useApi, usePortfolios } from "@/lib/api";
import {
  DEFAULT_RISK_CAPS,
  RISK_CAPS_KEY,
  computeTodayAdherence,
  type RiskCaps,
} from "@/lib/risk-metrics";
import { jalaliMonthName, todayJalali } from "@/lib/persian-calendar";
import { toast } from "sonner";

export const Route = createFileRoute("/app/risk")({
  head: () => ({ meta: [{ title: "مدیریت ریسک" }] }),
  component: RiskPage,
});

const CAP_FIELDS: { key: keyof RiskCaps; label: string }[] = [
  { key: "maxRiskPct", label: "حداکثر ریسک هر معامله (٪)" },
  { key: "maxDailyLossPct", label: "حداکثر ضرر روزانه (٪)" },
  { key: "maxWeeklyLossPct", label: "حداکثر ضرر هفتگی (٪)" },
  { key: "maxDailyTrades", label: "حداکثر معاملات روزانه" },
  { key: "maxConsecutiveLosses", label: "حداکثر ضرر متوالی" },
  { key: "minRR", label: "حداقل R:R" },
];

function faNum(n: number): string {
  if (!Number.isFinite(n)) return "۰";
  return (Number.isInteger(n) ? n : Number(n.toFixed(1))).toLocaleString(
    "fa-IR",
  );
}

function RiskPage() {
  const [portfolioId] = useActivePortfolioId();
  const portfolios = usePortfolios();
  const {
    data: trades,
    loading: tradesLoading,
    error: tradesError,
    reload: reloadTrades,
  } = useApi(() => fetchTrades(portfolioId ?? undefined), [portfolioId]);

  const [savedCaps, setSavedCaps] = useLocalState<Partial<RiskCaps>>(
    RISK_CAPS_KEY,
    {},
  );
  const caps = useMemo<RiskCaps>(
    () => ({ ...DEFAULT_RISK_CAPS, ...savedCaps }),
    [savedCaps],
  );
  const [edited, setEdited] = useState<RiskCaps>(caps);
  // Keep the editable copy in sync when persisted caps arrive/change.
  useEffect(() => {
    setEdited(caps);
  }, [caps]);

  const balance = useMemo(() => {
    const list = portfolioId
      ? portfolios.filter((p) => p.id === portfolioId)
      : portfolios;
    return list.reduce((sum, p) => sum + (p.balance || 0), 0);
  }, [portfolios, portfolioId]);

  const adherence = useMemo(
    () => computeTodayAdherence(trades ?? [], caps, balance),
    [trades, caps, balance],
  );
  const today = useMemo(() => todayJalali(), []);
  const todayTitle = `${faNum(today.day)} ${jalaliMonthName(today.month)} ${faNum(today.year)}`;

  function updateCap(key: keyof RiskCaps, value: number) {
    setEdited((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  }

  function saveRules() {
    setSavedCaps(edited);
    toast.success("قوانین ریسک ذخیره شد");
  }

  return (
    <AppShell
      title="مدیریت ریسک"
      subtitle="قوانین شخصی خود را تعریف کنید و پایبندی به آن‌ها را بسنجید"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface space-y-4 p-6 lg:col-span-2">
          <h3 className="font-semibold">تعریف قوانین</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {CAP_FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={`cap-${f.key}`}>{f.label}</Label>
                <Input
                  id={`cap-${f.key}`}
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={edited[f.key]}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (e.target.value === "" || Number.isNaN(v)) return;
                    updateCap(f.key, v);
                  }}
                  className="bg-secondary/60 tabular"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={saveRules}
            >
              ذخیره قوانین
            </Button>
            {CAP_FIELDS.some((f) => edited[f.key] !== caps[f.key]) && (
              <span className="text-xs text-muted-foreground">
                تغییرات ذخیره‌نشده‌اند
              </span>
            )}
          </div>
        </div>

        <div className="card-surface p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">وضعیت پایبندی امروز</h3>
            </div>
            <span className="text-xs text-muted-foreground">{todayTitle}</span>
          </div>

          {tradesError && (
            <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
              <span>دریافت معاملات از سرور ممکن نشد.</span>
              <Button variant="outline" size="sm" onClick={reloadTrades}>
                <RefreshCw className="ml-1 h-3.5 w-3.5" />
                تلاش دوباره
              </Button>
            </div>
          )}

          {!tradesLoading && !adherence.hasTrades && !tradesError && (
            <p className="mt-4 rounded-lg bg-secondary/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              امروز معامله‌ای ثبت نشده — پایبندی خنثی است و با ثبت معامله جدید
              به‌روز می‌شود.
            </p>
          )}

          {adherence.hasTrades && (
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-secondary/40 px-2 py-2">
                <div className="text-lg font-bold tabular">
                  {faNum(adherence.tradeCount)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  معامله امروز
                </div>
              </div>
              <div className="rounded-lg bg-secondary/40 px-2 py-2">
                <div
                  className={`text-lg font-bold tabular ${adherence.netPnl >= 0 ? "gain" : "loss"}`}
                >
                  {adherence.netPnl >= 0 ? "+" : ""}
                  {faNum(adherence.netPnl)}
                </div>
                <div className="text-[10px] text-muted-foreground">PnL</div>
              </div>
              <div className="rounded-lg bg-secondary/40 px-2 py-2">
                <div className="text-lg font-bold tabular">
                  {faNum(adherence.planAdherencePct)}٪
                </div>
                <div className="text-[10px] text-muted-foreground">
                  پایبندی به پلن
                </div>
              </div>
            </div>
          )}

          {balance <= 0 && adherence.hasTrades && (
            <p className="mt-3 text-xs text-muted-foreground">
              موجودی پرتفولیو در دسترس نیست؛ درصد ریسک و ضرر روزانه بر اساس
              موجودی حساب نشده است.
            </p>
          )}

          <div className="mt-5 space-y-5">
            {adherence.rules.map((r) => {
              const broken = r.usedPct >= 100;
              const accent = broken
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : r.nearLimit
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-600"
                  : "border-primary/40 bg-primary/10 text-primary";
              const barColor = broken
                ? "[&>div]:bg-destructive"
                : r.nearLimit
                  ? "[&>div]:bg-amber-500"
                  : "";
              const textColor = broken
                ? "text-destructive"
                : r.nearLimit
                  ? "text-amber-500"
                  : "text-muted-foreground";
              return (
                <div key={r.key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{r.label}</span>
                    <Badge variant="outline" className={accent}>
                      {r.capText}
                    </Badge>
                  </div>
                  <Progress
                    value={Math.min(100, Math.max(0, r.usedPct))}
                    className={`mt-2 h-1.5 ${barColor}`}
                  />
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    {broken || r.nearLimit ? (
                      <>
                        <AlertTriangle className={`h-3 w-3 ${textColor}`} />
                        <span className={textColor}>
                          {broken ? "نقض شده" : "نزدیک به حد مجاز"}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        <span className="text-muted-foreground">
                          {faNum(Math.round(r.usedPct))}٪ استفاده‌شده
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
