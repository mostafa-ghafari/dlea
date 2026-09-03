import { AppShell } from "@/components/AppShell";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Percent,
  TrendingDown,
  TrendingUp,
  Activity,
  Award,
  CalendarClock,
  Search,
  Megaphone,
  Pin,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDashboard, usePlanLimits, useTrades, useSubscription } from "@/lib/api";
import { usePlatform } from "@/lib/platform-store";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "داشبورد — Dlea AI" }] }),
  component: DashboardPage,
});

const faDigits = (n: number | string) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);
const formatMoney = (n: number) => {
  const sign = n > 0 ? "+$" : n < 0 ? "-$" : "$";
  return sign + faDigits(Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 }));
};

function DashboardPage() {
  const { news } = usePlatform();
  const limits = usePlanLimits();
  const subscription = useSubscription();
  const dashboard = useDashboard();
  const trades = useTrades();
  const equityCurve = dashboard?.equityCurve ?? [];
  const winLossData = dashboard?.winLossData ?? [];
  const monthlyPerformanceRaw = (dashboard?.monthlyPerformance ?? []).slice(-6);
  // Always show 6 bars — pad missing months with pnl: 0
  const monthlyPerformance = Array.from({ length: 6 }, (_, i) => monthlyPerformanceRaw[i] ?? { month: "—", pnl: 0 });
  const economicEvents = dashboard?.economicEvents ?? [];
  const totalPnl = dashboard?.totalPnl ?? 0;
  const winRate = dashboard?.winRate ?? 0;
  const profitFactor = dashboard?.profitFactor ?? 0;
  const maxDrawdown = dashboard?.maxDrawdown ?? 0;
  const bestTrade = dashboard?.bestTrade ?? null;
  const worstTrade = dashboard?.worstTrade ?? null;
  const winnerPct = winLossData.find((w) => w.name === "برنده")?.value ?? 0;
  const loserPct = 100 - winnerPct;

  const kpis = [
    { label: "سود کل", value: formatMoney(totalPnl), positive: totalPnl >= 0, icon: DollarSign, sub: totalPnl >= 0 ? "سود خالص کل معاملات" : "زیان خالص کل معاملات" },
    { label: "نرخ برد", value: faDigits(winRate) + "٪", positive: winRate >= 50, icon: Percent, sub: `${faDigits(dashboard?.tradeCount ?? 0)} معامله` },
    { label: "Profit Factor", value: faDigits(profitFactor), positive: profitFactor >= 1, icon: TrendingUp, sub: "سود ناخالص ÷ زیان ناخالص" },
    { label: "Max Drawdown", value: faDigits(maxDrawdown) + "٪", positive: false, icon: TrendingDown, sub: "حداکثر افت حساب" },
  ];
  const [tradeQuery, setTradeQuery] = useState("");
  const recentTrades = useMemo(() => {
    const q = tradeQuery.trim().toLowerCase();
    const list = q
      ? trades.filter((t) =>
          [t.symbol, t.id, t.strategy, t.date].some((v) => String(v).toLowerCase().includes(q)),
        )
      : trades;
    return list.slice(0, 6);
  }, [trades, tradeQuery]);

  return (
    <AppShell title="داشبورد" subtitle="خلاصه عملکرد و آمار کلی حساب شما">
    {/* Free plan upgrade banner */}
      {limits.slug === "free" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-gradient-to-l from-primary/5 to-primary/10 px-4 py-3">
          <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1 text-sm">
            <span className="font-medium">پلن رایگان فعال است.</span>{" "}
            <span className="text-muted-foreground">برای دسترسی به هوش مصنوعی، مدیریت ریسک و اتصال متاتریدر، پلن خود را ارتقا دهید.</span>
          </div>
          <Link to="/app/billing">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              ارتقا پلن
            </Button>
          </Link>
        </div>
      )}
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpis.map((s) => (
          <div key={s.label} className="card-surface p-3 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">{s.label}</span>
              <div className={`grid h-8 w-8 place-items-center rounded-lg ${s.positive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 text-lg sm:text-2xl font-bold tabular">{s.value}</div>
            <div className={`mt-1 flex items-center gap-1 text-[11px] sm:text-xs tabular ${s.positive ? "gain" : "loss"}`}>
              {s.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">نمودار Equity</h3>
              <p className="text-xs text-muted-foreground">۳۰ روز اخیر</p>
            </div>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
              <Activity className="ml-1 h-3 w-3" />
              زنده
            </Badge>
          </div>
          <div className="mt-4 h-56 sm:h-72 w-full overflow-hidden">
            <ResponsiveContainer>
              <AreaChart data={equityCurve} margin={{ left: 5, right: 5 }}>
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.75 0.17 155)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.75 0.17 155)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 255)" vertical={false} />
                <XAxis dataKey="day" stroke="oklch(0.68 0.02 255)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.68 0.02 255)" fontSize={11} tickLine={false} axisLine={false} width={65} padding={{ left: 10, right: 10 }} />
                <Tooltip contentStyle={{ background: "oklch(0.185 0.022 255)", border: "1px solid oklch(0.28 0.02 255)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="equity" stroke="oklch(0.75 0.17 155)" strokeWidth={2} fill="url(#eq)" />
                <Area type="monotone" dataKey="balance" stroke="oklch(0.68 0.16 245)" strokeWidth={1.5} fillOpacity={0} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface overflow-hidden p-5">
          <h3 className="font-semibold">نرخ برد / باخت</h3>
          <p className="text-xs text-muted-foreground">{faDigits(dashboard?.tradeCount ?? 0)} معامله</p>
          <div className="mt-4 h-44 sm:h-56 w-full overflow-hidden">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={winLossData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={4}>
                  {winLossData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.185 0.022 255)", border: "1px solid oklch(0.28 0.02 255)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-primary/10 p-3">
              <div className="text-xs text-muted-foreground">برنده</div>
              <div className="text-lg font-bold gain tabular">{faDigits(winnerPct)}٪</div>
            </div>
            <div className="rounded-lg bg-destructive/10 p-3">
              <div className="text-xs text-muted-foreground">بازنده</div>
              <div className="text-lg font-bold loss tabular">{faDigits(loserPct)}٪</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card-surface overflow-hidden p-5">
          <h3 className="font-semibold">عملکرد ماهانه</h3>
          <p className="text-xs text-muted-foreground">سود/زیان به دلار</p>
          <div className="mt-4 h-52 sm:h-64 w-full overflow-hidden">
            <ResponsiveContainer>
              <BarChart data={monthlyPerformance} margin={{ left: 5, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 255)" vertical={false} />
                <XAxis dataKey="month" stroke="oklch(0.68 0.02 255)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.68 0.02 255)" fontSize={11} tickLine={false} axisLine={false} width={55} padding={{ left: 10, right: 10 }} />
                <Tooltip contentStyle={{ background: "oklch(0.185 0.022 255)", border: "1px solid oklch(0.28 0.02 255)", borderRadius: 8 }} />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                  {monthlyPerformance.map((e, i) => (
                    <Cell key={i} fill={e.pnl >= 0 ? "oklch(0.75 0.17 155)" : "oklch(0.65 0.23 25)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface overflow-hidden p-5">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">تقویم اقتصادی</h3>
          </div>
          <p className="text-xs text-muted-foreground">رویدادهای مهم امروز بازار فارکس</p>
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pl-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            {economicEvents.map((ev) => (
              <div key={ev.id} className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-border bg-secondary/40 p-2 sm:p-3">
                <span className="shrink-0 text-[11px] sm:text-xs text-muted-foreground tabular">{ev.time}</span>
                <span className="grid h-6 w-9 sm:h-7 sm:w-11 shrink-0 place-items-center rounded-md bg-secondary text-[10px] sm:text-[11px] font-bold">
                  {ev.currency}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs sm:text-sm">{ev.title}</div>
                  <div className="text-[10px] sm:text-[11px] text-muted-foreground tabular">
                    پیش‌بینی {ev.forecast} • قبلی {ev.previous}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    ev.impact === "high"
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : ev.impact === "medium"
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-border text-muted-foreground"
                  }
                >
                  {ev.impact === "high" ? "بالا" : ev.impact === "medium" ? "متوسط" : "کم"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent trades + best/worst */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">آخرین معاملات</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={tradeQuery}
                  onChange={(e) => setTradeQuery(e.target.value)}
                  placeholder="جستجو..."
                  className="h-8 w-full max-w-[10rem] bg-secondary/60 pr-8 text-xs sm:w-40"
                />
              </div>
              <Badge variant="outline">{trades.length} معامله</Badge>
            </div>
          </div>
          {/* Desktop table */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-2 text-right font-medium">نماد</th>
                  <th className="py-2 text-right font-medium">نوع</th>
                  <th className="py-2 text-right font-medium">حجم</th>
                  <th className="py-2 text-right font-medium">R:R</th>
                  <th className="py-2 text-right font-medium">سود/زیان</th>
                  <th className="py-2 text-right font-medium">تاریخ</th>
                  <th className="py-2 text-right font-medium">جزئیات</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
                    <td className="py-3 font-medium">{t.symbol}</td>
                    <td className="py-3">
                      <Badge variant="outline" className={t.side === "buy" ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}>
                        {t.side === "buy" ? "خرید" : "فروش"}
                      </Badge>
                    </td>
                    <td className="py-3 tabular">{t.volume}</td>
                    <td className="py-3 tabular">{t.rr}</td>
                    <td className={`py-3 tabular font-medium ${t.pnl >= 0 ? "gain" : "loss"}`}>
                      {t.pnl >= 0 ? "+" : ""}${t.pnl}
                    </td>
                    <td className="py-3 text-xs text-muted-foreground tabular">{t.date}</td>
                    <td className="py-3">
                      <Link to="/app/trades/$id" params={{ id: t.id }} className="text-xs text-primary hover:underline">
                        جزئیات
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout — same as trades page */}
          <div className="mt-4 space-y-3 md:hidden">
            {recentTrades.map((t) => (
              <Link
                key={t.id}
                to="/app/trades/$id"
                params={{ id: t.id }}
                className="block rounded-lg border border-border bg-secondary/30 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{t.symbol}</span>
                    <Badge variant="outline" className={`text-xs ${t.side === "buy" ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
                      {t.side === "buy" ? "خرید" : "فروش"}
                    </Badge>
                  </div>
                  <span className={`text-lg font-bold tabular ${t.pnl >= 0 ? "gain" : "loss"}`}>
                    {t.pnl >= 0 ? "+" : ""}${t.pnl}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="tabular">{t.date}</span>
                  <span className="tabular">R:R {t.rr}</span>
                  <span className="tabular">حجم: {t.volume}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:space-y-4">
          <div className="card-surface overflow-hidden p-3 sm:p-5">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Award className="h-4 w-4 text-primary" />
              بهترین معامله
            </div>
            <div className="mt-2 sm:mt-3 text-base sm:text-lg font-bold">{bestTrade?.symbol ?? "—"}</div>
            <div className="gain text-xl sm:text-2xl font-bold tabular">{bestTrade ? formatMoney(bestTrade.pnl) : "—"}</div>
            <div className="mt-1 sm:mt-2 text-[11px] sm:text-xs text-muted-foreground">
              {bestTrade ? `R:R ${faDigits(bestTrade.rr)} • ${bestTrade.date}` : "هنوز معامله‌ای ثبت نشده"}
            </div>
          </div>
          <div className="card-surface overflow-hidden p-3 sm:p-5">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-destructive" />
              بدترین معامله
            </div>
            <div className="mt-2 sm:mt-3 text-base sm:text-lg font-bold">{worstTrade?.symbol ?? "—"}</div>
            <div className="loss text-xl sm:text-2xl font-bold tabular">{worstTrade ? formatMoney(worstTrade.pnl) : "—"}</div>
            <div className="mt-1 sm:mt-2 text-[11px] sm:text-xs text-muted-foreground">
              {worstTrade ? `R:R ${faDigits(worstTrade.rr)} • ${worstTrade.date}` : "هنوز معامله‌ای ثبت نشده"}
            </div>
          </div>
        </div>
      </div>

      {/* Latest news & announcements */}
      <div className="card-surface mt-6 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">آخرین اخبار و اطلاعیه‌ها</h3>
          </div>
          <Link to="/app/news" className="text-xs text-primary hover:underline">مشاهده همه</Link>
        </div>
        <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {[...news].sort((a, b) => Number(b.pinned) - Number(a.pinned)).slice(0, 3).map((n) => (
            <Link
              key={n.id}
              to="/app/news/$id"
              params={{ id: n.id }}
              className="rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/40 hover:bg-secondary/50"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{n.category}</Badge>
                {n.pinned && <Pin className="h-3 w-3 text-primary" />}
                <span className="mr-auto text-[11px] text-muted-foreground tabular">{n.date}</span>
              </div>
              <div className="mt-2 text-sm font-medium">{n.title}</div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
);
}
