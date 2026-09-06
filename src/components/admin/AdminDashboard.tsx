import { useState, useEffect } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchAdminCharts, type AdminCharts } from "@/lib/api";
import { useAdminContext } from "./shared";

export function AdminDashboard() {
  const { stats } = useAdminContext();
  const charts = useAdminCharts();
  const totalUsers = stats?.total_users ?? 0;
  const userGrowthData = charts?.user_growth ?? [];
  const revenueData = charts?.revenue ?? [];
  const planDistribution = charts?.plan_distribution ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">رشد کاربران</h3>
            <p className="mt-1 text-sm text-muted-foreground">۷ ماه اخیر</p>
          </div>
          <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            +۵۲٪ رشد
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={userGrowthData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 12, color: "#f9fafb", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
              labelStyle={{ color: "#f9fafb", fontWeight: 600, marginBottom: 4 }}
              itemStyle={{ color: "#d1d5db" }}
            />
            <Area type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={2.5} fill="url(#colorUsers)" dot={false} activeDot={{ r: 5, fill: "#22c55e", strokeWidth: 2, stroke: "hsl(var(--background))" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">درآمد ماهانه</h3>
              <p className="mt-1 text-sm text-muted-foreground">میلیون تومان</p>
            </div>
            <div className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              +۲۲٪
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 12, color: "#f9fafb", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
                labelStyle={{ color: "#f9fafb", fontWeight: 600 }}
                itemStyle={{ color: "#d1d5db" }}
              />
              <Bar dataKey="revenue" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-lg font-bold">توزیع پلن‌ها</h3>
            <p className="mt-1 text-sm text-muted-foreground">توزیع فعلی کاربران</p>
          </div>
          <div className="space-y-4">
            {planDistribution.map((p) => (
              <div key={p.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="tabular text-muted-foreground">{p.value.toLocaleString()}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary/80">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(p.value / totalUsers) * 100}%`, backgroundColor: p.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-secondary/30 p-4">
            <div>
              <div className="text-xs text-muted-foreground">نرخ تبدیل</div>
              <div className="mt-1 text-lg font-bold">۳۹٪</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">MRR</div>
              <div className="mt-1 text-lg font-bold">۱۱۸M</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function useAdminCharts() {
  const [charts, setCharts] = useState<AdminCharts | null>(null);
  useEffect(() => { fetchAdminCharts().then(setCharts).catch(() => {}); }, []);
  return charts;
}
