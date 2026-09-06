/**
 * AI coach types and scope labels.
 * Mock data has been removed — all coach data now comes from the backend API.
 */

export type CoachScope = "daily" | "weekly" | "monthly" | "yearly";

export type CoachWeakness = {
  title: string;
  impact: string;
  severity: "بحرانی" | "مهم" | "قابل بهبود";
  solution: string;
  steps: string[];
};

export type CoachStrength = { title: string; keepDoing: string };

export type CoachPeriod = {
  id: string;
  scope: CoachScope;
  label: string;
  range: string;
  summary: string;
  net: string;
  winRate: string;
  scores: { label: string; value: number }[];
  stats: { label: string; value: string }[];
  weaknesses: CoachWeakness[];
  strengths: CoachStrength[];
  highlights: string[];
  actionPlan: string[];
};

export const scopeLabels: Record<CoachScope, string> = {
  daily: "روزانه",
  weekly: "هفتگی",
  monthly: "ماهانه",
  yearly: "سالانه",
};
