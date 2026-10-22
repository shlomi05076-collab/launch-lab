import Link from "next/link";
import { LaunchReadout } from "@/components/preview/LaunchReadout";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/lib/site";

const steps = [
  {
    n: "01",
    title: "Answer seven plain questions",
    body: "What you sell, who buys it, what you charge, your budget and how people will find out. Every question has a “not sure” answer that uses typical numbers for similar products.",
  },
  {
    n: "02",
    title: "See what would have to be true",
    body: "Launch Lab runs your launch 5,000 times and shows how many customers you'd likely get, how many you'd need to earn back the spend, and which assumption your idea leans on most.",
  },
  {
    n: "03",
    title: "Test the riskiest part cheaply",
    body: "Get one small, real-world test for that assumption, with a budget under a tenth of your plan and a clear pass mark, before you spend the rest.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="grid gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div className="flex flex-col gap-6">
          <p className="label">For anyone with a product idea</p>
          <h1 className="display text-[2.5rem] text-balance sm:text-6xl">{site.tagline}</h1>
          <p className="max-w-prose text-lg text-pretty text-ink-muted">
            Before you spend your savings on ads, see how many customers a budget would likely
            bring, how many you'd need to earn it back, and the one assumption your idea depends on
            most. No sign-up, no jargon, about two minutes.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/idea">Test my idea</ButtonLink>
            <ButtonLink href="/idea/example" variant="secondary">
              See an example
            </ButtonLink>
          </div>
          <p className="text-sm text-pretty text-ink-muted">
            A planning simulation based on industry averages, not a prediction or financial advice.{" "}
            <Link
              href="/how-it-works"
              className="text-ink underline decoration-rule underline-offset-4"
            >
              How it works
            </Link>
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
