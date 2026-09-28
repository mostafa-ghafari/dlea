import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { hasAuthToken } from "@/lib/app-state";

/**
 * Layout of every signed-in section.
 *
 * The app also renders on the server, where `localStorage` does not exist, so
 * the first render always answers "unknown" — that keeps the server markup and
 * the hydration render identical. The real answer arrives in the effect, and
 * only a *known* missing token redirects (and then renders nothing, so the
 * shell never paints for a visitor who is signed out).
 */
function AppLayout() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const ok = hasAuthToken();
    setAuthenticated(ok);
    if (!ok) {
      navigate({ to: "/login", replace: true });
    }
  }, [navigate]);

  if (authenticated === false) return null;
  return <Outlet />;
}

export const Route = createFileRoute("/app")({
  component: AppLayout,
});
