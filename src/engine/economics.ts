/** Weeks per month on average (52 weeks ÷ 12 months). */
export const WEEKS_PER_MONTH = 52 / 12;

/** Customer acquisition cost. Infinity when nobody paid: the spend bought no customers. */
export function cac(spend: number, payingCustomers: number): number {
  return payingCustomers > 0 ? spend / payingCustomers : Number.POSITIVE_INFINITY;
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
 * One-time: the first purchase either covers CAC (0 months) or nothing ever will (Infinity).
 */
export function paybackMonths(args: {
  cac: number;
  price: number;
  grossMargin: number;
  model: "subscription" | "one_time";
  monthlyChurn: number;
}): number {
  const { price, grossMargin, model, monthlyChurn } = args;
  const margin = price * grossMargin;
  if (!Number.isFinite(args.cac) || margin <= 0) return Number.POSITIVE_INFINITY;
  if (args.cac <= 0) return 0;

  if (model === "one_time") return margin >= args.cac ? 0 : Number.POSITIVE_INFINITY;

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
