import type { Dist } from "./types";

/**
 * Percentile with linear interpolation between closest ranks (same as Excel PERCENTILE.INC).
 * `sorted` must be ascending. Infinity is allowed and sorts last.
 */
export function percentile(sorted: ArrayLike<number>, p: number): number {
  const n = sorted.length;
  if (n === 0) return Number.NaN;
  const rank = p * (n - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  const a = sorted[lo] as number;
  const b = sorted[hi] as number;
  if (lo === hi || a === b) return a;
  if (!Number.isFinite(b)) return b;
  return a + (b - a) * (rank - lo);
}

export function summarize(values: Float64Array): Dist {
  const sorted = Float64Array.from(values).sort();
  let sum = 0;
  for (const v of sorted) sum += v;
  return {
    p10: percentile(sorted, 0.1),
    p50: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
    mean: sum / sorted.length,
  };
}

export function histogram(
  values: Float64Array,
  binCount: number,
): Array<{ x0: number; x1: number; count: number }> {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === Number.POSITIVE_INFINITY) return [];
  if (min === max) return [{ x0: min, x1: max, count: values.length }];
  const width = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    x0: min + i * width,
    x1: min + (i + 1) * width,
    count: 0,
  }));
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    const i = Math.min(binCount - 1, Math.floor((v - min) / width));
    (bins[i] as { count: number }).count++;
  }
  return bins;
}

/** Share of values satisfying a predicate. */
export function share(values: Float64Array, predicate: (v: number) => boolean): number {
  let hits = 0;
  for (const v of values) if (predicate(v)) hits++;
  return values.length === 0 ? 0 : hits / values.length;
}
