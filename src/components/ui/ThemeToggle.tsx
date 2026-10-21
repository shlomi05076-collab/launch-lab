"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { isThemePreference, THEME_STORAGE_KEY, type ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function applyPreference(preference: ThemePreference) {
  const root = document.documentElement;
  if (preference === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", preference);
}

function setPreference(preference: ThemePreference) {
  try {
    if (preference === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage unavailable (private mode): the choice still applies for this page view.
  }
  applyPreference(preference);
  for (const notify of listeners) notify();
}

export function ThemeToggle({ className }: { className?: string }) {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const);

  // React's dev-mode remount clears attributes the inline script set on <html>. No-op in production.
  useLayoutEffect(() => applyPreference(readPreference()), []);

  return (
    <fieldset className={cn("inline-flex border border-rule p-0.5", className)}>
      <legend className="sr-only">Color theme</legend>
      {OPTIONS.map((option) => {
        const checked = preference === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "label flex min-h-8 cursor-pointer items-center px-2.5 transition-colors pointer-coarse:min-h-11",
              "has-focus-visible:outline-2 has-focus-visible:outline-ink",
              checked ? "bg-ink text-bg" : "hover:text-ink",
            )}
          >
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={checked}
              onChange={() => setPreference(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </fieldset>
  );
}
