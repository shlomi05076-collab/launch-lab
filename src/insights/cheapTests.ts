import type { ProductTypeTemplate } from "@/data/productTypes";
import {
  type ChannelId,
  likelyParams,
  type ModelAssumptions,
  type Requirement,
  type RequirementInput,
  type ScenarioInput,
  type Viability,
} from "@/engine";
import { PLAIN_CHANNELS } from "@/lib/channelNames";
import { formatApproxCount, formatCurrency, formatOneIn } from "@/lib/format";

/**
 * "How to test this cheaply": one small, concrete, real-world test of the assumption that matters
 * most, with a budget of at most 10% of the plan and a pass mark taken from the break-even value.
 * Spec: docs/test-my-idea.md. Wording: "holds up" / "doesn't hold up yet", never a verdict.
 */

export type CheapTest = {
  assumption: RequirementInput;
  title: string;
  /** What to do, in plain words. */
  steps: string;
  /** Dollars to spend (≤ 10% of the plan). 0 when the plan has no ad budget. */
  budget: number;
  /** "If at least 1 in 25 visitors … , this assumption holds up." */
  passMark: string;
  /** Sample-size caveat, or why a riskier assumption was skipped. */
  notes: string[];
};

export type CheapTestContext = {
  scenario: ScenarioInput;
  viability: Viability;
  template: ProductTypeTemplate;
  assumptions: ModelAssumptions;
};

/** Assumptions with a cheap pre-launch test, and which template tests them. */
const TESTABLE: Partial<Record<RequirementInput, "landing" | "presale" | "price" | "ads">> = {
  signupRate: "landing",
  payingRate: "presale",
  price: "price",
  costPerVisitor: "ads",
};

const UNTESTABLE_REASON: Partial<Record<RequirementInput, string>> = {
  monthlyChurn: "Cancellations only show up after launch",
  purchasesPerYear: "Repeat purchases only show up over time",
};

/** At least ~10 successes at the pass mark make the result mean something. */
const SUCCESSES_FOR_A_CLEAR_ANSWER = 10;

/** 10% of the plan, rounded down to a friendly amount ($50 steps, or $10 steps below $50). */
export function testBudget(totalBudget: number): number {
  const tenth = Math.max(0, totalBudget) * 0.1;
  return tenth >= 50 ? Math.floor(tenth / 50) * 50 : Math.floor(tenth / 10) * 10;
}

/** The plan's paid channel where a dollar buys the most visitors (ad platforms only). */
function cheapestAdChannel(ctx: CheapTestContext): { channel: ChannelId; costPerVisitor: number } {
  const params = likelyParams(ctx.scenario, ctx.assumptions);
  const adPlatforms: ChannelId[] = ["paid_social", "paid_search", "linkedin_ads"];
  const options = ctx.scenario.channels
    .map((c, i) => ({
      channel: c.channel,
      costPerVisitor:
        (params.channels[i]?.costPerThousand ?? 0) /
        (1000 * (params.channels[i]?.clickThroughRate ?? 1)),
    }))
    .filter((o) => adPlatforms.includes(o.channel) && o.costPerVisitor > 0)
    .sort((a, b) => a.costPerVisitor - b.costPerVisitor);
  if (options[0]) return options[0];
  // No ad platform in the plan: a small social campaign is the cheapest way to buy test visitors.
  const social = ctx.assumptions.channels.paid_social;
  return {
    channel: "paid_social",
    costPerVisitor: social.costPerThousand.likely / (1000 * social.clickThroughRate.likely),
  };
}

/** Plain names for the assumptions, for "why we skipped it" notes. */
function nameOf(input: RequirementInput, template: ProductTypeTemplate): string {
  switch (input) {
    case "signupRate":
      return template.labels.signup;
    case "payingRate":
      return template.labels.paying;
    case "costPerVisitor":
      return "Cheaper ads";
    case "price":
      return "A higher price";
    case "monthlyChurn":
      return "Fewer cancellations";
    case "purchasesPerYear":
      return "More repeat purchases";
  }
}

function choose(ctx: CheapTestContext): { req: Requirement; skipped: string | null } | null {
  const order = ctx.viability.ranking.length
    ? ctx.viability.ranking
    : ctx.viability.requirements.map((r) => r.input);
  const top = order[0];
  for (const input of order) {
    const req = ctx.viability.requirements.find((r) => r.input === input);
    if (req && TESTABLE[input] && req.needed !== null) {
      if (!top || top === input) return { req, skipped: null };
      const topReq = ctx.viability.requirements.find((r) => r.input === top);
      const reason =
        UNTESTABLE_REASON[top] ??
        (topReq?.needed === null
          ? `${nameOf(top, ctx.template)} couldn't close the gap on its own`
          : undefined);
      return { req, skipped: reason ?? null };
    }
  }
  return null;
}

export function cheapTest(ctx: CheapTestContext): CheapTest | null {
  const picked = choose(ctx);
  if (!picked) return null;
  const { req, skipped } = picked;
  const { scenario, template, viability } = ctx;
  const budget = testBudget(scenario.totalBudget);
  const { channel, costPerVisitor } = cheapestAdChannel(ctx);
  const where = PLAIN_CHANNELS[channel].inSentence;
  const visitors = budget > 0 ? Math.floor(budget / costPerVisitor) : 0;
  const notes: string[] = [];
  if (skipped) notes.push(`${skipped}, so start with the next assumption that matters most.`);
  if (viability.aboveBreakEven) {
    notes.push(
      "Your plan earns its spend back if results match similar products; this checks the assumption it depends on most before you spend the full budget.",
    );
  }

  const sizeNote = (perSuccess: number, people: string) => {
    const wanted = Math.ceil(SUCCESSES_FOR_A_CLEAR_ANSWER * perSuccess);
    if (budget > 0 && visitors < wanted) {
      notes.push(
        `With ${formatCurrency(budget)} you'd get about ${formatApproxCount(visitors)} ${people}, enough for a rough signal only; about ${formatApproxCount(wanted)} would give a clearer answer.`,
      );
    }
  };
  const send =
    budget > 0
      ? `Spend ${formatCurrency(budget)} on ${where} sending people to it (about ${formatApproxCount(visitors)} visitors).`
      : "Share it in communities you're part of and with your own network.";
  const needed = req.needed as number;

  switch (TESTABLE[req.input]) {
    case "landing": {
      const perSuccess = 1 / needed;
      sizeNote(perSuccess, "visitors");
      const expected = visitors > 0 ? ` (${Math.ceil(visitors / perSuccess)} or more)` : "";
      return {
        assumption: req.input,
        title: "Landing-page test",
        steps: `Build a one-page site that describes ${scenario.name} with an email sign-up or "Get early access" button; free site builders take an afternoon. ${send}`,
        budget,
        passMark: `If at least ${formatOneIn(needed)} visitors leave their email${expected}, this assumption holds up.`,
        notes,
      };
    }
    case "presale":
      notes.push(
        `You'll want about ${formatApproxCount(Math.ceil(SUCCESSES_FOR_A_CLEAR_ANSWER / needed))} people for a clear answer.`,
      );
      return {
        assumption: req.input,
        title: "Pre-sale test",
        steps: `Offer people who join your waitlist (or 20–30 potential ${template.customers} you can reach directly) early access at your real price, with a refundable pre-order or deposit.`,
        budget,
        passMark: `If at least ${formatOneIn(needed)} of them pay or put down a deposit, this assumption holds up.`,
        notes,
      };
    case "price": {
      const signup = viability.requirements.find((r) => r.input === "signupRate");
      const typicalRate = signup?.typical.likely ?? 0.05;
      sizeNote(1 / typicalRate, "visitors");
      const per = scenario.pricing.model === "subscription" ? " a month" : "";
      return {
        assumption: req.input,
        title: "Price test",
        steps: `Build a one-page site whose button says "Get it for ${formatCurrency(needed)}${per}" and leads to a "coming soon, leave your email" page. ${send}`,
        budget,
        passMark: `If at least ${formatOneIn(typicalRate)} visitors still click the button at that price, this assumption holds up.`,
        notes,
      };
    }
    case "ads":
      return {
        assumption: req.input,
        title: "Ad test",
        steps: `Run one small campaign on ${where} for a week, with 2–3 versions of your ad pointing at a simple page about ${scenario.name}.`,
        budget,
        passMark: `If you pay ${formatCurrency(needed)} or less per click on average, this assumption holds up.`,
        notes,
      };
    default:
      return null;
  }
}
