import type { RampProfile } from "./types";

/**
 * Share of a channel's spend that lands in each launch week. Always sums to 1.
 * - flat:  even every week (paid search, paid social, newsletters).
 * - spike: front-loaded, halving roughly every week (launch posts, creator videos).
 * - build: grows linearly (SEO content compounds as pages index and rank).
 */
export function rampWeights(profile: RampProfile, weeks: number): number[] {
  const raw = Array.from({ length: weeks }, (_, w) => {
    if (profile === "spike") return Math.exp(-w / 1.5);
    if (profile === "build") return w + 1;
    return 1;
  });
  const total = raw.reduce((a, b) => a + b, 0);
  return raw.map((x) => x / total);
}

/** Impressions bought with `spend` at a cost of `costPerThousand` USD per 1,000. */
export function impressionsFor(spend: number, costPerThousand: number): number {
  return costPerThousand > 0 ? (spend / costPerThousand) * 1000 : 0;
}

/**
 * How many distinct people are touched when `events` land at random across `audience` people.
 * Each person escapes all events with probability (1 − 1/A)^E ≈ e^(−E/A), so the answer is
 * A·(1 − e^(−E/A)).
 *
 * Used twice: with impressions as events it gives unique reach (when impressions equal the
 * audience size, reach is 63% of the audience, not 100%); with clicks as events (impressions ×
 * click-through rate) it gives unique visitors, because a person visits at most once.
 * This is the source of diminishing returns.
 */
export function uniquePeople(events: number, audience: number): number {
  if (audience <= 0 || events <= 0) return 0;
  return audience * -Math.expm1(-events / audience);
}
