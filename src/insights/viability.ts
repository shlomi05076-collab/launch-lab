import type { ProductTypeTemplate } from "@/data/productTypes";
import {
  HORIZONS,
  type Requirement,
  type RequirementStatus,
  type ScenarioInput,
  type SimulationResult,
  toOutcomeRange,
  type Viability,
} from "@/engine";
import {
  formatApproxCount,
  formatApproxCurrency,
  formatCurrency,
  formatDuration,
  formatOneIn,
  formatPercent,
} from "@/lib/format";

/**
 * Plain-language copy for the guided viability answer. Pure, tested, and never a verdict:
 * every sentence is conditional and describes what would have to be true (see
 * docs/test-my-idea.md and the banned-words test).
 */

export type ViabilityCopyContext = {
  scenario: ScenarioInput;
  result: SimulationResult;
  viability: Viability;
  template: ProductTypeTemplate;
};

/** Labels describe the requirement, never the idea. */
export const STATUS_LABELS: Record<RequirementStatus, string> = {
  typical: "Typical",
  above_typical: "Needs above-typical results",
  rare: "Rarely seen",
};

/** Below this many likely customers, the simulation can't say much. */
export const FEW_CUSTOMERS = 5;

function customersRange(result: SimulationResult): string {
  const o = toOutcomeRange(result.stages.paying, "paying");
  const lo = formatApproxCount(o.downside);
  const hi = formatApproxCount(o.upside);
  return lo === hi ? lo : `${lo}–${hi}`;
}

function perMonth(scenario: ScenarioInput): string {
  return scenario.pricing.model === "subscription" ? " a month" : "";
}

function requirementOf(v: Viability, input: Requirement["input"] | null) {
  return input ? v.requirements.find((r) => r.input === input) : undefined;
}

/** The "so roughly …" clause for the requirement that matters most. */
function whatWouldHaveToBeTrue(ctx: ViabilityCopyContext): string {
  const { viability, template, scenario } = ctx;
  const req = requirementOf(viability, viability.mattersMost);
  const { similar, steps } = template;
  if (!req)
    return `, and several of the rates below would have to beat what ${similar} usually see`;

  const unreachable = (what: string) => `, and ${what} couldn't close that gap on its own`;
  switch (req.input) {
    case "signupRate":
      return req.needed === null
        ? unreachable(`more visitors who ${steps.signup}`)
        : `, so roughly ${formatOneIn(req.needed)} visitors would have to ${steps.signup}; ${similar} usually get ${formatOneIn(req.typical.likely)}`;
    case "payingRate":
      return req.needed === null
        ? unreachable(`more ${steps.signedUp} who ${steps.paying}`)
        : `, so about ${formatOneIn(req.needed)} ${steps.signedUp} would have to ${steps.paying}; ${similar} usually see ${formatOneIn(req.typical.likely)}`;
    case "costPerVisitor":
      return req.needed === null
        ? unreachable("cheaper ads")
        : `, so each visitor from ads would have to cost about ${formatCurrency(req.needed)}; it usually costs about ${formatCurrency(req.typical.likely)}`;
    case "price":
      return req.needed === null
        ? unreachable("a higher price")
        : `, so you'd need to charge about ${formatCurrency(req.needed)}${perMonth(scenario)}; ${similar} usually charge about ${formatCurrency(req.typical.likely)}`;
    case "monthlyChurn":
      return req.needed === null
        ? unreachable(`keeping every one of your ${template.customers}`)
        : `, so no more than ${formatOneIn(req.needed)} ${template.customers} could cancel each month; ${similar} usually lose ${formatOneIn(req.typical.likely)}`;
    case "purchasesPerYear":
      return req.needed === null
        ? unreachable("more repeat purchases")
        : `, so ${template.customers} would need to buy about ${req.needed.toFixed(1)} times in their first year; ${similar} usually see about ${req.typical.likely.toFixed(1)}`;
  }
}

/** "within a year", "within 2 years", "within 3 years". */
export function horizonPhrase(months: number): string {
  return months <= 12 ? "within a year" : `within ${Math.round(months / 12)} years`;
}

/** Below this chance of earning the spend back, the headline points to a way forward. */
export const LOW_CHANCE = 0.25;

function hoursPerWeek(scenario: ScenarioInput): number {
  return Math.max(0, scenario.selfPromotion?.hoursPerWeek ?? 0);
}

/**
 * The one sentence that leads the guided results. Never a verdict. Variants, in order:
 * - only the founder's own promotion (no ad spend to earn back),
 * - too few customers to say much,
 * - above break-even,
 * - a low chance of earning the spend back: honest, and pointing to a way forward,
 * - short of break-even: what would have to be true for the input that matters most.
 */
export function viabilityHeadline(ctx: ViabilityCopyContext): string {
  const { scenario, result, viability, template } = ctx;
  const customers = template.customers;
  const duration = formatDuration(scenario.window.weeks);
  const hours = hoursPerWeek(scenario);
  const horizon = horizonPhrase(viability.horizonMonths);
  const range = customersRange(result);

  if (viability.spend <= 0) {
    const opening = `Promoting it yourself for ${hours} hours a week over ${duration}, you'd likely get ${range} ${customers}`;
    return result.stages.paying.p50 < FEW_CUSTOMERS
      ? `${opening}, too few to tell much. More hours, a longer push or a small ad budget would show more.`
      : `${opening}, with no ad spend to earn back.`;
  }

  const opening = `With ${formatCurrency(scenario.totalBudget)} over ${duration}${hours > 0 ? " and your own promotion" : ""},`;
  if (result.stages.paying.p50 < FEW_CUSTOMERS) {
    return `${opening} you'd likely get ${range} ${customers}, too few to tell much. Try a larger budget or a different way to reach people.`;
  }

  const needed =
    viability.breakEvenCustomers <= 1
      ? `a single ${customers.replace(/s$/, "")}`
      : `about ${formatApproxCount(Math.ceil(viability.breakEvenCustomers))} ${customers}`;

  if (viability.aboveBreakEven) {
    return `${opening} you'd likely get ${range} ${customers}; ${needed} would earn the spend back ${horizon}, if results match ${template.similar}.`;
  }

  const chance = result.probPaybackWithin[viability.horizonMonths];
  if (chance < LOW_CHANCE) {
    const who = hours > 0 ? "that" : "paid ads alone";
    const what = hours > 0 ? "the ad spend" : "the spend";
    return `${opening} you'd likely get ${range} ${customers}, but ${who} probably won't earn back ${what} ${horizon}. Below: what would have to change, and how to test the riskiest part cheaply.`;
  }
  return `${opening} you'd likely get ${range} ${customers}. To earn that back ${horizon} you'd need ${needed}${whatWouldHaveToBeTrue(ctx)}.`;
}

/** "Within 1 year: 4% · within 2 years: 19% · within 3 years: 29%". */
export function chanceByHorizon(result: SimulationResult): string {
  return HORIZONS.map(
    (h, i) =>
      `${i === 0 ? "Within" : "within"} ${h / 12} ${h === 12 ? "year" : "years"}: ${formatPercent(result.probPaybackWithin[h])}`,
  ).join(" · ");
}

/** One plain line on why longer horizons matter for this kind of product. */
export function horizonNote(
  scenario: ScenarioInput,
  saasPaybackMonths: number,
  audience: "business" | "people" = "business",
): string {
  if (scenario.pricing.model === "subscription" && audience === "people") {
    return "Subscription businesses often take 1–2 years to earn back what they spend on marketing, and longer when the monthly price is low.";
  }
  return scenario.pricing.model === "subscription"
    ? `Subscription businesses often take 1–2 years to earn back what they spend on marketing; the median business software company takes about ${saasPaybackMonths} months.`
    : "One-time products earn it back through first orders and repeat purchases; years 2 and 3 assume customers keep buying again at the first-year pace.";
}

/** Customers from ads and from the founder's own promotion, kept apart. Null without the latter. */
export function sourcesSplit(
  scenario: ScenarioInput,
  result: SimulationResult,
  template: ProductTypeTemplate,
): string | null {
  if (!result.selfPromotion) return null;
  const own = formatApproxCount(result.selfPromotion.paying.p50);
  const total = result.stages.paying.p50;
  const fromAds = formatApproxCount(Math.max(0, total - result.selfPromotion.paying.p50));
  const time = `about ${formatApproxCount(result.selfPromotion.hours)} hours of your time and no money`;
  return scenario.totalBudget > 0
    ? `From ads: about ${fromAds} ${template.customers}. From your own promotion: about ${own}, for ${time}.`
    : `From your own promotion: about ${own} ${template.customers}, for ${time}.`;
}

/** "at least …" for things that help when higher, "at most …" for costs and cancellations. */
function neededText(req: Requirement, fmt: (x: number) => string): string {
  if (req.needed === null) return "needed: not reachable on its own";
  if (req.input === "monthlyChurn" && req.needed >= 1) return "needed: no limit";
  return `needed: ${req.betterWhen === "higher" ? "at least" : "at most"} ${fmt(req.needed)}`;
}

export type RequirementCopy = {
  label: string;
  /** What similar products usually achieve. */
  typical: string;
  /** What this scenario would need. */
  needed: string;
  status: string;
  /** Extra line, e.g. when no value of this input alone gets there. */
  detail?: string;
};

/** One row of "what would have to be true", in plain words. */
export function describeRequirement(
  req: Requirement,
  template: ProductTypeTemplate,
  scenario: ScenarioInput,
): RequirementCopy {
  const fmt = (x: number): string => {
    switch (req.input) {
      case "signupRate":
      case "payingRate":
      case "monthlyChurn":
        return formatOneIn(x);
      case "costPerVisitor":
        return formatCurrency(x);
      case "price":
        return `${formatCurrency(x)}${perMonth(scenario)}`;
      case "purchasesPerYear":
        return x.toFixed(1);
    }
  };
  const labels: Record<Requirement["input"], string> = {
    signupRate: template.labels.signup,
    payingRate: template.labels.paying,
    costPerVisitor: "Cost per visitor from ads",
    price: scenario.pricing.model === "subscription" ? "Price per month" : "Price",
    monthlyChurn: `${template.customers[0]?.toUpperCase()}${template.customers.slice(1)} who cancel each month`,
    purchasesPerYear: "Purchases per customer in the first year",
  };
  const typical =
    req.input === "price"
      ? `${template.similar} charge ${formatApproxCurrency(req.typical.p10)}–${formatApproxCurrency(req.typical.p90)}`
      : `${template.similar}: ${fmt(req.typical.likely)}`;
  return {
    label: labels[req.input],
    typical,
    needed: neededText(req, fmt),
    status: STATUS_LABELS[req.status],
    ...(req.needed === null ? { detail: "not reachable by changing this alone" } : {}),
  };
}
