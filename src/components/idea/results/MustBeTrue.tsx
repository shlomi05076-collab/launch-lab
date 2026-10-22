import { AssumptionMarker } from "@/components/ui/AssumptionMarker";
import type { ProductTypeTemplate } from "@/data/productTypes";
import type { RequirementStatus, ScenarioInput, Viability } from "@/engine";
import { recordsFor } from "@/guided/provenance";
import { describeRequirement, horizonPhrase } from "@/insights/viability";
import { cn } from "@/lib/cn";

const STATUS_STYLE: Record<RequirementStatus, string> = {
  typical: "border-ink-faint text-ink",
  above_typical: "border-warning text-warning",
  rare: "border-risk text-risk",
};

/**
 * "What would have to be true": one row per key input, the value needed next to what similar
 * products achieve. The "matters most" row carries the screen's only accent.
 */
export function MustBeTrue({
  viability,
  template,
  scenario,
}: {
  viability: Viability;
  template: ProductTypeTemplate;
  scenario: ScenarioInput;
}) {
  const within = horizonPhrase(viability.horizonMonths);
  return (
    <section aria-labelledby="must" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="must" className="display text-2xl">
          What would have to be true
        </h2>
        <p className="max-w-prose text-sm text-pretty text-ink-muted">
          {viability.aboveBreakEven
            ? `How much room there is: each row shows how far one thing could slip, with everything else typical, before the spend stops being earned back ${within}.`
            : `To earn back the spend ${within}, any one of these would need to change, with everything else typical.`}
        </p>
      </div>

      <ul className="flex flex-col">
        {viability.requirements.map((req) => {
          const copy = describeRequirement(req, template, scenario);
          const mattersMost = viability.mattersMost === req.input;
          return (
            <li
              key={req.input}
              className={cn(
                "flex flex-col gap-2 border-b border-rule py-4 first:border-t",
                mattersMost && "border-l-2 border-l-accent pl-4",
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3
                  className={cn("text-[0.9375rem] font-medium", mattersMost && "text-accent-ink")}
                >
                  {copy.label}
                  {mattersMost && (
                    <span className="label ml-2 text-accent-ink">◀ matters most</span>
                  )}
                </h3>
                <span className={cn("label border px-2 py-0.5", STATUS_STYLE[req.status])}>
                  {copy.status}
                </span>
              </div>
              <p className="figures flex flex-wrap gap-x-4 text-sm">
                <span className="text-ink-muted">{copy.typical}</span>
                <span>{copy.needed}</span>
              </p>
              <AssumptionMarker records={recordsFor(req.input, template, scenario)} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
