"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { defaultModelAssumptions } from "@/data/modelDefaults";
import type { HorizonMonths } from "@/engine";
import type { IdeaAnswers } from "@/guided/answers";
import { toScenario } from "@/guided/toScenario";
import { useIdeaAnalysis } from "@/hooks/useIdeaAnalysis";
import { cheapTest } from "@/insights/cheapTests";
import { sourcesSplit, viabilityHeadline } from "@/insights/viability";
import { useIdeaStore } from "@/store/idea";
import { BreakEvenGauge } from "./BreakEvenGauge";
import { CheapTestCard } from "./CheapTestCard";
import { DropOff } from "./DropOff";
import { Glossary } from "./Glossary";
import { KeyNumbers } from "./KeyNumbers";
import { MustBeTrue } from "./MustBeTrue";

/** The guided results screen (docs/test-my-idea.md, "Results screen"). Headline first, always. */
export function IdeaResults({
  answers,
  onChangeAnswers,
  onStartOver,
  example = false,
}: {
  answers: IdeaAnswers;
  onChangeAnswers?: () => void;
  onStartOver?: () => void;
  example?: boolean;
}) {
  // "Now" (for the "not sure → next month" default) is read after mount: the page is prerendered,
  // and a date taken during prerender would differ from the visitor's.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const guided = useMemo(() => (now ? toScenario(answers, now) : null), [answers, now]);
  const [horizon, setHorizonState] = useState<HorizonMonths>(answers.horizon);
  const saveHorizon = useIdeaStore((s) => s.update);
  const setHorizon = (h: HorizonMonths) => {
    setHorizonState(h);
    if (!example) saveHorizon({ horizon: h });
  };
  const state = useIdeaAnalysis(guided?.scenario ?? null);

  if (!guided || !state.analysis) {
    return (
      <output className="label block py-24 text-center">Running 5,000 simulated launches…</output>
    );
  }

  const { scenario, template, defaultsUsed, notes } = guided;
  const { result } = state.analysis;
  const viability = state.analysis.viability[horizon];
  const headline = viabilityHeadline({ scenario, result, viability, template });
  const split = sourcesSplit(scenario, result, template);
  const test = cheapTest({
    scenario,
    viability,
    template,
    assumptions: defaultModelAssumptions(template.audience),
  });
  const hasSpend = viability.spend > 0;

  return (
    <div className="flex flex-col gap-12" aria-busy={state.status === "running"}>
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="label">
            {example ? "Example" : "Your idea"} · <span className="text-ink">{scenario.name}</span>
          </p>
          {onChangeAnswers && (
            <Button variant="quiet" onClick={onChangeAnswers}>
              ✎ Change answers
            </Button>
          )}
        </div>
        <h1 className="display text-xl leading-snug text-pretty sm:text-[2rem] sm:leading-tight">
          {headline}
        </h1>
        <Disclaimer />
        {defaultsUsed.length > 0 && (
          <p className="text-sm text-pretty text-ink-muted">
            {defaultsUsed.length} of your answers used typical values for {template.similar}:{" "}
            {defaultsUsed.join("; ")}. Change them if you know better.
          </p>
        )}
        {notes.map((n) => (
          <p key={n} className="text-sm text-warning">
            {n}
          </p>
        ))}
      </header>

      <KeyNumbers
        result={result}
        viability={viability}
        template={template}
        scenario={scenario}
        horizon={horizon}
        onHorizon={setHorizon}
        split={split}
      />
      {hasSpend && <BreakEvenGauge result={result} viability={viability} template={template} />}
      {hasSpend && <MustBeTrue viability={viability} template={template} scenario={scenario} />}
      {test && <CheapTestCard test={test} scenario={scenario} />}
      <DropOff result={result} template={template} scenario={scenario} />
      {/* Terms this page shows: downside/upside (tiles), break-even (gauge), CAC (drop-off). */}
      <Glossary
        texts={[
          headline,
          split ?? "",
          "downside upside",
          hasSpend ? "break-even" : "",
          hasSpend && Number.isFinite(result.paidCac.p50) ? "CAC" : "",
        ]}
      />

      <nav
        aria-label="Next steps"
        className="flex flex-wrap items-center gap-3 border-t border-rule pt-6"
      >
        {example ? (
          <ButtonLink href="/idea">Test my own idea</ButtonLink>
        ) : (
          <>
            {onChangeAnswers && <Button onClick={onChangeAnswers}>Change answers</Button>}
            {onStartOver && (
              <Button
                variant="secondary"
                onClick={() => {
                  if (window.confirm("Start a new idea? Your current answers will be cleared.")) {
                    onStartOver();
                  }
                }}
              >
                Start a new idea
              </Button>
            )}
          </>
        )}
        <Link
          href="/how-it-works"
          className="label px-2 underline decoration-rule underline-offset-4 hover:text-ink"
        >
          How this works →
        </Link>
      </nav>
    </div>
  );
}
