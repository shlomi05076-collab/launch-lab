import { Choice, ChoiceGroup } from "@/components/ui/Choice";
import { NumberField } from "@/components/ui/NumberField";
import { templateFor } from "@/guided/toScenario";
import { formatCurrency } from "@/lib/format";
import type { StepProps } from "./types";

export function StepCharge({ answers, update }: StepProps) {
  const template = templateFor(answers);
  const model = answers.charge ?? template.pricing.model;
  const typical = template.pricing.price.value;
  const perMonth = model === "subscription";
  const service = template.id === "service";

  return (
    <div className="flex flex-col gap-8">
      <ChoiceGroup legend="How do people pay?">
        <Choice
          name="charge"
          checked={model === "subscription"}
          onChange={() => update({ charge: "subscription", purchases: null })}
          label={service ? "A monthly retainer" : "Every month"}
        />
        <Choice
          name="charge"
          checked={model === "one_time"}
          onChange={() => update({ charge: "one_time" })}
          label={service ? "Per project" : "Once, when they buy"}
        />
      </ChoiceGroup>

      <ChoiceGroup
        legend={perMonth ? "How much a month?" : "How much per purchase?"}
        hint={`${capitalize(template.similar)} usually charge ${formatCurrency(typical.low)}–${formatCurrency(typical.high)}${perMonth ? " a month" : ""}.`}
      >
        <Choice
          name="price"
          checked={typeof answers.price === "number" || answers.price === null}
          onChange={() => update({ price: null })}
          label="I have a price in mind"
        />
        {answers.price !== "not_sure" && (
          <div className="pl-7">
            <NumberField
              label="Price"
              prefix="$"
              suffix={perMonth ? "a month" : undefined}
              value={typeof answers.price === "number" ? answers.price : null}
              onChange={(n) => update({ price: n === null || n <= 0 ? null : n })}
              placeholder={`e.g. ${typical.likely}`}
            />
          </div>
        )}
        <Choice
          name="price"
          notSure
          checked={answers.price === "not_sure"}
          onChange={() => update({ price: "not_sure" })}
          label="Not sure"
          description={`We'll use what ${template.similar} usually charge: about ${formatCurrency(typical.likely)}${perMonth ? " a month" : ""}.`}
        />
      </ChoiceGroup>

      {model === "one_time" && (
        <ChoiceGroup
          legend="How many times would the same customer usually buy in their first year?"
          hint="Repeat buyers help earn back what you spend on ads."
        >
          {([1, 2, 3] as const).map((n) => (
            <Choice
              key={n}
              name="purchases"
              checked={answers.purchases === n}
              onChange={() => update({ purchases: n })}
              label={n === 1 ? "Just once" : n === 2 ? "2 times" : "3 or more"}
            />
          ))}
          <Choice
            name="purchases"
            notSure
            checked={answers.purchases === "not_sure" || answers.purchases === null}
            onChange={() => update({ purchases: "not_sure" })}
            label="Not sure"
            description={`We'll use what ${template.similar} usually see.`}
          />
        </ChoiceGroup>
      )}
    </div>
  );
}

function capitalize(s: string) {
  return `${s[0]?.toUpperCase() ?? ""}${s.slice(1)}`;
}
