# Phase 01 — Foundation · Archaeology Record

> **Wave:** AUDIT-P01 (phase intake). **Mode:** reconnaissance — nothing implemented.
> **Source:** pasted Phase 01 document, verified identical in structure to
> `architecture/phase-01-foundation.md` (2,508 lines, §1–§101).
> **Machine evidence:** `architecture/proofs/phase-01-acceptance.proof.json`,
> `architecture/proofs/phase-completion.proof.json`.

## 1. Four-way verification (document ↔ contract ↔ registry ↔ code)

| Dimension | Artefact | Verdict |
| --- | --- | --- |
| Document | `architecture/phase-01-foundation.md` | **MATCHES** the pasted text (same header, same §1–§101 order) |
| Kernel contract | `frontend/src/lib/kernel/phase-contracts/phase-01-foundation.ts` | **PRESENT** — 20 engineering sections, owns `foundation-standards-config-secrets-ci`, `dependsOn: []`, `consumers: ["all"]` |
| Registry | `architecture/registry.json` phase 01 | status `IMPLEMENTING`, levels `L1+L3`, tests `15`, modules `[]` |
| Code | `scripts/verification/**`, `.github/workflows/verify.yml`, `tests/unit/foundation.test.ts` | **PRESENT** — 8 executable artefacts cited by the contract resolve on disk |

**Registry-claim resolution:** phase 01 previously appeared as an *unconfirmed*
L3 claim. The audit's L3 rule was unfair to convention phases (no `modules`, yet
real enforcement exists), so it now also accepts **cited executable artefacts**
under `scripts/`, `tests/`, `database/`, `frontend/src/`, `infrastructure/`,
`.github/` — documentation citations alone still never satisfy L3. Under the
corrected rule phase 01's L3 claim is **CONFIRMED** (8 executable artefacts + 15
integrity tests), and architecture-defined phases (e.g. 45) remain correctly
unaffected (0 executable artefacts).

## 2. Acceptance result — §100 plus the Definition-of-Done gates

`node scripts/audit-phase-acceptance.mjs --phase=01` → **44 areas: ENFORCED 41 ·
UNWIRED 3 · DECLARED 0 · MISSING 0** (all `required` areas evidenced, so the probe passes).

The probe learned a fourth class during this wave: **IMPLEMENTED_UNWIRED** — the
implementation and its tests exist, but the declared boundary patterns match
nothing, so nothing is actually protected. That class was added precisely because
the first pass reported "rate limiting + budgets: no artefact found", which was a
**measurement error**: both exist across canonical owners, as libraries that no
boundary invokes.

| Classification | Meaning | Areas |
| --- | --- | --- |
| **ENFORCED (41)** | an executable artefact proves it, and any declared boundary really invokes it | the 40 listed previously plus **error architecture** (now proven: `server.ts` uses the out-of-band capture, `components/error-boundary.tsx` reports through the bridge), plus the secret-scan CI boundary |
| **IMPLEMENTED_UNWIRED (3)** | implementation + tests exist, no boundary calls it | **observability** (logger/metrics/health proven but no runtime path emits them), **rate limiting** (windowed limiter, 6 scopes, nothing calls it), **resource budgets** (AI budget + tenant quotas + autoscaling limits, nothing consumes them) |
| **DECLARED (0)** | — | none |
| **MISSING (0)** | — | none (the earlier "rate limits/budgets missing" reading was wrong — see the limits map) |

This is materially stronger than the registry suggested: the Phase 01 foundation
is **enforced**, not merely documented — identity, tenancy, the four authorization
models, RLS, classification, privacy, audit, AI governance, agent identity, twin
identity, API validation, secret discipline and the machine-checked phase contract
all have executable evidence today.

## 3. Five-level vector

| Level | State | Evidence |
| --- | --- | --- |
| L1 conceptual | ✅ | 2,508-line document carrying 16+ engineering sections + kernel contract |
| L2 data model | ⛔ | Phase 01 **owns no data model** — it owns migration *discipline* (which is enforced). See refinement item BR-01. |
| L3 backend | ✅ | 8 executable artefacts (verify chain, secret scan, registry validator, CI workflow) + 15 integrity tests |
| L4 frontend/workspace | ⛔ | the foundation projects no capability of its own; it is consumed by every surface |
| L5 operational | ✅ | the verification chain and CI workflow name the foundation's contracts (`npm:verify`, `npm:verify:registry`, `npm:verify:secrets`, typecheck) |

Open levels: **L2 (definitional — BR-01)** and **L4 (nothing to project)**, which is
why the gate correctly derives `IMPLEMENTING` rather than `COMPLETE`.

## 4. Ownership and duplication findings

Phase 01's document is **rules and verification**, and every implementation it
names belongs to another owner. Checked against the registry duplication clusters:

| Phase 01 section | Concept | Canonical owner | Finding |
| --- | --- | --- | --- |
| §6–§19 | identity, tenancy, RBAC/ABAC/PBAC/ReBAC | 02 / 03 / 08 | no engine duplicated in Phase 01 |
| §20–§24 | authorization pipeline, classification, AI privacy | 08 / 14 / 26 | rules only |
| §25–§29 | twin identities, twin privacy, device/environment twins | 16 (federation 46) | declares *requirements*; twins live with 16 |
| §30–§33 | agent identity, tools, approval | 07 / 17 | no agent runtime in Phase 01 |
| §42–§44 | AI gateway, AI context, memory partition | 26 / 36 (cluster D1) | gateway and memory owned elsewhere |
| §45–§48 | audit, security events, observability, correlation | 08/09 (D7) / 31 | no second audit or telemetry engine |
| §52 | event architecture | 14 / 40 | one fabric; Phase 01 states the rule |
| §80–§81 | no universal admin API, blast radius | 08 | enforced by the P08 enforcement-surface inventory |
| §93–§94 | phase contract + Definition of Done | 01 / 33 | machine-checked by `kernel-phase-contract.test.ts` |

**Verdict: no duplication introduced.** Phase 01 behaves as the constitution
demands — it owns conventions, verification, config/secret discipline and CI, and
consumes every other owner's contract.

## 5. Work items this pass produced

| ID | Item | Kind |
| --- | --- | --- |
| P01-1 | Prove observability behaviour with an executable test (currently DECLARED) | test |
| P01-2 | Prove structured error handling with an executable test (currently DECLARED) | test |
| P01-3 | Rate limiting + budgets (§59–§60) have no artefact at all | missing capability |
| P01-4 | Registry `modules: []` does not record the foundation's executable artefacts | registry accuracy |
| BR-01 | Backward refinement: the level model needs a documented definition for *conventions* phases at L2 (they own no tables) | level model |
| U-01 | Is `audit.ts` wired into sensitive server functions, or audit-by-convention? Requires per-family inspection | unknown |
| U-02 | Where are rate limits enforced today, if anywhere (edge, DB, AI gateway)? | unknown |
| U-03 | Live RLS proof is DB-gated (`scripts/verify-tenant-isolation.mjs` needs credentials) | unknown (ties to CF-7) |
| U-04 | Observability and error-reporting runtime behaviour is untested (same root cause as P01-1/P01-2) | unknown |

Nothing above was implemented in this pass: the constitution forbids implementing
before archaeology completes, and each item is registered with the evidence that
would close it.

## 5b. Closure wave (2026-09-14) — Phase 01 remaining work resolved

| Item | Resolution | Evidence |
| --- | --- | --- |
| **P01-1** observability was DECLARED | **CLOSED as UNWIRED, not as enforced.** `tests/unit/foundation-observability.test.ts` (10 tests) now proves the real primitive: correlation on every log line, credential/PII redaction on the live log path, long-value truncation, metric percentile convention (floor((n−1)·pct)) and deterministic health aggregation (unhealthy > degraded > healthy). The primitive is **not wired into any runtime path** — nothing in `server.ts` or any route emits structured logs — so the area is classified IMPLEMENTED_UNWIRED. | `tests/unit/foundation-observability.test.ts`; probe row `observability` |
| **P01-2** error architecture was DECLARED | **CLOSED as ENFORCED.** `tests/unit/foundation-error-architecture.test.ts` (7 tests) proves the bounded out-of-band capture (capture once, 5 s TTL, unhandled rejections included) and the report bridge (safe no-op with no browser and with no collector; classified, route-tagged forwarding). Real boundaries exist: `frontend/src/server.ts` and `frontend/src/components/error-boundary.tsx`. | `tests/unit/foundation-error-architecture.test.ts`; probe row `error-handling` |
| **P01-3** rate limits + budgets "missing" | **CLOSED by canonicalisation, and my first reading was wrong.** Both exist with canonical owners: the windowed limiter (`runtime-resilience.ts`, Phase 05, 6 scopes, tested) and budgets (`ai-governance.ts` tokens/cost/quota, `tenant-core.ts` compute/storage, `enterprise-operations.ts` autoscaling limits). Phase 01 published `architecture/foundation-limits.json` + `foundation-limits-map.md` (the §59/§60 map) instead of building a second engine — duplication law. `tests/unit/foundation-limits-map.test.ts` (5 tests) fails on overclaiming **and** underclaiming. | `architecture/foundation-limits.json`; `tests/unit/foundation-limits-map.test.ts` |
| **P01-4** registry hid the foundation's artefacts | **CLOSED.** Registry phase 01 now records `tests: 37` and a note naming the four suites and the acceptance result; the Phase 01 contract cites the new suites in its observability/testing sections, and the completion audit now counts test paths a contract cites anywhere (not only in a `tests` array). | `architecture/registry.json`; `phase-01-foundation.ts` |
| **U-01** is audit wired? | **ANSWERED — no.** Zero of the 28 server-function families import the audit module or emit an audit event; the *role gate* is wired (22/28 families, machine-checked by `p08-enforcement-surface.test.ts`), the *audit trail* is not. Recorded as debt owned by 08/09/14. | `git grep` over `*.functions.ts`; PROGRESS §17.2 |
| **U-02** where are rate limits enforced? | **ANSWERED — nowhere at a boundary.** The limiter and the budgets are libraries: 0 call sites across 28 server-function families and every route. Registered as `boundaryWiring.status: "unwired"` with `closesWhen`, re-probed by the map test. | `architecture/foundation-limits.json` |
| **U-03** live RLS proof | **UNCHANGED — still DB-gated** (`scripts/verify-tenant-isolation.mjs` needs credentials; ties to CF-7). | — |
| **U-04** observability runtime behaviour | **CLOSED by P01-1** — the behaviour is now proven, and the *absence of wiring* is the honest finding. | as above |

**Two measurement defects this wave exposed (both were mine, both fixed):**

1. The audit read a contract's cited tests only from a `tests` array, so every phase
   that documents suites inside section `artifacts`/`evidence` was understated — it
   reported phase 01 as "0 tests counted" and phase 02's L3 as unconfirmable. With
   the wider extraction, **phase 02 (Identity) now derives COMPLETE on all five
   levels** and the unconfirmed-claim list falls 5 → 3 (19, 25, 49).
2. The probe's first `rate limiting + budgets` pattern looked in one file and
   reported MISSING for a capability that exists in four. MISMATCH(**measurement
   error**), corrected by the canonicalisation map plus a boundary probe that fails
   if wiring ever appears without the map being updated.

**Defects found in passing (registered, not fixed — they belong to Phase 22):**
`platform-observability.ts` `isMinorUpdate()` compares `update.version` to itself
(always true); `checkVersionCompatibility()` ignores `minDataVersion`; and
`evaluateOTAUpdateState()` ignores its `error` argument. These are mobile-platform
defects, recorded here because the archaeology encountered them, and they must be
fixed by their owner rather than silently asserted as correct in a test.



## 6. Acceptance for this intake (after the closure wave)

Phase 01 is **audited and its remaining work closed**: four-way verification
complete, **44 acceptance areas** classified with evidence — **ENFORCED 41,
IMPLEMENTED_UNWIRED 3, DECLARED 0, MISSING 0** — ownership confirmed, and every gap
registered as a bounded work item, debt row or unknown.

Derived level vector `L1 ✓ · L2 ✗ · L3 ✓ · L4 ✗ · L5 ✓` (status `IMPLEMENTING`).
The two open levels are:
- **L2** — definitional: a conventions phase owns no persistent state (BR-01,
  refinement still to be ratified);
- **L4** — the foundation projects no capability surface of its own; its four
  verification contracts are consumed by every phase and executed by CI (L5).

This is deliberately *not* flipped to COMPLETE. The honest position is that the
foundation's **criteria are met** and its **level model does not describe a
conventions phase**; forcing the flip by relaxing the gate would cost the gate its
meaning, which is exactly what the constitution forbids.

