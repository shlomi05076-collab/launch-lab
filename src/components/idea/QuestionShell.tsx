"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

const TOTAL = 7;

/** One question per screen: progress, the question as the page heading, back and next. */
export function QuestionShell({
  number,
  title,
  intro,
  children,
  canContinue,
  onBack,
  onNext,
  nextLabel = "Next",
}: {
  /** 1–7, or null for the optional name screen. */
  number: number | null;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  canContinue: boolean;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  // Move focus to the new question so keyboard and screen-reader users land in the right place.
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (canContinue) onNext();
      }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="label">
            {number === null
              ? "Before we start"
              : number === TOTAL
                ? "Last step"
                : `Question ${number} of ${TOTAL - 1}`}
          </span>
          {number !== null && (
            <span className="flex flex-1 gap-1" aria-hidden="true">
              {Array.from({ length: TOTAL }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length progress ticks
                <span key={i} className={`h-0.5 flex-1 ${i < number ? "bg-ink" : "bg-rule"}`} />
              ))}
            </span>
          )}
        </div>
        <h1
          ref={heading}
          tabIndex={-1}
          className="display text-3xl text-balance outline-none sm:text-4xl"
        >
          {title}
        </h1>
        {intro && <div className="max-w-prose text-pretty text-ink-muted">{intro}</div>}
      </div>

      {children}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5">
        {onBack ? (
          <Button variant="quiet" onClick={onBack}>
            ← Back
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={!canContinue}>
          {nextLabel} →
        </Button>
      </div>
    </form>
  );
}
