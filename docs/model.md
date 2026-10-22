# How the Launch Lab model works

Launch Lab simulates **5,000 versions of your launch**. In each one, the budget buys impressions, the impressions reach people with diminishing returns, and those people drop off stage by stage. Each version uses slightly different, plausible conversion rates, and the **spread of outcomes across the 5,000 versions is the answer**.

It is a **comparison tool, not a forecast**. Benchmarks are averages and a given product can sit far from them. The ranges show *uncertainty* but cannot correct *bias*. What the model does well is show which plan holds up across many plausible worlds, why, and which assumption decides it.

Code: `src/engine/` (pure TypeScript, no UI). Defaults: `src/data/`. Every number below is enforced by tests.

---

## Downside, likely, upside

Every result is reported as three outcomes:

| Label | Meaning |
|---|---|
| **Downside (P10)** | 10% of simulated launches did *worse* than this. It is **not** the worst case. |
| **Likely (P50)** | The median: half did better, half did worse. |
| **Upside (P90)** | 10% of simulated launches did *better* than this. |

"Worse" depends on the metric. For things where more is better (paying customers, revenue), the downside is the 10th percentile. For costs, where higher is worse (CAC, payback months), the downside is the **90th** percentile. The rule lives in one place (`engine/outcomes.ts`), so "downside" always means "the outcome that 10% of launches did worse than."

---

## One simulated launch, step by step

### 1. Budget becomes impressions

Each channel gets its share of the budget, spread across the launch weeks by its **ramp**:
- **Flat:** even every week.
- **Spike:** front-loaded, roughly halving each week.
- **Build:** grows linearly.

Each week's spend buys impressions at the channel's **cost per 1,000 impressions (CPM)**, adjusted for that month's seasonal cost.

> impressions = spend ÷ CPM × 1,000

For organic channels (content & SEO), "cost" means production cost per 1,000 search impressions, so every channel sits on the same scale.

### 2. Impressions become people, with diminishing returns

Impressions land at random across the audience, like raindrops on a field. After *I* impressions on an audience of *A* people, the chance a given person was never hit is about e^(−I/A), so:

> unique reach = A × (1 − e^(−I/A))

When impressions equal the audience size, you reach **63%** of it, not 100%. Doubling impressions reaches **86%**, not 126%. This is why doubling budget never doubles results.

All channels share **one audience**. Overlap is counted once, and each channel is credited with new reach in proportion to the impressions it bought that week.

### 3. People become visitors

Every impression has a chance of producing a click: the channel's **click-through rate (CTR)**, exactly as ad platforms report it. A person visits at most once, so clicks saturate the same way impressions do:

> unique visitors = A × (1 − e^(−Σ impressions × CTR ÷ A))

Each channel is credited with new visitors in proportion to the clicks it produced that week.

### 4. Visitors become customers

| Stage | Rate | Set by |
|---|---|---|
| Visit → sign-up | sign-up rate × channel **intent** × month's **demand** index | Mostly the product; the channel adjusts it |
| Sign-up → activation | activation rate | The product (onboarding) |
| Activation → paying | paid conversion | The product and price |

**Intent** reflects why the visitor came. Someone who searched for the category is more ready (×1.5) than someone interrupted in a feed (×0.8).

The first stage depends on the **channel** and the last three on the **product**, which makes the drop-off chart actionable. A leak at the top is a channel problem; a leak lower down is a product or onboarding problem.

### 5. Seasonality

Each calendar month has two multipliers:
- **Cost index:** ads cost more when auctions are crowded, like the Black Friday peak, and less in January.
- **Demand index:** software buying is strongest in Q4, when budgets expire, and softest in summer.

Each launch week uses the multipliers of the month its midpoint falls in. An 8-week launch starting in November gets expensive November–December weeks and a cheap early-January tail.

### 6. Revenue and churn

New subscribers start paying in the week they convert, at price ÷ (52 ÷ 12) per week. Each month a fixed share of subscribers cancel (**churn**), applied weekly so that four and a third weeks compound to one month. The model reports:
- **Revenue in the launch window:** everything collected during the window.
- **MRR at the end:** active subscribers × monthly price.

With one-time pricing, churn and MRR don't apply. Each customer makes a first purchase in the week they convert. Customers who buy again (**purchases per customer in the first year**, sourced per product type) make their repeat purchases evenly over the following 12 months. Repeat purchases that fall inside the launch window count toward revenue in the window.

### 7. CAC and payback

> **CAC** = money spent ÷ paying customers (blended, and per channel)

> **Payback** = months until one customer's cumulative gross margin covers their CAC

The key point is that churn caps what a customer can ever be worth. With monthly margin *g* = price × gross margin and monthly churn *c*, an average customer's lifetime margin can never exceed **g ÷ c**.
- At $34.30 margin and 3.5% churn, that cap is $980.
- If CAC is above the cap, the plan **never** pays back, however long you wait.

Solving the cumulative margin g(1 − (1−c)ⁿ)/c = CAC for *n* gives:

> payback months = ln(1 − CAC × c ÷ g) ÷ ln(1 − c)

This is how the model can say "a 40% chance of never paying back": in 40% of simulated worlds, CAC exceeds the lifetime cap.

For one-time pricing:
- Payback is immediate if the first purchase's margin covers CAC.
- Otherwise, repeat purchases pay it back part-way through the first year: months = (CAC − first-purchase margin) ÷ (monthly margin from repeats).
- Purchases after the first year aren't modeled, so if the first year doesn't cover CAC the payback is reported as "not within the first year".

---

## Where the randomness comes from

There are two separate sources of uncertainty, kept apart on purpose.

**1. We don't know the true rates. This is by far the bigger effect.**

Every uncertain input is a low / likely / high range, sampled from a **PERT distribution**, a standard project-estimation tool. It clusters near "likely" but can reach the extremes, and its mean is (low + 4 × likely + high) ÷ 6.

Each simulated launch draws every input once and keeps it for the whole launch, so one run is one consistent possible world.

**Market response.** In reality, if the positioning misses, sign-up, activation and paid conversion all suffer together; if it lands, they all lift. Drawing them independently would let a bad sign-up rate be offset by a lucky paid rate, which makes the downside look rosier than it should.

So each simulated launch also draws one shared "market response" that nudges all three product rates in the same direction, with a moderate pairwise correlation of 0.5. Each rate still keeps its own range and shape. In tests, this widens the downside-to-upside spread of paying customers by more than 15% without moving the likely value.

Channel costs, click-through rates and churn are drawn independently.

**2. Even with known rates, people are random.**

If 400 people activate at a 10% conversion rate, you won't get exactly 40 paying users; you'll get 35 or 44. From sign-up onward, where counts get small, the model draws actual counts the way coin flips would (binomial draws). Reach and visitors are in the thousands, where luck averages out, so they are computed as expectations.

**Runs and seeds.** Each scenario runs 5,000 times. Every scenario carries a fixed random seed, so the same inputs always give exactly the same result. That makes share links reproducible and lets tests check exact values.

---

## Sensitivity: what matters most

The tornado analysis takes one input at a time and moves it between its **plausible low and high**, holding everything else at "likely". It then measures how far the outcome moves:
- For uncertain inputs, the plausible low and high are the P10 and P90 of the input's own distribution. The extremes are near-impossible by construction and would exaggerate every bar.
- For fixed inputs (budget, price, audience size), the swing is ±20%.

These runs have no randomness, so the ranking is exact. The input with the biggest swing is "what matters most." In the sample scenarios it is usually **sign-up rate**, closely followed by **paid conversion**. That's a useful reminder that positioning and onboarding often matter more than channel choice.

Expert mode can rank inputs by paying customers, revenue or CAC. The guided "Test my idea" flow ranks them by **net return within a year**: the gross margin the launch's customers earn in 12 months, minus the marketing spend. Paying customers alone would miss price, churn and repeat purchases, which don't change how many people buy but decide whether they earn the spend back.

---

## Break-even: what would have to be true

The guided flow answers "can my idea work, and what would have to be true?" without a verdict. Three numbers carry the answer.

**1. What one customer is worth in a year.** The gross margin a customer earns in their first 12 months:
- Subscription: g × (1 − (1 − c)¹²) ÷ c, where g = price × gross margin and c = monthly churn (12 × g with no churn).
- One-time: price × gross margin × purchases in the first year.

**2. Customers needed to break even** = marketing spend ÷ what one customer is worth in a year. Break-even means the customers won during the launch **earn back the marketing spend within 12 months**. It covers marketing spend only, not the cost of building or running the product, and the results say so.

**3. What would have to be true.** For each key input on its own, the engine finds the value at which the *likely* launch (no randomness, every other input at its typical value) lands exactly on break-even. Bisection works here because each input moves the outcome in one direction only. The inputs are:

| Requirement | Better when | Notes |
|---|---|---|
| Visitors who sign up (sign-up rate) | higher | |
| Sign-ups who end up paying (activation × paid conversion) | higher | Solved as one combined rate |
| Cost per visitor from ads | lower | Every channel's cost per 1,000 scaled by the same factor; blended by budget share |
| Price | higher | |
| Customers who cancel each month (subscriptions) | lower | |
| Purchases per customer in the first year (one-time) | higher | |

Each needed value is compared with what similar products achieve: the input's typical range from the product-type template. For combined rates, the typical range comes from a 64 × 64 grid over both distributions.

| Needed value is… | Label |
|---|---|
| At or better than what similar products usually get (their likely value) | **Typical** |
| Beyond that, but within what the top ~10% reach (their P90, or P10 for costs and churn) | **Needs above-typical results** |
| Beyond the top ~10%, or not reachable by changing this input alone | **Rarely seen** |

The labels describe the **requirement**, never the idea. When the launch is already above break-even, each needed value shows how much room there is (e.g. "sign-ups could fall to 1 in 70"), and every status is Typical by construction; a property test checks this. The **chance to earn back the spend within a year** comes from the 5,000-run simulation: the share of simulated launches whose customers' first-year value covers their cost. For subscriptions that equals the chance of payback within 12 months.

---

## Worked example

You can check this one with a calculator. `src/engine/sanity.test.ts` asserts that the engine reproduces every line.

**Inputs:** $10,000 budget on one channel at a $10 CPM and 1% click-through, an audience of 1,000,000, sign-up 10%, activation 50%, paid conversion 20%, $20/month at 80% gross margin, 3% monthly churn, a one-week window, no seasonality, no randomness.

| Step | Calculation | Result |
|---|---|---|
| Impressions | $10,000 ÷ $10 × 1,000 | 1,000,000 |
| Unique reach | 1,000,000 × (1 − e^−1) | 632,121 |
| Unique visitors | 1,000,000 × (1 − e^−(1,000,000 × 1% ÷ 1,000,000)) = 1,000,000 × (1 − e^−0.01) | 9,950 |
| Sign-ups | 9,950 × 10% | 995.0 |
| Activated | 995.0 × 50% | 497.5 |
| Paying | 497.5 × 20% | 99.5 |
| CAC | $10,000 ÷ 99.5 | $100.50 |
| Monthly margin per customer | $20 × 80% | $16.00 |
| Payback, no churn | $100.50 ÷ $16.00 | 6.28 months |
| Payback, 3% churn | ln(1 − 100.50 × 0.03 ÷ 16) ÷ ln(0.97) = ln(0.8116) ÷ ln(0.97) | 6.85 months |
| Revenue in the 1-week window | 99.5 × $20 ÷ (52 ÷ 12) | $459 |
| MRR at the end | 99.5 × $20 | $1,990 |

Note that visitors come out at 9,950, slightly under 1% of impressions: a few people clicked twice but are counted once. The test also checks three variants:
- With a one-time $150 price, payback is immediate ($120 margin ≥ $100.50 CAC).
- Spreading the same budget over 4 weeks still gives 99.5 paying customers.
- With randomness switched on, the average lands within 2% of 99.5.

### Break-even worked example

`src/engine/viability.test.ts` checks every line, using the same scenario as above:

| Step | Calculation | Result |
|---|---|---|
| Value of one customer in a year | $16 × (1 − 0.97¹²) ÷ 0.03 = $16 × 0.30616 ÷ 0.03 | $163.28 |
| Customers needed | $10,000 ÷ $163.28 | 61.2 |
| Likely customers (from above) | | 99.5, so above break-even |
| Sign-up rate could fall to | 10% × 61.2 ÷ 99.5 | 6.15% (1 in 16) |
| Price could fall to | $20 × 61.2 ÷ 99.5 | $12.31 |
| Sign-ups who pay could fall to | 10% × 61.2 ÷ 99.5 | 6.15% |
| Churn could rise to | solve 99.5 × $16 × (1 − (1 − c)¹²) ÷ c = $10,000 | ≈ 12.9% a month |

Sign-up rate and price scale the number of paying customers (or their value) in direct proportion, so their thresholds are simple ratios. Churn enters through the 12-month value, so it has to be solved numerically.

---

## Assumptions

Every default is labeled as an assumption in the product and listed here with its **source**, **date**, a one-line **why**, and **confidence**.
- Where sources disagree, the range of what they say is shown along with the reason for the value chosen.
- "Launch Lab judgment" means no published benchmark was found. Those values are marked low confidence, and every one of them is editable.
- Dates are when the source's data is from.

A test (`src/data/assumptions.test.ts`) fails if any default in `src/data/` is missing from this section.

### Channel assumptions

Costs are USD per 1,000 impressions; click-through rates are per impression. Ranges are low / **likely** / high.

#### Paid search

| ID | Value | Source (date) | Why | Confidence |
|---|---|---|---|---|
| `paid_search.costPerThousand` | $200 / **$350** / $600 | [LocaliQ / WordStream Search Advertising Benchmarks 2025](https://localiq.com/blog/search-advertising-benchmarks/) (2025-06) | Search is bought per click, so CPM = CPC × CTR × 1,000 = $5.26 × 6.66% × 1,000 ≈ $350 | Medium |
| `paid_search.clickThroughRate` | 4% / **6.5%** / 10% | Same (2025-06) | Average search CTR across industries is 6.66% | Medium |
| `paid_search.intentMultiplier` | ×1.5 | Launch Lab judgment (2026-10) | Searchers are already looking for the category | Low |
| `paid_search.rampProfile` | Flat | Launch Lab judgment (2026-10) | Search budgets are paced by daily caps | Medium |

*Where sources disagree:*
- **CPC:** WordStream's report on 16,000+ campaigns gives $5.42; LocaliQ's page gives $5.26. Legal and other high-competition industries pay $9+.
- **CTR:** a smaller regional sample shows 2%–4% against LocaliQ's 6.66%. That lower figure set the low end of the CTR range (4%).

#### Paid social (Meta)

| ID | Value | Source (date) | Why | Confidence |
|---|---|---|---|---|
| `paid_social.costPerThousand` | $6 / **$10** / $15 | [Triple Whale FY2025](https://triplewhale.com/blog/facebook-ads-benchmarks) ($14.19, 35k accounts), [Vaizle 2025](https://insights.vaizle.com/facebook-ad-benchmarks/) ($5.97, 5.2k accounts), QualityUnit ($8.19) (2025-12) | Between the two large-sample figures, nudged up for B2B targeting | Medium |
| `paid_social.clickThroughRate` | 0.6% / **1.2%** / 2.5% | Triple Whale FY2025 (2.19%); Vaizle 2025 (2.46%, quartiles 1.09%–3.06%) (2025-12) | Benchmarks are dominated by consumer brands; B2B software clicks run about half that | Low |
| `paid_social.intentMultiplier` | ×0.8 | Launch Lab judgment (2026-10) | Feed viewers were interrupted, not searching | Low |
| `paid_social.rampProfile` | Flat | Launch Lab judgment (2026-10) | Campaign budgets are paced evenly | Medium |

*Where sources disagree:*
- **CPM:** sources differ by more than 2× ($5.97 vs $14.19), mostly because each vendor's advertiser mix differs. $10 is roughly the midpoint, which is why the range is wide.

#### LinkedIn ads

| ID | Value | Source (date) | Why | Confidence |
|---|---|---|---|---|
| `linkedin_ads.costPerThousand` | $20 / **$35** / $80 | [NAV43 2025](https://nav43.com/blog/2025-linkedin-ads-benchmarks-every-saas-tech-marketer-needs) (median $31 for awareness) (2025) | Job-title targeting costs a premium; just above the awareness median | Low |
| `linkedin_ads.clickThroughRate` | 0.35% / **0.5%** / 0.8% | [Sales-Mind 2025](https://sales-mind.ai/blog/2025-sales-funnel-benchmarks-linkedin) (single image 0.56%, carousel 0.40%); WebFX (0.44%–0.65%) (2025) | Sponsored content CTR clusters at 0.4%–0.65% across formats | Medium |
| `linkedin_ads.intentMultiplier` | ×1.2 | Launch Lab judgment (2026-10) | Professional context and role targeting qualify clicks | Low |
| `linkedin_ads.rampProfile` | Flat | Launch Lab judgment (2026-10) | Campaign budgets are paced evenly | Medium |

*Where sources disagree:*
- **CPM:** published planning ranges run from $10–$20 up to $30–$90 for narrow executive audiences. The likely value follows the only cited median; the high end allows for enterprise targeting.

#### Newsletter sponsorships

| ID | Value | Source (date) | Why | Confidence |
|---|---|---|---|---|
| `newsletter.costPerThousand` | $25 / **$60** / $120 | [Dupple B2B newsletter CPM benchmarks](https://dupple.com/learn/cpm-benchmarks-b2b-newsletters) ($60–$120 primary slots); Paved median $32 (2026) | B2B tech primary slots price at $60–$120; small niche lists start near $25 | Medium |
| `newsletter.clickThroughRate` | 0.5% / **1.5%** / 3% | [Dupple](https://dupple.com/learn/newsletter-cpm-explained) (primary placements 1%–2%); LiveIntent via Voxbooster (2.14%) (2026) | Clicks per delivered email for a primary placement | Medium |
| `newsletter.intentMultiplier` | ×1.1 | Launch Lab judgment (2026-10) | Readers chose the topic, so a relevant sponsor reaches a warmer audience | Low |
| `newsletter.rampProfile` | Flat | Launch Lab judgment (2026-10) | Usually booked as a series of weekly sends | Medium |

*Where sources disagree:*
- **CPM:** cross-industry medians ($32) sit well below B2B rates ($85–$115 for finance and enterprise tech). Launch Lab targets B2B software, so it uses the B2B figures.
- **Provenance:** most of these sources are ad networks with a commercial interest.

#### Creators / influencers

| ID | Value | Source (date) | Why | Confidence |
|---|---|---|---|---|
| `influencer.costPerThousand` | $10 / **$25** / $50 | [IQfluence 2026](https://iqfluence.io/public/blog/cpm-influencer-marketing) ($10–$50 practical range); 2025 report: YouTube $13–$15, Instagram $30 (2026) | B2B creators price mid-range, between YouTube and Instagram | Low |
| `influencer.clickThroughRate` | 0.3% / **0.8%** / 1.5% | Derived from a 2025 engagement benchmark ([Modash](https://www.modash.io/it/blog/influencer-marketing-cpm), YouTube 1.5%) (2025) | No click benchmark found; link clicks are a fraction of engagement | Low |
| `influencer.intentMultiplier` | ×0.9 | Launch Lab judgment (2026-10) | A trusted recommendation helps, but viewers came for the creator | Low |
| `influencer.rampProfile` | Spike | Launch Lab judgment (2026-10) | Most views of a creator post arrive in its first days | Medium |

*Where sources disagree:*
- **CPM:** TikTok's reported CPM ($77) is far above the others and was excluded as unrepresentative for B2B software. No source publishes a click-through benchmark for creator content, so treat this channel as the least certain.

#### Content & SEO

| ID | Value | Source (date) | Why | Confidence |
|---|---|---|---|---|
| `content_seo.costPerThousand` | $20 / **$50** / $150 | [Marketful 2026](https://marketful.com/content-marketing-costs) ($300–$800 per post, all-in) ÷ Launch Lab estimate of 5,000–20,000 search impressions per post within a launch window (2026) | A ~$500 post earning ~10,000 impressions costs ~$50 per 1,000 | Low |
| `content_seo.clickThroughRate` | 1% / **3%** / 8% | [Ahrefs](https://ahrefs.com/blog/ai-overviews-reduce-clicks-update) (position 1 informational CTR 3.9%, Dec 2025); GrowthSRC (position 1 19%, 2025) (2025-12) | New pages rarely rank first, and AI Overviews have cut organic clicks | Low |
| `content_seo.intentMultiplier` | ×1.3 | Launch Lab judgment (2026-10) | Searchers want the topic, though often information rather than a tool | Low |
| `content_seo.rampProfile` | Build | Launch Lab judgment (2026-10) | Pages take weeks to index and rank | Medium |

*Where sources disagree:*
- **Organic CTR:** estimates for position 1 range from 3.9% (Ahrefs, informational keywords) to 19% (GrowthSRC). Ahrefs measured a 58% drop where AI Overviews appear. 3% assumes a new page ranking mid-page 1.
- **Cost per 1,000:** the impressions-per-post figure behind this cost has no published source. It is the single most uncertain number in the model, which is why its range spans 7×.

### Seasonality

| Month | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Cost | 0.85 | 0.90 | 0.95 | 0.95 | 0.97 | 0.97 | 0.95 | 0.97 | 1.00 | 1.05 | 1.25 | 1.15 |
| Demand | 0.99 | 0.99 | 0.99 | 0.97 | 0.97 | 0.97 | 0.98 | 0.98 | 0.98 | 1.06 | 1.06 | 1.06 |

| ID | Source (date) | Why | Confidence |
|---|---|---|---|
| `seasonality.cost` | Constructed from [GeistM Q4 2024/2025 Meta CPM reports](https://geistm.com/blog/meta-rate-trends-q4-2025/) (+22% late Nov 2024, +11% late Nov 2025, −10% across Dec 2025) and Birch's Meta cost analysis (cheapest in January, Black Friday peak +25%–30%) (2025-12) | Auctions get crowded before Black Friday and quiet in January; the index averages 1.0 | Low |
| `seasonality.demand` | FastSpring five-year software sales by quarter (Q1 99%, Q2 97%, Q3 98%, Q4 106%), as summarized by [SyncGTM](https://syncgtm.com/blog/what-part-of-year-has-highest-b2b-sales) (2026) | Software buying peaks in Q4 as budgets expire and is softest in summer; the effect is mild | Medium |

*Where sources disagree:*
- **Cost index:** no source publishes a full monthly CPM series. This index interpolates the points above, which is why confidence is low.
- **Demand index:** FastSpring shows November at 118% globally, driven by Black Friday software discounts. That is a promotion effect rather than demand for a new product, so the model uses the smoother quarterly figures.
- **Correction:** an early draft assumed B2B demand dips in December. The data says Q4 is the strongest quarter, and the model follows the data.

### Market response

| ID | Value | Source (date) | Why | Confidence |
|---|---|---|---|---|
| `model.marketCorrelation` | 0.5 | Launch Lab modeling choice, approved 2026-10-22 (2026-10) | A message that misses hurts every stage at once; 0.5 is moderate, so stages still vary on their own | Low |

There is no published benchmark for how strongly funnel stages move together, so this is an explicit modeling choice.
- 0 would treat the stages as independent and understate the downside.
- 1 would make them move in lockstep.
- The property tests check that 0.5 widens the spread without shifting the likely value.

### Product funnel and economics (sample defaults)

These describe the sample product (Briefly, AI meeting notes for small teams, $49 per team per month). Users replace them with their own.

| ID | Value | Source (date) | Why | Confidence |
|---|---|---|---|---|
| `funnel.signupRate` | 2% / **5%** / 9% | First Page Sage via [Nalpeiron](https://nalpeiron.com/blog/saas-free-trial-conversion-rate/): visitor→trial 8.5% organic / 7.1% paid with opt-in trials; 2.5% / 2.2% when a card is required (2025-09) | Between card-required and opt-in models; launch traffic is colder than steady-state traffic | Medium |
| `funnel.activationRate` | 20% / **35%** / 50% | [Userpilot 2025](https://userpilot.com/saas-product-metrics/) (37.5% average across 62 companies; product-led 34.6%); June 2023 (27.3% median, 7-day return) (2025) | Matches the product-led average | Medium |
| `funnel.paidConversion` | 12% / **25%** / 45% | ChartMogul × ProductLed × Kyle Poyar (median trial→paid 8%, Jan 2026); First Page Sage (18.2% opt-in trials), via [Userpilot](https://userpilot.com/blog/free-trial-conversion-rate/) (2026-01) | Trial→paid of 8%–18% ÷ ~35% activation gives 23%–52% of *activated* users | Medium |
| `pricing.monthlyChurn` | 1.5% / **3.5%** / 7% | [Vena](https://www.venasolutions.com/blog/saas-churn-rate) (SMB 3%–7% monthly); Focus Digital (6.4%); ChartMogul via StealthAgents (10%–14% annual ≈ 1%/month) (2025) | Fits a new monthly-billed SMB product with no track record | Medium |
| `pricing.grossMargin` | 70% | [Aleph × Benchmarkit 2025](https://www.getaleph.com/answers/saas-gross-margin-2026) (software median 80%); SaaSRise 2026 (B2B median 75%); ICONIQ (AI builders expect 52%) (2025) | Pure SaaS runs near 80%, but an AI product pays for inference | Medium |

*Where sources disagree:*
- **Trial→paid:** ChartMogul's 8% median and First Page Sage's 18%–49% differ a lot. The distribution is bimodal: 20% of products convert under 2.5% and 23% convert over 25%. That's why the paid-conversion range is wide.
- **Paid conversion is measured from *activated* users,** so it sits higher than trial→paid benchmarks. Dividing trial→paid by the activation rate converts one to the other.
- **SMB churn:** published figures run from about 1% to 7% a month, depending largely on monthly versus annual billing. A new product billed monthly sits in the middle to upper part of that range.

### Consumer channel profile

Products sold to people rather than businesses use these values. Channels not listed keep the business values above. LinkedIn isn't offered for consumer products.

| ID | Value | Source (date) | Why | Confidence |
|---|---|---|---|---|
| `consumer.paid_search.costPerThousand` | $40 / **$130** / $300 | WordStream / LocaliQ 2025 consumer categories via [Search Engine Land](https://searchengineland.com/google-ads-costs-keep-rising-but-conversion-rates-improved-in-2025-477927) (Arts & Entertainment CPC $1.60, Restaurants & Food $2.05) (2025-06) | Consumer clicks cost $1–$3 rather than $5+, so CPM ≈ $1.60 × 8% × 1,000 ≈ $130 | Low |
| `consumer.paid_search.clickThroughRate` | 5% / **8%** / 13% | [LocaliQ / WordStream 2025](https://localiq.com/blog/search-advertising-benchmarks/) (all-industry 6.66%; Arts & Entertainment 13.1%) (2025-06) | Consumer categories click more than the all-industry average | Medium |
| `consumer.paid_social.costPerThousand` | $6 / **$12** / $18 | [Triple Whale FY2025](https://triplewhale.com/blog/facebook-ads-benchmarks) ($14.19 average, $13.48 median, mostly consumer brands); Vaizle 2025 ($5.97) (2025-12) | Just below the consumer-brand median, to allow for smaller advertisers | Medium |
| `consumer.paid_social.clickThroughRate` | 1.1% / **2%** / 3.1% | [Vaizle 2025](https://insights.vaizle.com/facebook-ad-benchmarks/) (quartiles 1.09%–3.06%); Triple Whale FY2025 (2.19%) (2025-12) | These samples are mostly consumer brands, so their quartiles are used directly | Medium |
| `consumer.newsletter.costPerThousand` | $15 / **$30** / $60 | Paved cross-industry median ($32) via [Voxbooster](https://voxbooster.com/blog/newsletter-sponsorship-statistics-2026/) (2026) | Consumer newsletters price near the cross-industry median | Low |

*Where sources disagree:*
- **Search CPC:** published 2025 medians for retail-like categories run as low as $0.35 (floral and gifts), while category averages sit at $1.60–$2.05. The range spans both.

### Product types

Each product type is a template behind the guided flow's "not sure" answers. B2B software reuses the funnel and churn values above (`funnel.signupRate`, `funnel.activationRate`, `funnel.paidConversion`, `pricing.monthlyChurn`). The funnel steps are named in plain words per type: for a store, the three steps are add to cart → start checkout → complete the order.

#### B2B software (business audience, monthly subscription)

| ID | Value | Source (date) | Why | Confidence |
|---|---|---|---|---|
| `b2b_software.price` | $9 / **$24** / $60 a month | [Monetizely 2025](https://www.getmonetizely.com/articles/saas-pricing-benchmark-study-2025-key-insights-from-100-companies-analyzed) (SMB starter median $15 per user, $9–$29); Dupple index of 294 tools (median entry plan $24) (2025) | Entry plans cluster at $15–$24; a small team on a few seats pays up to ~$60 | Medium |
| `b2b_software.grossMargin` | 75% | SaaSRise 2026 (B2B median 75%); [Aleph × Benchmarkit 2025](https://www.getaleph.com/answers/saas-gross-margin-2026) (software 80%) (2025) | Support and hosting weigh more at small scale | Medium |
| `b2b_software.starterChannels` | Paid search, LinkedIn ads, content & SEO | Launch Lab judgment (2026-10) | Business buyers search for tools and can be targeted by role | Low |

#### Consumer app (consumer audience, monthly subscription)

| ID | Value | Source (date) | Why | Confidence |
|---|---|---|---|---|
| `consumer_app.price` | $3 / **$7** / $13 a month | RevenueCat 2025 via [Airbridge](https://www.airbridge.io/en/blog/subscription-app-pricing-by-category-2026-benchmark) (median $6.68; P25 $3.26, P75 $11.99); Adapty 2026 (median $12.99) (2025) | The median monthly plan is about $7 | Medium |
| `consumer_app.grossMargin` | 70% | [Apple App Store Small Business Program](https://developer.apple.com/app-store/small-business-program/) (15% commission) (2025) | After store fees, hosting and support | Medium |
| `consumer_app.monthlyChurn` | 5% / **10%** / 18% | RevenueCat 2025 via [SaaStr](https://www.saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps/) (~72% of annual plans cancelled in year one) (2025) | 72% lost in a year ≈ 10% a month: 1 − 0.28^(1/12) | Low |
| `consumer_app.signupRate` | 5% / **15%** / 30% (visitor → install) | [AppTweak 2025](https://www.apptweak.com/aso-blog/mobile-app-store-conversion-rate-benchmarks-per-category) (store page → download: App Store 8.56%, Google Play 16.15%) (2025) | Ad visitors land on the store page and are pre-qualified | Medium |
| `consumer_app.activationRate` | 3% / **6%** / 12% (install → trial) | Adapty via [Airbridge](https://www.airbridge.io/en/blog/why-subscription-app-get-installs-no-paid-subscribers) (median install-to-trial 6.2%) (2025) | About 6 in 100 installers start a trial | Low |
| `consumer_app.paidConversion` | 20% / **35%** / 50% (trial → paying) | RevenueCat 2025 via SaaStr (25.5% for ≤ 4-day trials, 42.5% for 17–32-day) (2025) | 6% × 35% ≈ 2.1% of installs pay, close to RevenueCat's 1.9% median | Medium |
| `consumer_app.starterChannels` | Paid social, creators | Launch Lab judgment (2026-10) | Consumer apps are mostly found in feeds and through creators | Low |

*Where sources disagree:* Apple has said default store pages convert about 1.6% of views, far below AppTweak's 8.56%, probably because the denominators differ. The low end of the install range (5%) allows for it. Monthly price medians differ between RevenueCat ($6.68) and Adapty ($12.99); the range covers both.

#### Online store (consumer audience, one-time purchase)

| ID | Value | Source (date) | Why | Confidence |
|---|---|---|---|---|
| `online_store.price` | $50 / **$85** / $185 per order | [Top Growth Marketing](https://topgrowthmarketing.com/dtc-ecommerce-benchmarks/average-order-value-benchmarks/) DTC panel (median ~$83; middle 50% $63–$186); Flowium ($50–$150) (2026) | Small direct-to-consumer stores see a median order of about $83 | Medium |
| `online_store.grossMargin` | 45% | [Eightx](https://eightx.co/blog/average-ecommerce-gross-margin-by-revenue-band-2026) (public DTC brands ~43.7%) (2026) | Product, packaging and fulfilment take over half of each order | Medium |
| `online_store.purchasesPerYear` | 1.1 / **1.3** / 1.7 | [Rivo](https://rivo.io/blog/repeat-purchase-rate-complete-guide) and Yotpo repeat-purchase benchmarks (~28% average; 9.9% luxury to 65% grocery) (2025) | About 27% buy again and some a third time | Low |
| `online_store.signupRate` | 2.5% / **5%** / 9.6% (visitor → add to cart) | Littledata Shopify via [Nudgify](https://www.nudgify.com/shopify-conversion-rate-benchmarks/) (4.6% average, top 10% 9.6%); Dynamic Yield (6.08%) (2025) | About 1 in 20 visitors add something to their cart | Medium |
| `online_store.activationRate` | 50% / **70%** / 85% (cart → start checkout) | Derived from Littledata and Shogun via [Blend Commerce](https://blendcommerce.com/blogs/shopify/ecommerce-conversion-rate-benchmarks-2025): conversion 1.4%–1.7% ÷ add-to-cart ~5% ÷ checkout completion 45% (2025) | The share that makes the other published rates add up | Low |
| `online_store.paidConversion` | 35% / **45%** / 66% (checkout → order) | Littledata Shopify (45% average, top 10% 66%); Top Growth Marketing (65% median) (2025) | Fewer than half of started checkouts finish | Medium |
| `online_store.starterChannels` | Paid social, paid search, creators | Launch Lab judgment (2026-10) | Stores sell through feeds and shopping searches | Low |

*Where sources disagree:*
- **Checkout completion:** Littledata's 45% average vs a 65% median across 16 DTC stores. The smaller sample likely skews toward well-run stores, so the likely value follows Littledata.
- **Overall conversion:** published figures range from 1.4% to 2.6%. The template's three steps multiply to about 1.6%.

#### Digital product or course (consumer audience, one-time purchase)

| ID | Value | Source (date) | Why | Confidence |
|---|---|---|---|---|
| `digital_product.price` | $30 / **$135** / $400 | [CustomerHub](https://customerhub.com/post/average-price-for-online-courses) ($100–$500 typical, mini-courses $20–$200); bmti ($137 average across 132,000+ courses) (2025) | Courses center near $137; ebooks and mini-courses sit lower | Low |
| `digital_product.grossMargin` | 88% | Launch Lab estimate from course-platform and payment fees (2026-10) | Another copy costs little beyond ~5%–10% platform and ~3% payment fees | Low |
| `digital_product.purchasesPerYear` | 1.0 / **1.15** / 1.4 | Launch Lab judgment (2026-10) | No benchmark found; a minority buy an upsell or second product | Low |
| `digital_product.signupRate` | 5% / **12%** / 25% (visitor → email list) | [Webtonic 2026](https://www.webtonic.io/blog/education-coaching-landing-page-statistics) (course opt-in pages 18.3%; education landing pages 8.4%) (2026) | Paid visitors are colder than these pages' usual traffic | Low |
| `digital_product.activationRate` | 30% / **50%** / 70% (email list → sales page) | Launch Lab judgment (2026-10) | No benchmark found; about half of new subscribers open the launch emails | Low |
| `digital_product.paidConversion` | 2% / **4%** / 10% (sales page → purchase) | [Teachery](https://www.teachery.co/blog/sales-page-for-online-course) (2%–5%, top pages 10%–15%); Webtonic (coaching 3%–5% cold) (2025) | Course sales pages convert a few percent of visitors | Medium |
| `digital_product.starterChannels` | Paid social, newsletters, content & SEO | Launch Lab judgment (2026-10) | Courses grow an email list from feeds, newsletters and articles | Low |

*Where sources disagree:* sales-page conversion estimates run from 1.5% (a vendor's worked example) to 2%–5% (Teachery). The likely 4% sits in Teachery's range because launch emails send warmer traffic than cold ads. This is the thinnest-sourced template; three of its seven values are judgment.

#### Service or agency (business audience, monthly retainer)

| ID | Value | Source (date) | Why | Confidence |
|---|---|---|---|---|
| `service.price` | $1,000 / **$2,500** / $6,000 a month | [Predictable Profits 2025](https://predictableprofits.com/2025-agency-growth-benchmark-key-metrics-from-300-7-8-figure-agencies/) (small agencies' most common retainer under $5,000); BuzzStream (average $5,458, half below $5,000) (2025) | A new service business usually starts below the $5,000 median | Medium |
| `service.grossMargin` | 50% | Launch Lab judgment (2026-10) | No benchmark found; delivery time typically takes about half of fees | Low |
| `service.monthlyChurn` | 1.5% / **3%** / 5.5% | [Focus Digital 2025](https://focus-digital.co/?p=6135) (18% annual churn on retainers, 42% project-based); Whitehat (PPC 49%, SEO 38%, full-service 25% a year) (2025) | 18%–49% a year ≈ 1.6%–5.5% a month | Medium |
| `service.purchasesPerYear` | 1.0 / **1.4** / 2.0 (if billed per project) | Launch Lab judgment (2026-10) | No benchmark found; some project clients return within a year | Low |
| `service.signupRate` | 1% / **3%** / 6% (visitor → enquiry) | [LowCode Agency](https://www.lowcode.agency/blog/b2b-website-conversion-benchmarks-by-industry) and Clicksgeek (lead forms 1%–3%, consultation pages 2%–5%); Unbounce (median 6.1%) (2025) | About 1 in 30 visitors to a service site get in touch | Medium |
| `service.activationRate` | 40% / **60%** / 80% (enquiry → call) | Launch Lab judgment (2026-10) | No benchmark found; many enquiries never book a call | Low |
| `service.paidConversion` | 10% / **25%** / 40% (call → client) | Launch Lab judgment (2026-10) | No benchmark found; about 1 in 4 calls without referrals | Low |
| `service.starterChannels` | Paid search, LinkedIn ads, content & SEO | Launch Lab judgment (2026-10) | Clients search for providers; articles build trust | Low |

*Where sources disagree:* published agency retention runs from 70% to 92% a year, depending on agency size and service mix. The churn range covers retainers through PPC-heavy work. No published close rate for small service businesses was found, so the enquiry → call → client steps are explicit judgment and the first numbers a user should replace.

### Guided-flow defaults (estimates, not benchmarks)

These answer "not sure" where no benchmark exists. Wherever they appear, they're labeled "rough estimate" or "example amount".

| ID | Value | Source (date) | Why | Confidence |
|---|---|---|---|---|
| `guided.audienceBands` | Niche ~30,000 · specific group ~300,000 · broad market ~3,000,000 | Launch Lab estimate (2026-10) | Each band is 10× the last, enough to show how audience size changes the answer | Low |
| `guided.exampleBudget` | $5,000 | Launch Lab example amount (2026-10) | No benchmark exists for the right launch budget, so it's labeled an example | Low |
| `guided.promotionWeeks` | 8 weeks | Launch Lab example (2026-10) | Long enough for content to start ranking, short enough for a launch push | Low |

---

## Behaviors worth knowing

The property tests check invariants on thousands of random scenarios. Two of them turned up behaviors that are correct but not obvious:

1. **On a saturated audience, more budget only meets the same people sooner.** If those earlier weeks fall in a weaker month, or the extra spend lets a front-loaded, lower-intent channel reach people before a higher-intent one, sign-ups can dip very slightly, by a few parts per million in the cases found.
   - It follows from two assumptions: each visitor's intent comes from the first channel that reached them, and saturation means extra spend adds almost no new people.
   - What always holds: more budget never means fewer unique visitors, and with one channel and no seasonality, more budget never means fewer paying customers.
2. **Payback with near-zero churn.** A naive formula divides 0 by 0 when churn is tiny. The engine uses a numerically stable form and returns CAC ÷ margin, the no-churn answer, as churn approaches zero.

---

## Limitations

Stated up front, because a model is only as credible as its known gaps.

1. **It compares; it doesn't forecast.** Benchmarks are averages, and a given product can sit several times away from them. The ranges express uncertainty, not bias.
2. **Random reach.** Impressions are assumed to land at random across the audience. Real targeting can do better, and retargeting does much better, so the model is conservative here.
3. **No word of mouth, virality or organic growth** beyond the channels entered.
4. **No lag between visiting and paying.** Conversions land in the week of the visit, so a 14-day trial is ignored. That shifts the weekly timeline and in-window revenue slightly earlier; totals and CAC are unaffected.
5. **Constant churn.** Real churn is front-loaded: more people cancel in month 1 than in month 12.
6. **First-touch, proportional attribution.** A visitor is credited to channels in proportion to that week's clicks. That's fine for planning, not for measuring real campaigns.
7. **Independent channel costs.** A crowded quarter raises all ad prices together. Seasonality captures the average effect, but not a bad-luck quarter that hits every channel at once.
8. **US-weighted benchmarks.** Most sources are US or global averages from 2025–2026.
9. **Break-even covers marketing spend only.** Building, hosting and running the product aren't included. The results say so next to every break-even number.
10. **One-time products stop at year one.** Purchases after a customer's first year aren't counted, so long-lived stores and courses are understated.
11. **Product-type templates are averages of very different businesses.** A niche store and a mass-market store share one template. Several template values (course and service funnels, service margin) have no published benchmark and are labeled as judgment.
12. **"What would have to be true" changes one input at a time.** Real improvements often come in combination. A requirement marked "not reachable by changing this alone" may be reachable together with others, and expert mode is the place to try that.

## v2 roadmap

- **Trial and conversion lag:** a trial length that delays conversion and revenue. This is limitation 4, and it was deliberately left out of v1.
- **Front-loaded churn:** a month-1 churn rate separate from the steady-state rate.
- **Word of mouth:** a referral loop where paying customers bring a share of new visitors.
- **Correlated channel costs:** a shared "auction pressure" factor, like the market-response factor.
- **Retargeting:** a channel that only reaches people who already visited.
- **Regional seasonality and benchmarks:** EU and APEC indices alongside the US defaults.

## Changelog

- **2026-10-23: M2.**
  - Product-type templates for B2B software, consumer apps, online stores, digital products and services.
  - A consumer channel profile, and purchases per customer in the first year for one-time products.
  - Break-even, customers needed and the "what would have to be true" solver.
  - Sensitivity can rank inputs by net return within a year.
  - Subscription results are unchanged from M1: the new purchases draw only happens for one-time products, so the random sequence is identical.

- **2026-10-22: M1.**
  - Initial model.
  - While building, visit rates changed from "per person reached" to **per-impression CTR**. The first version applied a per-impression benchmark per person, which counted diminishing returns twice: a saturated paid-social channel showed a CAC of about $580 against about $240 from simple CPC arithmetic.
  - The demand seasonality was corrected to the data (Q4 is the strongest quarter).
  - The sample price moved from $12 to $49 per team per month, to reflect team pricing.
