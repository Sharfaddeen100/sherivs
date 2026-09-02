# CoreGrid Scholar System Audit

**Audit date:** 2026-08-19  
**Scope:** repository foundation review before Phase 01 implementation work

## Executive summary

CoreGrid Scholar is an existing, substantial multi-tenant school-management
application, not a greenfield project. It is implemented as a TanStack Start
web application in `frontend/`, with Supabase migrations and Row Level
Security (RLS) in `database/supabase/`. The repository already contains the
governance control plane and a complete set of Phase 01--32 architecture
documents.

The source inventory contains 429 non-generated files: 302 frontend files,
33 database files, 33 phase architecture documents, 17 supporting documents,
10 tests, and supporting configuration and scripts. Generated dependency and
build directories are deliberately excluded from architectural review.

The next work must be an incremental hardening of the engineering foundation.
It must preserve the working application, immutable migration history, and
existing authorization boundaries. It must not start with a framework rewrite,
database recreation, or replacement of Supabase/Auth.

## Governance and current phase

The canonical governance files are present using uppercase names:

- `CONSTITUTION.md`, `PRINCIPLES.md`, `BOUNDARIES.md`, `DEPENDENCY.md`,
  `DECISIONS.md`, `REGISTRY.md`, `PROGRESS.md`, `architecture-map.md`, and
  `AGENTS.md`.
- The requested lower-case names are not separate files on this Windows
  checkout; their uppercase equivalents are the governing sources.
- `architecture/phase-01-foundation.md` defines Phase 01. `PROGRESS.md`
  records architecture milestone M0 as complete while implementation milestone
  M1 (repository and engineering foundation) remains not started. Therefore
  the architecture is documented, but its engineering acceptance criteria
  should not be considered complete merely because the documents exist.

## Current implementation

| Area | Verified state |
| --- | --- |
| Application | TypeScript/React 19 TanStack Start app rooted at `frontend/src` |
| Routing and API boundary | File-based pages plus API routes and server functions in the same BFF |
| Data | Supabase/Postgres configuration and 30 migration files |
| Security primitives | Supabase Auth middleware, server-only Supabase client, tenant helpers, audit helper, Zod validation, and a server-only AI gateway |
| Tenant model | Existing documentation identifies `school_id`-scoped tenant data and RLS as the isolation boundary |
| Product surface | Role-specific portals for Super Admin, HQ, admin, bursar, teacher, parent, student, and driver |
| Integrations | Paystack, AI gateway, Web Push, Twilio, Supabase Realtime/Storage |
| Tests | Three unit test files and five Playwright E2E specifications; a PowerShell verification bundle exists |
| Infrastructure | `infrastructure/` is a placeholder; no CI/CD or deployment configuration was found |

## Reusable assets

- Existing security and data-boundary modules: `auth-helpers.ts`, `tenant.ts`,
  `audit.ts`, `validation.ts`, `ai-gateway.server.ts`, and Supabase auth
  middleware.
- Existing verification assets: `vitest.config.ts`, `playwright.config.ts`,
  `tests/`, `scripts/verification/check.ps1`, and `scripts/smoke.sh`.
- Existing operational documentation: architecture, security, database,
  multi-tenancy, observability, and testing documents under `docs/architecture/`.
- Existing migration and RLS review material:
  `database/queries/rls-isolation-check.sql` and
  `docs/security/supabase-hardening.md`.

## Foundation gaps and risks

1. The Phase 01 acceptance criteria are much broader than the presently
   verified automation. In particular, repeatable CI, deployment, environment
   separation enforcement, and fully automated authorization/RLS regression
   evidence need to be established before Phase 01 can be accepted.
2. `package.json` does not expose a `test` or `typecheck` script even though
   the repository provides equivalent commands through a PowerShell helper.
   This makes portable CI invocation less explicit.
3. The PowerShell verification helper is blocked under the current execution
   policy. Its commands can be run directly; this is a local-operability risk,
   not evidence that the source is broken.
4. The direct `tsc --noEmit` verification attempt initially exceeded the
   available one-minute command limit. It exposed seven TS2322 errors in admin
   route-header actions; the call sites have been corrected and TypeScript
   incremental metadata is now configured. A complete post-fix run remains
   required before typecheck can be reported as passing.
5. The repository has no detected CI/CD or infrastructure-as-code definition.
   This leaves build, test, migration, backup, rollback, and deployment
   evidence dependent on manual operation.
6. Four pre-existing uncommitted changes were present in `README.md` and three
   later-phase architecture files. They were intentionally not altered by this
   audit.

## Phase 01 implementation path

Phase 01 should proceed in small, independently verifiable increments:

1. Establish portable, package-manager scripts for typecheck, unit tests,
   lint, build, and the database/RLS check without changing application
   behavior.
2. Define environment validation and documented local/test/staging/production
   configuration boundaries, without exposing secret values.
3. Add CI that runs the established verification suite and preserves the
   existing server-only import protection.
4. Expand automated negative authorization and cross-tenant RLS regression
   coverage using the existing migrations and RLS query as the source of truth.
5. Document operational ownership, failure handling, migration execution,
   rollback, backups, and recovery evidence.

Each increment must update the registry, progress ledger, architecture map,
and relevant tests only after the corresponding implementation is validated.

## Migration strategy

- Preserve every applied migration; introduce database changes only through new
  forward-compatible migrations and validate RLS before and after application.
- Reuse the existing TanStack Start BFF, Supabase integration, AI gateway, and
  audit primitives rather than creating parallel infrastructure.
- Treat frontend role guards as usability projections only; retain server-side
  authorization and RLS as enforcement boundaries.
- Do not advance to Phase 02 identity work until the chosen Phase 01 increment
  has documented acceptance evidence.

## Audit conclusion

The appropriate next change is an engineering-foundation increment, not a
product-feature build. The first concrete increment should make verification
portable and observable, then add CI and authorization/RLS regression evidence.
