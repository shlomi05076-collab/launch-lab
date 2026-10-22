# Launch Lab: Product brief

**Status:** v1 in build · **Last updated:** 2026-10-22 (repositioned before M2)

## One line

Launch Lab helps anyone with a product idea answer **"Can my idea work, and what would have to be true?"** before they spend money on it. It gives a plain-language viability check for first-time founders and a full simulation lab for marketers and founders who already know their numbers.

## Problem

People commit money to an idea before anyone tests whether the numbers could ever add up.

- **First-time founders can't run the numbers.** Someone with an idea and some savings doesn't know what a typical sign-up rate is, what an ad costs, or what "CAC" means. They either skip the math or trust a gut feeling.
- **Verdicts don't help.** "Your idea is viable" or "not viable" calculators hide their reasoning. When the verdict is wrong, the user has no idea which assumption broke.
- **Feedback arrives after the money is spent.** The first real signal comes weeks into the launch, when the savings or the budget are already gone.
- **Trade-offs stay invisible.** "More customers" and "earning the money back" pull in different directions, but a single-number forecast hides that tension.
- **Teams argue from different mental models.** For startups with a marketer, marketing, finance and the founder each carry unstated assumptions, so debates are about conclusions instead of inputs.

## Who it's for

### Primary: Omer, 27, has an idea and some savings

Omer has a startup idea and enough savings to try it. He has never run marketing and doesn't know terms like CAC or churn. He doesn't want a spreadsheet course; he wants to know whether the idea is worth pursuing, and how much of his savings it could take.

**Job to be done:** *When I have a product idea, I want to see what would have to be true for it to work, in words I understand, so I can decide whether to spend my savings on it and what to test first.*

**What Omer needs from Launch Lab:**
- Questions in plain language, with a "not sure" answer for everything.
- A clear answer that never pretends to know whether his idea will succeed.
- To see which single assumption his idea depends on most, compared with what similar products usually achieve.

### Secondary: people who know their numbers (expert mode)

- **Maya, solo PMM at a 20–80 person startup.** She owns launch planning without a data team and has to defend budget requests. *When I'm planning a launch, I want to test my plan against a realistic range of outcomes, so I can commit to the strongest option and defend it with numbers.*
- **Daniel, founder-PM.** He's burning runway on wrong bets and needs to know which launch plan is least likely to waste money before he commits scarce cash.
- **Noa, growth lead.** She can't show leadership the trade-offs between plans and needs a clear, shareable comparison that non-specialists can follow.

## Hypotheses

| # | We believe… | We'll know we're right if… |
|---|---|---|
| **H1** | People plan launches on untested assumptions. | Most expert users edit at least one default in their first session (`scenario_edited`), and most guided users answer "not sure" to at least one question. |
| **H2** | Comparing scenarios matters more than a precise forecast. | Expert users who compare ≥ 2 scenarios return more often than users who run only one. |
| **H3** | Users trust a model they can see and adjust. | Users open assumption details or the methodology page before sharing or saving. |
| **H4** | A shareable report helps win budget approval, or a co-founder's or partner's buy-in. | Shared reports get opened by someone else (`report_shared` → `report_opened`). |
| **H5** | Small teams would pay for this. | Not testable through usage analytics in v1. Validate later with a pricing-page smoke test and interviews. |
| **H6** | People with an idea will trust a viability check more if it explains **what must be true** than if it gives a pass/fail verdict. | Guided users who reach the "what would have to be true" view go on to change an answer, save the idea or open expert mode more often than those who leave after the headline. Validate qualitatively with 5–8 first-time founder interviews comparing the two framings. |

## How we'll measure it

**North star (approved 2026-10-22):** ideas checked per week, counting each guided check that reaches the "what would have to be true" view.

It rewards the moment the product delivers its value to the primary persona: understanding what an idea depends on, not just seeing a number. It moves only if the questions are answerable (H1) and the answer is trusted enough to read on (H3, H6). For expert users, **scenarios compared per active user per week** remains the secondary metric (H2).

**Funnels** (event definitions in [`metrics.md`](metrics.md), written in the analytics milestone):

- Guided: `idea_started` → `idea_completed` → `must_be_true_viewed` → `idea_saved` / `expert_opened` / `report_shared`
- Expert: `lab_opened` → `first_simulation_run` → `scenario_edited` → `scenarios_compared` → `report_shared` → `report_opened`

## What v1 does

**Test my idea (main entry point)**
- 6–8 plain-language questions: what you're selling, who buys it, how you charge and how much, your marketing budget, when you launch, how people will find out about it. Each has a "not sure" answer that uses a sourced default for that kind of product.
- Five product types with sourced defaults, shown as plain choices: business software, an app people pay for monthly, an online store, a digital product or course, a service or agency.
- A viability answer, not a verdict: likely customers for the budget, how many customers you'd need to earn the spend back, the chance to earn back the spend within a year, and the one assumption that matters most.
- For one-time products, a sourced "purchases per customer in the first year" default, so repeat buying counts toward earning the spend back.
- "How to test this cheaply": one concrete real-world test of the assumption that matters most, for under 10% of the planned budget, with a pass mark taken from the break-even value.
- A "what would have to be true" view: for each key input, the value needed to break even next to what similar products usually achieve.
- No jargon in the questions. Terms like CAC appear only in results, each with a one-line explanation.
- "See an example" opens the Briefly sample.

**Expert mode**
- Every input, custom channels, and overriding defaults with your own numbers (labeled "your data", not "assumption").
- Monte Carlo simulation with downside / likely / upside (P10 / P50 / P90) results, revenue, CAC and payback.
- Sensitivity analysis, funnel drop-off and a weekly timeline.
- Side-by-side comparison of up to 3 scenarios.

**Everywhere**
- Scenarios saved in the browser, with rename, duplicate and delete. No account and no backend.
- Share links that reproduce the exact result.
- Every results view opens with one plain-English takeaway sentence.
- Every default is labeled as an assumption, with a source and a date.
- Every result carries a disclaimer: this is a planning simulation based on industry averages, not a prediction or financial advice.

## Out of scope for v1

- Pass/fail verdicts, "viability scores" or any claim that an idea will succeed or fail.
- Financial, legal or investment advice.
- Real ad-account integrations (Google Ads, Meta, LinkedIn).
- Multi-product or multi-market launches.
- Accounts, sign-in or cloud-saved workspaces.

## Risks

| Risk | Mitigation |
|---|---|
| Users read the result as a prediction or a green light to quit their job. | Ranges instead of single numbers, "what would have to be true" framing, a disclaimer on every result, and a test that bans verdict language from generated copy. |
| Defaults don't fit an unusual idea. | Every default is sourced, dated and editable. Product-type templates are labeled "similar products", and expert mode accepts the user's own data. |
| First-time founders still hit jargon. | No jargon in the questions; terms appear in results only with a one-line explanation. Rates are shown as "1 in 25 visitors", not "4%". |
| The model is too abstract to trust. | Insight-first sentences, the break-even point shown against the likely range, and the one assumption that matters most. |
| Benchmarks go stale. | Every benchmark carries a source and date. |
