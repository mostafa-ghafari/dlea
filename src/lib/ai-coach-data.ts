/**
 * AI coach types and scope labels.
 * Mock data has been removed — all coach data now comes from the backend API.
 */

import { faDigitsToLatin } from "@/lib/persian-calendar";

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

/**
 * Numbers on the coach page are shown with English (Latin) digits — the backend
 * emits Persian ones. Only the Jalali date cells (`label` / `range`) keep their
 * Persian form, so every other value on the page goes through this helper.
 * The Persian percent sign becomes `%` to match the Latin digits.
 */
export function englishDigits(input: string): string {
  return faDigitsToLatin(input).replace(/٪/g, "%");
}

/**
 * One numeric cell from a coach report (`۳۳.۳٪`, `+۱,۳۲۶$`) → the form the page
 * shows: Latin digits, `%` for `٪`, and money as sign-then-amount (`+$1,326`).
 * It composes `englishDigits` because a stored row may still hold Persian
 * digits, and the sign cannot be moved until they are Latin. Prose keeps using
 * `englishDigits` on its own.
 */
export function coachNumber(input: string): string {
  return englishDigits(input).replace(/^([+-])([\d.,]+)\$$/, "$1$$$2");
}
