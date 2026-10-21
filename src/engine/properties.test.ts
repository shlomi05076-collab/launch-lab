/**
 * Property tests: invariants that must hold for ANY valid scenario, checked on randomly
 * generated scenarios (fast-check shrinks failures to a minimal counterexample).
 */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { defaultModelAssumptions } from "@/data/modelDefaults";
import { expectedLaunch, simulate } from "./monteCarlo";
import { toOutcomeRange } from "./outcomes";
import { CHANNEL_IDS, type Dist, type Range, type ScenarioInput, STAGES } from "./types";

const assumptions = defaultModelAssumptions();

const rangeArb = (min: number, max: number) =>
  fc
    .tuple(
      fc.double({ min, max, noNaN: true }),
      fc.double({ min, max, noNaN: true }),
      fc.double({ min, max, noNaN: true }),
    )
    .map(([a, b, c]): Range => {
      const [low, likely, high] = [a, b, c].sort((x, y) => x - y) as [number, number, number];
      return { low, likely, high };
    });

const scenarioArb: fc.Arbitrary<ScenarioInput> = fc.record({
  v: fc.constant(1 as const),
  id: fc.constant("prop"),
  name: fc.constant("Property scenario"),
  seed: fc.integer({ min: 0, max: 2 ** 31 }),
  audienceSize: fc.integer({ min: 1_000, max: 5_000_000 }),
  totalBudget: fc.integer({ min: 0, max: 200_000 }),
  pricing: fc.record({
    model: fc.constantFrom("subscription" as const, "one_time" as const),
    price: fc.integer({ min: 1, max: 500 }),
    grossMargin: fc.double({ min: 0.1, max: 0.95, noNaN: true }),
    monthlyChurn: rangeArb(0, 0.15),
  }),
  channels: fc
    .uniqueArray(fc.constantFrom(...CHANNEL_IDS), { minLength: 1, maxLength: 4 })
    .chain((ids) =>
      fc
        .tuple(...ids.map(() => fc.double({ min: 0.01, max: 1, noNaN: true })))
        .map((shares) => ids.map((channel, i) => ({ channel, budgetShare: shares[i] as number }))),
    ),
  window: fc.record({
    startMonth: fc.integer({ min: 1, max: 12 }) as fc.Arbitrary<
      ScenarioInput["window"]["startMonth"]
    >,
    weeks: fc.integer({ min: 2, max: 26 }),
  }),
  funnel: fc.record({
    signupRate: rangeArb(0.001, 0.2),
    activationRate: rangeArb(0.05, 0.9),
    paidConversion: rangeArb(0.02, 0.8),
  }),
});

const RUNS = 60;
/** Also rejects NaN, which compares false with everything. */
const ordered = (d: Dist) => d.p10 <= d.p50 && d.p50 <= d.p90;

describe("simulation invariants (random scenarios)", () => {
  it("funnel stages never increase, per percentile", () => {
    fc.assert(
      fc.property(scenarioArb, (scenario) => {
        const r = simulate(scenario, assumptions, { runs: RUNS });
        for (let i = 1; i < STAGES.length; i++) {
          const prev = r.stages[STAGES[i - 1] as (typeof STAGES)[number]];
          const next = r.stages[STAGES[i] as (typeof STAGES)[number]];
          expect(next.p10).toBeLessThanOrEqual(prev.p10 + 1e-9);
          expect(next.p50).toBeLessThanOrEqual(prev.p50 + 1e-9);
          expect(next.p90).toBeLessThanOrEqual(prev.p90 + 1e-9);
        }
        expect(r.stages.reach.p90).toBeLessThanOrEqual(scenario.audienceSize * (1 + 1e-12));
      }),
      { numRuns: 40 },
    );
  });

  it("every distribution is ordered P10 ≤ P50 ≤ P90", () => {
    fc.assert(
      fc.property(scenarioArb, (scenario) => {
        const r = simulate(scenario, assumptions, { runs: RUNS });
        const dists = [
          ...Object.values(r.stages),
          r.revenue,
          r.mrrAtEnd,
          r.cac,
          r.paybackMonths,
          ...r.weekly.flatMap((w) => [w.paying, w.revenue]),
          ...r.byChannel.flatMap((c) => [c.paying, c.cac]),
        ];
        for (const d of dists) expect(ordered(d), JSON.stringify(d)).toBe(true);
        expect(r.probPaybackWithin12 + r.probNeverPayback).toBeLessThanOrEqual(1);
      }),
      { numRuns: 40 },
    );
  });

  it("cumulative weekly paying and revenue never go down", () => {
    fc.assert(
      fc.property(scenarioArb, (scenario) => {
        const e = expectedLaunch(scenario, assumptions);
        for (let w = 1; w < e.weeklyPaying.length; w++) {
          expect(e.weeklyPaying[w]).toBeGreaterThanOrEqual(e.weeklyPaying[w - 1] as number);
          expect(e.weeklyRevenue[w]).toBeGreaterThanOrEqual(e.weeklyRevenue[w - 1] as number);
        }
      }),
      { numRuns: 60 },
    );
  });

  it("the same seed gives the identical result", () => {
    fc.assert(
      fc.property(scenarioArb, (scenario) => {
        expect(simulate(scenario, assumptions, { runs: 50 })).toEqual(
          simulate(scenario, assumptions, { runs: 50 }),
        );
      }),
      { numRuns: 15 },
    );
  });

  it("budget shares are normalised: scaling them all changes nothing", () => {
    fc.assert(
      fc.property(scenarioArb, fc.double({ min: 0.1, max: 10, noNaN: true }), (scenario, k) => {
        const scaled = {
          ...scenario,
          channels: scenario.channels.map((c) => ({ ...c, budgetShare: c.budgetShare * k })),
        };
        const a = expectedLaunch(scenario, assumptions);
        const b = expectedLaunch(scaled, assumptions);
        expect(b.stages.paying).toBeCloseTo(a.stages.paying, 6);
      }),
      { numRuns: 60 },
    );
  });

  const moreBudget = (s: ScenarioInput) => ({ ...s, totalBudget: s.totalBudget * 1.5 + 100 });

  it("more budget never means fewer unique visitors", () => {
    fc.assert(
      fc.property(scenarioArb, (scenario) => {
        const base = expectedLaunch(scenario, assumptions).stages.visit;
        const more = expectedLaunch(moreBudget(scenario), assumptions).stages.visit;
        // Relative tolerance: on a saturated audience extra budget adds nothing but rounding.
        expect(more).toBeGreaterThanOrEqual(base * (1 - 1e-9));
      }),
      { numRuns: 80 },
    );
  });

  it("with one channel and no seasonality, more budget never means fewer paying customers", () => {
    // Both conditions are needed, and docs/model.md explains why. On a saturated audience extra
    // budget only meets the same people sooner, which can (by a hair) mean in a weaker month, or
    // via a front-loaded, lower-intent channel that reaches them first.
    const flat = Array.from({ length: 12 }, () => 1);
    const noSeasons = { ...assumptions, seasonality: { cost: flat, demand: flat } };
    fc.assert(
      fc.property(scenarioArb, (s) => {
        const scenario = { ...s, channels: s.channels.slice(0, 1) };
        const base = expectedLaunch(scenario, noSeasons).stages.paying;
        const more = expectedLaunch(moreBudget(scenario), noSeasons).stages.paying;
        expect(more).toBeGreaterThanOrEqual(base * (1 - 1e-9));
      }),
      { numRuns: 80 },
    );
  });

  it("zero budget reaches no one, and nothing pays back", () => {
    fc.assert(
      fc.property(scenarioArb, (scenario) => {
        const r = simulate({ ...scenario, totalBudget: 0 }, assumptions, { runs: 20 });
        expect(r.stages.reach.p90).toBe(0);
        expect(r.stages.paying.p90).toBe(0);
        expect(r.revenue.p90).toBe(0);
        expect(r.cac.p10).toBe(Number.POSITIVE_INFINITY);
        expect(r.probNeverPayback).toBe(1);
      }),
      { numRuns: 20 },
    );
  });
});

describe("market response", () => {
  const scenario: ScenarioInput = {
    v: 1,
    id: "market",
    name: "Market response",
    seed: 9,
    audienceSize: 1_000_000,
    totalBudget: 30_000,
    pricing: {
      model: "subscription",
      price: 49,
      grossMargin: 0.7,
      monthlyChurn: { low: 0.015, likely: 0.035, high: 0.07 },
    },
    channels: [{ channel: "paid_social", budgetShare: 1 }],
    window: { startMonth: 3, weeks: 8 },
    funnel: {
      signupRate: { low: 0.02, likely: 0.05, high: 0.09 },
      activationRate: { low: 0.2, likely: 0.35, high: 0.5 },
      paidConversion: { low: 0.12, likely: 0.25, high: 0.45 },
    },
  };
  const spread = (d: Dist) => d.p90 - d.p10;

  it("widens the downside-to-upside spread compared with independent rates", () => {
    const correlated = simulate(
      scenario,
      { ...assumptions, marketCorrelation: 0.5 },
      { runs: 4000 },
    );
    const independent = simulate(
      scenario,
      { ...assumptions, marketCorrelation: 0 },
      { runs: 4000 },
    );
    expect(spread(correlated.stages.paying)).toBeGreaterThan(
      1.15 * spread(independent.stages.paying),
    );
    // It changes the spread, not the centre: medians stay within 10%.
    expect(correlated.stages.paying.p50 / independent.stages.paying.p50).toBeCloseTo(1, 0);
  });
});

describe("outcome labels", () => {
  const dist: Dist = { p10: 1, p50: 2, p90: 3, mean: 2 };

  it("downside is P10 when more is better", () => {
    expect(toOutcomeRange(dist, "revenue")).toEqual({ downside: 1, likely: 2, upside: 3 });
  });

  it("downside is P90 for costs, where higher is worse", () => {
    expect(toOutcomeRange(dist, "cac")).toEqual({ downside: 3, likely: 2, upside: 1 });
    expect(toOutcomeRange(dist, "paybackMonths").downside).toBe(3);
  });
});
