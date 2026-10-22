import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { EMPTY_ANSWERS, type IdeaAnswers, parseAnswers } from "@/guided/answers";

/**
 * The guided draft, autosaved in the browser (no account, no backend). The saved value is
 * untrusted, so it's re-validated with Zod on load and replaced by a fresh draft if invalid.
 */

/** 0 = name, 1–6 = questions, 7 = check your answers, 8 = results. */
export const STEP = { name: 0, firstQuestion: 1, review: 7, results: 8 } as const;

type IdeaState = {
  answers: IdeaAnswers;
  step: number;
  update: (patch: Partial<IdeaAnswers>) => void;
  goTo: (step: number) => void;
  reset: () => void;
};

export const useIdeaStore = create<IdeaState>()(
  persist(
    (set) => ({
      answers: EMPTY_ANSWERS,
      step: STEP.name,
      update: (patch) => set((s) => ({ answers: { ...s.answers, ...patch } })),
      goTo: (step) => set({ step: Math.min(STEP.results, Math.max(STEP.name, step)) }),
      reset: () => set({ answers: EMPTY_ANSWERS, step: STEP.name }),
    }),
    {
      name: "launch-lab:idea-draft",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ answers: s.answers, step: s.step }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as { answers?: unknown; step?: unknown };
        const step = typeof saved.step === "number" ? saved.step : STEP.name;
        return {
          ...current,
          answers: parseAnswers(saved.answers),
          step: Math.min(STEP.results, Math.max(STEP.name, Math.round(step))),
        };
      },
      // Rehydrated explicitly after mount, so the server and first client render agree.
      skipHydration: true,
    },
  ),
);
