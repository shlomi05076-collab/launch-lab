import { impressionsFor, rampWeights, uniquePeople } from "./channels";
import { binomial } from "./distributions";
import { cac, paybackMonths, WEEKS_PER_MONTH, weeklyRetention } from "./economics";
import type { Rng } from "./rng";
import { indexFor, monthOfWeek } from "./seasonality";
import type { ChannelAssumptions, ModelAssumptions, ScenarioInput, Stage } from "./types";

/** The uncertain inputs, fixed to one value each for a single simulated launch. */
export type LaunchParams = {
  /** Aligned with `input.channels`. */
  channels: Array<{ costPerThousand: number; clickThroughRate: number }>;
  signupRate: number;
  activationRate: number;
  paidConversion: number;
  monthlyChurn: number;
  /** One-time pricing: purchases per customer in the first year (≥ 1). */
  purchasesPerYear: number;
};

export type LaunchOutcome = {
  stages: Record<Stage, number>;
  spend: number;
  channelSpend: number[];
  channelPaying: number[];
  /** Cumulative paying customers at the end of each week. */
  weeklyPaying: Float64Array;
  /** Cumulative revenue at the end of each week. */
  weeklyRevenue: Float64Array;
  revenue: number;
  mrrAtEnd: number;
  cac: number;
  paybackMonths: number;
};

/** Channel assumptions with the scenario's overrides applied. */
export function resolveChannels(
  input: ScenarioInput,
  assumptions: ModelAssumptions,
): ChannelAssumptions[] {
  return input.channels.map((c) => ({ ...assumptions.channels[c.channel], ...c.overrides }));
}

/** Budget shares normalised to sum to 1 (all zero → all zero). */
export function normalizedShares(input: ScenarioInput): number[] {
  const total = input.channels.reduce((sum, c) => sum + Math.max(0, c.budgetShare), 0);
  return input.channels.map((c) => (total > 0 ? Math.max(0, c.budgetShare) / total : 0));
}

/**
 * One simulated launch, week by week.
 *
 * Budget → impressions (per channel, per week, at that month's cost) → unique reach and unique
 * visitors, both on saturating curves over one shared audience → sign-ups → activations →
 * paying. Reach and visits are in the thousands, so they are computed as expectations; from
 * sign-up on, with `rng` each step is a binomial draw (luck matters once counts are small),
 * and with `null` it is the exact expectation.
 */
export function runLaunch(
  input: ScenarioInput,
  assumptions: ModelAssumptions,
  params: LaunchParams,
  rng: Rng | null,
): LaunchOutcome {
  const weeks = Math.max(1, Math.round(input.window.weeks));
  const channels = resolveChannels(input, assumptions);
  const shares = normalizedShares(input);
  const channelSpend = shares.map((s) => s * input.totalBudget);
  const ramps = channels.map((c) => rampWeights(c.rampProfile, weeks));

  const stages: Record<Stage, number> = { reach: 0, visit: 0, signup: 0, activation: 0, paying: 0 };
  const channelPaying = channels.map(() => 0);
  const newPaying = new Float64Array(weeks);

  let cumulativeImpressions = 0;
  let cumulativeClicks = 0;
  let reachSoFar = 0;
  let visitorsSoFar = 0;

  for (let week = 0; week < weeks; week++) {
    const month = monthOfWeek(input.window.startMonth, week);
    const costIndex = indexFor(assumptions.seasonality.cost, month);
    const demandIndex = indexFor(assumptions.seasonality.demand, month);

    const weekImpressions = channels.map((_, i) =>
      impressionsFor(
        (channelSpend[i] as number) * (ramps[i]?.[week] as number),
        (params.channels[i]?.costPerThousand as number) * costIndex,
      ),
    );
    const totalImpressions = weekImpressions.reduce((a, b) => a + b, 0);
    if (totalImpressions <= 0) continue;

    // Every impression may produce a click; a person visits at most once.
    const weekClicks = weekImpressions.map(
      (impressions, i) => impressions * (params.channels[i]?.clickThroughRate as number),
    );
    const totalClicks = weekClicks.reduce((a, b) => a + b, 0);

    // All channels share one audience, so new unique reach and new unique visitors this week are
    // split between channels by their share of impressions and clicks.
    cumulativeImpressions += totalImpressions;
    cumulativeClicks += totalClicks;
    const reachNow = uniquePeople(cumulativeImpressions, input.audienceSize);
    const visitorsNow = uniquePeople(cumulativeClicks, input.audienceSize);
    const newReach = reachNow - reachSoFar;
    const newVisitors = visitorsNow - visitorsSoFar;
    reachSoFar = reachNow;
    visitorsSoFar = visitorsNow;

    channels.forEach((channel, i) => {
      const reached = newReach * ((weekImpressions[i] as number) / totalImpressions);
      const visits = totalClicks > 0 ? newVisitors * ((weekClicks[i] as number) / totalClicks) : 0;
      const signupProbability = params.signupRate * channel.intentMultiplier * demandIndex;
      const signups = binomial(visits, signupProbability, rng);
      const activations = binomial(signups, params.activationRate, rng);
      const paying = binomial(activations, params.paidConversion, rng);

      stages.reach += reached;
      stages.visit += visits;
      stages.signup += signups;
      stages.activation += activations;
      stages.paying += paying;
      channelPaying[i] = (channelPaying[i] as number) + paying;
      newPaying[week] = (newPaying[week] as number) + paying;
    });
  }

  const { price, model, grossMargin } = input.pricing;
  const isSubscription = model === "subscription";
  const churn = isSubscription ? params.monthlyChurn : 0;
  const retention = weeklyRetention(churn);
  const weeklyPrice = price / WEEKS_PER_MONTH;

  const weeklyPaying = new Float64Array(weeks);
  const weeklyRevenue = new Float64Array(weeks);
  let cumulativePaying = 0;
  let activeSubscribers = 0;
  let revenue = 0;
  // One-time: repeat purchases are spread evenly over each customer's first year.
  const repeatsPerWeek = isSubscription ? 0 : (Math.max(1, params.purchasesPerYear) - 1) / 52;
  for (let week = 0; week < weeks; week++) {
    const joined = newPaying[week] as number;
    if (isSubscription) {
      // Existing subscribers churn a little each week; new ones pay from the week they join.
      activeSubscribers = activeSubscribers * retention + joined;
      revenue += activeSubscribers * weeklyPrice;
    } else {
      // First purchases this week, plus repeat purchases from earlier customers (the window is
      // at most 26 weeks, so every earlier customer is still inside their first year).
      revenue += (joined + cumulativePaying * repeatsPerWeek) * price;
    }
    cumulativePaying += joined;
    weeklyPaying[week] = cumulativePaying;
    weeklyRevenue[week] = revenue;
  }

  const spend = channelSpend.reduce((a, b) => a + b, 0);
  const blendedCac = cac(spend, stages.paying);
  return {
    stages,
    spend,
    channelSpend,
    channelPaying,
    weeklyPaying,
    weeklyRevenue,
    revenue,
    mrrAtEnd: isSubscription ? activeSubscribers * price : 0,
    cac: blendedCac,
    paybackMonths: paybackMonths({
      cac: blendedCac,
      price,
      grossMargin,
      model,
      monthlyChurn: churn,
      purchasesPerYear: params.purchasesPerYear,
    }),
  };
}
