import { describe, expect, it } from "vitest";
import { audienceBands, exampleBudget } from "@/data/guidedDefaults";
import { productTypes } from "@/data/productTypes";
import { analyzeIdea } from "./analyze";
import { EMPTY_ANSWERS, type IdeaAnswers, isAnswered, parseAnswers, QUESTIONS } from "./answers";
import { nextMonth, toScenario } from "./toScenario";

const NOW = new Date(2026, 9, 23); // 23 October 2026
const allNotSure: IdeaAnswers = {
  ...EMPTY_ANSWERS,
  kind: "not_sure",
  forWhom: "people",
  audience: "not_sure",
  price: "not_sure",
  budget: "not_sure",
  timing: "not_sure",
  channels: "not_sure",
};

describe("toScenario", () => {
  it("answers every 'not sure' with the product type's defaults and lists them", () => {
    const { scenario, template, defaultsUsed } = toScenario(allNotSure, NOW);
    expect(template.id).toBe("consumer_app"); // "for people" → consumer app defaults
    expect(scenario.audienceSize).toBe(audienceBands.value.specific);
    expect(scenario.pricing.price).toBe(productTypes.consumer_app.pricing.price.value.likely);
    expect(scenario.totalBudget).toBe(exampleBudget.value);
    expect(scenario.window).toEqual({ startMonth: 11, weeks: 8 });
    expect(scenario.channels.map((c) => c.channel)).toEqual(["paid_social", "influencer"]);
    expect(defaultsUsed).toHaveLength(6);
    expect(defaultsUsed.join(" ")).toMatch(/an example amount of \$5,000/);
  });

  it("uses the founder's own answers when given", () => {
    const { scenario, defaultsUsed } = toScenario(
      {
        ...EMPTY_ANSWERS,
        name: " Meal planner ",
        kind: "online_store",
        audience: "custom",
        audienceCustom: 120_000,
        price: 40,
        purchases: 2,
        budget: 2000,
        timing: { startMonth: 3, weeks: 4 },
        channels: ["paid_social", "paid_search"],
        selfPromotion: 5,
      },
      NOW,
    );
    expect(defaultsUsed).toEqual([]);
    expect(scenario).toMatchObject({
      name: "Meal planner",
      productType: "online_store",
      audienceSize: 120_000,
      totalBudget: 2000,
      pricing: { model: "one_time", price: 40, purchasesPerYear: { likely: 2 } },
      window: { startMonth: 3, weeks: 4 },
      selfPromotion: { hoursPerWeek: 5 },
    });
    expect(scenario.channels.map((c) => c.budgetShare)).toEqual([0.5, 0.5]);
  });

  it("drops the ad budget, and says so, when only self-promotion is picked", () => {
    const { scenario, notes } = toScenario(
      { ...allNotSure, budget: 3000, channels: null, selfPromotion: 6 },
      NOW,
    );
    expect(scenario.channels).toEqual([]);
    expect(scenario.totalBudget).toBe(0);
    expect(notes[0]).toMatch(/ad budget isn't used/);
  });

  it("ignores paid channels when the budget is nothing on ads", () => {
    const { scenario, notes } = toScenario(
      { ...allNotSure, budget: 0, channels: ["paid_social"], selfPromotion: 4 },
      NOW,
    );
    expect(scenario.channels).toEqual([]);
    expect(scenario.totalBudget).toBe(0);
    expect(notes).toEqual([]);
    expect(isAnswered("channels", { ...allNotSure, budget: 0, selfPromotion: null })).toBe(false);
  });

  it("keeps LinkedIn out of consumer plans and fills in a missing charging model", () => {
    const { scenario } = toScenario(
      { ...allNotSure, channels: ["linkedin_ads", "paid_social"], charge: "one_time" },
      NOW,
    );
    expect(scenario.channels.map((c) => c.channel)).toEqual(["paid_social"]);
    expect(scenario.pricing.purchasesPerYear).toEqual(
      productTypes.digital_product.pricing.purchasesPerYear?.value,
    );
  });

  it("gives the same answers the same seed, and different answers a different one", () => {
    expect(toScenario(allNotSure, NOW).scenario.seed).toBe(
      toScenario(allNotSure, NOW).scenario.seed,
    );
    expect(toScenario({ ...allNotSure, name: "x" }, NOW).scenario.seed).not.toBe(
      toScenario(allNotSure, NOW).scenario.seed,
    );
    // The horizon is a results setting, not an input: it doesn't change the simulation.
    expect(toScenario({ ...allNotSure, horizon: 36 }, NOW).scenario.seed).toBe(
      toScenario(allNotSure, NOW).scenario.seed,
    );
  });

  it("wraps next month from December to January", () => {
    expect(nextMonth(new Date(2026, 11, 5))).toBe(1);
    expect(nextMonth(NOW)).toBe(11);
  });
});

describe("answers", () => {
  it("counts 'not sure' as an answer", () => {
    for (const q of QUESTIONS) expect(isAnswered(q, allNotSure)).toBe(true);
    for (const q of QUESTIONS) expect(isAnswered(q, EMPTY_ANSWERS)).toBe(false);
  });

  it("needs the follow-up when the product type is 'not sure'", () => {
    expect(isAnswered("kind", { ...EMPTY_ANSWERS, kind: "not_sure" })).toBe(false);
  });

  it("falls back to a fresh draft when a saved one is invalid", () => {
    expect(parseAnswers({ kind: "spaceship" })).toEqual(EMPTY_ANSWERS);
    expect(parseAnswers(allNotSure)).toEqual(allNotSure);
  });
});

describe("analyzeIdea", () => {
  it("returns the simulation and viability for all three horizons", () => {
    const { scenario } = toScenario(allNotSure, NOW);
    const analysis = analyzeIdea(scenario);
    expect(analysis.result.runs).toBe(5000);
    expect(analysis.viability[12].horizonMonths).toBe(12);
    expect(analysis.viability[36].breakEvenCustomers).toBeLessThan(
      analysis.viability[12].breakEvenCustomers,
    );
  });
});
