/// <reference lib="webworker" />
import type { ScenarioInput } from "@/engine";
import { analyzeIdea, type IdeaAnalysis } from "@/guided/analyze";

/** Runs the 5,000-launch simulation and viability math off the main thread. */

export type WorkerRequest = { id: number; scenario: ScenarioInput };
export type WorkerResponse =
  | { id: number; ok: true; analysis: IdeaAnalysis }
  | { id: number; ok: false; error: string };

const scope = self as unknown as DedicatedWorkerGlobalScope;

scope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, scenario } = event.data;
  try {
    scope.postMessage({ id, ok: true, analysis: analyzeIdea(scenario) } satisfies WorkerResponse);
  } catch (error) {
    scope.postMessage({ id, ok: false, error: String(error) } satisfies WorkerResponse);
  }
};
