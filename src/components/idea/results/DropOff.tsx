import type { ProductTypeTemplate } from "@/data/productTypes";
import type { ScenarioInput, SimulationResult } from "@/engine";
import { cn } from "@/lib/cn";
import { formatApproxCount, formatCurrency, formatOneIn } from "@/lib/format";

/** Where people drop off, in plain words: each step and how many continue to the next. */
export function DropOff({
  result,
  template,
  scenario,
}: {
  result: SimulationResult;
  template: ProductTypeTemplate;
  scenario: ScenarioInput;
}) {
  const s = result.stages;
  const steps = [
    { label: "Saw it", count: s.reach.p50 },
    { label: "Visited", count: s.visit.p50 },
    { label: template.stageNames.signup, count: s.signup.p50 },
    { label: template.stageNames.activation, count: s.activation.p50 },
    { label: template.stageNames.paying, count: s.paying.p50 },
  ];
  const rates = steps.slice(1).map((step, i) => {
    const before = steps[i]?.count ?? 0;
    return before > 0 ? step.count / before : 0;
  });
  const biggest = rates.indexOf(Math.min(...rates.filter((r) => r > 0)));
  const max = Math.max(1, steps[0]?.count ?? 1);
  const cac = result.paidCac.p50;

  return (
    <section aria-labelledby="dropoff" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="dropoff" className="display text-2xl">
          Where people drop off
        </h2>
        <p className="text-sm text-ink-muted">The likely numbers from the simulation.</p>
      </div>
      <ol className="flex flex-col">
        {steps.map((step, i) => {
          const rate = i > 0 ? rates[i - 1] : undefined;
          const isBiggest = i > 0 && i - 1 === biggest;
          return (
            <li
              key={step.label}
              className="grid grid-cols-[1fr_auto] gap-x-4 border-b border-rule py-2 first:border-t"
            >
              <span className={cn("text-sm", isBiggest && "font-medium")}>
                {step.label}
                {isBiggest && <span className="label ml-2">biggest drop</span>}
              </span>
              <span className="figures text-right text-sm">{formatApproxCount(step.count)}</span>
              <span className="col-span-2 mt-1 flex items-center gap-3">
                <span className="relative h-1 flex-1 bg-inset">
                  <span
                    className="absolute inset-y-0 left-0 bg-ink"
                    style={{ width: `${Math.max(0.5, Math.sqrt(step.count / max) * 100)}%` }}
                  />
                </span>
                {rate !== undefined && (
                  <span className="figures shrink-0 text-right text-xs whitespace-nowrap text-ink-muted">
                    {formatOneIn(rate)} continue
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-ink-muted">
        Bar lengths use a square-root scale so small steps stay visible.
      </p>
      {scenario.totalBudget > 0 && Number.isFinite(cac) && (
        <p className="text-sm text-pretty">
          Cost to win one {template.customers.replace(/s$/, "")} from ads (often called CAC): about{" "}
          <span className="figures">{formatCurrency(cac)}</span>.
        </p>
      )}
    </section>
  );
}
