import { describe, expect, it } from "vitest";
import { formatCount, formatCurrency, formatMonths, formatPercent } from "./format";

describe("format", () => {
  it("counts whole people with grouping", () => {
    expect(formatCount(1234.6)).toBe("1,235");
    expect(formatCount(Number.NaN)).toBe("–");
  });

  it("shows money in dollars, with cents under $10", () => {
    expect(formatCurrency(1234.4)).toBe("$1,234");
    expect(formatCurrency(4.5)).toBe("$4.50");
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe("n/a");
  });

  it("shows payback, capping long and infinite periods", () => {
    expect(formatMonths(9.46)).toBe("9.5 mo");
    expect(formatMonths(37)).toBe("> 36 mo");
    expect(formatMonths(Number.POSITIVE_INFINITY)).toBe("never");
  });

  it("shows shares as whole percentages", () => {
    expect(formatPercent(0.614)).toBe("61%");
  });
});
