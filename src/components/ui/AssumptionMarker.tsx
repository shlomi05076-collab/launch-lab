import type { Assumption } from "@/data/assumption";

/**
 * Marks a value as an assumption and reveals where it came from. Native <details>, so it works
 * with keyboard and screen readers and needs no JavaScript.
 */
export function AssumptionMarker({ records }: { records: Assumption<unknown>[] }) {
  if (records.length === 0) return null;
  return (
    <details className="group text-xs">
      <summary className="label inline-flex min-h-8 cursor-pointer list-none items-center gap-1 hover:text-ink [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true">ⓘ</span> assumption · source
      </summary>
      <ul className="mt-1 flex flex-col gap-2 border-l border-rule pl-3 text-ink-muted">
        {records.map((r) => (
          <li key={r.id}>
            <span className="text-ink">{r.why}</span>{" "}
            <span>
              Source:{" "}
              {r.sourceUrl ? (
                <a
                  href={r.sourceUrl}
                  className="underline underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  {r.source}
                </a>
              ) : (
                r.source
              )}{" "}
              ({r.asOf}). Confidence: {r.confidence}.
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
