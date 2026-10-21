# Launch Lab

**Rehearse your launch before you pay for it.**

Launch Lab lets product marketers and founders simulate a product launch before spending money. Enter an audience, a price, up to four channels with a budget split, and a launch window. A Monte Carlo simulation moves buyers from reach to paying user and returns **downside / likely / upside** outcomes for revenue, CAC and payback, not one falsely precise number. Compare up to three plans side by side, see which assumption matters most, and share the reasoning with a link.

**Live:** [launch-lab-phi.vercel.app](https://launch-lab-phi.vercel.app) · **Style guide:** [/style-guide](https://launch-lab-phi.vercel.app/style-guide)

> **Status: in development. M1 shipped (simulation engine); building M2 (interactive lab).** This README becomes a full product case study at M6.

**How the model works:** [docs/model.md](docs/model.md) explains it in plain language, with a hand-checkable worked example and every assumption's source, date and reasoning. The [engine readout](https://launch-lab-phi.vercel.app/lab) shows its first results.

## Why

Launch plans are committed before anyone tests whether the numbers hold. Decisions rest on gut feel, feedback arrives after the money is spent, trade-offs stay invisible, and teams argue from different mental models. See the [product brief](docs/product-brief.md) for the problem, personas, hypotheses and success metrics.

## Roadmap

| Milestone | What ships | Status |
|---|---|---|
| M0 · Foundation | Scaffold, CI, design tokens, light/dark, style guide | ✅ Shipped |
| M1 · Simulation engine | Tested Monte Carlo engine with documented assumptions | ✅ Shipped |
| M2 · Single-scenario lab | Editor, KPIs, funnel drop-off, insight headline | In progress |
| M3 · Sensitivity | Tornado chart, "what matters most", methodology | |
| M4 · Compare | Up to 3 scenarios side by side | |
| M5 · Share + analytics | Report links, OG images, cookieless funnel analytics | |
| M6 · Polish | E2E tests, accessibility, case study | |

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
