# Launch Lab

Simulate a product launch before spending money. Product marketing managers and founders enter an audience size, a price, up to 4 marketing channels with a budget split, and a launch window. A Monte Carlo simulation moves buyers through the funnel (reach → visit → sign-up → activation → paying) and returns **ranges, not one falsely precise number**. Users compare up to 3 scenarios side by side and share a report link.

This is a portfolio project for **product manager and product marketing** roles. Hiring managers will read the live app, the README and the code. Optimise for three things, in this order:
1. **A model you can defend.** Every number on screen can be explained in one sentence and traced to an input or a documented assumption.
2. **Clear product thinking.** Show the insight ("Paid social is 61% of your spend but 22% of your paying users"), not just the data.
3. **Craft.** The UI looks like a precision instrument, and the code is small, typed and tested.

## Status

Current milestone: **M1 – Simulation engine** (see [Milestones](#milestones)). Update this line when a milestone ships.

- **Live:** https://launch-lab-phi.vercel.app (Vercel Hobby, auto-deploys every push to `main`)
- **Repo:** https://github.com/shlomi05076-collab/launch-lab (public). Commits use the noreply email set in the repo-local git config. Keep it that way.
- When a milestone ships, update: this line, the milestone checkbox, `site.milestone` in `src/lib/site.ts`, and the README roadmap table.

## Product decisions (settled; don't revisit without asking)

- **Pricing:** monthly subscription by default (price, gross margin, monthly churn). A one-time price is an option.
- **Launch window** = start month + length in weeks (2–26). The start month sets a seasonality multiplier, and results are produced week by week.
- **Share links** carry the scenario inputs in the URL: versioned and compressed. There is no backend and no database. Results are reproducible because each scenario carries its own random seed.
- **Uncertainty language:** Worst / Likely / Best = P10 / P50 / P90 of the simulated runs. The main UI says "worst / likely / best", and tooltips and the methodology page give the percentiles.
- **First load** shows a sample product (Briefly, AI meeting notes for small teams, $12/mo) with 3 ready-made scenarios: *Paid-heavy*, *Community-led* and *Balanced*. A first-time visitor never sees an empty state.
- **Every default is a labeled assumption.** Each default value in `src/data/` (CPMs, click-through rates, conversion rates, churn, seasonality) is an `Assumption` record with a source and an as-of date. Each is documented in `docs/model.md` and shown in the UI with an "assumption" marker whose tooltip gives the source and date. Users can edit any of them. No unlabeled magic numbers.
- **Insight first.** Every results view (single scenario, sensitivity, comparison, shared report) leads with **one plain-English sentence** with the key takeaway, *before* any chart. Example: "Balanced pays back in 7 months; Paid-heavy reaches more users but has a 40% chance of never paying back." The sentence comes from the results by tested, pure code in `src/insights/`. It is never hand-written per screen.
- **Product analytics** are privacy-friendly: no cookies and no personal data. They track the core funnel (lab opened → first simulation run → scenario edited → scenarios compared → report shared → report opened). Events are documented in `docs/metrics.md` and implemented in M5. The north star is **scenarios compared per active user per week**.
- **Out of scope for v1:** real ad-account integrations, multi-product or multi-market launches, team accounts. Push back on scope creep toward these.

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
5. **Sources of truth.** On `/lab`, the Zustand store is the source of truth (persisted). On `/report`, the URL is the source of truth (read-only).
6. **Simulation never blocks the main thread.** The UI calls `useSimulation()`, which talks to `workers/simulation.worker.ts`. Inputs are debounced (~250 ms) and stale runs are cancelled.
7. **Format at the edge.** The engine returns raw numbers: money in whole USD, rates as 0–1 fractions. Only `lib/format.ts` turns them into strings.
8. **Insights are computed, not written.** `src/insights/` is pure (same rules as the engine). It turns `SimulationResult`s into structured findings plus one headline sentence. Findings rank by decision impact, so the headline answers "which plan, and what's the risk?".
9. **Analytics go through one wrapper.** Components call `track(event, props)` from `lib/analytics.ts` and never a vendor SDK directly. Event names and props are a typed union that matches `docs/metrics.md`. No personal data, no scenario contents, no cookies.

## Folder structure

```
/
├─ CLAUDE.md
├─ README.md                    # product case study: problem, users, decisions, trade-offs, screenshots
├─ docs/
│  ├─ product-brief.md          # problem, personas, hypotheses, north star, scope
│  ├─ model.md                  # how the simulation works; every assumption with source + date
│  ├─ metrics.md                # analytics events, properties, funnel, north star definition
│  └─ decisions/                # short ADRs (001-url-state.md, 002-pert-distributions.md, …)
├─ e2e/                         # Playwright smoke tests
├─ public/
└─ src/
   ├─ app/
   │  ├─ layout.tsx             # fonts, theme provider, metadata
   │  ├─ globals.css            # design tokens (light + dark) and Tailwind @theme
   │  ├─ page.tsx               # landing: one-line pitch → opens /lab with sample data
   │  ├─ lab/page.tsx           # editor + results + compare workspace
   │  ├─ report/page.tsx        # read-only shared report (?s=<encoded>)
   │  ├─ report/opengraph-image.tsx  # dynamic share preview card
   │  └─ methodology/page.tsx   # human-readable version of docs/model.md
   ├─ engine/                   # PURE. No React/DOM. Fully unit-tested.
   │  ├─ index.ts               # public API: simulate(), runSensitivity()
   │  ├─ types.ts
   │  ├─ rng.ts                 # mulberry32, seed derivation
   │  ├─ distributions.ts       # PERT, lognormal, binomial (normal approx)
   │  ├─ channels.ts            # spend → impressions → saturating reach
   │  ├─ seasonality.ts
   │  ├─ funnel.ts              # reach → visit → sign-up → activation → paying
   │  ├─ economics.ts           # revenue, MRR, CAC, payback
   │  ├─ monteCarlo.ts          # run loop + aggregation
   │  ├─ sensitivity.ts         # tornado analysis
   │  ├─ stats.ts               # percentiles, histograms
   │  └─ *.test.ts              # colocated tests
   ├─ insights/                 # PURE. results → ranked findings + headline sentence (+ tests)
   ├─ design/
   │  ├─ palette.ts             # color values per theme; mirrored in globals.css (test-enforced)
   │  └─ fonts.ts               # next/font setup; each trio sets --ff-display/--ff-body/--ff-mono
   ├─ data/
   │  ├─ channelBenchmarks.ts   # Assumption records per channel (value, source, asOf)
   │  ├─ seasonality.ts         # Assumption records per month
   │  └─ sampleScenarios.ts     # Briefly + 3 scenarios
   ├─ schema/
   │  ├─ scenario.ts            # Zod schemas (inputs to the engine)
   │  ├─ migrations.ts
   │  └─ share.ts               # encode/decode share URL
   ├─ workers/simulation.worker.ts
   ├─ hooks/useSimulation.ts
   ├─ store/scenarios.ts        # Zustand: up to 3 scenarios, active id
   ├─ components/
   │  ├─ layout/                # SiteHeader, SiteFooter
   │  ├─ ui/                    # Button, NumberField, Slider, Segmented, Tooltip, ThemeToggle, AssumptionMarker
   │  ├─ charts/                # FunnelChart, RangeBar, TornadoChart, Timeline, Histogram
   │  ├─ scenario/              # ScenarioEditor, ChannelMix, PricingInput, WindowInput
   │  ├─ results/               # InsightHeadline, KpiReadout, DropOffPanel
   │  ├─ compare/               # CompareGrid, WinnerCallout
   │  └─ report/                # ReportView, ShareButton
   └─ lib/
      ├─ format.ts              # currency, compact numbers, ranges ("$41k–$68k")
      ├─ analytics.ts           # typed track() wrapper, the only place a vendor SDK is imported
      ├─ color.ts               # WCAG contrast + OKLCH helpers (palette tests, style guide)
      ├─ theme.ts               # theme preference type, storage key, inline init script
      ├─ site.ts                # name, tagline, repo URL, current milestone
      └─ cn.ts
```

## Data model

The code is the source of truth once it exists (`src/engine/types.ts`, `src/schema/scenario.ts`). This is the intended shape.

```ts
type Range = { low: number; likely: number; high: number };   // sampled as PERT(low, likely, high)

// Every default in src/data/ is wrapped like this. The UI's AssumptionMarker reads source + asOf.
type Assumption<T> = {
  value: T;
  source: string;            // short citation, e.g. "WordStream Google Ads benchmarks"
  sourceUrl?: string;
  asOf: string;              // 'YYYY-MM' the figure refers to
  note?: string;             // why we adjusted it, if we did
};

type ChannelId =
  | 'paid_search' | 'paid_social' | 'content_seo' | 'email'
  | 'influencer' | 'community' | 'product_hunt' | 'partnerships';

type ChannelAssumptions = {
  costPerThousand: Range;     // $ per 1,000 impressions (organic channels: effort cost)
  clickThrough: Range;        // reach → visit
  intentMultiplier: number;   // scales visit → sign-up (search > social)
  rampProfile: 'flat' | 'spike' | 'build';  // how impact spreads across the window's weeks
};

type ScenarioInput = {
  v: 1;
  id: string;
  name: string;
  seed: number;
  audienceSize: number;               // reachable people in the target market
  totalBudget: number;                // USD for the whole launch window
  pricing: {
    model: 'subscription' | 'one_time';
    price: number;                    // USD per month, or one-time
    grossMargin: number;              // 0–1, default 0.8
    monthlyChurn?: Range;             // subscription only
  };
  channels: Array<{                   // 1–4 items; shares sum to 1
    channel: ChannelId;
    budgetShare: number;
    overrides?: Partial<ChannelAssumptions>;
  }>;
  window: { startMonth: 1|2|3|4|5|6|7|8|9|10|11|12; weeks: number };
  funnel: { signupRate: Range; activationRate: Range; paidConversion: Range };
};

type Dist = { p10: number; p50: number; p90: number; mean: number };

type SimulationResult = {
  scenarioId: string;
  runs: number;                                   // default 5,000
  stages: Record<'reach'|'visit'|'signup'|'activation'|'paying', Dist>;
  dropOff: Array<{ from: Stage; to: Stage; rate: Dist; lost: Dist }>;
  byChannel: Record<ChannelId, { spend: number; paying: Dist; cac: Dist }>;
  weekly: Array<{ week: number; paying: Dist; cumulativeRevenue: Dist }>;
  revenue: Dist;                                  // revenue earned inside the window
  mrrAtEnd: Dist;                                 // subscription only
  cac: Dist;                                      // blended
  paybackMonths: Dist;                            // capped at 36; UI shows "> 36 mo"
  probPaybackWithin12: number;                    // 0–1
  histogram: { metric: 'paying'; bins: Array<{ x0: number; x1: number; count: number }> };
};

type SensitivityResult = {
  metric: 'paying' | 'revenue' | 'cac';
  baseline: number;
  bars: Array<{ input: string; label: string; lowValue: number; highValue: number; swing: number }>; // sorted by swing desc
};

type Insight = {
  headline: string;                    // the one sentence shown above every results view
  findings: Array<{
    kind: 'winner' | 'payback_risk' | 'biggest_leak' | 'top_driver' | 'channel_mismatch';
    scenarioId?: string;
    severity: 'info' | 'good' | 'warning' | 'risk';
    text: string;
  }>;
};
```

### How one simulation run works

1. Draw every uncertain parameter **once per run** from PERT(low, likely, high). It stays fixed across weeks so the run is internally consistent.
2. Per channel per week: spend = budget × share × ramp weight → impressions = spend / CPM × 1000 → **reach on a saturating curve** against the audience (diminishing returns, so doubling spend doesn't double reach). Overlap between channels is treated as independent.
3. Apply the start month's seasonality multiplier to cost and conversion.
4. Funnel: visits = reach × CTR; sign-ups = visits × signupRate × intent; activations; paying. Each step is a binomial draw, using a normal approximation when n > 1,000.
5. Economics: revenue in the window, MRR at the end, CAC = spend / paying users (blended and per channel), payback = months until cumulative gross-margin revenue per customer (after churn) ≥ CAC.
6. Repeat N runs and aggregate to P10/P50/P90.

**Sensitivity (tornado):** for each uncertain input, plus budget, price and audience at ±20%, set it to its low and then its high while holding everything else at likely. Record the change in the target metric and sort by swing. The top bar is "the input that matters most", and the UI says it in a sentence.

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
- **Insight headline:** one sentence of at most ~30 words. It names the scenario and the number and states the risk in odds ("a 40% chance of never paying back"). No hedging filler and no chart jargon.
- **Assumptions:** never add a default number to `src/data/` without an `Assumption` wrapper, a `docs/model.md` entry with source and date, and an `AssumptionMarker` wherever it's shown.
- **Dependencies:** add one only if it clearly earns its weight. Note why in the commit message.
- **Git:** Conventional Commits (`feat(engine): …`, `fix(ui): …`), small commits during work. **Every milestone ends with a clear milestone commit (e.g. `feat: M1 simulation engine`), a git tag (`m1`, …), and a push to the public GitHub repo `launch-lab`**, followed by the Vercel deploy and a README update.

## Design system: "analytical instrument"

Think engineering lab equipment or a high-end measurement tool, not a SaaS template.

- **Surfaces:** light = cool, slightly blue-tinted off-white; dark = deep slate. Both themes get equal care, and neither is a mechanical inversion of the other.
- **Type:** a distinctive, sharp sans for headings (**not Inter, not Space Grotesk**), a readable sans for body, and monospace with tabular numbers for **all** figures.
- **Color:** **one signal accent, used only for the key insight on each screen** (the winning scenario, the biggest drop-off, the top sensitivity bar). Separate semantic colors for good / warning / risk, which must not be confusable with the accent. Everything else is neutral.
- **Charts as instrument readouts:** thin precise lines (1–1.5px), uncertainty bands for worst/likely/best, direct labels instead of legends where possible, a faint grid, tick marks.
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
- [ ] **M1 – Simulation engine.** `src/engine` complete per the data model: RNG, PERT, channels + saturation, seasonality, funnel, economics, Monte Carlo, aggregation. Sample data with every default wrapped as an `Assumption` (source + asOf). Full unit + property tests. `docs/model.md` lists every assumption with source and date.
  *Ships:* a tested engine, plus a temporary results table on `/lab` for the sample scenario.
- [ ] **M2 – Single-scenario lab.** Scenario editor (audience, budget, pricing, ≤ 4 channels with linked budget-split sliders, window), Web Worker + `useSimulation`, `src/insights/` with the single-scenario headline sentence **above** the KPI readouts (revenue, CAC, payback as worst/likely/best), funnel drop-off chart with the biggest leak highlighted, weekly timeline with uncertainty band. `AssumptionMarker` on every default-driven value. Mobile layout and both themes.
  *Ships:* a useful single-scenario simulator that opens with sample data and leads with its takeaway.
- [ ] **M3 – Sensitivity and insights.** Tornado chart with a switchable metric, led by a "what matters most" sentence. Outcome histogram, an assumptions drawer (view source/date and edit each benchmark), and a `/methodology` page.
  *Ships:* the "why" behind each number.
- [ ] **M4 – Compare scenarios.** Up to 3 scenarios: add, duplicate, rename, delete. A comparison headline sentence (winner + main risk) above a side-by-side grid with aligned scales, a winner callout (accent) per metric, and deltas vs baseline. All 3 sample scenarios load on first visit.
  *Ships:* the full core workflow.
- [ ] **M5 – Shareable report + analytics.** URL encode/decode with schema version + migrations, read-only `/report` page (headline sentence first, single scenario or comparison), copy-link button, dynamic OG image (the image shows the headline), print stylesheet. Malformed links show a friendly error and never crash. Cookieless analytics via `lib/analytics.ts`: page views, plus events `lab_opened`, `first_simulation_run`, `scenario_edited`, `scenarios_compared`, `report_shared`, `report_opened`. `docs/metrics.md` covers each event, its properties, the funnel, and how the north star is computed. Resolve the provider decision first (see Stack).
  *Ships:* links that look good when pasted into Slack or LinkedIn, plus a measurable activation funnel.
- [ ] **M6 – Polish and launch.** Playwright smoke suite (desktop + mobile), accessibility pass, Lighthouse ≥ 95 on all four categories, loading/empty/error states, micro-interactions (respecting reduced motion), README rewritten as a product case study with screenshots and a GIF, final ADRs.
  *Ships:* the portfolio-ready v1.

## Decision log

Record significant decisions here (one line each) and write an ADR in `docs/decisions/` for the bigger ones.

- 2026-10-22: Share via URL-encoded state, no database (ADR 001, to write in M5).
- 2026-10-22: Subscription pricing by default with a one-time option; window = start month + weeks.
- 2026-10-22: PERT distributions for user-facing ranges, because PMs think in low/likely/high (ADR 002, to write in M1).
- 2026-10-22: Every default is an `Assumption` with source + date, shown in the UI via `AssumptionMarker`.
- 2026-10-22: Insight-first. Every results view opens with a computed headline sentence.
- 2026-10-22: Design gate: Option A type + Option B ultramarine accent, made more saturated, on cooler-gray neutrals with classic semantics. Invariants are test-enforced.
- 2026-10-22: Dropped `next-themes`. Theming uses the inline-script pattern from the Next 16.4 docs plus `light-dark()` tokens.
- 2026-10-22: Cookieless product analytics in M5. Vercel Web Analytics custom events are Pro-only (checked 2026-10-22), so provider TBD.
