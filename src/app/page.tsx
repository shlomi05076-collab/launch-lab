import { LaunchReadout } from "@/components/preview/LaunchReadout";
import { site } from "@/lib/site";

const steps = [
  {
    n: "01",
    title: "Set up the launch",
    body: "Audience, price, up to four channels with a budget split, and a launch window. Sample data is loaded, so you start with a working plan.",
  },
  {
    n: "02",
    title: "Run 5,000 futures",
    body: "A Monte Carlo simulation moves buyers from reach to paying user and returns worst, likely and best case, not one number pretending to be certain.",
  },
  {
    n: "03",
    title: "Compare and share",
    body: "Put up to three plans side by side, see which input matters most, and send a link that shows the reasoning, not just the answer.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="grid gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div className="flex flex-col gap-6">
          <p className="label">Launch simulator · in development</p>
          <h1 className="display text-[2.5rem] text-balance sm:text-6xl">{site.tagline}</h1>
          <p className="max-w-prose text-lg text-pretty text-ink-muted">
            Launch plans get committed before anyone tests whether the numbers hold. Launch Lab
            simulates yours first, showing the range of outcomes for revenue, CAC and payback and
            the one assumption that matters most.
          </p>
          <p className="label">
            Opens in <span className="text-ink">M2</span> · follow the build on GitHub
          </p>
        </div>
        <div className="border border-rule bg-surface p-5 sm:p-6">
          <LaunchReadout />
        </div>
      </section>

      <section aria-labelledby="how" className="border-t border-rule py-14">
        <h2 id="how" className="label mb-8">
          How it works
        </h2>
        <ol className="grid gap-10 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.n} className="flex flex-col gap-3">
              <span className="figures text-sm text-ink-muted">{step.n}</span>
              <h3 className="display text-2xl">{step.title}</h3>
              <p className="text-pretty text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
