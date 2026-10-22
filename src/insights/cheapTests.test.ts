import { describe, expect, it } from "vitest";
import { defaultModelAssumptions } from "@/data/modelDefaults";
import { exampleScenario, productTypes } from "@/data/productTypes";
import {
  assessViability,
  PRODUCT_TYPES,
  type ProductType,
  type RequirementInput,
  type ScenarioInput,
} from "@/engine";
import { type CheapTestContext, cheapTest, testBudget } from "./cheapTests";

const BANNED =
  /\b(viable|viability|succeed\w*|success\w*|fail\w*|guarantee\w*|verdict|your idea works)\b/i;

function ctx(type: ProductType, overrides: Partial<ScenarioInput> = {}): CheapTestContext {
  const template = productTypes[type];
  const scenario = { ...exampleScenario(type), name: "Meal planner", ...overrides };
  const assumptions = defaultModelAssumptions(template.audience);
  return {
    scenario,
    template,
    assumptions,
    viability: assessViability(scenario, assumptions, {
      typicalPrice: template.pricing.price.value,
    }),
  };
}

/** The same context, with "matters most" forced to a given requirement. */
function forcing(base: CheapTestContext, ...ranking: RequirementInput[]): CheapTestContext {
  return { ...base, viability: { ...base.viability, ranking, mattersMost: ranking[0] ?? null } };
}

describe("testBudget", () => {
  it("is at most 10% of the plan, in friendly steps", () => {
    expect(testBudget(5000)).toBe(500);
    expect(testBudget(4321)).toBe(400);
    expect(testBudget(300)).toBe(30);
    expect(testBudget(0)).toBe(0);
  });
});

describe("cheapTest", () => {
  it.each(PRODUCT_TYPES.map((t) => [t]))("%s: concrete, cheap and never a verdict", (type) => {
    const c = ctx(type);
    const test = cheapTest(c);
    expect(test).not.toBeNull();
    if (!test) return;
    expect(test.budget).toBeLessThanOrEqual(c.scenario.totalBudget * 0.1);
    expect(test.passMark).toMatch(/this assumption holds up\.$/);
    expect([test.steps, test.passMark, ...test.notes].join(" ")).not.toMatch(BANNED);
  });

  it("builds a landing-page test with a pass mark from the break-even sign-up rate", () => {
    const base = ctx("online_store");
    const test = cheapTest(forcing(base, "signupRate"));
    const needed = base.viability.requirements.find((r) => r.input === "signupRate")?.needed;
    expect(test?.title).toBe("Landing-page test");
    expect(test?.passMark).toContain(`1 in ${Math.round(1 / (needed as number))} visitors`);
    expect(test?.steps).toMatch(/Spend \$500 on .+ \(about [\d,]+ visitors\)\./);
  });

  it("builds a pre-sale test for sign-ups who end up paying", () => {
    const test = cheapTest(forcing(ctx("digital_product"), "payingRate"));
    expect(test?.title).toBe("Pre-sale test");
    expect(test?.passMark).toMatch(/^If at least 1 in \d+ of them pay or put down a deposit/);
  });

  it("builds a price test at the needed price", () => {
    const base = ctx("online_store");
    const test = cheapTest(forcing(base, "price"));
    const needed = base.viability.requirements.find((r) => r.input === "price")?.needed as number;
    expect(test?.title).toBe("Price test");
    expect(test?.steps).toContain(`Get it for $${Math.round(needed)}`);
  });

  it("builds an ad test with a cost-per-click pass mark", () => {
    const test = cheapTest(forcing(ctx("b2b_software"), "costPerVisitor"));
    expect(test?.title).toBe("Ad test");
    expect(test?.passMark).toMatch(/^If you pay \$[\d.]+ or less per click on average/);
  });

  it("skips cancellations, which can't be tested before launch, and says why", () => {
    const test = cheapTest(forcing(ctx("b2b_software"), "monthlyChurn", "signupRate"));
    expect(test?.assumption).toBe("signupRate");
    expect(test?.notes[0]).toMatch(/^Cancellations only show up after launch/);
  });

  it("warns when 10% of the budget buys too few visitors for a clear answer", () => {
    const test = cheapTest(forcing(ctx("b2b_software", { totalBudget: 1000 }), "signupRate"));
    expect(test?.notes.join(" ")).toMatch(/enough for a rough signal only/);
  });

  it("uses the founder's own network when there's no ad budget", () => {
    const base = ctx("online_store");
    const noBudget = { ...base, scenario: { ...base.scenario, totalBudget: 0 } };
    const test = cheapTest(forcing(noBudget, "signupRate"));
    expect(test?.budget).toBe(0);
    expect(test?.steps).toMatch(/Share it in communities you're part of/);
  });

  it("frames the test as a check when the plan is already above break-even", () => {
    const test = cheapTest(ctx("service"));
    expect(test?.notes.join(" ")).toMatch(/before you spend the full budget/);
  });
});

describe("cheapTest walkthrough fixes (M3)", () => {
  it("says why it skipped an assumption that couldn't close the gap on its own", () => {
    const base = ctx("consumer_app");
    const signup = base.viability.requirements.find((r) => r.input === "signupRate");
    expect(signup?.needed).toBeNull();
    const test = cheapTest(forcing(base, "signupRate", "payingRate"));
    expect(test?.assumption).toBe("payingRate");
    expect(test?.notes[0]).toBe(
      "Visitors who install the app couldn't close the gap on its own, so start with the next assumption that matters most.",
    );
    expect(test?.steps).toMatch(/^Offer people who join your waitlist/);
  });
});
