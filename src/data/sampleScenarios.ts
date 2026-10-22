import type { ScenarioInput } from "@/engine";
import {
  activationRate,
  grossMargin,
  monthlyChurn,
  paidConversion,
  signupRate,
} from "./modelDefaults";

/**
 * Sample product: Briefly, AI meeting notes for small teams, $49 per team per month
 * (roughly what per-seat meeting-note tools cost for a team of three to five).
 * The three scenarios share budget, audience, window and funnel so that only the channel mix
 * differs. That keeps the first comparison a user sees fair and easy to read.
 */
export const sampleProduct = {
  name: "Briefly",
  description: "AI meeting notes for small teams",
} as const;

const shared = {
  v: 1,
  productType: "b2b_software",
  audienceSize: 1_000_000,
  totalBudget: 30_000,
  pricing: {
    model: "subscription",
    price: 49,
    grossMargin: grossMargin.value,
    monthlyChurn: monthlyChurn.value,
  },
  window: { startMonth: 9, weeks: 10 },
  funnel: {
    signupRate: signupRate.value,
    activationRate: activationRate.value,
    paidConversion: paidConversion.value,
  },
} as const satisfies Omit<ScenarioInput, "id" | "name" | "seed" | "channels">;

export const sampleScenarios: ScenarioInput[] = [
  {
    ...shared,
    id: "high-intent",
    name: "High-intent search",
    seed: 101,
    channels: [
      { channel: "paid_search", budgetShare: 0.5 },
      { channel: "linkedin_ads", budgetShare: 0.3 },
      { channel: "newsletter", budgetShare: 0.2 },
    ],
  },
  {
    ...shared,
    id: "social-push",
    name: "Social push",
    seed: 202,
    channels: [
      { channel: "paid_social", budgetShare: 0.6 },
      { channel: "influencer", budgetShare: 0.2 },
      { channel: "content_seo", budgetShare: 0.2 },
    ],
  },
  {
    ...shared,
    id: "balanced",
    name: "Balanced mix",
    seed: 303,
    channels: [
      { channel: "paid_social", budgetShare: 0.35 },
      { channel: "content_seo", budgetShare: 0.25 },
      { channel: "paid_search", budgetShare: 0.2 },
      { channel: "newsletter", budgetShare: 0.2 },
    ],
  },
];
