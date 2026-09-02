import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wallet,
  LineChart,
  BookOpen,
  Sparkles,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  Target,
  Trophy,
  Settings,
  UserCog,
  Users,
  LogOut,
  Bell,
  Search,
  Plus,
  Menu,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Megaphone,
  LifeBuoy,
  PanelRightClose,
  PanelRightOpen,
  Lock,
  TrendingUp,
  Cpu,
  Activity,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { GuideTour } from "@/components/GuideTour";
import { ThemeToggle } from "@/lib/theme";
import { fullName, ONBOARDING_KEY, useCurrentUser, useHasPortfolio, useLocalState } from "@/lib/app-state";
import { usePlatform } from "@/lib/platform-store";
import { ROLE_NAMES, useJournalEntries, usePlanLimits, useProfile, useRole, useSubscription, useTrades, useUsers, type PlanFeature } from "@/lib/api";



const nav = [
  { to: "/app/dashboard", icon: LayoutDashboard, label: "داشبورد", feature: null, admin: false },
  { to: "/app/portfolios", icon: Wallet, label: "پرتفولیوها", feature: "portfolios" as PlanFeature, admin: false },
  { to: "/app/trades", icon: LineChart, label: "معاملات", feature: "trades" as PlanFeature, admin: false },
  { to: "/app/journal", icon: BookOpen, label: "ژورنال", feature: "journal" as PlanFeature, admin: false },
  { to: "/app/ai-coach", icon: Sparkles, label: "مربی هوشمند", feature: "ai-coach" as PlanFeature, admin: false },
  { to: "/app/calendar", icon: CalendarDays, label: "تقویم معاملاتی", feature: "calendar" as PlanFeature, admin: false },
  { to: "/app/risk", icon: ShieldCheck, label: "مدیریت ریسک", feature: "risk" as PlanFeature, admin: false },
  { to: "/app/goals", icon: Target, label: "اهداف", feature: "goals" as PlanFeature, admin: false },
  { to: "/app/achievements", icon: Trophy, label: "نشان‌ها", feature: "achievements" as PlanFeature, admin: false },
  { to: "/app/news", icon: Megaphone, label: "اخبار و اطلاعیه‌ها", feature: "news" as PlanFeature, admin: false },
  { to: "/app/support", icon: LifeBuoy, label: "پشتیبانی", feature: "support" as PlanFeature, admin: false },
  { to: "/app/settings", icon: Settings, label: "تنظیمات", feature: "settings" as PlanFeature, admin: false },
  { to: "/app/billing", icon: CreditCard, label: "خرید اشتراک", feature: null, admin: false },
  // Admin-only items
  { to: "/app/admin/dashboard", icon: LayoutDashboard, label: "داشبورد مدیریت", feature: null, admin: true },
  { to: "/app/admin/users", icon: Users, label: "مدیریت کاربران", feature: null, admin: true },
  { to: "/app/admin/payments", icon: CreditCard, label: "پرداخت‌ها", feature: null, admin: true },
  { to: "/app/admin/plans", icon: TrendingUp, label: "مدیریت پلن‌ها", feature: null, admin: true },
  { to: "/app/admin/news", icon: Megaphone, label: "اخبار (مدیریت)", feature: null, admin: true },
  { to: "/app/admin/tickets", icon: LifeBuoy, label: "پشتیبانی (مدیریت)", feature: null, admin: true },
  { to: "/app/admin/apis", icon: Cpu, label: "API هوش مصنوعی", feature: null, admin: true },
  { to: "/app/admin/audit", icon: ShieldAlert, label: "Audit Log", feature: null, admin: true },
  { to: "/app/admin/logs", icon: Activity, label: "لاگ‌ها", feature: null, admin: true },
] as const;

const staticNotifications = [
  { id: "S-1", kind: "system" as const, title: "نزدیک به سقف ریسک روزانه", desc: "به ۸۰٪ ریسک روزانه رسیدی.", time: "۵ دقیقه پیش", link: "/app/risk", read: false },
  { id: "S-2", kind: "system" as const, title: "نشان جدید کسب کردی", desc: "«۷ روز پایبند به پلن» فعال شد.", time: "دیروز", link: "/app/achievements", read: false },
];

function notifIcon(kind: string) {
  if (kind === "news") return Megaphone;
  if (kind === "ticket") return LifeBuoy;
  return AlertTriangle;
}

function UserBlock({ compact = false }: { compact?: boolean }) {
  const user = useCurrentUser();
  const profile = useProfile();
  const name = fullName(user);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join(".") || "کاربر";
  const subscription = useSubscription();
  const roleData = useRole();
  const roleKey = roleData?.effective ?? "trader";
  const roleName = ROLE_NAMES[roleKey] ?? "تریدر";
  const daysLeft = subscription?.daysLeft ?? 0;
  const totalDays = subscription?.totalDays ?? 1;
  const isAdmin = roleData?.effective === "admin";
  const planName = isAdmin ? null : (subscription?.plan ?? "رایگان");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2.5 text-right transition-colors hover:bg-sidebar-accent/70",
            compact && "border-0 bg-transparent p-1.5 hover:bg-sidebar-accent/40",
          )}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar ?? undefined} alt={name} className="object-cover" />
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1">
              {planName && (
                <Badge variant="outline" className={cn("h-4 px-1.5 text-[10px]", subscription ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-secondary/60 text-muted-foreground")}>
                  {planName}
                </Badge>
              )}
              <Badge variant="outline" className={cn("h-4 border-accent/40 bg-accent/10 px-1.5 text-[10px] text-accent", isAdmin && "border-primary/40 bg-primary/10 text-primary")}>
                {isAdmin ? "مدیر" : roleName}
              </Badge>
              {!isAdmin && subscription && (
                <Badge
                  variant="outline"
                  className="h-4 border-border bg-secondary/60 px-1.5 text-[10px] text-muted-foreground tabular"
                >
                  {daysLeft} روز
                </Badge>
              )}
            </div>
          </div>

          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>حساب کاربری</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          {isAdmin ? (
            <div className="text-xs text-muted-foreground">حساب مدیریتی — بدون محدودیت</div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">اشتراک {subscription?.plan ?? "—"}</span>
                <span className="font-medium text-primary tabular">{daysLeft} روز باقی‌مانده</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round((daysLeft / totalDays) * 100)}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">{subscription ? `پایان: ${subscription.endDate}` : "هنوز اشتراکی فعال نیست"}</div>
            </>
          )}
        </div>
        <DropdownMenuItem asChild>
          <Link to="/app/billing" className="cursor-pointer">
            <CreditCard className="ml-2 h-4 w-4" /> خرید / تمدید اشتراک
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/app/settings" className="cursor-pointer">
            <Settings className="ml-2 h-4 w-4" /> تنظیمات پروفایل
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/app/portfolios" className="cursor-pointer">
            <Wallet className="ml-2 h-4 w-4" /> پرتفولیوها
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onSelect={() => {
            localStorage.removeItem("dlea:access");
            localStorage.removeItem("dlea:refresh");
            localStorage.removeItem("dlea:user");
            localStorage.removeItem(ONBOARDING_KEY);
            window.location.href = "/login";
          }}
        >
          <LogOut className="ml-2 h-4 w-4" /> خروج از حساب
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavList({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const location = useLocation();
  const limits = usePlanLimits();
  const roleData = useRole();
  const roleLoaded = roleData !== null;
  const isAdmin = roleData?.effective === "admin";
  const [lockedFeature, setLockedFeature] = useState<PlanFeature | null>(null);
  const navigate = useNavigate();

  // While role is loading, show nothing to avoid flash
  const regularItems = !roleLoaded ? [] : (isAdmin ? [] : nav.filter((item) => !item.admin));
  const adminItems = nav.filter((item) => item.admin);

  function isActive(item: typeof nav[number]) {
    return location.pathname === item.to;
  }

  return (
    <>
    <ul className="space-y-1">
      {regularItems.map((item) => {
        const active = isActive(item);
        const Icon = item.icon;
        const locked = item.feature !== null && !limits.features.includes(item.feature);
        return (
          <li key={item.to}>
            {locked ? (
              <button
                onClick={() => setLockedFeature(item.feature!)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  collapsed && "justify-center px-0",
                  "text-sidebar-foreground/40 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground/60",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0 opacity-50")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && <Lock className="mr-auto h-3 w-3 text-amber-500" />}
              </button>
            ) : (
              <Link
                to={item.to}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {active && !collapsed && <span className="mr-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
            )}
          </li>
        );
      })}
    </ul>

    {/* Admin section */}
    {isAdmin && adminItems.length > 0 && (
      <>
        {!collapsed && (
          <div className="mt-4 mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            مدیریت
          </div>
        )}
        {collapsed && <div className="my-2 mx-3 border-t border-sidebar-border" />}
        <ul className="space-y-1">
          {adminItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <button
                  onClick={() => {
                    navigate({ to: item.to });
                    onNavigate?.();
                  }}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {active && !collapsed && <span className="mr-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      </>
    )}

    {/* Upgrade dialog */}
    <Dialog open={lockedFeature !== null} onOpenChange={() => setLockedFeature(null)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" /> این بخش قفل است
          </DialogTitle>
          <DialogDescription>
            {lockedFeature === "ai-coach" && "مربی هوشمند فقط در پلن Pro و بالاتر فعال است."}
            {lockedFeature === "risk" && "مدیریت ریسک فقط در پلن Pro و بالاتر فعال است."}
            {lockedFeature === "mt-connection" && "اتصال MetaTrader فقط در پلن Pro و بالاتر فعال است."}
            {lockedFeature === "reports" && "گزارش‌های پیشرفته فقط در پلن Pro و بالاتر فعال است."}
            {lockedFeature === "psychology" && "تحلیل روانشناسی فقط در پلن Pro Max فعال است."}
            {!"ai-coach risk mt-connection reports psychology".includes(lockedFeature ?? "") &&
              `این بخش نیاز به ارتقای پلن دارد.`}
          </DialogDescription>
        </DialogHeader>
        <Button className="w-full bg-primary text-primary-foreground" onClick={() => { setLockedFeature(null); navigate({ to: "/app/billing" }); }}>
          <CreditCard className="ml-2 h-4 w-4" /> ارتقای پلن
        </Button>
      </DialogContent>
    </Dialog>
    </>
  );
}

const adminStaticNotifications = [
  { id: "AS-1", kind: "system" as const, title: "کاربر جدید ثبت‌نام کرد", desc: "یک کاربر جدید به تازگی در سیستم ثبت‌نام کرده است.", time: "۱۰ دقیقه پیش", link: "/app/admin/users", read: false },
  { id: "AS-2", kind: "system" as const, title: "اشتراک جدید فعال شد", desc: "یک کاربر اشتراک Pro را فعال کرد.", time: "۱ ساعت پیش", link: "/app/admin/payments", read: false },
  { id: "AS-3", kind: "system" as const, title: "تیکت پشتیبانی جدید", desc: "یک تیکت پشتیبانی جدید نیاز به بررسی دارد.", time: "۳ ساعت پیش", link: "/app/admin/tickets", read: false },
];

function NotificationsMenu() {
  const { notifications, markAllRead, markRead } = usePlatform();
  const navigate = useNavigate();
  const roleData4 = useRole();
  const isAdminNotif = roleData4?.effective === "admin";
  const all = isAdminNotif ? [...notifications, ...adminStaticNotifications] : [...notifications, ...staticNotifications];
  const unread = all.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-10 w-10 border-border bg-secondary/60" aria-label="اعلان‌ها">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{isAdminNotif ? "اعلان‌های مدیریت" : "اعلان‌ها"}</span>
          <button
            onClick={() => {
              markAllRead();
              toast.success("همه اعلان‌ها خوانده شد");
            }}
            className="text-[11px] text-primary hover:underline"
          >
            علامت‌گذاری همه
          </button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {all.map((n) => {
            const Icon = notifIcon(n.kind);
            return (
              <DropdownMenuItem
                key={n.id}
                className="cursor-pointer items-start gap-3 py-2.5"
                onSelect={() => {
                  markRead(n.id);
                  if (n.link) void navigate({ to: n.link });
                }}
              >
                <div
                  className={cn(
                    "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                    n.kind === "news" && "bg-accent/15 text-accent",
                    n.kind === "ticket" && "bg-primary/15 text-primary",
                    n.kind === "system" && "bg-destructive/15 text-destructive",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{n.title}</span>
                    {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground">{n.desc}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground/70">{n.time}</div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Global search across pages, trades and journal entries. */
function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const trades = useTrades();
  const journalEntries = useJournalEntries();
  const roleData3 = useRole();
  const isAdmin = roleData3?.effective === "admin";
  const allUsers = useUsers();

  const adminPages = nav.filter((n) => n.admin);
  const userPages = nav.filter((n) => !n.admin);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (isAdmin) {
      if (!term) return { pages: adminPages, trades: [], journals: [], users: [] } as const;
      return {
        pages: adminPages.filter((n) => n.label.toLowerCase().includes(term)),
        trades: [],
        journals: [],
        users: allUsers.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(term)).slice(0, 6),
      } as const;
    }
    if (!term) return { pages: userPages.slice(0, 5), trades: [], journals: [], users: [] } as const;
    return {
      pages: userPages.filter((n) => n.label.toLowerCase().includes(term)),
      trades: trades.filter((t) => `${t.symbol} ${t.id} ${t.ticket} ${t.strategy}`.toLowerCase().includes(term)).slice(0, 6),
      journals: journalEntries.filter((j) => `${j.title} ${j.symbol ?? ""}`.toLowerCase().includes(term)).slice(0, 5),
      users: [],
    } as const;
  }, [q, trades, journalEntries, isAdmin, allUsers]);

  function go(to: string) {
    setOpen(false);
    setQ("");
    void navigate({ to });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-10 w-full min-w-0 max-w-md items-center rounded-md border border-border bg-secondary/60 pr-9 pl-3 text-right text-sm text-muted-foreground transition-colors hover:border-primary/40"
      >
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <span className="truncate">{isAdmin ? "جستجو در بخش‌های مدیریت..." : "جستجو در صفحات، معاملات و ژورنال..."}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>جستجوی سریع</DialogTitle>
            <DialogDescription>{isAdmin ? "نام بخش مدیریت را بنویس." : "نام صفحه، نماد معامله، شماره تیکت یا عنوان ژورنال را بنویس."}</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="مثلاً EURUSD یا ژورنال"
            className="mt-2 bg-secondary/60"
          />
          <div className="mt-2 max-h-80 space-y-4 overflow-y-auto">
            {results.pages.length > 0 && (
              <div>
                <div className="mb-1 text-[11px] text-muted-foreground">صفحات</div>
                {results.pages.map((p) => (
                  <button key={p.to} onClick={() => go(p.to)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-right text-sm hover:bg-secondary/70">
                    <p.icon className="h-4 w-4 text-primary" /> {p.label}
                  </button>
                ))}
              </div>
            )}
            {results.trades.length > 0 && (
              <div>
                <div className="mb-1 text-[11px] text-muted-foreground">معاملات</div>
                {results.trades.map((t) => (
                  <button key={t.id} onClick={() => go(`/app/trades/${t.id}`)} className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-right text-sm hover:bg-secondary/70">
                    <span>{t.symbol} • {t.id}</span>
                    <span className={cn("tabular", t.pnl >= 0 ? "gain" : "loss")}>${t.pnl}</span>
                  </button>
                ))}
              </div>
            )}
            {results.journals.length > 0 && (
              <div>
                <div className="mb-1 text-[11px] text-muted-foreground">ژورنال‌ها</div>
                {results.journals.map((j) => (
                  <button key={j.id} onClick={() => go("/app/journal")} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-right text-sm hover:bg-secondary/70">
                    <BookOpen className="h-4 w-4 text-primary" /> {j.title}
                  </button>
                ))}
              </div>
            )}
            {results.users && results.users.length > 0 && (
              <div>
                <div className="mb-1 text-[11px] text-muted-foreground">کاربران</div>
                {results.users.map((u) => (
                  <button key={u.id} onClick={() => go("/app/admin/users")} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-right text-sm hover:bg-secondary/70">
                    <Users className="h-4 w-4 text-primary" /> {u.name} <span className="text-xs text-muted-foreground">({u.email})</span>
                  </button>
                ))}
              </div>
            )}
            {q.trim() && results.pages.length + results.trades.length + results.journals.length + (results.users?.length ?? 0) === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">نتیجه‌ای پیدا نشد.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Onboarding gate: the first mandatory action is creating a portfolio. */
function PortfolioGate() {
  return (
    <div className="grid place-items-center py-10">
      <div className="card-surface max-w-lg p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Wallet className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-xl font-bold">اول یک پرتفولیو بساز</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          برای شروع کار با ژورنال، ساخت اولین پرتفولیو الزامی است. تا زمانی که پرتفولیو نسازی،
          بقیه بخش‌ها در دسترس نیستند.
        </p>
        <Link to="/app/portfolios" className="mt-6 inline-block">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="ml-1 h-4 w-4" /> ساخت اولین پرتفولیو
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function AppShell({ children, title, subtitle, actions }: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useLocalState<boolean>("tj:sidebar-collapsed", false);
  const location = useLocation();
  const [hasPortfolio, , onboardingReady] = useHasPortfolio();
  const user = useCurrentUser();
  const profile = useProfile();
  const initials = fullName(user)
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join(".") || "کاربر";
  const roleData2 = useRole();
  const roleLoaded = roleData2 !== null;
  const isAdminUser = roleData2?.effective === "admin";
  const locked =
    roleLoaded && !isAdminUser && onboardingReady && !hasPortfolio && location.pathname !== "/app/portfolios";


  return (
    <div className="min-h-screen w-full max-w-full bg-background text-foreground" style={{overflowX:"clip",maxWidth:"100%"}}>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden shrink-0 border-l border-sidebar-border bg-sidebar transition-all duration-200 lg:flex lg:flex-col",
            collapsed ? "w-[74px]" : "w-64",
          )}
        >
          <div className={cn("flex h-16 items-center gap-2 border-b border-sidebar-border px-5", collapsed && "justify-center px-2")}>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[var(--shadow-glow)]">
              <LineChart className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold">Dlea AI</span>
                <span className="text-[10px] text-muted-foreground">ژورنال هوشمند معامله‌گران</span>
              </div>
            )}
          </div>

          {/* User block on TOP of main menu */}
          <div className={cn("border-b border-sidebar-border p-3", collapsed && "flex justify-center px-2")}>
            {collapsed ? (
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar ?? undefined} alt="avatar" className="object-cover" />
                <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">{initials}</AvatarFallback>
              </Avatar>
            ) : (
              <UserBlock />
            )}
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            {!collapsed && (
              <div className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                منو
              </div>
            )}
            <NavList collapsed={collapsed} />
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <Button
              variant="outline"
              size="sm"
              className={cn("w-full gap-2 border-sidebar-border bg-sidebar-accent/40", collapsed && "px-0")}
              aria-label={collapsed ? "باز کردن منو" : "جمع کردن منو"}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <PanelRightOpen className="h-4 w-4" /> : <><PanelRightClose className="h-4 w-4" /> جمع کردن منو</>}
            </Button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 overflow-hidden border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-8">
            {/* Mobile/Tablet menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 border-border bg-secondary/60 lg:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 border-l border-sidebar-border bg-sidebar p-0">
                <SheetTitle className="sr-only">منوی اصلی</SheetTitle>
                <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[var(--shadow-glow)]">
                    <LineChart className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-bold">Dlea AI</span>
                    <span className="text-[10px] text-muted-foreground">ژورنال هوشمند معامله‌گران</span>
                  </div>
                </div>
                <div className="border-b border-sidebar-border p-3">
                  <UserBlock />
                </div>
                <nav className="flex-1 overflow-y-auto p-3">
                  <div className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    منو
                  </div>
                  <NavList onNavigate={() => setMobileOpen(false)} />
                </nav>
              </SheetContent>
            </Sheet>

            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
              <div className="min-w-0 max-w-md flex-1">
                <GlobalSearch />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ThemeToggle />
                <GuideTour path={location.pathname} locked={locked} />
                <NotificationsMenu />
                {roleLoaded && !isAdminUser && (
                  <>
                    <Link to="/app/trades/new" className="hidden sm:block">
                      <Button size="sm" className="h-10 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="h-4 w-4" />
                        معامله جدید
                      </Button>
                    </Link>
                    <Link to="/app/trades/new" className="sm:hidden">
                      <Button size="icon" className="h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Page header */}
          <div className="overflow-hidden border-b border-border bg-background/40 px-4 py-6 md:px-8">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 overflow-hidden sm:flex sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold tracking-tight">{locked ? "شروع کار" : title}</h1>
                {subtitle && !locked && (
                  <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
              {actions && !locked && <div className="shrink-0">{actions}</div>}
            </div>
          </div>

          <main className="flex-1 p-4 md:p-8">
            {locked ? <PortfolioGate /> : children}
          </main>


        </div>
      </div>
    </div>
  );
}
