import { pert } from "./distributions";
import { type LaunchOutcome, type LaunchParams, runLaunch } from "./funnel";
import { likelyParams } from "./monteCarlo";
import type {
  ChannelId,
  ModelAssumptions,
  Range,
  ScenarioInput,
  SensitivityBar,
  SensitivityMetric,
  SensitivityResult,
} from "./types";

export const CHANNEL_LABELS: Record<ChannelId, string> = {
  paid_search: "Paid search",
  paid_social: "Paid social",
  linkedin_ads: "LinkedIn ads",
  newsletter: "Newsletter sponsorships",
  influencer: "Creators / influencers",
  content_seo: "Content & SEO",
};

/** Fixed inputs (no range) are swung by this much either way. */
export const FIXED_SWING = 0.2;

type Probe = {
  input: string;
  label: string;
  low: number;
  high: number;
  apply: (
    value: number,
    input: ScenarioInput,
    params: LaunchParams,
  ) => { input: ScenarioInput; params: LaunchParams };
};

function metricOf(outcome: LaunchOutcome, metric: SensitivityMetric): number {
  if (metric === "paying") return outcome.stages.paying;
  if (metric === "revenue") return outcome.revenue;
  return outcome.cac;
}

/** P10 and P90 of an uncertain input: a plausible swing, not the near-impossible extremes. */
function plausibleSwing(range: Range): { low: number; high: number } {
  const sampler = pert(range);
  return { low: sampler.quantile(0.1), high: sampler.quantile(0.9) };
}

function probes(input: ScenarioInput, assumptions: ModelAssumptions): Probe[] {
  const list: Probe[] = [];
  const funnelProbe = (key: keyof ScenarioInput["funnel"], label: string): Probe => ({
    input: `funnel.${key}`,
    label,
    ...plausibleSwing(input.funnel[key]),
    apply: (value, inp, params) => ({ input: inp, params: { ...params, [key]: value } }),
  });
  list.push(
    funnelProbe("signupRate", "Sign-up rate"),
    funnelProbe("activationRate", "Activation rate"),
    funnelProbe("paidConversion", "Paid conversion"),
  );

  input.channels.forEach((c, i) => {
    const resolved = { ...assumptions.channels[c.channel], ...c.overrides };
    const name = CHANNEL_LABELS[c.channel];
    for (const key of ["costPerThousand", "clickThroughRate"] as const) {
      list.push({
        input: `channel.${c.channel}.${key}`,
        label: `${name}: ${key === "costPerThousand" ? "cost per 1,000" : "click-through rate"}`,
        ...plausibleSwing(resolved[key]),
        apply: (value, inp, params) => ({
          input: inp,
          params: {
            ...params,
            channels: params.channels.map((p, j) => (j === i ? { ...p, [key]: value } : p)),
          },
        }),
      });
    }
  });

  if (input.pricing.model === "subscription" && input.pricing.monthlyChurn) {
    list.push({
      input: "pricing.monthlyChurn",
      label: "Monthly churn",
      ...plausibleSwing(input.pricing.monthlyChurn),
      apply: (value, inp, params) => ({ input: inp, params: { ...params, monthlyChurn: value } }),
    });
  }

  const fixed = (
    key: string,
    label: string,
    base: number,
    set: (inp: ScenarioInput, value: number) => ScenarioInput,
  ): Probe => ({
    input: key,
    label,
    low: base * (1 - FIXED_SWING),
    high: base * (1 + FIXED_SWING),
    apply: (value, inp, params) => ({ input: set(inp, value), params }),
  });
  list.push(
    fixed("totalBudget", "Budget (±20%)", input.totalBudget, (inp, v) => ({
      ...inp,
      totalBudget: v,
    })),
    fixed("pricing.price", "Price (±20%)", input.pricing.price, (inp, v) => ({
      ...inp,
      pricing: { ...inp.pricing, price: v },
    })),
    fixed("audienceSize", "Audience size (±20%)", input.audienceSize, (inp, v) => ({
      ...inp,
      audienceSize: v,
    })),
  );
  return list;
}

/**
 * Tornado analysis: swing one input at a time between its plausible low and high (P10/P90 of
 * its distribution, or ±20% for fixed inputs) with everything else at "likely", and measure how
 * far the metric moves. Expected-value runs, so the result is exact and noise-free.
 */
export function runSensitivity(
  input: ScenarioInput,
  assumptions: ModelAssumptions,
  metric: SensitivityMetric = "paying",
): SensitivityResult {
  const base = likelyParams(input, assumptions);
  const evaluate = (inp: ScenarioInput, params: LaunchParams) =>
    metricOf(runLaunch(inp, assumptions, params, null), metric);
  const baseline = evaluate(input, base);

  const bars: SensitivityBar[] = probes(input, assumptions).map((probe) => {
    const atLow = probe.apply(probe.low, input, base);
    const atHigh = probe.apply(probe.high, input, base);
    const metricAtLow = evaluate(atLow.input, atLow.params);
    const metricAtHigh = evaluate(atHigh.input, atHigh.params);
    return {
      input: probe.input,
      label: probe.label,
      inputLow: probe.low,
      inputHigh: probe.high,
      metricAtLow,
      metricAtHigh,
      swing: metricAtLow === metricAtHigh ? 0 : Math.abs(metricAtHigh - metricAtLow),
    };
  });

  bars.sort((a, b) => b.swing - a.swing);
  return { metric, baseline, bars };
}
