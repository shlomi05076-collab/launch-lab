import type { ChannelAssumptions, ChannelId, RampProfile, Range } from "@/engine";
import type { Assumption } from "./assumption";

/**
 * Default channel assumptions. Sources and the reasoning behind each value: docs/model.md
 * ("Channel assumptions"). All costs are USD per 1,000 impressions; rates are fractions.
 */
type ChannelRecords = {
  costPerThousand: Assumption<Range>;
  clickThroughRate: Assumption<Range>;
  intentMultiplier: Assumption<number>;
  rampProfile: Assumption<RampProfile>;
};

const JUDGMENT = "Launch Lab judgment";
const DECIDED = "2026-10";

export const channelBenchmarks: Record<ChannelId, ChannelRecords> = {
  paid_search: {
    costPerThousand: {
      id: "paid_search.costPerThousand",
      label: "Paid search: cost per 1,000 impressions",
      value: { low: 200, likely: 350, high: 600 },
      source: "LocaliQ / WordStream Search Advertising Benchmarks 2025",
      sourceUrl: "https://localiq.com/blog/search-advertising-benchmarks/",
      asOf: "2025-06",
      why: "Search is bought per click, so CPM = CPC × CTR × 1,000 = $5.26 × 6.66% × 1,000 ≈ $350.",
      confidence: "medium",
    },
    clickThroughRate: {
      id: "paid_search.clickThroughRate",
      label: "Paid search: click-through rate",
      value: { low: 0.04, likely: 0.065, high: 0.1 },
      source: "LocaliQ / WordStream Search Advertising Benchmarks 2025",
      sourceUrl: "https://localiq.com/blog/search-advertising-benchmarks/",
      asOf: "2025-06",
      why: "Average search CTR is 6.66%; it is measured per impression, exactly as the model uses it.",
      confidence: "medium",
    },
    intentMultiplier: {
      id: "paid_search.intentMultiplier",
      label: "Paid search: intent multiplier",
      value: 1.5,
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Searchers are already looking for the category, so they sign up more readily than average.",
      confidence: "low",
    },
    rampProfile: {
      id: "paid_search.rampProfile",
      label: "Paid search: ramp",
      value: "flat",
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Search budgets are paced evenly by daily caps.",
      confidence: "medium",
    },
  },

  paid_social: {
    costPerThousand: {
      id: "paid_social.costPerThousand",
      label: "Paid social (Meta): cost per 1,000 impressions",
      value: { low: 6, likely: 10, high: 15 },
      source: "Vaizle 2025 ($5.97), QualityUnit 2025 ($8.19), Triple Whale FY2025 ($14.19)",
      sourceUrl: "https://triplewhale.com/blog/facebook-ads-benchmarks",
      asOf: "2025-12",
      why: "Sources span $6–$14; $10 sits between the large-sample figures, nudged up for B2B targeting.",
      confidence: "medium",
    },
    clickThroughRate: {
      id: "paid_social.clickThroughRate",
      label: "Paid social (Meta): click-through rate",
      value: { low: 0.006, likely: 0.012, high: 0.025 },
      source: "Triple Whale FY2025 (2.19% CTR), Vaizle 2025 (2.46%; quartiles 1.09%–3.06%)",
      sourceUrl: "https://insights.vaizle.com/facebook-ad-benchmarks/",
      asOf: "2025-12",
      why: "Reported CTRs come mostly from consumer brands; B2B software link clicks run about half that.",
      confidence: "low",
    },
    intentMultiplier: {
      id: "paid_social.intentMultiplier",
      label: "Paid social: intent multiplier",
      value: 0.8,
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Feed viewers were interrupted, not searching, so fewer of them sign up.",
      confidence: "low",
    },
    rampProfile: {
      id: "paid_social.rampProfile",
      label: "Paid social: ramp",
      value: "flat",
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Campaign budgets are paced evenly.",
      confidence: "medium",
    },
  },

  linkedin_ads: {
    costPerThousand: {
      id: "linkedin_ads.costPerThousand",
      label: "LinkedIn ads: cost per 1,000 impressions",
      value: { low: 20, likely: 35, high: 80 },
      source: "NAV43 2025 (median $31 for awareness); planning ranges of $10–$90 in other guides",
      sourceUrl:
        "https://nav43.com/blog/2025-linkedin-ads-benchmarks-every-saas-tech-marketer-needs",
      asOf: "2025",
      why: "Job-title targeting costs a premium; likely sits just above the $31 awareness median.",
      confidence: "low",
    },
    clickThroughRate: {
      id: "linkedin_ads.clickThroughRate",
      label: "LinkedIn ads: click-through rate",
      value: { low: 0.0035, likely: 0.005, high: 0.008 },
      source: "Sales-Mind 2025 (single image 0.56%, carousel 0.40%); WebFX (0.44%–0.65%)",
      sourceUrl: "https://sales-mind.ai/blog/2025-sales-funnel-benchmarks-linkedin",
      asOf: "2025",
      why: "Sponsored content CTR clusters at 0.4%–0.65% across formats; likely is the middle.",
      confidence: "medium",
    },
    intentMultiplier: {
      id: "linkedin_ads.intentMultiplier",
      label: "LinkedIn ads: intent multiplier",
      value: 1.2,
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Professional context and role targeting make clicks more qualified than general social.",
      confidence: "low",
    },
    rampProfile: {
      id: "linkedin_ads.rampProfile",
      label: "LinkedIn ads: ramp",
      value: "flat",
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Campaign budgets are paced evenly.",
      confidence: "medium",
    },
  },

  newsletter: {
    costPerThousand: {
      id: "newsletter.costPerThousand",
      label: "Newsletter sponsorships: cost per 1,000 subscribers",
      value: { low: 25, likely: 60, high: 120 },
      source: "Dupple B2B newsletter CPM benchmarks ($60–$120); Paved cross-industry median ($32)",
      sourceUrl: "https://dupple.com/learn/cpm-benchmarks-b2b-newsletters",
      asOf: "2026",
      why: "B2B tech primary slots price at $60–$120; smaller niche lists start near $25.",
      confidence: "medium",
    },
    clickThroughRate: {
      id: "newsletter.clickThroughRate",
      label: "Newsletter sponsorships: click-through rate",
      value: { low: 0.005, likely: 0.015, high: 0.03 },
      source: "Dupple (primary placements 1%–2%); LiveIntent via Voxbooster (2.14%)",
      sourceUrl: "https://dupple.com/learn/newsletter-cpm-explained",
      asOf: "2026",
      why: "Clicks per delivered email for a primary placement average 1%–2%.",
      confidence: "medium",
    },
    intentMultiplier: {
      id: "newsletter.intentMultiplier",
      label: "Newsletter sponsorships: intent multiplier",
      value: 1.1,
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Readers chose the newsletter's topic, so a relevant sponsor reaches a warmer audience.",
      confidence: "low",
    },
    rampProfile: {
      id: "newsletter.rampProfile",
      label: "Newsletter sponsorships: ramp",
      value: "flat",
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Sponsorships are usually booked as a series of weekly sends.",
      confidence: "medium",
    },
  },

  influencer: {
    costPerThousand: {
      id: "influencer.costPerThousand",
      label: "Creators / influencers: cost per 1,000 views",
      value: { low: 10, likely: 25, high: 50 },
      source:
        "IQfluence 2026 ($10–$50 practical range); 2025 report: YouTube $13–$15, Instagram $30",
      sourceUrl: "https://iqfluence.io/public/blog/cpm-influencer-marketing",
      asOf: "2026",
      why: "B2B creators on YouTube and LinkedIn price mid-range; likely sits between YouTube and Instagram.",
      confidence: "low",
    },
    clickThroughRate: {
      id: "influencer.clickThroughRate",
      label: "Creators / influencers: click-through rate",
      value: { low: 0.003, likely: 0.008, high: 0.015 },
      source: "Derived from a 2025 engagement benchmark (YouTube 1.5%)",
      sourceUrl: "https://www.modash.io/it/blog/influencer-marketing-cpm",
      asOf: "2025",
      why: "No click benchmark found; link clicks are a fraction of the ~1.5% engagement rate.",
      confidence: "low",
    },
    intentMultiplier: {
      id: "influencer.intentMultiplier",
      label: "Creators / influencers: intent multiplier",
      value: 0.9,
      source: JUDGMENT,
      asOf: DECIDED,
      why: "A trusted recommendation helps, but viewers came for the creator, not the category.",
      confidence: "low",
    },
    rampProfile: {
      id: "influencer.rampProfile",
      label: "Creators / influencers: ramp",
      value: "spike",
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Most views of a creator post arrive in its first days.",
      confidence: "medium",
    },
  },

  content_seo: {
    costPerThousand: {
      id: "content_seo.costPerThousand",
      label: "Content & SEO: production cost per 1,000 search impressions",
      value: { low: 20, likely: 50, high: 150 },
      source:
        "Marketful 2026 ($300–$800 per post, all-in) ÷ Launch Lab estimate of impressions per post",
      sourceUrl: "https://marketful.com/content-marketing-costs",
      asOf: "2026",
      why: "A ~$500 post earning ~10,000 search impressions in a launch window costs ~$50 per 1,000.",
      confidence: "low",
    },
    clickThroughRate: {
      id: "content_seo.clickThroughRate",
      label: "Content & SEO: click-through rate",
      value: { low: 0.01, likely: 0.03, high: 0.08 },
      source:
        "Ahrefs Dec 2025 (position 1 informational CTR 3.9%); GrowthSRC 2025 (position 1 19%)",
      sourceUrl: "https://ahrefs.com/blog/ai-overviews-reduce-clicks-update",
      asOf: "2025-12",
      why: "New pages rarely rank first, and AI Overviews have cut organic clicks, so likely is 3%.",
      confidence: "low",
    },
    intentMultiplier: {
      id: "content_seo.intentMultiplier",
      label: "Content & SEO: intent multiplier",
      value: 1.3,
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Searchers are looking for the topic, though often for information rather than a tool.",
      confidence: "low",
    },
    rampProfile: {
      id: "content_seo.rampProfile",
      label: "Content & SEO: ramp",
      value: "build",
      source: JUDGMENT,
      asOf: DECIDED,
      why: "Pages take weeks to index and rank, so impact grows through the window.",
      confidence: "medium",
    },
  },
};

export function channelAssumptions(id: ChannelId): ChannelAssumptions {
  const r = channelBenchmarks[id];
  return {
    costPerThousand: r.costPerThousand.value,
    clickThroughRate: r.clickThroughRate.value,
    intentMultiplier: r.intentMultiplier.value,
    rampProfile: r.rampProfile.value,
  };
}
