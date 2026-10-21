# Launch Lab: Product brief

**Status:** v1 in build · **Last updated:** 2026-10-22

## One line

Launch Lab lets product marketers and founders simulate a launch before they spend money. They can see the likely range of outcomes, compare plans side by side and share the reasoning with whoever approves the budget.

## Problem

Launch plans get committed before anyone tests whether the numbers hold.

- **Decisions rest on gut feel.** Channel mix, budget and pricing are set from last year's spreadsheet, a benchmark blog post or the loudest opinion in the room.
- **Feedback arrives after the money is spent.** The first real signal on whether a plan works comes weeks into the launch, when the budget is already committed.
- **Trade-offs stay invisible.** "More reach" and "faster payback" pull in different directions, but a single-number forecast hides that tension.
- **Teams argue from different mental models.** Marketing, finance and the founder each carry their own unstated assumptions, so debates are about conclusions instead of inputs.

## Who it's for

### Primary: Maya, solo PMM at a 20–80 person startup

Maya owns positioning, launch planning and channel strategy without a data team behind her. She builds launch plans in spreadsheets she half-trusts and has to defend budget requests to a founder or a VP who asks "how confident are you?"

**Job to be done:** *When I'm planning a launch, I want to test my plan against a realistic range of outcomes, so I can commit to the strongest option and defend it with numbers.*

### Secondary

- **Daniel, founder-PM.** He's burning runway on wrong bets. He needs to know which launch plan is least likely to waste money before he commits scarce cash.
- **Noa, growth lead.** She can't show leadership the trade-offs between plans. She needs a clear, shareable comparison that makes the decision legible to non-specialists.

## Hypotheses

| # | We believe… | We'll know we're right if… |
|---|---|---|
| **H1** | PMMs plan launches on untested assumptions. | Most users edit at least one default assumption in their first session (`scenario_edited`). |
| **H2** | Comparing scenarios matters more than a precise forecast. | Users who compare ≥ 2 scenarios return more often than users who run only one (`scenarios_compared` → week-2 retention). |
| **H3** | Users trust a model they can see and adjust. | Users open assumption details and the methodology page before sharing a report. |
| **H4** | A shareable report helps win budget approval. | Shared reports get opened by someone else (`report_shared` → `report_opened` rate). |
| **H5** | Small teams would pay for this. | Not testable through usage analytics in v1. Validate later with a pricing-page smoke test and user interviews. |

## How we'll measure it

**North star:** scenarios compared per active user per week.

The north star rewards the behavior that delivers the value (testing alternatives before committing), not just traffic. It moves only if users trust the model enough to iterate (H1, H3) and find comparison useful (H2).

**Activation funnel** (event definitions in [`metrics.md`](metrics.md)):

`lab_opened` → `first_simulation_run` → `scenario_edited` → `scenarios_compared` → `report_shared` → `report_opened`

## What v1 does

- Inputs: audience size, price (subscription or one-time), up to 4 channels with a budget split, launch window (start month + weeks).
- Monte Carlo simulation through reach → visit → sign-up → activation → paying user, with downside / likely / upside ranges (P10 / P50 / P90) instead of one number.
- Revenue, CAC and payback period per scenario.
- Sensitivity analysis showing which input matters most.
- Drop-off visualization for each funnel stage.
- Side-by-side comparison of up to 3 scenarios.
- A shareable report link with no sign-up.
- Sample data on first load, so it's useful immediately.
- Every results view opens with a single plain-English takeaway sentence.
- Every default is labeled as an assumption, with a source and a date.

## Out of scope for v1

- Real ad-account integrations (Google Ads, Meta, LinkedIn).
- Multi-product or multi-market launches.
- Team accounts, sign-in or saved workspaces.

## Risks

| Risk | Mitigation |
|---|---|
| Users treat outputs as predictions. | Always show ranges, label every default as an assumption, publish the methodology. |
| Benchmarks go stale or don't fit a niche. | Every benchmark carries a source and date and is editable. |
| The model is too abstract to trust. | Insight-first sentences, visible drop-off per stage, sensitivity showing which inputs drive the result. |
