import type { Dist, OutcomeRange } from "./types";

/**
 * "Downside" always means the outcome that 10% of simulated launches did worse than.
 * For metrics where more is better (paying users, revenue) that is the 10th percentile;
 * for costs (CAC, payback months) it is the 90th percentile, because higher is worse.
 */
export const higherIsBetter = {
  reach: true,
  visit: true,
  signup: true,
  activation: true,
  paying: true,
  revenue: true,
  mrrAtEnd: true,
  cac: false,
  paybackMonths: false,
} as const;

export type OutcomeMetric = keyof typeof higherIsBetter;

export function toOutcomeRange(dist: Dist, metric: OutcomeMetric): OutcomeRange {
  return higherIsBetter[metric]
    ? { downside: dist.p10, likely: dist.p50, upside: dist.p90 }
    : { downside: dist.p90, likely: dist.p50, upside: dist.p10 };
}
