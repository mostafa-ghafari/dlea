/**
 * Typed API client for the Dlea Django backend.
 *
 * Every endpoint mirrors a named export that used to live in `mock-data.ts`,
 * so pages can swap `import { trades } from "@/lib/types"` for
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
} from "@/lib/types";
import type { CoachPeriod, CoachScope } from "@/lib/ai-coach-data";
import type { RiskCaps } from "@/lib/risk-metrics";
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
} from "@/lib/types";
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

/**
 * Statuses that mean "a proxy in front of the app gave up", not "the app said
 * no". The backend always answers these with a JSON `detail` (Persian) when it
 * is the one failing, so a response on one of these without a `detail` came
 * from a gateway — nginx, or the CDN terminating TLS — and the request died
 * before the app could answer.
 */
const GATEWAY_STATUSES = new Set([502, 503, 504]);

/**
 * What a gateway timeout means for the *user*.
 *
 * The coach's Gemini call is allowed ~75s (`GEMINI_CALL_BUDGET_SECONDS`), so a
 * proxy whose own `proxy_read_timeout` is shorter answers first while the
 * backend keeps working and usually still saves the report. That is why the
 * message asks for a refresh rather than a retry: retrying would burn another
 * quota slot on a report that already exists. `API 504: coach/generate/` names
 * the path, not the problem.
 */
function gatewayDetail(status: number): string {
  if (status === 504) {
    return (
      "گیتوی پیش از آماده‌شدن گزارش درخواست را بست (۵۰۴). " +
      "ممکن است گزارش همین حالا ساخته و ذخیره شده باشد — لیست بازه‌ها را تازه کن. " +
      "اگر تکرار شد، سقف زمان درخواست در nginx یا CDN کمتر از مهلت ساخت گزارش است."
    );
  }
  return `سرور موقتاً پاسخ نمی‌دهد (${status}) — چند لحظه بعد دوباره تلاش کن.`;
}

/**
 * An error the API returned, keeping the status so a caller can tell a gateway
 * timeout (retryable, and often already saved server-side) from the app's own
 * refusal (which carries an actionable Persian message).
 */
export class ApiError extends Error {
  readonly status: number;
  /** True when a proxy answered instead of the app. */
  readonly gateway: boolean;

  constructor(message: string, status: number, gateway = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.gateway = gateway;
  }
}

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
  is_active?: boolean;
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
  /** Account behind the order (empty for payments entered by an admin). */
  accountEmail: string;
  plan: string;
  planSlug: string;
  cycle: "monthly" | "yearly";
  amount: string;
  amountRial: number;
  date: string;
  status: string;
  /** Bank tracking code (کد رهگیری) returned by the gateway. */
  referenceId: string;
  /** Masked card number the buyer paid with. */
  cardNumber: string;
  gateway: string;
  paidAt: string;
};

/** Verdict of one line in the payment health report. */
export type PaymentHealthStatus = "pass" | "fail" | "warn" | "skipped" | "info";

/** One check in the payment health report (admin panel). */
export type PaymentHealthCheck = {
  id: string;
  title: string;
  status: PaymentHealthStatus;
  detail: string;
};

/** How one plan's price maps onto the gateway's amount bounds. */
export type PaymentHealthPlan = {
  slug: string;
  name: string;
  price: string;
  sellable: boolean;
  monthlyRial: number;
  yearlyRial: number;
  status: PaymentHealthStatus;
  detail: string;
};

/** An order that did not end in a paid plan, with the gateway's own answer. */
export type PaymentHealthOrder = {
  id: number;
  user: string;
  plan: string;
  amount: string;
  date: string;
  /** Which gateway call produced the code: request, verify, or engine (ours). */
  stage: string;
  /** Gateway result code, or null when the gateway never answered. */
  code: number | null;
  message: string;
};

/** A paid order quoted in the report (last one that worked). */
export type PaymentHealthPaidOrder = {
  id: number;
  plan: string;
  amount: string;
  referenceId: string;
  date: string;
};

/** Everything the payment health page renders, in one payload. */
export type PaymentHealthReport = {
  checkedAt: string;
  /** True when the gateway was really called (POST, not GET). */
  live: boolean;
  sandbox: boolean;
  merchant: string;
  callbackUrl: string;
  /** Where the buyer lands after the bank; empty means "same host as this one". */
  frontendUrl: string;
  amounts: {
    minRial: number;
    maxRial: number;
    minToman: number;
    maxToman: number;
  };
  summary: { passed: number; failed: number; warned: number; skipped: number };
  checks: PaymentHealthCheck[];
  plans: PaymentHealthPlan[];
  orders: {
    pending: number;
    stuck: number;
    failedRecent: number;
    failedWindowDays: number;
    recentFailed: PaymentHealthOrder[];
    oldestStuck: PaymentHealthOrder | null;
    lastPaid: PaymentHealthPaidOrder | null;
  };
  /** The gateway's result codes with the Persian text we show for them. */
  codes: { code: number; message: string }[];
};

/** A payment session opened at the bank, waiting for the buyer to pay. */
export type CheckoutSession = {
  paymentId: number;
  /** Where to send the browser: the gateway's own payment page. */
  paymentUrl: string;
  trackId: string;
  amount: number;
  amountToman: number;
  plan: string;
  cycle: "monthly" | "yearly";
  /** True while the gateway's test merchant is in use. */
  sandbox: boolean;
};

/** One of the buyer's own orders; `status` is Persian, like the admin list. */
export type PaymentOrder = {
  id: number;
  plan: string;
  planSlug: string;
  cycle: "monthly" | "yearly";
  amount: string;
  amountRial: number;
  status: string;
  referenceId: string;
  cardNumber: string;
  paidAt: string | null;
  payUrl: string | null;
  detail?: string;
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

// ── In-memory GET cache + request deduplication ──────────────────────
// Prevents redundant network requests when multiple components mount
// and call the same hook (e.g. useRole) at the same time, or when
// navigating between pages and re-mounting the layout.
const _getCache = new Map<string, { data: unknown; ts: number }>();
const _inflight = new Map<string, Promise<unknown>>();
const CACHE_TTL_MS = 60_000; // serve fresh data for 60 s

/** Evict any cached GET entries whose path starts with `prefix`. */
export function invalidateCache(prefix: string) {
  for (const key of _getCache.keys()) {
    if (key.startsWith(prefix)) _getCache.delete(key);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();

  // ── Cache check for GET requests ──────────────────────────────────
  if (method === "GET") {
    const cached = _getCache.get(path);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.data as T;
    }
    // Deduplicate concurrent in-flight requests
    const inflight = _inflight.get(path);
    if (inflight) {
      return inflight as Promise<T>;
    }
  }

  const headers: Record<string, string> = {};
  // Don't set Content-Type for FormData — browser sets it with boundary
  if (!(init?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const fetchPromise = fetch(`${API_BASE}/${path.replace(/^\//, "")}`, {
    headers,
    ...init,
  }).then(async (res) => {
    if (!res.ok) {
      let detail = `API ${res.status}: ${path}`;
      let gateway = false;
      let appDetail: string | undefined;
      try {
        const body = (await res.json()) as { detail?: string };
        appDetail = body?.detail;
      } catch {
        /* non-JSON error body — an HTML page, which the app never writes */
      }
      if (appDetail) {
        detail = appDetail;
      } else if (GATEWAY_STATUSES.has(res.status)) {
        // No DRF `detail` on a gateway status: the proxy gave up on a request
        // the app was still working on. Say that, instead of showing the user
        // a path they cannot act on.
        detail = gatewayDetail(res.status);
        gateway = true;
      }
      throw new ApiError(detail, res.status, gateway);
    }
    if (res.status === 204) {
      return undefined as T;
    }
    const text = await res.text();
    if (!text) return undefined as T;
    const data = JSON.parse(text) as unknown;
    // DRF pagination wrapper: { count, next, previous, results }
    if (
      data &&
      typeof data === "object" &&
      Array.isArray((data as { results?: unknown }).results)
    ) {
      const keys = Object.keys(data as object);
      const isStandardDRF = keys.every((k) =>
        ["count", "next", "previous", "results"].includes(k),
      );
      if (isStandardDRF) {
        return (data as { results: T }).results;
      }
    }
    return data as T;
  });

  // Track in-flight GETs for deduplication
  if (method === "GET") {
    _inflight.set(path, fetchPromise as Promise<unknown>);
    fetchPromise
      .then((data) => {
        _getCache.set(path, { data, ts: Date.now() });
      })
      .catch(() => {
        // Don't cache errors
      })
      .finally(() => {
        _inflight.delete(path);
      });
  }

  // Invalidate stale GET entries when a mutation happens to the same prefix
  if (method !== "GET") {
    const prefix = path.split("?")[0].replace(/\/$/, "");
    invalidateCache(prefix);
  }

  return fetchPromise;
}

export function get<T>(path: string) {
  return request<T>(path);
}

export function post<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "POST",
    body: body == null ? undefined : JSON.stringify(body),
  });
}

export function patch<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "PATCH",
    body: body == null ? undefined : JSON.stringify(body),
  });
}

export function del<T>(path: string) {
  return request<T>(path, { method: "DELETE" });
}

export function put<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "PUT",
    body: body == null ? undefined : JSON.stringify(body),
  });
}

/** POST with raw body (e.g. FormData for file uploads) — no Content-Type header. */
export function postRaw<T>(path: string, body: FormData) {
  return request<T>(path, { method: "POST", body });
}

/* ------------------------------------------------------------------ */
/* Fetchers                                                            */
/* ------------------------------------------------------------------ */

export const fetchDashboard = (portfolioId?: string) =>
  get<DashboardPayload>(
    portfolioId ? `dashboard/?portfolio=${portfolioId}` : "dashboard/",
  );
export const fetchTrades = (portfolioId?: string) =>
  get<Trade[]>(portfolioId ? `trades/?portfolio=${portfolioId}` : "trades/");
export const fetchPortfolios = () => get<Portfolio[]>("portfolios/");
export const activatePortfolio = (id: string) =>
  post<Portfolio>(`portfolios/${id}/activate/`, {});
export const fetchJournalGroups = (portfolioId?: string) =>
  get<JournalGroup[]>(
    portfolioId
      ? `journal/groups/?portfolio=${portfolioId}`
      : "journal/groups/",
  );
export const fetchJournalEntries = (portfolioId?: string) =>
  get<JournalEntry[]>(
    portfolioId
      ? `journal/entries/?portfolio=${portfolioId}`
      : "journal/entries/",
  );
export const fetchGoals = (portfolioId?: string) =>
  get<Goal[]>(portfolioId ? `goals/?portfolio=${portfolioId}` : "goals/");
export const fetchAchievements = (portfolioId?: string) =>
  get<Achievement[]>(
    portfolioId ? `achievements/?portfolio=${portfolioId}` : "achievements/",
  );
export const fetchAchievementHistory = () =>
  get<AchievementHistoryItem[]>("achievement-history/");
export const fetchRoleTiers = () => get<RoleTier[]>("role-tiers/");
export const fetchCalendarDays = () => get<CalendarDay[]>("calendar/");
export const fetchPlans = () => get<Plan[]>("plans/");

/** Update a plan (admin only). `slug` is the plan's stable id, e.g. "pro". */
export function updatePlan(
  slug: string,
  changes: Partial<Plan>,
): Promise<Plan> {
  return patch<Plan>(`plans/${slug}/`, changes);
}
export type AdminStats = {
  total_users: number;
  active_subscriptions: number;
  monthly_revenue: number;
  total_trades: number;
  ai_calls: number;
};
export const fetchAdminStats = () => get<AdminStats>("admin/stats/");
export type AdminCharts = {
  user_growth: { month: string; users: number }[];
  revenue: { month: string; revenue: number }[];
  plan_distribution: { name: string; value: number; color: string }[];
};
export const fetchAdminCharts = () => get<AdminCharts>("admin/charts/");
export type AiApiInfo = {
  name: string;
  endpoint: string;
  requests: number;
  tokens_in: number;
  tokens_out: number;
};
export type AdminAiApis = { apis: AiApiInfo[]; gemini_configured: boolean };
export const fetchAdminAiApis = () => get<AdminAiApis>("admin/ai-apis/");
export type UsersPage = {
  count: number;
  page: number;
  page_size: number;
  results: PlatformUser[];
};
export const fetchUsers = (page = 1, pageSize = 20, search = "") =>
  get<UsersPage>(
    `admin/users/?page=${page}&page_size=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
  );
export const fetchPayments = () => get<Payment[]>("admin/payments/");
/** Open a payment session for `plan` and hand back the gateway URL. */
export const startCheckout = (plan: string, cycle: "monthly" | "yearly") =>
  post<CheckoutSession>("billing/checkout/", { plan, cycle });
/** Read one of my orders (used after the bank sends the browser back). */
export const fetchPaymentOrder = (id: number | string) =>
  get<PaymentOrder>(`billing/orders/${id}/`);
/** Ask the gateway again about an order whose callback never made it back. */
export const confirmPaymentOrder = (id: number | string) =>
  post<PaymentOrder>(`billing/orders/${id}/`, {});
/**
 * Admin: payment path snapshot. Makes no outbound request, so it is safe to
 * call on page load; press the button for the live gateway checks.
 */
export const fetchPaymentHealth = () =>
  get<PaymentHealthReport>("admin/payment-health/");
/**
 * Admin: run the live checks too. This probes the gateway for real (opening
 * abandoned payment sessions) and returns the same report shape.
 */
export const runPaymentHealthCheck = () =>
  post<PaymentHealthReport>("admin/payment-health/", {});
export const fetchReferralLinks = () => get<ReferralLink[]>("admin/referrals/");
export const fetchSubscription = async (): Promise<Subscription | null> => {
  const list = await get<Subscription[]>("subscription/");
  return list[0] ?? null;
};
export const fetchAiInsights = (portfolioId?: string) =>
  get<AiInsights>(
    portfolioId
      ? `coach/insights/?portfolio=${portfolioId}`
      : "coach/insights/",
  );
export const fetchCoachPeriods = (portfolioId?: string) =>
  get<CoachPeriod[]>(
    portfolioId ? `coach/periods/?portfolio=${portfolioId}` : "coach/periods/",
  );

export type GeneratedCoachReport = CoachPeriod & { _generated?: boolean };

export function generateCoachReport(
  scope: CoachScope,
  model?: string,
  portfolioId?: string,
  // The trader's risk caps live only in localStorage (the risk page saves them
  // there), so the request is the one chance to let the coach see the rules it
  // is judging the report against.
  risk?: Partial<RiskCaps>,
) {
  return post<GeneratedCoachReport>("coach/generate/", {
    scope,
    model,
    portfolio: portfolioId,
    risk,
  });
}
export const fetchArchivedReports = () =>
  get<ArchivedReport[]>("coach/archive/");
export const fetchEconomicEvents = () =>
  get<EconomicEvent[]>("economic-events/");
export const fetchForexSymbols = () =>
  get<{ code: string }[]>("forex-symbols/");
export const fetchStrategies = () => get<{ name: string }[]>("strategies/");
export const fetchTradeColumns = () => get<TradeColumn[]>("trade-columns/");
export const fetchNews = () => get<NewsItem[]>("news/");
export const fetchTickets = () => get<Ticket[]>("tickets/");
export const fetchNotifications = () =>
  get<AppNotification[]>("notifications/");
export const fetchAudit = () => get<AuditEntry[]>("audit/");
export type AdminLogEntry = { id: string; t: string; l: string; m: string };
export const fetchLogs = () => get<AdminLogEntry[]>("admin/logs/");

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
  is_active?: boolean;
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
  return post<{
    created: number;
    total: number;
    errors?: { index: number; detail: unknown }[];
  }>("trades/import/", items);
}

export function updateTrade(id: string, changes: Partial<TradeInput>) {
  return patch<Trade>(`trades/${id}/`, changes);
}

export function updateTradeScreenshots(id: string, screenshots: string[]) {
  return updateTrade(id, { screenshots });
}

export function updateUser(
  id: string,
  changes: Partial<Pick<PlatformUser, "plan" | "email" | "status" | "role">>,
) {
  return patch<PlatformUser>(`admin/users/${id}/`, changes);
}

export function deleteUser(id: string) {
  return del<{ ok: boolean }>(`admin/users/${id}/`);
}

export type GoalInput = {
  title: string;
  progress?: number;
  portfolio_id?: number | string;
};

export function createGoal(input: GoalInput) {
  return post<Goal>("goals/", input);
}

export function updateGoal(id: string, changes: Partial<GoalInput>) {
  return patch<Goal>(`goals/${id}/`, changes);
}

export function deleteGoal(id: string) {
  return del<{ ok: boolean }>(`goals/${id}/`);
}

export type JournalGroupInput = {
  name: string;
  color?: string;
  portfolio_id?: number | string;
};

export function createJournalGroup(input: JournalGroupInput) {
  return post<JournalGroup>("journal/groups/", input);
}

export function renameJournalGroup(
  id: string,
  changes: Partial<JournalGroupInput>,
) {
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
  portfolio_id?: number | string;
};

export function createJournalEntry(input: JournalEntryInput) {
  return post<JournalEntry>("journal/entries/", input);
}

export function updateJournalEntry(
  id: string,
  changes: Partial<JournalEntryInput>,
) {
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

export async function updateProfile(
  data: Partial<UserProfile> & { avatarFile?: File },
) {
  const { avatarFile, ...rest } = data;
  if (avatarFile) {
    // Use FormData for file upload
    const formData = new FormData();
    if (rest.firstName !== undefined)
      formData.append("firstName", rest.firstName);
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

export function useApi<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[] = [],
) {
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

import { useActivePortfolioId } from "@/lib/app-state";

/* ------------------------------------------------------------------ */
/* Named hooks — same names as the old mock-data exports               */
/* ------------------------------------------------------------------ */

export function useTrades(): Trade[] {
  const [pid] = useActivePortfolioId();
  return useApi(() => fetchTrades(pid ?? undefined), [pid]).data ?? [];
}

export function usePortfolios(): Portfolio[] {
  return useApi(fetchPortfolios).data ?? [];
}

export function useJournalGroups(): JournalGroup[] {
  const [pid] = useActivePortfolioId();
  return useApi(() => fetchJournalGroups(pid ?? undefined), [pid]).data ?? [];
}

export function useJournalEntries(): JournalEntry[] {
  const [pid] = useActivePortfolioId();
  return useApi(() => fetchJournalEntries(pid ?? undefined), [pid]).data ?? [];
}

export function useGoals(): Goal[] {
  const [pid] = useActivePortfolioId();
  return useApi(() => fetchGoals(pid ?? undefined), [pid]).data ?? [];
}

export function useAchievements(): Achievement[] {
  const [pid] = useActivePortfolioId();
  return useApi(() => fetchAchievements(pid ?? undefined), [pid]).data ?? [];
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
  const [pid] = useActivePortfolioId();
  return useApi(() => fetchAiInsights(pid ?? undefined), [pid]).data;
}

export function useCoachPeriods(): CoachPeriod[] {
  const [pid] = useActivePortfolioId();
  return useApi(() => fetchCoachPeriods(pid ?? undefined), [pid]).data ?? [];
}

export function useArchivedReports(): ArchivedReport[] {
  return useApi(fetchArchivedReports).data ?? [];
}

export function useDashboard(): DashboardPayload | null {
  const [pid] = useActivePortfolioId();
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
export function tierFor(
  earned: number,
  total: number,
  tiers: RoleTier[],
): RoleTier {
  const pct = total ? (earned / total) * 100 : 0;
  return (
    tiers.find((t) => pct >= t.minPct && pct < t.maxPct) ??
    tiers[tiers.length - 1] ?? {
      level: 1,
      minPct: 0,
      maxPct: 100,
      name: "تریدر",
    }
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
  /** display name — `Subscription.plan` stores this, not the slug */
  name?: string;
  maxPortfolios: number; // -1 = unlimited
  maxTradesPerMonth: number; // -1 = unlimited
  /** AI coach requests allowed per `aiRequestsPeriod` (-1 = unlimited) */
  aiRequestsLimit?: number;
  aiRequestsPeriod?: "day" | "week" | "month";
  /** screenshots per trade / journal entry (-1 = unlimited) */
  maxImagesPerEntry?: number;
  features: PlanFeature[];
};

/** How many AI coach requests the signed-in user has left. */
export type AiQuota = {
  plan: string | null;
  planName: string;
  limit: number; // -1 = unlimited
  period: "day" | "week" | "month";
  periodLabel: string;
  used: number;
  remaining: number;
  allowed: boolean;
  resetsAt: string | null;
};

/** Fallback for free plan when plans API is unavailable. */
const FREE_LIMITS: PlanLimits = {
  slug: "free",
  name: "رایگان",
  maxPortfolios: 1,
  maxTradesPerMonth: 50,
  aiRequestsLimit: 1,
  aiRequestsPeriod: "month",
  maxImagesPerEntry: 2,
  features: [
    "portfolios",
    "trades",
    "journal",
    "calendar",
    "goals",
    "achievements",
    "news",
    "support",
    "settings",
    "ai-coach",
    "risk",
  ],
};

/** Permissive fallback for paid plans when plans API is unavailable. */
const PAID_LIMITS: PlanLimits = {
  slug: "paid",
  name: "پرداختی",
  maxPortfolios: -1,
  maxTradesPerMonth: -1,
  aiRequestsLimit: 3,
  aiRequestsPeriod: "week",
  maxImagesPerEntry: 10,
  features: [
    "portfolios",
    "trades",
    "journal",
    "calendar",
    "goals",
    "achievements",
    "news",
    "support",
    "settings",
    "ai-coach",
    "risk",
    "mt-connection",
    "reports",
    "psychology",
  ],
};

/** Fetch plan limits from the backend API. */
export const fetchPlanLimits = () => get<PlanLimits[]>("plans/limits/");

/** Normalise a plan label so "Pro Max" and "پرو مکس" can be compared. */
function planKey(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[\s\u200c\u200f-]+/g, "");
}

/** "Pro Max" -> "promax": the slug form the API stores. */
function planSlug(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9-]/g, "");
}

/** The catalogue entry for `planName`: slug first, display name second. */
function matchPlan(
  plans: PlanLimits[],
  planName: string | null | undefined,
): PlanLimits | undefined {
  const slug = planSlug(planName);
  return (
    plans.find((p) => p.slug === slug) ??
    plans.find((p) => planKey(p.name) === planKey(planName))
  );
}

/**
 * The limits that govern `planName`, given the catalogue the API returned.
 *
 * Pure and exported on purpose: getting this wrong does not show a wrong
 * number, it locks every page of the app.
 *
 * A plan whose `features` list is empty counts as *not configured*, never as
 * "nothing allowed". The column shipped with an empty default and nothing
 * filled it, so an empty list locked every gated page the moment a purchase
 * put a real plan name on the subscription; three tiers of paid users then had
 * a sidebar full of padlocks. Until an admin saves the list, the built-in tier
 * defaults keep the app usable.
 */
export function resolvePlanLimits(
  plans: PlanLimits[] | null | undefined,
  planName: string | null | undefined,
): PlanLimits {
  const matched =
    plans && plans.length > 0 ? matchPlan(plans, planName) : undefined;
  if (matched && matched.features.length > 0) {
    return matched;
  }
  // Plans API unavailable, unknown plan, or a plan nobody configured yet. The
  // matched slug decides the tier — a Persian display name has no Latin slug.
  const slug = matched?.slug ?? planSlug(planName);
  return slug === "free" || !planName ? FREE_LIMITS : PAID_LIMITS;
}

/**
 * Return the limits for the current subscription.
 *
 * `Subscription.plan` holds the display name ("Pro Max"), so matching on the
 * slug alone would silently hand every paying user the free caps.
 */
export function usePlanLimits(): PlanLimits {
  const sub = useSubscription();
  const plans = useApi(fetchPlanLimits).data;
  return resolvePlanLimits(plans, sub?.plan);
}

/* ------------------------------------------------------------------ */
/* AI coach quota                                                      */
/* ------------------------------------------------------------------ */

export const fetchAiQuota = () => get<AiQuota>("ai/quota/");

export function useAiQuota(): AiQuota | null {
  return useApi(fetchAiQuota).data;
}

/** Check whether a specific feature is allowed for the current plan. */
export function useHasFeature(feature: PlanFeature): boolean {
  const limits = usePlanLimits();
  return limits.features.includes(feature);
}
