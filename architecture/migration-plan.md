# COREGRID — MIGRATION PLAN

Status: PLAN ARTIFACT (living document)
Authority: REGISTRY.md §92–93; DEPENDENCY.md §44; PROGRESS.md
Version: 2026-09-02
Purpose: The transformation path from the current repository state to one CoreGrid — preserving valid infrastructure (P01–32 upgrade law, §15/§76), integrating the ASI-era phases (33–51), and keeping Scholar as the first domain runtime (§48/§111).

---

## 1. Migration posture

SURGICAL TRANSFORMATION (§77): CoreGrid is an evolution, not a restart. Before replacing anything, classify KEEP / IMPROVE / REFACTOR / MERGE / DEPRECATE / REMOVE. Never delete because something appears old; never preserve because something exists — architecture decides.

Migration safety chain (§93 REGISTRY): Inspect → Map → Classify → Preserve → Integrate → Refactor → Validate → Migrate. Destructive rewrites require explicit approval (§109).

## 2. Baseline state (evidence 2026-09-02)

- 51/51 phase docs; REGISTRY/DEPENDENCY/BOUNDARIES/architecture-map/PROGRESS/catalog synchronized at 51.
- Domain layers: P02–P06 IMPLEMENTED (audit pending); P07–P32 IMPLEMENTING (unit-tested, mostly unwired); P33–P51 ARCHITECTURE_DEFINED.
- Tests 1,844/87 passing; typecheck 0 errors; Command Centre `/` surface live.
- Machine-readable registry and plan artifacts introduced 2026-09-02 (this set + `registry.json`).

## 3. Migration workstreams

### W1 — Ledger and registry (DONE, 2026-09-02)
Platform-wide PROGRESS.md (ledger), ownership graph, duplication map, dependency graph, completeness matrix, execution plan, machine-readable registry + validators.

### W2 — Kernel enforcement layer (S1)
Migrate ad-hoc per-function auth checks onto one fail-closed P08 enforcement gateway; re-verify RLS/tenant isolation against `database/queries/rls-isolation-check.sql`; record honestly as NOT VALIDATED if no live DB is reachable. Level-audit P02–P06 (downgrade where evidence is missing).

### W3 — Scholar runtime vertical (S6)
Wire P11–P18/P25 domain layers to live surfaces behind enforcement; preserve and consume (never duplicate) legacy integration assets (`.functions.ts`, Paystack, push, digital-twin functions). Legacy schema/RLS: INSPECT → CLASSIFY → REUSE; extend via new migrations only where canonical state is genuinely missing.

### W4 — ASI-era capability integration (S8–S11)
P33 URIK first: L2/L3 contracts behind ADRs PLATFORM-003…007 (§8 open rows). Each later phase consumes canonical owners P07/P26/P36/P37/P16/P13; no second engines. Backward refinements against P04/P07/P32 as required (§97).

### W5 — Ecosystem and interface (S7, S12)
Marketplace/developer/integration live contracts; human interface with consent/transparency/override; platform-wide audits (duplication, ownership, tenant isolation, security, E2E system test, §110 validation).

## 4. Registry/document synchronization contract

Any material change updates, in order: DECISIONS (ADR if ownership/blast-radius ≥ DOMAIN) → REGISTRY.md → DEPENDENCY.md → BOUNDARIES.md → architecture/phase docs → PROGRESS.md → frontend phase catalog → machine-readable `registry.json`. Statuses and names never conflict between these files (REGISTRY §91).

## 5. Rollback and checkpoints (§108, §70)

Checkpoint before large migrations (git tag/commit), record migration state, verify repository state, and after each milestone: checkpoint, test, verify. Every material release records version, change summary, migration impact, risk, tests, rollback, owner, timestamp (§69). Never continue through a clearly broken architectural state.

## 6. Stop conditions re-affirmed

Execution halts only for the §105/appended-law conditions. Human approval is required only for destructive DB operations, security-sensitive irreversible actions, production deployment, legal/compliance, and architectural contradictions.
