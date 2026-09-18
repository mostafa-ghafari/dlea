import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ACTIVE_PORTFOLIO_KEY,
  fullName,
  getActivePortfolioId,
  getCurrentUser,
  setActivePortfolioId,
  useHasPortfolio,
  useLocalState,
} from "@/lib/app-state";

// `useHasPortfolio` reads the portfolio list through the API hook; the tests
// below hand it a list directly so no request is made.
const api = vi.hoisted(() => ({
  portfolios: null as { id: string; is_active?: boolean }[] | null,
}));

vi.mock("@/lib/api", () => ({
  fetchPortfolios: vi.fn(),
  useApi: () => ({ data: api.portfolios, loading: false }),
}));

describe("fullName", () => {
  it("returns the placeholder for null users", () => {
    expect(fullName(null)).toBe("کاربر");
  });

  it("joins first and last name", () => {
    expect(
      fullName({
        id: 1,
        email: "a@b.com",
        firstName: "علی",
        lastName: "رضایی",
      }),
    ).toBe("علی رضایی");
  });

  it("falls back to email when names are empty", () => {
    expect(
      fullName({ id: 1, email: "a@b.com", firstName: "", lastName: "" }),
    ).toBe("a@b.com");
  });
});

describe("getCurrentUser", () => {
  it("parses the stored user", () => {
    window.localStorage.setItem(
      "dlea:user",
      JSON.stringify({ id: 1, email: "a@b.com" }),
    );
    expect(getCurrentUser()).toEqual({ id: 1, email: "a@b.com" });
  });

  it("returns null when nothing is stored", () => {
    expect(getCurrentUser()).toBeNull();
  });

  it("returns null for corrupt JSON", () => {
    window.localStorage.setItem("dlea:user", "{not json");
    expect(getCurrentUser()).toBeNull();
  });
});

describe("active portfolio id", () => {
  it("round-trips through localStorage", () => {
    expect(getActivePortfolioId()).toBeNull();
    setActivePortfolioId("42");
    expect(getActivePortfolioId()).toBe("42");
    setActivePortfolioId(null);
    expect(getActivePortfolioId()).toBeNull();
    expect(window.localStorage.getItem(ACTIVE_PORTFOLIO_KEY)).toBeNull();
  });
});

describe("useLocalState", () => {
  it("hydrates from localStorage and becomes ready", async () => {
    window.localStorage.setItem("k", JSON.stringify("stored"));
    const { result } = renderHook(() => useLocalState<string>("k", "init"));
    // renderHook flushes effects, so the stored value is already loaded
    expect(result.current[0]).toBe("stored");
    expect(result.current[2]).toBe(true); // ready
  });

  it("persists updates to localStorage", async () => {
    const { result } = renderHook(() => useLocalState<number>("n", 0));
    await act(async () => {});
    act(() => result.current[1](5));
    expect(result.current[0]).toBe(5);
    expect(JSON.parse(window.localStorage.getItem("n") ?? "null")).toBe(5);
  });

  it("supports functional updates", async () => {
    const { result } = renderHook(() => useLocalState<number>("m", 1));
    await act(async () => {});
    act(() => result.current[1]((p) => p + 10));
    expect(result.current[0]).toBe(11);
  });
});

describe("useHasPortfolio", () => {
  it("reports no portfolio while the API has not answered", () => {
    api.portfolios = null;
    const { result } = renderHook(() => useHasPortfolio());
    expect(result.current[0]).toBe(false);
  });

  it("keeps an id the account still owns", async () => {
    api.portfolios = [{ id: "7", is_active: true }];
    setActivePortfolioId("7");
    renderHook(() => useHasPortfolio());
    await act(async () => {});
    expect(getActivePortfolioId()).toBe("7");
  });

  it("re-points an id left over from another session", async () => {
    api.portfolios = [{ id: "7", is_active: true }];
    setActivePortfolioId("6"); // a portfolio this account does not own
    renderHook(() => useHasPortfolio());
    await act(async () => {});
    expect(getActivePortfolioId()).toBe("7");
  });

  it("prefers the portfolio the server marks active", async () => {
    api.portfolios = [
      { id: "11", is_active: false },
      { id: "12", is_active: true },
    ];
    setActivePortfolioId("99");
    renderHook(() => useHasPortfolio());
    await act(async () => {});
    expect(getActivePortfolioId()).toBe("12");
  });

  it("drops the stored id when the account owns nothing", async () => {
    api.portfolios = [];
    setActivePortfolioId("6");
    renderHook(() => useHasPortfolio());
    await act(async () => {});
    expect(getActivePortfolioId()).toBeNull();
  });

  it("unlocks the app once the API returns a portfolio", async () => {
    api.portfolios = [{ id: "7", is_active: true }];
    const { result } = renderHook(() => useHasPortfolio());
    await act(async () => {});
    expect(result.current[0]).toBe(true);
    expect(result.current[2]).toBe(true);
  });
});
