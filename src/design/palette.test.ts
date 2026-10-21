import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio, hueDistance, toOklch } from "@/lib/color";
import { type Palette, palettes, type ThemeName } from "./palette";

const themes: ThemeName[] = ["light", "dark"];
const backgrounds = ["bg", "surface"] as const;

/** Text tokens must reach WCAG AA (4.5:1) on every background they sit on. */
const textTokens = ["ink", "inkMuted", "good", "warning", "risk", "accentInk"] as const;
/** Graphic-only tokens (lines, bars, marks) need 3:1. */
const graphicTokens = ["inkFaint", "accent"] as const;

describe.each(themes)("%s palette contrast", (theme) => {
  const p = palettes[theme];

  it.each(
    textTokens.flatMap((t) => backgrounds.map((b) => [t, b] as const)),
  )("%s on %s meets AA for text", (token, bg) => {
    expect(contrastRatio(p[token], p[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(
    graphicTokens.flatMap((t) => backgrounds.map((b) => [t, b] as const)),
  )("%s on %s meets 3:1 for graphics", (token, bg) => {
    expect(contrastRatio(p[token], p[bg])).toBeGreaterThanOrEqual(3);
  });
});

/*
 * Design intent from the M0 gate, as tests: the accent is the most colorful thing on screen
 * (cool-gray neutrals, saturated ultramarine) and never confusable with the semantic colors.
 */
describe.each(themes)("%s accent stands out", (theme) => {
  const p = palettes[theme];
  const neutrals = [
    "bg",
    "surface",
    "inset",
    "ink",
    "inkMuted",
    "inkFaint",
    "rule",
    "grid",
  ] as const;

  it("neutrals are near-gray (OKLCH chroma ≤ 0.025)", () => {
    for (const n of neutrals) expect(toOklch(p[n]).c).toBeLessThanOrEqual(0.025);
  });

  it("accent is highly saturated (chroma ≥ 0.2) and ≥ 25× the background's chroma", () => {
    const accent = toOklch(p.accent).c;
    expect(accent).toBeGreaterThanOrEqual(0.2);
    expect(accent).toBeGreaterThanOrEqual(25 * toOklch(p.bg).c);
  });

  it("accent hue is in the ultramarine range (265°–285°)", () => {
    const { h } = toOklch(p.accent);
    expect(h).toBeGreaterThanOrEqual(265);
    expect(h).toBeLessThanOrEqual(285);
  });

  it.each(["good", "warning", "risk"] as const)("accent hue is ≥ 90° away from %s", (semantic) => {
    expect(hueDistance(toOklch(p.accent).h, toOklch(p[semantic]).h)).toBeGreaterThanOrEqual(90);
  });
});

describe("globals.css mirrors palette.ts", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

  it.each(Object.keys(palettes.light) as (keyof Palette)[])("--%s matches", (key) => {
    const declaration = `--${kebab(key)}: light-dark(${palettes.light[key]}, ${palettes.dark[key]});`;
    expect(css).toContain(declaration);
  });
});
