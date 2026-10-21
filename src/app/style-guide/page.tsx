import type { Metadata } from "next";
import { ThemePanel } from "./ThemePanel";

export const metadata: Metadata = {
  title: "Style guide",
  robots: { index: false },
};

export default function StyleGuidePage() {
  return (
    <div className="mx-auto max-w-[96rem] px-4 py-10 sm:px-6">
      <header className="mb-10 flex max-w-3xl flex-col gap-4">
        <p className="label">Design system</p>
        <h1 className="display text-4xl sm:text-5xl">Style guide</h1>
        <p className="text-pretty text-ink-muted">
          Every color token in both themes, with WCAG contrast against the page background (text
          needs 4.5:1, graphics 3:1) and OKLCH chroma (C), which measures how colorful a token is.
          Neutrals stay at or below 0.025 and the accent above 0.2, so the accent is unmistakable.
          The test suite enforces both.
        </p>
      </header>

      <div className="grid gap-px border border-rule bg-rule lg:grid-cols-2">
        <ThemePanel theme="light" />
        <ThemePanel theme="dark" />
      </div>
    </div>
  );
}
