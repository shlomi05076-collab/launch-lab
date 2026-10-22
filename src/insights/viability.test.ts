import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { defaultModelAssumptions } from "@/data/modelDefaults";
import { exampleScenario, productTypes } from "@/data/productTypes";
import {
  assessViability,
  PRODUCT_TYPES,
  type ProductType,
  type ScenarioInput,
  simulate,
} from "@/engine";
import { glossary, glossaryFor } from "@/lib/glossary";
import {
  describeRequirement,
  FEW_CUSTOMERS,
  STATUS_LABELS,
  type ViabilityCopyContext,
  viabilityHeadline,
} from "./viability";

/**
 * Verdict language is banned from generated copy (CLAUDE.md, "Viability, never a verdict").
 * The answer explains what would have to be true; it never says an idea will work or won't.
 */
const BANNED =
  /\b(viable|viability|succeed\w*|success\w*|fail\w*|guarantee\w*|verdict|should invest|safe bet|sure thing|can't lose|will work|won't work|good news|easy|only needs?)\b/i;

const RUNS = 400;

function context(type: ProductType, overrides: Partial<ScenarioInput> = {}): ViabilityCopyContext {
  const template = productTypes[type];
  const scenario = { ...exampleScenario(type), ...overrides };
  const assumptions = defaultModelAssumptions(template.audience);
  return {
    scenario,
    template,
    result: simulate(scenario, assumptions, { runs: RUNS }),
    viability: assessViability(scenario, assumptions, {
      typicalPrice: template.pricing.price.value,
    }),
  };
}

const words = (s: string) => s.trim().split(/\s+/).length;

describe("viability headline", () => {
  it.each(PRODUCT_TYPES.map((t) => [t]))("%s: conditional, short and free of verdicts", (type) => {
    const ctx = context(type);
    const headline = viabilityHeadline(ctx);
    expect(headline).not.toMatch(BANNED);
    expect(words(headline)).toBeLessThanOrEqual(45);
    expect(headline).toMatch(/you'd|would|if /);
    expect(headline.startsWith("With $5,000 over 2 months")).toBe(true);
  });

  it("says when there are too few customers to tell much", () => {
    const ctx = context("b2b_software", { totalBudget: 300 });
    expect(ctx.result.stages.paying.p50).toBeLessThan(FEW_CUSTOMERS);
    expect(viabilityHeadline(ctx)).toMatch(/too few to tell much/);
  });

  it("states what one client earns back when a single client covers the spend", () => {
    const ctx = context("service");
    expect(ctx.viability.aboveBreakEven).toBe(true);
    expect(viabilityHeadline(ctx)).toMatch(
      /a single client would earn the spend back within a year, if results match similar service businesses\.$/,
    );
  });

  it("names the number needed and what would have to be true when short of break-even", () => {
    const ctx = context("online_store");
    expect(ctx.viability.aboveBreakEven).toBe(false);
    const headline = viabilityHeadline(ctx);
    expect(headline).toMatch(/To earn that back within a year you'd need about \d+ customers/);
    expect(headline).toMatch(/1 in \d+ visitors would have to add something to their cart/);
  });

  it("stays verdict-free and under 45 words for random budgets, prices and windows", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PRODUCT_TYPES),
        fc.integer({ min: 200, max: 200_000 }),
        fc.double({ min: 0.3, max: 4, noNaN: true }),
        fc.integer({ min: 2, max: 26 }),
        (type, budget, priceFactor, weeks) => {
          const base = exampleScenario(type);
          const ctx = context(type, {
            totalBudget: budget,
            pricing: { ...base.pricing, price: base.pricing.price * priceFactor },
            window: { startMonth: 6, weeks },
          });
          const headline = viabilityHeadline(ctx);
          expect(headline).not.toMatch(BANNED);
          expect(words(headline)).toBeLessThanOrEqual(45);
          for (const r of ctx.viability.requirements) {
            const copy = describeRequirement(r, ctx.template, ctx.scenario);
            expect(Object.values(copy).join(" ")).not.toMatch(BANNED);
          }
        },
      ),
      { numRuns: 40 },
    );
  });
});

describe("requirement rows", () => {
  it("use only the three approved status labels", () => {
    expect(Object.values(STATUS_LABELS)).toEqual([
      "Typical",
      "Needs above-typical results",
      "Rarely seen",
    ]);
  });

  it("describe each requirement in plain words with 1-in-N rates", () => {
    const ctx = context("consumer_app");
    const rows = ctx.viability.requirements.map((r) =>
      describeRequirement(r, ctx.template, ctx.scenario),
    );
    const signup = rows.find((r) => r.label === "Visitors who install the app");
    expect(signup?.typical).toBe("similar apps: 1 in 7");
    const price = rows.find((r) => r.label === "Price per month");
    expect(price?.typical).toMatch(/^similar apps charge \$\d/);
    expect(price?.needed).toMatch(/a month$/);
  });

  it("explain when a single change can't get there", () => {
    const ctx = context("consumer_app");
    const unreachable = ctx.viability.requirements.find((r) => r.needed === null);
    expect(unreachable).toBeDefined();
    const copy = describeRequirement(
      unreachable as NonNullable<typeof unreachable>,
      ctx.template,
      ctx.scenario,
    );
    expect(copy.status).toBe("Rarely seen");
    expect(copy.detail).toBe("not reachable by changing this alone");
  });
});

describe("glossary", () => {
  it("keeps every explanation to one jargon-free line", () => {
    for (const entry of glossary) {
      expect(entry.explanation.length).toBeLessThanOrEqual(110);
      expect(entry.explanation).not.toMatch(BANNED);
    }
  });

  it("finds only the terms a page actually uses", () => {
    const found = glossaryFor("Your CAC would be $40.", "Churn of 1 in 10 a month.");
    expect(found.map((e) => e.term)).toEqual(["CAC", "Churn"]);
    expect(glossaryFor("No jargon here.")).toEqual([]);
  });
});

describe("every 'what would have to be true' clause", () => {
  const base = context("b2b_software");
  const inputs = [
    "signupRate",
    "payingRate",
    "costPerVisitor",
    "price",
    "monthlyChurn",
    "purchasesPerYear",
  ] as const;

  it.each(
    inputs.flatMap(
      (input) =>
        [
          [input, 0.05],
          [input, null],
        ] as const,
    ),
  )("%s with needed = %s reads as a conditional, verdict-free sentence", (input, needed) => {
    const req = {
      input,
      betterWhen: input === "costPerVisitor" || input === "monthlyChurn" ? "lower" : "higher",
      typical: { p10: 0.02, likely: 0.04, p90: 0.08 },
      current: 0.04,
      needed,
      status: "rare",
    } as const;
    const ctx: ViabilityCopyContext = {
      ...base,
      viability: {
        ...base.viability,
        aboveBreakEven: false,
        mattersMost: input,
        requirements: [req],
      },
    };
    const headline = viabilityHeadline(ctx);
    expect(headline).not.toMatch(BANNED);
    expect(headline).toMatch(needed === null ? /couldn't close that gap on its own\.$/ : /usually/);
    const copy = describeRequirement(req, ctx.template, ctx.scenario);
    expect(copy.needed).toMatch(needed === null ? /not reachable/ : /^needed: at (least|most) /);
  });

  it("falls back to a general clause when nothing maps to a requirement", () => {
    const ctx: ViabilityCopyContext = {
      ...base,
      viability: { ...base.viability, aboveBreakEven: false, mattersMost: null },
    };
    expect(viabilityHeadline(ctx)).toMatch(/would have to beat what similar software tools/);
  });
});
