import { CHANNEL_IDS, type ModelAssumptions, type Range } from "@/engine";
import type { Assumption } from "./assumption";
import { channelAssumptions } from "./channelBenchmarks";

/* ---------- Seasonality ---------- */

export const seasonalityCost: Assumption<readonly number[]> = {
  id: "seasonality.cost",
  label: "Seasonal ad cost index (Jan–Dec)",
  value: [0.85, 0.9, 0.95, 0.95, 0.97, 0.97, 0.95, 0.97, 1.0, 1.05, 1.25, 1.15],
  source:
    "Constructed from GeistM Q4 2024/2025 Meta CPM reports and Birch's Meta cost analysis (cheapest January, Black Friday peak +25–30%)",
  sourceUrl: "https://geistm.com/blog/meta-rate-trends-q4-2025/",
  asOf: "2025-12",
  why: "Ad auctions get crowded before Black Friday and quiet in January; the index averages 1.0.",
  confidence: "low",
};

export const seasonalityDemand: Assumption<readonly number[]> = {
  id: "seasonality.demand",
  label: "Seasonal buyer demand index (Jan–Dec)",
  value: [0.99, 0.99, 0.99, 0.97, 0.97, 0.97, 0.98, 0.98, 0.98, 1.06, 1.06, 1.06],
  source:
    "FastSpring five-year software sales by quarter (Q1 99%, Q2 97%, Q3 98%, Q4 106%), as summarized by SyncGTM",
  sourceUrl: "https://syncgtm.com/blog/what-part-of-year-has-highest-b2b-sales",
  asOf: "2026",
  why: "Software buying is strongest in Q4 (budgets expire) and softest in summer; the effect is mild.",
  confidence: "medium",
};

/* ---------- Market response ---------- */

export const marketCorrelation: Assumption<number> = {
  id: "model.marketCorrelation",
  label: "Market response correlation between product rates",
  value: 0.5,
  source: "Launch Lab modeling choice, approved 2026-10-22",
  asOf: "2026-10",
  why: "A message that misses hurts every stage at once; 0.5 is moderate, so stages still vary on their own.",
  confidence: "low",
};

/* ---------- Product funnel and economics (sample defaults) ---------- */

export const signupRate: Assumption<Range> = {
  id: "funnel.signupRate",
  label: "Visit → sign-up",
  value: { low: 0.02, likely: 0.05, high: 0.09 },
  source:
    "First Page Sage via Nalpeiron: visitor→trial 8.5% organic / 7.1% paid (opt-in trial), 2.5% / 2.2% (card required)",
  sourceUrl: "https://nalpeiron.com/blog/saas-free-trial-conversion-rate/",
  asOf: "2025-09",
  why: "5% sits between card-required and opt-in trials; launch traffic is colder than steady-state traffic.",
  confidence: "medium",
};

export const activationRate: Assumption<Range> = {
  id: "funnel.activationRate",
  label: "Sign-up → activation",
  value: { low: 0.2, likely: 0.35, high: 0.5 },
  source:
    "Userpilot 2025 product metrics benchmark (37.5% average; product-led 34.6%); June 2023 (27.3% median)",
  sourceUrl: "https://userpilot.com/saas-product-metrics/",
  asOf: "2025",
  why: "Product-led tools activate about a third of sign-ups; 35% matches the product-led average.",
  confidence: "medium",
};

export const paidConversion: Assumption<Range> = {
  id: "funnel.paidConversion",
  label: "Activation → paying",
  value: { low: 0.12, likely: 0.25, high: 0.45 },
  source:
    "ChartMogul × ProductLed × Kyle Poyar (median trial→paid 8%, Jan 2026); First Page Sage (18.2% opt-in trials)",
  sourceUrl: "https://userpilot.com/blog/free-trial-conversion-rate/",
  asOf: "2026-01",
  why: "Trial→paid of 8%–18% divided by ~35% activation gives 23%–52% of activated users; likely 25%.",
  confidence: "medium",
};

export const monthlyChurn: Assumption<Range> = {
  id: "pricing.monthlyChurn",
  label: "Monthly churn (SMB SaaS)",
  value: { low: 0.015, likely: 0.035, high: 0.07 },
  source:
    "Vena (SMB 3%–7% monthly); Focus Digital (6.4%); ChartMogul via StealthAgents (10%–14% annual ≈ 1%/month)",
  sourceUrl: "https://www.venasolutions.com/blog/saas-churn-rate",
  asOf: "2025",
  why: "SMB sources span 1%–7% a month; 3.5% fits a new monthly-billed product with no track record.",
  confidence: "medium",
};

export const grossMargin: Assumption<number> = {
  id: "pricing.grossMargin",
  label: "Gross margin (AI-powered SaaS)",
  value: 0.7,
  source:
    "Aleph × Benchmarkit 2025 (software median 80%); SaaSRise 2026 (B2B median 75%); ICONIQ (AI builders expect 52%)",
  sourceUrl: "https://www.getaleph.com/answers/saas-gross-margin-2026",
  asOf: "2025",
  why: "Pure SaaS runs near 80%, but an AI product pays for inference, so 70% is a cautious middle.",
  confidence: "medium",
};

/** Every default assumption, for the docs coverage test and the future assumptions drawer. */
export const modelAssumptionRecords: Assumption<unknown>[] = [
  seasonalityCost,
  seasonalityDemand,
  marketCorrelation,
  signupRate,
  activationRate,
  paidConversion,
  monthlyChurn,
  grossMargin,
];

export function defaultModelAssumptions(): ModelAssumptions {
  return {
    channels: Object.fromEntries(
      CHANNEL_IDS.map((id) => [id, channelAssumptions(id)]),
    ) as ModelAssumptions["channels"],
    seasonality: { cost: seasonalityCost.value, demand: seasonalityDemand.value },
    marketCorrelation: marketCorrelation.value,
  };
}
