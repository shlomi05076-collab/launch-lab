import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { customerValue12m, paybackMonths } from "./economics";
import { runLaunch } from "./funnel";
import { expectedLaunch, likelyParams } from "./monteCarlo";
import { netReturn12m } from "./sensitivity";
import type { ModelAssumptions, Range, ScenarioInput } from "./types";
import {
  assessViability,
  requirementForSensitivityInput,
  solveThreshold,
  statusOf,
} from "./viability";

/*
 * Worked break-even example (docs/model.md, "Break-even worked example"): the M1 sanity scenario.
 * $10,000 → 99.5 paying customers at $20/month, 80% margin, 3% monthly churn.
 */
const fixed = (v: number): Range => ({ low: v, likely: v, high: v });
const FLAT = Array.from({ length: 12 }, () => 1);
const channel = {
  costPerThousand: fixed(10),
  clickThroughRate: fixed(0.01),
  intentMultiplier: 1,
  rampProfile: "flat",
} as const;
const assumptions: ModelAssumptions = {
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
const scenario: ScenarioInput = {
  v: 1,
  productType: "b2b_software",
  id: "break-even",
  name: "Break-even check",
  seed: 1,
  audienceSize: 1_000_000,
  totalBudget: 10_000,
  pricing: { model: "subscription", price: 20, grossMargin: 0.8, monthlyChurn: fixed(0.03) },
  channels: [{ channel: "paid_social", budgetShare: 1 }],
  window: { startMonth: 1, weeks: 1 },
  funnel: { signupRate: fixed(0.1), activationRate: fixed(0.5), paidConversion: fixed(0.2) },
};

describe("break-even worked example", () => {
  const v = assessViability(scenario, assumptions);
  const byInput = Object.fromEntries(v.requirements.map((r) => [r.input, r]));

  it("one customer is worth $163.28 in a year: $16 × (1 − 0.97^12) ÷ 0.03", () => {
    expect(v.customerValue12m).toBeCloseTo(163.285, 2);
  });

  it("needs 61.2 customers to earn back $10,000: 10,000 ÷ 163.28", () => {
    expect(v.breakEvenCustomers).toBeCloseTo(61.243, 2);
    expect(v.expectedCustomers).toBeCloseTo(99.5017, 3);
    expect(v.aboveBreakEven).toBe(true);
  });

  it("sign-up rate could fall to 6.15%: 10% × 61.24 ÷ 99.50", () => {
    expect(byInput.signupRate?.needed).toBeCloseTo(0.061549, 5);
    expect(byInput.signupRate?.status).toBe("typical");
  });

  it("price could fall to $12.31: $20 × 61.24 ÷ 99.50", () => {
    expect(byInput.price?.needed).toBeCloseTo(12.31, 2);
  });

  it("sign-ups who pay could fall to 6.15% of sign-ups (from 50% × 20% = 10%)", () => {
    expect(byInput.payingRate?.needed).toBeCloseTo(0.061549, 5);
  });

  it("churn could rise to about 12.9% a month before the spend isn't earned back", () => {
    // Solves 99.50 × $16 × (1 − (1 − c)^12) ÷ c = $10,000 numerically.
    const c = byInput.monthlyChurn?.needed as number;
    expect(c).toBeGreaterThan(0.1285);
    expect(c).toBeLessThan(0.129);
  });

  it("every needed value lands exactly on break-even", () => {
    const base = likelyParams(scenario, assumptions);
    const atSignup = { ...base, signupRate: byInput.signupRate?.needed as number };
    const outcome = runLaunch(scenario, assumptions, atSignup, null);
    expect(netReturn12m(outcome, scenario, atSignup)).toBeCloseTo(0, 4);
  });
});

describe("customer value and payback with repeat purchases", () => {
  const oneTime = {
    price: 100,
    grossMargin: 0.5,
    model: "one_time" as const,
    monthlyChurn: 0,
    purchasesPerYear: 1.6,
  };

  it("values a one-time customer at margin × purchases in the first year", () => {
    expect(customerValue12m(oneTime)).toBeCloseTo(80, 10); // $50 × 1.6
  });

  it("pays back part-way through the year from repeat purchases", () => {
    // First order earns $50 of a $65 CAC; repeats earn $30 a year = $2.50 a month → 6 months.
    expect(paybackMonths({ ...oneTime, cac: 65 })).toBeCloseTo(6, 10);
    expect(paybackMonths({ ...oneTime, cac: 40 })).toBe(0);
    expect(paybackMonths({ ...oneTime, cac: 81 })).toBe(Number.POSITIVE_INFINITY);
    expect(paybackMonths({ ...oneTime, purchasesPerYear: 1, cac: 51 })).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  it("counts repeat purchases inside the launch window as revenue", () => {
    const store: ScenarioInput = {
      ...scenario,
      pricing: { model: "one_time", price: 100, grossMargin: 0.5, purchasesPerYear: fixed(1.52) },
      window: { startMonth: 1, weeks: 2 },
    };
    const e = expectedLaunch(store, assumptions);
    const firstWeek = e.weeklyPaying[0] as number;
    // Week 2: new orders, plus week-1 customers buying again at (1.52 − 1) ÷ 52 = 1% a week.
    const expected = e.stages.paying * 100 + firstWeek * 0.01 * 100;
    expect(e.revenue).toBeCloseTo(expected, 6);
  });

  it("keeps subscription value consistent with payback ≤ 12 months", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 500, noNaN: true }),
        fc.double({ min: 0.05, max: 0.95, noNaN: true }),
        fc.double({ min: 0, max: 0.3, noNaN: true }),
        fc.double({ min: 1, max: 5000, noNaN: true }),
        (price, grossMargin, monthlyChurn, cac) => {
          const e = {
            price,
            grossMargin,
            model: "subscription" as const,
            monthlyChurn,
            purchasesPerYear: 1,
          };
          const coversCac = customerValue12m(e) >= cac * (1 + 1e-9);
          const within12 = paybackMonths({ ...e, cac }) <= 12;
          if (coversCac) expect(within12).toBe(true);
        },
      ),
      { numRuns: 300 },
    );
  });
});

describe("solveThreshold", () => {
  it("finds the smallest x that works when higher is better", () => {
    expect(solveThreshold((x) => x - 3, 0, 10, "higher")).toBeCloseTo(3, 9);
    expect(solveThreshold((x) => x + 1, 0, 10, "higher")).toBe(0);
    expect(solveThreshold((x) => x - 30, 0, 10, "higher")).toBeNull();
  });

  it("finds the largest x that works when lower is better", () => {
    expect(solveThreshold((x) => 5 - x, 0, 10, "lower")).toBeCloseTo(5, 9);
    expect(solveThreshold(() => 1, 0, 10, "lower")).toBe(10);
    expect(solveThreshold((x) => -1 - x, 0, 10, "lower")).toBeNull();
  });
});

describe("statusOf", () => {
  const typical = { p10: 0.02, likely: 0.05, p90: 0.08 };

  it("rates a higher-is-better requirement against likely and P90", () => {
    expect(statusOf(0.04, typical, "higher")).toBe("typical");
    expect(statusOf(0.07, typical, "higher")).toBe("above_typical");
    expect(statusOf(0.2, typical, "higher")).toBe("rare");
    expect(statusOf(null, typical, "higher")).toBe("rare");
  });

  it("rates a lower-is-better requirement against likely and P10", () => {
    expect(statusOf(0.06, typical, "lower")).toBe("typical");
    expect(statusOf(0.03, typical, "lower")).toBe("above_typical");
    expect(statusOf(0.01, typical, "lower")).toBe("rare");
  });
});

describe("requirementForSensitivityInput", () => {
  it.each([
    ["funnel.signupRate", "signupRate"],
    ["funnel.activationRate", "payingRate"],
    ["funnel.paidConversion", "payingRate"],
    ["channel.paid_social.clickThroughRate", "costPerVisitor"],
    ["pricing.price", "price"],
    ["pricing.monthlyChurn", "monthlyChurn"],
    ["pricing.purchasesPerYear", "purchasesPerYear"],
    ["totalBudget", null],
  ])("maps %s to %s", (key, expected) => {
    expect(requirementForSensitivityInput(key)).toBe(expected);
  });
});

describe("viability invariants", () => {
  const rangeArb = (min: number, max: number) =>
    fc
      .tuple(fc.double({ min, max, noNaN: true }), fc.double({ min, max, noNaN: true }))
      .map(([a, b]): Range => {
        const [low, high] = a < b ? [a, b] : [b, a];
        return { low, likely: (low + high) / 2, high };
      });
  const scenarioArb = fc.record({
    budget: fc.integer({ min: 100, max: 100_000 }),
    price: fc.integer({ min: 1, max: 3000 }),
    oneTime: fc.boolean(),
    signup: rangeArb(0.005, 0.3),
    activation: rangeArb(0.05, 0.9),
    paid: rangeArb(0.02, 0.8),
  });
  type Sample = {
    budget: number;
    price: number;
    oneTime: boolean;
    signup: Range;
    activation: Range;
    paid: Range;
  };
  const build = (s: Sample): ScenarioInput => ({
    ...scenario,
    totalBudget: s.budget,
    window: { startMonth: 1, weeks: 6 },
    pricing: s.oneTime
      ? {
          model: "one_time",
          price: s.price,
          grossMargin: 0.6,
          purchasesPerYear: { low: 1, likely: 1.3, high: 1.8 },
        }
      : {
          model: "subscription",
          price: s.price,
          grossMargin: 0.6,
          monthlyChurn: { low: 0.01, likely: 0.04, high: 0.1 },
        },
    funnel: { signupRate: s.signup, activationRate: s.activation, paidConversion: s.paid },
  });

  it("each reachable needed value puts the launch exactly at break-even", () => {
    fc.assert(
      fc.property(scenarioArb, (s) => {
        const input = build(s);
        const v = assessViability(input, assumptions);
        const base = likelyParams(input, assumptions);
        const signup = v.requirements.find((r) => r.input === "signupRate");
        if (signup?.needed && signup.needed > 0 && signup.needed < 1) {
          const p = { ...base, signupRate: signup.needed };
          const net = netReturn12m(runLaunch(input, assumptions, p, null), input, p);
          expect(Math.abs(net)).toBeLessThan(input.totalBudget * 1e-6);
        }
      }),
      { numRuns: 60 },
    );
  });

  it("above break-even, every requirement is typical (nothing needs to change)", () => {
    fc.assert(
      fc.property(scenarioArb, (s) => {
        const v = assessViability(build(s), assumptions);
        if (v.aboveBreakEven) {
          for (const r of v.requirements) expect(r.status).toBe("typical");
        } else {
          expect(v.requirements.some((r) => r.status !== "typical")).toBe(true);
        }
      }),
      { numRuns: 60 },
    );
  });
});
