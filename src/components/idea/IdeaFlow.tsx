"use client";

import { useEffect, useState } from "react";
import { isAnswered, QUESTIONS } from "@/guided/answers";
import { STEP, useIdeaStore } from "@/store/idea";
import { QuestionShell } from "./QuestionShell";
import { IdeaResults } from "./results/IdeaResults";
import { StepAudience } from "./steps/StepAudience";
import { StepBudget } from "./steps/StepBudget";
import { StepChannels } from "./steps/StepChannels";
import { StepCharge } from "./steps/StepCharge";
import { StepKind } from "./steps/StepKind";
import { StepReview } from "./steps/StepReview";
import { StepTiming } from "./steps/StepTiming";

const TITLES: Record<(typeof QUESTIONS)[number], { title: string; intro?: string }> = {
  kind: { title: "What are you selling?" },
  audience: { title: "Who buys it?" },
  charge: { title: "How will you charge, and how much?" },
  budget: { title: "How much could you spend on marketing?" },
  timing: { title: "When do you want to launch?" },
  channels: {
    title: "How will people find out about it?",
    intro: "Pick the ways you're thinking about. Not sure is fine.",
  },
};

/** The guided "Test my idea" flow: an optional name, six questions, a review, then results. */
export function IdeaFlow() {
  const { answers, step, update, goTo, reset } = useIdeaStore();
  const [hydrated, setHydrated] = useState(false);

  // Restore the autosaved draft after mount (the server render always starts empty).
  useEffect(() => {
    void Promise.resolve(useIdeaStore.persist.rehydrate()).then(() => setHydrated(true));
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to the top on every step change
  useEffect(() => {
    if (hydrated) window.scrollTo({ top: 0 });
  }, [step, hydrated]);

  if (!hydrated) return <p className="label py-20 text-center">Loading your draft…</p>;

  if (step >= STEP.results) {
    return (
      <IdeaResults
        answers={answers}
        onChangeAnswers={() => goTo(STEP.review)}
        onStartOver={reset}
      />
    );
  }

  if (step === STEP.name) {
    return (
      <QuestionShell
        key="name"
        number={null}
        title="Let's test your idea"
        intro="Six short questions in plain words, then a quick check of your answers. Every question has a “not sure” answer, it takes about two minutes, and nothing leaves your browser."
        canContinue
        onNext={() => goTo(STEP.firstQuestion)}
        nextLabel="Start"
      >
        <label className="flex flex-col gap-1.5">
          <span className="label">Give your idea a name (optional)</span>
          <input
            value={answers.name}
            onChange={(e) => update({ name: e.target.value.slice(0, 80) })}
            placeholder="e.g. Meal-prep planner"
            className="min-h-12 border border-rule bg-surface px-3 text-lg focus:border-ink"
          />
          <span className="text-sm text-ink-muted">Only used to label your results.</span>
        </label>
      </QuestionShell>
    );
  }

  if (step === STEP.review) {
    return (
      <QuestionShell
        key="review"
        number={7}
        title="Check your answers"
        canContinue
        onBack={() => goTo(STEP.review - 1)}
        onNext={() => goTo(STEP.results)}
        nextLabel="See what would have to be true"
      >
        <StepReview
          answers={answers}
          update={update}
          onEdit={(i) => goTo(STEP.firstQuestion + i)}
        />
      </QuestionShell>
    );
  }

  const question = QUESTIONS[step - STEP.firstQuestion] ?? "kind";
  const props = { answers, update };
  const body = {
    kind: <StepKind {...props} />,
    audience: <StepAudience {...props} />,
    charge: <StepCharge {...props} />,
    budget: <StepBudget {...props} />,
    timing: <StepTiming {...props} />,
    channels: <StepChannels {...props} />,
  }[question];

  return (
    <QuestionShell
      key={question}
      number={step}
      title={TITLES[question].title}
      intro={TITLES[question].intro}
      canContinue={isAnswered(question, answers)}
      onBack={() => goTo(step - 1)}
      onNext={() => goTo(step + 1)}
    >
      {body}
    </QuestionShell>
  );
}
