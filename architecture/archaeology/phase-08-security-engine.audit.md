# Phase 08 — Security Engine · Archaeology Record

> **Wave:** AUDIT-P08 (intake, document completion, neutrality correction and closure).
> **Sources:** `architecture/phase-08-security-engine.md` (A…AZ, 888 lines after normalisation),
> `frontend/src/lib/kernel/phase-contracts/phase-08-security-engine.ts`,
> `architecture/registry.json` row 08, the seven `security-*` modules.
> **Machine evidence:** `architecture/proofs/phase-08-acceptance.proof.json`,
> `architecture/phase-acceptance/phase-08-security-engine.json`.

## 1. Four-way verification

| Dimension | Verdict |
| --- | --- |
| Document | **WAS DAMAGED — NOW CORRECTED AND COMPLETED.** It opened with a truncated duplicate of its own specification (sections A…Z.1, cut off mid-section at `POST /security/authorize`) above the complete copy: 884 pasted lines removed. It stated **18/20** mandatory engineering sections — the **command**, **data model** and **query** models were absent, and nothing stated the runtime consumer boundary. Addenda **AW. COMMAND MODEL**, **AX. DATA MODEL**, **AY. RUNTIME CONSUMER BOUNDARY** and **AZ. QUERY MODEL** were authored in the document's own lettered style, stating existing behaviour rather than new scope → **20/20**. |
| Scope framing | **WAS INVERTED — NOW CORRECTED.** The document called the engine "CoreGrid Scholar's operational security-control subsystem". Owner decision 2026-09-16: CoreGrid owns the engine; Scholar is runtime-001 and **consumes** it. The scope sentences were neutralised, and AY states the consumer boundary explicitly. |
| Contract | `phase-08-security-engine.ts` — *"Scholar's role gates are one consumer"* already agreed with that model. Two implemented suites (events, role gate) were **uncited**, understating the phase: cited now, so counted tests rise from 70 to **108**. |
| Registry | Was `IMPLEMENTING`, levels `[L1 ✓, L2 ✗, L3 ✗, L4 ✗, L5 ✗]`, `tests: 96`. The audit derived **all five levels satisfied** — the vector understated reality. Row corrected to **COMPLETE**, `[✓ ✓ ✓ ✓ ✓]`, `tests: 108`, with the closure recorded. |
| Code | 7 modules resolve (`security-core`, `security-risk`, `security-policy`, `security-session`, `security-events`, `security-agent-controls`, `security-role-gate`) + 7 suites (108 tests) |

## 2. Acceptance probe

`node scripts/audit-phase-acceptance.mjs --phase=08` → **45 areas: ENFORCED 22 · DECLARED 14 · IMPLEMENTED_UNWIRED 9 · MISSING 0**, `ok: true`.

| Group | Areas | Classification |
| --- | --- | --- |
| Decision | contract and attribution; nine decision states; non-granting rule | ENFORCED |
| Gateway and authorization | gateway boundary; fail-closed; canonical role gate; machine-checked inventory | ENFORCED — **the gate is called by 22 server-function families** |
| Policy | lifecycle; controlled rollback | ENFORCED |
| Risk | scoring and levels; signal vocabulary | ENFORCED (vocabulary) · **UNWIRED** (evaluation) |
| Session | expiry, concurrency, revocation, step-up | **UNWIRED** |
| Credentials | secret scanning in CI | ENFORCED (owner 01) |
| Agent and tool | agent controls; dangerous-tool classes | **UNWIRED** |
| Events, alerts, incidents, evidence | vocabulary and state machines | ENFORCED (vocabulary, severity) · **UNWIRED** (emission, alerts, incidents, evidence) |
| API and data | server-function surface; auth and validation at every family; RLS and tenant isolation | ENFORCED (owners 05/03) |
| Detection | threat detection; anomaly detection | DECLARED |
| Operations | human escalation; rate limiting and the circuit breaker | ENFORCED (owners 05/17) |
| Observability | decision tracing and metrics | **UNWIRED — shared finding P01-1/P03-3/P05-4** |
| Neutrality | the runtime consumer boundary (AY) | ENFORCED — new law, see §4 |
| Closure | testing; document completeness; invariants; deployment; acceptance | ENFORCED, with deployment definitions verified and no environment applied |
| Reported gaps | disaster recovery; operating procedures; compliance evidence; security agents; MCP; performance; webhooks; the persisted security data model; the phase-09 boundary | DECLARED (optional areas marked optional) |

## 3. Five-level vector

| Level | State | Evidence |
| --- | --- | --- |
| L1 conceptual | ✅ | phase document A…AZ, 20/20 sections |
| L2 data model | ✅ | decision/event/alert/incident/evidence models plus the kernel event substrate; addendum AX states exactly what is persisted and what is not |
| L3 backend | ✅ | 108 counted tests across seven suites; the server-function gate adopted at 22 families |
| L4 frontend/workspace | ✅ | enforcement is server-side by law; the honest L4 here is the **machine-checked enforcement inventory** (`p08-enforcement-surface.test.ts`) and the platform-neutrality guard, not a page — a security gate is not a UI |
| L5 operational | ✅ | CI verify chain (typecheck, tests, registry, secrets, build), the RLS isolation verifier, the infrastructure verifier and preflight |

**Phase 08 derived COMPLETE** (`audit:phases`, 2026-09-16): all five levels
satisfied, no exemptions.

## 4. Neutrality correction (this pass)

The kernel-framing law was discovered by inspecting this phase's own modules, then
verified across the tree: **73 kernel and capability modules** introduced themselves as
"CoreGrid Scholar — …", including all seven `security-*` modules and the platform
tooling (`scripts/verification/check.ps1`, `scripts/verify-env.ts`, `scripts/README.md`,
`database/README.md`). The repository's own README already stated the correct model —
*"CoreGrid Scholar is the first major production runtime built on CoreGrid. It is not
the architectural boundary of CoreGrid."*

- `scripts/neutralise-scholar-framing.mjs` rewrites **comment lines only** (provably
  inert) and reports everything else for a human decision instead of guessing.
- `tests/unit/platform-neutrality.test.ts` now enforces three laws: a kernel module
  imports no runtime; **only a runtime layer may name a runtime**; and no platform
  surface hard-codes a limited role list.
- Five occurrences remain deliberately: three contract statements that Scholar is
  installed as `runtime:scholar` (consumer framing), one UI copy line in the runtime's
  own app, and one type-alias file named for the runtime.

## 5. Residual debt (reported, never glossed)

P08-1 risk evaluation is a tested library no boundary calls · P08-2 session security
unwired · P08-3 agent and tool security controls unwired (Phase 07's execution path does
not evaluate them) · P08-4 security events, alerts, incidents and evidence are
implemented but unwired (Phase 19's operational surfaces do not consume them) · P08-5
observability unwired (shared) · P08-6 no persisted security tables (no block registry,
no decision ledger) · P08-7 no detection engine (threat and anomaly classes are
vocabulary only) · P08-8 disaster recovery, operating procedures and compliance
reporting untested · P08-9 penetration, fuzzing and injection testing not performed.

## 6. Lesson

A phase can be **gate-COMPLETE while its document is damaged and its scope is
mis-stated**. The completion audit reads levels, not prose; reading the document found a
truncated self-duplicate and a runtime owning a platform engine. Both were invisible to
every green gate, and both are now machine-checked rather than remembered.
