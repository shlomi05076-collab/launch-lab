/** The only place raw engine numbers become display strings. */

const count = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const cents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Whole people or customers: 1,234. */
export function formatCount(n: number): string {
  return Number.isFinite(n) ? count.format(Math.round(n)) : "–";
}

/** Money: $1,234, or $4.50 under $10. Infinity (no customers acquired) shows as "n/a". */
export function formatCurrency(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  return Math.abs(n) < 10 ? cents.format(n) : dollars.format(n);
}

/** Payback period: "9.5 mo", "> 36 mo", or "never" when CAC exceeds lifetime value. */
export function formatMonths(months: number): string {
  if (!Number.isFinite(months)) return "never";
  if (months > 36) return "> 36 mo";
  return `${months.toFixed(1)} mo`;
}

/** A 0–1 share as a whole percentage: 0.614 → "61%". */
export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/**
 * A rate as "1 in N", the way people without a stats background read odds.
 * 0.04 → "1 in 25"; 0.4 → "1 in 2.5"; 0.0008 → "1 in 1,300". Rates ≥ 1 → "every one".
 */
export function formatOneIn(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) return "none";
  if (rate >= 1) return "every one";
  const n = 1 / rate;
  if (n < 3) return `1 in ${Math.round(n * 10) / 10}`;
  if (n < 100) return `1 in ${Math.round(n)}`;
  const magnitude = 10 ** (Math.floor(Math.log10(n)) - 1);
  return `1 in ${count.format(Math.round(n / magnitude) * magnitude)}`;
}

/** A count for prose, rounded to what's honest: 7, 64, 160, 1,300. */
export function formatApproxCount(n: number): string {
  if (!Number.isFinite(n)) return "–";
  if (n < 100) return count.format(Math.round(n));
  const magnitude = 10 ** (Math.floor(Math.log10(n)) - 1);
  return count.format(Math.round(n / magnitude) * magnitude);
}

/** Launch length in plain words: 2 → "2 weeks", 8 → "2 months", 13 → "3 months". */
export function formatDuration(weeks: number): string {
  if (weeks < 4) return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  const months = Math.round(weeks / (52 / 12));
  return `${months} ${months === 1 ? "month" : "months"}`;
}

/** Money for prose and ranges, rounded to two significant figures: $4.89 → "$4.90", $1,681 → "$1,700". */
export function formatApproxCurrency(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  if (n === 0) return "$0";
  const magnitude = 10 ** (Math.floor(Math.log10(Math.abs(n))) - 1);
  return formatCurrency(Math.round(n / magnitude) * magnitude);
}
