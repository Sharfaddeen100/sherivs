# Phase 12 — Scheduling & Timetable Intelligence: audit record

Date: 2026-09-20 · Phase: 12 · Status: **COMPLETE**
Document: `architecture/phase-12-scheduling-intelligence.md`
Contract: `frontend/src/lib/kernel/phase-contracts/phase-12-scheduling-intelligence.ts`
Acceptance: `architecture/phase-acceptance/phase-12-scheduling-intelligence.json`

## 1. The defect this phase carried

Two defects, and only one of them was a missing feature.

**Framing.** The blueprint described scheduling as a school timetable problem. Section after
section spoke of learners, teachers, classrooms and examinations as though those were the domain.
They are not: they are one institution's vocabulary for a platform capability. A hospital rosters
clinicians against theatres, a logistics operator pairs vehicles with docks, a warehouse plans
pickers against bays, a ministry sequences hearings and committee rooms. Every one of them is the
same constrained allocation problem, and a platform that hard-codes the school version makes every
other organization a fork.

**Completeness.** Keyword scanning found the document stated 16 of the 20 mandatory engineering
sections. The query model, memory model, knowledge model and data model were absent — the four
that determine whether a capability can be read, remembered, learned from and stored.

## 2. What was corrected in the document

Four sections were authored in the document's own lettered style, completing it at 20/20:

- **ER. Domain-Neutral Scheduling For Every Organization** — states the correction above as
  contract: the participant is an actor reference, a resource is anything with capacity,
  capability and availability, the activity type is institutional data, and what each organization
  calls these things is configuration. It lists the nine universals (versioned publishable
  allocation, hard versus soft, infeasibility reported rather than fabricated, explainability,
  disruption as a first-class measure, governed publication with reconstructable history,
  availability as owned data, accessibility as a constraint, explicit time).
- **ES. Query Model** — twelve read-only queries (version-at, comparison, feasibility, conflicts,
  resolved availability, capacity, workload, alternatives, impact, quality, explanation) with four
  rules: a scenario is never returned as production state, aggregates never reveal what the caller
  could not read, unknown is returned as unknown rather than defaulted to available, and every
  result carries the version it was computed from.
- **ET. Memory and Knowledge Model** — separates this organization's scheduling memory (decision,
  constraint, availability, outcome and explanation memory, tenant-scoped and purpose-limited)
  from platform knowledge (the constraint catalog, activity and resource taxonomies, solver
  behaviour recorded as evidence). A learned preference is a proposal until an organization adopts
  it in policy.
- **EU. Data Model** — keeps four things apart that scheduling systems routinely collapse: what was
  requested, planned, published and what actually happened; entities, constraints and the rules
  that make invalid data unwritable (explicit timezone, non-negative duration, recurrence as a rule
  plus exception dates rather than pre-expanded rows, immutable published versions).

## 3. What was built

Three modules, two suites, one surface.

| Artefact | Purpose |
| --- | --- |
| `frontend/src/lib/scheduling-conflicts.ts` | 12-type conflict taxonomy, explicit conflict records, detection across participants, resources, capacity, capability, accessibility, calendar and travel, resolution strategies per type, and `escalateConflicts` separating blocking from waivable |
| `frontend/src/lib/scheduling-quality.ts` | Independent scoring dimensions with binary feasibility, load balance, disruption vectors against an explicit stability tolerance, version comparison, impact analysis, placement explanation and candidate ranking |
| `frontend/src/lib/scheduling-intelligence-report.ts` | 14 rules tied to module+suite, 13 checks that execute the engines and record what they observed, 6 declared gaps, totals computed from live module constants |
| `tests/unit/scheduling-governance.test.ts` | 21 tests over the conflict and quality engines |
| `tests/unit/scheduling-intelligence-report.test.ts` | 6 tests over the report, its rule wiring and its neutrality |
| `frontend/src/routes/_authenticated/super-admin/scheduling-intelligence.tsx` | The phase surface: checks with their observations, the same capability in six organizations' vocabulary, the enforced rules, and the gaps. No role list. |

The registering decisions the engines enforce: feasibility is binary and never traded for quality;
minimal disruption outranks theoretical efficiency; blocked periods are policy; an infeasible
request is reported as infeasible with guidance rather than fabricated into a valid plan; and a
placement can always answer why it is here, why this resource, and why not the alternatives.

## 4. Verification performed

| Check | Result |
| --- | --- |
| `vitest run tests/unit/scheduling-governance.test.ts tests/unit/scheduling-intelligence-report.test.ts` | 2 files · **27 tests passed** |
| `npx vitest run` (whole unit suite) | 187 files · **2,935 tests passed** |
| `npx tsc --noEmit` | **0 errors** |
| `npx vite build` | **two builds green** (client 5m02s, server 4m25s) — `routeTree.gen.ts` regenerated so the surface is reachable |
| `node scripts/audit-phase-completion.mjs --phase=12` | COMPLETE 1 · modules resolve 1/1 · tests counted **74** · drift none · unconfirmed claims none |
| `node scripts/audit-phase-acceptance.mjs --phase=12` | 20 areas · **ENFORCED 13 · DECLARED 7 · UNWIRED 0 · MISSING 0** |
| `node scripts/verification/registry-validate.mjs` | **PASSED** — phases 51, capabilities 50, runtimes 2 |
| `node scripts/normalise-phase-doc-framing.mjs --check` | 52 documents scanned · owner-framing to rewrite **0** |
| Document section coverage | 20/20 — every mandatory engineering section present |

Every check in the report is executed when the report is built: the evidence string for each check
is produced by a call made in the same run, so a regression changes the surface rather than hiding
behind a stored assertion. The seven DECLARED areas are not failures converted into passes; the
acceptance classifier required an executable artefact and reported honestly what has none.

## 5. Ownership and boundaries honoured

Scheduling owns scheduling semantics. Identity stays Phase 02's, tenancy Phase 03's, canonical
institutional reality Phase 04's, agent execution Phase 07's, authorization Phase 08's, trust
Phase 09's, delivery Phase 10's, academic requirements Phase 11's, financial effects Phase 13's,
generic data infrastructure Phase 14's, hardware signals Phase 15's, digital twins Phase 16's,
workflow approval Phase 17's and cross-platform analytics Phase 18's. The engines schedule
placement and never write the records they schedule around, and communication remains downstream
of scheduling: this phase emits the fact, other phases decide the message.

## 6. Known risks and remaining work

1. No solver is wired behind the abstraction. The validator, scorer, ranker and explainer exist,
   so any solver's output can be checked, but no production plan is currently produced by one.
2. Optimization does not yet run as a cancellable asynchronous job.
3. External calendar, HR and room-system adapters are specified, not implemented.
4. Publication approval is Phase 17's workflow; this phase supplies validation and the version.
5. Daylight-saving transitions are represented as explicit timezone fields, not computed by a
   conversion engine.
6. Learned solver selection and adaptive constraint weighting are not implemented, and any such
   learning must remain subordinate to deterministic feasibility validation.

These are the same six gaps the phase surface and the intelligence report declare. Nothing in this
record claims a capability that has no artefact behind it.

## 7. Files changed

New: `frontend/src/lib/scheduling-conflicts.ts`, `frontend/src/lib/scheduling-quality.ts`,
`frontend/src/lib/scheduling-intelligence-report.ts`, `tests/unit/scheduling-governance.test.ts`,
`tests/unit/scheduling-intelligence-report.test.ts`,
`frontend/src/routes/_authenticated/super-admin/scheduling-intelligence.tsx`,
`architecture/phase-acceptance/phase-12-scheduling-intelligence.json`,
`architecture/archaeology/phase-12-scheduling-intelligence.audit.md`.

Modified: `architecture/phase-12-scheduling-intelligence.md` (ER, ES, ET, EU added),
`architecture/registry.json` (row 12), `frontend/src/lib/kernel/phase-contracts/phase-12-scheduling-intelligence.ts`,
`tests/unit/platform-neutrality.test.ts` (three modules and one surface added to the guards),
`architecture/phase-completion-status.md` and the proof files (regenerated), `PROGRESS.md`.
