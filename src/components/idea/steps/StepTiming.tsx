import { useId } from "react";
import { Choice, ChoiceGroup } from "@/components/ui/Choice";
import { nextMonth } from "@/guided/toScenario";
import type { StepProps } from "./types";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const LENGTHS = [
  { weeks: 2, label: "2 weeks" },
  { weeks: 4, label: "1 month" },
  { weeks: 8, label: "2 months" },
  { weeks: 13, label: "3 months" },
] as const;

export function StepTiming({ answers, update }: StepProps) {
  const id = useId();
  const timing = answers.timing && answers.timing !== "not_sure" ? answers.timing : null;
  const startMonth = timing?.startMonth ?? nextMonth(new Date());

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="label">
          Launch month
        </label>
        <select
          id={id}
          value={startMonth}
          disabled={answers.timing === "not_sure"}
          onChange={(e) =>
            update({ timing: { startMonth: Number(e.target.value), weeks: timing?.weeks ?? 8 } })
          }
          className="min-h-12 border border-rule bg-surface px-3 text-[0.9375rem] focus:border-ink disabled:opacity-50"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <ChoiceGroup legend="How long will you promote it?">
        {LENGTHS.map(({ weeks, label }) => (
          <Choice
            key={weeks}
            name="weeks"
            checked={timing?.weeks === weeks}
            onChange={() => update({ timing: { startMonth, weeks } })}
            label={label}
          />
        ))}
        <Choice
          name="weeks"
          notSure
          checked={answers.timing === "not_sure"}
          onChange={() => update({ timing: "not_sure" })}
          label="Not sure"
          description="We'll use next month, promoted for 2 months."
        />
      </ChoiceGroup>
    </div>
  );
}
