import { useState } from "react";
import { Choice, ChoiceGroup } from "@/components/ui/Choice";
import { NumberField } from "@/components/ui/NumberField";
import { formatCurrency } from "@/lib/format";
import type { StepProps } from "./types";

const QUICK = [1000, 5000, 10_000, 25_000];

export function StepBudget({ answers, update }: StepProps) {
  const budget = answers.budget;
  const quick = typeof budget === "number" && QUICK.includes(budget);
  const [other, setOther] = useState(typeof budget === "number" && budget > 0 && !quick);

  return (
    <ChoiceGroup
      legend="Your marketing budget for the launch"
      hint="Only money for ads and promotion, not for building the product."
    >
      {QUICK.map((amount) => (
        <Choice
          key={amount}
          name="budget"
          checked={!other && budget === amount}
          onChange={() => {
            setOther(false);
            update({ budget: amount });
          }}
          label={formatCurrency(amount)}
        />
      ))}
      <Choice
        name="budget"
        checked={other}
        onChange={() => {
          setOther(true);
          update({ budget: null });
        }}
        label="Another amount"
      />
      {other && (
        <div className="pl-7">
          <NumberField
            label="Amount"
            prefix="$"
            value={typeof budget === "number" ? budget : null}
            onChange={(n) => update({ budget: n })}
            placeholder="e.g. 3,000"
          />
        </div>
      )}
      <Choice
        name="budget"
        checked={!other && budget === 0}
        onChange={() => {
          setOther(false);
          update({ budget: 0 });
        }}
        label="Nothing on ads"
        description="I'll only promote it myself. You can say how much time you'll put in later."
      />
      <Choice
        name="budget"
        notSure
        checked={budget === "not_sure"}
        onChange={() => {
          setOther(false);
          update({ budget: "not_sure" });
        }}
        label="Not sure"
        description="We'll use $5,000 as an example amount. It's not a recommendation; change it any time."
      />
    </ChoiceGroup>
  );
}
