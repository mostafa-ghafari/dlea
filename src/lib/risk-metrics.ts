/**
 * «وضعیت پایبندی امروز» — computes the risk-management page's per-rule usage
 * from the *actual* trades of the current Jalali day, so the card changes as
 * trades are added instead of showing hard-coded numbers.
 *
 * Trade rows come from the API with Jalali date labels (e.g. `۱۴۰۵/۰۶/۱۷`).
 * "Today" is the same calendar day label computed locally, so the comparison
 * is stable regardless of server timezone handling.
 */

import type { Trade } from "@/lib/types";
import {
  datePart,
  faDigitsToLatin,
  formatJalaliDate,
  gregorianDateToJalali,
} from "@/lib/persian-calendar";

/** Caps of the risk rules the user edits on the page (saved client-side). */
export type RiskCaps = {
  maxRiskPct: number; // حداکثر ریسک هر معامله (٪ موجودی)
  maxDailyLossPct: number; // حداکثر ضرر روزانه (٪)
  maxWeeklyLossPct: number; // حداکثر ضرر هفتگی (٪)
  maxDailyTrades: number; // حداکثر معاملات روزانه
  maxConsecutiveLosses: number; // حداکثر ضرر متوالی
  minRR: number; // حداقل R:R
};

export const DEFAULT_RISK_CAPS: RiskCaps = {
  maxRiskPct: 1,
  maxDailyLossPct: 3,
  maxWeeklyLossPct: 8,
  maxDailyTrades: 5,
  maxConsecutiveLosses: 3,
  minRR: 1.5,
};

export const RISK_CAPS_KEY = "dlea:risk-rules";

/** `1405/06/17 15:30` → minutes-since-midnight (for intraday ordering). */
export function jalaliTimeMinutes(dateTimeLabel: string): number {
  const parts = faDigitsToLatin(dateTimeLabel).split(/\s+/);
  if (!parts[1]) return 0;
  const [h, m] = parts[1].split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export type RiskRuleState = {
  key: "maxRiskPerTrade" | "dailyLoss" | "dailyTrades" | "consecutiveLosses";
  label: string;
  /** Cap text as displayed on the badge, e.g. «۱٪». */
  capText: string;
  /** 0–100+ percent of the cap consumed today. */
  usedPct: number;
  /** true when the usage is strictly inside the cap. */
  safe: boolean;
  /** true when 85% ≤ usage < 100% (approaching the cap). */
  nearLimit: boolean;
};

export type TodayAdherence = {
  /** Jalali date label the metrics were computed for (latin digits). */
  todayLabel: string;
  hasTrades: boolean;
  tradeCount: number;
  netPnl: number;
  planAdherencePct: number;
  /** Percent of account lost/risked today, for the empty-state copy. */
  rules: RiskRuleState[];
};

function faNum(n: number): string {
  if (!Number.isFinite(n)) return "۰";
  return (Number.isInteger(n) ? n : Number(n.toFixed(2))).toLocaleString(
    "fa-IR",
  );
}

function usagePercent(used: number, cap: number): number {
  return cap > 0 ? (used / cap) * 100 : 0;
}

/**
 * Evaluate today's trades against the four daily rules.
 *
 * Assumptions, given the data the API exposes:
 * - “risk per trade” is measured by the realized loss of the worst losing
 *   trade of the day as a percent of the account balance;
 * - “daily loss” is today's net loss (negative PnL) as a percent of balance;
 * - the losing streak uses today's trades ordered by close time.
 */
export function computeTodayAdherence(
  trades: Trade[],
  caps: RiskCaps,
  balance: number,
): TodayAdherence {
  const today = gregorianDateToJalali(new Date());
  const todayLabel = formatJalaliDate(today);

  const dayTrades = trades
    .filter((t) => datePart(t.date) === todayLabel)
    .sort(
      (a, b) => jalaliTimeMinutes(a.closeTime) - jalaliTimeMinutes(b.closeTime),
    );

  const hasTrades = dayTrades.length > 0;
  const tradeCount = dayTrades.length;
  const netPnl = dayTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const planFollowed = dayTrades.filter((t) => t.followedPlan).length;
  const planAdherencePct = hasTrades
    ? Math.round((planFollowed / tradeCount) * 100)
    : 0;

  // Longest losing streak within today, in close-time order.
  let streak = 0;
  let longestStreak = 0;
  for (const t of dayTrades) {
    if (t.pnl < 0) {
      streak += 1;
      if (streak > longestStreak) longestStreak = streak;
    } else {
      streak = 0;
    }
  }

  const balanceOk = balance > 0;
  const worstLossPct = balanceOk
    ? (Math.max(0, ...dayTrades.map((t) => -Math.min(t.pnl, 0))) / balance) *
      100
    : 0;
  const dailyLossPct = balanceOk && netPnl < 0 ? (-netPnl / balance) * 100 : 0;

  const rules: RiskRuleState[] = [
    {
      key: "maxRiskPerTrade",
      label: "حداکثر ریسک هر معامله",
      capText: `${faNum(caps.maxRiskPct)}٪`,
      usedPct: usagePercent(worstLossPct, caps.maxRiskPct),
      safe: worstLossPct < caps.maxRiskPct,
      nearLimit:
        caps.maxRiskPct > 0 &&
        worstLossPct >= caps.maxRiskPct * 0.85 &&
        worstLossPct < caps.maxRiskPct,
    },
    {
      key: "dailyLoss",
      label: "حداکثر ضرر روزانه",
      capText: `${faNum(caps.maxDailyLossPct)}٪`,
      usedPct: usagePercent(dailyLossPct, caps.maxDailyLossPct),
      safe: dailyLossPct < caps.maxDailyLossPct,
      nearLimit:
        caps.maxDailyLossPct > 0 &&
        dailyLossPct >= caps.maxDailyLossPct * 0.85 &&
        dailyLossPct < caps.maxDailyLossPct,
    },
    {
      key: "dailyTrades",
      label: "حداکثر تعداد معاملات روزانه",
      capText: faNum(caps.maxDailyTrades),
      usedPct: usagePercent(tradeCount, caps.maxDailyTrades),
      safe: tradeCount < caps.maxDailyTrades,
      nearLimit:
        caps.maxDailyTrades > 0 &&
        tradeCount >= caps.maxDailyTrades * 0.85 &&
        tradeCount < caps.maxDailyTrades,
    },
    {
      key: "consecutiveLosses",
      label: "حداکثر ضرر متوالی",
      capText: faNum(caps.maxConsecutiveLosses),
      usedPct: usagePercent(longestStreak, caps.maxConsecutiveLosses),
      safe: longestStreak < caps.maxConsecutiveLosses,
      nearLimit:
        caps.maxConsecutiveLosses > 0 &&
        longestStreak >= caps.maxConsecutiveLosses * 0.85 &&
        longestStreak < caps.maxConsecutiveLosses,
    },
  ];

  return {
    todayLabel,
    hasTrades,
    tradeCount,
    netPnl,
    planAdherencePct,
    rules,
  };
}
