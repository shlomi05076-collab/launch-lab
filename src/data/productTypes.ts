import type { ChannelId, ProductType, Range, ScenarioInput } from "@/engine";
import type { Assumption } from "./assumption";
import type { Audience } from "./channelBenchmarks";
import { audienceBands, exampleBudget, promotionWeeks } from "./guidedDefaults";
import {
  activationRate as b2bActivation,
  monthlyChurn as b2bChurn,
  paidConversion as b2bPaid,
  signupRate as b2bSignup,
} from "./modelDefaults";

/**
 * Product-type templates: the sourced defaults behind every "not sure" answer in the guided flow.
 * Sources and reasoning for each value: docs/model.md ("Product types").
 */
export type ProductTypeTemplate = {
  id: ProductType;
  audience: Audience;
  /** As shown in question 1 of the guided flow. */
  choice: string;
  /** "similar apps", used in copy: "similar apps usually get 1 in 40". */
  similar: string;
  /** What a paying customer is called: "customers" or "clients". */
  customers: string;
  /** Row labels for "what would have to be true". */
  labels: { signup: string; paying: string };
  /** Plain-language funnel steps, e.g. "install the app" (never "convert"). */
  steps: {
    /** Visitor → sign-up stage, as a verb phrase after "would have to …". */
    signup: string;
    /** The people at the sign-up stage, e.g. "people who install it". */
    signedUp: string;
    /** Sign-up → paying, as a verb phrase. */
    paying: string;
  };
  pricing: {
    model: "subscription" | "one_time";
    /** What similar products charge (per month for subscriptions, per purchase otherwise). */
    price: Assumption<Range>;
    grossMargin: Assumption<number>;
    monthlyChurn?: Assumption<Range>;
    purchasesPerYear?: Assumption<Range>;
  };
  funnel: {
    signupRate: Assumption<Range>;
    activationRate: Assumption<Range>;
    paidConversion: Assumption<Range>;
  };
  starterChannels: Assumption<ChannelId[]>;
};

const JUDGMENT = "Launch Lab judgment";
const DECIDED = "2026-10";

export const productTypes: Record<ProductType, ProductTypeTemplate> = {
  b2b_software: {
    id: "b2b_software",
    customers: "customers",
    labels: {
      signup: "Visitors who sign up for a trial",
      paying: "Trial sign-ups who end up paying",
    },
    audience: "business",
    choice: "Software that businesses pay for",
    similar: "similar software tools",
    steps: {
      signup: "sign up for a trial",
      signedUp: "people who sign up",
      paying: "end up paying",
    },
    pricing: {
      model: "subscription",
      price: {
        id: "b2b_software.price",
        label: "B2B software: monthly price",
        value: { low: 9, likely: 24, high: 60 },
        source:
          "Monetizely 2025 SaaS pricing study (SMB starter plans: median $15 per user, $9–$29); Dupple index of 294 tools (median entry plan $24/month)",
        sourceUrl:
          "https://www.getmonetizely.com/articles/saas-pricing-benchmark-study-2025-key-insights-from-100-companies-analyzed",
        asOf: "2025",
        why: "Entry plans cluster at $15–$24 a month; a small team on a few seats pays up to ~$60.",
        confidence: "medium",
      },
      grossMargin: {
        id: "b2b_software.grossMargin",
        label: "B2B software: gross margin",
        value: 0.75,
        source: "SaaSRise 2026 (B2B median 75%); Aleph × Benchmarkit 2025 (software median 80%)",
        sourceUrl: "https://www.getaleph.com/answers/saas-gross-margin-2026",
        asOf: "2025",
        why: "B2B SaaS medians sit at 75%–80%; 75% allows for support and hosting at small scale.",
        confidence: "medium",
      },
      monthlyChurn: b2bChurn,
    },
    funnel: { signupRate: b2bSignup, activationRate: b2bActivation, paidConversion: b2bPaid },
    starterChannels: {
      id: "b2b_software.starterChannels",
      label: "B2B software: starting channel mix",
      value: ["paid_search", "linkedin_ads", "content_seo"],
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Business buyers search for tools and can be targeted by role; content compounds.",
      confidence: "low",
    },
  },

  consumer_app: {
    id: "consumer_app",
    customers: "customers",
    labels: {
      signup: "Visitors who install the app",
      paying: "Installs that turn into paying subscribers",
    },
    audience: "people",
    choice: "An app people pay for monthly",
    similar: "similar apps",
    steps: {
      signup: "install the app",
      signedUp: "people who install it",
      paying: "start a trial and keep paying",
    },
    pricing: {
      model: "subscription",
      price: {
        id: "consumer_app.price",
        label: "Consumer app: monthly price",
        value: { low: 3, likely: 7, high: 13 },
        source:
          "RevenueCat State of Subscription Apps 2025 via Airbridge (median monthly $6.68; P25 $3.26, P75 $11.99); Adapty 2026 (median $12.99)",
        sourceUrl:
          "https://www.airbridge.io/en/blog/subscription-app-pricing-by-category-2026-benchmark",
        asOf: "2025",
        why: "The median monthly plan is about $7; $13 matches the higher Adapty median.",
        confidence: "medium",
      },
      grossMargin: {
        id: "consumer_app.grossMargin",
        label: "Consumer app: gross margin",
        value: 0.7,
        source: "Apple App Store Small Business Program (15% commission under $1M a year)",
        sourceUrl: "https://developer.apple.com/app-store/small-business-program/",
        asOf: "2025",
        why: "Store fees take 15% for small developers; after hosting and support about 70% remains.",
        confidence: "medium",
      },
      monthlyChurn: {
        id: "consumer_app.monthlyChurn",
        label: "Consumer app: monthly churn",
        value: { low: 0.05, likely: 0.1, high: 0.18 },
        source:
          "RevenueCat State of Subscription Apps 2025 via SaaStr (~72% of annual plans cancelled in year one)",
        sourceUrl:
          "https://www.saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps/",
        asOf: "2025",
        why: "Losing 72% in a year is about 10% a month (1 − 0.28^(1/12)); monthly plans churn faster still.",
        confidence: "low",
      },
    },
    funnel: {
      signupRate: {
        id: "consumer_app.signupRate",
        label: "Consumer app: visitor → install",
        value: { low: 0.05, likely: 0.15, high: 0.3 },
        source:
          "AppTweak 2025 US benchmarks (store page view → download: App Store 8.56%, Google Play 16.15%)",
        sourceUrl:
          "https://www.apptweak.com/aso-blog/mobile-app-store-conversion-rate-benchmarks-per-category",
        asOf: "2025",
        why: "Ad visitors land on the store page; 9%–16% install, and ad traffic is pre-qualified, so 15%.",
        confidence: "medium",
      },
      activationRate: {
        id: "consumer_app.activationRate",
        label: "Consumer app: install → start trial",
        value: { low: 0.03, likely: 0.06, high: 0.12 },
        source: "Adapty via Airbridge (median install-to-trial 6.2%)",
        sourceUrl:
          "https://www.airbridge.io/en/blog/why-subscription-app-get-installs-no-paid-subscribers",
        asOf: "2025",
        why: "About 6 in 100 installers start a trial in the median app.",
        confidence: "low",
      },
      paidConversion: {
        id: "consumer_app.paidConversion",
        label: "Consumer app: trial → paying",
        value: { low: 0.2, likely: 0.35, high: 0.5 },
        source:
          "RevenueCat State of Subscription Apps 2025 via SaaStr (trial-to-paid 25.5% for ≤4-day trials, 42.5% for 17–32-day)",
        sourceUrl:
          "https://www.saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps/",
        asOf: "2025",
        why: "Between short and long trials; 6% × 35% ≈ 2.1% of installs pay, near the 1.9% median.",
        confidence: "medium",
      },
    },
    starterChannels: {
      id: "consumer_app.starterChannels",
      label: "Consumer app: starting channel mix",
      value: ["paid_social", "influencer"],
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Consumer apps are mostly discovered in feeds and through creators.",
      confidence: "low",
    },
  },

  online_store: {
    id: "online_store",
    customers: "customers",
    labels: {
      signup: "Visitors who add something to their cart",
      paying: "Carts that turn into orders",
    },
    audience: "people",
    choice: "Things I sell in an online store",
    similar: "similar online stores",
    steps: {
      signup: "add something to their cart",
      signedUp: "people who add something to their cart",
      paying: "complete the order",
    },
    pricing: {
      model: "one_time",
      price: {
        id: "online_store.price",
        label: "Online store: average order value",
        value: { low: 50, likely: 85, high: 185 },
        source:
          "Top Growth Marketing DTC panel (median order ~$83; middle 50% $63–$186); Flowium ($50–$150 by category)",
        sourceUrl:
          "https://topgrowthmarketing.com/dtc-ecommerce-benchmarks/average-order-value-benchmarks/",
        asOf: "2026",
        why: "Small direct-to-consumer stores see a median order of about $83.",
        confidence: "medium",
      },
      grossMargin: {
        id: "online_store.grossMargin",
        label: "Online store: gross margin",
        value: 0.45,
        source:
          "Eightx analysis of public DTC brands (~43.7% average gross margin under $500M revenue)",
        sourceUrl: "https://eightx.co/blog/average-ecommerce-gross-margin-by-revenue-band-2026",
        asOf: "2026",
        why: "Product, packaging and fulfilment take over half of each order; 45% remains.",
        confidence: "medium",
      },
      purchasesPerYear: {
        id: "online_store.purchasesPerYear",
        label: "Online store: purchases per customer in the first year",
        value: { low: 1.1, likely: 1.3, high: 1.7 },
        source:
          "Rivo and Yotpo repeat-purchase benchmarks (~28% average repeat rate; 9.9% luxury to 65% grocery)",
        sourceUrl: "https://rivo.io/blog/repeat-purchase-rate-complete-guide",
        asOf: "2025",
        why: "About 27% buy again and some of them a third time, so ~1.3 orders in year one.",
        confidence: "low",
      },
    },
    funnel: {
      signupRate: {
        id: "online_store.signupRate",
        label: "Online store: visitor → add to cart",
        value: { low: 0.025, likely: 0.05, high: 0.096 },
        source:
          "Littledata Shopify benchmarks (add-to-cart 4.6% average, top 10% 9.6%); Dynamic Yield (6.08%)",
        sourceUrl: "https://www.nudgify.com/shopify-conversion-rate-benchmarks/",
        asOf: "2025",
        why: "About 1 in 20 store visitors add something to their cart.",
        confidence: "medium",
      },
      activationRate: {
        id: "online_store.activationRate",
        label: "Online store: cart → start checkout",
        value: { low: 0.5, likely: 0.7, high: 0.85 },
        source:
          "Derived from Littledata and Shogun: overall conversion 1.4%–1.7% ÷ add-to-cart ~5% ÷ checkout completion 45%",
        sourceUrl:
          "https://blendcommerce.com/blogs/shopify/ecommerce-conversion-rate-benchmarks-2025",
        asOf: "2025",
        why: "No direct benchmark; it's the share that makes the other published rates add up.",
        confidence: "low",
      },
      paidConversion: {
        id: "online_store.paidConversion",
        label: "Online store: checkout → order",
        value: { low: 0.35, likely: 0.45, high: 0.66 },
        source:
          "Littledata Shopify (checkout completion 45% average, top 10% 66%); Top Growth Marketing (65% median)",
        sourceUrl: "https://www.nudgify.com/shopify-conversion-rate-benchmarks/",
        asOf: "2025",
        why: "Fewer than half of started checkouts finish on an average store.",
        confidence: "medium",
      },
    },
    starterChannels: {
      id: "online_store.starterChannels",
      label: "Online store: starting channel mix",
      value: ["paid_social", "paid_search", "influencer"],
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Stores sell through feeds and shopping searches, with creators for discovery.",
      confidence: "low",
    },
  },

  digital_product: {
    id: "digital_product",
    customers: "customers",
    labels: { signup: "Visitors who join your email list", paying: "Email subscribers who buy" },
    audience: "people",
    choice: "A course, ebook or other digital product",
    similar: "similar digital products",
    steps: {
      signup: "join your email list",
      signedUp: "people who join your email list",
      paying: "buy",
    },
    pricing: {
      model: "one_time",
      price: {
        id: "digital_product.price",
        label: "Digital product / course: price",
        value: { low: 30, likely: 135, high: 400 },
        source:
          "CustomerHub ($100–$500 typical; mini-courses $20–$200); bmti summary of 132,000+ courses ($137 average)",
        sourceUrl: "https://customerhub.com/post/average-price-for-online-courses",
        asOf: "2025",
        why: "Course prices center near $137; ebooks and mini-courses sit lower.",
        confidence: "low",
      },
      grossMargin: {
        id: "digital_product.grossMargin",
        label: "Digital product / course: gross margin",
        value: 0.88,
        source: "Launch Lab estimate from course-platform and payment fees (≈ 5%–10% plus ~3%)",
        asOf: DECIDED,
        why: "Selling another copy costs almost nothing beyond platform and payment fees.",
        confidence: "low",
      },
      purchasesPerYear: {
        id: "digital_product.purchasesPerYear",
        label: "Digital product / course: purchases per customer in the first year",
        value: { low: 1, likely: 1.15, high: 1.4 },
        source: JUDGMENT,
        asOf: DECIDED,
        why: "No benchmark found; a minority of buyers take an upsell or a second product.",
        confidence: "low",
      },
    },
    funnel: {
      signupRate: {
        id: "digital_product.signupRate",
        label: "Digital product / course: visitor → email list",
        value: { low: 0.05, likely: 0.12, high: 0.25 },
        source: "Webtonic 2026 (course opt-in pages 18.3%; education landing pages median 8.4%)",
        sourceUrl: "https://www.webtonic.io/blog/education-coaching-landing-page-statistics",
        asOf: "2026",
        why: "Paid visitors are colder than these pages' usual traffic, so likely sits below 18%.",
        confidence: "low",
      },
      activationRate: {
        id: "digital_product.activationRate",
        label: "Digital product / course: email list → sales page",
        value: { low: 0.3, likely: 0.5, high: 0.7 },
        source: JUDGMENT,
        asOf: DECIDED,
        why: "No benchmark found; roughly half of new subscribers open the launch emails.",
        confidence: "low",
      },
      paidConversion: {
        id: "digital_product.paidConversion",
        label: "Digital product / course: sales page → purchase",
        value: { low: 0.02, likely: 0.04, high: 0.1 },
        source:
          "Teachery (course sales pages convert 2%–5%, top pages 10%–15%); Webtonic (coaching 3%–5% cold)",
        sourceUrl: "https://www.teachery.co/blog/sales-page-for-online-course",
        asOf: "2025",
        why: "Course sales pages convert a few percent of their visitors.",
        confidence: "medium",
      },
    },
    starterChannels: {
      id: "digital_product.starterChannels",
      label: "Digital product / course: starting channel mix",
      value: ["paid_social", "newsletter", "content_seo"],
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Courses grow an email list from feeds, newsletters and helpful articles.",
      confidence: "low",
    },
  },

  service: {
    id: "service",
    customers: "clients",
    labels: { signup: "Visitors who get in touch", paying: "Enquiries that turn into clients" },
    audience: "business",
    choice: "A service, like design, consulting or an agency",
    similar: "similar service businesses",
    steps: {
      signup: "get in touch",
      signedUp: "people who get in touch",
      paying: "have a call and become a client",
    },
    pricing: {
      model: "subscription",
      price: {
        id: "service.price",
        label: "Service / agency: monthly retainer",
        value: { low: 1000, likely: 2500, high: 6000 },
        source:
          "Predictable Profits 2025 (small agencies' most common retainer under $5,000); BuzzStream (average $5,458, half below $5,000)",
        sourceUrl:
          "https://predictableprofits.com/2025-agency-growth-benchmark-key-metrics-from-300-7-8-figure-agencies/",
        asOf: "2025",
        why: "Most small-agency retainers are under $5,000; a new business starts lower.",
        confidence: "medium",
      },
      grossMargin: {
        id: "service.grossMargin",
        label: "Service / agency: gross margin",
        value: 0.5,
        source: JUDGMENT,
        asOf: DECIDED,
        why: "No benchmark found; the delivery team's time typically takes about half of fees.",
        confidence: "low",
      },
      monthlyChurn: {
        id: "service.monthlyChurn",
        label: "Service / agency: monthly client churn",
        value: { low: 0.015, likely: 0.03, high: 0.055 },
        source:
          "Focus Digital 2025 (18% annual churn on retainers, 42% project-based); Whitehat (PPC 49%, SEO 38%, full-service 25% a year)",
        sourceUrl: "https://focus-digital.co/?p=6135",
        asOf: "2025",
        why: "Annual client churn of 18%–49% is about 1.6%–5.5% a month; 3% sits mid-range.",
        confidence: "medium",
      },
      purchasesPerYear: {
        id: "service.purchasesPerYear",
        label: "Service / agency: projects per client in the first year (if billed per project)",
        value: { low: 1, likely: 1.4, high: 2 },
        source: JUDGMENT,
        asOf: DECIDED,
        why: "No benchmark found; some project clients come back once within a year.",
        confidence: "low",
      },
    },
    funnel: {
      signupRate: {
        id: "service.signupRate",
        label: "Service / agency: visitor → enquiry",
        value: { low: 0.01, likely: 0.03, high: 0.06 },
        source:
          "Professional-services lead forms 1%–3% and consultation pages 2%–5% (LowCode Agency, Clicksgeek); Unbounce median 6.1%",
        sourceUrl: "https://www.lowcode.agency/blog/b2b-website-conversion-benchmarks-by-industry",
        asOf: "2025",
        why: "About 1 in 30 visitors to a service site get in touch.",
        confidence: "medium",
      },
      activationRate: {
        id: "service.activationRate",
        label: "Service / agency: enquiry → sales call",
        value: { low: 0.4, likely: 0.6, high: 0.8 },
        source: JUDGMENT,
        asOf: DECIDED,
        why: "No benchmark found; many enquiries are a poor fit or never book a call.",
        confidence: "low",
      },
      paidConversion: {
        id: "service.paidConversion",
        label: "Service / agency: sales call → client",
        value: { low: 0.1, likely: 0.25, high: 0.4 },
        source: JUDGMENT,
        asOf: DECIDED,
        why: "No benchmark found; a new business without referrals closes about 1 in 4 calls.",
        confidence: "low",
      },
    },
    starterChannels: {
      id: "service.starterChannels",
      label: "Service / agency: starting channel mix",
      value: ["paid_search", "linkedin_ads", "content_seo"],
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Clients search for providers and can be reached by role; articles build trust.",
      confidence: "low",
    },
  },
};

/** Records unique to the templates (B2B software reuses the funnel.* and churn records). */
export const productTypeAssumptionRecords: Assumption<unknown>[] = Object.values(
  productTypes,
).flatMap((t) =>
  [
    t.pricing.price,
    t.pricing.grossMargin,
    t.pricing.monthlyChurn,
    t.pricing.purchasesPerYear,
    t.funnel.signupRate,
    t.funnel.activationRate,
    t.funnel.paidConversion,
    t.starterChannels,
  ].filter((r): r is Assumption<never> => r !== undefined && !/^(funnel|pricing)\./.test(r.id)),
);

/**
 * A scenario built only from a template's defaults, as if every guided answer were "not sure"
 * (example budget, middle audience band, starting channel mix split evenly).
 */
export function exampleScenario(
  type: ProductType,
  startMonth: ScenarioInput["window"]["startMonth"] = 3,
) {
  const t = productTypes[type];
  const channels = t.starterChannels.value;
  const scenario: ScenarioInput = {
    v: 1,
    productType: type,
    id: `example-${type}`,
    name: t.choice,
    seed: 1000 + Object.keys(productTypes).indexOf(type),
    audienceSize: audienceBands.value.specific,
    totalBudget: exampleBudget.value,
    pricing: {
      model: t.pricing.model,
      price: t.pricing.price.value.likely,
      grossMargin: t.pricing.grossMargin.value,
      ...(t.pricing.model === "subscription"
        ? { monthlyChurn: t.pricing.monthlyChurn?.value }
        : { purchasesPerYear: t.pricing.purchasesPerYear?.value }),
    },
    channels: channels.map((channel) => ({ channel, budgetShare: 1 / channels.length })),
    window: { startMonth, weeks: promotionWeeks.value },
    funnel: {
      signupRate: t.funnel.signupRate.value,
      activationRate: t.funnel.activationRate.value,
      paidConversion: t.funnel.paidConversion.value,
    },
  };
  return scenario;
}
