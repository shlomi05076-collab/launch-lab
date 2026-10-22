import type { ProductTypeTemplate } from "@/data/productTypes";
import { type SimulationResult, toOutcomeRange, type Viability } from "@/engine";
import { formatApproxCount } from "@/lib/format";

/**
 * An instrument-style readout: the likely range of customers as a band, the break-even point as
 * a marker. Built with positioned HTML rather than a scaled SVG, so labels stay readable at
 * phone width.
 */
export function BreakEvenGauge({
  result,
  viability,
  template,
}: {
  result: SimulationResult;
  viability: Viability;
  template: ProductTypeTemplate;
}) {
  const o = toOutcomeRange(result.stages.paying, "paying");
  const needed = Math.ceil(viability.breakEvenCustomers);
  const max = Math.max(1, o.upside, needed) * 1.15;
  const share = (v: number) => Math.min(v, max) / max;
  const pct = (v: number) => `${share(v) * 100}%`;
  const chance = result.probPaybackWithin[viability.horizonMonths];
  const noun = template.customers;
  const caption =
    chance >= 0.5
      ? `Most simulated launches reach the break-even point of about ${formatApproxCount(needed)} ${noun}.`
      : `Most simulated launches land short of the break-even point of about ${formatApproxCount(needed)} ${noun}.`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  /** Keep a label inside the gauge near either edge. */
  const anchor = (v: number) =>
    share(v) > 0.85 ? "-translate-x-full" : share(v) < 0.15 ? "" : "-translate-x-1/2";

  return (
    <section aria-labelledby="gauge" className="flex flex-col gap-3">
      <h2 id="gauge" className="label">
        Likely {noun} compared with break-even
      </h2>
      <div
        role="img"
        aria-label={`Likely ${formatApproxCount(o.likely)} ${noun}, between ${formatApproxCount(o.downside)} and ${formatApproxCount(o.upside)}. About ${formatApproxCount(needed)} needed to earn back the spend.`}
        className="relative h-28 select-none"
      >
        <span
          className={`figures absolute top-0 text-xs font-medium whitespace-nowrap ${anchor(needed)}`}
          style={{ left: pct(needed) }}
        >
          ▼ needed {formatApproxCount(needed)}
        </span>
        <span
          className="absolute top-5 bottom-7 border-l border-dashed border-ink"
          style={{ left: pct(needed) }}
        />
        <span
          className={`figures absolute top-6 z-10 bg-bg px-1 text-xs whitespace-nowrap text-ink-muted ${anchor(o.likely)}`}
          style={{ left: pct(o.likely) }}
        >
          likely {formatApproxCount(o.likely)}
        </span>
        <span
          className="absolute top-11 bottom-9 border border-ink bg-ink/10"
          style={{
            left: pct(o.downside),
            width: `max(2px, ${(share(o.upside) - share(o.downside)) * 100}%)`,
          }}
        />
        <span className="absolute top-10 bottom-8 w-0.5 bg-ink" style={{ left: pct(o.likely) }} />
        <span className="absolute right-0 bottom-6 left-0 border-t border-ink-faint" />
        {ticks.map((t) => (
          <span
            key={t}
            className={`figures absolute bottom-0 text-[11px] text-ink-muted ${anchor(t)}`}
            style={{ left: pct(t) }}
          >
            {formatApproxCount(t)}
          </span>
        ))}
      </div>
      <p className="text-sm text-pretty text-ink-muted">
        {caption} The band runs from the downside to the upside: 10% of simulated launches did
        worse, and 10% did better.
      </p>
    </section>
  );
}
