/**
 * Every default number in src/data/ is an Assumption: a value plus where it came from.
 * The UI's assumption marker shows `source`, `asOf` and `why`; docs/model.md has the full
 * reasoning, including where sources disagree. assumptions.test.ts enforces both.
 */
export type Assumption<T> = {
  /** Stable id, also used as the heading anchor in docs/model.md. */
  id: string;
  label: string;
  value: T;
  /** Short citation. "Launch Lab judgment" when no published benchmark exists. */
  source: string;
  sourceUrl?: string;
  /** When the source's data is from: "YYYY-MM" or "YYYY". */
  asOf: string;
  /** One line: why this number. */
  why: string;
  /** How much to trust it. Low = judgment or thin, conflicting sources. */
  confidence: "high" | "medium" | "low";
};
