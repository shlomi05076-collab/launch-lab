import { z } from "zod";
import { CHANNEL_IDS, HORIZONS, PRODUCT_TYPES } from "@/engine";

/**
 * The guided "Test my idea" answers. `null` = not answered yet; "not_sure" = answered "not sure",
 * which uses a sourced default for the product type (docs/test-my-idea.md).
 * Validated with Zod because a saved draft comes back from localStorage (untrusted).
 */

const NOT_SURE = z.literal("not_sure");
const month = z.number().int().min(1).max(12);

export const ideaAnswersSchema = z.object({
  name: z.string().max(80),
  kind: z.union([z.enum(PRODUCT_TYPES), NOT_SURE]).nullable(),
  /** Follow-up when `kind` is "not sure". */
  forWhom: z.enum(["business", "people"]).nullable(),
  audience: z.union([z.enum(["niche", "specific", "broad", "custom"]), NOT_SURE]).nullable(),
  audienceCustom: z.number().int().positive().max(1_000_000_000).nullable(),
  /** Null means "as usual for this product type". */
  charge: z.enum(["subscription", "one_time"]).nullable(),
  price: z.union([z.number().positive().max(1_000_000), NOT_SURE]).nullable(),
  /** One-time products: purchases per customer in their first year. */
  purchases: z.union([z.literal(1), z.literal(2), z.literal(3), NOT_SURE]).nullable(),
  budget: z.union([z.number().min(0).max(100_000_000), NOT_SURE]).nullable(),
  timing: z
    .union([
      z.object({
        startMonth: month,
        weeks: z.union([z.literal(2), z.literal(4), z.literal(8), z.literal(13)]),
      }),
      NOT_SURE,
    ])
    .nullable(),
  channels: z.union([z.array(z.enum(CHANNEL_IDS)).max(4), NOT_SURE]).nullable(),
  /** "I'll promote it myself": hours a week, or not sure. Null = not chosen. */
  selfPromotion: z.union([z.number().min(0.5).max(80), NOT_SURE]).nullable(),
  /** Results setting: earn it back within 1, 2 or 3 years. */
  horizon: z.union(
    HORIZONS.map((h) => z.literal(h)) as [z.ZodLiteral<12>, z.ZodLiteral<24>, z.ZodLiteral<36>],
  ),
});

export type IdeaAnswers = z.infer<typeof ideaAnswersSchema>;

export const EMPTY_ANSWERS: IdeaAnswers = {
  name: "",
  kind: null,
  forWhom: null,
  audience: null,
  audienceCustom: null,
  charge: null,
  price: null,
  purchases: null,
  budget: null,
  timing: null,
  channels: null,
  selfPromotion: null,
  horizon: 12,
};

/** The question steps in order (the optional name and the review screen sit around them). */
export const QUESTIONS = ["kind", "audience", "charge", "budget", "timing", "channels"] as const;
export type Question = (typeof QUESTIONS)[number];

/** Whether a question has an answer ("not sure" counts) so the user can move on. */
export function isAnswered(q: Question, a: IdeaAnswers): boolean {
  switch (q) {
    case "kind":
      return a.kind !== null && (a.kind !== "not_sure" || a.forWhom !== null);
    case "audience":
      return a.audience !== null && (a.audience !== "custom" || a.audienceCustom !== null);
    case "charge":
      return a.price !== null;
    case "budget":
      return a.budget !== null;
    case "timing":
      return a.timing !== null;
    case "channels":
      // With no ad budget, only the founder's own promotion can reach anyone.
      if (a.budget === 0) return a.selfPromotion !== null;
      return (
        a.channels === "not_sure" ||
        (Array.isArray(a.channels) && a.channels.length > 0) ||
        a.selfPromotion !== null
      );
  }
}

/** A saved draft, or a fresh one if it's missing or no longer valid. */
export function parseAnswers(value: unknown): IdeaAnswers {
  const parsed = ideaAnswersSchema.safeParse(value);
  return parsed.success ? parsed.data : EMPTY_ANSWERS;
}
