/**
 * Guards the "every default is a labeled assumption" rule: each record has a source, a date
 * and a one-line why, and docs/model.md documents every one of them.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHANNEL_IDS, type Range } from "@/engine";
import type { Assumption } from "./assumption";
import { channelBenchmarks, consumerChannelOverrides } from "./channelBenchmarks";
import { guidedAssumptionRecords } from "./guidedDefaults";
import { modelAssumptionRecords, seasonalityCost, seasonalityDemand } from "./modelDefaults";
import { productTypeAssumptionRecords, productTypes } from "./productTypes";
import { sampleScenarios } from "./sampleScenarios";

const channelRecords: Assumption<unknown>[] = CHANNEL_IDS.flatMap((id) =>
  Object.values(channelBenchmarks[id]),
);
const consumerRecords: Assumption<unknown>[] = Object.values(consumerChannelOverrides).flatMap(
  (records) => Object.values(records ?? {}),
);
const allRecords = [
  ...channelRecords,
  ...consumerRecords,
  ...modelAssumptionRecords,
  ...productTypeAssumptionRecords,
  ...guidedAssumptionRecords,
];
const modelDoc = readFileSync(new URL("../../docs/model.md", import.meta.url), "utf8");

const isRange = (v: unknown): v is Range =>
  typeof v === "object" && v !== null && "low" in v && "likely" in v && "high" in v;

describe("assumption records", () => {
  it("have unique ids", () => {
    const ids = allRecords.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(
    allRecords.map((r) => [r.id, r] as const),
  )("%s has a source, a date and a why", (_, r) => {
    expect(r.label.length).toBeGreaterThan(0);
    expect(r.source.length).toBeGreaterThan(0);
    expect(r.asOf).toMatch(/^\d{4}(-(0[1-9]|1[0-2]))?$/);
    expect(r.why.length).toBeGreaterThan(10);
    expect(r.why.length).toBeLessThanOrEqual(140); // one line
    if (r.sourceUrl) expect(r.sourceUrl).toMatch(/^https:\/\//);
  });

  it.each(allRecords.map((r) => [r.id] as const))("%s is documented in docs/model.md", (id) => {
    expect(modelDoc).toContain(`\`${id}\``);
  });

  it.each(
    allRecords.filter((r) => isRange(r.value)).map((r) => [r.id, r.value as Range] as const),
  )("%s is a valid range", (_, range) => {
    expect(range.low).toBeLessThanOrEqual(range.likely);
    expect(range.likely).toBeLessThanOrEqual(range.high);
    expect(range.low).toBeGreaterThanOrEqual(0);
  });

  it("rates are fractions between 0 and 1", () => {
    const rates = allRecords.filter(
      (r) =>
        /clickThroughRate|signupRate|activationRate|paidConversion|monthlyChurn/.test(r.id) &&
        isRange(r.value),
    );
    expect(rates.length).toBeGreaterThan(20);
    for (const r of rates) expect((r.value as Range).high).toBeLessThanOrEqual(1);
  });
});

describe("product type templates", () => {
  const JARGON = /\b(CAC|churn|conversion|funnel|CPM|CTR|LTV)\b/i;

  it.each(
    Object.values(productTypes).map((t) => [t.id, t] as const),
  )("%s is internally consistent and jargon-free", (_, template) => {
    const { pricing } = template;
    if (pricing.model === "subscription") expect(pricing.monthlyChurn).toBeDefined();
    else expect(pricing.purchasesPerYear).toBeDefined();
    if (pricing.purchasesPerYear) {
      expect(pricing.purchasesPerYear.value.low).toBeGreaterThanOrEqual(1);
    }
    expect(pricing.grossMargin.value).toBeGreaterThan(0);
    expect(pricing.grossMargin.value).toBeLessThan(1);
    expect(template.starterChannels.value.length).toBeGreaterThanOrEqual(1);
    expect(template.starterChannels.value.length).toBeLessThanOrEqual(4);
    for (const text of [template.choice, template.labels.signup, template.labels.paying]) {
      expect(text).not.toMatch(JARGON);
    }
  });
});

describe("seasonality indices", () => {
  it.each([
    ["cost", seasonalityCost.value],
    ["demand", seasonalityDemand.value],
  ])("%s has 12 months averaging about 1", (_, index) => {
    expect(index).toHaveLength(12);
    const mean = index.reduce((a, b) => a + b, 0) / 12;
    expect(mean).toBeGreaterThan(0.98);
    expect(mean).toBeLessThan(1.02);
  });
});

describe("sample scenarios", () => {
  it("are three distinct, fair comparisons", () => {
    expect(sampleScenarios).toHaveLength(3);
    expect(new Set(sampleScenarios.map((s) => s.id)).size).toBe(3);
    expect(new Set(sampleScenarios.map((s) => s.seed)).size).toBe(3);
    // Same budget, audience and window: only the channel mix differs.
    expect(new Set(sampleScenarios.map((s) => s.totalBudget)).size).toBe(1);
    expect(new Set(sampleScenarios.map((s) => s.audienceSize)).size).toBe(1);
  });

  it.each(
    sampleScenarios.map((s) => [s.name, s] as const),
  )("%s uses 1–4 channels with shares summing to 1", (_, s) => {
    expect(s.channels.length).toBeGreaterThanOrEqual(1);
    expect(s.channels.length).toBeLessThanOrEqual(4);
    expect(s.channels.reduce((sum, c) => sum + c.budgetShare, 0)).toBeCloseTo(1, 10);
    expect(new Set(s.channels.map((c) => c.channel)).size).toBe(s.channels.length);
  });
});
