"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A plain number input with an optional prefix ("$") and suffix ("a month"). Commas are
 * accepted while typing; the parent only sees a number, or null while the field is empty.
 */
export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  placeholder,
  min = 0,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  placeholder?: string;
  min?: number;
}) {
  const id = useId();
  const [text, setText] = useState(value === null ? "" : value.toLocaleString("en-US"));

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="flex min-h-12 items-center gap-2 border border-rule bg-surface px-3 focus-within:border-ink">
        {prefix && <span className="figures text-ink-muted">{prefix}</span>}
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.,]/g, "");
            setText(raw);
            const n = Number(raw.replace(/,/g, ""));
            onChange(raw === "" || !Number.isFinite(n) || n < min ? null : n);
          }}
          className={cn("figures w-full bg-transparent py-2 text-lg outline-none")}
        />
        {suffix && <span className="shrink-0 text-sm text-ink-muted">{suffix}</span>}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-pretty text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
