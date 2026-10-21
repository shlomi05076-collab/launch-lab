# ADR 002: PERT distributions for uncertain inputs

**Status:** Accepted · 2026-10-22

## Context

Every rate in a launch plan is uncertain: CPMs, click-through, sign-up, activation, paid conversion and churn. The model needs a way to turn that uncertainty into a distribution it can sample. The people entering these numbers are PMMs and founders, not statisticians.

## Decision

Users enter every uncertain input as **low / likely / high**, and the engine samples it from a **PERT distribution**: a Beta distribution rescaled to [low, high] and peaked at likely, with mean (low + 4·likely + high) ÷ 6.

Sampling uses the **inverse CDF**, a quantile table built once per range by integrating the Beta density. The alternative, drawing Beta variates directly, wouldn't allow it, but the inverse CDF lets the market-response factor (ADR 003) correlate the three product rates through a Gaussian copula while each keeps its own PERT shape.

## Alternatives considered

- **Normal (mean ± sd):** asks for a standard deviation, which users don't think in, and it allows impossible negative rates.
- **Triangular:** the same three inputs, but it puts too much weight on the extremes. That inflates the downside and upside without evidence.
- **Lognormal:** a good fit for costs, but it has no natural "likely" input, and it would mean two different input styles in the UI.

## Consequences

- One input style everywhere, matching how PMs already estimate: "probably 4%, could be 2%, maybe 7%".
- Bounded: a rate can never go below low or above high.
- The quantile table costs about 2,000 operations per range, built once per simulation. That's negligible.
- The sensitivity analysis can use each input's own P10 and P90 as its plausible swing.
