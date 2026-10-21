/** A source of uniform random numbers in [0, 1). */
export type Rng = () => number;

/**
 * mulberry32: a tiny, fast, well-distributed 32-bit PRNG. Same seed → same sequence,
 * which is what makes share links and tests reproducible. Not for cryptography.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
