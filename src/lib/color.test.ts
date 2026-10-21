import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  hexToRgb,
  hueDistance,
  relativeLuminance,
  toOklch,
  wcagLevel,
} from "./color";

describe("toOklch", () => {
  it("matches reference values for white, black and sRGB blue", () => {
    expect(toOklch("#ffffff").l).toBeCloseTo(1, 3);
    expect(toOklch("#ffffff").c).toBeCloseTo(0, 3);
    expect(toOklch("#000000").l).toBeCloseTo(0, 3);
    // CSS Color 4 reference: #0000ff ≈ oklch(0.452 0.313 264.05)
    const blue = toOklch("#0000ff");
    expect(blue.l).toBeCloseTo(0.452, 3);
    expect(blue.c).toBeCloseTo(0.313, 3);
    expect(blue.h).toBeCloseTo(264.05, 1);
  });
});

describe("hueDistance", () => {
  it("wraps around the color wheel", () => {
    expect(hueDistance(10, 350)).toBe(20);
    expect(hueDistance(90, 270)).toBe(180);
    expect(hueDistance(120, 120)).toBe(0);
  });
});

describe("hexToRgb", () => {
  it("parses with or without a leading hash", () => {
    expect(hexToRgb("#ff8000")).toEqual({ r: 255, g: 128, b: 0 });
    expect(hexToRgb("FF8000")).toEqual({ r: 255, g: 128, b: 0 });
  });

  it("rejects short or invalid hex", () => {
    expect(() => hexToRgb("#fff")).toThrow();
    expect(() => hexToRgb("#gggggg")).toThrow();
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for identical colors", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#3b36f0", "#3b36f0")).toBe(1);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#0e1726", "#f2f4f7")).toBe(contrastRatio("#f2f4f7", "#0e1726"));
  });

  it("matches the published WCAG value for #767676 on white (4.54)", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });
});

describe("relativeLuminance", () => {
  it("spans 0 to 1", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 10);
  });
});

describe("wcagLevel", () => {
  it.each([
    [7, "AAA"],
    [4.5, "AA"],
    [3, "AA large"],
    [2.99, "fail"],
  ] as const)("rates %s as %s", (ratio, level) => {
    expect(wcagLevel(ratio)).toBe(level);
  });
});
