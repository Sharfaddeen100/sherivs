# Phase 09 — Security & Trust Fabric · Archaeology Record

> **Wave:** AUDIT-P09 (intake, document completion, neutrality correction, L4 closure).
> **Sources:** `architecture/phase-09-security-trust-fabric.md` (A…BZ, 1,687 lines after the addenda),
> `frontend/src/lib/kernel/phase-contracts/phase-09-trust-fabric.ts`,
> `architecture/registry.json` row 09, the four `trust-*` modules plus `trust-fabric-report.ts`.
> **Machine evidence:** `architecture/proofs/phase-09-acceptance.proof.json`,
> `architecture/phase-acceptance/phase-09-security-trust-fabric.json`.

## 1. Four-way verification

| Dimension | Verdict |
| --- | --- |
| Document | **WAS INCOMPLETE AND MIS-ATTRIBUTED — NOW CORRECTED.** It stated **15/20** mandatory engineering sections: the **command**, **query**, **workflow**, **memory/knowledge** and **migration** models were absent. Addenda **BU. COMMAND MODEL**, **BV. QUERY MODEL**, **BW. WORKFLOW MODEL**, **BX. TRUST MEMORY AND KNOWLEDGE**, **BY. TRUST MIGRATION** and **BZ. RUNTIME CONSUMER BOUNDARY** were authored in the document's own lettered style, stating existing behaviour — including the limits: no trust store to migrate, no automated workflow, no query surface → **20/20**. |
| Scope framing | **WAS INVERTED — NOW CORRECTED.** Four statements named a runtime as the owner of the fabric ("CoreGrid Scholar's cross-system trust architecture"). Owner decision 2026-09-16: CoreGrid owns the fabric; Scholar is runtime-001 and **consumes** it. One deliberate mention remains, stating exactly that. |
| Contract | `phase-09-trust-fabric.ts` — the governing rule is sound (*"the trust fabric owns evidence and confidence, never policy outcomes … never grants access by itself"*). It cited four suites; the new L4 suite is cited now: counted tests **82 → 90**. |
| Registry | Was `IMPLEMENTING`, levels `[L1 ✓ only]`, `tests: 82`, **empty notes**. The audit derived every level except L4. Row corrected to **COMPLETE**, `[✓ ✓ ✓ ✓ ✓]`, `tests: 90`, modules + `trust-fabric-report`, with the closure recorded. |
| Code | `trust-core`, `trust-assertions`, `trust-entities`, `trust-governance`, `trust-fabric-report` resolve + 5 suites (90 tests) |

## 2. Acceptance probe

`node scripts/audit-phase-acceptance.mjs --phase=09` → **49 areas: ENFORCED 34 · DECLARED 13 · IMPLEMENTED_UNWIRED 2 · MISSING 0**, `ok: true`.

| Group | Areas | Classification |
| --- | --- | --- |
| Registry and states | 12 subject kinds, 10 trust states, legal transitions only, UNKNOWN never trusted, REVOKED terminal | ENFORCED |
| Relationships | 13 relationship types, evidence required, expiry, immediate revocation, explicit tenant scope | ENFORCED |
| Scoring | evidence-weighted score with factor breakdown, version and context; invalid confidence refused | ENFORCED |
| Assertions, evidence, provenance | assertion contract (11 types), five refusal paths in verification, evidence freshness, six-link provenance chain, revocation reasons/kinds/attribution | ENFORCED |
| Governance | key trust (metadata only), certificate trust (expiry, revocation, chain), scoped federation, bounded delegation, anchors requiring a managing administrator, versioned policy and evaluation, zero-trust verdicts | ENFORCED |
| Entity trust | device, workload, agent (suspicion quarantines), model (with rollback version), software provenance, artifact integrity, supply chain | ENFORCED |
| Boundary and closure | Phase 08 boundary, testing (5 suites), deployment definitions, runtime neutrality, L4 surface, document completeness, acceptance criteria | ENFORCED |
| **DECLARED** — specified, not executable | cryptographic verification (no signature is ever verified: `integrityVerified` is caller-supplied), attestation engine, trust graph traversal and revocation propagation, trust persistence (no tables), service trust and posture records, trust agents and MCP, the adversarial programme, external provider integration, DR and operating procedures, migration, AI evaluation, performance, compliance | 13 |
| **IMPLEMENTED_UNWIRED** | Phase 08 does not consume the fabric — **zero import sites outside the four trust modules**; trust telemetry is unmeasured (shared finding P01-1/P03-3/P05-4/P08-5) | 2 |

## 3. Five-level vector

| Level | State | Evidence |
| --- | --- | --- |
| L1 conceptual | ✅ | document A…BZ, 20/20 sections |
| L2 data model | ✅ | 22 entity shapes with immutable ids, tenant scope, expiry, evidence and provenance references; addendum BX states what is remembered, AP and BY what is not persisted |
| L3 backend | ✅ | 90 counted tests across five suites; refusals are returned as values, never thrown |
| L4 frontend/workspace | ✅ | **CLOSED 2026-09-16:** `trust-fabric-report.ts` + `/super-admin/trust-fabric`, which exercises 10 invariants and 15 paths and lists 10 gaps rather than describing capability |
| L5 operational | ✅ | CI verify chain (typecheck, tests, registry, secrets, build), infrastructure verifier and preflight |

**Phase 09 derived COMPLETE** (`audit:phases`, 2026-09-16): all five levels satisfied,
no exemptions.

## 4. The finding that matters most

The fabric is **rich and unread**. It implements 10 trust states behind a guarded
transition machine, evidence-weighted scoring with a factor breakdown, assertions
with five refusal paths, provenance chains, revocation with reasons and kinds,
device/workload/agent/model trust, software provenance, artifact integrity, key and
certificate trust, federation, delegation, anchors, versioned policy and zero-trust
verdicts — and **nothing outside the four modules imports it**. Phase 08's gate, the
document's stated consumer, never asks the fabric what it knows. That is why the
integration criterion (AL, BO.15) is `IMPLEMENTED_UNWIRED` and why **P09-5** is the
phase's first work item, ahead of persistence.

The second finding is structural: **no trust record survives the request.** Every
state, assertion and revocation is an in-process value; there is no trust table, so
the fabric cannot answer "where was this subject yesterday?" even though the document
requires a trust history. **P09-4** records that honestly, and the two capabilities
that depend on it — graph traversal (P09-3) and migration (BY) — are declared
unsupported rather than approximated.

The third is a definition the fabric has not settled: **two readings of "usable"**
exist. `isUsableTrustState` counts VERIFIED as usable; the Phase 08 integration
reading (`trustStateToUsable`) does not. The L4 report surfaces the difference
instead of smoothing it, and the unit suite pins it, so the divergence must be
resolved deliberately rather than discovered in an incident.

## 5. Residual debt (reported, never glossed)

P09-1 no cryptographic verification exists (no signature is ever checked) · P09-2 no
attestation engine · P09-3 no graph traversal or revocation propagation (BR.11 holds
only within a single record) · P09-4 no trust persistence (the largest structural
gap) · P09-5 Phase 08 does not consume the fabric · P09-6 no service-trust or posture
records · P09-7 no trust telemetry (shared finding) · P09-8 no external provider,
CA or signing integration; no trust webhook delivery · P09-9 no trust agents, MCP
surfaces or adversarial programme · P09-10 no rehearsed anchor rotation, DR or
compromised-issuer procedure.

## 6. Lesson

Two gates were green while the document was five sections short and named a runtime
as the owner of the platform's trust architecture — the completion audit reads levels,
not prose. And a phase can be genuinely rich and still not be enforcement: 34 of 49
areas are executable, yet the fabric's own consumer never calls it. Capability without
a consumer is inventory, and the honest report says so on the control-plane page where
anyone can read it.
