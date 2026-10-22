import { QUESTIONS } from "@/guided/answers";
import { summarizeAnswers } from "@/guided/summary";
import { cn } from "@/lib/cn";
import type { StepProps } from "./types";

export function StepReview({
  answers,
  onEdit,
}: StepProps & { onEdit: (questionIndex: number) => void }) {
  const rows = summarizeAnswers(answers);
  const unsure = rows.filter((r) => r.notSure).length;
  return (
    <div className="flex flex-col gap-4">
      {unsure > 0 && (
        <p className="text-sm text-pretty text-ink-muted">
          {unsure} of your answers {unsure === 1 ? "uses" : "use"} a typical value or an estimate
          instead (marked below). That's fine; you can change them any time.
        </p>
      )}
      <dl className="flex flex-col">
        {rows.map((row) => (
          <div
            key={row.question}
            className="grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-1 border-b border-rule py-3 first:border-t"
          >
            <dt className="label">{row.label}</dt>
            <dd className="row-span-2 self-center">
              <button
                type="button"
                onClick={() => onEdit(QUESTIONS.indexOf(row.question))}
                className="label min-h-11 px-2 underline decoration-rule underline-offset-4 hover:text-ink"
                aria-label={`Change: ${row.label}`}
              >
                Change
              </button>
            </dd>
            <dd className={cn("text-pretty", row.notSure && "text-ink-muted")}>
              {row.answer}
              {row.notSure && <span className="label ml-2">{row.tag ?? "typical value"}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
