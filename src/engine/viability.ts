import { pert } from "./distributions";
import { customerValue12m } from "./economics";
import { type LaunchParams, resolveChannels, runLaunch } from "./funnel";
import { likelyParams } from "./monteCarlo";
import { netReturn12m, runSensitivity } from "./sensitivity";
import type { ModelAssumptions, Range, ScenarioInput } from "./types";

/**
 * Viability: "what would have to be true" for the launch's customers to earn back the marketing
 * spend within 12 months. Never a verdict: each requirement is compared with what similar
 * products usually achieve, and the copy layer (src/insights/) decides how to say it.
 *
 * Every number here comes from expected-value launches (no randomness, inputs at "likely"), the
 * same basis as the sensitivity analysis, so the solver is exact and repeatable.
 */

export type RequirementInput =
  | "signupRate"
  | "payingRate"
  | "costPerVisitor"
  | "price"
  | "monthlyChurn"
  | "purchasesPerYear";

export type RequirementStatus = "typical" | "above_typical" | "rare";

/** Quantiles of what similar products achieve. For "lower is better" inputs, p10 is the good end. */
export type TypicalRange = { p10: number; likely: number; p90: number };

export type Requirement = {
  input: RequirementInput;
  /** "higher": a larger value helps (rates, price, repeat purchases). "lower": costs and churn. */
  betterWhen: "higher" | "lower";
  typical: TypicalRange;
  /** The value the scenario currently assumes. */
  current: number;
  /**
   * The value at which the likely launch exactly earns back its spend within 12 months, with every
   * other input at its current value. Null when no value of this input alone gets there.
   */
  needed: number | null;
  status: RequirementStatus;
};

export type Viability = {
  spend: number;
  /** Gross margin one customer earns in their first 12 months, at current values. */
  customerValue12m: number;
  /** Customers needed to earn back the spend within 12 months. */
  breakEvenCustomers: number;
  /** Paying customers in the all-likely, no-randomness launch. */
  expectedCustomers: number;
  aboveBreakEven: boolean;
  requirements: Requirement[];
  /** The requirement behind the largest swing in 12-month net return, if any. */
  mattersMost: RequirementInput | null;
};

export type ViabilityOptions = {
  /** What similar products charge. Without it, price is compared only with itself. */
  typicalPrice?: Range;
};

const ONCE: Range = { low: 1, likely: 1, high: 1 };
const GRID = 64;

/** Deterministic quantiles of f(a, b) over a 64 × 64 grid of the two PERT distributions. */
function combinedQuantiles(a: Range, b: Range, f: (x: number, y: number) => number) {
  const sa = pert(a);
  const sb = pert(b);
  const values: number[] = [];
  for (let i = 0; i < GRID; i++) {
    const x = sa.quantile((i + 0.5) / GRID);
    for (let j = 0; j < GRID; j++) values.push(f(x, sb.quantile((j + 0.5) / GRID)));
  }
  values.sort((m, n) => m - n);
  const at = (p: number) =>
    values[Math.min(values.length - 1, Math.floor(p * values.length))] as number;
  return { p10: at(0.1), p90: at(0.9) };
}

function rangeQuantiles(range: Range): TypicalRange {
  const s = pert(range);
  return { p10: s.quantile(0.1), likely: range.likely, p90: s.quantile(0.9) };
}

/**
 * Smallest (betterWhen "higher") or largest ("lower") x in [lo, hi] with f(x) ≥ 0, by bisection.
 * f must be monotone: increasing for "higher", decreasing for "lower". Null when unreachable.
 */
export function solveThreshold(
  f: (x: number) => number,
  lo: number,
  hi: number,
  betterWhen: "higher" | "lower",
): number | null {
  if (betterWhen === "higher") {
    if (f(hi) < 0) return null;
    if (f(lo) >= 0) return lo;
  } else {
    if (f(lo) < 0) return null;
    if (f(hi) >= 0) return hi;
  }
  let a = lo;
  let b = hi;
  for (let i = 0; i < 100; i++) {
    const mid = (a + b) / 2;
    const ok = f(mid) >= 0;
    if (betterWhen === "higher") {
      if (ok) b = mid;
      else a = mid;
    } else if (ok) a = mid;
    else b = mid;
  }
  return betterWhen === "higher" ? b : a;
}

export function statusOf(
  needed: number | null,
  typical: TypicalRange,
  betterWhen: "higher" | "lower",
): RequirementStatus {
  if (needed === null) return "rare";
  if (betterWhen === "higher") {
    if (needed <= typical.likely) return "typical";
    return needed <= typical.p90 ? "above_typical" : "rare";
  }
  if (needed >= typical.likely) return "typical";
  return needed >= typical.p10 ? "above_typical" : "rare";
}

/** Maps a sensitivity input key to the requirement it moves. */
export function requirementForSensitivityInput(key: string): RequirementInput | null {
  if (key === "funnel.signupRate") return "signupRate";
  if (key === "funnel.activationRate" || key === "funnel.paidConversion") return "payingRate";
  if (key.startsWith("channel.")) return "costPerVisitor";
  if (key === "pricing.price") return "price";
  if (key === "pricing.monthlyChurn") return "monthlyChurn";
  if (key === "pricing.purchasesPerYear") return "purchasesPerYear";
  return null;
}

export function assessViability(
  input: ScenarioInput,
  assumptions: ModelAssumptions,
  options: ViabilityOptions = {},
): Viability {
  const base = likelyParams(input, assumptions);
  const net = (inp: ScenarioInput, params: LaunchParams) =>
    netReturn12m(runLaunch(inp, assumptions, params, null), inp, params);

  const outcome = runLaunch(input, assumptions, base, null);
  const value = customerValue12m({
    price: input.pricing.price,
    grossMargin: input.pricing.grossMargin,
    model: input.pricing.model,
    monthlyChurn: base.monthlyChurn,
    purchasesPerYear: base.purchasesPerYear,
  });
  const spend = outcome.spend;
  const breakEvenCustomers = value > 0 ? spend / value : Number.POSITIVE_INFINITY;
  const expectedCustomers = outcome.stages.paying;

  const requirement = (
    inputKey: RequirementInput,
    betterWhen: "higher" | "lower",
    typical: TypicalRange,
    current: number,
    domain: [number, number],
    apply: (x: number) => { input: ScenarioInput; params: LaunchParams },
  ): Requirement => {
    const needed = solveThreshold(
      (x) => {
        const v = apply(x);
        return net(v.input, v.params);
      },
      domain[0],
      domain[1],
      betterWhen,
    );
    return {
      input: inputKey,
      betterWhen,
      typical,
      current,
      needed,
      status: statusOf(needed, typical, betterWhen),
    };
  };

  const requirements: Requirement[] = [];
  if (spend > 0) {
    const { funnel } = input;

    requirements.push(
      requirement(
        "signupRate",
        "higher",
        rangeQuantiles(funnel.signupRate),
        base.signupRate,
        [0, 1],
        (x) => ({ input, params: { ...base, signupRate: x } }),
      ),
    );

    // Sign-ups who end up paying = activation × paid conversion, solved as one combined rate.
    const activation = base.activationRate;
    requirements.push(
      requirement(
        "payingRate",
        "higher",
        {
          ...combinedQuantiles(funnel.activationRate, funnel.paidConversion, (a, p) => a * p),
          likely: activation * base.paidConversion,
        },
        activation * base.paidConversion,
        [0, 1],
        (q) => ({
          input,
          params:
            activation > 0 && q <= activation
              ? { ...base, paidConversion: q / activation }
              : { ...base, activationRate: q, paidConversion: 1 },
        }),
      ),
    );

    // Cost per visitor from ads: every channel's cost per 1,000 scaled by the same factor.
    const channels = resolveChannels(input, assumptions);
    const shares = input.channels.map((c) => Math.max(0, c.budgetShare));
    const shareTotal = shares.reduce((a, b) => a + b, 0) || 1;
    const blend = (costPerVisitor: number[]) =>
      1 /
      costPerVisitor.reduce(
        (sum, cpv, i) => sum + (shares[i] as number) / shareTotal / Math.max(cpv, 1e-12),
        0,
      );
    const perChannel = channels.map((c) =>
      combinedQuantiles(c.costPerThousand, c.clickThroughRate, (cpm, ctr) => cpm / (1000 * ctr)),
    );
    const currentCpv = blend(
      base.channels.map((c) => c.costPerThousand / (1000 * c.clickThroughRate)),
    );
    const k = solveThreshold(
      (factor) =>
        net(input, {
          ...base,
          channels: base.channels.map((c) => ({
            ...c,
            costPerThousand: c.costPerThousand * factor,
          })),
        }),
      1e-6,
      1e3,
      "lower",
    );
    const cpvTypical: TypicalRange = {
      p10: blend(perChannel.map((q) => q.p10)),
      likely: currentCpv,
      p90: blend(perChannel.map((q) => q.p90)),
    };
    const cpvNeeded = k === null ? null : currentCpv * k;
    requirements.push({
      input: "costPerVisitor",
      betterWhen: "lower",
      typical: cpvTypical,
      current: currentCpv,
      needed: cpvNeeded,
      status: statusOf(cpvNeeded, cpvTypical, "lower"),
    });

    const price = input.pricing.price;
    const priceTypical = options.typicalPrice
      ? rangeQuantiles(options.typicalPrice)
      : { p10: price, likely: price, p90: price };
    requirements.push(
      requirement("price", "higher", priceTypical, price, [0, Math.max(1e7, price * 1e4)], (x) => ({
        input: { ...input, pricing: { ...input.pricing, price: x } },
        params: base,
      })),
    );

    if (input.pricing.model === "subscription") {
      requirements.push(
        requirement(
          "monthlyChurn",
          "lower",
          rangeQuantiles(input.pricing.monthlyChurn ?? { low: 0, likely: 0, high: 0 }),
          base.monthlyChurn,
          [0, 1],
          (c) => ({ input, params: { ...base, monthlyChurn: c } }),
        ),
      );
    } else {
      requirements.push(
        requirement(
          "purchasesPerYear",
          "higher",
          rangeQuantiles(input.pricing.purchasesPerYear ?? ONCE),
          base.purchasesPerYear,
          [1, 100],
          (n) => ({ input, params: { ...base, purchasesPerYear: n } }),
        ),
      );
    }
  }

  const bars = spend > 0 ? runSensitivity(input, assumptions, "netReturn12m").bars : [];
  const mattersMost =
    bars
      .filter((b) => b.swing > 0)
      .map((b) => requirementForSensitivityInput(b.input))
      .find((r): r is RequirementInput => r !== null) ?? null;

  return {
    spend,
    customerValue12m: value,
    breakEvenCustomers,
    expectedCustomers,
    aboveBreakEven: spend <= 0 || expectedCustomers * value >= spend,
    requirements,
    mattersMost,
  };
}
