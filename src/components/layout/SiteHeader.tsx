import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
          <Mark />
          <span className="display text-[1.0625rem] font-semibold">{site.name}</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

/** Logo mark: a crosshair reticle over a rising trace, like a measurement scope. */
function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="0.75" y="0.75" width="20.5" height="20.5" className="stroke-ink" strokeWidth="1.5" />
      <path d="M4 15.5 L8.5 12 L12 13.5 L18 6" className="stroke-accent" strokeWidth="1.75" />
      <circle cx="18" cy="6" r="1.6" className="fill-accent" />
    </svg>
  );
}
