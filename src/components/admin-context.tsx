import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Users,
  CreditCard,
  Activity,
  MoreVertical,
  TrendingUp,
  Search,
  Eye,
  Trash2,
  Mail,
  Megaphone,
  LifeBuoy,
  ShieldAlert,
  Pencil,
  Send,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  deleteUser,
  fetchPayments,
  fetchPlans,
  fetchUsers,
  fetchAdminStats,
  fetchAdminCharts,
  fetchAdminAiApis,
  updateUser,
  type Payment,
  type Plan,
  type PlatformUser,
  type AdminStats,
  type AdminCharts,
  type AiApiInfo,
} from "@/lib/api";
import { usePlatform, type NewsCategory, type NewsItem, type TicketStatus } from "@/lib/platform-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Context ────────────────────────────────────────────────────────

type AdminCtx = {
  userQuery: string;
  setUserQuery: (v: string) => void;
  paymentQuery: string;
  setPaymentQuery: (v: string) => void;
  stats: AdminStats | null;
  aiApis: { apis: AiApiInfo[]; gemini_configured: boolean } | null;
};

const AdminContext = createContext<AdminCtx>({
  userQuery: "",
  setUserQuery: () => {},
  paymentQuery: "",
  setPaymentQuery: () => {},
  stats: null,
  aiApis: null,
});

export function useAdminContext() {
  return useContext(AdminContext);
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [userQuery, setUserQuery] = useState("");
  const [paymentQuery, setPaymentQuery] = useState("");
  const stats = useAdminStats();
  const aiApis = useAdminAiApis();

  return (
    <AdminContext.Provider value={{ userQuery, setUserQuery, paymentQuery, setPaymentQuery, stats, aiApis }}>
      {children}
    </AdminContext.Provider>
  );
}

// ─── Hooks ──────────────────────────────────────────────────────────

function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  useEffect(() => {
    fetchAdminStats().then(setStats).catch(() => {});
  }, []);
  return stats;
}

function useAdminAiApis() {
  const [data, setData] = useState<{ apis: AiApiInfo[]; gemini_configured: boolean } | null>(null);
  useEffect(() => { fetchAdminAiApis().then(setData).catch(() => {}); }, []);
  return data;
}

// ─── Helpers ────────────────────────────────────────────────────────

export function formatNum(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 1 }) + " میلیارد";
  if (n >= 1_000_000) return (n / 1_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 1 }) + " میلیون";
  if (n >= 1_000) return (n / 1_000).toLocaleString("fa-IR", { maximumFractionDigits: 1 }) + " هزار";
  return n.toLocaleString("fa-IR");
}

export function TableSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative mb-4 max-w-xs">
      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="bg-secondary/60 pr-9" />
    </div>
  );
}

// ─── Admin Dashboard (charts) ───────────────────────────────────────

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

// ─── Plans Manager ──────────────────────────────────────────────────

type PlanRow = {
  id: string;
  name: string;
  price: string;
  users: number;
  portfolios: string;
  reportLines: number;
  sellable: boolean;
  features: string;
};

const REPORT_LINES: Record<string, number> = { free: 4, pro: 10, promax: 20, vip: 20 };

function planToRow(p: Plan): PlanRow {
  return {
    id: p.id,
    name: p.name,
    price: p.price === "—" ? "غیرقابل فروش" : `${p.price} تومان`,
    users: p.users,
    portfolios: p.portfolioLimit.includes("نامحدود") ? "نامحدود" : "۱",
    reportLines: REPORT_LINES[p.id] ?? 10,
    sellable: p.sellable,
    features: p.features.join("، "),
  };
}

export function PlansManager() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [editing, setEditing] = useState<PlanRow | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPlans()
      .then((list) => alive && setPlans(list.map(planToRow)))
      .catch(() => alive && toast.error("دریافت پلن‌ها از سرور ممکن نشد"));
    return () => { alive = false; };
  }, []);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setPlans((list) => list.map((p) => (p.id === editing.id ? editing : p)));
    toast.success(`پلن ${editing.name} به‌روزرسانی شد`);
    setEditing(null);
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => (
          <div key={p.id} className="card-surface p-5">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{p.name}</div>
              {!p.sellable && <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent">فقط مدیر</Badge>}
            </div>
            <div className="mt-2 text-2xl font-bold tabular">{p.price}</div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div>پرتفولیو: {p.portfolios}</div>
              <div className="tabular">خطوط گزارش AI: {p.reportLines}</div>
              <div>{p.features}</div>
            </div>
            <div className="mt-3 text-sm text-muted-foreground tabular">{p.users} کاربر فعال</div>
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setEditing(p)}>
              ویرایش پلن
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing && (
            <form onSubmit={save}>
              <DialogHeader>
                <DialogTitle>ویرایش پلن {editing.name}</DialogTitle>
                <DialogDescription>قیمت، سقف‌ها و امکانات پلن را تغییر بده.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>نام پلن</Label>
                    <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="bg-secondary/60" />
                  </div>
                  <div className="space-y-2">
                    <Label>قیمت</Label>
                    <Input value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} className="tabular bg-secondary/60" />
                  </div>
                  <div className="space-y-2">
                    <Label>سقف پرتفولیو</Label>
                    <Input value={editing.portfolios} onChange={(e) => setEditing({ ...editing, portfolios: e.target.value })} className="bg-secondary/60" />
                  </div>
                  <div className="space-y-2">
                    <Label>خطوط گزارش AI (۲ تا ۲۰)</Label>
                    <Input
                      type="number"
                      min={2}
                      max={20}
                      value={editing.reportLines}
                      onChange={(e) => setEditing({ ...editing, reportLines: Math.max(2, Math.min(20, Number(e.target.value) || 2)) })}
                      className="tabular bg-secondary/60"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>امکانات</Label>
                  <Input value={editing.features} onChange={(e) => setEditing({ ...editing, features: e.target.value })} className="bg-secondary/60" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/40 p-3">
                  <div className="text-sm">قابل فروش به کاربران</div>
                  <Switch checked={editing.sellable} onCheckedChange={(v) => setEditing({ ...editing, sellable: v })} />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button type="button" variant="outline">انصراف</Button>
                </DialogClose>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">ذخیره تغییرات</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Users Manager ──────────────────────────────────────────────────

type AdminUser = {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  role?: string;
  joined: string;
};

const PLAN_OPTIONS = ["رایگان", "Pro", "Pro Max", "VIP"];
const ROLE_OPTIONS = [
  { value: "trader", label: "تریدر" },
  { value: "professional", label: "حرفه‌ای" },
  { value: "master", label: "استاد" },
  { value: "admin", label: "مدیر" },
  { value: "vip", label: "ویژه" },
  { value: "trader-vip", label: "تریدر ویژه" },
  { value: "professional-vip", label: "حرفه‌ای ویژه" },
  { value: "master-vip", label: "استاد ویژه" },
];

export function UsersManager() {
  const { userQuery, setUserQuery } = useAdminContext();
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [planTarget, setPlanTarget] = useState<AdminUser | null>(null);
  const [userPage, setUserPage] = useState(1);
  const USER_PAGE_SIZE = 20;
  const userTotalPages = Math.max(1, Math.ceil(totalCount / USER_PAGE_SIZE));

  useEffect(() => { setUserPage(1); }, [userQuery]);

  useEffect(() => {
    let alive = true;
    fetchUsers(userPage, USER_PAGE_SIZE, userQuery)
      .then((page) => { if (alive) { setRows(page.results); setTotalCount(page.count); } })
      .catch(() => alive && toast.error("دریافت کاربران از سرور ممکن نشد"));
    return () => { alive = false; };
  }, [userPage, userQuery]);
  const [newPlan, setNewPlan] = useState("Pro");
  const [details, setDetails] = useState<AdminUser | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null);
  const [emailTarget, setEmailTarget] = useState<AdminUser | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState("trader");
  const [userPaymentsList, setUserPaymentsList] = useState<Payment[]>([]);

  useEffect(() => {
    let alive = true;
    fetchPayments()
      .then((list) => alive && setUserPaymentsList(list))
      .catch(() => alive && toast.error("دریافت پرداخت‌ها از سرور ممکن نشد"));
    return () => { alive = false; };
  }, []);

  const userSafePage = Math.min(userPage, userTotalPages);
  const userPayments = (name: string) => userPaymentsList.filter((p) => p.user === name);

  async function applyPlan() {
    if (!planTarget) return;
    try {
      const updated = await updateUser(planTarget.id, { plan: newPlan });
      setRows((list) => list.map((u) => (u.id === planTarget.id ? updated : u)));
      toast.success(`پلن ${planTarget.name} بدون پرداخت به ${newPlan} تغییر کرد`);
      setPlanTarget(null);
    } catch (err) {
      toast.error(`تغییر پلن ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function applyEmail() {
    if (!emailTarget) return;
    const value = newEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("ایمیل معتبر نیست");
      return;
    }
    try {
      const updated = await updateUser(emailTarget.id, { email: value });
      setRows((list) => list.map((u) => (u.id === emailTarget.id ? updated : u)));
      toast.success("ایمیل کاربر تغییر کرد و در Audit Log ثبت شد");
      setEmailTarget(null);
    } catch (err) {
      toast.error(`تغییر ایمیل ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function applyRole() {
    if (!roleTarget) return;
    try {
      const updated = await updateUser(roleTarget.id, { role: newRole });
      setRows((list) => list.map((u) => (u.id === roleTarget.id ? updated : u)));
      const rl = ROLE_OPTIONS.find((r) => r.value === newRole)?.label ?? newRole;
      toast.success(`نقش ${roleTarget.name} به «${rl}» تغییر کرد`);
      setRoleTarget(null);
    } catch (err) {
      toast.error(`تغییر نقش ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function removeUser() {
    if (!removeTarget) return;
    try {
      await deleteUser(removeTarget.id);
      setRows((list) => list.filter((u) => u.id !== removeTarget.id));
      toast.success(`کاربر ${removeTarget.name} حذف شد`);
      setRemoveTarget(null);
    } catch (err) {
      toast.error(`حذف کاربر ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function toggleStatus(u: AdminUser) {
    const next = u.status === "فعال" ? "غیرفعال" : "فعال";
    try {
      const updated = await updateUser(u.id, { status: next });
      setRows((list) => list.map((r) => (r.id === u.id ? updated : r)));
      toast.success(`وضعیت ${u.name} به ${next} تغییر کرد`);
    } catch (err) {
      toast.error(`تغییر وضعیت ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  return (
    <div className="card-surface p-5">
      <TableSearch value={userQuery} onChange={setUserQuery} placeholder="جستجوی کاربر، ایمیل، پلن..." />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="py-3 text-right">کاربر</th>
              <th className="py-3 text-right">ایمیل</th>
              <th className="py-3 text-right">نقش</th>
              <th className="py-3 text-right">پلن</th>
              <th className="py-3 text-right">وضعیت</th>
              <th className="py-3 text-right">تاریخ عضویت</th>
              <th className="py-3 text-right">تراکنش‌ها</th>
              <th className="py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
                <td className="py-3 font-medium">{u.name}</td>
                <td className="py-3 text-muted-foreground">{u.email}</td>
                <td className="py-3">
                  <Badge variant="outline" className={
                    u.role === "vip" || u.role?.includes("vip") ? "border-accent/40 bg-accent/10 text-accent" :
                    u.role === "admin" ? "border-destructive/40 bg-destructive/10 text-destructive" :
                    u.role === "master" || u.role === "master-vip" ? "border-primary/40 bg-primary/10 text-primary" :
                    u.role === "professional" || u.role === "professional-vip" ? "border-secondary-foreground/30 bg-secondary/20" :
                    ""
                  }>
                    {ROLE_OPTIONS.find((r) => r.value === u.role)?.label ?? u.role ?? "تریدر"}
                  </Badge>
                </td>
                <td className="py-3">
                  <Badge variant="outline" className={u.plan === "Pro Max" ? "border-primary/40 bg-primary/10 text-primary" : ""}>
                    {u.plan}
                  </Badge>
                </td>
                <td className="py-3">
                  <Badge
                    variant="outline"
                    className={u.status === "فعال" ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}
                  >
                    {u.status}
                  </Badge>
                </td>
                <td className="py-3 text-xs text-muted-foreground tabular">{u.joined}</td>
                <td className="py-3 text-xs tabular text-muted-foreground">{userPayments(u.name).length} مورد</td>
                <td className="py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onSelect={() => setDetails(u)}>
                        <Eye className="ml-2 h-4 w-4" /> جزئیات و ریز تراکنش‌ها
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => { setNewPlan(u.plan); setPlanTarget(u); }}>
                        <CreditCard className="ml-2 h-4 w-4" /> تغییر پلن بدون پرداخت
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => { setNewEmail(u.email); setEmailTarget(u); }}>
                        <Mail className="ml-2 h-4 w-4" /> تغییر ایمیل کاربر
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => { setNewRole(u.role ?? "trader"); setRoleTarget(u); }}>
                        <ShieldAlert className="ml-2 h-4 w-4" /> تغییر نقش
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => toggleStatus(u)}>
                        <Activity className="ml-2 h-4 w-4" /> {u.status === "فعال" ? "غیرفعال کردن" : "فعال کردن"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setRemoveTarget(u)}>
                        <Trash2 className="ml-2 h-4 w-4" /> حذف کاربر
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">کاربری پیدا نشد.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalCount > USER_PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            نمایش {(userSafePage - 1) * USER_PAGE_SIZE + 1}–{Math.min(userSafePage * USER_PAGE_SIZE, totalCount)} از {totalCount} کاربر
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={userSafePage <= 1} onClick={() => setUserPage((p) => Math.max(1, p - 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(userTotalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (userTotalPages <= 7) pageNum = i + 1;
              else if (userSafePage <= 4) pageNum = i + 1;
              else if (userSafePage >= userTotalPages - 3) pageNum = userTotalPages - 6 + i;
              else pageNum = userSafePage - 3 + i;
              return (
                <Button key={pageNum} variant={pageNum === userSafePage ? "default" : "outline"} size="sm"
                  className={pageNum === userSafePage ? "bg-primary text-primary-foreground" : ""}
                  onClick={() => setUserPage(pageNum)}>
                  {pageNum}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={userSafePage >= userTotalPages} onClick={() => setUserPage((p) => Math.min(userTotalPages, p + 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Change email */}
      <Dialog open={emailTarget !== null} onOpenChange={(o) => !o && setEmailTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر ایمیل {emailTarget?.name}</DialogTitle>
            <DialogDescription>تغییر ایمیل فقط توسط مدیر ممکن است و به‌صورت خودکار در Audit Log ثبت می‌شود.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <Label>ایمیل جدید</Label>
            <Input dir="ltr" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="bg-secondary/60 text-left" />
          </div>
          <DialogFooter className="mt-6">
            <DialogClose asChild><Button type="button" variant="outline">انصراف</Button></DialogClose>
            <Button onClick={applyEmail} className="bg-primary text-primary-foreground hover:bg-primary/90">ثبت ایمیل جدید</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change role */}
      <Dialog open={roleTarget !== null} onOpenChange={(o) => !o && setRoleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر نقش {roleTarget?.name}</DialogTitle>
            <DialogDescription>نقش کاربر را انتخاب کنید.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <Label>نقش جدید</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (<SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-6">
            <DialogClose asChild><Button type="button" variant="outline">انصراف</Button></DialogClose>
            <Button onClick={applyRole} className="bg-primary text-primary-foreground hover:bg-primary/90">اعمال نقش</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change plan */}
      <Dialog open={planTarget !== null} onOpenChange={(o) => !o && setPlanTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر پلن {planTarget?.name}</DialogTitle>
            <DialogDescription>پلن به‌صورت دستی و بدون نیاز به پرداخت اعمال می‌شود.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <Label>پلن جدید</Label>
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-6">
            <DialogClose asChild><Button type="button" variant="outline">انصراف</Button></DialogClose>
            <Button onClick={applyPlan} className="bg-primary text-primary-foreground hover:bg-primary/90">اعمال پلن</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details + transactions */}
      <Dialog open={details !== null} onOpenChange={(o) => !o && setDetails(null)}>
        <DialogContent className="max-w-2xl">
          {details && (
            <>
              <DialogHeader>
                <DialogTitle>{details.name}</DialogTitle>
                <DialogDescription>{details.email}</DialogDescription>
              </DialogHeader>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="text-xs text-muted-foreground">پلن</div>
                  <div className="mt-1 font-medium">{details.plan}</div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="text-xs text-muted-foreground">وضعیت</div>
                  <div className="mt-1 font-medium">{details.status}</div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="text-xs text-muted-foreground">عضویت</div>
                  <div className="mt-1 font-medium tabular">{details.joined}</div>
                </div>
              </div>
              <div className="mt-5">
                <h4 className="text-sm font-semibold">ریز تراکنش‌ها</h4>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="py-2 text-right">شناسه</th>
                        <th className="py-2 text-right">پلن</th>
                        <th className="py-2 text-right">مبلغ</th>
                        <th className="py-2 text-right">تاریخ</th>
                        <th className="py-2 text-right">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userPayments(details.name).map((p) => (
                        <tr key={p.id} className="border-b border-border/50 last:border-0">
                          <td className="py-2 text-xs tabular text-muted-foreground">{p.id}</td>
                          <td className="py-2">{p.plan}</td>
                          <td className="py-2 tabular">{p.amount}</td>
                          <td className="py-2 text-xs tabular text-muted-foreground">{p.date}</td>
                          <td className="py-2">
                            <Badge variant="outline" className={p.status === "موفق" ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}>{p.status}</Badge>
                          </td>
                        </tr>
                      ))}
                      {userPayments(details.name).length === 0 && (
                        <tr><td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">تراکنشی ثبت نشده است.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={removeTarget !== null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>حذف کاربر</DialogTitle>
            <DialogDescription>کاربر «{removeTarget?.name}» و تمام داده‌هایش حذف می‌شود. این عمل قابل بازگشت نیست.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <DialogClose asChild><Button type="button" variant="outline">انصراف</Button></DialogClose>
            <Button variant="destructive" onClick={removeUser}>حذف قطعی</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── News Manager ───────────────────────────────────────────────────

const NEWS_CATEGORIES: NewsCategory[] = ["تخفیف", "آپدیت", "اطلاعیه", "آموزش"];

export function NewsManager() {
  const { news, saveNews, deleteNews, pushNotification } = usePlatform();
  const [draft, setDraft] = useState<NewsItem | null>(null);

  function blank(): NewsItem {
    return { id: `N-${Date.now()}`, title: "", summary: "", body: "", category: "اطلاعیه", date: new Date().toLocaleDateString("fa-IR"), pinned: false };
  }

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Megaphone className="h-4 w-4 text-primary" /> اخبار و اطلاعیه‌ها
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setDraft(blank())}>
          <Plus className="ml-1 h-4 w-4" /> خبر جدید
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {news.map((n) => (
          <div key={n.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/50 p-3">
            <Badge variant="outline">{n.category}</Badge>
            <span className="text-sm font-medium">{n.title}</span>
            <span className="text-xs text-muted-foreground tabular">{n.date}</span>
            <div className="mr-auto flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="ویرایش خبر" onClick={() => setDraft(n)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" aria-label="حذف خبر"
                onClick={() => { deleteNews(n.id); toast.success("خبر حذف شد"); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {news.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">خبری ثبت نشده است.</div>}
      </div>

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {draft && (
            <>
              <DialogHeader>
                <DialogTitle>{news.some((n) => n.id === draft.id) ? "ویرایش خبر" : "خبر جدید"}</DialogTitle>
                <DialogDescription>خبر منتشرشده در صفحه اخبار و اعلانات کاربران نمایش داده می‌شود.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>عنوان</Label>
                  <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="bg-secondary/60" />
                </div>
                <div className="space-y-2">
                  <Label>دسته‌بندی</Label>
                  <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v as NewsCategory })}>
                    <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {NEWS_CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>خلاصه (برای اعلان)</Label>
                  <Input value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} className="bg-secondary/60" />
                </div>
                <div className="space-y-2">
                  <Label>متن کامل</Label>
                  <RichTextEditor value={draft.body} onChange={(body) => setDraft({ ...draft, body })} placeholder="متن کامل خبر را اینجا بنویس..." minHeight={200} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label>سنجاق کردن به بالای لیست</Label>
                  <Switch checked={draft.pinned} onCheckedChange={(v) => setDraft({ ...draft, pinned: v })} />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <DialogClose asChild><Button variant="outline">انصراف</Button></DialogClose>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
                  if (!draft.title.trim() || !draft.summary.trim()) { toast.error("عنوان و خلاصه الزامی است"); return; }
                  const isNew = !news.some((n) => n.id === draft.id);
                  saveNews(draft);
                  if (isNew) pushNotification({ kind: "news", title: draft.title, desc: draft.summary, link: `/app/news/${draft.id}` });
                  toast.success(isNew ? "خبر منتشر شد" : "خبر به‌روزرسانی شد");
                  setDraft(null);
                }}>ذخیره و انتشار</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tickets Manager ────────────────────────────────────────────────

const TICKET_STATUSES: TicketStatus[] = ["باز", "در حال بررسی", "پاسخ داده شد", "بسته"];

export function TicketsManager() {
  const { tickets, replyTicket, setTicketStatus } = usePlatform();
  const [activeId, setActiveId] = useState<string | null>(tickets[0]?.id ?? null);
  const [reply, setReply] = useState("");
  const active = tickets.find((t) => t.id === activeId) ?? tickets[0];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-2">
        {tickets.map((t) => (
          <button key={t.id} onClick={() => setActiveId(t.id)}
            className={`card-surface w-full p-4 text-right ${active?.id === t.id ? "border-primary/50" : ""}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground tabular">{t.id}</span>
              <Badge variant="outline">{t.status}</Badge>
            </div>
            <div className="mt-2 text-sm font-medium">{t.subject}</div>
            <div className="mt-1 text-xs text-muted-foreground">{t.user} • {t.topic}</div>
          </button>
        ))}
        {tickets.length === 0 && <div className="card-surface p-6 text-center text-sm text-muted-foreground">تیکتی وجود ندارد.</div>}
      </div>
      <div className="lg:col-span-2">
        {active && (
          <div className="card-surface p-5">
            <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
              <LifeBuoy className="h-4 w-4 text-primary" />
              <span className="font-semibold">{active.subject}</span>
              <span className="text-xs text-muted-foreground">{active.email}</span>
              <div className="mr-auto w-40">
                <Select value={active.status} onValueChange={(v) => setTicketStatus(active.id, v as TicketStatus)}>
                  <SelectTrigger className="h-8 bg-secondary/60 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {active.messages.map((m) => (
                <div key={m.id} className={`rounded-lg border p-3 text-sm ${m.author === "admin" ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/40"}`}>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{m.authorName}</span><span className="tabular">{m.time}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line leading-relaxed">{m.body}</p>
                  {m.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.attachments.map((src, i) => (
                        <img key={i} src={src} alt="پیوست" className="h-16 w-16 rounded border border-border object-cover" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="پاسخ پشتیبانی..." className="bg-secondary/60" />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
                if (!reply.trim()) { toast.error("متن پاسخ خالی است"); return; }
                replyTicket(active.id, { author: "admin", body: reply.trim(), attachments: [] });
                setReply("");
                toast.success("پاسخ ارسال و اعلان برای کاربر ایجاد شد");
              }}>
                <Send className="ml-1 h-4 w-4" /> ارسال پاسخ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared Pagination ──────────────────────────────────────────────

function AdminPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Build visible page numbers with ellipsis
  const pages: (number | "...")[] = [];
  const addPage = (p: number) => {
    if (!pages.includes(p)) pages.push(p);
  };

  addPage(0);
  for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) addPage(i);
  addPage(totalPages - 1);

  // Insert ellipsis
  const withEllipsis: (number | "...")[] = [];
  let prev = -1;
  for (const p of pages) {
    if (typeof p === "number" && prev !== -1 && p - prev > 1) withEllipsis.push("...");
    withEllipsis.push(p);
    if (typeof p === "number") prev = p;
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {withEllipsis.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="flex h-8 w-8 items-center justify-center text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(p)}
          >
            {(p + 1).toLocaleString("fa-IR")}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Audit Log Panel ────────────────────────────────────────────────

const AUDIT_PAGE_SIZE = 8;

export function AuditLogPanel() {
  const { audit } = usePlatform();
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(audit.length / AUDIT_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = audit.slice(safePage * AUDIT_PAGE_SIZE, (safePage + 1) * AUDIT_PAGE_SIZE);

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="h-4 w-4 text-accent" /> Audit Log — تغییرات حساس
        </div>
        <span className="text-xs text-muted-foreground">
          {audit.length.toLocaleString("fa-IR")} رکورد
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {paged.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background/50 p-3 text-sm">
            <span className="text-xs text-muted-foreground tabular">{a.time}</span>
            <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent">{a.action}</Badge>
            <span className="font-medium">{a.target}</span>
            <span className="text-xs text-muted-foreground">{a.details}</span>
            <span className="mr-auto text-xs text-muted-foreground">{a.actor}</span>
          </div>
        ))}
        {audit.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">رویدادی ثبت نشده است.</div>}
      </div>
      {totalPages > 1 && (
        <AdminPagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
