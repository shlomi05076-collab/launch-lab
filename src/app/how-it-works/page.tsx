import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "How this works",
  description: "How Launch Lab turns your answers into a range of outcomes, in plain words.",
};

const sections = [
  {
    title: "It runs your launch 5,000 times",
    body: "Nobody knows exactly how many people will click, sign up or pay. So instead of one guess, Launch Lab runs 5,000 versions of your launch, each with slightly different but realistic rates. The spread of those results is the answer: a likely number, plus a downside (10% of runs did worse) and an upside (10% did better).",
  },
  {
    title: "Every step loses people",
    body: "Your budget buys ad views. Some people who see an ad visit, some visitors sign up, some of them start using it, and some of those pay. The more often the same people see your ads, the less each extra dollar adds. Each step's rate comes from published benchmarks for similar products, with the source and date shown next to it.",
  },
  {
    title: "Earning back the spend",
    body: "The question isn't whether your idea will work; nobody can know that. It's what would have to be true for the customers you win to earn back what you spent on marketing within one, two or three years. Building and running costs aren't included.",
  },
  {
    title: "What would have to be true",
    body: "For each key number, Launch Lab finds the value you'd need, with everything else typical, and compares it with what similar products achieve. That shows which assumption your idea leans on most, so you can test it cheaply before spending real money.",
  },
  {
    title: "Your own promotion",
    body: "If you promote it yourself, your hours are turned into a rough number of people reached. That part is an estimate with no published benchmark, so it's labeled as one, and its customers are shown separately from the ones ads bring in.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="label mb-3">How this works</p>
      <h1 className="display mb-4 text-4xl text-balance">
        A planning simulation, not a prediction
      </h1>
      <Disclaimer className="mb-10" />
      <div className="flex flex-col gap-8">
        {sections.map((s) => (
          <section key={s.title} className="flex flex-col gap-2 border-t border-rule pt-5">
            <h2 className="display text-xl">{s.title}</h2>
            <p className="max-w-prose text-pretty text-ink-muted">{s.body}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 max-w-prose text-sm text-pretty text-ink-muted">
        Every formula, every default number with its source and date, and the model's known limits
        are written up in{" "}
        <a
          href={`${site.repoUrl}/blob/main/docs/model.md`}
          className="text-ink underline decoration-rule underline-offset-4"
        >
          the full model documentation
        </a>
        .
      </p>
      <div className="mt-8">
        <ButtonLink href="/idea">Test my idea</ButtonLink>
      </div>
    </div>
  );
}
