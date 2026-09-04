import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { LineChart, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "ورود — Dlea AI" }] }),
  component: LoginPage,
});

import { API_BASE } from "@/lib/api";

// Google Client ID — set in backend/.env as GOOGLE_CLIENT_ID
// For dev, we use a placeholder; when not configured, the Google button shows a toast
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean }) => void) => void;
        };
      };
    };
  }
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    // Load the GIS script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
        });
      }
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  async function handleGoogleCredential(response: { credential: string }) {
    setGoogleLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "خطا در ورود با گوگل");
        setGoogleLoading(false);
        return;
      }

      localStorage.setItem("dlea:access", data.access);
      localStorage.setItem("dlea:refresh", data.refresh);
      localStorage.setItem("dlea:user", JSON.stringify(data.user));

      toast.success(`خوش آمدید ${data.user.firstName || ""}`);
      if (data.role === "admin") {
        navigate({ to: "/app/admin/dashboard" });
      } else {
        navigate({ to: "/app/dashboard" });
      }
    } catch {
      toast.error("خطا در اتصال به سرور");
      setGoogleLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("ایمیل الزامی است");
      return;
    }
    if (!password.trim()) {
      toast.error("رمز عبور الزامی است");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "خطا در ورود");
        setLoading(false);
        return;
      }

      localStorage.setItem("dlea:access", data.access);
      localStorage.setItem("dlea:refresh", data.refresh);
      localStorage.setItem("dlea:user", JSON.stringify(data.user));

      toast.success(`خوش آمدید ${data.user.firstName || ""}`);
      if (data.role === "admin") {
        navigate({ to: "/app/admin/dashboard" });
      } else {
        navigate({ to: "/app/dashboard" });
      }
    } catch {
      toast.error("خطا در اتصال به سرور");
    }
    setLoading(false);
  }

  function handleGoogleLogin() {
    if (!GOOGLE_CLIENT_ID) {
      toast.error("ورود با گوگل تنظیم نشده است. لطفاً GOOGLE_CLIENT_ID را در فایل env تنظیم کنید.");
      return;
    }
    if (window.google) {
      setGoogleLoading(true);
      window.google.accounts.id.prompt((notification) => {
        // If the prompt was not displayed (user dismissed or unsupported), stop loading
        if (notification.isNotDisplayed()) {
          setGoogleLoading(false);
        }
      });
    } else {
      toast.error("سرویس گوگل هنوز بارگذاری نشده است. لطفاً صفحه را رفرش کنید.");
    }
  }

  return (
    <div className="hero-bg flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[var(--shadow-glow)]">
            <LineChart className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">
            Dlea <span className="text-primary">AI</span>
          </span>
        </Link>

        <div className="card-surface p-8">
          <h1 className="text-2xl font-bold">ورود به حساب</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            اطلاعات حساب خود را وارد کنید.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-secondary/60"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">رمز عبور</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  فراموشی رمز؟
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary/60 pl-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowLeft className="mr-1 h-4 w-4" />
              )}
              ورود
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">یا</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            ورود با Google
          </Button>
          {!GOOGLE_CLIENT_ID && (
            <p className="mt-2 text-center text-xs text-amber-500/80">
              ⚠️ ورود با گوگل نیاز به تنظیم GOOGLE_CLIENT_ID دارد
            </p>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          حساب ندارید?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            ثبت‌نام کنید
          </Link>
        </div>
      </div>
    </div>
  );
}
