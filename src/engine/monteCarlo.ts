import { normalCdf, pert, type Sampler, standardNormal } from "./distributions";
import { cac } from "./economics";
import { type LaunchParams, resolveChannels, runLaunch } from "./funnel";
import { createRng, type Rng } from "./rng";
import { histogram, share, summarize } from "./stats";
import {
  type ModelAssumptions,
  type Range,
  type ScenarioInput,
  type SimulationResult,
  STAGES,
} from "./types";

export const DEFAULT_RUNS = 5000;

/** A range with no uncertainty, used where a scenario omits churn (one-time pricing). */
const ZERO: Range = { low: 0, likely: 0, high: 0 };

/** The scenario's inputs, each at its "likely" value. Used for expected-value runs. */
export function likelyParams(input: ScenarioInput, assumptions: ModelAssumptions): LaunchParams {
  return {
    channels: resolveChannels(input, assumptions).map((c) => ({
      costPerThousand: c.costPerThousand.likely,
      clickThroughRate: c.clickThroughRate.likely,
    })),
    signupRate: input.funnel.signupRate.likely,
    activationRate: input.funnel.activationRate.likely,
    paidConversion: input.funnel.paidConversion.likely,
    monthlyChurn: (input.pricing.monthlyChurn ?? ZERO).likely,
  };
}

/** One launch with every input at "likely" and no randomness. Calculator-checkable. */
export function expectedLaunch(input: ScenarioInput, assumptions: ModelAssumptions) {
  return runLaunch(input, assumptions, likelyParams(input, assumptions), null);
}

type Samplers = {
  channels: Array<{ costPerThousand: Sampler; clickThroughRate: Sampler }>;
  signupRate: Sampler;
  activationRate: Sampler;
  paidConversion: Sampler;
  monthlyChurn: Sampler;
};

function buildSamplers(input: ScenarioInput, assumptions: ModelAssumptions): Samplers {
  return {
    channels: resolveChannels(input, assumptions).map((c) => ({
      costPerThousand: pert(c.costPerThousand),
      clickThroughRate: pert(c.clickThroughRate),
    })),
    signupRate: pert(input.funnel.signupRate),
    activationRate: pert(input.funnel.activationRate),
    paidConversion: pert(input.funnel.paidConversion),
    monthlyChurn: pert(input.pricing.monthlyChurn ?? ZERO),
  };
}

/**
 * Draws one possible world.
 *
 * Market response: the three product rates share one standard-normal "market" draw. Each rate's
 * latent value is √ρ·market + √(1−ρ)·own, so any two rates have correlation ρ. The latent value is
 * mapped to a percentile with Φ and then to the rate through its PERT quantile function, so each
 * rate keeps its own PERT shape. Channel costs, visit rates and churn are drawn independently.
 */
function drawParams(samplers: Samplers, correlation: number, rng: Rng): LaunchParams {
  const loading = Math.sqrt(correlation);
  const own = Math.sqrt(1 - correlation);
  const market = standardNormal(rng);
  const productRate = (sampler: Sampler) =>
    sampler.quantile(normalCdf(loading * market + own * standardNormal(rng)));

  return {
    signupRate: productRate(samplers.signupRate),
    activationRate: productRate(samplers.activationRate),
    paidConversion: productRate(samplers.paidConversion),
    channels: samplers.channels.map((c) => ({
      costPerThousand: c.costPerThousand.quantile(rng()),
      clickThroughRate: c.clickThroughRate.quantile(rng()),
    })),
    monthlyChurn: samplers.monthlyChurn.quantile(rng()),
  };
}

export type SimulateOptions = {
  runs?: number;
  /** Defaults to the scenario's own seed, so the same scenario always gives the same result. */
  seed?: number;
};

/** Runs the Monte Carlo simulation: many possible launches, summarised as percentiles. */
export function simulate(
  input: ScenarioInput,
  assumptions: ModelAssumptions,
  options: SimulateOptions = {},
): SimulationResult {
  const runs = Math.max(1, Math.round(options.runs ?? DEFAULT_RUNS));
  const seed = options.seed ?? input.seed;
  const rng = createRng(seed);
  const samplers = buildSamplers(input, assumptions);
  const weeks = Math.max(1, Math.round(input.window.weeks));
  const channelCount = input.channels.length;

  const stageValues = STAGES.map(() => new Float64Array(runs));
  const revenue = new Float64Array(runs);
  const mrr = new Float64Array(runs);
  const blendedCac = new Float64Array(runs);
  const payback = new Float64Array(runs);
  const channelPaying = Array.from({ length: channelCount }, () => new Float64Array(runs));
  const channelCac = Array.from({ length: channelCount }, () => new Float64Array(runs));
  const weeklyPaying = Array.from({ length: weeks }, () => new Float64Array(runs));
  const weeklyRevenue = Array.from({ length: weeks }, () => new Float64Array(runs));
  let channelSpend: number[] = [];

  for (let r = 0; r < runs; r++) {
    const params = drawParams(samplers, assumptions.marketCorrelation, rng);
    const outcome = runLaunch(input, assumptions, params, rng);

    STAGES.forEach((stage, s) => {
      (stageValues[s] as Float64Array)[r] = outcome.stages[stage];
    });
    revenue[r] = outcome.revenue;
    mrr[r] = outcome.mrrAtEnd;
    blendedCac[r] = outcome.cac;
    payback[r] = outcome.paybackMonths;
    for (let i = 0; i < channelCount; i++) {
      const paying = outcome.channelPaying[i] as number;
      (channelPaying[i] as Float64Array)[r] = paying;
      (channelCac[i] as Float64Array)[r] = cac(outcome.channelSpend[i] as number, paying);
    }
    for (let w = 0; w < weeks; w++) {
      (weeklyPaying[w] as Float64Array)[r] = outcome.weeklyPaying[w] as number;
      (weeklyRevenue[w] as Float64Array)[r] = outcome.weeklyRevenue[w] as number;
    }
    channelSpend = outcome.channelSpend;
  }

  const stages = Object.fromEntries(
    STAGES.map((stage, s) => [stage, summarize(stageValues[s] as Float64Array)]),
  ) as SimulationResult["stages"];

  const dropOff = STAGES.slice(1).map((to, i) => {
    const from = STAGES[i] as (typeof STAGES)[number];
    const fromValues = stageValues[i] as Float64Array;
    const toValues = stageValues[i + 1] as Float64Array;
    const rate = new Float64Array(runs);
    const lost = new Float64Array(runs);
    for (let r = 0; r < runs; r++) {
      const f = fromValues[r] as number;
      const t = toValues[r] as number;
      rate[r] = f > 0 ? t / f : 0;
      lost[r] = f - t;
    }
    return { from, to, rate: summarize(rate), lost: summarize(lost) };
  });

  return {
    scenarioId: input.id,
    runs,
    seed,
    stages,
    dropOff,
    byChannel: input.channels.map((c, i) => ({
      channel: c.channel,
      spend: channelSpend[i] ?? 0,
      paying: summarize(channelPaying[i] as Float64Array),
      cac: summarize(channelCac[i] as Float64Array),
    })),
    weekly: weeklyPaying.map((values, w) => ({
      week: w + 1,
      paying: summarize(values),
      revenue: summarize(weeklyRevenue[w] as Float64Array),
    })),
    revenue: summarize(revenue),
    mrrAtEnd: summarize(mrr),
    cac: summarize(blendedCac),
    paybackMonths: summarize(payback),
    probPaybackWithin12: share(payback, (m) => m <= 12),
    probNeverPayback: share(payback, (m) => !Number.isFinite(m)),
    histogram: { metric: "paying", bins: histogram(stageValues[4] as Float64Array, 24) },
  };
}
