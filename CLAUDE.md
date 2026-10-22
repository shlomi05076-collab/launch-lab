# Launch Lab

Launch Lab helps **anyone with a product idea** answer **"Can my idea work, and what would have to be true?"** before spending money on it.
- **Test my idea (main entry point):** a guided, jargon-free check for first-time founders. It asks 7 plain questions and answers with a viability explanation, never a verdict.
- **Expert mode:** the full lab, for marketers and founders who know their numbers.

Underneath both, a Monte Carlo simulation moves buyers through the funnel (reach → visit → sign-up → activation → paying) and returns **ranges, not one falsely precise number**. Scenarios are saved in the browser, can be compared (up to 3), and can be shared by link.

This is a portfolio project for **product manager and product marketing** roles. Hiring managers will read the live app, the README and the code. Optimise for four things, in this order:
1. **A model you can defend.** Every number on screen can be explained in one sentence and traced to an input or a documented assumption.
2. **Clear product thinking.** Show the insight and what it depends on ("you'd need 1 in 25 visitors to sign up; similar apps get 1 in 40"), not just the data.
3. **Plain language for non-experts.** The primary user has never heard of CAC. If a first-time founder can't follow it, it isn't done.
4. **Craft.** The UI looks like a precision instrument, and the code is small, typed and tested.

The primary persona is **Omer, 27**: he has an idea and some savings and has never run marketing. The secondary personas are Maya (PMM), Daniel (founder-PM) and Noa (growth lead). See `docs/product-brief.md`. The guided flow is specified in `docs/test-my-idea.md`.

## Status

Current milestone: **M3 – "Test my idea" guided flow** (see [Milestones](#milestones)). Update this line when a milestone ships.

- **Live:** https://launch-lab-phi.vercel.app (Vercel Hobby, auto-deploys every push to `main`)
- **Repo:** https://github.com/shlomi05076-collab/launch-lab (public). Commits use the noreply email set in the repo-local git config. Keep it that way.
- When a milestone ships, update: this line, the milestone checkbox, `site.milestone` in `src/lib/site.ts`, and the README roadmap table.

## Product decisions (settled; don't revisit without asking)

- **Pricing:** monthly subscription by default (price, gross margin, monthly churn). A one-time price is an option.
- **Launch window** = start month + length in weeks (2–26). The start month sets a seasonality multiplier, and results are produced week by week.
- **Share links** carry the scenario inputs in the URL: versioned and compressed. There is no backend and no database. Results are reproducible because each scenario carries its own random seed.
- **Uncertainty language:** **Downside (P10) / Likely (P50) / Upside (P90)**, everywhere: UI, docs, code, copy. **Never "worst/best"**, because P10 is not the worst case: 10% of simulated launches did worse than the downside. For costs (CAC, payback), downside is the P90 because higher is worse. Always map through `toOutcomeRange()` in `engine/outcomes.ts`, never by hand.
- **Two modes, one engine.** "Test my idea" (`/idea`) is the main entry point and the landing page's primary call to action. Expert mode (`/lab`) has every input, custom channels and scenario comparison. Both produce a `ScenarioInput`, and "Open in expert mode" carries guided answers over.
- **"See an example"** opens the sample product (Briefly, AI meeting notes for small teams, $49 per team per month) with 3 ready-made scenarios: *High-intent search*, *Social push* and *Balanced mix* (`src/data/sampleScenarios.ts`). They share budget, audience, window and funnel, so only the channel mix differs. A first-time visitor never sees an empty state.
- **Product types** have sourced defaults: B2B software, consumer app (subscription), online store (one-time), digital product or course, service or agency. They're shown as plain choices ("An app people pay for monthly"). Every "not sure" answer uses the type's sourced default and says so in the result. A few values have no benchmark (audience-size bands, the example $5,000 budget); they're labeled as an estimate or example, never as a benchmark.
- **Viability, never a verdict.** Results explain what would have to be true and never claim an idea will succeed or fail. Banned in generated copy (test-enforced in `src/insights/`): "viable", "not viable", "will succeed", "will fail", "guaranteed", "you should invest", and pass/fail scores.
- **Break-even** = the customers won during the launch earn back the **marketing spend** from gross margin within **12 months**. It excludes the cost of building and running the product, and the results say so. "What would have to be true" solves, one input at a time with the rest at typical values, for the value that makes the *likely* customer count reach break-even. It then compares that value with the product type's range: **Typical** / **Needs above-typical results** / **Rarely seen**. Labels describe the requirement, never the idea, and a required value is never phrased as good news. The results tile reads "Chance to earn back the spend within a year", never "chance of success". For one-time products, customer value includes **purchases per customer in the first year** (sourced per product type).
- **Disclaimer on every result** (guided, expert, comparison, shared report), right under the headline: "A planning simulation based on industry averages, not a prediction or financial advice."
- **Provenance labels:** a default shows an **assumption** marker (source, date). A value the user typed in expert mode shows **"your data"**. Never mix the two.
- **Saved scenarios** live in the browser only (Zustand persisted to localStorage): rename, duplicate, delete. No account, no backend. Share links remain URL-encoded.
- **Channels (v1):** paid search, paid social (Meta), LinkedIn ads, newsletter sponsorships, creators/influencers, content & SEO. Community, Product Hunt and partnerships were dropped because no credible benchmarks exist to source their defaults.
- **Every default is a labeled assumption.** Each default value in `src/data/` (CPMs, click-through rates, conversion rates, churn, seasonality) is an `Assumption` record with a source and an as-of date. Each is documented in `docs/model.md` and shown in the UI with an "assumption" marker whose tooltip gives the source and date. Users can edit any of them. No unlabeled magic numbers.
- **Insight first.** Every results view (single scenario, sensitivity, comparison, shared report) leads with **one plain-English sentence** with the key takeaway, *before* any chart. Guided example: "With $10,000 you'd likely get 40–110 customers. To earn that back within a year you'd need about 1 in 25 visitors to sign up; similar products usually get 1 in 40." Expert example: "Balanced pays back in 7 months; Social push reaches more people but has a 40% chance of never paying back." The sentence comes from the results by tested, pure code in `src/insights/`. It is never hand-written per screen.
- **Product analytics** are privacy-friendly: no cookies and no personal data. They track two funnels:
  - **Guided:** idea started → idea completed → "what would have to be true" viewed → saved, expert opened or shared.
  - **Expert:** lab opened → first simulation run → scenario edited → scenarios compared → report shared → report opened.

  Events are documented in `docs/metrics.md` and implemented in M6. **North star (approved 2026-10-22):** ideas checked per week (guided checks that reach the "what would have to be true" view). The expert metric is scenarios compared per active user per week.
- **Out of scope for v1:** pass/fail verdicts or "viability scores", financial or investment advice, real ad-account integrations, multi-product or multi-market launches, accounts or cloud-saved workspaces. Push back on scope creep toward these.

## Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router), React, TypeScript strict | Server-rendered report pages give shared links a real preview image, and it deploys free on Vercel |
| Hosting | Vercel (Hobby) | Free public URL, a preview deploy for every push, built-in OG image support |
| Styling | Tailwind CSS v4 + CSS-variable design tokens | Tokens make light/dark mode and the "one accent" rule enforceable |
| UI primitives | Radix UI (unstyled) | Accessible sliders, tabs, popovers and dialogs with no imposed look |
| Charts | Hand-built SVG with `d3-scale` + `d3-shape` | Chart libraries look templated, and the instrument-readout style needs full control |
| Simulation | Pure TS module in `src/engine`, run in a Web Worker | Thousands of runs × 3 scenarios without freezing the UI |
| Randomness | Seeded PRNG (mulberry32) in `engine/rng.ts` | Same input + seed gives identical output, so share links and tests are stable |
| Validation | Zod | One schema validates form input, decoded URLs and localStorage |
| URL encoding | `lz-string` | Keeps share links short enough for Slack and LinkedIn |
| Client state | Zustand (persisted to localStorage) | Small and explicit, with no provider boilerplate |
| Theming | Inline `<head>` script + `data-theme` + CSS `light-dark()` tokens (no library) | The approach the Next docs recommend: no flash, no dependency, and any subtree can force a theme |
| Analytics | Vercel Web Analytics (page views) + a custom-event provider behind `lib/analytics.ts` | Cookieless. **Open decision for M5:** Vercel custom events need the Pro plan, so on Hobby use a free cookieless provider (candidate: Umami Cloud; verify its free tier first) or accept page views only |
| Fonts | `next/font` (self-hosted Google Fonts) | No layout shift and no third-party font requests |
| Unit tests | Vitest + fast-check | Fast TS-native tests; property tests check model invariants |
| E2E tests | Playwright (one smoke suite) | Proves load → simulate → share → open report works on desktop and mobile |
| Lint/format | Biome | One fast tool for both |
| CI | GitHub Actions | Typecheck, lint, test and build on every push; Vercel deploys |
| Package manager | pnpm | |

## Commands

Prerequisites: Node.js LTS, pnpm (via `corepack enable`), Git, GitHub CLI (`gh`).

Created in M0. Keep this list in sync with `package.json`.

```
pnpm dev            # local dev server (http://localhost:3000)
pnpm build          # production build
pnpm test           # unit tests (Vitest), once
pnpm test:watch     # unit tests, watch mode
pnpm test:coverage  # unit tests + coverage (what CI runs)
pnpm lint           # Biome lint + format check
pnpm format         # Biome: apply formatting and safe fixes
pnpm typecheck      # next typegen && tsc --noEmit
pnpm e2e            # Playwright smoke tests (added in M6)
```

Before saying a task is done: `pnpm typecheck && pnpm lint && pnpm test` must pass. CI (`.github/workflows/ci.yml`) also runs `pnpm build`.

### Next.js 16.4 notes

@AGENTS.md

- **Read the bundled docs** in `node_modules/next/dist/docs/` before using a Next API. This version differs from older training data.
- `cacheComponents` and `partialPrefetching` are on (scaffold defaults). Don't read cookies or headers in the root layout; it would make every route dynamic.
- `LayoutProps` / `PageProps` are generated globals, which is why `typecheck` runs `next typegen` first.
- Tailwind is loaded via the `@tailwindcss/turbopack` loader in `next.config.ts` (no PostCSS config).
- On Windows the dev server's file watcher occasionally misses a CSS edit. If styles look stale, restart `pnpm dev` before debugging.

## Architecture rules

1. **`src/engine` is pure TypeScript.** It never imports React, Next, the DOM, `Math.random` or `Date.now`. Everything else depends on the engine, and the engine depends on nothing.
2. **Determinism.** Same `ScenarioInput` + `seed` gives byte-identical `SimulationResult`. All randomness goes through `engine/rng.ts`.
3. **Validate at the edges, trust inside.** Zod parses every input that enters the app (form, URL, localStorage). The engine assumes valid input.
4. **Versioned schema.** `ScenarioInput` has a schema version `v`. Any change to its shape bumps `v` and adds a migration in `schema/migrations.ts`, so old share links keep working forever.
5. **Sources of truth.** On `/idea` and `/lab`, the Zustand store is the source of truth: the guided draft, saved scenarios and the active scenario, persisted to localStorage and validated by Zod on load. On `/report`, the URL is the source of truth (read-only).
6. **Simulation never blocks the main thread.** The UI calls `useSimulation()`, which talks to `workers/simulation.worker.ts`. Inputs are debounced (~250 ms) and stale runs are cancelled.
7. **Format at the edge.** The engine returns raw numbers: money in whole USD, rates as 0–1 fractions. Only `lib/format.ts` turns them into strings.
8. **Insights are computed, not written.** `src/insights/` is pure (same rules as the engine). It turns `SimulationResult`s and `Viability` results into structured findings plus one headline sentence. Findings rank by decision impact. The guided headline answers "what would have to be true?"; the expert headline answers "which plan, and what's the risk?". Generated copy must pass the banned-verdict-words test.
9. **Analytics go through one wrapper.** Components call `track(event, props)` from `lib/analytics.ts` and never a vendor SDK directly. Event names and props are a typed union that matches `docs/metrics.md`. No personal data, no scenario contents, no cookies.

## Folder structure

```
/
├─ CLAUDE.md
├─ README.md                    # product case study: problem, users, decisions, trade-offs, screenshots
├─ docs/
│  ├─ product-brief.md          # problem, personas, hypotheses, north star, scope
│  ├─ test-my-idea.md           # guided flow spec: questions, defaults, results layout, edge cases
│  ├─ model.md                  # how the simulation works; every assumption with source + date
│  ├─ metrics.md                # analytics events, properties, funnel, north star definition
│  └─ decisions/                # short ADRs (001-url-state.md, 002-pert-distributions.md, …)
├─ e2e/                         # Playwright smoke tests
├─ public/
└─ src/
   ├─ app/
   │  ├─ layout.tsx             # fonts, theme provider, metadata
   │  ├─ globals.css            # design tokens (light + dark) and Tailwind @theme
   │  ├─ page.tsx               # landing: "Test my idea" (primary) · "See an example" (Briefly)
   │  ├─ idea/page.tsx          # guided "Test my idea" flow + viability results
   │  ├─ lab/page.tsx           # expert mode: full editor + results + compare workspace
   │  ├─ report/page.tsx        # read-only shared report (?s=<encoded>)
   │  ├─ report/opengraph-image.tsx  # dynamic share preview card
   │  └─ methodology/page.tsx   # human-readable version of docs/model.md
   ├─ engine/                   # PURE. No React/DOM/Next. purity.test.ts enforces it.
   │  ├─ index.ts               # public API: simulate, expectedLaunch, runSensitivity, toOutcomeRange
   │  ├─ types.ts               # the engine's whole contract (inputs, results)
   │  ├─ rng.ts                 # mulberry32
   │  ├─ distributions.ts       # PERT via inverse-CDF table, normal, Φ, binomial
   │  ├─ channels.ts            # ramps, spend → impressions, uniquePeople() saturation
   │  ├─ seasonality.ts         # launch week → calendar month
   │  ├─ funnel.ts              # runLaunch(): one simulated launch, week by week
   │  ├─ economics.ts           # CAC, payback (with lifetime cap), weekly retention
   │  ├─ monteCarlo.ts          # parameter draws (+ market response), run loop, aggregation
   │  ├─ sensitivity.ts         # tornado analysis (P10/P90 swings, expected-value runs)
   │  ├─ viability.ts           # break-even, customers needed, "what would have to be true" solver
   │  ├─ outcomes.ts            # downside/likely/upside direction rule
   │  ├─ stats.ts               # percentiles, histograms
   │  ├─ sanity.test.ts         # the hand-calculated worked example from docs/model.md
   │  ├─ properties.test.ts     # fast-check invariants on random scenarios
   │  └─ *.test.ts              # other colocated tests
   ├─ insights/                 # PURE. viability.ts (headline, requirement rows, banned-words test); cheapTests.ts in M3
   ├─ design/
   │  ├─ palette.ts             # color values per theme; mirrored in globals.css (test-enforced)
   │  └─ fonts.ts               # next/font setup; each trio sets --ff-display/--ff-body/--ff-mono
   ├─ data/                     # every default, as Assumption records (assumptions.test.ts)
   │  ├─ assumption.ts          # Assumption<T>: value, source, asOf, why, confidence
   │  ├─ channelBenchmarks.ts   # per-channel CPM, CTR, intent, ramp
   │  ├─ modelDefaults.ts       # seasonality, market correlation, funnel, churn, margin
   │  ├─ productTypes.ts        # 5 product-type templates: funnel, price, churn, channel profile, starter mix
   │  ├─ guidedDefaults.ts      # estimates with no benchmark: audience bands, example budget, promotion length
   │  └─ sampleScenarios.ts     # Briefly + 3 scenarios ("See an example")
   ├─ schema/
   │  ├─ scenario.ts            # Zod schemas (inputs to the engine)
   │  ├─ migrations.ts
   │  └─ share.ts               # encode/decode share URL
   ├─ workers/simulation.worker.ts
   ├─ hooks/useSimulation.ts
   ├─ store/scenarios.ts        # Zustand: guided draft, saved scenarios (rename/duplicate/delete), compare set
   ├─ components/
   │  ├─ layout/                # SiteHeader, SiteFooter
   │  ├─ ui/                    # Button, NumberField, Slider, Segmented, Tooltip, ThemeToggle, AssumptionMarker, Disclaimer
   │  ├─ idea/                  # QuestionStep, AnswerSummary, ViabilityHeadline, BreakEvenGauge, MustBeTrue, Glossary
   │  ├─ charts/                # FunnelChart, RangeBar, TornadoChart, Timeline, Histogram
   │  ├─ scenario/              # ScenarioEditor, ChannelMix, PricingInput, WindowInput
   │  ├─ results/               # InsightHeadline, KpiReadout, DropOffPanel
   │  ├─ compare/               # CompareGrid, WinnerCallout
   │  └─ report/                # ReportView, ShareButton
   └─ lib/
      ├─ format.ts              # currency, compact numbers, ranges ("$41k–$68k"), "1 in 25"
      ├─ glossary.ts            # one-line plain explanations for CAC, churn, conversion, …
      ├─ analytics.ts           # typed track() wrapper, the only place a vendor SDK is imported
      ├─ color.ts               # WCAG contrast + OKLCH helpers (palette tests, style guide)
      ├─ theme.ts               # theme preference type, storage key, inline init script
      ├─ site.ts                # name, tagline, repo URL, current milestone
      └─ cn.ts
```

## Data model

**The code is the source of truth:** `src/engine/types.ts` (engine contract) and `src/data/assumption.ts`. `docs/model.md` explains the model in plain language. Key shapes:

- `Range = { low, likely, high }`: every uncertain input, sampled as PERT.
- `Assumption<T> = { id, label, value, source, sourceUrl?, asOf, why, confidence }`: every default in `src/data/`. `id` must appear in `docs/model.md` (test-enforced).
- `ScenarioInput`: `v: 1`, id, name, `seed`, `audienceSize`, `totalBudget`, `pricing` (model, price, grossMargin, monthlyChurn), 1–4 `channels` (channel, budgetShare, overrides), `window` (startMonth, weeks), `funnel` (signupRate, activationRate, paidConversion).
- `ModelAssumptions`: per-channel `{ costPerThousand, clickThroughRate, intentMultiplier, rampProfile }`, `seasonality: { cost, demand }` (12 monthly multipliers each), `marketCorrelation`. The engine takes these as an argument; defaults come from `defaultModelAssumptions()` in `src/data/modelDefaults.ts`.
- `Dist = { p10, p50, p90, mean }`: raw percentiles. May hold `Infinity` (no customers → CAC; never pays back → payback). Show it via `toOutcomeRange(dist, metric)` → `{ downside, likely, upside }`.
- `SimulationResult`: stages, dropOff, byChannel, weekly (cumulative paying + revenue), revenue, mrrAtEnd, cac, paybackMonths, `probPaybackWithin12`, `probNeverPayback`, histogram.
- `SensitivityResult`: `baseline` + `bars` sorted by swing (`input`, `label`, `inputLow/High`, `metricAtLow/High`, `swing`).
- `Insight` (`src/insights/`): `{ headline, findings[] }`. Findings have a kind (winner, payback_risk, biggest_leak, top_driver, channel_mismatch, break_even, must_be_true) and a severity (info, good, warning, risk).
- **Built in M2:**
  - `ScenarioInput.productType`: one of `b2b_software | consumer_app | online_store | digital_product | service`. `defaultModelAssumptions(audience)` picks the business or consumer channel profile from the template (`src/data/productTypes.ts`).
  - `ScenarioInput.pricing.purchasesPerYear` (one-time only): purchases per customer in their first year, sourced per product type. Repeats are spread evenly over the year.
  - `Viability` (`engine/viability.ts`, `assessViability()`): `{ spend, customerValue12m, breakEvenCustomers, expectedCustomers, aboveBreakEven, requirements[], mattersMost }`. Each requirement is `{ input, betterWhen, typical: { p10, likely, p90 }, current, needed | null, status: 'typical' | 'above_typical' | 'rare' }`. Inputs: signupRate, payingRate (activation × paid), costPerVisitor, price, monthlyChurn or purchasesPerYear.
  - Sensitivity metric `netReturn12m` (12-month gross margin − spend) ranks "matters most" in guided mode.
- **Planned for M4** (no share links exist yet, so `v: 1` can still change; from M6 on, any change bumps `v` with a migration):
  - `ScenarioInput.provenance`: which values came from defaults versus the user ("your data").
  - Custom channels: a channel entry may carry its own full `ChannelAssumptions` (user-named, no benchmark), always labeled "your data".

### How one simulated launch works (summary of docs/model.md)

1. **Draw the world:** every uncertain input is drawn once per run from its PERT range. The three product rates share a "market response" draw (Gaussian copula, pairwise correlation 0.5).
2. **Per week:** spend × ramp → impressions at that month's cost → **unique reach** = A(1 − e^(−I/A)) and **unique visitors** = A(1 − e^(−Σ impressions × CTR / A)). CTR is per impression, and a person visits at most once.
3. **Funnel:** visitors × sign-up rate × channel intent × month's demand → activation → paying. These are binomial draws from sign-up on; reach and visits are expectations.
4. **Economics:** revenue in the window, MRR at the end, CAC = spend ÷ paying, payback = ln(1 − CAC·c/g) ÷ ln(1 − c) with lifetime cap g/c (→ "never").
5. **Aggregate:** 5,000 runs → P10/P50/P90. `expectedLaunch()` is the no-randomness, all-likely run used by the sanity test and sensitivity.

**Sensitivity (tornado):** swing each uncertain input between its own P10 and P90 (budget, price and audience ±20%) with everything else at likely, using expected-value runs, then sort by swing. `bars[0]` is "what matters most".
## Conventions

- **TypeScript:** `strict` and `noUncheckedIndexedAccess`. No `any` and no non-null `!` unless there's a comment explaining why.
- **Naming:** components `PascalCase.tsx`; everything else `camelCase.ts`. Put units in names when they aren't obvious (`weeks`, `paybackMonths`, `budgetShare` = 0–1).
- **Components:** server components by default; `"use client"` only where there's interaction. Keep components under ~150 lines and extract when they grow.
- **Styling:** Tailwind utilities that reference tokens only. **No raw hex values in components.** No drop shadows or card borders by default; build hierarchy with type, spacing and rules (thin lines).
- **Charts:** every chart has an `aria-label`, a visually hidden text summary, and keyboard-reachable tooltips. Uncertainty is always visible (band or range bar), never only a point.
- **Tests:** colocated `*.test.ts`. The engine needs ≥ 90% line coverage. Use fixed seeds. Property tests (fast-check) must cover: funnel stages never increase; p10 ≤ p50 ≤ p90; zero budget means zero paid reach; same seed means same result; budget shares sum to 1 after normalisation. Add a regression test when fixing an engine bug.
- **Accessibility:** WCAG 2.2 AA contrast in **both** themes, full keyboard operation, `prefers-reduced-motion` respected, touch targets ≥ 44px.
- **Mobile:** design at 375px first. Compare view becomes swipeable columns or a stacked list. No horizontal page scroll.
- **Copy:** plain language, sentence case, numbers in mono with tabular figures. Say "likely", not "P50", in primary UI. Write insights as sentences.
- **Guided-mode copy (`/idea`):**
  - **Questions:** no jargon (CAC, churn, conversion, funnel, CPM, CTR, LTV).
  - **Results:** a term may appear only with its one-line explanation from `lib/glossary.ts`.
  - **Formatting:** rates as "1 in 25", not "4%"; money rounded ("about $5,000").
  - **Wording:** conditional ("you'd need", "if rates like similar products' hold"), never a verdict.
  - **"Not sure":** every "not sure" default is visibly labeled in the result.
- **Insight headline:** one sentence of at most ~30 words (guided headlines may run to ~40 because they carry the "what would have to be true" clause). It names the scenario and the number and states the risk in odds ("a 40% chance of never paying back"). No hedging filler and no chart jargon.
- **Assumptions:** never add a default number to `src/data/` without an `Assumption` wrapper, a `docs/model.md` entry with source and date, and an `AssumptionMarker` wherever it's shown.
- **Dependencies:** add one only if it clearly earns its weight. Note why in the commit message.
- **Git:** Conventional Commits (`feat(engine): …`, `fix(ui): …`), small commits during work. **Every milestone ends with a clear milestone commit (e.g. `feat: M1 simulation engine`), a git tag (`m1`, …), and a push to the public GitHub repo `launch-lab`**, followed by the Vercel deploy and a README update.

## Design system: "analytical instrument"

Think engineering lab equipment or a high-end measurement tool, not a SaaS template.

- **Surfaces:** light = cool, slightly blue-tinted off-white; dark = deep slate. Both themes get equal care, and neither is a mechanical inversion of the other.
- **Type:** a distinctive, sharp sans for headings (**not Inter, not Space Grotesk**), a readable sans for body, and monospace with tabular numbers for **all** figures.
- **Color:** **one signal accent, used only for the key insight on each screen** (the winning scenario, the biggest drop-off, the top sensitivity bar). Separate semantic colors for good / warning / risk, which must not be confusable with the accent. Everything else is neutral.
- **Charts as instrument readouts:** thin precise lines (1–1.5px), uncertainty bands for downside/likely/upside, direct labels instead of legends where possible, a faint grid, tick marks.
- **Layout:** generous whitespace. Hierarchy comes from type scale and alignment, not cards and shadows.
- **Token mechanics:** colors live in `src/design/palette.ts` and are mirrored as `light-dark()` custom properties in `globals.css`. `palette.test.ts` enforces the mirror and WCAG AA. Tailwind's default palette is removed, so only token utilities exist (`bg-surface`, `text-ink-muted`, `text-accent-ink`, …). Custom utilities: `display` (headings), `figures` (mono, tabular numbers), `label` (small uppercase instrument labels).
- **Gotcha:** `light-dark()` and `var()` inside a custom property resolve on the element that *declares* it, and children inherit the resolved value. That's why tokens are re-declared on every `[data-theme]` element and why utilities read `--ff-*` directly rather than a `:root` alias.
- **Decided at the M0 gate (2026-10-22):**
  - **Type:** Archivo semi-expanded (112.5% width) for headings, Public Sans for body, JetBrains Mono for every figure.
  - **Accent:** saturated ultramarine. Light: `#2f1cff`. Dark: `#6466ff` for graphics, `#7a7cff` for text.
  - **Semantics:** classic green / amber / red.
  - **Neutrals:** cool gray with very low chroma, so the accent clearly pops.
  - **Enforced by `palette.test.ts`:** neutrals have OKLCH chroma ≤ 0.025; the accent has chroma ≥ 0.2 and ≥ 25× the background's; the accent hue stays within 265–285°; and the accent sits ≥ 90° of hue away from every semantic color. Don't loosen these to make a new color pass.
- **Style guide:** `/style-guide` shows every token in both themes with live contrast and chroma. Update it when tokens change.

## Milestones

Each milestone is deployed to the public Vercel URL, works on its own, and ends with a milestone commit + tag pushed to GitHub (`launch-lab`).

- [x] **M0 – Foundation.** *(Shipped 2026-10-22, tag `m0`.)* Scaffold Next.js + TS strict, Tailwind v4, Biome, Vitest, pnpm scripts, public GitHub repo `launch-lab`, CI, Vercel deploy. `docs/product-brief.md` based on the user's brief (problem, personas Maya / Daniel / Noa, hypotheses H1–H5, north star, out of scope). Token skeleton with light/dark toggle. Design gate: 2 accent + font options shown to the user, choice applied (see Design system), and the page kept as `/style-guide`.
  *Ships:* a live URL with a styled landing page and theme toggle.
- [x] **M1 – Simulation engine.** *(Shipped 2026-10-22, tag `m1`.)* `src/engine` complete per the data model: RNG, PERT, channels + saturation, seasonality, funnel, economics, Monte Carlo with market response, sensitivity, aggregation. Sample data with every default wrapped as an `Assumption` (source, asOf, why). Hand-calculated sanity suite, property tests, purity test. `docs/model.md` covers every assumption with source, date, why, and how disagreements were resolved, plus limitations and a v2 roadmap. A temporary results table lives on `/lab`.
  *Ships:* a tested engine, plus a temporary results table on `/lab` for the sample scenario.

*Repositioned 2026-10-22 before M2: "Test my idea" is now the main entry point, and the old single-scenario lab became expert mode (M4). Old M3 (sensitivity) is split: the "matters most" sentence ships in M3 and the tornado chart in M4.*

- [x] **M2 – Product types and viability math.** *(Shipped 2026-10-23, tag `m2`.)* Engine, data and insights, with no new UI.
  - Five product-type templates in `src/data/productTypes.ts` (funnel, typical price, churn, channel profile, starter channel mix), each value sourced, dated and documented in `docs/model.md`.
  - Consumer channel profile (CPM and click rates) alongside the existing business one. `productType` on `ScenarioInput`.
  - `engine/viability.ts`: customer value over 12 months, customers needed to break even, chance of breaking even within 12 months, and the "what would have to be true" solver (bisection on expected-value runs) with Typical / Better than typical / Rarely seen / Not enough on its own.
  - `purchasesPerYear` for one-time pricing in the engine (revenue and break-even).
  - Hand-calculated break-even sanity test.
  - `src/insights/` viability headline (three variants) plus the banned-verdict-words test.
  - `lib/glossary.ts`, and "1 in N" formatting.
  - *Ships:* `/lab` readout showing, for each product type's example, the viability sentence and the "what would have to be true" table.
- [ ] **M3 – "Test my idea" guided flow.** Per `docs/test-my-idea.md`.
  - Landing page with **Test my idea** (primary) and **See an example** (Briefly).
  - 7 plain questions with "not sure" everywhere (including the "businesses or people?" follow-up and purchases per year for one-time products), and an answer summary.
  - Results screen: headline, disclaimer, three numbers (including "Chance to earn back the spend within a year"), break-even gauge, "what would have to be true" with the "matters most" accent, **"How to test this cheaply"**, plain drop-off, glossary, actions.
  - Cheap tests come from `src/insights/cheapTests.ts`: one template per main assumption (sign-up rate, paid conversion, price, cost per click), with a budget ≤ 10% of the plan and a pass mark from the break-even value (spec in `docs/test-my-idea.md`).
  - Web Worker + `useSimulation`; guided draft autosaved in the browser.
  - Short "How this works" page; mobile-first and both themes.
  - *Ships:* the product's main experience, usable by someone who has never heard of CAC.
- [ ] **M4 – Expert mode.** The full lab at `/lab`.
  - Every input, linked budget-split sliders, custom channels, overriding any default ("your data" vs assumption markers), and "Open in expert mode" from guided results.
  - Results: headline + disclaimer, KPIs (downside / likely / upside), funnel drop-off chart, weekly timeline with uncertainty band, tornado chart with switchable metric, outcome histogram.
  - Assumptions drawer (source and date for every benchmark), full `/methodology` page.
  - *Ships:* everything Maya, Daniel and Noa need for one scenario.
- [ ] **M5 – Saved scenarios and comparison.**
  - Browser-saved scenarios shared by both modes: save, rename, duplicate, delete, plus a "My ideas" list.
  - Compare up to 3, with a comparison headline (winner + main risk), aligned scales, an accent callout for the winner per metric, and deltas against a baseline.
  - The Briefly example loads as three comparable scenarios.
  - *Ships:* the full core workflow, still with no account.
- [ ] **M6 – Shareable report + analytics.**
  - URL encode/decode with schema version + migrations (ADR 001).
  - Read-only `/report` for a guided result, an expert scenario or a comparison: headline and disclaimer first.
  - Copy-link button, dynamic OG image showing the headline, print stylesheet. Malformed links show a friendly error and never crash.
  - Cookieless analytics via `lib/analytics.ts` covering both funnels (guided: `idea_started`, `idea_completed`, `must_be_true_viewed`, `idea_saved`, `expert_opened`; expert: `lab_opened`, `first_simulation_run`, `scenario_edited`, `scenarios_compared`; shared: `report_shared`, `report_opened`).
  - `docs/metrics.md` with the north star. Resolve the analytics provider decision first (see Stack).
  - *Ships:* links that look good in Slack or LinkedIn, and a measurable funnel.
- [ ] **M7 – Polish and launch.**
  - Playwright smoke suite (guided flow, expert mode, share; desktop + mobile).
  - Accessibility pass; Lighthouse ≥ 95 on all four categories.
  - Loading, empty and error states; micro-interactions (respecting reduced motion).
  - 3–5 first-time-founder hallway tests of the guided flow (H6), with findings written up.
  - README rewritten as a product case study with screenshots and a GIF; final ADRs.
  - *Ships:* the portfolio-ready v1.

## Decision log

Record significant decisions here (one line each) and write an ADR in `docs/decisions/` for the bigger ones.

- 2026-10-22: Share via URL-encoded state, no database (ADR 001, to write in M6).
- 2026-10-22: Subscription pricing by default with a one-time option; window = start month + weeks.
- 2026-10-22: PERT distributions for user-facing ranges, because PMs think in low/likely/high (ADR 002).
- 2026-10-22: Every default is an `Assumption` with source + date, shown in the UI via `AssumptionMarker`.
- 2026-10-22: Insight-first. Every results view opens with a computed headline sentence.
- 2026-10-22: Design gate: Option A type + Option B ultramarine accent, made more saturated, on cooler-gray neutrals with classic semantics. Invariants are test-enforced.
- 2026-10-22: Dropped `next-themes`. Theming uses the inline-script pattern from the Next 16.4 docs plus `light-dark()` tokens.
- 2026-10-22: Labels are **downside / likely / upside** (P10 / P50 / P90), never worst/best. The direction rule lives in `engine/outcomes.ts`.
- 2026-10-22: Shared market-response factor for the three product rates (correlation 0.5). No conversion lag in v1; it's on the v2 roadmap.
- 2026-10-22: CTR is applied **per impression**, and a person visits at most once. Applying a per-impression benchmark per person counted diminishing returns twice; caught while building M1.
- 2026-10-22: Sensitivity swings inputs between their P10 and P90, not their extremes.
- 2026-10-22: Channel set narrowed to six with sourceable benchmarks. Sample price is $49 per team per month.
- 2026-10-22: Cookieless product analytics in M5. Vercel Web Analytics custom events are Pro-only (checked 2026-10-22), so provider TBD.
- 2026-10-23: M2 sources: each product type is sourced where data exists and labeled "Launch Lab judgment" where it doesn't. Course and service funnels and the service margin are the thinnest; see docs/model.md.
- 2026-10-23: Guided "matters most" ranks inputs by net return within a year, not by paying customers, so price, churn and repeat purchases can surface.
- 2026-10-22: **Repositioned for anyone with a product idea.** New primary persona Omer (first-time founder, no marketing or finance background) and hypothesis H6 (explaining what must be true beats a pass/fail verdict). Guided "Test my idea" flow is the main entry point; the full lab becomes expert mode. Product-type templates with sourced defaults, browser-saved scenarios, and a disclaimer on every result. Milestones re-planned as M2–M7.
