# Registry-truth sweep — reconciling the registry with the completion audit

Date: 2026-09-21 · Scope: `architecture/registry.json` (rows 01–07, 19, 25, 27, 49)
Method: evidence-first reconciliation against `scripts/audit-phase-completion.mjs`
Outcome: **unconfirmed claims 3 → 0 · registry drift 47 phases → 34 · derived COMPLETE 13 → 14**

## 1. Why this sweep ran

Twelve consecutive phase waves (P08–P12) closed their own rows, and each audit run
reported the same growing list of other phases whose registry rows had drifted away
from the evidence. The completion auditor derives five levels from artefacts and
reports drift in both directions; the registry is the claim, the audit is the check.
Before this sweep the registry both **understated** reality (47 phases whose evidence
exceeded the claim) and **overstated** it in three places the audit could not evidence
at all (P19 L4, P25 L4, P49 L1).

Nothing here was inferred. Every correction cites artefacts, and where a claim could
not be proven it was withdrawn rather than reworded.

## 2. Phases whose evidence exceeded the registry claim

`audit:phases` derived COMPLETE for P01–P07 and P27 while their rows read
IMPLEMENTING/IMPLEMENTED with levels `[true,false,…,false]`. Their own archaeology
records had already closed them; only the registry was stale. Each row was corrected
to the evidence vector the audit derives, with `tests` refreshed from the contract's
cited suites (P01 37→38, P02 null→38, P03 null→56; P04–P07 and P27 already correct).

| Phase | Row before | Row now | Evidence the correction rests on |
| --- | --- | --- | --- |
| 01 Foundation | IMPLEMENTING `[T,F,T,F,F]` 37 | **COMPLETE `[T,F,T,T,T]` 38** | L2 absent by ratified exemption (`architecture/phase-completion-exemptions.json`), never as evidence; L4 `/platform`; L5 acceptance proof + verify chain |
| 02 Identity | IMPLEMENTED `[T,F,T,F,F]` null | **COMPLETE `[T,T,T,T,T]` 38** | L2 `cg_identity` migration 20260904020000 (8/8 live checks); L4 `/admin/identities`; L5 `phase-02-acceptance.proof.json`; open: P02-1 events, P02-3 federation |
| 03 Multi-Tenancy | IMPLEMENTED `[T,F,T,F,F]` null | **COMPLETE `[T,T,T,T,T]` 56** | L2 `cg_tenant` (hierarchy + self-parent CHECK, 8/8 live); L4 `/admin/tenants`; L5 `phase-03-acceptance.proof.json`; open: async boundaries, deprovisioning, observability |
| 04 Education Reality Engine | IMPLEMENTED `[T,F,T,F,F]` | **COMPLETE `[T,T,T,T,T]`** | L4 `/admin/education-reality`; L5 `phase-04-acceptance.proof.json`; **DB-gated items preserved** (runtime/scholar manifest, `cg_*` NOT_VALIDATED) |
| 05 Core Application Runtime | IMPLEMENTING `[T,F,T,F,F]` | **COMPLETE `[T,T,T,T,T]`** | L4 `/super-admin/runtime-contracts` (self-check exercises the state machines); L5 proof + verify chain; the S1 caveat (test-only modules, ad-hoc server functions, S3 fabric) kept verbatim as open work |
| 06 Workspace Engine | IMPLEMENTING `[T,F,T,F,F]` | **COMPLETE `[T,T,T,T,T]`** | L4 `/super-admin/workspace-projection` (neutral engine + runtime adapter, no role list); L5 proof + verify chain |
| 07 AI Agent System | IMPLEMENTING `[T,F,F,F,F]` | **COMPLETE `[T,T,T,T,T]`** | Document addendum KH → 20/20; L4 `/super-admin/agent-governance`; L5 proof + verify chain; open: the agent system stays advisory |

Two things were deliberately **not** done: the historical caveats inside these notes
were not deleted (they are dated statements about live wiring, which is what L5
measures, and they remain true), and no level was raised without naming its artefact.

## 2b. The module that resolved to nothing (P21)

`audit:phases` had been printing *"Modules resolve: 32/33 phases with modules"* — one phase
listing modules that resolve to no source. It was **P21 Global Cloud Fabric**: the row listed
`cloud-fabric-iac` alongside `cloud-core`, `cloud-byoc` and `cloud-governance`. The three are
real (`frontend/src/lib/cloud-*.ts`); the fourth is infrastructure-as-code, which lives in
`infrastructure/terraform`, `infrastructure/kubernetes`, `infrastructure/workloads` and
`infrastructure/monitoring`, not in the library namespace registry modules are resolved
against. The row was therefore claiming a module that does not exist.

Corrected: the three real modules stay, the IaC deliverable is named where it lives, and
**no level moved** — the phase still reads L1 only, which matches its state (blueprinted and
instantiated as IaC with 64/64 invariants proven by `infrastructure-preflight` and
`cloud-fabric-foundation`, and **nothing deployed** pending owner credentials CF-4…CF-12).
The audit now reports 33/33.

This is the smallest correction in the sweep and the most instructive: a registry field can
drift into meaning "things this phase delivered" instead of "modules", and the only reason it
was caught is that a counter printed the mismatch on every run.

## 3. The three claims the audit could not evidence — hand reviews

The auditor records unevidenced claims as UNKNOWN-class review items, never as
failures, because a narrow artefact search is not proof of absence. Each was reviewed
by hand. Two outcomes were possible: the claim was wrong, or the evidence was real but
invisible to the rule. Both occurred.

**P25 Institutional Onboarding & Workforce — the claim was right, the row was wrong.**
The audit could not evidence L4 because the row's **module list was incomplete**:
`frontend/src/lib/workforce-positions.ts` declares itself *"Phase 25 Workforce Identity"*
and `frontend/src/lib/onboarding/onboarding-flow.ts` declares itself *"Phase 25 …
domain-neutral ORGANIZATION ONBOARDING FLOW"*, and the contract already cited their
suites (`workforce-positions.test.ts`, `onboarding-flow.test.ts`) while omitting the
modules. Both are now attributed to the phase, and with the attribution corrected the
projection is plainly there: `/_authenticated/admin/staff-accounts` imports
`@/lib/workforce-positions` together with its server functions, and the Command Centre
surface composes the onboarding flow. `tests` was also corrected 53 → 128, the count
the cited suites actually contain. **The workforce extension of identity is the approved
duplication D8 (CLOSED, owner 02)** — this is the designed extension, not drift.

**P19 Command Centre — the claim was wrong.** The hand review confirmed the audit
rather than exposing a blind spot. No route or component imports `command-core`,
`command-alerts`, `command-incidents` or `command-governance`, and no `lib/surfaces`
adapter consumes them either (that directory holds only `generated-site-view`,
`marketplace-view`, `runtime-view`). The `/` surface renders
`components/command-centre/command-centre`, which is a **platform provisioning console**
— it composes security policy, the onboarding flow and the phase catalog, not
operational awareness. The L4 claim was therefore withdrawn. This is a real gap in the
platform, not a bookkeeping correction: *the platform has no surface for health signals,
alerts or incidents*, which is exactly the capability phase 19 owns. L1, L2 (contract
substrates: alert definitions, alert state, incidents), L3 (four modules, four suites,
47 tests) and L5 (`scripts/verify-phase-consumption.mjs` tests the phase as consumed)
stand unchanged.

**P49 Autonomous Economy Engine — the claim was wrong.** L1 requires a phase document
stating at least eight of the twenty mandatory engineering sections plus a kernel
contract. The contract exists (`phase-49-autonomous-economy.ts`); the document
(`architecture/phase-49-autonomous-economy-engine.md`) states **7 of 20**. The claim was
withdrawn rather than excused. This is a documentation gap for a future phase-49 wave to
close by authoring the missing sections — the rule is not lowered to fit the document.
L2 and L5 stand; L3 and L4 are absent because the phase declares no modules at this
stage.

## 4. The one phase deliberately left open

P27 Marketplace now has levels `[T,T,T,T,T]` and, by the ledger's own rule, derives
COMPLETE — but the row reads **IMPLEMENTED, held for audit**, and the note says why:
the phase has no acceptance record (`architecture/phase-acceptance/` holds records for
phases 01–12 only) and no archaeology record. Closing it on the strength of an artefact
scan alone would be exactly the assertion-without-evidence the laws forbid. Its L4 is
real — the `/marketplace` route renders `lib/surfaces/marketplace-view`, which consumes
`@/lib/marketplace-core` and `@/lib/marketplace-entitlement` — so the phase is the
**next audit target**, not a work item to defer.

## 5. What this sweep refused to do

- **No level was raised without an artefact naming it**, and no claim was kept because a
  phase "should" have it. Where the evidence was missing, the claim moved, not the rule.
- **No code was written to satisfy a level.** The tempting shortcut for P19 — have the
  `/` surface import a command module so the auditor credits L4 — would have been
  keyword-gaming, and the level would still have been false: the console does not project
  operational awareness. The honest move was to withdraw the claim and record the gap.
- **No historical caveat was deleted.** The P04 DB-gated items, the P05 "test-only
  modules / ad-hoc server functions / S3 fabric" note and the P06 "genuine dynamic
  composition pending" note remain in their rows, dated and unedited, with the sweep note
  appended after them.
- **No exemption was widened.** P01's L2 exemption was left exactly as ratified
  (`phase-completion-exemptions.json`); the row now says L2 is absent *because of that
  exemption*, which is the direction the auditor requires — an exemption is recorded
  separately, never as evidence.
- **No other phase's row was touched.** 34 phases still drift (P13–P18, P20–P24, P26,
  P28–P37, P39–P51). Each needs its own evidence review; guessing at them in bulk would
  recreate the problem this sweep was run to fix.

## 6. Verification

| Check | Result |
| --- | --- |
| `npm run audit:phases` | **COMPLETE 14 · IMPLEMENTING 19 · ARCHITECTURE_DEFINED 18** (was 13/20/18) |
| Unconfirmed claims (registry claims a level with no evidence) | **none** (was P19 L4, P25 L4, P49 L1) |
| Registry drift (evidence beyond the registry claim) | **34 phases** (was 47); P01–P12, P19, P25, P27 all cleared |
| `npm run verify:registry` | **PASSED** — phases 51, capabilities 50, duplications 15, runtimes 2 |
| Targeted suites (audit, acceptance probes, kernel contract, catalog, foundation, neutrality) | see the ledger entry — all green |
| Generated artefacts | `architecture/phase-completion-status.md` and `architecture/proofs/phase-completion.proof.json` regenerated by the audit, never hand-edited |

## 7. Work items this sweep produced

1. **P19 L4 — build the operational surface.** The health/alert/incident engines exist,
   tested, and are consumed by nothing. Closing L4 means one operational surface
   projecting them from real state. Until then the registry says L4 is unmet.
2. **P27 — run its audit wave.** Acceptance record, archaeology record, then closure.
3. **P49 L1 — author the missing engineering sections** in the phase document (7 → 20),
   in a phase-49 wave with its own authority.
4. **P25 — reduce the direct Supabase reads in the HR surface** so the phase's engines are
   the only path to the data they own.
5. **Phases 13–18, 20–24, 26, 28–37, 39–51 — continue the sweep**, one evidence review at
   a time. `audit:phases` prints the current drift list; it is the worklist.


