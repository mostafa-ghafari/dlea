import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export type Theme = "dark" | "light";
const KEY = "tj:theme";

function apply(theme: Theme) {
  const html = document.documentElement;
  html.classList.toggle("dark", theme === "dark");
  html.classList.toggle("light", theme === "light");
}

/** Dark/light theme state persisted in localStorage (SSR safe). */
function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === "light" || raw === "dark") return raw;
  } catch {
    /* ignore */
  }
  return "dark";
}

// Apply theme immediately on module load to prevent flash (SSR safe)
if (typeof document !== "undefined") {
  apply(getStoredTheme());
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  const update = useCallback((next: Theme) => {
    setTheme(next);
    apply(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return { theme, setTheme: update };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={dark ? "تغییر به تم روشن" : "تغییر به تم تیره"}
      title={dark ? "تم روشن" : "تم تیره"}
      className={`h-10 w-10 border-border bg-secondary/60 ${className ?? ""}`}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
