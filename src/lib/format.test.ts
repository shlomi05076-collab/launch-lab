import { describe, expect, it } from "vitest";
import {
  formatApproxCount,
  formatApproxCurrency,
  formatCount,
  formatCurrency,
  formatDuration,
  formatMonths,
  formatOneIn,
  formatPercent,
} from "./format";

describe("format", () => {
  it("counts whole people with grouping", () => {
    expect(formatCount(1234.6)).toBe("1,235");
    expect(formatCount(Number.NaN)).toBe("–");
  });

  it("shows money in dollars, with cents under $10", () => {
    expect(formatCurrency(1234.4)).toBe("$1,234");
    expect(formatCurrency(4.5)).toBe("$4.50");
    expect(formatCurrency(9)).toBe("$9");
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

describe("plain-language formats", () => {
  it("writes rates as 1 in N", () => {
    expect(formatOneIn(0.04)).toBe("1 in 25");
    expect(formatOneIn(0.4)).toBe("1 in 2.5");
    expect(formatOneIn(0.00078)).toBe("1 in 1,300");
    expect(formatOneIn(1)).toBe("every one");
    expect(formatOneIn(0)).toBe("none");
  });

  it("rounds prose counts honestly", () => {
    expect(formatApproxCount(6.6)).toBe("7");
    expect(formatApproxCount(158)).toBe("160");
    expect(formatApproxCount(1349)).toBe("1,300");
  });

  it("writes durations in weeks or months", () => {
    expect(formatDuration(2)).toBe("2 weeks");
    expect(formatDuration(4)).toBe("1 month");
    expect(formatDuration(8)).toBe("2 months");
    expect(formatDuration(13)).toBe("3 months");
  });
});

describe("formatApproxCurrency", () => {
  it("rounds to two significant figures", () => {
    expect(formatApproxCurrency(4.89)).toBe("$4.90");
    expect(formatApproxCurrency(1681)).toBe("$1,700");
    expect(formatApproxCurrency(15.8)).toBe("$16");
    expect(formatApproxCurrency(0)).toBe("$0");
  });
});
