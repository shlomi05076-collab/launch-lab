import { audienceBands } from "@/data/guidedDefaults";
import { productTypes } from "@/data/productTypes";
import { PLAIN_CHANNELS } from "@/lib/channelNames";
import { formatApproxCount, formatCurrency } from "@/lib/format";
import { type IdeaAnswers, QUESTIONS, type Question } from "./answers";
import { templateFor } from "./toScenario";

export type AnswerRow = {
  question: Question;
  label: string;
  answer: string;
  notSure: boolean;
  /** What kind of default a "not sure" answer uses: a benchmark, an estimate or an example. */
  tag?: "typical value" | "rough estimate" | "example amount";
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const LENGTH: Record<number, string> = {
  2: "2 weeks",
  4: "1 month",
  8: "2 months",
  13: "3 months",
};

/** The answers as plain sentences, for "Check your answers". */
export function summarizeAnswers(a: IdeaAnswers): AnswerRow[] {
  const t = templateFor(a);

  const rows: Record<Question, Omit<AnswerRow, "question">> = {
    kind: {
      label: "What you're selling",
      answer:
        a.kind === "not_sure"
          ? `Not sure; for ${a.forWhom === "people" ? "people" : "businesses"}, so we'll use ${t.choice.toLowerCase()} as the closest type`
          : a.kind
            ? productTypes[a.kind].choice
            : "",
      notSure: a.kind === "not_sure",
    },
    audience: {
      label: "Who could buy it",
      answer:
        a.audience === "custom"
          ? `About ${formatApproxCount(a.audienceCustom ?? 0)} people`
          : a.audience === "not_sure" || a.audience === null
            ? `Not sure, so a rough estimate of about ${formatApproxCount(audienceBands.value.specific)} people`
            : `About ${formatApproxCount(audienceBands.value[a.audience])} people`,
      notSure: a.audience === "not_sure",
      tag: "rough estimate",
    },
    charge: {
      label: "How you charge",
      answer: (() => {
        const model = a.charge ?? t.pricing.model;
        const per = model === "subscription" ? " a month" : " per purchase";
        const price =
          typeof a.price === "number"
            ? `${formatCurrency(a.price)}${per}`
            : `not sure, so about ${formatCurrency(t.pricing.price.value.likely)}${per}, typical for ${t.similar}`;
        const repeats =
          model === "one_time" && typeof a.purchases === "number"
            ? `; customers buy ${a.purchases === 1 ? "once" : a.purchases === 2 ? "twice" : "3 or more times"} a year`
            : "";
        return `${capitalize(price)}${repeats}`;
      })(),
      notSure: a.price === "not_sure",
    },
    budget: {
      label: "Marketing budget",
      answer:
        a.budget === "not_sure"
          ? "Not sure, so $5,000 as an example amount"
          : a.budget === 0
            ? "Nothing on ads"
            : typeof a.budget === "number"
              ? formatCurrency(a.budget)
              : "",
      notSure: a.budget === "not_sure",
      tag: "example amount",
    },
    timing: {
      label: "When and for how long",
      answer:
        a.timing === "not_sure"
          ? "Not sure, so next month, for 2 months"
          : a.timing
            ? `From ${MONTHS[a.timing.startMonth - 1]}, for ${LENGTH[a.timing.weeks]}`
            : "",
      notSure: a.timing === "not_sure",
    },
    channels: {
      label: "How people will find out",
      answer: (() => {
        const parts: string[] = [];
        if (a.budget !== 0) {
          if (a.channels === "not_sure") parts.push(`a usual starting mix for ${t.similar}`);
          else if (Array.isArray(a.channels)) {
            parts.push(...a.channels.map((c) => PLAIN_CHANNELS[c].inSentence));
          }
        }
        if (a.selfPromotion !== null) {
          parts.push(
            a.selfPromotion === "not_sure"
              ? "your own promotion (about 3 hours a week)"
              : `your own promotion (about ${a.selfPromotion} hours a week)`,
          );
        }
        return capitalize(parts.join(", "));
      })(),
      notSure: a.channels === "not_sure" || a.selfPromotion === "not_sure",
    },
  };
  return QUESTIONS.map((question) => ({ question, ...rows[question] }));
}

function capitalize(s: string) {
  return `${s[0]?.toUpperCase() ?? ""}${s.slice(1)}`;
}
