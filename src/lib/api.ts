/**
 * Typed API client for the Dlea Django backend.
 *
 * Every endpoint mirrors a named export that used to live in `mock-data.ts`,
 * so pages can swap `import { trades } from "@/lib/mock-data"` for
 * `const trades = useTrades()` with no other changes. All fetches happen in
 * `useEffect`, so SSR renders keep working (they see empty defaults).
 */
import { useEffect, useState } from "react";
import type {
  Achievement,
  ArchivedReport,
  EconomicEvent,
  JournalEntry,
  JournalGroup,
  Plan,
  Trade,
  TradeColumn,
} from "@/lib/mock-data";
import type { CoachPeriod, CoachScope } from "@/lib/ai-coach-data";
import type {
  AppNotification,
  AuditEntry,
  NewsItem,
  Ticket,
} from "@/lib/platform-store";

export type {
  Achievement,
  ArchivedReport,
  EconomicEvent,
  JournalEntry,
  JournalGroup,
  Plan,
  Trade,
  TradeColumn,
} from "@/lib/mock-data";
export type { CoachPeriod } from "@/lib/ai-coach-data";
export type {
  AppNotification,
  AuditEntry,
  NewsItem,
  Ticket,
} from "@/lib/platform-store";

export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:8000/api";

/* ------------------------------------------------------------------ */
/* Types — API contract                                                */
/* ------------------------------------------------------------------ */

export type Portfolio = {
  id: string;
  name: string;
  broker: string;
  type: string;
  balance: number;
  initial: number;
  leverage: string;
  currency: string;
  trades: number;
  status: string;
  strategy: string;
};

export type Goal = {
  id: string;
  title: string;
  progress: number;
};

export type AchievementHistoryItem = {
  month: string;
  earned: string[];
  count: number;
};

export type RoleTier = {
  level: number;
  minPct: number;
  maxPct: number;
  name: string;
};

export type CalendarDay = {
  day: number | null;
  pnl: number;
  trades: number;
};

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  role?: string;
  joined: string;
};

export type Payment = {
  id: string;
  user: string;
  plan: string;
  amount: string;
  date: string;
  status: string;
};

export type ReferralLink = {
  id: string;
  name: string;
  code: string;
  clicks: number;
  signups: number;
};

export type Subscription = {
  plan: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  daysLeft: number;
  price: string;
};

export type EquityPoint = { day: string; equity: number; balance: number };
export type MonthlyPerformance = { month: string; pnl: number };
export type WinLossSlice = { name: string; value: number; color: string };

export type DashboardPayload = {
  equityCurve: EquityPoint[];
  winLossData: WinLossSlice[];
  monthlyPerformance: MonthlyPerformance[];
  economicEvents: EconomicEvent[];
  bestTrade: { symbol: string; pnl: number; rr: number; date: string } | null;
  worstTrade: { symbol: string; pnl: number; rr: number; date: string } | null;
  tradeCount: number;
  totalPnl: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
};

export type AiCoachModel = { id: string; name: string; desc: string };

export type AiInsights = {
  scores: { label: string; value: number }[];
  strengths: { title: string; keepDoing: string }[];
  weaknesses: { title: string; solution: string }[];
  suggestions: string[];
  behaviors: { name: string; count: number }[];
  models: AiCoachModel[];
  dailyReport: {
    date: string;
    summary: string;
    stats: { label: string; value: string }[];
    highlights: string[];
  };
  weeklyReport: {
    range: string;
    summary: string;
    stats: { label: string; value: string }[];
    highlights: string[];
  };
};

/* ------------------------------------------------------------------ */
/* Transport                                                           */
/* ------------------------------------------------------------------ */

function getAccessToken(): string | null {
  try {
    return window.localStorage.getItem("dlea:access");
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  // Don't set Content-Type for FormData — browser sets it with boundary
  if (!(init?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/${path.replace(/^\//, "")}`, {
    headers,
    ...init,
  });
  if (!res.ok) {
    let detail = `API ${res.status}: ${path}`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body?.detail) detail = body.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    // DRF returns 204 No Content for DELETE — there is no body to parse.
    return undefined as T;
  }
  const text = await res.text();
  if (!text) return undefined as T;
  const data = JSON.parse(text) as unknown;
  // DRF pagination wrapper: { count, next, previous, results }
  // Only unwrap when it's the standard DRF pagination (no extra fields like page/page_size)
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    const keys = Object.keys(data as object);
    const isStandardDRF = keys.every((k) => ["count", "next", "previous", "results"].includes(k));
    if (isStandardDRF) {
      return (data as { results: T }).results;
    }
  }
  return data as T;
}

export function get<T>(path: string) {
  return request<T>(path);
}

export function post<T>(path: string, body?: unknown) {
  return request<T>(path, { method: "POST", body: body == null ? undefined : JSON.stringify(body) });
}

export function patch<T>(path: string, body?: unknown) {
  return request<T>(path, { method: "PATCH", body: body == null ? undefined : JSON.stringify(body) });
}

export function del<T>(path: string) {
  return request<T>(path, { method: "DELETE" });
}

export function put<T>(path: string, body?: unknown) {
  return request<T>(path, { method: "PUT", body: body == null ? undefined : JSON.stringify(body) });
}

/** POST with raw body (e.g. FormData for file uploads) — no Content-Type header. */
export function postRaw<T>(path: string, body: FormData) {
  return request<T>(path, { method: "POST", body });
}

/* ------------------------------------------------------------------ */
/* Fetchers                                                            */
/* ------------------------------------------------------------------ */

export const fetchDashboard = (portfolioId?: string) => get<DashboardPayload>(portfolioId ? `dashboard/?portfolio=${portfolioId}` : "dashboard/");
export const fetchTrades = (portfolioId?: string) => get<Trade[]>(portfolioId ? `trades/?portfolio=${portfolioId}` : "trades/");
export const fetchPortfolios = () => get<Portfolio[]>("portfolios/");
export const activatePortfolio = (id: string) => post<Portfolio>(`portfolios/${id}/activate/`, {});
export const fetchJournalGroups = (portfolioId?: string) => get<JournalGroup[]>(portfolioId ? `journal/groups/?portfolio=${portfolioId}` : "journal/groups/");
export const fetchJournalEntries = (portfolioId?: string) => get<JournalEntry[]>(portfolioId ? `journal/entries/?portfolio=${portfolioId}` : "journal/entries/");
export const fetchGoals = (portfolioId?: string) => get<Goal[]>(portfolioId ? `goals/?portfolio=${portfolioId}` : "goals/");
export const fetchAchievements = () => get<Achievement[]>("achievements/");
export const fetchAchievementHistory = () => get<AchievementHistoryItem[]>("achievement-history/");
export const fetchRoleTiers = () => get<RoleTier[]>("role-tiers/");
export const fetchCalendarDays = () => get<CalendarDay[]>("calendar/");
export const fetchPlans = () => get<Plan[]>("plans/");
export type AdminStats = { total_users: number; active_subscriptions: number; monthly_revenue: number; total_trades: number; ai_calls: number };
export const fetchAdminStats = () => get<AdminStats>("admin/stats/");
export type AdminCharts = {
  user_growth: { month: string; users: number }[];
  revenue: { month: string; revenue: number }[];
  plan_distribution: { name: string; value: number; color: string }[];
};
export const fetchAdminCharts = () => get<AdminCharts>("admin/charts/");
export type AiApiInfo = { name: string; endpoint: string; requests: number; tokens_in: number; tokens_out: number };
export type AdminAiApis = { apis: AiApiInfo[]; gemini_configured: boolean };
export const fetchAdminAiApis = () => get<AdminAiApis>("admin/ai-apis/");
export type UsersPage = { count: number; page: number; page_size: number; results: PlatformUser[] };
export const fetchUsers = (page = 1, pageSize = 20, search = "") =>
  get<UsersPage>(`admin/users/?page=${page}&page_size=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ""}`);
export const fetchPayments = () => get<Payment[]>("admin/payments/");
export const fetchReferralLinks = () => get<ReferralLink[]>("admin/referrals/");
export const fetchSubscription = async (): Promise<Subscription | null> => {
  const list = await get<Subscription[]>("subscription/");
  return list[0] ?? null;
};
export const fetchAiInsights = () => get<AiInsights>("coach/insights/");
export const fetchCoachPeriods = () => get<CoachPeriod[]>("coach/periods/");

export type GeneratedCoachReport = CoachPeriod & { _generated?: boolean };

export function generateCoachReport(scope: CoachScope, model?: string) {
  return post<GeneratedCoachReport>("coach/generate/", { scope, model });
}
export const fetchArchivedReports = () => get<ArchivedReport[]>("coach/archive/");
export const fetchEconomicEvents = () => get<EconomicEvent[]>("economic-events/");
export const fetchForexSymbols = () => get<{ code: string }[]>("forex-symbols/");
export const fetchStrategies = () => get<{ name: string }[]>("strategies/");
export const fetchTradeColumns = () => get<TradeColumn[]>("trade-columns/");
export const fetchNews = () => get<NewsItem[]>("news/");
export const fetchTickets = () => get<Ticket[]>("tickets/");
export const fetchNotifications = () => get<AppNotification[]>("notifications/");
export const fetchAudit = () => get<AuditEntry[]>("audit/");

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export type PortfolioInput = {
  name: string;
  broker: string;
  type?: string;
  balance?: number;
  initial?: number;
  leverage?: string;
  currency?: string;
  trades?: number;
  status?: string;
  strategy?: string;
};

export function createPortfolio(input: PortfolioInput) {
  return post<Portfolio>("portfolios/", input);
}

export function updatePortfolio(id: string, changes: Partial<PortfolioInput>) {
  return patch<Portfolio>(`portfolios/${id}/`, changes);
}

export function deletePortfolio(id: string) {
  return del<{ ok: boolean }>(`portfolios/${id}/`);
}

export type TradeInput = {
  ticket: string;
  symbol: string;
  side: "buy" | "sell";
  entry?: number;
  exit?: number;
  sl?: number;
  tp?: number;
  volume?: number;
  pnl?: number;
  rr?: number;
  pips?: number;
  commission?: number;
  swap?: number;
  taxes?: number;
  open_time?: string;
  close_time?: string;
  magic?: number;
  comment?: string;
  reason?: string;
  strategy?: string;
  portfolio_id?: number;
  followedPlan?: boolean;
  emotion?: string;
  screenshots?: string[];
};

export function createTrade(input: TradeInput) {
  return post<Trade>("trades/", input);
}

export function bulkImportTrades(items: TradeInput[]) {
  return post<{ created: number; total: number; errors?: { index: number; detail: unknown }[] }>(
    "trades/import/",
    items,
  );
}

export function updateTrade(id: string, changes: Partial<TradeInput>) {
  return patch<Trade>(`trades/${id}/`, changes);
}

export function updateTradeScreenshots(id: string, screenshots: string[]) {
  return updateTrade(id, { screenshots });
}

export function updateUser(id: string, changes: Partial<Pick<PlatformUser, "plan" | "email" | "status" | "role">>) {
  return patch<PlatformUser>(`admin/users/${id}/`, changes);
}

export function deleteUser(id: string) {
  return del<{ ok: boolean }>(`admin/users/${id}/`);
}

export type GoalInput = { title: string; progress?: number };

export function createGoal(input: GoalInput) {
  return post<Goal>("goals/", input);
}

export function updateGoal(id: string, changes: Partial<GoalInput>) {
  return patch<Goal>(`goals/${id}/`, changes);
}

export function deleteGoal(id: string) {
  return del<{ ok: boolean }>(`goals/${id}/`);
}

export type JournalGroupInput = { name: string; color?: string };

export function createJournalGroup(input: JournalGroupInput) {
  return post<JournalGroup>("journal/groups/", input);
}

export function renameJournalGroup(id: string, changes: Partial<JournalGroupInput>) {
  return patch<JournalGroup>(`journal/groups/${id}/`, changes);
}

export function deleteJournalGroup(id: string) {
  return del<{ ok: boolean }>(`journal/groups/${id}/`);
}

export type JournalEntryInput = {
  title: string;
  symbol?: string;
  tradeId?: string;
  emotion?: string;
  mistakes?: string;
  lesson?: string;
  plan?: boolean;
  favorite?: boolean;
  group_id?: number | string | null;
  html?: string;
  images?: string[];
  entryDate?: string;
};

export function createJournalEntry(input: JournalEntryInput) {
  return post<JournalEntry>("journal/entries/", input);
}

export function updateJournalEntry(id: string, changes: Partial<JournalEntryInput>) {
  return patch<JournalEntry>(`journal/entries/${id}/`, changes);
}

export function deleteJournalEntry(id: string) {
  return del<{ ok: boolean }>(`journal/entries/${id}/`);
}

export function updateJournalFavorite(id: string, favorite: boolean) {
  return updateJournalEntry(id, { favorite });
}

/* ------------------------------------------------------------------ */
/* Profile (avatar + phone)                                            */
/* ------------------------------------------------------------------ */

export type UserProfile = {
  id: number | string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string | null;
};

export const fetchProfile = () => get<UserProfile>("profile/");

export async function updateProfile(data: Partial<UserProfile> & { avatarFile?: File }) {
  const { avatarFile, ...rest } = data;
  if (avatarFile) {
    // Use FormData for file upload
    const formData = new FormData();
    if (rest.firstName !== undefined) formData.append("firstName", rest.firstName);
    if (rest.lastName !== undefined) formData.append("lastName", rest.lastName);
    if (rest.phone !== undefined) formData.append("phone", rest.phone);
    formData.append("avatar", avatarFile);
    return postRaw<UserProfile>("profile/", formData);
  }
  return put<UserProfile>("profile/", rest);
}

/* ------------------------------------------------------------------ */
/* useApi hook                                                         */
/* ------------------------------------------------------------------ */

export function useApi<T>(loader: () => Promise<T>, deps: readonly unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loader()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((e) => {
        if (!alive) return;
        setError(String(e instanceof Error ? e.message : e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, reload: () => setTick((t) => t + 1) };
}

import { getActivePortfolioId } from "@/lib/app-state";

/* ------------------------------------------------------------------ */
/* Named hooks — same names as the old mock-data exports               */
/* ------------------------------------------------------------------ */

export function useTrades(): Trade[] {
  const pid = getActivePortfolioId();
  return useApi(() => fetchTrades(pid ?? undefined), [pid]).data ?? [];
}

export function usePortfolios(): Portfolio[] {
  return useApi(fetchPortfolios).data ?? [];
}

export function useJournalGroups(): JournalGroup[] {
  const pid = getActivePortfolioId();
  return useApi(() => fetchJournalGroups(pid ?? undefined), [pid]).data ?? [];
}

export function useJournalEntries(): JournalEntry[] {
  const pid = getActivePortfolioId();
  return useApi(() => fetchJournalEntries(pid ?? undefined), [pid]).data ?? [];
}

export function useGoals(): Goal[] {
  const pid = getActivePortfolioId();
  return useApi(() => fetchGoals(pid ?? undefined), [pid]).data ?? [];
}

export function useAchievements(): Achievement[] {
  return useApi(fetchAchievements).data ?? [];
}

export function useAchievementHistory(): AchievementHistoryItem[] {
  return useApi(fetchAchievementHistory).data ?? [];
}

export function useRoleTiers(): RoleTier[] {
  return useApi(fetchRoleTiers).data ?? [];
}

export type UserRoleResponse = {
  autoRole: string;
  adminRole: string;
  effective: string;
};

export const ROLE_NAMES: Record<string, string> = {
  trader: "تریدر",
  professional: "حرفه‌ای",
  master: "استاد",
  admin: "مدیر",
  vip: "ویژه",
  "trader-vip": "تریدر ویژه",
  "professional-vip": "حرفه‌ای ویژه",
  "master-vip": "استاد ویژه",
};

export const fetchRole = () => get<UserRoleResponse>("role/");

export function useRole(): UserRoleResponse | null {
  return useApi(fetchRole).data ?? null;
}

export function useCalendarDays(): CalendarDay[] {
  return useApi(fetchCalendarDays).data ?? [];
}

export function usePlans(): Plan[] {
  return useApi(fetchPlans).data ?? [];
}

export function useUsers(): PlatformUser[] {
  const page = useApi(() => fetchUsers(1, 1000)).data;
  return page?.results ?? [];
}

export function usePayments(): Payment[] {
  return useApi(fetchPayments).data ?? [];
}

export function useReferralLinks(): ReferralLink[] {
  return useApi(fetchReferralLinks).data ?? [];
}

export function useSubscription(): Subscription | null {
  return useApi(fetchSubscription).data;
}

export function useProfile(): UserProfile | null {
  return useApi(fetchProfile).data;
}

export function useAiInsights(): AiInsights | null {
  return useApi(fetchAiInsights).data;
}

export function useCoachPeriods(): CoachPeriod[] {
  return useApi(fetchCoachPeriods).data ?? [];
}

export function useArchivedReports(): ArchivedReport[] {
  return useApi(fetchArchivedReports).data ?? [];
}

export function useDashboard(): DashboardPayload | null {
  const pid = getActivePortfolioId();
  return useApi(() => fetchDashboard(pid ?? undefined), [pid]).data;
}

export function useForexSymbols(): string[] {
  const symbols = useApi(fetchForexSymbols).data ?? [];
  return symbols.map((s) => s.code);
}

export function useStrategies(): string[] {
  const strategies = useApi(fetchStrategies).data ?? [];
  return strategies.map((s) => s.name);
}

export function useTradeColumns(): TradeColumn[] {
  return useApi(fetchTradeColumns).data ?? [];
}

export function useEconomicEvents(): EconomicEvent[] {
  return useApi(fetchEconomicEvents).data ?? [];
}

/* ------------------------------------------------------------------ */
/* Platform content (news / tickets / notifications / audit)           */
/* ------------------------------------------------------------------ */

export function useNews(): NewsItem[] {
  return useApi(fetchNews).data ?? [];
}

export function useTickets(): Ticket[] {
  return useApi(fetchTickets).data ?? [];
}

export function useNotifications(): AppNotification[] {
  return useApi(fetchNotifications).data ?? [];
}

export function useAudit(): AuditEntry[] {
  return useApi(fetchAudit).data ?? [];
}

/** Role tier lookup — pure, data-driven (no module-level constants). */
export function tierFor(earned: number, total: number, tiers: RoleTier[]): RoleTier {
  const pct = total ? (earned / total) * 100 : 0;
  return (
    tiers.find((t) => pct >= t.minPct && pct < t.maxPct) ??
    tiers[tiers.length - 1] ?? { level: 1, minPct: 0, maxPct: 100, name: "تریدر" }
  );
}

/* ------------------------------------------------------------------ */
/* Plan limits — feature gating per subscription tier                 */
/* ------------------------------------------------------------------ */

export type PlanFeature =
  | "portfolios"
  | "trades"
  | "journal"
  | "calendar"
  | "goals"
  | "achievements"
  | "news"
  | "support"
  | "settings"
  | "ai-coach"
  | "risk"
  | "mt-connection"
  | "reports"
  | "psychology";

export type PlanLimits = {
  slug: string;
  maxPortfolios: number; // -1 = unlimited
  maxTradesPerMonth: number; // -1 = unlimited
  features: PlanFeature[];
};

const PLAN_LIMITS_MAP: Record<string, PlanLimits> = {
  free: {
    slug: "free",
    maxPortfolios: 1,
    maxTradesPerMonth: 50,
    features: ["portfolios", "trades", "journal", "calendar", "goals", "achievements", "news", "support", "settings", "ai-coach", "risk"],
  },
  pro: {
    slug: "pro",
    maxPortfolios: -1,
    maxTradesPerMonth: -1,
    features: ["portfolios", "trades", "journal", "calendar", "goals", "achievements", "news", "support", "settings", "ai-coach", "risk", "mt-connection", "reports"],
  },
  promax: {
    slug: "promax",
    maxPortfolios: -1,
    maxTradesPerMonth: -1,
    features: ["portfolios", "trades", "journal", "calendar", "goals", "achievements", "news", "support", "settings", "ai-coach", "risk", "mt-connection", "reports", "psychology"],
  },
  vip: {
    slug: "vip",
    maxPortfolios: -1,
    maxTradesPerMonth: -1,
    features: ["portfolios", "trades", "journal", "calendar", "goals", "achievements", "news", "support", "settings", "ai-coach", "risk", "mt-connection", "reports", "psychology"],
  },
};

/** Return the limits for the current subscription. Falls back to "free". */
export function usePlanLimits(): PlanLimits {
  const sub = useSubscription();
  const slug = sub?.plan?.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9-]/g, "") ?? "free";
  return PLAN_LIMITS_MAP[slug] ?? PLAN_LIMITS_MAP.free;
}

/** Check whether a specific feature is allowed for the current plan. */
export function useHasFeature(feature: PlanFeature): boolean {
  const limits = usePlanLimits();
  return limits.features.includes(feature);
}
