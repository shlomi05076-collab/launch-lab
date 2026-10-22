/** Weeks per month on average (52 weeks ÷ 12 months). */
export const WEEKS_PER_MONTH = 52 / 12;

/** Customer acquisition cost. Infinity when nobody paid: the spend bought no customers. */
export function cac(spend: number, payingCustomers: number): number {
  return payingCustomers > 0 ? spend / payingCustomers : Number.POSITIVE_INFINITY;
}

export type CustomerEconomics = {
  price: number;
  grossMargin: number;
  model: "subscription" | "one_time";
  /** Subscription only. */
  monthlyChurn: number;
  /** One-time only: purchases in the first year, including the first (≥ 1). */
  purchasesPerYear: number;
};

/** The longest "earn it back within" horizon the model reports (3 years). */
export const MAX_HORIZON_MONTHS = 36;

/**
 * Gross margin one customer earns in their first `months`: what they're worth for the
 * break-even test.
 * - Subscription: g·(1 − (1−c)^n) / c with g = price × margin and n = months (n·g without churn).
 * - One-time: price × margin × (1 + (purchases per year − 1) × years). Repeat purchases after the
 *   first year are assumed to continue at the first-year pace (a labeled judgment, docs/model.md).
 */
export function customerValue(e: CustomerEconomics, months = 12): number {
  const margin = e.price * e.grossMargin;
  if (e.model === "one_time") {
    return margin * (1 + (Math.max(1, e.purchasesPerYear) - 1) * (months / 12));
  }
  const c = Math.min(1, Math.max(0, e.monthlyChurn));
  if (c === 0) return months * margin;
  // -expm1(n·log1p(−c)) = 1 − (1−c)^n, precise for tiny churn.
  return (margin * -Math.expm1(months * Math.log1p(-c))) / c;
}

/**
 * Months until one customer's cumulative gross margin repays their acquisition cost.
 *
 * Subscription with monthly churn c and monthly margin g = price × grossMargin:
 *   expected margin after n months = g·(1 − (1−c)^n) / c, which can never exceed g / c
 *   (the lifetime cap). Solving for n:  n = ln(1 − CAC·c/g) / ln(1 − c).
 *   If CAC ≥ g / c the customer is never worth their CAC → Infinity ("never pays back").
 * With c = 0 this reduces to CAC / g.
 *
 * One-time: the first purchase pays back immediately (0 months) if its margin covers CAC.
 * Otherwise repeat purchases, spread evenly at the first-year pace, pay it back over time. The
 * model looks at most 3 years ahead, so anything slower is Infinity ("not within 3 years").
 */
export function paybackMonths(args: CustomerEconomics & { cac: number }): number {
  const { price, grossMargin, model, monthlyChurn } = args;
  const margin = price * grossMargin;
  if (!Number.isFinite(args.cac) || margin <= 0) return Number.POSITIVE_INFINITY;
  if (args.cac <= 0) return 0;

  if (model === "one_time") {
    if (margin >= args.cac) return 0;
    const repeatMarginPerMonth = (margin * (Math.max(1, args.purchasesPerYear) - 1)) / 12;
    if (repeatMarginPerMonth <= 0) return Number.POSITIVE_INFINITY;
    const months = (args.cac - margin) / repeatMarginPerMonth;
    return months <= MAX_HORIZON_MONTHS ? months : Number.POSITIVE_INFINITY;
  }

  if (monthlyChurn <= 0) return args.cac / margin;
  if (monthlyChurn >= 1) return margin >= args.cac ? 1 : Number.POSITIVE_INFINITY;
  const share = (args.cac * monthlyChurn) / margin;
  if (share >= 1) return Number.POSITIVE_INFINITY;
  // log1p keeps precision when churn is tiny (ln(1 − x) for x ≈ 0 would round to 0 / 0).
  const months = Math.log1p(-share) / Math.log1p(-monthlyChurn);
  return Number.isFinite(months) ? months : args.cac / margin;
}

/** Share of subscribers still paying after one week, given monthly churn. */
export function weeklyRetention(monthlyChurn: number): number {
  return (1 - monthlyChurn) ** (1 / WEEKS_PER_MONTH);
}
