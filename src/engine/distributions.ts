import type { Rng } from "./rng";
import type { Range } from "./types";

/* ---------- PERT ---------- */

/** A sampled distribution exposed through its quantile function (inverse CDF). */
export type Sampler = {
  /** The value below which a share `u` (0–1) of draws fall. */
  quantile: (u: number) => number;
  mean: number;
};

const TABLE_SIZE = 2048;

/**
 * PERT(low, likely, high): a Beta distribution rescaled to [low, high] with its peak at
 * `likely`, shape α = 1 + 4(likely − low)/(high − low), β = 1 + 4(high − likely)/(high − low).
 *
 * Sampling uses the inverse CDF, built once per range by integrating the density on a fine
 * grid. Inverse-CDF sampling (rather than drawing Beta variates directly) is what lets
 * the market-response factor correlate draws through a Gaussian copula.
 */
export function pert(range: Range): Sampler {
  const { low, likely, high } = range;
  if (!(low <= likely && likely <= high)) {
    throw new Error(`Invalid range: expected low ≤ likely ≤ high, got ${low}/${likely}/${high}`);
  }
  if (high === low) return { quantile: () => low, mean: low };

  const span = high - low;
  const alpha = 1 + (4 * (likely - low)) / span;
  const beta = 1 + (4 * (high - likely)) / span;

  // Cumulative trapezoid integration of x^(α−1)(1−x)^(β−1) on [0, 1].
  const cdf = new Float64Array(TABLE_SIZE + 1);
  let prevDensity = alpha === 1 ? 1 : 0;
  for (let i = 1; i <= TABLE_SIZE; i++) {
    const x = i / TABLE_SIZE;
    const density = x ** (alpha - 1) * (1 - x) ** (beta - 1);
    cdf[i] = (cdf[i - 1] as number) + (prevDensity + density) / (2 * TABLE_SIZE);
    prevDensity = density;
  }
  const total = cdf[TABLE_SIZE] as number;
  for (let i = 0; i <= TABLE_SIZE; i++) cdf[i] = (cdf[i] as number) / total;

  const quantile = (u: number) => {
    if (u <= 0) return low;
    if (u >= 1) return high;
    // Binary search for the grid cell containing u, then interpolate linearly.
    let lo = 0;
    let hi = TABLE_SIZE;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if ((cdf[mid] as number) < u) lo = mid;
      else hi = mid;
    }
    const c0 = cdf[lo] as number;
    const c1 = cdf[hi] as number;
    const t = c1 === c0 ? 0 : (u - c0) / (c1 - c0);
    return low + span * ((lo + t) / TABLE_SIZE);
  };

  return { quantile, mean: (low + 4 * likely + high) / 6 };
}

/* ---------- Normal ---------- */

/** Standard normal draw (Box–Muller). */
export function standardNormal(rng: Rng): number {
  const u1 = 1 - rng(); // (0, 1], avoids log(0)
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Standard normal CDF Φ(z). Abramowitz & Stegun 7.1.26, absolute error < 1.5e-7. */
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly =
    t *
    (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

/* ---------- Binomial ---------- */

/**
 * How many of `n` people take a step that each takes with probability `p`.
 * With no rng (expected mode) returns the exact expectation n·p, which keeps the sanity
 * test calculator-checkable. Otherwise draws an integer count:
 * - normal approximation when the variance is large (n·p·(1−p) > 25),
 * - direct simulation for small n,
 * - Poisson approximation for large n with a rare event.
 */
export function binomial(n: number, p: number, rng: Rng | null): number {
  if (n <= 0 || p <= 0) return 0;
  const prob = Math.min(1, p);
  if (!rng) return n * prob;
  const trials = Math.round(n);
  if (prob === 1) return trials;

  const mean = trials * prob;
  const variance = mean * (1 - prob);
  if (variance > 25) {
    const draw = Math.round(mean + Math.sqrt(variance) * standardNormal(rng));
    return Math.min(trials, Math.max(0, draw));
  }
  if (trials <= 200) {
    let hits = 0;
    for (let i = 0; i < trials; i++) if (rng() < prob) hits++;
    return hits;
  }
  return Math.min(trials, poisson(mean, rng));
}

/** Poisson draw by Knuth's multiplication method. Only used for small means (≲ 30). */
function poisson(mean: number, rng: Rng): number {
  const limit = Math.exp(-mean);
  let k = 0;
  let product = rng();
  while (product > limit) {
    k++;
    product *= rng();
  }
  return k;
}
