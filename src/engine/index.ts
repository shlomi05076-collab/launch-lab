/**
 * Launch Lab simulation engine: pure TypeScript, no React/DOM/Next, no Math.random.
 * See docs/model.md for the model in plain language.
 */
export { uniquePeople } from "./channels";
export { paybackMonths } from "./economics";
export type { LaunchOutcome, LaunchParams } from "./funnel";
export { DEFAULT_RUNS, expectedLaunch, likelyParams, simulate } from "./monteCarlo";
export { higherIsBetter, type OutcomeMetric, toOutcomeRange } from "./outcomes";
export { CHANNEL_LABELS, runSensitivity } from "./sensitivity";
export * from "./types";
