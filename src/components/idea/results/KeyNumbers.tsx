import { saasCacPaybackMonths } from "@/data/modelDefaults";
import type { ProductTypeTemplate } from "@/data/productTypes";
import {
  HORIZONS,
  type HorizonMonths,
  type ScenarioInput,
  type SimulationResult,
  toOutcomeRange,
  type Viability,
} from "@/engine";
import { chanceByHorizon, horizonNote, horizonPhrase } from "@/insights/viability";
import { cn } from "@/lib/cn";
import { formatApproxCount, formatCurrency, formatPercent } from "@/lib/format";

/** The three numbers, plus the "earn it back within" switch (1, 2 or 3 years). */
export function KeyNumbers({
  result,
  viability,
  template,
  scenario,
  horizon,
  onHorizon,
  split,
}: {
  result: SimulationResult;
  viability: Viability;
  template: ProductTypeTemplate;
  scenario: ScenarioInput;
  horizon: HorizonMonths;
  onHorizon: (h: HorizonMonths) => void;
  split: string | null;
}) {
  const customers = toOutcomeRange(result.stages.paying, "paying");
  const noun = template.customers;
  const hasSpend = viability.spend > 0;
  const within = horizonPhrase(horizon);

  return (
    <section aria-labelledby="numbers" className="flex flex-col gap-5">
      <h2 id="numbers" className="sr-only">
        The key numbers
      </h2>

      {hasSpend && (
        <fieldset className="flex flex-wrap items-center gap-3">
          <legend className="label float-left mr-3">Earn it back within</legend>
          <div className="inline-flex border border-rule p-0.5">
            {HORIZONS.map((h) => (
              <label
                key={h}
                className={cn(
                  "label flex min-h-10 cursor-pointer items-center px-3 pointer-coarse:min-h-11",
                  "has-focus-visible:outline-2 has-focus-visible:outline-ink",
                  h === horizon ? "bg-ink text-bg" : "hover:text-ink",
                )}
              >
                <input
                  type="radio"
                  name="horizon"
                  className="sr-only"
                  checked={h === horizon}
                  onChange={() => onHorizon(h)}
                />
                {h / 12} {h === 12 ? "year" : "years"}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <dl className="grid gap-px border-y border-rule bg-rule sm:grid-cols-3">
        <Tile label={`${capitalize(noun)} you'd likely get`}>
          <dd className="figures text-3xl leading-none">{formatApproxCount(customers.likely)}</dd>
          <dd className="figures text-xs text-ink-muted">
            {formatApproxCount(customers.downside)} ↔ {formatApproxCount(customers.upside)}{" "}
            <span className="font-sans">downside ↔ upside</span>
          </dd>
        </Tile>
        <Tile label={`${capitalize(noun)} needed to earn it back`}>
          <dd className="figures text-3xl leading-none">
            {hasSpend ? formatApproxCount(Math.ceil(viability.breakEvenCustomers)) : "–"}
          </dd>
          <dd className="text-xs text-pretty text-ink-muted">
            {hasSpend
              ? `${formatCurrency(viability.spend)} ÷ about ${formatCurrency(viability.customerValue)}, what one ${noun.replace(/s$/, "")} brings in (after costs) ${within}`
              : "No ad spend to earn back"}
          </dd>
        </Tile>
        <Tile label={`Chance to earn back the spend ${within}`}>
          <dd className="figures text-3xl leading-none">
            {hasSpend ? formatPercent(result.probPaybackWithin[horizon]) : "–"}
          </dd>
          <dd className="text-xs text-ink-muted">of 5,000 simulated launches</dd>
        </Tile>
      </dl>

      {hasSpend && (
        <div className="flex flex-col gap-1 text-sm text-pretty">
          <p className="figures">{chanceByHorizon(result)}</p>
          <p className="text-ink-muted">
            {horizonNote(scenario, saasCacPaybackMonths.value, template.audience)}
          </p>
        </div>
      )}
      {split && <p className="text-sm text-pretty">{split}</p>}
    </section>
  );
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 bg-bg py-4 sm:pr-4">
      <dt className="label">{label}</dt>
      {children}
    </div>
  );
}

function capitalize(s: string) {
  return `${s[0]?.toUpperCase() ?? ""}${s.slice(1)}`;
}
