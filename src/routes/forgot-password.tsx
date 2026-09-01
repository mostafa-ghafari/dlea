import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LineChart, ArrowLeft, Loader2, Mail, KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "بازیابی رمز عبور — Dlea AI" }] }),
  component: ForgotPasswordPage,
});

import { API_BASE } from "@/lib/api";

type Step = "email" | "code" | "new-password";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);

  // Step 1: email
  const [email, setEmail] = useState("");

  // Step 2: code
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  // Step 3: new password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ─── Step 1: Send verification code ──────────────────────────────
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("ایمیل الزامی است");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/password-reset-request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "ارسال کد تایید ناموفق بود");
        setLoading(false);
        return;
      }
      toast.success("کد تایید به ایمیل شما ارسال شد");
      setStep("code");
    } catch {
      toast.error("خطا در اتصال به سرور");
    }
    setLoading(false);
  }

  // ─── Step 2: Verify code ────────────────────────────────────────
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      toast.error("کد تایید باید ۶ رقمی باشد");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/password-reset-verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "کد تایید نادرست است");
        setLoading(false);
        return;
      }
      toast.success("کد تایید شد");
      setStep("new-password");
    } catch {
      toast.error("خطا در اتصال به سرور");
    }
    setLoading(false);
  }

  // ─── Step 3: Set new password ────────────────────────────────────
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("رمز عبور باید حداقل ۸ کاراکتر باشد");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("رمزهای عبور مطابقت ندارند");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/password-reset-confirm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: code.join(""),
          password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "تغییر رمز عبور ناموفق بود");
        setLoading(false);
        return;
      }
      toast.success("رمز عبور با موفقیت تغییر کرد");
      navigate({ to: "/login" });
    } catch {
      toast.error("خطا در اتصال به سرور");
    }
    setLoading(false);
  }

  // ─── Code input handler ──────────────────────────────────────────
  function handleCodeInput(index: number, value: string) {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      const next = document.getElementById(`code-${index + 1}`);
      next?.focus();
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prev = document.getElementById(`code-${index - 1}`);
      prev?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = pasted.split("").concat(Array(6 - pasted.length).fill(""));
    setCode(newCode);
    // Focus last filled input or first empty
    const focusIndex = Math.min(pasted.length, 5);
    const target = document.getElementById(`code-${focusIndex}`);
    target?.focus();
  }

  const stepConfig = {
    email: { icon: Mail, title: "بازیابی رمز عبور", desc: "ایمیل خود را وارد کنید تا کد تایید برایتان ارسال شود." },
    code: { icon: KeyRound, title: "کد تایید", desc: `کد ۶ رقمی ارسال شده به ${email} را وارد کنید.` },
    "new-password": { icon: Lock, title: "رمز جدید", desc: "رمز عبور جدید خود را انتخاب کنید." },
  };

  const { icon: StepIcon, title, desc } = stepConfig[step];

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
          {/* Step indicator */}
          <div className="mb-6 flex items-center justify-center gap-2">
            {(["email", "code", "new-password"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step === s
                      ? "bg-primary text-primary-foreground"
                      : (["email", "code", "new-password"].indexOf(step) > i)
                        ? "bg-primary/30 text-primary"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 2 && (
                  <div className={`h-0.5 w-8 ${(["email", "code", "new-password"].indexOf(step) > i) ? "bg-primary" : "bg-secondary"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <StepIcon className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </div>

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">ایمیل</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-secondary/60"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowLeft className="mr-1 h-4 w-4" />
                )}
                ارسال کد تایید
              </Button>
            </form>
          )}

          {/* Step 2: Code */}
          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label>کد ۶ رقمی</Label>
                <div className="flex justify-center gap-2" dir="ltr">
                  {code.map((digit, i) => (
                    <Input
                      key={i}
                      id={`code-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeInput(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      onPaste={i === 0 ? handleCodePaste : undefined}
                      className="h-12 w-12 text-center text-lg font-bold tabular bg-secondary/60"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowLeft className="mr-1 h-4 w-4" />
                )}
                تایید کد
              </Button>
              <button
                type="button"
                className="w-full text-center text-xs text-muted-foreground hover:text-primary"
                onClick={() => {
                  setCode(["", "", "", "", "", ""]);
                  handleSendCode(new Event("submit") as any);
                }}
              >
                ارسال مجدد کد
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === "new-password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-pw">رمز عبور جدید</Label>
                <Input
                  id="new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="حداقل ۸ کاراکتر"
                  className="bg-secondary/60"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pw">تکرار رمز عبور</Label>
                <Input
                  id="confirm-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="رمز عبور را دوباره وارد کنید"
                  className="bg-secondary/60"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowLeft className="mr-1 h-4 w-4" />
                )}
                تغییر رمز عبور
              </Button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            ← بازگشت به ورود
          </Link>
        </div>
      </div>
    </div>
  );
}
