// Type contracts for the Dlea platform.
//
// All runtime data used to live here as Persian demo arrays. That mock data
// has been replaced: every list/object now comes from the Django backend
// (seeded with Faker + curated Persian content) through `src/lib/api.ts`.
// This file only keeps the TypeScript types the UI depends on.

/* ------------------------------------------------------------------ */
/* Trades — full MetaTrader field set                                  */
/* ------------------------------------------------------------------ */

export type Trade = {
  id: string;
  ticket: string;
  symbol: string;
  side: "buy" | "sell";
  entry: number;
  exit: number;
  sl: number;
  tp: number;
  volume: number;
  pnl: number;
  rr: number;
  pips: number;
  commission: number;
  swap: number;
  taxes: number;
  openTime: string;
  closeTime: string;
  duration: string;
  magic: number;
  comment: string;
  reason: string;
  strategy: string;
  date: string;
  portfolio: string;
  followedPlan: boolean;
  emotion: string;
  screenshots: string[];
};

/* ------------------------------------------------------------------ */
/* Trade table columns — full MT catalog                               */
/* ------------------------------------------------------------------ */

export type TradeColumn = {
  key: keyof Trade;
  label: string;
  defaultVisible: boolean;
  /** admin toggle: is this field offered to users at all */
  adminEnabled: boolean;
  numeric?: boolean;
};

/* ------------------------------------------------------------------ */
/* Journal                                                             */
/* ------------------------------------------------------------------ */

export type JournalGroup = {
  id: string;
  name: string;
  color: string;
};

export type JournalEntry = {
  id: string;
  date: string;
  week: string;
  month: string;
  tradeId: string;
  symbol: string;
  title: string;
  mistakes: string;
  lesson: string;
  emotion: string;
  plan: boolean;
  favorite: boolean;
  groupId: string | null;
  /** Rich HTML body produced by the journal editor */
  html: string;
  blocks: JournalBlock[];
  images: string[];
};

export type JournalBlock = {
  id: string;
  type: "h2" | "p" | "list" | "quote";
  text: string;
};

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */

export type Achievement = {
  id: string;
  title: string;
  desc: string;
  earned: boolean;
  /** how the badge is computed (data source + rule) */
  rule: string;
};

/* ------------------------------------------------------------------ */
/* Plans                                                               */
/* ------------------------------------------------------------------ */

export type Plan = {
  id: string;
  name: string;
  price: string;
  unit: string;
  tagline: string;
  portfolioLimit: string;
  features: string[];
  cta: string;
  highlight: boolean;
  /** VIP is admin-assigned only and never shown on the pricing page */
  sellable: boolean;
  users: number;
};

/* ------------------------------------------------------------------ */
/* AI coach archive                                                    */
/* ------------------------------------------------------------------ */

export type ArchivedReport = {
  id: string;
  kind: "weekly" | "monthly" | "yearly";
  year: string;
  month: string | null;
  title: string;
  range: string;
  net: string;
  winRate: string;
  lines: string[];
};

/* ------------------------------------------------------------------ */
/* Economic calendar (dashboard widget)                                */
/* ------------------------------------------------------------------ */

export type EconomicEvent = {
  id: string;
  time: string;
  currency: string;
  title: string;
  impact: "high" | "medium" | "low";
  forecast: string;
  previous: string;
};
