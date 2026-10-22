import type { Assumption } from "@/data/assumption";
import { channelBenchmarks, consumerChannelOverrides } from "@/data/channelBenchmarks";
import { type ProductTypeTemplate, productTypes } from "@/data/productTypes";
import type { RequirementInput, ScenarioInput } from "@/engine";

/** The assumption records behind a requirement's "similar products" value, for its marker. */
export function recordsFor(
  input: RequirementInput,
  template: ProductTypeTemplate,
  scenario: ScenarioInput,
): Assumption<unknown>[] {
  const fallback =
    template.audience === "people" ? productTypes.consumer_app : productTypes.service;
  switch (input) {
    case "signupRate":
      return [template.funnel.signupRate];
    case "payingRate":
      return [template.funnel.activationRate, template.funnel.paidConversion];
    case "price":
      return [template.pricing.price];
    case "monthlyChurn":
      return [template.pricing.monthlyChurn ?? fallback.pricing.monthlyChurn].filter(
        (r): r is NonNullable<typeof r> => r !== undefined,
      );
    case "purchasesPerYear":
      return [
        template.pricing.purchasesPerYear ?? productTypes.digital_product.pricing.purchasesPerYear,
      ].filter((r): r is NonNullable<typeof r> => r !== undefined);
    case "costPerVisitor":
      return scenario.channels.flatMap(({ channel }) => {
        const consumer =
          template.audience === "people" ? consumerChannelOverrides[channel] : undefined;
        return [
          consumer?.costPerThousand ?? channelBenchmarks[channel].costPerThousand,
          consumer?.clickThroughRate ?? channelBenchmarks[channel].clickThroughRate,
        ];
      });
  }
}
