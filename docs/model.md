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

With one-time pricing, each customer pays once, and churn and MRR don't apply.

### 7. CAC and payback

> **CAC** = money spent ÷ paying customers (blended, and per channel)

> **Payback** = months until one customer's cumulative gross margin covers their CAC

The key point is that churn caps what a customer can ever be worth. With monthly margin *g* = price × gross margin and monthly churn *c*, an average customer's lifetime margin can never exceed **g ÷ c**.
- At $34.30 margin and 3.5% churn, that cap is $980.
- If CAC is above the cap, the plan **never** pays back, however long you wait.

Solving the cumulative margin g(1 − (1−c)ⁿ)/c = CAC for *n* gives:

> payback months = ln(1 − CAC × c ÷ g) ÷ ln(1 − c)

This is how the model can say "a 40% chance of never paying back": in 40% of simulated worlds, CAC exceeds the lifetime cap. For one-time pricing, payback is immediate if the first sale's margin covers CAC, and never otherwise.

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

## v2 roadmap

- **Trial and conversion lag:** a trial length that delays conversion and revenue. This is limitation 4, and it was deliberately left out of v1.
- **Front-loaded churn:** a month-1 churn rate separate from the steady-state rate.
- **Word of mouth:** a referral loop where paying customers bring a share of new visitors.
- **Correlated channel costs:** a shared "auction pressure" factor, like the market-response factor.
- **Retargeting:** a channel that only reaches people who already visited.
- **Regional seasonality and benchmarks:** EU and APEC indices alongside the US defaults.

## Changelog

- **2026-10-22: M1.**
  - Initial model.
  - While building, visit rates changed from "per person reached" to **per-impression CTR**. The first version applied a per-impression benchmark per person, which counted diminishing returns twice: a saturated paid-social channel showed a CAC of about $580 against about $240 from simple CPC arithmetic.
  - The demand seasonality was corrected to the data (Q4 is the strongest quarter).
  - The sample price moved from $12 to $49 per team per month, to reflect team pricing.
