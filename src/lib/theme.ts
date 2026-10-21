/**
 * Theme preference: "system" follows prefers-color-scheme (no attribute on <html>);
 * "light" / "dark" set data-theme, which flips color-scheme and every light-dark() token.
 */

export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "launch-lab:theme";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

/**
 * Runs in <head> before first paint (see Next docs: "Preventing flash before hydration").
 * Must stay dependency-free ES5: it is inlined as a string.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
