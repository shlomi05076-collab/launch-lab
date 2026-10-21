import { describe, expect, it } from "vitest";
import { impressionsFor, rampWeights, uniquePeople } from "./channels";
import { binomial, normalCdf, pert, standardNormal } from "./distributions";
import { cac, paybackMonths, weeklyRetention } from "./economics";
import { createRng } from "./rng";
import { indexFor, monthOfWeek } from "./seasonality";
import { histogram, percentile, share, summarize } from "./stats";

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe("rng", () => {
  it("is deterministic per seed and differs across seeds", () => {
    const a = createRng(42);
    const b = createRng(42);
    const c = createRng(43);
    const seqA = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(seqA);
    expect(Array.from({ length: 5 }, c)).not.toEqual(seqA);
  });

  it("stays in [0, 1) and averages 0.5", () => {
    const rng = createRng(7);
    const xs = Array.from({ length: 20_000 }, rng);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThan(1);
    expect(mean(xs)).toBeCloseTo(0.5, 2);
  });
});

describe("pert", () => {
  const range = { low: 0.02, likely: 0.05, high: 0.09 };
  const sampler = pert(range);

  it("spans exactly low to high", () => {
    expect(sampler.quantile(0)).toBe(0.02);
    expect(sampler.quantile(1)).toBe(0.09);
  });

  it("has the PERT mean (low + 4·likely + high) / 6", () => {
    const n = 20_000;
    const draws = Array.from({ length: n }, (_, i) => sampler.quantile((i + 0.5) / n));
    expect(mean(draws)).toBeCloseTo((0.02 + 4 * 0.05 + 0.09) / 6, 4);
    expect(sampler.mean).toBeCloseTo(0.0517, 4);
  });

  it("is monotonic and peaks near likely", () => {
    let prev = -1;
    for (let u = 0; u <= 1; u += 0.01) {
      const q = sampler.quantile(u);
      expect(q).toBeGreaterThanOrEqual(prev);
      prev = q;
    }
    expect(sampler.quantile(0.5)).toBeGreaterThan(0.045);
    expect(sampler.quantile(0.5)).toBeLessThan(0.056);
  });

  it("handles fixed and edge-peaked ranges", () => {
    expect(pert({ low: 3, likely: 3, high: 3 }).quantile(0.7)).toBe(3);
    const leftPeak = pert({ low: 0, likely: 0, high: 1 });
    expect(leftPeak.quantile(0.5)).toBeLessThan(0.2);
    expect(leftPeak.mean).toBeCloseTo(1 / 6, 10);
  });

  it("rejects ranges out of order", () => {
    expect(() => pert({ low: 2, likely: 1, high: 3 })).toThrow(/low ≤ likely ≤ high/);
  });
});

describe("normal", () => {
  it("Φ matches standard table values", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.959964)).toBeCloseTo(0.975, 5);
    expect(normalCdf(-1)).toBeCloseTo(0.158655, 5);
  });

  it("draws have mean 0 and variance 1", () => {
    const rng = createRng(3);
    const xs = Array.from({ length: 40_000 }, () => standardNormal(rng));
    const m = mean(xs);
    expect(m).toBeCloseTo(0, 1);
    expect(mean(xs.map((x) => (x - m) ** 2))).toBeCloseTo(1, 1);
  });
});

describe("binomial", () => {
  it("returns the exact expectation without an rng", () => {
    expect(binomial(1000, 0.035, null)).toBeCloseTo(35, 10);
    expect(binomial(0, 0.5, null)).toBe(0);
    expect(binomial(10, 0, null)).toBe(0);
    expect(binomial(10, 1.5, null)).toBe(10); // probabilities are capped at 1
  });

  it.each([
    ["normal approximation", 100_000, 0.3],
    ["direct simulation", 120, 0.1],
    ["Poisson approximation", 50_000, 0.0002],
  ])("draws integer counts with the right mean (%s)", (_, n, p) => {
    const rng = createRng(11);
    const draws = Array.from({ length: 4000 }, () => binomial(n, p, rng));
    expect(draws.every((d) => Number.isInteger(d) && d >= 0 && d <= n)).toBe(true);
    expect(mean(draws) / (n * p)).toBeCloseTo(1, 1);
  });

  it("returns all trials when p = 1", () => {
    expect(binomial(42, 1, createRng(1))).toBe(42);
  });
});

describe("channels", () => {
  it.each(["flat", "spike", "build"] as const)("%s ramp sums to 1", (profile) => {
    const w = rampWeights(profile, 8);
    expect(w).toHaveLength(8);
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });

  it("spike front-loads and build back-loads", () => {
    const spike = rampWeights("spike", 6);
    const build = rampWeights("build", 6);
    expect(spike[0]).toBeGreaterThan(spike[5] as number);
    expect(build[5]).toBeGreaterThan(build[0] as number);
  });

  it("converts spend to impressions", () => {
    expect(impressionsFor(5000, 10)).toBe(500_000);
    expect(impressionsFor(5000, 0)).toBe(0);
  });

  it("saturates: impressions = audience reaches 63%, double reaches 86%", () => {
    expect(uniquePeople(1000, 1000)).toBeCloseTo(632.12, 2);
    expect(uniquePeople(2000, 1000)).toBeCloseTo(864.66, 2);
    expect(uniquePeople(1e9, 1000)).toBeLessThanOrEqual(1000);
    expect(uniquePeople(0, 1000)).toBe(0);
    expect(uniquePeople(10, 0)).toBe(0);
  });
});

describe("seasonality", () => {
  it("maps launch weeks to calendar months", () => {
    expect(monthOfWeek(1, 0)).toBe(1);
    expect(monthOfWeek(1, 4)).toBe(2); // days 28–34, midpoint day 31.5
    expect(monthOfWeek(11, 8)).toBe(12); // midpoint day 59.5 is 30 December
    expect(monthOfWeek(11, 9)).toBe(1); // a November launch crosses into January
  });

  it("reads the month's index, defaulting to 1", () => {
    expect(indexFor([2, 3], 2)).toBe(3);
    expect(indexFor([], 5)).toBe(1);
  });
});

describe("economics", () => {
  const base = { price: 20, grossMargin: 0.8, model: "subscription" as const };

  it("CAC is spend per customer, Infinity with none", () => {
    expect(cac(1000, 4)).toBe(250);
    expect(cac(1000, 0)).toBe(Number.POSITIVE_INFINITY);
  });

  it("never pays back when CAC exceeds the lifetime cap (margin ÷ churn)", () => {
    // cap = $16 ÷ 4% = $400
    expect(paybackMonths({ ...base, cac: 399, monthlyChurn: 0.04 })).toBeGreaterThan(100);
    expect(paybackMonths({ ...base, cac: 400, monthlyChurn: 0.04 })).toBe(Number.POSITIVE_INFINITY);
  });

  it("handles edge cases", () => {
    expect(paybackMonths({ ...base, cac: 0, monthlyChurn: 0.03 })).toBe(0);
    expect(paybackMonths({ ...base, cac: Number.POSITIVE_INFINITY, monthlyChurn: 0.03 })).toBe(
      Number.POSITIVE_INFINITY,
    );
    expect(paybackMonths({ ...base, grossMargin: 0, cac: 10, monthlyChurn: 0 })).toBe(
      Number.POSITIVE_INFINITY,
    );
    expect(paybackMonths({ ...base, cac: 10, monthlyChurn: 1 })).toBe(1);
    expect(paybackMonths({ ...base, cac: 100, monthlyChurn: 1 })).toBe(Number.POSITIVE_INFINITY);
    expect(paybackMonths({ ...base, model: "one_time", cac: 17, monthlyChurn: 0 })).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  it("stays finite and continuous as churn approaches zero (regression)", () => {
    // fast-check found NaN here: with churn ≈ 2e-323, ln(1 − x) rounds to 0 and gave 0 / 0.
    const tiny = paybackMonths({ ...base, cac: 100, monthlyChurn: 2e-323 });
    expect(tiny).toBeCloseTo(100 / 16, 10);
    expect(paybackMonths({ ...base, cac: 100, monthlyChurn: 1e-12 })).toBeCloseTo(6.25, 6);
  });

  it("weekly retention compounds to monthly retention", () => {
    expect(weeklyRetention(0.03) ** (52 / 12)).toBeCloseTo(0.97, 10);
    expect(weeklyRetention(0)).toBe(1);
  });
});

describe("stats", () => {
  it("interpolates percentiles like PERCENTILE.INC", () => {
    const sorted = [1, 2, 3, 4, 5];
    expect(percentile(sorted, 0.5)).toBe(3);
    expect(percentile(sorted, 0.1)).toBeCloseTo(1.4, 10);
    expect(percentile([], 0.5)).toBeNaN();
  });

  it("keeps Infinity (never pays back) in the upper percentiles", () => {
    const d = summarize(Float64Array.from([1, 2, 3, Infinity, Infinity]));
    expect(d.p10).toBeCloseTo(1.4, 10);
    expect(d.p90).toBe(Infinity);
    expect(d.mean).toBe(Infinity);
  });

  it("bins values and ignores non-finite ones", () => {
    const bins = histogram(Float64Array.from([0, 1, 2, 3, 4, Infinity]), 4);
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(5);
    expect(histogram(Float64Array.from([5, 5]), 4)).toEqual([{ x0: 5, x1: 5, count: 2 }]);
    expect(histogram(Float64Array.from([Infinity]), 4)).toEqual([]);
  });

  it("measures shares", () => {
    expect(share(Float64Array.from([1, 2, 3, 4]), (v) => v > 2)).toBe(0.5);
    expect(share(new Float64Array(0), () => true)).toBe(0);
  });
});
