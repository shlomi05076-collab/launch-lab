import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Choice cards built on native radio buttons and checkboxes, so keyboard and screen-reader
 * behaviour comes for free. "Not sure" choices get a dashed border so they read as a valid,
 * deliberate answer rather than an error state.
 */

export function ChoiceGroup({
  legend,
  hint,
  children,
  className,
}: {
  legend: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("flex flex-col gap-2", className)}>
      <legend className="label mb-2">{legend}</legend>
      {hint && <p className="-mt-1 mb-2 text-sm text-pretty text-ink-muted">{hint}</p>}
      {children}
    </fieldset>
  );
}

export function Choice({
  name,
  checked,
  onChange,
  label,
  description,
  multiple = false,
  notSure = false,
  disabled = false,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: ReactNode;
  description?: ReactNode;
  multiple?: boolean;
  notSure?: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex min-h-12 cursor-pointer items-start gap-3 border px-4 py-3 transition-colors",
        "has-focus-visible:outline-2 has-focus-visible:outline-ink",
        notSure && "border-dashed",
        checked ? "border-ink bg-surface" : "border-rule hover:border-ink-faint",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <input
        type={multiple ? "checkbox" : "radio"}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "mt-1 grid size-4 shrink-0 place-items-center border",
          multiple ? "" : "rounded-full",
          checked ? "border-ink" : "border-ink-faint",
        )}
      >
        {checked && <span className={cn("size-2 bg-ink", multiple ? "" : "rounded-full")} />}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[0.9375rem]">{label}</span>
        {description && <span className="text-sm text-pretty text-ink-muted">{description}</span>}
      </span>
    </label>
  );
}
