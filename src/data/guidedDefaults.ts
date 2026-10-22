import type { Assumption } from "./assumption";

/**
 * Defaults for guided answers that have no published benchmark. They're labeled as a rough
 * estimate or an example wherever they appear, never as a benchmark. See docs/model.md.
 */

export const audienceBands: Assumption<{ niche: number; specific: number; broad: number }> = {
  id: "guided.audienceBands",
  label: "Audience size bands (niche / specific group / broad market)",
  value: { niche: 30_000, specific: 300_000, broad: 3_000_000 },
  source: "Launch Lab estimate (rough orders of magnitude, not a benchmark)",
  asOf: "2026-10",
  why: "Each band is 10× the last, enough to show how audience size changes the answer.",
  confidence: "low",
};

export const exampleBudget: Assumption<number> = {
  id: "guided.exampleBudget",
  label: "Example marketing budget",
  value: 5_000,
  source: "Launch Lab example amount (no benchmark exists for the right launch budget)",
  asOf: "2026-10",
  why: "A round amount a first-time founder might set aside; shown as an example to change.",
  confidence: "low",
};

export const promotionWeeks: Assumption<number> = {
  id: "guided.promotionWeeks",
  label: "Default promotion length",
  value: 8,
  source: "Launch Lab example (two months)",
  asOf: "2026-10",
  why: "Long enough for content to start ranking, short enough to fit a typical launch push.",
  confidence: "low",
};

export const selfPromotionHours: Assumption<number> = {
  id: "guided.selfPromotionHours",
  label: "Hours a week of your own promotion, if you're not sure",
  value: 3,
  source: "Launch Lab example (no benchmark exists)",
  asOf: "2026-10",
  why: "A realistic amount alongside a day job; shown as an example to change.",
  confidence: "low",
};

export const guidedAssumptionRecords: Assumption<unknown>[] = [
  audienceBands,
  exampleBudget,
  promotionWeeks,
  selfPromotionHours,
];
