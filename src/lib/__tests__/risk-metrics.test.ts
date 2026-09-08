import { describe, expect, it } from "vitest";
import { computeTodayAdherence, DEFAULT_RISK_CAPS } from "@/lib/risk-metrics";
import {
  formatJalaliDate,
  gregorianDateToJalali,
} from "@/lib/persian-calendar";
import type { Trade } from "@/lib/types";

function todayLabel(): string {
  return formatJalaliDate(gregorianDateToJalali(new Date()));
}

function mkTrade(over: Partial<Trade>): Trade {
  const base: Trade = {
    id: "1",
    ticket: "1",
    symbol: "EURUSD",
    side: "buy",
    entry: 1.1,
    exit: 1.1,
    sl: 1.09,
    tp: 1.12,
    volume: 1,
    pnl: 0,
    rr: 1,
    pips: 0,
    commission: 0,
    swap: 0,
    taxes: 0,
    openTime: "",
    closeTime: "",
    duration: "",
    magic: 0,
    comment: "",
    reason: "",
    strategy: "",
    date: todayLabel(),
    portfolio: "اصلی",
    followedPlan: true,
    emotion: "",
    screenshots: [],
  };
  return { ...base, ...over };
}

describe("computeTodayAdherence", () => {
  const label = todayLabel();

  it("returns a neutral result when no trade was made today", () => {
    const old = mkTrade({ id: "old", date: "1400/01/01" });
    const r = computeTodayAdherence([old], DEFAULT_RISK_CAPS, 1000);
    expect(r.hasTrades).toBe(false);
    expect(r.tradeCount).toBe(0);
    expect(r.netPnl).toBe(0);
    expect(r.planAdherencePct).toBe(0);
    for (const rule of r.rules) {
      expect(rule.usedPct).toBe(0);
      expect(rule.safe).toBe(true);
      expect(rule.nearLimit).toBe(false);
    }
  });

  it("keeps only today's trades and computes count/pnl/adherence", () => {
    const trades = [
      mkTrade({
        id: "a",
        pnl: -5,
        followedPlan: true,
        closeTime: `${label} 10:30`,
      }),
      mkTrade({
        id: "b",
        pnl: 10,
        followedPlan: false,
        closeTime: `${label} 12:00`,
      }),
      mkTrade({ id: "old", pnl: -500, date: "1400/01/01" }),
    ];
    const r = computeTodayAdherence(trades, DEFAULT_RISK_CAPS, 1000);
    expect(r.hasTrades).toBe(true);
    expect(r.tradeCount).toBe(2);
    expect(r.netPnl).toBe(5);
    expect(r.planAdherencePct).toBe(50);
  });

  it("measures risk/daily-loss against the account balance", () => {
    const trades = [
      mkTrade({ id: "a", pnl: -5, closeTime: `${label} 10:00` }), // 0.5% of 1000
      mkTrade({ id: "c", pnl: 10, closeTime: `${label} 11:00` }),
      mkTrade({ id: "b", pnl: -3, closeTime: `${label} 12:00` }), // isolated loss
    ];
    const r = computeTodayAdherence(trades, DEFAULT_RISK_CAPS, 1000);
    const byKey = new Map(r.rules.map((x) => [x.key, x]));
    // Net -5-3+10 = +2 → daily loss row untouched.
    expect(byKey.get("dailyLoss")!.usedPct).toBe(0);
    // Worst single loss 0.5% against the 1% cap.
    expect(byKey.get("maxRiskPerTrade")!.usedPct).toBeCloseTo(50, 5);
    expect(byKey.get("dailyTrades")!.usedPct).toBeCloseTo(60, 5);
    // Single losing trade → streak 1 of 3.
    expect(byKey.get("consecutiveLosses")!.usedPct).toBeCloseTo(100 / 3, 5);
    expect(byKey.get("consecutiveLosses")!.safe).toBe(true);
  });

  it("flags violations when a cap is exceeded", () => {
    const trades = [
      mkTrade({ id: "a", pnl: -30, closeTime: `${label} 10:00` }), // 3% of 1000
      mkTrade({ id: "b", pnl: -10, closeTime: `${label} 11:00` }),
      mkTrade({ id: "c", pnl: -10, closeTime: `${label} 12:00` }),
    ];
    const r = computeTodayAdherence(trades, DEFAULT_RISK_CAPS, 1000);
    const byKey = new Map(r.rules.map((x) => [x.key, x]));

    const dailyLoss = byKey.get("dailyLoss")!;
    // Net -30-10-10 = -50 → 5% of balance against the 3% daily cap.
    expect(dailyLoss.usedPct).toBeCloseTo(500 / 3, 5);
    expect(dailyLoss.safe).toBe(false);
    expect(dailyLoss.nearLimit).toBe(false);

    const risk = byKey.get("maxRiskPerTrade")!;
    expect(risk.usedPct).toBe(300); // 3% single loss / 1% cap
    expect(risk.safe).toBe(false);

    const streak = byKey.get("consecutiveLosses")!;
    expect(streak.usedPct).toBe(100); // 3 losses / cap 3
    expect(streak.safe).toBe(false);
  });

  it("orders today's trades by close time before measuring the streak", () => {
    // Two losses (10:00, 12:00) with a winner between (11:00) — passed in a
    // jumbled order. A naive adjacency scan would see the two losses as one
    // streak of 2; sorting by close time must yield a streak of only 1.
    const trades = [
      mkTrade({ id: "c", pnl: -10, closeTime: `${label} 12:00` }),
      mkTrade({ id: "w", pnl: 5, closeTime: `${label} 11:00` }),
      mkTrade({ id: "a", pnl: -10, closeTime: `${label} 10:00` }),
    ];
    const r = computeTodayAdherence(trades, DEFAULT_RISK_CAPS, 1000);
    expect(r.tradeCount).toBe(3);
    const streak = r.rules.find((x) => x.key === "consecutiveLosses")!;
    expect(streak.usedPct).toBeCloseTo(100 / 3, 5);
    expect(streak.safe).toBe(true);
  });
});
