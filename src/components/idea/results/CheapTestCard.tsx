import type { ScenarioInput } from "@/engine";
import type { CheapTest } from "@/insights/cheapTests";
import { formatCurrency } from "@/lib/format";

/** "How to test this cheaply": one real-world test of the riskiest assumption. */
export function CheapTestCard({ test, scenario }: { test: CheapTest; scenario: ScenarioInput }) {
  const lead =
    scenario.totalBudget > 0 && test.budget > 0
      ? `Before spending ${formatCurrency(scenario.totalBudget)}, test the assumption that matters most for about ${formatCurrency(test.budget)}.`
      : "Before you put in the time, test the assumption that matters most.";
  return (
    <section aria-labelledby="cheap" className="flex flex-col gap-4 border border-ink p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="cheap" className="display text-2xl">
          How to test this cheaply
        </h2>
        <p className="text-pretty text-ink-muted">{lead}</p>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="label text-ink">{test.title}</h3>
        <p className="text-pretty">{test.steps}</p>
        <p className="text-pretty font-medium">{test.passMark}</p>
        <p className="text-sm text-pretty text-ink-muted">
          If it doesn't hold up yet, that's useful too: it tells you what to work on before spending
          more.
        </p>
      </div>
      {test.notes.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-rule pt-3 text-sm text-pretty text-ink-muted">
          {test.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
