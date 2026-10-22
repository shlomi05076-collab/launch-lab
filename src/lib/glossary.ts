/**
 * One-line, jargon-free explanations. In guided mode a term may only appear in results next to
 * its entry here. `pattern` finds the term in generated text.
 */
export type GlossaryEntry = { term: string; pattern: RegExp; explanation: string };

export const glossary: GlossaryEntry[] = [
  {
    term: "CAC",
    pattern: /\bCAC\b|customer acquisition cost/i,
    explanation:
      "What it costs, on average, to win one paying customer: marketing spend ÷ customers.",
  },
  {
    term: "Churn",
    pattern: /\bchurn\b/i,
    explanation: "The share of paying customers who cancel each month.",
  },
  {
    term: "Conversion rate",
    pattern: /\bconversion\b/i,
    explanation:
      "The share of people at one step who go on to the next, like visitors who sign up.",
  },
  {
    term: "Break-even",
    pattern: /\bbreak[- ]even\b/i,
    explanation: "The point where what customers bring in covers what you spent to win them.",
  },
  {
    term: "Gross margin",
    pattern: /\bgross margin\b|\bmargin\b/i,
    explanation: "What's left of each sale after the direct cost of delivering it.",
  },
  {
    term: "Payback period",
    pattern: /\bpayback\b/i,
    explanation: "How many months it takes a customer to earn back what it cost to win them.",
  },
  {
    term: "MRR",
    pattern: /\bMRR\b|monthly recurring revenue/i,
    explanation: "Monthly recurring revenue: what all current subscribers pay you each month.",
  },
  {
    term: "Click-through rate",
    pattern: /\bclick-through\b|\bCTR\b/i,
    explanation: "The share of people who see an ad and click it.",
  },
  {
    term: "CPM",
    pattern: /\bCPM\b|cost per 1,000/i,
    explanation: "Cost per 1,000 times an ad is shown.",
  },
  {
    term: "Downside / likely / upside",
    pattern: /\bdownside\b|\bupside\b/i,
    explanation:
      "In 5,000 simulated launches, 10% did worse than the downside and 10% did better than the upside.",
  },
];

/** The glossary entries for terms that actually appear in the given texts, in glossary order. */
export function glossaryFor(...texts: string[]): GlossaryEntry[] {
  const all = texts.join(" ");
  return glossary.filter((entry) => entry.pattern.test(all));
}
