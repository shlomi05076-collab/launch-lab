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
  chanceByHorizon,
  describeRequirement,
  FEW_CUSTOMERS,
  horizonNote,
  horizonPhrase,
  LOW_CHANCE,
  STATUS_LABELS,
  sourcesSplit,
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
  // A moderate chance, so the headline names the requirement instead of the low-chance variant.
  const b2b = context("b2b_software");
  const base = {
    ...b2b,
    result: { ...b2b.result, probPaybackWithin: { 12: 0.4, 24: 0.6, 36: 0.7 } },
  };
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

describe("headline variants added in M3", () => {
  it("points to a way forward when the chance is low, without a verdict", () => {
    const ctx = context("consumer_app");
    expect(ctx.result.probPaybackWithin[12]).toBeLessThan(LOW_CHANCE);
    const headline = viabilityHeadline(ctx);
    expect(headline).toMatch(/paid ads alone probably won't earn back the spend within a year\./);
    expect(headline).toMatch(
      /Below: what would have to change, and how to test the riskiest part cheaply\.$/,
    );
    expect(headline).not.toMatch(BANNED);
  });

  it("names the horizon the user picked", () => {
    const template = productTypes.service;
    const scenario = exampleScenario("service");
    const assumptions = defaultModelAssumptions(template.audience);
    const ctx: ViabilityCopyContext = {
      scenario,
      template,
      result: simulate(scenario, assumptions, { runs: RUNS }),
      viability: assessViability(scenario, assumptions, { horizonMonths: 24 }),
    };
    expect(viabilityHeadline(ctx)).toMatch(/earn the spend back within 2 years/);
    expect(horizonPhrase(12)).toBe("within a year");
    expect(horizonPhrase(36)).toBe("within 3 years");
  });

  it("covers launches promoted only by the founder, with no ad spend", () => {
    const base = exampleScenario("online_store");
    const ctx = context("online_store", {
      totalBudget: 0,
      channels: [],
      selfPromotion: { hoursPerWeek: 10 },
      window: { ...base.window, weeks: 13 },
    });
    const headline = viabilityHeadline(ctx);
    expect(headline).toMatch(
      /^Promoting it yourself for 10 hours a week over 3 months, you'd likely get/,
    );
    expect(headline).not.toMatch(BANNED);
    expect(sourcesSplit(ctx.scenario, ctx.result, ctx.template)).toMatch(
      /^From your own promotion: about \d+ customers, for about 130 hours of your time and no money\.$/,
    );
  });

  it("keeps customers from ads and from your own promotion apart", () => {
    const ctx = context("online_store", { selfPromotion: { hoursPerWeek: 5 } });
    expect(viabilityHeadline(ctx)).toMatch(/^With \$5,000 over 2 months and your own promotion/);
    expect(sourcesSplit(ctx.scenario, ctx.result, ctx.template)).toMatch(
      /^From ads: about \d+ customers\. From your own promotion: about \d+, for about 40 hours/,
    );
    expect(
      sourcesSplit(
        context("online_store").scenario,
        context("online_store").result,
        productTypes.online_store,
      ),
    ).toBeNull();
  });

  it("lists the chance for each horizon and explains why longer ones matter", () => {
    const ctx = context("b2b_software");
    expect(chanceByHorizon(ctx.result)).toMatch(
      /^Within 1 year: \d+% · within 2 years: \d+% · within 3 years: \d+%$/,
    );
    expect(horizonNote(ctx.scenario, 16)).toMatch(/often take 1–2 years.*about 16 months\.$/);
    expect(horizonNote(exampleScenario("online_store"), 16)).toMatch(/first-year pace\.$/);
  });
});

describe("walkthrough fixes (M3)", () => {
  it("doesn't repeat 'your own promotion' when the chance is low", () => {
    const ctx = context("consumer_app", { selfPromotion: { hoursPerWeek: 4 } });
    const headline = viabilityHeadline(ctx);
    expect(headline).toMatch(
      /and your own promotion, you'd likely get .+, but that probably won't earn back the ad spend within a year\./,
    );
    expect(headline.match(/your own promotion/g)).toHaveLength(1);
  });

  it("quotes the business-software payback median only for business products", () => {
    const app = exampleScenario("consumer_app");
    expect(horizonNote(app, 16, "people")).not.toMatch(/business software/);
    expect(horizonNote(app, 16, "business")).toMatch(
      /business software company takes about 16 months/,
    );
  });
});
