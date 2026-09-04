import { useCallback, useEffect, useState } from "react";
import { fetchPortfolios, useApi } from "./api";

/** Small localStorage-backed state helper (SSR safe). */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* ignore */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update, ready] as const;
}

export type CurrentUser = {
  id: number | string;
  email: string;
  firstName: string;
  lastName: string;
};

export function getCurrentUser(): CurrentUser | null {
  try {
    const raw = window.localStorage.getItem("dlea:user");
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}

export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    setUser(getCurrentUser());
  }, []);
  return user;
}

export function fullName(user: CurrentUser | null): string {
  if (!user) return "کاربر";
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return name || user.email || "کاربر";
}

export const ONBOARDING_KEY = "tj:has-portfolio:v2";

/** Onboarding gate: a trader must create a portfolio before anything else. */
export function useHasPortfolio(): [boolean, (v: boolean) => void, boolean] {
  const [manual, setManual, lsReady] = useLocalState<boolean>(ONBOARDING_KEY, false);
  // Seeded portfolios unlock the app too — the gate follows the API, not just
  // the localStorage flag that gets set when a portfolio is created in the UI.
  const { data, loading } = useApi(fetchPortfolios, []);
  const hasPortfolio = manual || (data?.length ?? 0) > 0;
  const ready = lsReady && !loading;
  return [hasPortfolio, setManual, ready];
}
export const ACTIVE_PORTFOLIO_KEY = "dlea:active-portfolio";

/** Get the currently active portfolio ID from localStorage. */
export function getActivePortfolioId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_PORTFOLIO_KEY);
}

/** Set the active portfolio ID in localStorage. */
export function setActivePortfolioId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) {
    window.localStorage.setItem(ACTIVE_PORTFOLIO_KEY, id);
  } else {
    window.localStorage.removeItem(ACTIVE_PORTFOLIO_KEY);
  }
}

/** React hook for the active portfolio ID. */
export function useActivePortfolioId(): [string | null, (id: string | null) => void] {
  const [id, setId] = useLocalState<string | null>(ACTIVE_PORTFOLIO_KEY, null);
  const set = useCallback((next: string | null) => {
    setId(next);
    setActivePortfolioId(next);
  }, [setId]);
  return [id, set];
}
