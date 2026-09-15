# Phase 01 — Foundation limits map (§59 rate limiting · §60 resource budgets)

Work item **P01-3** and unknown **U-02** from
`architecture/archaeology/phase-01-foundation.audit.md`.

## The finding

The first acceptance probe reported "rate limiting + resource budgets: **no artefact
found**". That was a **measurement error** — the probe looked for budgets in one
file. The requirement is in fact **partly implemented across canonical owners**,
and building a foundation-owned engine would have violated the duplication law
(§8 PROGRESS duplication map; AGENTS.md "canonicalise, never delete a requirement").

The machine-readable truth is `architecture/foundation-limits.json`, re-derived
against source by `tests/unit/foundation-limits-map.test.ts`. Phase 01 owns the
**convention and the map**; the implementations stay with their owners.

## Rate limiting (§59) — `frontend/src/lib/runtime-resilience.ts` (Phase 05)

| §59 scope | Status | Owner |
| --- | --- | --- |
| user, tenant, api, agent | **enforced** | 05 |
| service, integration *(extensions beyond §59)* | **enforced** | 05 |
| ip, organization, tool, workflow, device, model | **missing** | 05 / 03 / 07 / 17 / 15 / 26 |

The runtime limiter implements a sliding window with `allowed`, `remaining`,
`resetAt` and `retryAfterMs`, proven by `tests/unit/runtime-extended.test.ts`. Six
of the ten levels the foundation document names do **not** exist yet; each is
registered in the map with the phase that owns it.

## Resource budgets (§60)

| §60 kind | Status | Implementation | Owner |
| --- | --- | --- | --- |
| tokens | enforced | `ai-governance.ts` `consumeAiBudget` | 26 |
| requests | enforced | `ai-governance.ts` `AI_QUOTA_SCOPES` | 26 |
| compute, storage | enforced | `tenant-core.ts` `QUOTA_RESOURCES` | 03 |
| execution_time | enforced | `runtime-resilience.ts` `resolveTimeout` | 05 |
| external_calls | enforced | `runtime-resilience.ts` `createRateLimiter` (integration scope) | 05 |
| financial_exposure | enforced | `ai-governance.ts` monthly cost budget; `enterprise-operations.ts` autoscaling `budgetLimitMonthly` | 26 / 31 |

## The real gap: nothing is wired to a boundary

Every row above is a **library with tests**. Re-probed across 28 server-function
families and every route:

```
createRateLimiter | consumeAiBudget | RateLimiter  →  0 call sites
```

So today **no request is rate-limited and no budget can stop a run** — the models
exist, the enforcement does not. That is recorded as `boundaryWiring.status:
"unwired"` with `closesWhen`, and the test re-probes it: the moment a boundary
invokes the limiter or the budget, the test fails until this map is updated.

## What Phase 01 deliberately did NOT do

- **No second limiter, no second budget engine.** That would be duplication.
- **No silent "done".** Six missing scopes and zero wiring stay visible.
- **No assumption dressed as a fact.** Every cell above is falsifiable by the test,
  which fails on overclaiming *and* on underclaiming.
