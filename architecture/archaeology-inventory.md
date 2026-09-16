# CoreGrid — Repository Archaeology Inventory

> **Status:** RECONNAISSANCE RECORD (wave AUDIT-1). This is the index the
> archaeology command asks for: every mandated output, whether it already exists,
> where it lives, and what is genuinely missing.
>
> **Why this file exists:** most mandated deliverables were already authored in
> earlier waves. Re-writing them would violate the constitution's own duplication
> law, so this inventory *locates* them and names only the real gaps.

## 1. Mandated archaeology outputs → actual artefacts

| # | Mandated output | Status | Artefact(s) |
| --- | --- | --- | --- |
| 1 | Complete repository map | **PARTIAL** | `docs/system-audit.md`, `docs/frontend.md`, `docs/backend.md`, `docs/database.md`, `docs/stack.md`, `architecture-map.md` |
| 2 | Technology preservation report | **PRESENT** | `docs/stack.md` (verified stack: INSTALLED/USED/CONFIGURED/UNUSED per technology) |
| 3 | Prototype destruction report | **MISSING** | scattered evidence only — see work package AT-1 |
| 4 | Scholar extraction report | **PRESENT** | `architecture/scholar-phase-power-map.md`, `architecture/scholar-phase-consumption-audit.md`, `architecture/kernel-phase-contract-program.md` |
| 5 | CoreGrid kernel boundary document | **PRESENT** | `BOUNDARIES.md`, `architecture/kernel-*`, enforced by `tests/unit/kernel-purity.test.ts` (Scholar Independence + Runtime Installation tests) |
| 6 | Capability ownership graph | **PRESENT** | `architecture/capability-ownership-graph.md` + `capabilities[]` in `architecture/registry.json` |
| 7 | Dependency graph | **PRESENT** | `architecture/dependency-graph.md`, `DEPENDENCY.md` |
| 8 | Database migration map | **PRESENT** | `architecture/migration-plan.md`, `migration-report.md`, `docs/migration-audit.md`, `docs/migration-roadmap.md`, 54 migrations in `database/supabase/migrations/` |
| 9 | Frontend migration map | **MISSING** | route/component inventory exists in `docs/frontend.md`, but no per-surface KEEP/REFACTOR/MIGRATE/REMOVE classification — see AT-2 |
| 10 | Architecture risks | **PRESENT** | `PROGRESS.md` §19 Risk Register, `docs/system-audit.md` |
| 11 | Unknowns requiring investigation | **MISSING** | gaps are implied across documents, not registered — see AT-3 |

## 2. The Phase Completion Gate is now executable (new)

`npm run audit:phases` derives the five-level maturity model from artefacts and
reconciles it against `architecture/registry.json`:

| Evidence-derived level | Definition |
| --- | --- |
| L1 conceptual | phase document with ≥ 8 engineering sections **and** a kernel phase contract |
| L2 data model | data-model vocabulary in the document **and** (a migration references the capability **or** the contract declares substrates) |
| L3 backend | every declared module resolves to real source **and** contract-cited tests exist with real test counts, **or** the contract cites ≥ 1 existing EXECUTABLE artefact (scripts/tests/migrations/frontend source/infrastructure/CI) — documentation citations alone never satisfy this level |
| L4 frontend/workspace | a route or component references the phase's modules/capability |
| L5 operational | a proof, verifier, CI job, runbook or infrastructure file names it |

Outputs: `architecture/proofs/phase-completion.proof.json` (machine-readable) and
`architecture/phase-completion-status.md` (generated table).

**Verdict at AUDIT-1 (2026-09-13):** 51 phases audited — **COMPLETE 7**
(03 tenancy, 04 education-reality ontology, 08 security enforcement, 12
scheduling, 24 experience design, 27 marketplace, 33 reality ontology),
**IMPLEMENTING 25**, **ARCHITECTURE_DEFINED 19**. Dominant gap: **L4
frontend/workspace projection — 43 phases**; then L3 backend — 20, L2 data model
— 13, L5 operational — 2, L1 conceptual — 1 (phase 49).

Two drift findings, both recorded rather than smoothed over:

- **The registry understates reality for 45 phases** — it carried hand-maintained
  `levels` vectors claiming Level 1 only while 26 phases ship modules and 1,875
  contract-cited tests exist. Stale claims are review items, not lies.
- **Five registry claims could not be evidenced** by this audit (01 and 02 L3,
  19 and 25 L4, 49 L1) — UNKNOWN class, to be confirmed by hand (phase 49's
  document lacks the engineering sections the L1 rule requires).
- **Update 2026-09-14 (AUDIT-P01):** the L3 rule now also accepts contract-cited
  EXECUTABLE artefacts, which confirms phase 01's L3 claim from its real
  enforcement (verify chain, secret scan, registry validator, CI workflow, 15
  integrity tests). Unconfirmed claims fall 5 → 4 (**02 L3, 19 L4, 25 L4, 49 L1**);
  architecture-only phases are unaffected (0 executable artefacts).
- **Corrected again the same day:** the L4 rule was matching a bare module word, so
  "identity" inside marketing prose on `/platform` awarded phase 02 a level it had
  not earned — it briefly read COMPLETE. L4 now requires a distinctive reference
  (the capability id, or a route/component importing the phase's module). No surface
  imports any identity module, so **the honest totals were COMPLETE 5 · IMPLEMENTING
  28 · ARCHITECTURE_DEFINED 18** with unconfirmed claims **19, 25, 49**. L4 now
  understates at worst, never overstates.
- **Update 2026-09-14 (phase 02/03 closure):** the L4 gap was then closed with real
  projections — `/admin/identities` (list + register inside the actor's own tenant
  boundary) and `/admin/tenants` (real `cg_tenant` state behind the super-admin
  gate). Phases **02 Identity** and **03 Multi-Tenancy** now derive
  `L1 ✓ L2 ✓ L3 ✓ L4 ✓ L5 ✓` and are **COMPLETE**; totals stay
  **COMPLETE 5 · IMPLEMENTING 28 · ARCHITECTURE_DEFINED 18** because three earlier
  COMPLETE claims (04, 24, 33) were false positives under the loose rule and are
  now correctly listed as needing L4.

## 3. Per-phase archaeology intake (phases 01–03 audited and COMPLETE)

Every phase document is verified four ways (document ↔ kernel contract ↔
`registry.json` ↔ code) and its acceptance criteria are resolved against real
artefacts by `npm run audit:phase -- --phase=<id>` (data file per phase under
`architecture/phase-acceptance/`, classification ENFORCED / DECLARED /
IMPLEMENTED_UNWIRED / MISSING, proof per phase under `architecture/proofs/`). The
narrative record lives beside this inventory. **Phases 01–05 all derive COMPLETE**
(`audit:phases`: COMPLETE 8 · IMPLEMENTING 25 · ARCHITECTURE_DEFINED 18), each with
the reason recorded:

| Phase | Record | Acceptance probe result |
| --- | --- | --- |
| 01 Foundation | `architecture/archaeology/phase-01-foundation.audit.md` | 45 areas — **ENFORCED 42 · UNWIRED 3 · DECLARED 0 · MISSING 0**; **COMPLETE** (L4 closed by the `foundation-standards` module projected on `/platform`; L2 exempt under BR-01, justified and revocable); work items P01-1…P01-4 closed, BR-01 closed, U-01…U-04 answered |
| 02 Identity | `architecture/archaeology/phase-02-identity.audit.md` | 12 areas — **ENFORCED 11 · DECLARED 1 · MISSING 0**; **COMPLETE** (L4 closed by `/admin/identities`); paste degraded (repo doc authoritative); P02-1 events open, P02-3 federation reserved |
| 03 Multi-Tenancy | `architecture/archaeology/phase-03-multi-tenancy.audit.md` | 19 areas — **ENFORCED 16 · DECLARED 2 · UNWIRED 1 · MISSING 0**; **COMPLETE** (L4 closed by `/admin/tenants`); async boundaries, deprovisioning, observability wiring open; tenant migration reserved |
| 04 Education Reality Engine | `architecture/archaeology/phase-04-reality-engine.audit.md` | 16 areas — **ENFORCED 16 · DECLARED 0 · UNWIRED 0 · MISSING 0**; **COMPLETE** (document completed 16/20 → **20/20** by addendum §199–204; L4 closed by `/admin/education-reality`; registry row corrected to 81 tests); P04-1…P04-3 closed |
| 05 Core Application Runtime | `architecture/archaeology/phase-05-application-runtime.audit.md` | 13 areas — **ENFORCED 12 · UNWIRED 1 · DECLARED 0 · MISSING 0**; **COMPLETE** (document completed 19/20 → **20/20** by addendum HD; L4 closed by `/super-admin/runtime-contracts` with a self-check that exercises the shipped state machines; registry row corrected to 100 tests) |
| All probes | `tests/unit/phase-acceptance-probes.test.ts` | every `architecture/phase-acceptance/phase-*.json` is discovered and re-derived automatically — adding a probe adds coverage with no test change |

## 4. Archaeology work packages (next, in order)

| Package | Purpose | Evidence required |
| --- | --- | --- |
| **AT-1** Prototype/hardcode audit | classify every `mock`/`fake`/`hardcoded`/`placeholder`/`TODO` finding across app, DB, UI and AI responses as KEEP / REFACTOR / MIGRATE / DEPRECATE / REMOVE | per-finding record with file, line, owner phase, classification |
| **AT-2** Frontend migration map | classify every route/component/workspace as projecting REAL STATE vs STATIC PRESENTATION, and map each to its owning phase | route-by-route table + manufactured-state findings |
| **AT-3** Unknowns register | register every unresolved question as KNOWN / INFERRED / UNKNOWN / CONFLICTING / RESERVED with the artefact that would resolve it | register table with owner and resolution path |

These three were deliberately NOT guessed at here: each requires exhaustive
per-file inspection, and inventing them would produce exactly the architectural
theatre the constitution forbids.

## 5. What this wave did NOT do

- No feature implementation (Law 11: no implementation before archaeology).
- No registry edit to "fix" stale levels: the auditor reports drift; correcting
  claims requires per-phase evidence review, one phase at a time.
- No fabrication of completion: incomplete phases are reported incomplete.
