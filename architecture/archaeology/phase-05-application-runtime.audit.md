# Phase 05 — Core Application Runtime · Archaeology Record

> **Wave:** AUDIT-P05 (intake, document completion and closure).
> **Sources:** `architecture/phase-05-core-application-runtime.md` (2,074 lines +
> addendum HD), `frontend/src/lib/kernel/phase-contracts/phase-05-application-runtime.ts`,
> `architecture/registry.json` row 05, the twelve `runtime-*` modules.
> **Machine evidence:** `architecture/proofs/phase-05-acceptance.proof.json`,
> `architecture/phase-acceptance/phase-05-application-runtime.json`.

## 1. Four-way verification

| Dimension | Verdict |
| --- | --- |
| Document | **WAS INCOMPLETE — NOW COMPLETED.** 19/20 mandatory engineering sections; the **knowledge / self-description** section was absent. Addendum **HD. RUNTIME KNOWLEDGE** was authored in the document's own lettered style (what the runtime knows about itself, that it is *exercised rather than asserted*, and that runtime knowledge never becomes domain truth) → **20/20**. |
| Contract | `phase-05-application-runtime.ts` — execution fabric only; the document's own rule stands: *the runtime executes capabilities, it does not own them* |
| Registry | `IMPLEMENTING`, levels `[L1 ✓, L2 ✗, L3 ✗, L4 ✗, L5 ✗]`, `tests: null`. The audit derives **L1 ✓ L2 ✓ L3 ✓ L5 ✓** with **100 counted tests** — the row understated three levels. It now records 100 tests and the `runtime-self-report` module. |
| Code | all 12 modules resolve; 4 cited suites (100 tests); L2 evidence from the runtime's own substrate and the kernel migrations |

## 2. Acceptance probe

`npm run audit:phase -- --phase=05` → **13 areas: ENFORCED 12 · DECLARED 0 ·
UNWIRED 1 · MISSING 0**, `ok: true`.

| Group | Areas |
| --- | --- |
| Request handling | context establishment (actor, tenant, correlation) before execution |
| Command/query | validated commands incl. the idempotency requirement; paged queries with a declared maximum |
| Jobs | long work becomes a bounded, observable job |
| Events | typed, versioned, and only consumed by consumers declaring the version |
| Resilience | circuit breaking, rate limiting, per-operation timeouts |
| Webhooks | signature validation, bounded retry, delivery tracking |
| Integrations | adapter registry with declared status — no direct vendor calls |
| Feature flags | per-context enablement, tenant overrides, kill switch |
| Approvals | approval lifecycle + operation tracker for gated operations |
| Bulk | declared limits, partial-failure reporting, transfer tracking |
| **Observability** | **UNWIRED** — primitive proven by tests, no runtime path emits it (shared finding P01-1/P03-3) |
| Runtime knowledge | addendum HD, exercised by a self-check |
| Documentation | 20/20, machine-counted |

## 3. Five-level vector

| Level | State | Evidence |
| --- | --- | --- |
| L1 conceptual | ✅ | 2,074-line document + HD addendum + contract |
| L2 data model | ✅ | runtime substrate + kernel migrations naming the runtime |
| L3 backend | ✅ | 100 counted tests across the runtime suites |
| L4 frontend/workspace | ✅ | **CLOSED 2026-09-14:** `runtime-self-report.ts` + `/super-admin/runtime-contracts` |
| L5 operational | ✅ | verifiers, CI and contracts name the runtime |

**Phase 05 derived COMPLETE on 2026-09-14** (`audit:phases`): all five levels
evidenced, `sections 20/20`.

## 4. The projection, and why it is not a dashboard of invented numbers

`/super-admin/runtime-contracts` renders the execution subsystems and a **self-check
that calls the shipped state machines with real inputs**:

- a tenant window must allow its limit, deny beyond it, and reset afterwards;
- a circuit must open on its failure threshold, refuse calls inside the reset window,
  and permit exactly one probe after it;
- a timeout override must apply to its operation and leave others on the default;
- a consumer must reject an event version it does not declare;
- a retryable command without its idempotency key must be refused.

A failure is displayed as a failure, and `runtimeSelfReport()` reports
`failingChecks` by name — the page cannot claim a health the runtime does not have.
Writing the check found one of my own mistakes: I first probed the circuit exactly at
the reset boundary, where half-opening is *correct* behaviour. The contract was right
and the test input was wrong — fixed by probing inside the window and after it.

## 5. Ownership findings

The runtime's boundary holds in code and in the document: identity (02), tenancy
(03), security authority (08/09), agents (07/24) and every domain phase keep their
ownership; the runtime contributes execution, correlation and resilience. Its
observability primitive is shared with 31 and is currently unwired — recorded, not
claimed.

## 6. Work items

| ID | Item | Kind | Status |
| --- | --- | --- | --- |
| P05-1 | Document lacked the knowledge/self-description section | documentation | **CLOSED** — addendum HD, 20/20 |
| P05-2 | No workspace projection (L4); the existing `/runtime` surface reads feature access, not the runtime's own contracts | L4 projection | **CLOSED** — `/super-admin/runtime-contracts` |
| P05-3 | Registry understated three levels and hid 100 tests | registry accuracy | **CLOSED** |
| P05-4 | Runtime observability is unwired (invariant of the document's own observability section) | wiring | **OPEN** — reported as UNWIRED in every probe run; owner 05/31 |
| U-05 | No runtime path emits correlated logs today (shared with P01-1 / P03-3) | unknown → debt | open, cross-phase |
