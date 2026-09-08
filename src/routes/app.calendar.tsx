import { AppShell } from "@/components/AppShell";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { get, useApi } from "@/lib/api";
import { useActivePortfolioId } from "@/lib/app-state";
import {
  buildJalaliMonthGrid,
  jalaliMonthName,
  todayJalali,
} from "@/lib/persian-calendar";

export const Route = createFileRoute("/app/calendar")({
  head: () => ({ meta: [{ title: "تقویم معاملاتی" }] }),
  component: CalendarPage,
});

const weekdays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

type CalDay = { id: string; day: number | null; pnl: number; trades: number };

function useCalendar(year: number, month: number, portfolioId?: string | null) {
  return useApi<CalDay[]>(
    () =>
      get<CalDay[]>(
        `calendar/?year=${year}&month=${month}${portfolioId ? `&portfolio=${portfolioId}` : ""}`,
      ),
    [year, month, portfolioId],
  );
}

function CalendarPage() {
  const def = useMemo(() => {
    const today = todayJalali();
    return { year: today.year, month: today.month };
  }, []);
  const [year, setYear] = useState(def.year);
  const [month, setMonth] = useState(def.month);
  const [portfolioId] = useActivePortfolioId();
  const {
    data: calDays,
    loading,
    error,
    reload,
  } = useCalendar(year, month, portfolioId);

  // The month frame is always drawn client-side from the Jalali calendar, so
  // it never disappears when a portfolio has no trades (or while loading /
  // after an error). Server data only fills cells for the *current* request:
  // stale cells from a previously-selected portfolio are never shown.
  const grid = useMemo(() => buildJalaliMonthGrid(year, month), [year, month]);

  const overlay = useMemo(() => {
    if (loading || error || !calDays || calDays.length === 0) return null;
    const byDay = new Map<number, { pnl: number; trades: number }>();
    for (const c of calDays) {
      if (c.day) byDay.set(c.day, { pnl: c.pnl, trades: c.trades });
    }
    return byDay;
  }, [calDays, loading, error]);

  const stats = useMemo(() => {
    if (!overlay) {
      return { totalPnl: 0, winDays: 0, loseDays: 0, bestDay: 0 };
    }
    let totalPnl = 0;
    let winDays = 0;
    let loseDays = 0;
    let bestDay = 0;
    for (const { pnl } of overlay.values()) {
      totalPnl += pnl;
      if (pnl > 0) winDays += 1;
      else if (pnl < 0) loseDays += 1;
      if (pnl > bestDay) bestDay = pnl;
    }
    return { totalPnl, winDays, loseDays, bestDay };
  }, [overlay]);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  return (
    <AppShell
      title="تقویم معاملاتی"
      subtitle={`${jalaliMonthName(month)} ${year}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="min-w-32 text-center font-medium">
            {jalaliMonthName(month)} {year}
          </div>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <div className="card-surface p-4">
          <div className="text-xs text-muted-foreground">مجموع ماه</div>
          <div
            className={`mt-2 text-2xl font-bold tabular ${stats.totalPnl >= 0 ? "gain" : "loss"}`}
          >
            {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(0)}
          </div>
        </div>
        <div className="card-surface p-4">
          <div className="text-xs text-muted-foreground">روزهای سودده</div>
          <div className="mt-2 text-2xl font-bold tabular gain">
            {stats.winDays}
          </div>
        </div>
        <div className="card-surface p-4">
          <div className="text-xs text-muted-foreground">روزهای زیان‌ده</div>
          <div className="mt-2 text-2xl font-bold tabular loss">
            {stats.loseDays}
          </div>
        </div>
        <div className="card-surface p-4">
          <div className="text-xs text-muted-foreground">بهترین روز</div>
          <div className="mt-2 text-2xl font-bold tabular gain">
            {stats.bestDay > 0 ? "+" : ""}${stats.bestDay.toFixed(0)}
          </div>
        </div>
      </div>

      <div className="card-surface mt-6 p-2 sm:p-4 md:p-6">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekdays.map((w) => (
            <div
              key={w}
              className="pb-2 text-center text-[10px] font-medium text-muted-foreground sm:text-xs"
            >
              {w}
            </div>
          ))}
          {grid.map((dayNumber, i) => {
            if (!dayNumber) return <div key={i} className="aspect-square" />;
            const info = overlay?.get(dayNumber);
            const pnl = info?.pnl ?? 0;
            const trades = info?.trades ?? 0;
            const intensity = Math.min(Math.abs(pnl) / 800, 1);
            const bg =
              pnl > 0
                ? `oklch(0.55 ${0.1 * intensity + 0.05} 155 / ${0.18 + intensity * 0.4})`
                : pnl < 0
                  ? `oklch(0.55 ${0.15 * intensity + 0.05} 25 / ${0.18 + intensity * 0.4})`
                  : "transparent";
            return (
              <div
                key={i}
                title={
                  pnl !== 0
                    ? `${pnl > 0 ? "+" : ""}$${pnl} — ${trades} معامله`
                    : undefined
                }
                className="flex aspect-square min-w-0 flex-col justify-between overflow-hidden rounded-md border border-border p-1 transition-all hover:border-primary/50 sm:rounded-lg sm:p-2 sm:hover:scale-105"
                style={{ background: bg }}
              >
                <div className="text-[10px] leading-none text-foreground/80 tabular sm:text-xs">
                  {dayNumber}
                </div>
                {pnl !== 0 && (
                  <div className="min-w-0">
                    <div
                      className={`truncate text-[9px] font-bold leading-tight tabular sm:text-xs ${pnl > 0 ? "gain" : "loss"}`}
                    >
                      {pnl > 0 ? "+" : ""}$
                      {Math.abs(pnl) >= 1000
                        ? `${(pnl / 1000).toFixed(1)}k`
                        : pnl}
                    </div>
                    <div className="mt-0.5 hidden text-[10px] text-muted-foreground sm:block">
                      {trades} معامله
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {error && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
            <span>
              داده‌های معاملاتی این ماه دریافت نشد — تقویم خالی نمایش داده
              می‌شود.
            </span>
            <Button variant="outline" size="sm" onClick={reload}>
              تلاش دوباره
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
