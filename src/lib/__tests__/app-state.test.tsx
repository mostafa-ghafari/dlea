import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ACTIVE_PORTFOLIO_KEY,
  fullName,
  getActivePortfolioId,
  getCurrentUser,
  setActivePortfolioId,
  useLocalState,
} from "@/lib/app-state";

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
