import type { Metadata } from "next";
import { IdeaResults } from "@/components/idea/results/IdeaResults";
import { EMPTY_ANSWERS, type IdeaAnswers } from "@/guided/answers";

export const metadata: Metadata = {
  title: "Example: Briefly",
  description: "An example result: AI meeting notes for small teams, tested before launch.",
};

/**
 * "See an example": the Briefly sample product (src/data/sampleScenarios.ts) answered through
 * the guided questions, so a first-time visitor sees a full result before typing anything.
 */
const BRIEFLY: IdeaAnswers = {
  ...EMPTY_ANSWERS,
  name: "Briefly, AI meeting notes for small teams",
  kind: "b2b_software",
  audience: "custom",
  audienceCustom: 1_000_000,
  charge: "subscription",
  price: 49,
  budget: 30_000,
  timing: { startMonth: 9, weeks: 13 },
  channels: ["paid_social", "content_seo", "paid_search", "newsletter"],
  selfPromotion: 4,
};

export default function ExamplePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <IdeaResults answers={BRIEFLY} example />
    </div>
  );
}
