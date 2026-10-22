import { Choice, ChoiceGroup } from "@/components/ui/Choice";
import { NumberField } from "@/components/ui/NumberField";
import { audienceBands } from "@/data/guidedDefaults";
import { templateFor } from "@/guided/toScenario";
import { formatApproxCount } from "@/lib/format";
import type { StepProps } from "./types";

const EXAMPLES = {
  business: {
    niche: "A niche, like dental clinics in one country",
    specific: "A specific kind of business or role, like HR managers at small companies",
    broad: "A broad market, like most small businesses in a country",
  },
  people: {
    niche: "A niche hobby or need, like competitive rock climbers",
    specific: "A specific group, like new parents in one country",
    broad: "A broad audience, like people who cook at home",
  },
} as const;

export function StepAudience({ answers, update }: StepProps) {
  const audience = templateFor(answers).audience;
  const bands = ["niche", "specific", "broad"] as const;
  return (
    <ChoiceGroup
      legend="Roughly how many people could buy it?"
      hint="Count the people your ads could realistically reach, not the whole world. A rough size is plenty."
    >
      {bands.map((band) => (
        <Choice
          key={band}
          name="audience"
          checked={answers.audience === band}
          onChange={() => update({ audience: band })}
          label={EXAMPLES[audience][band]}
          description={`About ${formatApproxCount(audienceBands.value[band])} people`}
        />
      ))}
      <Choice
        name="audience"
        checked={answers.audience === "custom"}
        onChange={() => update({ audience: "custom" })}
        label="I know roughly how many"
      />
      {answers.audience === "custom" && (
        <div className="pl-7">
          <NumberField
            label="About how many people?"
            value={answers.audienceCustom}
            onChange={(n) => update({ audienceCustom: n === null ? null : Math.round(n) })}
            placeholder="e.g. 50,000"
            min={1}
          />
        </div>
      )}
      <Choice
        name="audience"
        notSure
        checked={answers.audience === "not_sure"}
        onChange={() => update({ audience: "not_sure" })}
        label="Not sure"
        description="We'll use the middle size, about 300,000 people, as a rough estimate."
      />
    </ChoiceGroup>
  );
}
