import { glossaryFor } from "@/lib/glossary";

/** "Words used here": one-line explanations for only the terms this page actually uses. */
export function Glossary({ texts }: { texts: string[] }) {
  const entries = glossaryFor(...texts);
  if (entries.length === 0) return null;
  return (
    <section aria-labelledby="words" className="flex flex-col gap-3">
      <h2 id="words" className="label">
        Words used here
      </h2>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
        {entries.map((e) => (
          <div key={e.term} className="contents">
            <dt className="font-medium">{e.term}</dt>
            <dd className="text-pretty text-ink-muted">{e.explanation}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
