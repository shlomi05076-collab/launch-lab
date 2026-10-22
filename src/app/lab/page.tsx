import type { Metadata } from "next";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { defaultModelAssumptions } from "@/data/modelDefaults";
import { sampleProduct, sampleScenarios } from "@/data/sampleScenarios";
import {
  CHANNEL_LABELS,
  DEFAULT_RUNS,
  type Dist,
  type OutcomeMetric,
  runSensitivity,
  simulate,
  toOutcomeRange,
} from "@/engine";
import { formatCount, formatCurrency, formatMonths, formatPercent } from "@/lib/format";
import { site } from "@/lib/site";
import { ProductTypeReadout } from "./ProductTypeReadout";

export const metadata: Metadata = { title: "Engine readout" };

/*
 * Temporary M1 readout: the engine's results for the sample scenarios as a plain table.
 * Computed at build time (the engine is pure), so the page is static. The real lab is M2.
 */

const assumptions = defaultModelAssumptions();
const results = sampleScenarios.map((scenario) => ({
  scenario,
  result: simulate(scenario, assumptions),
  topDriver: runSensitivity(scenario, assumptions, "paying").bars[0],
}));

type Row = {
  label: string;
  metric: OutcomeMetric;
  pick: (r: (typeof results)[number]["result"]) => Dist;
  format: (n: number) => string;
};

const rows: Row[] = [
  {
    label: "Paying customers",
    metric: "paying",
    pick: (r) => r.stages.paying,
    format: formatCount,
  },
  { label: "Revenue in window", metric: "revenue", pick: (r) => r.revenue, format: formatCurrency },
  { label: "MRR at end", metric: "mrrAtEnd", pick: (r) => r.mrrAtEnd, format: formatCurrency },
  { label: "Blended CAC", metric: "cac", pick: (r) => r.cac, format: formatCurrency },
  { label: "Payback", metric: "paybackMonths", pick: (r) => r.paybackMonths, format: formatMonths },
];

const funnelRows = [
  ["Reached", "reach"],
  ["Visited", "visit"],
  ["Signed up", "signup"],
  ["Activated", "activation"],
  ["Paying", "paying"],
] as const;

export default function LabPage() {
  const first = sampleScenarios[0];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-10 flex max-w-3xl flex-col gap-3">
        <p className="label">M2 · engine readout · temporary</p>
        <h1 className="display text-4xl">Simulation engine</h1>
        <p className="text-pretty text-ink-muted">
          What the engine and the viability math produce today. The guided "Test my idea" flow
          arrives in M3, and the interactive expert lab in M4.
        </p>
      </header>

      <ProductTypeReadout />

      <section aria-labelledby="example" className="flex flex-col gap-3">
        <h2 id="example" className="display text-3xl">
          Example: one product, three launch plans
        </h2>
        <p className="max-w-3xl text-pretty text-ink-muted">
          {sampleProduct.name} ({sampleProduct.description}, ${first?.pricing.price}/month) launched
          three ways with the same {formatCurrency(first?.totalBudget ?? 0)} budget over{" "}
          {first?.window.weeks} weeks. {formatCount(DEFAULT_RUNS)} simulated launches each. Each
          cell shows the likely outcome with the downside and upside beneath it: 10% of simulated
          launches did worse than the downside, and 10% did better than the upside.
        </p>
        <Disclaimer className="mb-2" />
      </section>

      <div className="overflow-x-auto border border-rule">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <caption className="sr-only">
            Likely, downside and upside outcomes for three launch plans
          </caption>
          <thead>
            <tr className="border-b border-rule bg-surface">
              <th scope="col" className="label p-3 font-normal">
                Metric
              </th>
              {results.map(({ scenario }) => (
                <th key={scenario.id} scope="col" className="p-3 align-bottom">
                  <span className="display block text-lg">{scenario.name}</span>
                  <span className="text-xs text-ink-muted">
                    {scenario.channels
                      .map(
                        (c) => `${CHANNEL_LABELS[c.channel]} ${Math.round(c.budgetShare * 100)}%`,
                      )
                      .join(" · ")}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-rule">
                <th scope="row" className="p-3 text-sm font-normal text-ink-muted">
                  {row.label}
                </th>
                {results.map(({ scenario, result }) => {
                  const o = toOutcomeRange(row.pick(result), row.metric);
                  return (
                    <td key={scenario.id} className="p-3">
                      <span className="figures block text-lg">{row.format(o.likely)}</span>
                      <span className="figures block text-xs text-ink-muted">
                        {row.format(o.downside)} ↔ {row.format(o.upside)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-b border-rule">
              <th scope="row" className="p-3 text-sm font-normal text-ink-muted">
                Pays back within 12 months
              </th>
              {results.map(({ scenario, result }) => (
                <td key={scenario.id} className="figures p-3 text-lg">
                  {formatPercent(result.probPaybackWithin12)}
                  <span className="block text-xs text-ink-muted">
                    never: {formatPercent(result.probNeverPayback)}
                  </span>
                </td>
              ))}
            </tr>
            <tr className="border-b border-rule">
              <th scope="row" className="p-3 text-sm font-normal text-ink-muted">
                Matters most
              </th>
              {results.map(({ scenario, topDriver }) => (
                <td key={scenario.id} className="p-3 text-sm">
                  {topDriver?.label}
                </td>
              ))}
            </tr>
            {funnelRows.map(([label, stage]) => (
              <tr key={stage} className="border-b border-rule last:border-b-0">
                <th scope="row" className="p-3 text-sm font-normal text-ink-muted">
                  Funnel · {label} (likely)
                </th>
                {results.map(({ scenario, result }) => (
                  <td key={scenario.id} className="figures p-3">
                    {formatCount(result.stages[stage].p50)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-ink-muted">
        How these numbers are made, with every assumption and its source:{" "}
        <a
          href={`${site.repoUrl}/blob/main/docs/model.md`}
          className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
        >
          docs/model.md
        </a>
        .
      </p>
    </div>
  );
}
