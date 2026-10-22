import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "quiet";

/** Primary actions are ink, not accent: the accent is reserved for each screen's key insight. */
export function buttonClass(variant: Variant = "primary", className?: string) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 px-5 text-[0.9375rem] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
    variant === "primary" && "bg-ink text-bg hover:bg-ink/85",
    variant === "secondary" && "border border-ink text-ink hover:bg-inset",
    variant === "quiet" &&
      "px-2 text-ink-muted underline decoration-rule underline-offset-4 hover:text-ink",
    className,
  );
}

export function Button({
  variant,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  variant,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
