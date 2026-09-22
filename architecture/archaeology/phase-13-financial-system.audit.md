# Phase 13 — Payment, Billing & Financial Operating System: audit record

Date: 2026-09-21 · Phase: 13 · Status: **COMPLETE**
Document: `architecture/phase-13-financial-system.md`
Contract: `frontend/src/lib/kernel/phase-contracts/phase-13-financial-system.ts`
Acceptance: `architecture/phase-acceptance/phase-13-financial-system.json`
Proof: `architecture/proofs/phase-13-acceptance.proof.json`

## 1. The defects this phase carried

Three, and only one of them was a missing feature.

**Framing.** The blueprint read as a school's billing system. Its examples were tuition, examination
fees, learners and guardians, presented as though they were the domain rather than one institution's
vocabulary. Every organization handles money — a clinic bills a procedure, a logistics operator
invoices freight, a warehouse charges handling, a ministry levies a fee, a marketplace takes
commission — and a platform that hard-codes the school version makes every other organization a fork.

**Two missing contracts.** The financial model had no statement of **provider neutrality**: providers
appeared as an implementation detail, so the document could not say what a provider must declare, how
routing is decided, or why failover is dangerous. It also had no **split payments**: one collected
amount attributed to several beneficiaries (an institution, a seller, a partner, a tax authority and
the platform itself) was nowhere in the model, which is exactly the case a platform marketplace,
a multi-party service or a commission-bearing workflow needs.

**Completeness.** Keyword scanning found the document stated 14 of the 20 mandatory engineering
sections. The command model, query model, data model, dependency model, memory model and knowledge
model were absent — the six that determine whether money can be commanded, read, stored, bounded,
remembered and learned from.

## 2. What was corrected in the document

Seven sections were authored in the document's own lettered style, completing it at 20/20:

- **EJ. Domain-Neutral Financial Operations for Every Organization** — the charter: the debtor and the
  beneficiary are identity references; charge reasons, products, discount categories, tax rules,
  billing calendars and provider choices are institutional data; a scholarship is one waiver category
  among many (the policy that decides eligibility belongs to the consuming domain and the platform
  never infers entitlement); the platform's own revenue is a split beneficiary rather than a special
  case; and surfaces are named for financial processes, never for one institution's role list.
- **EK. Payment-Provider Neutrality and Split Payments** — what an adapter must declare (methods,
  currencies, jurisdictions, capture model, refund model, split support, signature scheme,
  tokenization surface, settlement and fee reporting), routing as an explainable decision over those
  capabilities, failover permitted only where the provider proved no capture, and the split contract:
  legs summing exactly to the gross, immutability, per-leg settlement, fees attributed to their leg,
  pro-rata refunds with a deterministic remainder, idempotency per split, and an unresolved leg that
  stays visible rather than rolling its share into another beneficiary.
- **EL. Command Model** — eighteen commands with the conditions each refuses, uniform command rules
  (authenticate, resolve tenant, authorize, validate, execute atomically, persist the event with the
  state change, audit, return only permitted data), and high-impact commands refused for automated
  execution.
- **EM. Query Model** — twelve read-only queries and five rules: canonical and derived labelled
  separately, unknown returned as unknown rather than defaulted to zero or paid, every result carrying
  its as-of and configuration versions, aggregates that never reveal an unreadable object, and exports
  that are authorized, audited and minimized.
- **EN. Data Model** — the record set, the constraints the database enforces rather than the
  application alone (tenant on every row, currency consistency, integer minor units, unique invoice
  numbers per scope and period, split legs summing exactly to their gross, bounded refunds, credits and
  allocations, append-only history, RLS), the indexes that matter, and migration and retention rules
  that keep financial records while minimizing personal data.
- **EO. Dependency Model** — what FinOS depends on, what each consumer may and may not do, and the
  boundary rules that keep the graph acyclic, including that no phase may keep a second money record.
- **EP. Financial Memory and Knowledge Model** — tenant-scoped decision, dispute, reconciliation,
  collection, billing and configuration memory on one side; cross-tenant knowledge (provider
  capability, failure taxonomies, currency metadata, observed provider behaviour) on the other, with
  three laws: learning is evidence not authority, knowledge never widens access, and retention is
  explicit.

## 3. What was built

Four engines, five suites, one report, one surface — all domain-neutral, all provider-neutral.

| Artefact | Purpose |
| --- | --- |
| `frontend/src/lib/financial-splits.ts` | Split payments: beneficiary kinds as data, legs that must sum exactly to the gross, immutability, per-leg settlement against a real settlement reference, provider fees attributed to the leg that produced them, pro-rata refunds with a deterministic remainder that can never return more from a beneficiary than it received, unresolved legs kept visible, idempotency per split, and an explanation of who is paid what with fees separated from amounts |
| `frontend/src/lib/financial-routing.ts` | Provider neutrality: capability profiles, an explainable routing decision where capability dominates preference, disqualifiers named per rejected candidate, cost and preference ranking, unroutable requirements reported, and failover refused after a success, after an unresolved timeout and without proof of no capture |
| `frontend/src/lib/financial-journal.ts` | The proof layer: append-only events with contiguous per-aggregate sequence, payload version, causation and correlation; a transactional outbox with attempt tracking; reconstruction of an obligation's money state from its events with the evidence named and a disagreeing cache reported rather than preferred; and double-entry-compatible postings refused when they do not balance, in one currency, with no negative line |
| `frontend/src/lib/financial-tax.ts` | Tax as jurisdiction data: versioned rules resolved by jurisdiction, category and instant, where an undeclared jurisdiction is unknown rather than zero, ambiguous versions are refused, exempt and zero-rated rules yield no tax, and inclusive and exclusive pricing are computed in integer minor units with one stated half-up rounding rule and named provenance |
| `tests/unit/financial-splits.test.ts` | 18 tests: balance refusals, policy on repeated beneficiaries, idempotent replay, per-leg settlement, unresolved visibility, fee attribution and refusal, pro-rata exactness and determinism, bounded refunds, platform fee as an ordinary leg |
| `tests/unit/financial-routing.test.ts` | 12 tests: capability selection, unroutable reporting, capability over preference, cost and preference ranking, every disqualifier, explanation output, and each failover refusal |
| `tests/unit/financial-journal.test.ts` | 15 tests: append-only refusals, integrity reporting, outbox durability, reconstruction with its evidence, unknown reported as unknown, snapshot disagreement, and every posting refusal |
| `tests/unit/financial-tax.test.ts` | 11 tests: version resolution, unknown jurisdiction, ambiguity, both tax modes, half-up rounding, exemption, out-of-range rates, provenance and line-explained figures |
| `frontend/src/lib/financial-intelligence-report.ts` | L4 evidence: 16 rules each tied to a module and a suite, 16 checks that EXECUTE the engines and record what they observed, 7 declared gaps with their closing conditions, and the same capability in six organizations' vocabulary |
| `tests/unit/financial-intelligence-report.test.ts` | 15 tests: every rule resolves to an existing module and suite, every check carries an observation and passes, totals derived from live arrays, declared gaps complete, and no institution's people framing the platform |
| `frontend/src/routes/_authenticated/super-admin/financial-operations.tsx` | The phase surface: every check with its observation, the split contract in plain words, six organizations' vocabulary, the rules with their modules and blueprint sections, and the declared gaps. No role list |

The decisions the engines enforce: money is exact minor units; a split's legs must account for the
gross exactly; each beneficiary settles on its own evidence; fees are attributed, never deducted;
refunds are pro-rata, bounded and deterministic; the platform's fee is a leg like any other; events are
append-only; a balance is reconstructed from its evidence rather than trusted from a cache; a posting
that does not balance is refused; and tax is resolved per jurisdiction rather than assumed.

## 4. Verification performed

| Check | Result |
| --- | --- |
| `vitest run` on the nine financial suites | 9 files · **126 tests passed** |
| `node scripts/audit-phase-acceptance.mjs --phase=13` | 24 areas · **ENFORCED 16 · DECLARED 8 · UNWIRED 0 · MISSING 0** |
| `node scripts/audit-phase-completion.mjs --phase=13` | **COMPLETE 1** · modules resolve 1/1 · tests counted **130** · drift **none** · unconfirmed claims **none** |
| Document section coverage | **20/20** — every mandatory engineering section present |
| `npx tsc --noEmit` | clean after the corrections below |
| Typecheck honesty note | This wave's first typecheck reported **four real errors in `scheduling-intelligence-report.ts` (phase 12)** — `require(...)` was typed `(condition: boolean, message: string): void`, so TypeScript could not narrow `capacity`, `calendar`, `travel` or `feasibility` after the check. The function is now `asserts condition`, which narrows and is the correct signature for a guard. **The earlier claim that phase 12's typecheck was clean was wrong**: the log it rested on was a zero-byte file produced by a killed process, and an empty log was mistaken for an empty error list. The defect is fixed here, and the phase 12 record is corrected in the ledger rather than left standing |

## 5. Ownership and boundaries honoured

FinOS owns the money model and its proof. Identity stays Phase 02's, tenancy Phase 03's, canonical
institutional reality Phase 04's, runtime primitives Phase 05's, authorization Phase 08's, trust
evidence Phase 09's, delivery Phase 10's, workflow approval Phase 17's and analytical presentation
Phase 18's. Domain pricing policy stays with the domain that owns it (a fee is created by the phase
that owns the service; FinOS records its financial effect), marketplace logic stays with Phase 27,
economic coordination stays with Phase 49, and no consumer may keep a second money record — the
dependency section says so explicitly, and the engines are built so that a duplicated ledger would be a
detected boundary violation rather than a competing source of truth. Payments still never trust
frontend state: confirmation requires independently verified provider evidence, and a timeout is
recorded as unresolved rather than failed.

## 6. Known risks and remaining work

1. **No live provider adapter.** Routing, capabilities, webhook verification and settlement modelling
   exist; no real provider is reached, so no money moves.
2. **No persistence.** The engines are pure contracts; no migration creates invoices, payments, splits,
   journal events, outbox entries or idempotency records, so nothing survives a process.
3. **No reconciliation run.** Reconciliation compares one pair of records; the scheduled comparison of a
   whole provider statement, with exceptions and a resolution workflow, does not exist.
4. **No collections or disputes.** Receivables ageing, dunning, dispute and chargeback state machines
   are absent, so collection state cannot be tracked beyond the obligation status.
5. **No metered usage or renewals.** Subscriptions and plans exist; usage metering, overage computation
   and renewal generation do not.
6. **No asynchronous financial work.** Batch billing, webhook bursts, settlement polling and
   reconciliation runs are not schedulable, restartable or cancellable jobs.
7. **No authorised ingestion boundary.** No platform surface calls these engines yet: fees, payroll,
   expenses and reconciliation surfaces still read their own tables, which is exactly the second-money-
   record risk the dependency model forbids.

These are the same seven gaps the phase surface and the intelligence report declare, and they are the
reason the phase is COMPLETE as a domain layer rather than as a live payment system.

## 7. Files changed

New: `frontend/src/lib/financial-splits.ts`, `financial-routing.ts`, `financial-journal.ts`,
`financial-tax.ts`, `financial-intelligence-report.ts`,
`frontend/src/routes/_authenticated/super-admin/financial-operations.tsx`,
`tests/unit/financial-splits.test.ts`, `financial-routing.test.ts`, `financial-journal.test.ts`,
`financial-tax.test.ts`, `financial-intelligence-report.test.ts`,
`architecture/phase-acceptance/phase-13-financial-system.json`,
`architecture/proofs/phase-13-acceptance.proof.json`,
`architecture/archaeology/phase-13-financial-system.audit.md`.

Modified: `architecture/phase-13-financial-system.md` (EJ, EK, EL, EM, EN, EO, EP added — 14/20 to
20/20), `architecture/registry.json` (row 13), the phase contract (nine suites, nine capabilities,
expanded substrates), `tests/unit/platform-neutrality.test.ts` (four modules and one surface added to
the guards), `frontend/src/lib/scheduling-intelligence-report.ts` (the phase 12 type defect described
in §4), `frontend/src/routeTree.gen.ts` (regenerated), the generated completion status table and
proof, `architecture/archaeology-inventory.md`, and `PROGRESS.md`.

