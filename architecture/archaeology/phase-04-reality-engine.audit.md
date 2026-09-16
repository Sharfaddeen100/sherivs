# Phase 04 — Education Reality Engine · Archaeology Record

> **Wave:** AUDIT-P04 (intake, document completion and closure).
> **Sources:** `architecture/phase-04-education-reality-engine.md` (196 sections +
> the 199–204 addendum), `frontend/src/lib/kernel/phase-contracts/phase-04-reality-engine.ts`,
> `architecture/registry.json` row 04, the education/runtime code.
> **Machine evidence:** `architecture/proofs/phase-04-acceptance.proof.json`,
> `architecture/phase-acceptance/phase-04-reality-engine.json`.

## 1. Four-way verification

| Dimension | Verdict |
| --- | --- |
| Document | **WAS INCOMPLETE — NOW COMPLETED.** 16/20 mandatory engineering sections; **command, agent, observability, dependency, failure and data model** were implicit rather than stated. Owner instruction 2026-09-14: complete the architecture, then build. Addendum sections **199–204** were authored in the document's own style, stating existing behaviour (not new scope) → **20/20**, machine-counted by `npm run audit:phases`. |
| Contract | `phase-04-reality-engine.ts` — the phase declares capability, boundaries and consumers; `dependsOn` 01/02/03/33 |
| Registry | **UNDERSTATED the phase.** The row claimed `[L1 ✓, L2 ✗, L3 ✓, L4 ✗, L5 ✗]` and `tests: null`; the audit derives **L1 ✓ L2 ✓ L3 ✓ L5 ✓** with **81 counted tests**. The row now records 81 tests and its real module list. |
| Code | 8 modules resolve: `education-core`, `education-curriculum`, `education-institution`, `education-assessment`, `education-facilities`, `education-governance`, `runtime/scholar`, `runtime/scholar-events`; 47 tests in `education.test.ts` alone plus the Scholar suites; kernel substrate migration `20260903000000`; `cg_entity`-backed operating model |

## 2. Acceptance probe

`npm run audit:phase -- --phase=04` → **16 areas: ENFORCED 16 · DECLARED 0 ·
UNWIRED 0 · MISSING 0**, `ok: true`.

| Group | Areas |
| --- | --- |
| Reality model | levels/programmes/curricula/versions/subjects/cohorts/classes/streams as typed reality objects; institution self-description and the versioned operating model |
| Substrate | persisted on `cg_entity`/`cg_relationship`/`cg_observation`/`cg_event` with tenant boundaries (owner 33) |
| Commands | server-side, Zod-validated, tenant-resolved, versioned publications behind the canonical Phase 08 gate |
| Education in practice | assessment/grading/progression; facilities and physical-to-digital mapping; language and multilingual delivery |
| African reality | offline-first, low-bandwidth and power-aware operation (a first-class requirement, not an edge case) |
| Learning | competency, mastery and portfolios |
| Boundaries | AI is not the system of record; tenant isolation, privacy and child-data protection; event contracts with idempotency |
| Governance | configuration validation and reality validation; schema/curriculum/structure evolution |
| Documentation | the 199–204 addendum, checked by `engineering-sections.mjs` through `kernel-contract-coverage.test.ts` |
| Projection | `/admin/education-reality` (L4) |

## 3. Five-level vector

| Level | State | Evidence |
| --- | --- | --- |
| L1 conceptual | ✅ | 196 sections + 199–204 addendum + 20-section contract |
| L2 data model | ✅ | kernel substrate migration + `cg_entity` operating model + branded identifiers |
| L3 backend | ✅ | 81 counted tests across the education and Scholar suites |
| L4 frontend/workspace | ✅ | **CLOSED 2026-09-14:** `education-reality-view.ts` + `/admin/education-reality` |
| L5 operational | ✅ | verifiers, CI and migrations name the runtime |

**Phase 04 derived COMPLETE on 2026-09-14** (`audit:phases`): all five levels
evidenced, `sections 20/20`.

## 4. The projection, and why it is honest

The surface answers the document's own §1 questions ("What does this institution
look like?", "How does this institution operate?") from the **published operating
model** read for the actor's own tenant. It has three states and no fourth:

- `published` — version, reason, date and counts derived from the spec;
- `not_published` — the institution has no operating model yet, so nothing
  structural is shown;
- `invalid_spec` — a version exists but its specification cannot be read.

`educationRealityView` is pure and tested (7 tests): unknown spec keys count as
zero, non-object specs are rejected, and no count is ever invented. **Rendering a
default school is the failure mode this design exists to prevent.**

## 5. Ownership findings

The document's boundaries are respected in code: hardware and devices belong to 15,
twins to 16, automation to 17, analytics to 18, experience to 24 and AI reasoning to
26; the reality model itself is consumed by 11/12/13/25. The runtime registers over
the kernel domain-manifest and records domain events through the kernel `eventDraft`
contract — it never forks a private event or substrate model.

## 6. Work items

| ID | Item | Kind | Status |
| --- | --- | --- | --- |
| P04-1 | Document lacked six mandatory engineering sections | documentation | **CLOSED** — addendum 199–204, 20/20 |
| P04-2 | No workspace projection (L4) | L4 projection | **CLOSED** — `/admin/education-reality` |
| P04-3 | Registry row understated levels and tests | registry accuracy | **CLOSED** — 81 tests recorded, real modules listed |
| U-04 | Whether the operating model behaves as designed against a live database remains DB-gated (the `cg_*` substrate is authored, not yet validated live — CF-7) | unknown (DB-gated) | open |
| U-05 | Tenant-attributable operational signals are still emitted by no runtime path (shared with P01-1 / P03-3) | unknown → debt | open, cross-phase |
