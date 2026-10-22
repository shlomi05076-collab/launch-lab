/**
 * Engine types. The engine is pure: these types are its whole contract with the app.
 * Money is whole USD, rates are 0–1 fractions, durations carry their unit in the name.
 */

/** An uncertain input, sampled as PERT(low, likely, high). low ≤ likely ≤ high. */
export type Range = { low: number; likely: number; high: number };

export const CHANNEL_IDS = [
  "paid_search",
  "paid_social",
  "linkedin_ads",
  "newsletter",
  "influencer",
  "content_seo",
] as const;
export type ChannelId = (typeof CHANNEL_IDS)[number];

/** How a channel's spend (and impact) is spread across the launch weeks. */
export type RampProfile = "flat" | "spike" | "build";

export type ChannelAssumptions = {
  /** USD per 1,000 impressions. For organic channels: production cost per 1,000. */
  costPerThousand: Range;
  /**
   * Click-through rate per impression, as ad platforms report it. A person visits at most once,
   * so repeat impressions on the same person add less and less (see funnel.ts).
   */
  clickThroughRate: Range;
  /** Multiplies the product's sign-up rate for visitors from this channel. */
  intentMultiplier: number;
  rampProfile: RampProfile;
};

/** Twelve monthly multipliers, January first. 1 = an average month. */
export type MonthlyIndex = readonly number[];

/** Everything the engine needs beyond the scenario itself. Defaults live in src/data/. */
export type ModelAssumptions = {
  channels: Record<ChannelId, ChannelAssumptions>;
  seasonality: {
    /** Multiplies cost per 1,000 impressions in that month. */
    cost: MonthlyIndex;
    /** Multiplies the sign-up rate in that month (buyer responsiveness). */
    demand: MonthlyIndex;
  };
  /** The founder's own promotion (posts, communities, word of mouth). Costs time, not money. */
  selfPromotion?: {
    /** People an hour of the founder's promotion puts the product in front of. */
    impressionsPerHour: Range;
    clickThroughRate: Range;
    intentMultiplier: number;
  };
  /**
   * Pairwise correlation (0–1) between the three product rates within one simulated launch.
   * 0 = independent; 0.5 = "moderate" shared market response.
   */
  marketCorrelation: number;
};

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const PRODUCT_TYPES = [
  "b2b_software",
  "consumer_app",
  "online_store",
  "digital_product",
  "service",
] as const;
/** Selects the defaults and the channel cost profile (business or consumer) in src/data/. */
export type ProductType = (typeof PRODUCT_TYPES)[number];

export type ScenarioInput = {
  v: 1;
  productType: ProductType;
  id: string;
  name: string;
  seed: number;
  /** People in the target market that the channels could plausibly reach. */
  audienceSize: number;
  /** USD for the whole launch window, across all channels. */
  totalBudget: number;
  pricing: {
    model: "subscription" | "one_time";
    /** USD per month (subscription) or per purchase (one_time). */
    price: number;
    /** 0–1. Share of revenue left after cost of serving the customer. */
    grossMargin: number;
    /** Share of subscribers who cancel each month. Required for subscriptions. */
    monthlyChurn?: Range;
    /**
     * One-time pricing only: purchases per customer in their first year, including the first
     * (1 = never buys again). Repeat purchases are spread evenly over the year.
     */
    purchasesPerYear?: Range;
  };
  /** 0–4 paid channels (0 only alongside self-promotion). Shares are normalised to sum to 1. */
  channels: Array<{
    channel: ChannelId;
    budgetShare: number;
    overrides?: Partial<ChannelAssumptions>;
  }>;
  window: { startMonth: Month; weeks: number };
  /** The founder promoting it themselves. Hours are never converted into money. */
  selfPromotion?: { hoursPerWeek: number };
  /** Product-level funnel rates. */
  funnel: { signupRate: Range; activationRate: Range; paidConversion: Range };
};

export const STAGES = ["reach", "visit", "signup", "activation", "paying"] as const;
export type Stage = (typeof STAGES)[number];

/** Raw percentiles of one metric across simulated launches. May contain Infinity. */
export type Dist = { p10: number; p50: number; p90: number; mean: number };

/** The labels used everywhere in the product. See outcomes.ts for the direction rule. */
export type OutcomeRange = { downside: number; likely: number; upside: number };

export type SimulationResult = {
  scenarioId: string;
  runs: number;
  seed: number;
  stages: Record<Stage, Dist>;
  dropOff: Array<{ from: Stage; to: Stage; rate: Dist; lost: Dist }>;
  byChannel: Array<{ channel: ChannelId; spend: number; paying: Dist; cac: Dist }>;
  /** One entry per launch week, cumulative. */
  weekly: Array<{ week: number; paying: Dist; revenue: Dist }>;
  /** Revenue earned inside the launch window. */
  revenue: Dist;
  /** Monthly recurring revenue at the end of the window (0 for one-time pricing). */
  mrrAtEnd: Dist;
  /** Blended: total spend ÷ paying customers. Infinity when no one pays. */
  cac: Dist;
  /** Months for one customer's gross margin to repay CAC. Infinity = never. */
  paybackMonths: Dist;
  /** Share of simulated launches whose customers earn back the spend within 12, 24, 36 months. */
  probPaybackWithin: Record<HorizonMonths, number>;
  /** Paid spend ÷ customers from paid channels only (the founder's own promotion excluded). */
  paidCac: Dist;
  /** Customers from the founder's own promotion, and the hours it took. Null without it. */
  selfPromotion: { hours: number; paying: Dist } | null;
  probNeverPayback: number;
  histogram: { metric: "paying"; bins: Array<{ x0: number; x1: number; count: number }> };
};

/** "Earn it back within": 1, 2 or 3 years. */
export const HORIZONS = [12, 24, 36] as const;
export type HorizonMonths = (typeof HORIZONS)[number];

/**
 * netReturn: gross margin the launch's customers earn within the horizon (12 months unless
 * stated), minus the marketing spend. Unlike `paying`, it moves with price, churn and repeat
 * purchases.
 */
export type SensitivityMetric = "paying" | "revenue" | "cac" | "netReturn";

export type SensitivityBar = {
  /** Stable key, e.g. "funnel.signupRate" or "channel.paid_social.costPerThousand". */
  input: string;
  label: string;
  /** The input values tested (P10 and P90 of its distribution, or ±20% for fixed inputs). */
  inputLow: number;
  inputHigh: number;
  /** The metric with the input at inputLow / inputHigh, everything else at likely. */
  metricAtLow: number;
  metricAtHigh: number;
  swing: number;
};

export type SensitivityResult = {
  metric: SensitivityMetric;
  baseline: number;
  /** Sorted by swing, largest first. bars[0] is "what matters most". */
  bars: SensitivityBar[];
};
