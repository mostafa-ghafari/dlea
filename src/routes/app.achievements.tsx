import { useSetTitle } from "@/lib/page-context";
import { AppShell } from "@/components/AppShell";
import { createFileRoute } from "@tanstack/react-router";
import {
  Trophy, Lock, Shield, Flame, Target, TrendingDown, BookOpen,
  Brain, BarChart3, Heart, Zap, Calendar, DollarSign, Star,
  Link2, CheckCircle2, Swords,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAchievements } from "@/lib/api";

export const Route = createFileRoute("/app/achievements")({
  head: () => ({ meta: [{ title: "نشان‌ها" }] }),
  component: AchievementsPage,
});

/** Each achievement gets its own icon + color scheme for visual variety */
const achievementStyle: Record<string, {
  icon: typeof Trophy;
  iconColor: string;
  bgGradient: string;
  bgLocked: string;
  badgeClass: string;
}> = {
  "۷ روز پایبند به پلن": {
    icon: Shield,
    iconColor: "text-emerald-500",
    bgGradient: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
    bgLocked: "bg-emerald-500/10 text-emerald-500/40",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  },
  "کاهش دراودان ۵٪": {
    icon: TrendingDown,
    iconColor: "text-sky-500",
    bgGradient: "bg-gradient-to-br from-sky-500 to-sky-600 text-white",
    bgLocked: "bg-sky-500/10 text-sky-500/40",
    badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-600",
  },
  "بدون Revenge Trade در یک ماه": {
    icon: Brain,
    iconColor: "text-purple-500",
    bgGradient: "bg-gradient-to-br from-purple-500 to-purple-600 text-white",
    bgLocked: "bg-purple-500/10 text-purple-500/40",
    badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-600",
  },
  "۱۰۰ معامله ثبتشده": {
    icon: BarChart3,
    iconColor: "text-amber-500",
    bgGradient: "bg-gradient-to-br from-amber-500 to-amber-600 text-white",
    bgLocked: "bg-amber-500/10 text-amber-500/40",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  },
  "Profit Factor بالای ۲": {
    icon: DollarSign,
    iconColor: "text-green-500",
    bgGradient: "bg-gradient-to-br from-green-500 to-green-600 text-white",
    bgLocked: "bg-green-500/10 text-green-500/40",
    badgeClass: "border-green-500/30 bg-green-500/10 text-green-600",
  },
  "بدون ورود احساسی در ۳۰ روز": {
    icon: Heart,
    iconColor: "text-rose-500",
    bgGradient: "bg-gradient-to-br from-rose-500 to-rose-600 text-white",
    bgLocked: "bg-rose-500/10 text-rose-500/40",
    badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  },
  "اولین معامله ثبتشده": {
    icon: Zap,
    iconColor: "text-yellow-500",
    bgGradient: "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white",
    bgLocked: "bg-yellow-500/10 text-yellow-500/40",
    badgeClass: "border-yellow-500/30 bg-yellow-500/10 text-yellow-600",
  },
  "۳۰ روز متوالی ژورالنویسی": {
    icon: BookOpen,
    iconColor: "text-indigo-500",
    bgGradient: "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white",
    bgLocked: "bg-indigo-500/10 text-indigo-500/40",
    badgeClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600",
  },
  "ماه سودده": {
    icon: Star,
    iconColor: "text-orange-500",
    bgGradient: "bg-gradient-to-br from-orange-500 to-orange-600 text-white",
    bgLocked: "bg-orange-500/10 text-orange-500/40",
    badgeClass: "border-orange-500/30 bg-orange-500/10 text-orange-600",
  },
  "Win Rate بالای ۷۰٪": {
    icon: Target,
    iconColor: "text-teal-500",
    bgGradient: "bg-gradient-to-br from-teal-500 to-teal-600 text-white",
    bgLocked: "bg-teal-500/10 text-teal-500/40",
    badgeClass: "border-teal-500/30 bg-teal-500/10 text-teal-600",
  },
  "ریسک زیر ۱٪ در ۵۰ معامله": {
    icon: Shield,
    iconColor: "text-cyan-500",
    bgGradient: "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white",
    bgLocked: "bg-cyan-500/10 text-cyan-500/40",
    badgeClass: "border-cyan-500/30 bg-cyan-500/10 text-cyan-600",
  },
  "بدون Overtrading در ۲ هفته": {
    icon: Calendar,
    iconColor: "text-violet-500",
    bgGradient: "bg-gradient-to-br from-violet-500 to-violet-600 text-white",
    bgLocked: "bg-violet-500/10 text-violet-500/40",
    badgeClass: "border-violet-500/30 bg-violet-500/10 text-violet-600",
  },
  "دابل کردن سرمایه": {
    icon: DollarSign,
    iconColor: "text-lime-600",
    bgGradient: "bg-gradient-to-br from-lime-500 to-lime-600 text-white",
    bgLocked: "bg-lime-500/10 text-lime-500/40",
    badgeClass: "border-lime-500/30 bg-lime-500/10 text-lime-600",
  },
  "۱۰ معامله A+ متوالی": {
    icon: Swords,
    iconColor: "text-pink-500",
    bgGradient: "bg-gradient-to-br from-pink-500 to-pink-600 text-white",
    bgLocked: "bg-pink-500/10 text-pink-500/40",
    badgeClass: "border-pink-500/30 bg-pink-500/10 text-pink-600",
  },
  "اتصال موفق متاتریدر": {
    icon: Link2,
    iconColor: "text-blue-500",
    bgGradient: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
    bgLocked: "bg-blue-500/10 text-blue-500/40",
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  },
  "استاد چکلیست": {
    icon: CheckCircle2,
    iconColor: "text-fuchsia-500",
    bgGradient: "bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white",
    bgLocked: "bg-fuchsia-500/10 text-fuchsia-500/40",
    badgeClass: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-600",
  },
};

const defaultStyle = {
  icon: Trophy,
  iconColor: "text-primary",
  bgGradient: "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground",
  bgLocked: "bg-secondary text-muted-foreground",
  badgeClass: "border-primary/40 bg-primary/10 text-primary",
};

function AchievementsPage() {
  const achievements = useAchievements();
  const earned = achievements.filter((a) => a.earned).length;

  return (
    <AppShell title="نشان‌ها" subtitle={`${earned} از ${achievements.length} نشان کسب‌شده`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => {
          const style = achievementStyle[a.title] ?? defaultStyle;
          const Icon = style.icon;
          return (
            <div
              key={a.id}
              className={`card-surface group p-6 text-center transition-all hover:scale-[1.02] ${
                a.earned ? "hover:shadow-lg hover:border-primary/30" : "opacity-50 grayscale hover:grayscale-0 hover:opacity-80"
              }`}
            >
              <div
                className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl transition-transform group-hover:scale-110 ${
                  a.earned
                    ? `${style.bgGradient} shadow-lg`
                    : style.bgLocked
                }`}
              >
                {a.earned ? (
                  <Icon className="h-7 w-7 drop-shadow-sm" />
                ) : (
                  <Lock className="h-6 w-6" />
                )}
              </div>
              <h3 className="mt-4 font-semibold">{a.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
              <Badge
                variant="outline"
                className={`mt-4 ${
                  a.earned ? style.badgeClass : "border-border text-muted-foreground"
                }`}
              >
                {a.earned ? "✓ کسب‌شده" : "قفل"}
              </Badge>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
