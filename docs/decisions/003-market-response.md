# ADR 003: Shared market response across product rates

**Status:** Accepted · 2026-10-22

## Context

Sign-up, activation and paid conversion are drawn from separate ranges. If they are independent, a bad sign-up rate in one simulated launch is often offset by a lucky paid-conversion rate. Real launches don't behave that way. When positioning misses, every stage suffers together, and when it lands, they all lift. Independent draws therefore understate the downside, which is exactly the number a cautious PMM needs to trust.

## Decision

Each simulated launch draws one standard-normal **market response** *m*. Each product rate gets a latent value √ρ·m + √(1−ρ)·ε, where ε is that rate's own draw. The latent value maps to a percentile via the normal CDF and then to the rate through its PERT quantile function (a Gaussian copula). The default is **ρ = 0.5** (moderate): any two product rates have a latent correlation of 0.5.

Channel costs, click-through rates and churn stay independent. Correlated channel costs, as in a crowded auction quarter, are on the v2 roadmap.

## Alternatives considered

- **Independent rates (ρ = 0):** simpler, but systematically optimistic in the downside.
- **Fully linked (ρ = 1):** every rate moves in lockstep, which overstates how tightly onboarding quality tracks positioning.
- **A user-facing correlation slider:** too abstract for the target user. It stays an internal assumption, documented and editable in code.

## Consequences

- In tests, ρ = 0.5 widens the downside-to-upside spread of paying customers by more than 15%, and the likely value stays put.
- Each rate keeps its exact PERT range and shape. Only how the rates co-move changes.
- There is no published benchmark for the strength of this effect, so it is labeled low confidence in `docs/model.md`.
