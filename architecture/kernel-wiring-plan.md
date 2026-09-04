# COREGRID — KERNEL WIRING PLAN (S2, DB-BACKED)

Status: PLAN ARTIFACT (living document) — NOT EXECUTED.
Authority: CONSTITUTION.md > REGISTRY.md > DEPENDENCY.md > BOUNDARIES.md > DECISIONS.md > PROGRESS.md
Version: 2026-09-03
Purpose: The exact, safety-governed sequence for wiring the authored universal
kernel substrate and runtime contracts to a live database. Execution is
checkpointed (§105) until a database-backed runtime is available; this plan
makes that execution deterministic and low-risk.

---

## 1. Preconditions (mandatory)

1. A reachable Supabase/Postgres environment whose migrations are under
   `database/supabase/migrations/`.
2. Apply the kernel substrate migration:
   `supabase db push --workdir database/supabase`
   (creates `cg_entity`, `cg_relationship`, `cg_event`, `cg_observation`,
   `cg_domain_runtime` — deny-by-default, service-role only).
3. Run the extended RLS isolation check:
   `psql "$DATABASE_URL" -f database/queries/rls-isolation-check.sql`
   — must pass, including the deny-by-default `cg_%` assertions.
4. Confirm `ALLOW_DEMO_PROVISIONING` remains off in every environment.

## 2. Server functions to implement (Phase 08-gated, service-role writes)

All follow the existing `.functions.ts` pattern: `.middleware([requireSupabaseAuth])`,
`.validator(schema)`, handler authorizes via the canonical role gate
(`frontend/src/lib/security-role-gate.ts`), then writes via the dynamic
`client.server` service-role import.

Available pure cores (already authored, tested, typechecked — import these,
do not re-implement): `kernel/reality.ts` (entity/relationship/event/
observation drafts), `kernel/domain-manifest.ts` (`validateManifest`),
`kernel/outbox.ts` (event delivery state machine), `kernel/runtime-registry.ts`
(registry row builder + status lifecycle), and the Scholar instances
`runtime/scholar.ts`, `runtime/scholar-events.ts`, `runtime/scholar-reality.ts`.

1. **`register-runtime.functions.ts`** — platform super-admin only.
   - Validates a `RuntimeManifest` with `kernel/domain-manifest.ts
     validateManifest`.
   - Builds the row with `kernel/runtime-registry.ts
     registryRowFromManifest` (status lifecycle via
     `applyRuntimeStatusTransition`).
   - Idempotent upsert into `cg_domain_runtime` (key = manifest id).
   - First instance: `SCHOLAR_RUNTIME_MANIFEST` (`runtime/scholar.ts`).
2. **`kernel-reality.functions.ts`** — tenant-scoped writes for an actor's own
   tenant (school-admin gate) or platform-scoped writes (super-admin gate):
   - `writeEntity` / `writeRelationship` / `writeObservation` — build rows via
     `kernel/reality.ts` drafts; `tenant_id` = actor scope; provenance fields
     populated (source_type, source_ref, actor_identity, recorded_at).
   - `recordEvent` — build via `eventDraft` (or `runtime/scholar-events.ts`
     for Scholar vocabulary); insert into `cg_event` with `state='pending'`
     and the caller's `idempotency_key` (outbox intent). Delivery transitions (publish/acknowledge/fail/requeue/retire) are governed by `kernel/outbox.ts`.
3. **Audit** — every write appends to the legacy audit surface
   (`super_admin_logs` / `audit_logs` by role path) with correlation_id;
   kernel tables themselves carry `recorded_at` + actor provenance.

## 3. Security posture

- RLS: deny-by-default on all `cg_*` tables (zero policies, anon/authenticated
  revoked). Only the service role (server functions) writes.
- Authorization: `requireSupabaseAuth` → canonical role gate; never trust
  client-supplied tenant ids or roles (§26/§38).
- Tenant boundary: tenant-scoped writes are allowed only inside the actor's
  resolved scope (`get_my_school_id`); platform writes only for super admins.
- Secrets: service-role key remains server-only (never `VITE_`-prefixed).

## 4. Verification (before production enablement)

1. Unit: all kernel/runtime/role-gate suites (99 files/1,954 tests whole-tree green, typecheck 0 errors, 2026-09-03).
2. Contract: registry validator + secret scan + foundation integrity.
3. DB: RLS isolation check green; tenant A≠B isolation spec per kernel tables.
4. E2E: register Scholar runtime → record a Scholar event → read back via a
   server function as the same tenant; cross-tenant read denied.
5. Typecheck + production build green.

## 5. Rollback

- Forward migrations only; no destructive DDL.
- Feature-flag gate around the new server functions until validated.
- Rollback = flag off + no data deletion; revert rows only via governed paths.

## 6. Execution rule

This plan executes only inside an environment that satisfies §1. Until then the
authored substrate, contracts and Scholar runtime manifest remain
`NOT_VALIDATED` — recorded honestly in PROGRESS.md, never claimed as installed.
