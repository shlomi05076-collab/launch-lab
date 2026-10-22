import { defaultModelAssumptions } from "@/data/modelDefaults";
import { productTypes } from "@/data/productTypes";
import {
  assessViability,
  HORIZONS,
  type HorizonMonths,
  type ScenarioInput,
  type SimulationResult,
  simulate,
  type Viability,
} from "@/engine";

export type IdeaAnalysis = {
  result: SimulationResult;
  /** Viability for each "earn it back within" horizon, so switching is instant. */
  viability: Record<HorizonMonths, Viability>;
};

/** Everything the guided results screen needs. Pure; runs in the simulation worker. */
export function analyzeIdea(scenario: ScenarioInput): IdeaAnalysis {
  const template = productTypes[scenario.productType];
  const assumptions = defaultModelAssumptions(template.audience);
  const typicalPrice = template.pricing.price.value;
  return {
    result: simulate(scenario, assumptions),
    viability: Object.fromEntries(
      HORIZONS.map((h) => [
        h,
        assessViability(scenario, assumptions, { typicalPrice, horizonMonths: h }),
      ]),
    ) as Record<HorizonMonths, Viability>,
  };
}
