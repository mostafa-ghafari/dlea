import { describe, expect, it } from "vitest";
import {
  resolvePlanLimits,
  type PlanFeature,
  type PlanLimits,
} from "@/lib/api";

function plan(
  slug: string,
  name: string,
  features: PlanFeature[],
  extra: Partial<PlanLimits> = {},
): PlanLimits {
  return {
    slug,
    name,
    maxPortfolios: -1,
    maxTradesPerMonth: -1,
    features,
    ...extra,
  };
}

const CATALOGUE: PlanLimits[] = [
  plan("free", "رایگان", ["portfolios", "trades", "journal"], {
    maxPortfolios: 1,
    maxTradesPerMonth: 50,
  }),
  plan("pro", "Pro", ["portfolios", "trades", "journal", "ai-coach", "risk"], {
    maxPortfolios: -1,
    maxTradesPerMonth: -1,
  }),
  plan("promax", "Pro Max", ["portfolios", "trades", "journal", "psychology"]),
];

/** What production actually served before the backfill. */
const UNCONFIGURED: PlanLimits[] = [
  plan("free", "رایگان", []),
  plan("pro", "Pro", []),
  plan("promax", "Pro Max", []),
  plan("vip", "VIP", []),
];

describe("resolvePlanLimits", () => {
  it("uses the plan the subscription names, by slug", () => {
    const limits = resolvePlanLimits(CATALOGUE, "pro");
    expect(limits.slug).toBe("pro");
    expect(limits.features).toContain("ai-coach");
  });

  it("also matches the display name the subscription actually stores", () => {
    // `Subscription.plan` holds "Pro Max", not the "promax" slug.
    expect(resolvePlanLimits(CATALOGUE, "Pro Max").slug).toBe("promax");
    expect(resolvePlanLimits(CATALOGUE, "رایگان").slug).toBe("free");
  });

  it("falls back to the free tier while no subscription exists", () => {
    const limits = resolvePlanLimits(CATALOGUE, null);
    expect(limits.slug).toBe("free");
    expect(limits.maxTradesPerMonth).toBe(50);
  });

  it("ignores an unknown plan name instead of locking anything", () => {
    expect(
      resolvePlanLimits(CATALOGUE, "Trial").features.length,
    ).toBeGreaterThan(0);
  });

  describe("a plan whose feature list was never filled in", () => {
    it("does not lock the app for a paying user", () => {
      const limits = resolvePlanLimits(UNCONFIGURED, "Pro");
      // The regression: `features: []` matched every gate and turned the whole
      // sidebar into padlocks the moment a purchase named the plan.
      expect(limits.features.length).toBeGreaterThan(0);
      expect(limits.features).toContain("portfolios");
      expect(limits.features).toContain("journal");
    });

    it("still gives the paid tier more than the free one", () => {
      const paid = resolvePlanLimits(UNCONFIGURED, "Pro");
      const free = resolvePlanLimits(UNCONFIGURED, "رایگان");
      expect(paid.features).toContain("mt-connection");
      expect(free.features).not.toContain("mt-connection");
    });
  });

  it("survives the plans API being unreachable", () => {
    expect(resolvePlanLimits(undefined, "Pro").features.length).toBeGreaterThan(
      0,
    );
    expect(resolvePlanLimits([], "").slug).toBe("free");
  });

  it("prefers a configured list over the fallback", () => {
    const configured = resolvePlanLimits(
      [plan("pro", "Pro", ["portfolios", "mt-connection"])],
      "Pro",
    );
    expect(configured.features).toEqual(["portfolios", "mt-connection"]);
  });
});
