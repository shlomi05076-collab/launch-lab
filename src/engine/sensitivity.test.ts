import { describe, expect, it } from "vitest";
import { defaultModelAssumptions } from "@/data/modelDefaults";
import { sampleScenarios } from "@/data/sampleScenarios";
import { expectedLaunch } from "./monteCarlo";
import { runSensitivity } from "./sensitivity";

const assumptions = defaultModelAssumptions();
const scenario = sampleScenarios[2] ?? sampleScenarios[0];
if (!scenario) throw new Error("sample scenarios missing");

describe("runSensitivity", () => {
  const result = runSensitivity(scenario, assumptions, "paying");

  it("uses the all-likely launch as its baseline", () => {
    expect(result.baseline).toBeCloseTo(expectedLaunch(scenario, assumptions).stages.paying, 9);
  });

  it("tests every uncertain input plus budget, price and audience", () => {
    // 3 funnel rates + 2 per channel + churn + 3 fixed inputs
    expect(result.bars).toHaveLength(3 + 2 * scenario.channels.length + 1 + 3);
    expect(result.bars.map((b) => b.input)).toContain("funnel.signupRate");
    expect(result.bars.map((b) => b.input)).toContain("channel.paid_social.clickThroughRate");
  });

  it("sorts bars by swing, largest first", () => {
    for (let i = 1; i < result.bars.length; i++) {
      expect(result.bars[i - 1]?.swing).toBeGreaterThanOrEqual(result.bars[i]?.swing as number);
    }
  });

  it("swings uncertain inputs between their P10 and P90, not their extremes", () => {
    const signup = result.bars.find((b) => b.input === "funnel.signupRate");
    expect(signup?.inputLow).toBeGreaterThan(scenario.funnel.signupRate.low);
    expect(signup?.inputHigh).toBeLessThan(scenario.funnel.signupRate.high);
    expect(signup?.metricAtHigh).toBeGreaterThan(signup?.metricAtLow as number);
  });

  it("price moves revenue but not the number of paying customers", () => {
    const pricePaying = result.bars.find((b) => b.input === "pricing.price");
    expect(pricePaying?.swing).toBe(0);
    const revenue = runSensitivity(scenario, assumptions, "revenue");
    expect(revenue.bars.find((b) => b.input === "pricing.price")?.swing).toBeGreaterThan(0);
  });

  it("a higher cost per 1,000 raises CAC", () => {
    const cacResult = runSensitivity(scenario, assumptions, "cac");
    const cost = cacResult.bars.find((b) => b.input === "channel.paid_social.costPerThousand");
    expect(cost?.metricAtHigh).toBeGreaterThan(cost?.metricAtLow as number);
  });

  it("omits churn for one-time pricing", () => {
    const oneTime = runSensitivity(
      { ...scenario, pricing: { model: "one_time", price: 300, grossMargin: 0.8 } },
      assumptions,
    );
    expect(oneTime.bars.map((b) => b.input)).not.toContain("pricing.monthlyChurn");
  });
});
