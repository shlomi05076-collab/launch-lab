import { Choice, ChoiceGroup } from "@/components/ui/Choice";
import { productTypes } from "@/data/productTypes";
import { PRODUCT_TYPES } from "@/engine";
import type { StepProps } from "./types";

export function StepKind({ answers, update }: StepProps) {
  return (
    <div className="flex flex-col gap-8">
      <ChoiceGroup legend="Pick the closest one">
        {PRODUCT_TYPES.map((type) => (
          <Choice
            key={type}
            name="kind"
            checked={answers.kind === type}
            onChange={() => update({ kind: type, forWhom: null, charge: null, purchases: null })}
            label={productTypes[type].choice}
          />
        ))}
        <Choice
          name="kind"
          notSure
          checked={answers.kind === "not_sure"}
          onChange={() => update({ kind: "not_sure", charge: null, purchases: null })}
          label="Something else, or not sure"
          description="One more quick question, and we'll use typical numbers for that kind of product."
        />
      </ChoiceGroup>

      {answers.kind === "not_sure" && (
        <ChoiceGroup legend="Is it for businesses or for people?">
          <Choice
            name="forWhom"
            checked={answers.forWhom === "business"}
            onChange={() => update({ forWhom: "business" })}
            label="For businesses"
            description="Other companies or professionals pay for it."
          />
          <Choice
            name="forWhom"
            checked={answers.forWhom === "people"}
            onChange={() => update({ forWhom: "people" })}
            label="For people"
            description="Individuals pay for it themselves."
          />
        </ChoiceGroup>
      )}
    </div>
  );
}
