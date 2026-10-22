import { cn } from "@/lib/cn";

/** Shown on every result, right under the headline (CLAUDE.md, "Disclaimer on every result"). */
export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("text-sm text-pretty text-ink-muted", className)}>
      <span aria-hidden="true">ⓘ </span>A planning simulation based on industry averages, not a
      prediction or financial advice. Covers marketing spend only.
    </p>
  );
}
