# CONSTITUTION

> Status: Canonical (Draft) - Authority: highest engineering authority in
> this repository. This document describes the rules the repository actually
> operates under today. Where this document conflicts with any other file,
> this document wins until a ratified amendment supersedes it.

## Mission

CoreGrid Scholar is the first production runtime of the CoreGrid platform
ecosystem: a multi-tenant education operating system for schools, districts,
and government education clouds, migrated from the existing School OS
application.

## Scope

This constitution governs all work in this repository: source code, database
schema and migrations, configuration, documentation, agent tooling, and
automation. It binds human engineers and AI agents equally.

## CoreGrid-Scholar direction

The repository evolves toward the CoreGrid-Scholar target architecture
through the 32 phases documented in `architecture/`. Evolution is
progressive and governed; it is never a greenfield rewrite of working code.

## Non-destructive migration

- Preserve working source code, tests, migrations, configuration,
  documentation, progress records, decisions, and agent configuration.
- Replace ambiguity, not the codebase.
- Before changing anything that conflicts with another document, investigate
  which document is authoritative, which is newer, and what the code
  actually does.

## Architecture principles

Engineering decisions follow `PRINCIPLES.md`. At minimum:

- Preserve before replacing; evidence before assumption.
- Simple before distributed; modular before microservice.
- Explicit boundaries; strong typing; security by default.

## Modularity

The application is a modular monolith today (TanStack Start full-stack app).
Domain boundaries are expressed in `BOUNDARIES.md` and are the precondition
for any future service extraction. Do not introduce microservices without a
concrete operational reason (independent scaling, deployment, security
isolation, runtime incompatibility, or organizational ownership).

## Domain ownership

Each domain (auth, academics, students, staff, fees, communication,
operations, AI, etc.) has a clear owner inside the application layer.
Cross-domain calls go through explicit server-function boundaries, not
direct component-to-component reach-through.

## API boundaries

Public HTTP surface is `frontend/src/routes/api/**`. Internal API surface is
TanStack Start server functions (`frontend/src/lib/*.functions.ts`). Both
validate input with Zod. Do not add client-visible API surface without
validation and documentation.

## Data ownership

The database is the source of truth for school data. Application code must
never fabricate data. UI renders database results or explicit empty states;
no mock data, hardcoded names, or fallback demo content.

## Multi-tenancy

Tenant isolation is enforced by Postgres Row-Level Security on
`school_id`-scoped tables, never only by application checks. Application
checks (role guards, tenant resolver) are defense in depth.

## Security

- Secrets never enter source control. `.env` is local-only; `.env.example`
  documents names only.
- Service-role credentials are server-only.
- Applied migrations are immutable; schema changes are forward migrations.
- Security policies: `constitution/security-policy.md`,
  `decisions/security-decisions.md`.

## Authentication

Authentication is Supabase Auth (email/password, JWT claims, rate-limited
password reset). Server-side token validation is mandatory for
authenticated server functions and API routes.

## Authorization

Authorization is role-based at the application layer (roles mapped to portal
redirects and guards) and enforced at the database layer by RLS. RBAC/ABAC/
ReBAC/PBAC evolution is planned under the Security Engine phase; do not
weaken existing checks in the meantime.

## RLS

RLS is the tenant isolation boundary. Never weaken an RLS policy to make
application code easier. The RLS isolation check
(`database/queries/rls-isolation-check.sql`) must pass before and after
schema changes.

## AI governance

AI features exist today as feature-level assistants routed through the
CoreGrid AI Gateway (`frontend/src/lib/ai-gateway.server.ts`). Rules:

- AI never receives unrestricted database access; data access is scoped per
  feature through server functions.
- AI outputs are validated and attributed to the requesting tenant.
- High-impact AI actions require human confirmation.
- See `constitution/ai-agent-policy.md` and `docs/architecture/ai-platform.md`.

## Agent governance

Agent tooling (`.codex/`, `.claude/`, `.claude-flow/`, `.swarm/`) is part of
the repository. All agents read this constitution, `PRINCIPLES.md`,
`REGISTRY.md`, `DEPENDENCY.md`, `BOUNDARIES.md`, `DECISIONS.md`, and
`PROGRESS.md` before working. Agents may not perform destructive operations
without explicit authorization (see `AGENTS.md`).

## Human oversight

Changes to authentication, payments, RLS, database schema, secrets,
deployment, or production AI behavior require human review and approval
before landing.

## Privacy

Student, staff, and parent data is sensitive. Access follows least
privilege. Audit events exist (`audit_logs`) for sensitive actions. See
`constitution/data-governance-policy.md`.

## Auditability

Sensitive operations are logged. Decision records are never rewritten to
look like they were made later; superseded decisions are marked, not
deleted.

## Observability

Errors are captured at the SSR boundary (`frontend/src/lib/error-capture.ts`,
`error-page.ts`) and reported through the platform error reporter. Systems
must be diagnosable from logs and audit records.

## Testing

Definition of done includes tests. Unit tests run with Vitest, e2e with
Playwright, and the production build must pass. See
`.codex/testing-policy.md`.

## Type safety

TypeScript strict mode is enabled. Generated Supabase types are the contract
for database rows. Do not introduce `any` where a typed alternative exists.

## Dependency discipline

Dependencies are declared in `package.json`; lockfiles are committed
(`package-lock.json`). No dependency is removed or added without a recorded
reason. See `DEPENDENCY.md`.

## Database migration discipline

Every schema change is a new migration under `database/supabase/migrations/`.
Historical migrations are never edited or deleted.

## Backward compatibility

Public behavior must not regress. Where an identifier or API cannot be
renamed safely (e.g., `vibeora_*` feature flags), it is preserved and
renamed only via forward migration.

## Secrets management

Secrets live in local `.env` (ignored) or secure runtime stores. Never log
raw credentials. Rotate any credential that has touched git history.

## Deployment discipline

No deployment configuration exists yet; deployment work belongs to phase 01
(Foundation) and phase 31 (Enterprise Scale). Do not add production
deployment config outside an approved phase.

## Performance and reliability

Queries must be tenant-scoped and indexed. Real-time subscriptions are
scoped per user/school. No speculative optimization without measurement.

## Accessibility

UI components must remain keyboard-accessible and semantic; Radix primitives
provide the baseline.

## Vendor abstraction

Integrations (Supabase, Paystack, AI providers) are reached through
integration modules so a vendor swap is a bounded change. Abstractions are
added where they reduce risk, not for decoration.

## Research and experimentation

Experiments belong behind feature flags and outside production data paths.
Nothing experimental may weaken RLS or expose data across tenants.

## Production change control

All changes flow through the branch/PR workflow described in
`.codex/pull-request-policy.md`, with verification before merge.

## Definition of done

A change is done when:

1. It maps to an architecture phase (or a documented repair).
2. Tests cover the behavior (or a reason is recorded).
3. The production build passes.
4. Documentation, decisions, and progress are updated.
5. No RLS, auth, payment, or secrets regression was introduced.

## Prohibited practices

- Deleting or editing applied database migrations.
- Weakening RLS or auth checks.
- Committing secrets, tokens, or private keys.
- Shipping untyped database access with `any` where types exist.
- Building features outside an approved architecture phase.
- Rewriting working features without a demonstrated benefit.
- Using destructive git/filesystem commands on user work without
  authorization (`git reset --hard`, `git clean -fd`, `rm -rf`, etc.).

## Amendment

Amendments to this constitution are recorded as decisions in `DECISIONS.md`
with status "Proposed" then "Ratified". Historical text is preserved.

