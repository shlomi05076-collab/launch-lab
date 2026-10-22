import { Disclaimer } from "@/components/ui/Disclaimer";
import { defaultModelAssumptions } from "@/data/modelDefaults";
import { exampleScenario, productTypes } from "@/data/productTypes";
import { assessViability, PRODUCT_TYPES, type RequirementStatus, simulate } from "@/engine";
import { describeRequirement, viabilityHeadline } from "@/insights/viability";
import { cn } from "@/lib/cn";
import { formatApproxCount, formatPercent } from "@/lib/format";

/*
 * Temporary M2 readout: each product type's example (every guided answer "not sure"), run
 * through the viability math. The guided flow and its real results screen arrive in M3.
 * Computed at build time, so the page stays static.
 */

const examples = PRODUCT_TYPES.map((type) => {
  const template = productTypes[type];
  const scenario = exampleScenario(type);
  const assumptions = defaultModelAssumptions(template.audience);
  const result = simulate(scenario, assumptions);
  const viability = assessViability(scenario, assumptions, {
    typicalPrice: template.pricing.price.value,
  });
  return {
    template,
    scenario,
    result,
    viability,
    headline: viabilityHeadline({ scenario, result, viability, template }),
  };
});

const capitalize = (s: string) => `${s[0]?.toUpperCase() ?? ""}${s.slice(1)}`;

const statusClass: Record<RequirementStatus, string> = {
  typical: "text-ink",
  above_typical: "text-warning",
  rare: "text-risk",
};

export function ProductTypeReadout() {
  return (
    <section aria-labelledby="types" className="mb-14">
      <h2 id="types" className="display mb-2 text-3xl">
        What would have to be true, by product type
      </h2>
      <p className="mb-8 max-w-3xl text-pretty text-ink-muted">
        Each example answers every question with "not sure": a $5,000 example budget over two
        months, a mid-sized audience, and the typical price and starting channels for that kind of
        product. Rows change one thing at a time and keep the rest typical.
      </p>

      <div className="flex flex-col gap-10">
        {examples.map(({ template, scenario, result, viability, headline }) => (
          <article key={template.id} className="border-t border-rule pt-5">
            <p className="label mb-2">{template.choice}</p>
            <p className="display mb-2 max-w-4xl text-xl text-pretty sm:text-2xl">{headline}</p>
            <Disclaimer className="mb-4" />
            <dl className="mb-4 flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <dt className="label">{capitalize(template.customers)} needed to earn it back</dt>
                <dd className="figures text-lg">
                  {formatApproxCount(Math.ceil(viability.breakEvenCustomers))}
                </dd>
              </div>
              <div>
                <dt className="label">Chance to earn back the spend within a year</dt>
                <dd className="figures text-lg">{formatPercent(result.probPaybackWithin[12])}</dd>
              </div>
            </dl>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                <caption className="sr-only">What would have to be true: {template.choice}</caption>
                <thead>
                  <tr className="border-b border-rule">
                    {["What would have to be true", "Similar products", "Needed", "Status"].map(
                      (h) => (
                        <th key={h} scope="col" className="label py-2 pr-4 font-normal">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {viability.requirements.map((req) => {
                    const copy = describeRequirement(req, template, scenario);
                    const mattersMost = viability.mattersMost === req.input;
                    return (
                      <tr key={req.input} className="border-b border-rule last:border-b-0">
                        <th
                          scope="row"
                          className={cn("py-2 pr-4 font-normal", mattersMost && "text-accent-ink")}
                        >
                          {copy.label}
                          {mattersMost && <span className="label ml-2">◀ matters most</span>}
                        </th>
                        <td className="figures py-2 pr-4 text-ink-muted">{copy.typical}</td>
                        <td className="figures py-2 pr-4">{copy.needed}</td>
                        <td className={cn("py-2", statusClass[req.status])}>
                          {copy.status}
                          {copy.detail && (
                            <span className="block text-xs text-ink-muted">{copy.detail}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
