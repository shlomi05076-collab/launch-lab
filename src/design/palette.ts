/**
 * Color values for both themes. `src/app/globals.css` mirrors these as CSS variables
 * (palette.test.ts fails if they drift), and the test suite checks WCAG contrast.
 *
 * Direction (M0 design gate): cool-gray neutrals with very low chroma, so a highly
 * saturated ultramarine accent is the most colorful thing on screen in both themes.
 *
 * Usage rules:
 * - `inkFaint`, `rule` and `grid` are for lines and ticks only, never text.
 * - `accent` is for ONE key insight per screen. `accentInk` is its text-safe variant.
 * - `good` / `warning` / `risk` are semantic: classic green / amber / red.
 */

export type ThemeName = "light" | "dark";

export type Palette = {
  bg: string;
  surface: string;
  inset: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  rule: string;
  grid: string;
  good: string;
  warning: string;
  risk: string;
  accent: string;
  accentInk: string;
};

export const palettes: Record<ThemeName, Palette> = {
  light: {
    bg: "#f3f4f6",
    surface: "#fbfbfc",
    inset: "#e8eaee",
    ink: "#12161d",
    inkMuted: "#4b515d",
    inkFaint: "#7c828e",
    rule: "#d2d5db",
    grid: "#e3e5e9",
    good: "#17704a",
    warning: "#8a5b00",
    risk: "#c4243a",
    accent: "#2f1cff",
    accentInk: "#2f1cff",
  },
  dark: {
    bg: "#0f1114",
    surface: "#15171b",
    inset: "#1b1e23",
    ink: "#e7e9ec",
    inkMuted: "#a4a9b2",
    inkFaint: "#6d727b",
    rule: "#2a2d33",
    grid: "#1b1d21",
    good: "#45c387",
    warning: "#e0b43c",
    risk: "#ff6b6b",
    accent: "#6466ff",
    accentInk: "#7a7cff",
  },
};

/** Human-readable token roles, used by the style guide. */
export const tokenRoles: {
  key: keyof Palette;
  label: string;
  kind: "surface" | "text" | "graphic";
}[] = [
  { key: "bg", label: "Background", kind: "surface" },
  { key: "surface", label: "Surface", kind: "surface" },
  { key: "inset", label: "Inset", kind: "surface" },
  { key: "ink", label: "Ink", kind: "text" },
  { key: "inkMuted", label: "Ink muted", kind: "text" },
  { key: "inkFaint", label: "Ink faint", kind: "graphic" },
  { key: "rule", label: "Rule", kind: "surface" },
  { key: "grid", label: "Grid", kind: "surface" },
  { key: "accent", label: "Accent", kind: "graphic" },
  { key: "accentInk", label: "Accent text", kind: "text" },
  { key: "good", label: "Good", kind: "text" },
  { key: "warning", label: "Warning", kind: "text" },
  { key: "risk", label: "Risk", kind: "text" },
];
