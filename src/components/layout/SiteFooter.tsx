import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 sm:px-6">
        <p className="label">
          Build status <span className="text-ink">{site.milestone}</span>
        </p>
        <nav className="flex gap-5" aria-label="Footer">
          <Link href="/style-guide" className="label hover:text-ink">
            Style guide
          </Link>
          <a href={site.repoUrl} className="label hover:text-ink">
            Source on GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
