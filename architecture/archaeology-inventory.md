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
narrative record lives beside this inventory. **Phases 01–07 all derive COMPLETE**
(`audit:phases`: COMPLETE 10 · IMPLEMENTING 23 · ARCHITECTURE_DEFINED 18), each with
the reason recorded. Every closure below is verified by its own probe plus the
neutrality lock, so a later phase cannot quietly undo an earlier one:

| Phase | Record | Acceptance probe result |
| --- | --- | --- |
| 01 Foundation | `architecture/archaeology/phase-01-foundation.audit.md` | 45 areas — **ENFORCED 42 · UNWIRED 3 · DECLARED 0 · MISSING 0**; **COMPLETE** (L4 closed by the `foundation-standards` module projected on `/platform`; L2 exempt under BR-01, justified and revocable); work items P01-1…P01-4 closed, BR-01 closed, U-01…U-04 answered |
| 02 Identity | `architecture/archaeology/phase-02-identity.audit.md` | 12 areas — **ENFORCED 11 · DECLARED 1 · MISSING 0**; **COMPLETE** (L4 closed by `/admin/identities`); paste degraded (repo doc authoritative); P02-1 events open, P02-3 federation reserved |
| 03 Multi-Tenancy | `architecture/archaeology/phase-03-multi-tenancy.audit.md` | 19 areas — **ENFORCED 16 · DECLARED 2 · UNWIRED 1 · MISSING 0**; **COMPLETE** (L4 closed by `/admin/tenants`); async boundaries, deprovisioning, observability wiring open; tenant migration reserved |
| 04 Education Reality Engine | `architecture/archaeology/phase-04-reality-engine.audit.md` | 16 areas — **ENFORCED 16 · DECLARED 0 · UNWIRED 0 · MISSING 0**; **COMPLETE** (document completed 16/20 → **20/20** by addendum §199–204; L4 closed by `/admin/education-reality`; registry row corrected to 81 tests); P04-1…P04-3 closed |
| 05 Core Application Runtime | `architecture/archaeology/phase-05-application-runtime.audit.md` | 13 areas — **ENFORCED 12 · UNWIRED 1 · DECLARED 0 · MISSING 0**; **COMPLETE** (document completed 19/20 → **20/20** by addendum HD; L4 closed by `/super-admin/runtime-contracts` with a self-check that exercises the shipped state machines; registry row corrected to 100 tests; **domain-neutral: verified by `platform-neutrality.test.ts`**) |
| 06 Workspace Engine | `architecture/archaeology/phase-06-workspace-engine.audit.md` | 18 areas — **ENFORCED 16 · DECLARED 2 · UNWIRED 0 · MISSING 0**; **COMPLETE** (addendum IE → 20/20; L4 closed by `/super-admin/workspace-projection`, rebuilt in the neutrality correction as a **neutral engine + runtime adapter**, catalog-driven with no role list) |
| 07 AI Agent System | `architecture/archaeology/phase-07-ai-agent-system.audit.md` | 14 areas — **ENFORCED 14 · DECLARED 0 · UNWIRED 0 · MISSING 0**; **COMPLETE** (addendum KH → 20/20; L4 closed by `/super-admin/agent-governance`; **domain-neutral: verified**) |
| 08 Security Engine | `architecture/archaeology/phase-08-security-engine.audit.md` | 45 areas — **ENFORCED 22 · DECLARED 14 · UNWIRED 9 · MISSING 0**; **COMPLETE** (document normalised — 884 truncated duplicate lines removed — and completed 18/20 → **20/20** by addenda AW command model / AX data model / AY runtime consumer boundary / AZ query model; contract corrected 70 → 108 tests; **scope framing corrected: CoreGrid owns the engine, Scholar is runtime-001 consuming it**; **domain-neutral: 73 kernel modules re-framed and the law machine-enforced**) |
| 09 Security Trust Fabric | `architecture/archaeology/phase-09-security-trust-fabric.audit.md` | 49 areas — **ENFORCED 34 · DECLARED 13 · UNWIRED 2 · MISSING 0**; **COMPLETE** (document completed 15/20 → **20/20** by addenda BU command model / BV query model / BW workflow model / BX trust memory and knowledge / BY trust migration / BZ runtime consumer boundary; contract corrected 82 → 90 tests; **scope framing corrected: CoreGrid owns the fabric, Scholar is runtime-001 consuming it**; L4 closed by `trust-fabric-report.ts` + `/super-admin/trust-fabric`, which **exercises** 10 invariants and 15 paths and reports 10 declared gaps; **domain-neutral: verified**) |
| 10 Communication Platform | `architecture/archaeology/phase-10-communication-platform.audit.md` | 34 areas — **ENFORCED 27 · DECLARED 7 · UNWIRED 0 · MISSING 0**; **COMPLETE** (document completed 18/20 → **20/20** by addenda EL dependency register / EM steward mandate data model / EN organization subscription / EO the communication steward / EP autonomous call rules / EQ the human role the steward replaces / ER steward acceptance criteria; contract corrected 59 → 168 tests and declares three new capability ids; **scope framing corrected: CoreGrid owns the platform, Scholar is runtime-001 consuming it**; L4 closed by `communication-steward-report.ts` + `/super-admin/communication-steward`, which **exercises** the mandate machine on three real organizations and reports 7 declared gaps; **owner upgrade delivered: per-organization Communication Steward with a written mandate, 21 real provider adapters behind one shape, telephony named but not yet wired**; **domain-neutral: kernel modules name no runtime, verified**) |
| Domain neutrality — wave 2 | `architecture/archaeology/domain-neutrality-wave-2.audit.md` | platform-wide — **the kernel held one runtime's data and the shell rendered it**: the ~1,070-line runtime navigation catalog left `lib/workspace-engine/` for the runtime layer, a runtime-layer registry now lists what is installed (`INSTALLED_NAV_CONTRIBUTION_SETS` / `ALL_NAV_CONTRIBUTIONS`), a runtime's identity left `lib/platform.ts` for `lib/runtime/installed-runtimes.ts`, the platform gate's runtime-named symbols became generic, kernel `phase-contracts/**` contains **no runtime name at all**, and platform surfaces speak about *installed* runtimes; **two new laws** (kernel owns no runtime's data; only the runtime layer narrates a runtime) keep it that way — 568 files scanned, 0 narrators; targeted suites **101 passed**, `tsc` clean, full suite 2861/2863 with both failures stale test/record references since fixed |
| 11 Academic Learning Intelligence | `architecture/archaeology/phase-11-academic-intelligence.audit.md` | 17 areas — **ENFORCED 12 · DECLARED 5 · UNWIRED 0 · MISSING 0**; **COMPLETE** (document restored from a mid-section truncation and completed 17/20 → **20/20** by addenda FD command model / FE query model / FF data model, with a duplicated FF section detected and removed and one owner-framing line in the restored tail caught by the blueprint law and corrected; three engines built — `academic-curriculum` with a nine-level hierarchy, versioning that survives history and an acyclic competency graph, `academic-assessment` with question validation and blueprint coverage, `academic-intelligence-report` as L4 exercising all of it; contract 49 → **80** tests; registry row corrected to COMPLETE with 7 modules; acceptance record authored; **zero placeholders, zero role lists**) |
| 12 Scheduling Intelligence | `architecture/archaeology/phase-12-scheduling-intelligence.audit.md` | 20 areas — **ENFORCED 13 · DECLARED 7 · UNWIRED 0 · MISSING 0**; **COMPLETE** (document completed 16/20 → **20/20** by addenda ER domain neutrality / ES query model / ET memory and knowledge / EU data model; three engines built — `scheduling-conflicts` with a 12-type taxonomy and detection across participant, resource, capacity, capability, accessibility, calendar and travel, `scheduling-quality` with binary feasibility, load balance, disruption vectors against an explicit stability tolerance, version comparison, impact analysis, placement explanation and least-disruptive ranking, and `scheduling-intelligence-report` as L4, which **exercises** both engines and reports 6 declared gaps; contract 47 → **74** tests; registry row corrected to COMPLETE with 7 modules; **scope framing corrected: the capability belongs to CoreGrid, not to a school — the same engine is expressed in six organizations' vocabulary and the neutrality guard proves no school vocabulary leaks into the domain-neutral modules**; **zero placeholders, zero role lists**) |
| All probes | `tests/unit/phase-acceptance-probes.test.ts` | every `architecture/phase-acceptance/phase-*.json` is discovered and re-derived automatically — adding a probe adds coverage with no test change |
| Neutrality lock | `tests/unit/platform-neutrality.test.ts` | **no vertical may leak into a neutral module** (import patterns), and **no platform surface may declare a role list** — the Scholar role catalog has hundreds of roles and grows, so roles are derived, never enumerated |

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
