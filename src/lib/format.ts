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
