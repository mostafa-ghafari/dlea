import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LineChart, ArrowLeft, CheckCircle2, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "ثبت‌نام — Dlea AI" }] }),
  component: SignupPage,
});

import { API_BASE } from "@/lib/api";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

type Step = "form" | "otp" | "done";

function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [debugOtp, setDebugOtp] = useState("");

  // Initialize Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
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
        toast.error(data.error || "خطا در ثبت‌نام با گوگل");
        setGoogleLoading(false);
        return;
      }

      localStorage.setItem("dlea:access", data.access);
      localStorage.setItem("dlea:refresh", data.refresh);
      localStorage.setItem("dlea:user", JSON.stringify(data.user));

      setStep("done");
      toast.success("ثبت‌نام با موفقیت انجام شد");
      setTimeout(() => navigate({ to: "/app/dashboard" }), 600);
    } catch {
      toast.error("خطا در اتصال به سرور");
    }
    setGoogleLoading(false);
  }

  function startCountdown() {
    setCountdown(60);
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(iv); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) { toast.error("نام و نام خانوادگی الزامی است"); return; }
    if (!email.trim()) { toast.error("ایمیل الزامی است"); return; }
    if (!email.includes("@")) { toast.error("ایمیل معتبر نیست"); return; }
    if (password.length < 8) { toast.error("رمز عبور باید حداقل ۸ کاراکتر باشد"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "خطا در ارسال کد"); setLoading(false); return; }
      setDebugOtp(data.debug_otp || "");
      setStep("otp");
      startCountdown();
      toast.success(`کد تأیید به ${email} ارسال شد`);
    } catch {
      toast.error("خطا در اتصال به سرور");
    }
    setLoading(false);
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) { toast.error("کد تأیید ۶ رقمی را وارد کنید"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "خطا در تأیید کد"); setLoading(false); return; }

      // Auto-login: save tokens
      localStorage.setItem("dlea:access", data.access);
      localStorage.setItem("dlea:refresh", data.refresh);
      localStorage.setItem("dlea:user", JSON.stringify(data.user));

      setStep("done");
      toast.success("ثبت‌نام با موفقیت انجام شد");
      setTimeout(() => navigate({ to: "/app/dashboard" }), 600);
    } catch {
      toast.error("خطا در اتصال به سرور");
    }
    setLoading(false);
  }

  async function handleResendOtp() {
    if (countdown > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setDebugOtp(data.debug_otp || "");
        startCountdown();
        toast.success(`کد جدید به ${email} ارسال شد`);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  function handleGoogleSignup() {
    if (!GOOGLE_CLIENT_ID) {
      toast.error("ثبت‌نام با گوگل تنظیم نشده است. لطفاً GOOGLE_CLIENT_ID را در فایل env تنظیم کنید.");
      return;
    }
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      toast.error("سرویس گوگل هنوز بارگذاری نشده است. لطفاً صفحه را رفرش کنید.");
    }
  }

  return (
    <div className="hero-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[var(--shadow-glow)]">
            <LineChart className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">Dlea <span className="text-primary">AI</span></span>
        </Link>

        <div className="card-surface grid overflow-hidden md:grid-cols-2">
          <div className="border-l border-border bg-secondary/20 p-8">
            <h2 className="text-lg font-semibold">با پلن رایگان شروع کنید</h2>
            <p className="mt-2 text-sm text-muted-foreground">همیشه می‌توانید بعداً ارتقا دهید.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {["۱ پرتفولیو رایگان", "۵۰ معامله در ماه", "ژورنال کامل", "آمار پایه", "بدون نیاز به کارت اعتباری"].map((f) => (
                <li key={f} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{f}</span></li>
              ))}
            </ul>
          </div>

          <div className="p-8">
            {/* Step 1: Form */}
            {step === "form" && (
              <>
                <h1 className="text-2xl font-bold">ساخت حساب جدید</h1>
                <form className="mt-6 space-y-4" onSubmit={handleSendOtp}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">نام</Label>
                      <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="علی" className="bg-secondary/60" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">نام خانوادگی</Label>
                      <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="رضایی" className="bg-secondary/60" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">ایمیل</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-secondary/60" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">رمز عبور</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="حداقل ۸ کاراکتر" className="bg-secondary/60" />
                  </div>
                  <Button type="submit" disabled={loading} className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ArrowLeft className="mr-1 h-4 w-4" />}
                    ارسال کد تأیید
                  </Button>
                </form>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">یا</span></div>
                </div>
                <Button variant="outline" className="w-full gap-2" onClick={handleGoogleSignup} disabled={googleLoading}>
                  {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  )}
                  ثبت‌نام با Google
                </Button>
                {!GOOGLE_CLIENT_ID && (
                  <p className="mt-2 text-center text-xs text-amber-500/80">
                    ⚠️ ثبت‌نام با گوگل نیاز به تنظیم GOOGLE_CLIENT_ID دارد
                  </p>
                )}
                <p className="mt-4 text-xs text-muted-foreground">با ثبت‌نام، قوانین و حریم خصوصی را می‌پذیرید.</p>
              </>
            )}

            {/* Step 2: OTP */}
            {step === "otp" && (
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Mail className="h-7 w-7" />
                </div>
                <h1 className="mt-4 text-2xl font-bold">تأیید ایمیل</h1>
                <p className="mt-2 text-sm text-muted-foreground">کد ۶ رقمی به <span className="font-medium text-foreground">{email}</span> ارسال شد</p>
                {debugOtp && (
                  <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
                    <p className="text-amber-600 dark:text-amber-400 font-medium">🔑 کد تأیید (dev):</p>
                    <p className="mt-1 text-2xl font-mono font-bold tracking-widest text-amber-700 dark:text-amber-300" dir="ltr">{debugOtp}</p>
                    <p className="mt-1 text-xs text-amber-600/70 dark:text-amber-400/70">این کد در حالت توسعه نمایش داده می‌شود</p>
                  </div>
                )}
                <div className="mt-6 flex justify-center" dir="ltr">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /></InputOTPGroup>
                    <InputOTPGroup><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup>
                  </InputOTP>
                </div>
                <Button disabled={loading || otp.length !== 6} onClick={handleVerifyOtp} className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ArrowLeft className="mr-1 h-4 w-4" />}
                  تأیید و ساخت حساب
                </Button>
                <button type="button" disabled={countdown > 0} onClick={handleResendOtp} className="mt-4 text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
                  {countdown > 0 ? `ارسال مجدد بعد از ${countdown} ثانیه` : "ارسال مجدد کد"}
                </button>
                <button type="button" onClick={() => setStep("form")} className="mt-2 block w-full text-xs text-muted-foreground hover:underline">بازگشت به فرم ثبت‌نام</button>
              </div>
            )}

            {/* Step 3: Done */}
            {step === "done" && (
              <div className="text-center py-8">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-500/15 text-green-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h1 className="mt-4 text-2xl font-bold">ثبت‌نام موفق! 🎉</h1>
                <p className="mt-2 text-sm text-muted-foreground">در حال انتقال به داشبورد...</p>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              حساب دارید?{" "}
              <Link to="/login" className="text-primary hover:underline">وارد شوید</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
