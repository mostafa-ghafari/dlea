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

/**
 * Is there an access token to send?
 *
 * Only a routing hint — the API still rejects an expired token. Deliberately
 * *not* SSR-safe: callers must guard `typeof window`, because the app renders
 * on the server too.
 */
export function hasAuthToken(): boolean {
  try {
    return Boolean(window.localStorage.getItem("dlea:access"));
  } catch {
    return false;
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
  const [manual, setManual, lsReady] = useLocalState<boolean>(
    ONBOARDING_KEY,
    false,
  );
  // Seeded portfolios unlock the app too — the gate follows the API, not just
  // the localStorage flag that gets set when a portfolio is created in the UI.
  const { data, loading } = useApi(fetchPortfolios, []);
  const hasPortfolio = manual || (data?.length ?? 0) > 0;
  const ready = lsReady && !loading;
  // A portfolio id outlives the session that chose it: logging out (or signing
  // in as somebody else) used to leave `dlea:active-portfolio` pointing at a
  // portfolio this account does not own, and every scoped request — trades,
  // journal, dashboard — then came back empty. Mirror whatever
  // `resolveActivePortfolioId` decides into localStorage, or drop it when there
  // are no portfolios at all.
  useEffect(() => {
    if (!data) return;
    const stored = getActivePortfolioId();
    const nextId = resolveActivePortfolioId(data, stored);
    // Only write when it really changes, so the effect converges instead of
    // re-notifying every subscriber on each render.
    if (nextId !== stored) setActivePortfolioId(nextId);
  }, [data]);
  return [hasPortfolio, setManual, ready];
}

/**
 * The one portfolio the app should treat as active.
 *
 * The server's `is_active` is the only definition of "active": the MT sync,
 * the coach's default period and this module all read it, and `activate/`
 * maintains it as a single-active invariant. The id kept in
 * `dlea:active-portfolio` is therefore a mirror of that flag, never a second
 * opinion — letting a stale stored id outrank it is what let the portfolios
 * page paint two cards as active at once (the stored one the UI scoped to, plus
 * the one the server still listed as `is_active`).
 *
 * Rows written before the single-active migration can all be inactive, so a
 * stored id the account still owns is kept when the server marks nothing active
 * at all.
 */
export function resolveActivePortfolioId(
  portfolios: readonly { id: string | number; is_active?: boolean }[],
  storedId: string | null,
): string | null {
  const serverActive = portfolios.find((p) => p.is_active);
  if (serverActive) return String(serverActive.id);
  if (storedId && portfolios.some((p) => String(p.id) === storedId)) {
    return storedId;
  }
  const first = portfolios[0];
  return first ? String(first.id) : null;
}
export const ACTIVE_PORTFOLIO_KEY = "dlea:active-portfolio";

// ── Cross-component portfolio broadcast ─────────────────────────────
// When one component calls setActivePortfolioId(), every other component
// that uses useActivePortfolioId() must re-render with the new value.
const _portfolioListeners = new Set<() => void>();

function _notifyPortfolioListeners() {
  for (const fn of _portfolioListeners) fn();
}

/** Get the currently active portfolio ID from localStorage. */
export function getActivePortfolioId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_PORTFOLIO_KEY);
}

/** Set the active portfolio ID in localStorage and notify all subscribers. */
export function setActivePortfolioId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) {
    window.localStorage.setItem(ACTIVE_PORTFOLIO_KEY, id);
  } else {
    window.localStorage.removeItem(ACTIVE_PORTFOLIO_KEY);
  }
  _notifyPortfolioListeners();
}

/** React hook for the active portfolio ID. */
export function useActivePortfolioId(): [
  string | null,
  (id: string | null) => void,
] {
  const [id, setId] = useState<string | null>(() => getActivePortfolioId());
  const [ready, setReady] = useState(false);

  // Sync from localStorage on mount (SSR safety)
  useEffect(() => {
    setId(getActivePortfolioId());
    setReady(true);
  }, []);

  // Subscribe to cross-component changes
  useEffect(() => {
    const listener = () => {
      setId(getActivePortfolioId());
    };
    _portfolioListeners.add(listener);
    return () => {
      _portfolioListeners.delete(listener);
    };
  }, []);

  const set = useCallback((next: string | null) => {
    setId(next);
    setActivePortfolioId(next);
  }, []);
  return [id, set];
}
