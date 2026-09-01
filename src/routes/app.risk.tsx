import { AppShell } from "@/components/AppShell";
import { createFileRoute } from "@tanstack/react-router";
import { Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/app/risk")({
  head: () => ({ meta: [{ title: "مدیریت ریسک" }] }),
  component: RiskPage,
});

const rules = [
  { label: "حداکثر ریسک هر معامله", value: "۱٪", used: 68, safe: true },
  { label: "حداکثر ضرر روزانه", value: "۳٪", used: 45, safe: true },
  { label: "حداکثر تعداد معاملات روزانه", value: "۵", used: 80, safe: true },
  { label: "حداکثر ضرر متوالی", value: "۳", used: 90, safe: false },
];

function RiskPage() {
  return (
    <AppShell title="مدیریت ریسک" subtitle="قوانین شخصی خود را تعریف کنید و پایبندی به آن‌ها را بسنجید">
    <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface space-y-4 p-6 lg:col-span-2">
          <h3 className="font-semibold">تعریف قوانین</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { l: "حداکثر ریسک هر معامله (٪)", v: "1" },
              { l: "حداکثر ضرر روزانه (٪)", v: "3" },
              { l: "حداکثر ضرر هفتگی (٪)", v: "8" },
              { l: "حداکثر معاملات روزانه", v: "5" },
              { l: "حداکثر ضرر متوالی", v: "3" },
              { l: "حداقل R:R", v: "1.5" },
            ].map((f) => (
              <div key={f.l} className="space-y-2">
                <Label>{f.l}</Label>
                <Input defaultValue={f.v} className="bg-secondary/60 tabular" />
              </div>
            ))}
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">ذخیره قوانین</Button>
        </div>

        <div className="card-surface p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">وضعیت پایبندی امروز</h3>
          </div>
          <div className="mt-6 space-y-5">
            {rules.map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{r.label}</span>
                  <Badge variant="outline" className={r.safe ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}>
                    {r.value}
                  </Badge>
                </div>
                <Progress value={r.used} className={`mt-2 h-1.5 ${!r.safe ? "[&>div]:bg-destructive" : ""}`} />
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {r.safe ? (
                    <><CheckCircle2 className="h-3 w-3 text-primary" /><span className="text-muted-foreground">{r.used}٪ استفاده‌شده</span></>
                  ) : (
                    <><AlertTriangle className="h-3 w-3 text-destructive" /><span className="text-destructive">نزدیک به حد مجاز</span></>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
);
}
