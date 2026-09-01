import { AppShell } from "@/components/AppShell";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Users, CreditCard, Cpu, TrendingUp } from "lucide-react";
import { AdminProvider, formatNum, useAdminContext } from "@/components/admin-context";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "پنل مدیریت" }] }),
  component: AdminLayout,
});

/** Pages that should show the stats row */
const STATS_ROUTES = ["/app/admin/dashboard", "/app/admin/users"];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showStats = STATS_ROUTES.some((r) => pathname === r);

  return (
    <AdminProvider>
      <AppShell title="پنل مدیریت" subtitle="مدیریت کاربران، اشتراک‌ها، APIها و تنظیمات سیستم">
        {showStats && <AdminStatsRow />}
        <div className="mt-6">
          <Outlet />
        </div>
      </AppShell>
    </AdminProvider>
  );
}

/** Stats cards shown across all admin sub-pages */
function AdminStatsRow() {
  const { stats } = useAdminContext();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: "کل کاربران", value: formatNum(stats?.total_users ?? 0), icon: Users, color: "from-blue-500/20 to-blue-600/5", iconColor: "text-blue-500" },
        { label: "اشتراک‌های فعال", value: formatNum(stats?.active_subscriptions ?? 0), icon: CreditCard, color: "from-emerald-500/20 to-emerald-600/5", iconColor: "text-emerald-500" },
        { label: "درآمد ماهانه", value: `${formatNum(stats?.monthly_revenue ?? 0)} تومان`, icon: TrendingUp, color: "from-amber-500/20 to-amber-600/5", iconColor: "text-amber-500" },
        { label: "درخواست‌های AI", value: formatNum(stats?.ai_calls ?? 0), icon: Cpu, color: "from-purple-500/20 to-purple-600/5", iconColor: "text-purple-500" },
      ].map((k) => (
        <div key={k.label} className={`relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${k.color} p-3 sm:p-5 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-primary/5`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{k.label}</span>
            <div className={`grid h-10 w-10 place-items-center rounded-xl bg-background/50 ${k.iconColor}`}>
              <k.icon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xl font-bold tracking-tight sm:text-2xl" style={{ wordBreak: "break-word", lineHeight: 1.3 }}>{k.value}</div>
        </div>
      ))}
    </div>
  );
}
