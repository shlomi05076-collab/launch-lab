# Launch Lab

**Rehearse your launch before you pay for it.**

Launch Lab helps anyone with a product idea answer **"Can my idea work, and what would have to be true?"** before spending money on it. First-time founders answer seven plain questions and get a viability explanation, not a verdict: the customers their budget would likely buy, how many they would need to earn the spend back, and which assumption their idea depends on most, compared with what similar products usually achieve. Marketers and founders who know their numbers get expert mode: every input, a Monte Carlo simulation with **downside / likely / upside** outcomes for revenue, CAC and payback, sensitivity analysis, and side-by-side comparison.

**Live:** [launch-lab-phi.vercel.app](https://launch-lab-phi.vercel.app) · **Style guide:** [/style-guide](https://launch-lab-phi.vercel.app/style-guide)

> **Status: in development. M2 shipped (product types and viability math); building M3 (the guided "Test my idea" flow).** This README becomes a full product case study at M7.

**How the model works:** [docs/model.md](docs/model.md) explains it in plain language, with a hand-checkable worked example and every assumption's source, date and reasoning. The [engine readout](https://launch-lab-phi.vercel.app/lab) shows what would have to be true for each product type.

## Why

People commit savings or budgets to an idea before anyone tests whether the numbers could add up. First-time founders don't know what a typical sign-up rate or ad cost is; viability calculators hand out pass/fail verdicts without showing their reasoning; and feedback arrives only after the money is spent. Launch Lab shows what would have to be true instead. See the [product brief](docs/product-brief.md) for the problem, personas (led by Omer, a first-time founder), hypotheses and success metrics, and the [Test my idea spec](docs/test-my-idea.md) for the guided flow.

## Roadmap

| Milestone | What ships | Status |
|---|---|---|
| M0 · Foundation | Scaffold, CI, design tokens, light/dark, style guide | ✅ Shipped |
| M1 · Simulation engine | Tested Monte Carlo engine with documented assumptions | ✅ Shipped |
| M2 · Product types + viability | Sourced templates for 5 product types, break-even and "what would have to be true" math | ✅ Shipped |
| M3 · Test my idea | Guided 7-question flow and plain-language viability results | In progress |
| M4 · Expert mode | Every input, your own data, charts, sensitivity, methodology | |
| M5 · Saved + compare | Browser-saved scenarios, compare up to 3 | |
| M6 · Share + analytics | Report links, OG images, cookieless funnel analytics | |
| M7 · Polish | E2E tests, accessibility, founder tests, case study | |

## Stack

Next.js (App Router) · TypeScript (strict) · Tailwind CSS v4 · Vitest · Biome · Vercel. The simulation engine is pure TypeScript with no framework dependencies. See [CLAUDE.md](CLAUDE.md) for architecture rules and conventions.

## Run it locally

Requires Node.js 24+ and pnpm.

```bash
pnpm install
pnpm dev
```

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server at http://localhost:3000 |
| `pnpm test` | Unit tests |
| `pnpm typecheck` | Type-check (generates Next route types first) |
| `pnpm lint` | Lint and format check (Biome) |
| `pnpm build` | Production build |
