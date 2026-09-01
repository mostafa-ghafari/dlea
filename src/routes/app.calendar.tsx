import { AppShell } from "@/components/AppShell";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { get, useApi } from "@/lib/api";

export const Route = createFileRoute("/app/calendar")({
  head: () => ({ meta: [{ title: "تقویم معاملاتی" }] }),
  component: CalendarPage,
});

const weekdays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

const JALALI_MONTHS = ["", "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

// Get current Jalali year/month as default
function useDefaultJalali() {
  return useMemo(() => {
    // Approximate: today Aug 2026 ≈ 1405/05/28
    const now = new Date();
    // Simple approximate conversion
    const gY = now.getFullYear();
    const gM = now.getMonth() + 1;
    const gD = now.getDate();
    const jD = gY > 2000 ? 0 : 1;
    const jd = Math.floor((gY + (gM > 2 ? 0 : -1) + (gD > 21 ? 1 : 0)) - 621);
    // Use a quick approximation for month
    const jm = Math.max(1, Math.min(12, gM <= 3 ? gM + 9 : gM - 3));
    return { year: jd, month: jm };
  }, []);
}

type CalDay = { id: string; day: number | null; pnl: number; trades: number };

function useCalendar(year: number, month: number) {
  return useApi<CalDay[]>(() => get<CalDay[]>(`calendar/?year=${year}&month=${month}`), [year, month]);
}

function CalendarPage() {
  const def = useDefaultJalali();
  const [year, setYear] = useState(def.year);
  const [month, setMonth] = useState(def.month);
  const { data: calDays } = useCalendar(year, month);
  const days = calDays ?? [];
  const totalPnl = days.reduce((s, d) => s + d.pnl, 0);
  const winDays = days.filter((d) => d.day && d.pnl > 0).length;
  const loseDays = days.filter((d) => d.day && d.pnl < 0).length;

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  return (
    <AppShell title="تقویم معاملاتی" subtitle={`${JALALI_MONTHS[month]} ${year}`} actions={
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="min-w-32 text-center font-medium">{JALALI_MONTHS[month]} {year}</div>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    }>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <div className="card-surface p-4">
          <div className="text-xs text-muted-foreground">مجموع ماه</div>
          <div className={`mt-2 text-2xl font-bold tabular ${totalPnl >= 0 ? "gain" : "loss"}`}>
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(0)}
          </div>
        </div>
        <div className="card-surface p-4">
          <div className="text-xs text-muted-foreground">روزهای سودده</div>
          <div className="mt-2 text-2xl font-bold tabular gain">{winDays}</div>
        </div>
        <div className="card-surface p-4">
          <div className="text-xs text-muted-foreground">روزهای زیان‌ده</div>
          <div className="mt-2 text-2xl font-bold tabular loss">{loseDays}</div>
        </div>
        <div className="card-surface p-4">
          <div className="text-xs text-muted-foreground">بهترین روز</div>
          <div className="mt-2 text-2xl font-bold tabular gain">
            +${days.length ? Math.max(...days.map((d) => d.pnl)).toFixed(0) : "0"}
          </div>
        </div>
      </div>

      <div className="card-surface mt-6 p-2 sm:p-4 md:p-6">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekdays.map((w) => (
            <div key={w} className="pb-2 text-center text-[10px] font-medium text-muted-foreground sm:text-xs">{w}</div>
          ))}
          {days.map((c, i) => {
            if (!c.day) return <div key={i} className="aspect-square" />;
            const intensity = Math.min(Math.abs(c.pnl) / 800, 1);
            const bg = c.pnl > 0
              ? `oklch(0.55 ${0.1 * intensity + 0.05} 155 / ${0.18 + intensity * 0.4})`
              : c.pnl < 0
                ? `oklch(0.55 ${0.15 * intensity + 0.05} 25 / ${0.18 + intensity * 0.4})`
                : "transparent";
            return (
              <div
                key={i}
                title={c.pnl !== 0 ? `${c.pnl > 0 ? "+" : ""}$${c.pnl} — ${c.trades} معامله` : undefined}
                className="flex aspect-square min-w-0 flex-col justify-between overflow-hidden rounded-md border border-border p-1 transition-all hover:border-primary/50 sm:rounded-lg sm:p-2 sm:hover:scale-105"
                style={{ background: bg }}
              >
                <div className="text-[10px] leading-none text-foreground/80 tabular sm:text-xs">{c.day}</div>
                {c.pnl !== 0 && (
                  <div className="min-w-0">
                    <div className={`truncate text-[9px] font-bold leading-tight tabular sm:text-xs ${c.pnl > 0 ? "gain" : "loss"}`}>
                      {c.pnl > 0 ? "+" : ""}${Math.abs(c.pnl) >= 1000 ? `${(c.pnl / 1000).toFixed(1)}k` : c.pnl}
                    </div>
                    <div className="mt-0.5 hidden text-[10px] text-muted-foreground sm:block">{c.trades} معامله</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
);
}
