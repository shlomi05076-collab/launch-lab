import { describe, expect, it } from "vitest";
import { cn } from "./cn";
import { isThemePreference, THEME_STORAGE_KEY, themeInitScript } from "./theme";

/** Runs the inline <head> script against a fake localStorage and <html> element. */
function runInitScript(stored: string | null, storageThrows = false) {
  const attributes = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => {
      if (storageThrows) throw new Error("SecurityError");
      return key === THEME_STORAGE_KEY ? stored : null;
    },
  };
  const document = {
    documentElement: { setAttribute: (name: string, value: string) => attributes.set(name, value) },
  };
  new Function("localStorage", "document", themeInitScript)(localStorage, document);
  return attributes.get("data-theme");
}

describe("themeInitScript", () => {
  it("applies a saved light or dark preference before paint", () => {
    expect(runInitScript("dark")).toBe("dark");
    expect(runInitScript("light")).toBe("light");
  });

  it("leaves the attribute unset for system or unknown values", () => {
    expect(runInitScript(null)).toBeUndefined();
    expect(runInitScript("system")).toBeUndefined();
    expect(runInitScript("<script>")).toBeUndefined();
  });

  it("does not throw when storage is blocked", () => {
    expect(runInitScript("dark", true)).toBeUndefined();
  });
});

describe("isThemePreference", () => {
  it("accepts only the three preferences", () => {
    expect(["system", "light", "dark"].every(isThemePreference)).toBe(true);
    expect(isThemePreference("sepia")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
