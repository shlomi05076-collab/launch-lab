/**
 * Sanity suite: one scenario simple enough to check with a calculator.
 * The same numbers are worked by hand in docs/model.md ("Worked example"). If you change the
 * model, update both together.
 *
 * $10,000 on one channel at a $10 CPM, 1% click-through, audience of 1,000,000,
 * sign-up 10%, activation 50%, paid 20%, $20/month at 80% margin, 3% monthly churn,
 * a one-week window, no seasonality and no randomness.
 */
import { describe, expect, it } from "vitest";
import { expectedLaunch, simulate } from "./monteCarlo";
import type { ModelAssumptions, Range, ScenarioInput } from "./types";

const fixed = (value: number): Range => ({ low: value, likely: value, high: value });
const FLAT = Array.from({ length: 12 }, () => 1);

const channel = {
  costPerThousand: fixed(10),
  clickThroughRate: fixed(0.01),
  intentMultiplier: 1,
  rampProfile: "flat",
} as const;

export const sanityAssumptions: ModelAssumptions = {
  channels: {
    paid_search: channel,
    paid_social: channel,
    linkedin_ads: channel,
    newsletter: channel,
    influencer: channel,
    content_seo: channel,
  },
  seasonality: { cost: FLAT, demand: FLAT },
  marketCorrelation: 0.5,
};

export const sanityScenario: ScenarioInput = {
  v: 1,
  productType: "b2b_software",
  id: "sanity",
  name: "Sanity check",
  seed: 1,
  audienceSize: 1_000_000,
  totalBudget: 10_000,
  pricing: { model: "subscription", price: 20, grossMargin: 0.8, monthlyChurn: fixed(0.03) },
  channels: [{ channel: "paid_social", budgetShare: 1 }],
  window: { startMonth: 1, weeks: 1 },
  funnel: { signupRate: fixed(0.1), activationRate: fixed(0.5), paidConversion: fixed(0.2) },
};

describe("worked example (no randomness)", () => {
  const result = expectedLaunch(sanityScenario, sanityAssumptions);

  it("buys 1,000,000 impressions: $10,000 ÷ $10 × 1,000", () => {
    // Reach and visits follow from impressions; checking them pins impressions too.
    expect(result.spend).toBe(10_000);
  });

  it("reaches 632,121 people: 1,000,000 × (1 − e^−1)", () => {
    expect(result.stages.reach).toBeCloseTo(632_120.56, 1);
  });

  it("gets 9,950 visitors: 1,000,000 × (1 − e^−0.01), slightly under 1% of impressions", () => {
    expect(result.stages.visit).toBeCloseTo(9_950.17, 1);
  });

  it("converts 995 sign-ups → 497.5 activated → 99.5 paying", () => {
    expect(result.stages.signup).toBeCloseTo(995.017, 2);
    expect(result.stages.activation).toBeCloseTo(497.508, 2);
    expect(result.stages.paying).toBeCloseTo(99.5017, 3);
  });

  it("has a CAC of $100.50: $10,000 ÷ 99.5", () => {
    expect(result.cac).toBeCloseTo(100.5008, 3);
  });

  it("pays back in 6.85 months with 3% churn: ln(1 − 100.50 × 0.03 ÷ 16) ÷ ln(0.97)", () => {
    expect(result.paybackMonths).toBeCloseTo(6.8549, 3);
  });

  it("earns $459 in the one-week window and ends at $1,990 MRR", () => {
    // 99.5 × $20 per month ÷ (52 ÷ 12) weeks per month
    expect(result.revenue).toBeCloseTo(459.24, 2);
    expect(result.mrrAtEnd).toBeCloseTo(1_990.03, 2);
  });

  it("pays back in 6.28 months without churn: $100.50 ÷ $16", () => {
    const noChurn = expectedLaunch(
      { ...sanityScenario, pricing: { ...sanityScenario.pricing, monthlyChurn: fixed(0) } },
      sanityAssumptions,
    );
    expect(noChurn.paybackMonths).toBeCloseTo(6.2813, 3);
  });

  it("pays back immediately with a one-time price whose margin covers CAC", () => {
    const oneTime = expectedLaunch(
      { ...sanityScenario, pricing: { model: "one_time", price: 150, grossMargin: 0.8 } },
      sanityAssumptions,
    );
    expect(oneTime.paybackMonths).toBe(0); // $150 × 0.8 = $120 ≥ $100.50
    expect(oneTime.revenue).toBeCloseTo(14_925.25, 1); // 99.5017 × $150
    expect(oneTime.mrrAtEnd).toBe(0);
  });

  it("spreads the same total across weeks: 4 weeks gives the same 99.5 paying", () => {
    const fourWeeks = expectedLaunch(
      { ...sanityScenario, window: { startMonth: 1, weeks: 4 } },
      sanityAssumptions,
    );
    expect(fourWeeks.stages.paying).toBeCloseTo(99.5017, 3);
    expect(fourWeeks.weeklyPaying[3]).toBeCloseTo(99.5017, 3);
  });
});

describe("worked example with randomness switched on", () => {
  it("centres on the hand-calculated 99.5 paying customers", () => {
    // Ranges are fixed, so the only randomness is who converts (binomial draws).
    const result = simulate(sanityScenario, sanityAssumptions, { runs: 2000 });
    expect(result.stages.paying.mean).toBeGreaterThan(99.5 * 0.98);
    expect(result.stages.paying.mean).toBeLessThan(99.5 * 1.02);
    // Binomial noise on ~100 customers: P10–P90 spans roughly ±13%.
    expect(result.stages.paying.p10).toBeGreaterThan(80);
    expect(result.stages.paying.p90).toBeLessThan(120);
  });
});
