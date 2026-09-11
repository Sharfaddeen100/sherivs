# CoreGrid — Kernel Phase-Contract Program (Scholar first, domains neutral)

Version: 2026-09-07 · Status: EXECUTING · Owner: Phase 01 (Foundation) under kernel governance

## 1. Why this program exists

The 51-phase platform was built phase by phase with Scholar as the only runtime.
That produced working capability, but phase status was tracked in prose
(`PROGRESS.md`, `architecture/registry.json`) rather than in a machine-checkable
form, and several phases could read as if they were self-contained.

This program rebuilds the phase chain from **Phase 01 upward** with three rules
that make the platform domain-neutral and ASI-ready without discarding anything
already built:

1. **Nothing is deleted or downgraded.** Every Scholar capability, module,
   migration, route and test that exists today is kept and referenced by the new
   contract layer as evidence.
2. **The kernel is domain-neutral.** A phase declares engineering sections,
   capabilities and boundaries only. Scholar ontology never enters the kernel;
   Scholar appears solely as the *first runtime binding*.
3. **No phase is independent.** Contracts declare `dependsOn` and `consumers`;
   the assembled set must form one connected DAG rooted at Phase 01.

## 2. The contract object

`frontend/src/lib/kernel/phase-contract.ts` defines `PhaseEngineeringContract`:

| Field | Meaning |
| --- | --- |
| `id`, `name`, `layer`, `stage`, `status` | Registry identity and lifecycle |
| `purpose`, `boundary` | Why it exists; what it must never own (`excludes`) |
| `dependsOn`, `consumers` | Connection law (no independent phases) |
| `capabilities.owns / consumes` | Kernel capability registry ownership |
| `contracts.provides / consumes` | Commands, queries, APIs, events, UI |
| `sections` | All twenty engineering sections with artifacts + evidence |
| `asi` | Tier, autonomy level, approval gates, invariants, canonical truth |
| `runtimeBindings` | `firstRuntime` (Scholar) + reserved neutral domain seats |

The twenty sections are fixed by `kernel/engineering-sections.ts`, whose terms
match the canonical dictionary in `PROGRESS.md` §10 and
`scripts/verification/engineering-sections.mjs`.

## 3. The ASI profile (per phase, not per feature)

Every contract carries an ASI profile so autonomy is declared where the
capability lives:

- `tier`: `assistive` → `supervised-autonomous` → `governed-autonomous` →
  `civilization-scale`, each with a hard autonomy ceiling.
- `autonomy.requiresApprovalFor`: actions that always need human approval.
- `invariants`: `canonical-truth-separation`, `agent-least-privilege`,
  `human-approval-for-critical`, `ai-output-untrusted`,
  `no-permission-expansion`, `provenance-required`, `observable-autonomy`.
  The first five are mandatory; a contract that drops one fails validation.
- `selfImprovement`: `forbidden` | `proposal-only` | `governed`
  (AGENTS.md §8 — self-improvement is never permission expansion).
- `canonicalTruth`: what the phase owns as reality vs what it derives.

## 4. Runtime neutrality

Each contract declares:

- `runtimeBindings.firstRuntime` — `runtime:scholar` (CoreGrid Scholar R-001).
- `runtimeBindings.neutralSeats` — reserved seats for non-Scholar domains
  (healthcare, government, commerce, and any later domain), each pointing at the
  runtime-manifest contract (`kernel/domain-manifest.ts`).

A contract with no neutral seat fails validation, so no phase can be built
Scholar-only by accident.

## 5. Verification

| Gate | Where |
| --- | --- |
| Section dictionary + coverage | `tests/unit/kernel-phase-contract.test.ts` |
| Per-contract validation | `validatePhaseContract` in the same suite |
| Capability ownership law | contract suite vs `kernel-capability-registry.ts` |
| Connected-DAG law | `buildPhaseContractGraph` / `validatePhaseContractGraph` |
| ASI invariant law | contract suite (cannot omit or weaken invariants) |
| Whole-set validation | `validatePhaseContracts()` in `kernel/phase-contracts/index.ts` |
| Coverage snapshot (what surfaces publish) | `phaseContractCoverageSnapshot()` in the same module, asserted by `tests/unit/kernel-contract-coverage.test.ts` |
| Phase-name authority (registry ↔ catalog ↔ PROGRESS §11 ↔ contracts) | `tests/unit/kernel-contract-coverage.test.ts` + the §11 alignment test in the contract suite (ADR 202) |
| Command Centre governance view | `phaseContractGovernance()` (projection of the snapshot) asserted by `tests/unit/command-centre-contract-governance.test.ts` |

Run with `npm run test:unit` (the contract suite is part of the standard chain)
alongside `npm run typecheck`, `npm run verify:registry` and the build.

## 6. Wave order

| Wave | Scope | State |
| --- | --- | --- |
| K-1 | Kernel contract layer + Phase 01 contract + suite | ✅ landed |
| K-2 | Phases 02–07 contracts (identity, tenancy, reality host, runtime, workspace, agents) | ✅ landed |
| K-3 | Phases 08–14 contracts (security, trust, communication, academic, scheduling, finance, data) | ✅ landed |
| K-4 | Phases 15–20 contracts (hardware, twin, automation, analytics, command centre, government) | ✅ landed |
| K-5 | Phases 21–32 contracts (mobile/web/experience/workforce/intelligence/market/developer/integration/global/enterprise/evolution) | ✅ landed |
| K-6a | Phases 33–40 contracts (universal layer) with ADR-backed duplication governance | ✅ landed |
| K-6b | Phases 41–51 contracts (civilization layer) with ADR-backed duplication resolution | ✅ landed |
| K-7 | Contract coverage published on the platform surface + phase-name drift closed (ADR 202) | ✅ landed |
| K-8 | Contract governance bound into the Command Centre operator surface (Phase 19 view) | ✅ landed |

The contract chain is complete (51/51) and machine-checked. Further waves are
data operations (add a phase contract) or consumer bindings (a runtime declaring
what it consumes) — they are not kernel rewrites.

Adding a phase is a data operation: author `kernel/phase-contracts/phase-NN-*.ts`,
register it in `phase-contracts/index.ts`, run the verification chain. The
kernel itself is never rewritten to add a phase.
