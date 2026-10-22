import { Choice, ChoiceGroup } from "@/components/ui/Choice";
import { CHANNEL_IDS, type ChannelId } from "@/engine";
import { templateFor } from "@/guided/toScenario";
import { PLAIN_CHANNELS } from "@/lib/channelNames";
import type { StepProps } from "./types";

const HOURS = [
  { value: 2, label: "1–2 hours a week" },
  { value: 4, label: "3–5 hours a week" },
  { value: 8, label: "6–10 hours a week" },
  { value: 12, label: "More than 10 hours a week" },
] as const;

export function StepChannels({ answers, update }: StepProps) {
  const template = templateFor(answers);
  const offered = CHANNEL_IDS.filter(
    (c) => template.audience === "business" || c !== "linkedin_ads",
  );
  const picked = Array.isArray(answers.channels) ? answers.channels : [];
  const noBudget = answers.budget === 0;

  const toggle = (c: ChannelId) => {
    const next = picked.includes(c) ? picked.filter((x) => x !== c) : [...picked, c].slice(0, 4);
    update({ channels: next.length ? next : null });
  };

  return (
    <div className="flex flex-col gap-8">
      <ChoiceGroup
        legend="Paid ways to reach people (pick up to 4)"
        hint={
          noBudget
            ? "You chose nothing on ads, so these won't be used. Go back to add a budget, or promote it yourself below."
            : "Your budget is split evenly between the ones you pick."
        }
      >
        {offered.map((c) => (
          <Choice
            key={c}
            name="channels"
            multiple
            disabled={noBudget || (!picked.includes(c) && picked.length >= 4)}
            checked={picked.includes(c)}
            onChange={() => toggle(c)}
            label={PLAIN_CHANNELS[c].choice}
          />
        ))}
        <Choice
          name="channels"
          multiple
          notSure
          disabled={noBudget}
          checked={answers.channels === "not_sure"}
          onChange={() => update({ channels: answers.channels === "not_sure" ? null : "not_sure" })}
          label="Not sure"
          description={`We'll use a usual starting mix for ${template.similar}. It's a starting point, not a recommendation.`}
        />
      </ChoiceGroup>

      <ChoiceGroup
        legend="Free ways: your own time"
        hint="Posting about it, joining communities where your customers are, telling people you know. It costs time, not money, and is kept separate in the results."
      >
        <Choice
          name="self"
          multiple
          checked={answers.selfPromotion !== null}
          onChange={() =>
            update({ selfPromotion: answers.selfPromotion === null ? "not_sure" : null })
          }
          label="I'll promote it myself"
        />
        {answers.selfPromotion !== null && (
          <div className="flex flex-col gap-2 pl-7">
            {HOURS.map(({ value, label }) => (
              <Choice
                key={value}
                name="hours"
                checked={answers.selfPromotion === value}
                onChange={() => update({ selfPromotion: value })}
                label={label}
              />
            ))}
            <Choice
              name="hours"
              notSure
              checked={answers.selfPromotion === "not_sure"}
              onChange={() => update({ selfPromotion: "not_sure" })}
              label="Not sure"
              description="We'll use 3 hours a week as an example."
            />
          </div>
        )}
      </ChoiceGroup>
    </div>
  );
}
