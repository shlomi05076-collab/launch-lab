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

/**
 * Gross margin one customer earns in their first 12 months: what they're worth for the
 * break-even test.
 * - Subscription: g·(1 − (1−c)^12) / c with g = price × margin (12·g without churn).
 * - One-time: price × margin × purchases in the first year.
 */
export function customerValue12m(e: CustomerEconomics): number {
  const margin = e.price * e.grossMargin;
  if (e.model === "one_time") return margin * Math.max(1, e.purchasesPerYear);
  const c = Math.min(1, Math.max(0, e.monthlyChurn));
  if (c === 0) return 12 * margin;
  // -expm1(12·log1p(−c)) = 1 − (1−c)^12, precise for tiny churn.
  return (margin * -Math.expm1(12 * Math.log1p(-c))) / c;
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
 * Otherwise repeat purchases, spread evenly over the first year, pay it back part-way through
 * that year. Purchases beyond the first year aren't modeled, so if the first year's purchases
 * don't cover CAC the result is Infinity ("not within the first year").
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
    return months <= 12 ? months : Number.POSITIVE_INFINITY;
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
