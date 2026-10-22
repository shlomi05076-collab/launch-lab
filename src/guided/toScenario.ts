import type { Audience } from "@/data/channelBenchmarks";
import {
  audienceBands,
  exampleBudget,
  promotionWeeks,
  selfPromotionHours,
} from "@/data/guidedDefaults";
import { type ProductTypeTemplate, productTypes } from "@/data/productTypes";
import type { ChannelId, Month, ProductType, Range, ScenarioInput } from "@/engine";
import type { IdeaAnswers } from "./answers";

export type GuidedScenario = {
  scenario: ScenarioInput;
  template: ProductTypeTemplate;
  /** Plain descriptions of the answers that used defaults ("not sure"), for the results. */
  defaultsUsed: string[];
  /** Things the user should know about how their answers were read. */
  notes: string[];
};

/** Fallbacks when the user switches a type to a charging model its template doesn't cover. */
const CHURN_FALLBACK: Record<Audience, ProductType> = {
  business: "service",
  people: "consumer_app",
};
const REPEATS_FALLBACK: Record<Audience, ProductType> = {
  business: "service",
  people: "digital_product",
};

const PURCHASES: Record<1 | 2 | 3, Range> = {
  1: { low: 1, likely: 1, high: 1 },
  2: { low: 1.8, likely: 2, high: 2.2 },
  3: { low: 2.5, likely: 3, high: 4 },
};

export function templateFor(a: IdeaAnswers): ProductTypeTemplate {
  if (a.kind && a.kind !== "not_sure") return productTypes[a.kind];
  return a.forWhom === "people" ? productTypes.consumer_app : productTypes.b2b_software;
}

/** Next calendar month after `now` (1–12). */
export function nextMonth(now: Date): Month {
  return (((now.getMonth() + 1) % 12) + 1) as Month;
}

/** A stable seed from the answers, so the same answers always give the same result. */
function seedFor(a: IdeaAnswers): number {
  const text = JSON.stringify({ ...a, horizon: 0 });
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Turns guided answers into a ScenarioInput. Every "not sure" uses the product type's sourced
 * default (or a labeled estimate where no benchmark exists) and is listed in `defaultsUsed`.
 */
export function toScenario(a: IdeaAnswers, now: Date): GuidedScenario {
  const template = templateFor(a);
  const defaultsUsed: string[] = [];
  const notes: string[] = [];
  const similar = template.similar;

  if (a.kind === "not_sure" || a.kind === null) {
    defaultsUsed.push(`what you sell (we used ${template.choice.toLowerCase()})`);
  }

  let audienceSize = audienceBands.value.specific;
  if (a.audience === "niche" || a.audience === "specific" || a.audience === "broad") {
    audienceSize = audienceBands.value[a.audience];
  } else if (a.audience === "custom" && a.audienceCustom) {
    audienceSize = a.audienceCustom;
  } else {
    defaultsUsed.push("how many people could buy it (a rough estimate)");
  }

  const model = a.charge ?? template.pricing.model;
  let price = template.pricing.price.value.likely;
  if (typeof a.price === "number") price = a.price;
  else defaultsUsed.push(`price (what ${similar} usually charge)`);

  const pricing: ScenarioInput["pricing"] = {
    model,
    price,
    grossMargin: template.pricing.grossMargin.value,
  };
  if (model === "subscription") {
    pricing.monthlyChurn = (
      template.pricing.monthlyChurn ??
      productTypes[CHURN_FALLBACK[template.audience]].pricing.monthlyChurn
    )?.value;
  } else {
    const fallback =
      template.pricing.purchasesPerYear ??
      productTypes[REPEATS_FALLBACK[template.audience]].pricing.purchasesPerYear;
    if (typeof a.purchases === "number") {
      pricing.purchasesPerYear = PURCHASES[a.purchases];
    } else {
      pricing.purchasesPerYear = fallback?.value;
      defaultsUsed.push(`how often customers buy again (what ${similar} usually see)`);
    }
  }

  let budget = exampleBudget.value;
  if (typeof a.budget === "number") budget = a.budget;
  else
    defaultsUsed.push(`marketing budget (an example amount of $${budget.toLocaleString("en-US")})`);

  let startMonth = nextMonth(now);
  let weeks = promotionWeeks.value;
  if (a.timing && a.timing !== "not_sure") {
    startMonth = a.timing.startMonth as Month;
    weeks = a.timing.weeks;
  } else {
    defaultsUsed.push("launch timing (next month, for two months)");
  }

  const allowed = (c: ChannelId) => template.audience === "business" || c !== "linkedin_ads";
  let paid: ChannelId[];
  if (budget === 0) {
    paid = [];
  } else if (Array.isArray(a.channels)) {
    paid = a.channels.filter(allowed).slice(0, 4);
  } else if (a.channels === "not_sure" || a.selfPromotion === null) {
    paid = template.starterChannels.value;
    defaultsUsed.push(`channels (a usual starting mix for ${similar})`);
  } else {
    paid = [];
  }

  let hoursPerWeek = 0;
  if (typeof a.selfPromotion === "number") hoursPerWeek = a.selfPromotion;
  else if (a.selfPromotion === "not_sure") {
    hoursPerWeek = selfPromotionHours.value;
    defaultsUsed.push(`hours of your own promotion (an example of ${hoursPerWeek} a week)`);
  }

  if (paid.length === 0 && budget > 0) {
    notes.push("Your ad budget isn't used, because you didn't pick any paid channels.");
    budget = 0;
  }

  const scenario: ScenarioInput = {
    v: 1,
    productType: template.id,
    id: "idea",
    name: a.name.trim() || "your idea",
    seed: seedFor(a),
    audienceSize,
    totalBudget: budget,
    pricing,
    channels: paid.map((channel) => ({ channel, budgetShare: 1 / paid.length })),
    window: { startMonth, weeks },
    funnel: {
      signupRate: template.funnel.signupRate.value,
      activationRate: template.funnel.activationRate.value,
      paidConversion: template.funnel.paidConversion.value,
    },
    ...(hoursPerWeek > 0 ? { selfPromotion: { hoursPerWeek } } : {}),
  };
  return { scenario, template, defaultsUsed, notes };
}
