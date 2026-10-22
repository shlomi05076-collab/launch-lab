"use client";

import { useEffect, useRef, useState } from "react";
import type { ScenarioInput } from "@/engine";
import { analyzeIdea, type IdeaAnalysis } from "@/guided/analyze";
import type { WorkerRequest, WorkerResponse } from "@/workers/simulation.worker";

export type AnalysisState =
  | { status: "running"; analysis: IdeaAnalysis | null }
  | { status: "done"; analysis: IdeaAnalysis }
  | { status: "error"; analysis: IdeaAnalysis | null; error: string };

const DEBOUNCE_MS = 250;

/**
 * Runs the simulation in a Web Worker (CLAUDE.md rule 6): debounced, and a newer request makes
 * any older answer stale. Falls back to the main thread where workers aren't available.
 */
export function useIdeaAnalysis(scenario: ScenarioInput | null): AnalysisState {
  const [state, setState] = useState<AnalysisState>({ status: "running", analysis: null });
  const worker = useRef<Worker | null>(null);
  const latest = useRef(0);
  const key = scenario ? JSON.stringify(scenario) : null;

  useEffect(() => {
    if (typeof Worker === "undefined") return;
    const w = new Worker(new URL("../workers/simulation.worker.ts", import.meta.url));
    w.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data;
      if (data.id !== latest.current) return; // a newer request is on its way
      setState((prev) =>
        data.ok
          ? { status: "done", analysis: data.analysis }
          : { status: "error", analysis: prev.analysis, error: data.error },
      );
    };
    worker.current = w;
    return () => {
      w.terminate();
      worker.current = null;
    };
  }, []);

  useEffect(() => {
    if (!key) return;
    const input = JSON.parse(key) as ScenarioInput;
    const id = ++latest.current;
    setState((prev) => ({ status: "running", analysis: prev.analysis }));
    const timer = setTimeout(() => {
      if (worker.current) {
        worker.current.postMessage({ id, scenario: input } satisfies WorkerRequest);
        return;
      }
      try {
        const analysis = analyzeIdea(input);
        if (id === latest.current) setState({ status: "done", analysis });
      } catch (error) {
        setState((prev) => ({ status: "error", analysis: prev.analysis, error: String(error) }));
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [key]);

  return state;
}
