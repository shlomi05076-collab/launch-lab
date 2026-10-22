import type { ProductTypeTemplate } from "@/data/productTypes";
import {
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

/**
 * The one sentence that leads the guided results. Three variants:
 * too few customers to say much, above break-even, and short of break-even.
 */
export function viabilityHeadline(ctx: ViabilityCopyContext): string {
  const { scenario, result, viability, template } = ctx;
  const opening = `With ${formatCurrency(scenario.totalBudget)} over ${formatDuration(scenario.window.weeks)}`;
  const customers = template.customers;

  if (result.stages.paying.p50 < FEW_CUSTOMERS) {
    return `${opening} you'd likely get ${customersRange(result)} ${customers}, too few to tell much. Try a larger budget or a different way to reach people.`;
  }

  const needed =
    viability.breakEvenCustomers <= 1
      ? `a single ${customers.replace(/s$/, "")}`
      : `about ${formatApproxCount(Math.ceil(viability.breakEvenCustomers))} ${customers}`;

  if (viability.aboveBreakEven) {
    return `${opening} you'd likely get ${customersRange(result)} ${customers}; ${needed} would earn the spend back within a year, if results match ${template.similar}.`;
  }
  return `${opening} you'd likely get ${customersRange(result)} ${customers}. To earn that back within a year you'd need ${needed}${whatWouldHaveToBeTrue(ctx)}.`;
}

/** "at least …" for things that help when higher, "at most …" for costs and cancellations. */
function neededText(req: Requirement, fmt: (x: number) => string): string {
  if (req.needed === null) return "needed: not reachable";
  if (req.input === "monthlyChurn" && req.needed >= 1) return "needed: no limit within a year";
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
