import { AppShell } from "@/components/AppShell";
import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Brain,
  RefreshCw,
  ShieldCheck,
  Cpu,
  ChevronRight,
  ChevronLeft,
  ListChecks,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCoachPeriods, generateCoachReport, useAiInsights, useApi, usePlanLimits } from "@/lib/api";
import { scopeLabels, type CoachScope } from "@/lib/ai-coach-data";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useActivePortfolioId } from "@/lib/app-state";

export const Route = createFileRoute("/app/ai-coach")({
  head: () => ({
    meta: [
      { title: "مربی هوشمند | Dlea AI" },
      { name: "description", content: "گزارش کامل مربی هوش مصنوعی با تمرکز بر نقاط ضعف و راهکار رفع آن‌ها، قابل جابه‌جایی بین روزها، هفته‌ها، ماه‌ها و سال‌های گذشته." },
      { property: "og:title", content: "مربی هوشمند Dlea AI" },
      { property: "og:description", content: "تحلیل رفتار معامله‌گری و برنامه عملی رفع ضعف‌ها." },
    ],
  }),
  component: AiCoach,
});

const severityStyle: Record<string, string> = {
  "بحرانی": "border-destructive/50 bg-destructive/15 text-destructive",
  "مهم": "border-accent/50 bg-accent/10 text-accent",
  "قابل بهبود": "border-border bg-secondary/60 text-muted-foreground",
};

function AiCoach() {
  const insights = useAiInsights();
  const limits = usePlanLimits();
  const periodsApi = useApi(fetchCoachPeriods);
  const coachPeriods = periodsApi.data ?? [];
  const [generating, setGenerating] = useState(false);
  const existingCount = coachPeriods.length;
  const isFree = limits.slug === "free";
  const canAnalyze = !isFree || existingCount < 1;
  const models = insights?.models ?? [];
  const [model, setModel] = useState<string | undefined>(undefined);
  // Sync model when models load from API — pick the first available model
  useEffect(() => {
    if (models.length > 0) {
      setModel((prev) => {
        if (prev && models.some((m) => m.id === prev)) return prev;
        return models[0].id;
      });
    }
  }, [models]);
  const activeModel = models.find((m) => m.id === model) ?? models[0] ?? { id: "coach-pro", name: "Coach Pro", desc: "" };

  const [scope, setScope] = useState<CoachScope>("weekly");
  const list = useMemo(() => coachPeriods.filter((p) => p.scope === scope), [scope, coachPeriods]);
  const [index, setIndex] = useState(0);
  const [activePortfolioId] = useActivePortfolioId();
  const period = list[Math.min(index, list.length - 1)];

  function changeScope(next: CoachScope) {
    setScope(next);
    setIndex(0);
  }

  async function runNewAnalysis() {
    if (generating) return;
    setGenerating(true);
    try {
      await generateCoachReport(scope, model, activePortfolioId ?? undefined);
      toast.success(`تحلیل ${scopeLabels[scope]} با ${activeModel.name} ساخته شد و در لیست بازه‌ها ذخیره شد.`);
      // The fresh report has the newest sort_key, so it lands at the top of its scope list.
      await periodsApi.reload();
      setIndex(0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطا در ساخت تحلیل");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AppShell title="مربی هوشمند AI" subtitle="تحلیل عملکرد در هر بازه زمانی؛ با تمرکز روی ضعف‌ها و راهکار رفع آن‌ها" actions={
      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={generating || !canAnalyze} onClick={runNewAnalysis}>
        <RefreshCw className={`ml-1 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
        {generating ? "در حال تحلیل با Gemini..." : canAnalyze ? "تحلیل جدید" : "محدودت تحلیل رایگان"}
      </Button>
    }>
      {/* Model selector */}
      <div className="card-surface p-5">
        <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Cpu className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">مدل مربی هوشمند</div>
              <div className="text-xs text-muted-foreground">{activeModel.desc}</div>
            </div>
          </div>
          <Select value={model ?? ""} onValueChange={setModel}>
            <SelectTrigger className="bg-secondary/60 md:max-w-sm">
              <SelectValue placeholder="انتخاب مدل..." />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex flex-col text-right">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-[11px] text-muted-foreground">{m.desc}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
            <Brain className="ml-1 h-3 w-3" /> فعال
          </Badge>
        </div>
      </div>

      {/* Period navigator — the whole page follows this */}
      <div className="card-surface mt-6 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={scope} onValueChange={(v) => changeScope(v as CoachScope)}>
            <TabsList className="bg-secondary/60">
              {(Object.keys(scopeLabels) as CoachScope[]).map((k) => (
                <TabsTrigger key={k} value={k}>{scopeLabels[k]}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={index >= list.length - 1}
              onClick={() => setIndex((i) => Math.min(i + 1, list.length - 1))}
              aria-label="بازه قبلی"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Select value={period?.id ?? ""} onValueChange={(v) => setIndex(list.findIndex((p) => p.id === v))}>
              <SelectTrigger className="h-9 min-w-[190px] bg-secondary/60 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {list.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={index <= 0}
              onClick={() => setIndex((i) => Math.max(i - 1, 0))}
              aria-label="بازه بعدی"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {!period ? (
        <div className="card-surface mt-6 p-8 text-center text-sm text-muted-foreground">
          گزارشی برای این بازه بایگانی نشده است.
        </div>
      ) : (
        <>
          {/* Hero summary */}
          <div className="card-surface hero-bg mt-6 overflow-hidden p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[var(--shadow-glow)]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold">گزارش {scopeLabels[period.scope]} — {period.label}</h2>
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                    <Brain className="ml-1 h-3 w-3" />هوش مصنوعی
                  </Badge>
                  <Badge variant="outline" className={`tabular ${period.net.startsWith("-") ? "loss" : "gain"}`}>{period.net}</Badge>
                  <Badge variant="outline" className="tabular">Win Rate: {period.winRate}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground tabular">{period.range}</div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">{period.summary}</p>
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {period.scores.map((s) => (
              <div key={s.label} className="card-surface p-5">
                <div className="text-sm text-muted-foreground">{s.label}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tabular">{s.value}</span>
                  <span className="text-sm text-muted-foreground">/ ۱۰۰</span>
                </div>
                <Progress value={s.value} className="mt-3 h-1.5" />
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="card-surface mt-6 p-5">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">آمار بازه</h3>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {period.stats.map((s) => (
                <div key={s.label} className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="text-[11px] text-muted-foreground">{s.label}</div>
                  <div className="mt-1 text-sm font-bold tabular">{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses — the main focus */}
          <div className="card-surface mt-6 border-destructive/25 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold">نقاط ضعف و راهکار رفع آن‌ها</h3>
              <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">
                اولویت اصلی این بازه
              </Badge>
            </div>
            <div className="mt-4 space-y-4">
              {period.weaknesses.map((w) => (
                <div key={w.title} className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                    <span className="font-medium">{w.title}</span>
                    <Badge variant="outline" className={severityStyle[w.severity]}>{w.severity}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{w.impact}</div>

                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-background/50 p-3 text-xs text-foreground/90">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    <span><span className="font-semibold text-accent">راهکار:</span> {w.solution}</span>
                  </div>

                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {w.steps.map((st, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-lg border border-border bg-background/40 p-2.5 text-xs">
                        <div className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-destructive/20 text-[10px] font-bold text-destructive tabular">
                          {i + 1}
                        </div>
                        <span className="text-foreground/90">{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths — encouragement */}
          <div className="card-surface mt-6 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">نقاط قوت — ادامه بده</h3>
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">تشویق</Badge>
            </div>
            <ul className="mt-4 grid gap-3 lg:grid-cols-2">
              {period.strengths.map((s) => (
                <li key={s.title} className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-sm font-medium">{s.title}</span>
                  </div>
                  <div className="mt-2 flex items-start gap-2 rounded-md bg-background/40 p-2.5 text-xs text-foreground/90">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span><span className="font-semibold text-primary">پایدار نگه‌دار:</span> {s.keepDoing}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Highlights + action plan */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="card-surface p-5">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">نکات کلیدی بازه</h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {period.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-foreground/90">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-surface p-5">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                <h3 className="font-semibold">برنامه عملی بازه بعد</h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {period.actionPlan.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 p-3">
                    <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/20 text-[10px] font-bold text-accent tabular">
                      {i + 1}
                    </div>
                    <span className="text-foreground/90">{a}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-muted-foreground">
                گزارش‌های گذشته به‌عنوان زمینه (Context) برای سنجش روند بهبود در تحلیل‌های بعدی استفاده می‌شوند.
              </p>
            </div>
          </div>
        </>
      )}

    </AppShell>
);
}
