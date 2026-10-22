# "Test my idea" flow

**Status:** built in M3 (2026-10-23). Live at `/idea`; the example is at `/idea/example`.

The main entry point for Omer, a first-time founder with an idea and some savings, no marketing background, and no idea what CAC means. The goal: answer **"Can my idea work, and what would have to be true?"** in plain language, without ever claiming the idea will succeed or fail.

## Principles

1. **Plain words only in the questions.** No CAC, churn, conversion, funnel, CPM or CTR. Those terms appear in results, each with a one-line explanation the first time.
2. **"Not sure" is always a valid answer.** It uses a sourced default for that product type, and the results say so ("we used what similar apps usually charge").
3. **One question per screen** on mobile, with back, next and a progress indicator. Answers can be changed later from the results.
4. **The answer explains; it doesn't judge.** The results show what would have to be true, next to what similar products usually achieve. Words like "viable", "will succeed" and "will fail" are banned, and a test enforces it.
5. **Rates as "1 in N".** "1 in 25 visitors sign up", not "4% conversion".
6. **Every result carries the disclaimer** (see Results, block 2).

## The questions

Seven questions plus an optional name. Defaults marked † come from the product type's sourced template (`src/data/productTypes.ts`, documented in `docs/model.md`). Defaults marked ‡ are not benchmarks: they are labeled as an example or a rough estimate wherever they're shown.

### 0. Give your idea a name *(optional)*
Free text, e.g. "Meal-prep planner". Used only to label the result and the saved scenario. Skip → "My idea".

### 1. What are you selling?
Plain choices. Each one picks a **product type template**:

| Choice (as shown) | Template | Charges by default |
|---|---|---|
| Software that businesses pay for | B2B software | Monthly subscription |
| An app people pay for monthly | Consumer app (subscription) | Monthly subscription |
| Things I sell in an online store | Online store | One-time purchase |
| A course, ebook or other digital product | Digital product / course | One-time purchase |
| A service, like design, consulting or an agency | Service / agency | Monthly retainer |

**Not sure:** "Something else / not sure" leads to one follow-up tap: **"Is it for businesses or for people?"**
- **Businesses** → B2B software defaults.
- **People** → consumer app defaults.

The charging model can still be changed in question 3, and the results say which type was assumed. *(Decided 2026-10-22.)*

### 2. Who buys it?
Plain size bands with examples that change with the product type. Picking one sets the reachable audience:

| For businesses | For people | Audience used |
|---|---|---|
| A niche (e.g. dental clinics in one country) | A niche hobby or need (e.g. competitive rock climbers) | ~30,000 |
| A specific kind of business or role (e.g. HR managers at small companies) | A specific group (e.g. new parents in one country) | ~300,000 |
| A broad market (e.g. most small businesses in a country) | A broad audience (e.g. people who cook at home) | ~3,000,000 |

Plus "I know roughly how many" (number field). **Not sure** → the middle band.‡ These bands are rough size estimates, not benchmarks, and are labeled "rough estimate" in results.

### 3. How will you charge, and how much?
The charging model is preselected from question 1 and can be changed: "Every month" / "Once" (and "Per project" or "Monthly retainer" for services). Then a price field with a hint: "Similar products usually charge $X–$Y."†

**Not sure** → the template's typical price.†

For one-time charging (stores, courses, per-project services), one more line on the same screen: **"How many times would the same customer usually buy in their first year?"** Just once · 2 times · 3 or more · Not sure. **Not sure** → the product type's sourced default.† Without it, almost no store would ever earn back paid ads on a first order alone, which would mislead exactly the user this flow serves. *(Decided 2026-10-22.)*

### 4. How much could you spend on marketing for the launch?
Quick picks: $1,000 · $5,000 · $10,000 · $25,000 · other amount. Hint: "Only money for ads and promotion, not for building the product."

**Not sure** → $5,000, labeled in results as "an example amount, change it any time".‡ No benchmark exists for the "right" launch budget, so the product doesn't pretend one does.

### 5. When do you want to launch, and for how long will you promote it?
Month picker (defaults to next month), then: 2 weeks · 1 month · 2 months · 3 months.

**Not sure** → next month, promoted for 2 months.‡ The results mention if the timing helps or hurts ("ads cost more in November").†

### 6. How will people find out about it?
Pick up to four, in plain words:

| Shown as | Channel |
|---|---|
| Ads on Google search | Paid search |
| Ads on Instagram and Facebook | Paid social |
| Ads on LinkedIn *(shown for business types)* | LinkedIn ads |
| Sponsoring newsletters | Newsletter sponsorships |
| Creators or influencers talking about it | Creators / influencers |
| Writing articles people find on Google | Content & SEO |

The budget is split evenly; expert mode allows custom splits. **Not sure** → the usual starting mix for the product type, labeled as a starting point, not a recommendation.†

### 7. Check your answers
A one-screen summary with every answer, a ✎ to change each one, and which answers used "similar products" defaults. Button: **See what would have to be true**.

## How the answer is calculated

- **Break-even:** the customers won during the launch earn back the **marketing spend** from their gross margin within **12 months**.
  - Subscriptions: monthly margin, reduced by cancellations.
  - One-time products: margin per purchase × purchases per customer in the first year.
  - Building and running costs are not included, and the results say so.
- **Customers needed** = marketing spend ÷ what one customer is worth to you over a year.
- **What would have to be true:** for each key input, the engine solves for the value that makes the *likely* number of customers reach the number needed, with every other input at its typical value. That value is then compared with the product type's range.
  - Each status describes the **requirement**, never the idea. A required value is never phrased as good news ("only needs…", "easy").

| Needed value is… | Label | Color |
|---|---|---|
| At or within what similar products usually get (≤ their likely value) | **Typical** | neutral (ink) |
| Beyond the usual, but within what the top ~10% of similar products reach | **Needs above-typical results** | warning |
| Beyond what similar products reach, or impossible by this change alone | **Rarely seen** | risk |

  When the value is impossible on its own (e.g. more sign-ups than visitors), the row keeps the "Rarely seen" label and adds a detail line: "not reachable by changing this alone".
- **What matters most:** the existing sensitivity analysis. Its top input gets the single accent highlight.
- Everything runs through the existing engine: 5,000 simulated launches, downside / likely / upside.

## Results screen

Mobile first (375px), one column. On desktop the right column holds the gauge and tiles beside the headline. Block order is fixed, and the headline always comes first. Numbers below are illustrative.

```
┌─────────────────────────────────────────────┐
│ YOUR IDEA · Meal-prep planner  ✎ Change answers │
│                                             │
│ ① HEADLINE (display type)                    │
│ With $5,000 over 2 months you'd likely get  │
│ 40–110 customers. To earn that back within   │
│ a year you'd need about 160, so roughly 1 in │
│ 25 visitors would have to sign up; similar   │
│ apps usually get 1 in 40.                    │
│                                             │
│ ② ⓘ A planning simulation based on industry  │
│ averages, not a prediction or financial      │
│ advice. Covers marketing spend only.         │
├─────────────────────────────────────────────┤
│ ③ THREE NUMBERS                              │
│ CUSTOMERS YOU'D   CUSTOMERS NEEDED   CHANCE TO EARN BACK │
│ LIKELY GET        TO EARN IT BACK    THE SPEND WITHIN A  │
│ 70                160                YEAR                │
│ 40 ↔ 110          ⓘ how we got this  8%                  │
├─────────────────────────────────────────────┤
│ ④ BREAK-EVEN GAUGE                           │
│  0 ─────[====|=====]──────────▲────── 250   │
│         40   70   110        160            │
│        downside likely upside  needed (accent)│
│ "Most simulated launches land short of the   │
│  break-even point."                          │
├─────────────────────────────────────────────┤
│ ⑤ WHAT WOULD HAVE TO BE TRUE                 │
│ Each row: change only this, keep the rest    │
│ typical.                                     │
│                                             │
│ Visitors who sign up          ◀ matters most │
│   similar apps: 1 in 40 · needed: 1 in 25    │
│   ● Needs above-typical results              │
│ Sign-ups who end up paying                   │
│   similar apps: 1 in 4 · needed: 1 in 2      │
│   ● Rarely seen                              │
│ Price                                        │
│   you: $9/mo · needed: $21/mo                │
│   similar apps charge $5–$15 · ● Rarely seen │
│ Cost per visitor from ads                    │
│   typical $0.80 · needed $0.35 · ● Rarely seen│
│ Customers who cancel each month              │
│   typical 1 in 10 · ● Rarely seen            │
│   not reachable by changing this alone       │
├─────────────────────────────────────────────┤
│ ⑥ HOW TO TEST THIS CHEAPLY                   │
│ Before spending $5,000, test the assumption  │
│ that matters most for about $250:            │
│ Build a one-page site for your app with an   │
│ email sign-up. Spend $250 on Instagram ads   │
│ sending people to it (~300 visitors). If at  │
│ least 1 in 25 leave their email (12 or more),│
│ this assumption holds up.                    │
├─────────────────────────────────────────────┤
│ ⑦ WHERE PEOPLE DROP OFF (likely)             │
│ 180,000 see an ad → 2,100 visit → 52 sign up │
│ → 70 pay   (bars; biggest drop highlighted)  │
├─────────────────────────────────────────────┤
│ ⑧ WORDS USED HERE                            │
│ CAC: what it costs, on average, to win one   │
│ paying customer. Churn: … (only terms shown) │
├─────────────────────────────────────────────┤
│ ⑨ ACTIONS                                    │
│ [Change answers] [Save this idea]            │
│ [Open in expert mode] [Share link (M6)]      │
│ How this works →                             │
└─────────────────────────────────────────────┘
```

**Block notes**
- **① Headline:** generated in `src/insights/`, at most ~40 words, always conditional ("you'd need", "if similar-product rates hold"). Three variants:
  - **Short of break-even:** as above.
  - **Above break-even:** "With $5,000 you'd likely get 90–260 customers, more than the ~60 you'd need to earn the spend back within a year, if rates like similar products' hold." Block ⑤ then shows **how much room there is**: "sign-ups could fall to 1 in 70 before the spend stops being earned back."
  - **Very few customers:** "With $1,000, most simulated launches win fewer than 5 customers, too few to tell much. Try a larger budget or a different way to reach people."
- **② Disclaimer:** on every result view (guided, expert, comparison, shared report), right under the headline, never hidden behind a click.
- **③ Tiles:** the third tile is always labeled **"Chance to earn back the spend within a year"**, never shortened to "chance of success". Jargon appears only as an ⓘ tooltip, e.g. "Cost to win one customer (often called CAC)".
- **④ Gauge:** the likely range as a band, the break-even point as the accent marker. This is the "instrument readout" moment.
- **⑤ What would have to be true:** the "matters most" row gets the only accent on the screen. Each "similar products" value has an assumption marker (source and date).
- **⑥ How to test this cheaply:** see below. Always about the "matters most" assumption, or the next one that has a test template.
- **⑧ Glossary:** generated from the terms that actually appear on the page (`lib/glossary.ts`).

## How to test this cheaply

One small, concrete, real-world test for the assumption that matters most, generated from a template (`src/insights/cheapTests.ts`, M3).

**Rules for every test**
- **Budget:** at most **10% of the planned marketing budget**, rounded down to a friendly number ($50 steps).
- **Pass mark:** taken directly from the break-even value in block ⑤, in the same "1 in N" or dollar terms.
- **Sample size:** aim for enough people that the pass mark means something. At the pass mark, the test should expect at least ~10 successes; for 1 in 25 that means ~250 visitors. If 10% of the budget can't buy that, say so: "with $150 you'd get about 120 visitors, enough for a rough signal only."
- **Channel:** use the cheapest channel per visitor in their plan, so the test budget goes furthest.
- **Wording:** "the assumption holds up" or "it doesn't hold up yet". Never "your idea works" or "your idea fails".

**Templates for the main assumptions**

| Assumption (block ⑤ row) | Test | Budget | Pass mark (from break-even) |
|---|---|---|---|
| **Visitors who sign up** (sign-up rate) | **Landing-page test.** Build a one-page site describing the product with an email sign-up or "Get early access" button (free site builders take an afternoon). Send paid visitors to it from the cheapest channel in the plan. | ≤ 10% of budget, sized for ~10 × N visitors | At least **1 in N** visitors leave their email, where N is the needed sign-up rate. |
| **Sign-ups who end up paying** (activation × paid conversion) | **Pre-sale test.** Offer the people who signed up (or 20–30 potential customers you can reach directly) early access at the real price, with a refundable pre-order or deposit. | Payment-page tool + any landing-page spend, ≤ 10% of budget | At least **1 in M** of them pay or put down a deposit, where M is the needed sign-up-to-paying rate. |
| **Price** | **Price test.** Same landing page, but the button says "Get it for $P" with the needed price P shown, leading to a "coming soon, leave your email" page. | ≤ 10% of budget | At the needed price, at least **1 in N** visitors still click the price button, where N is the typical sign-up rate for similar products. |
| **Cost per visitor from ads** (cost per 1,000 × click rate) | **Ad test.** Run one small campaign for a week on the planned channel with 2–3 ad variations, pointing at the landing page. | ≤ 10% of budget, at least $50 | You pay at most **$C per click** on average, where C is the needed cost per visitor. |

**Which template:**
- Sign-up rate → landing-page test.
- Activation or paid conversion → pre-sale test.
- Price → price test.
- Ad cost or click rate → ad test.
- Churn has no cheap pre-launch test, so the section uses the next-most-important assumption that has a template and says why: "Cancellations only show up after launch, so start with…".

## Edge cases

- **The answer depends on a "not sure" default:** add a line under the headline: "3 of your answers used typical values for similar apps. Change them if you know better."
- **Needed value is unreachable for every row:** say so plainly: "No single change gets there; it would take several together." Point to expert mode.
- **Audience too small for the budget:** "You'd reach most of your audience in the first few weeks; extra budget adds little." The engine's saturation already produces this; the insight states it.
- **Already above break-even:** block ⑥ still suggests a test, framed as "check the assumption that matters most before spending the full budget".

## Decisions (2026-10-22)

1. **Repeat purchases:** one-time products use a sourced "purchases per customer in the first year" default per product type (question 3).
2. **North star:** ideas checked per week (guided checks reaching "what would have to be true"). Scenarios compared stays as the expert-mode metric.
3. **"Something else / not sure" in question 1:** follow-up "Is it for businesses or for people?"
4. **Results wording:** the third tile reads "Chance to earn back the spend within a year". Status labels are Typical / Needs above-typical results / Rarely seen. A "How to test this cheaply" block follows "What would have to be true".

## Added before M3 (2026-10-23)

1. **Earn it back within 1, 2 or 3 years.**
   - The results have a switch (default 1 year) and always show all three chances: "Within 1 year: 4% · within 2 years: 19% · within 3 years: 29%".
   - One plain line explains that subscription businesses often take 1–2 years to earn back marketing spend. For business products it adds the sourced 16-month median for B2B software.
2. **"I'll promote it myself."** Question 6 has a free option: posts, communities, word of mouth.
   - It asks for hours a week (1–2, 3–5, 6–10, more than 10, or not sure → 3, an example).
   - Hours become reach through labeled judgment values (`docs/model.md`). They are never converted into money.
   - The results keep its customers separate: "From ads: about 13 customers. From your own promotion: about 1, for about 32 hours of your time and no money."
   - Question 4 also offers "Nothing on ads". Question 6 then requires self-promotion.
3. **A way forward when the chance is low** (below 25% for the chosen horizon):
   - The headline stays honest and points to the next step, e.g. "…you'd likely get 5–31 customers, but paid ads alone probably won't earn back the spend within a year. Below: what would have to change, and how to test the riskiest part cheaply."
   - The banned-verdict-words test covers this variant.

## Fixed after the M3 walkthrough

Clicking through as a first-time founder on mobile and desktop, in both themes, turned up:
- **Landing preview card used jargon** ("Blended CAC", "Payback"). It's now a plain-language example result.
- **The intro promised seven questions while the counter said six.** It now says "six short questions, then a quick check of your answers".
- **Prices showed as "$9.00".** Whole-dollar amounts no longer show cents.
- **The review called a rough estimate a "typical value".** Each default is now tagged as a typical value, rough estimate or example amount.
- **The self-promotion headline repeated "your own promotion".** Rewritten.
- **A consumer app was shown the B2B software payback median.** That stat now appears for business products only.
- **The cheap test switched assumptions without saying why.** It now explains when the top assumption couldn't close the gap on its own, and says "people who join your waitlist" instead of "people who signed up".
- **The break-even gauge's labels were about 4px tall on phones** (a scaled SVG). It's rebuilt in HTML/CSS so text stays readable.
- **Drop-off labels wrapped, and unreachable rows said "not reachable" twice.** Both fixed.
