# System Overview

> Status: Canonical. A verified description of the Sherivs Scholar system
> as it exists today.

## What it is

Sherivs Scholar is a multi-tenant school management platform. Today it is a
single full-stack web application (TanStack Start + React 19) backed by
Supabase (Postgres), serving eight role-based portals: Super Admin, HQ,
Admin/Principal, Bursar, Teacher, Parent, Student, and Driver.

## Runtime topology

```
Browser
  |
  | HTTPS
  v
TanStack Start SSR app (Vite/Nitro build, frontend/src)
  |-- file-based routes (pages + API routes)
  |-- server functions (BFF)
  |-- Supabase clients (RLS-scoped + server-only admin)
  v
Supabase (hosted)
  |-- Postgres schema + RLS (database/supabase/migrations)
  |-- Auth, Realtime, Storage
External services: Paystack, AI gateway, Web Push, Twilio
```

## Key characteristics

- **Tenant isolation:** every tenant table is `school_id`-scoped and
  protected by Postgres Row-Level Security.
- **No fake data:** components render database results or explicit empty
  states (constitutional rule).
- **BFF pattern:** API routes and server functions are co-located in the
  web app (`frontend/src/routes/api/**`, `frontend/src/lib/*.functions.ts`).
- **AI as features today:** assistants and generators route through the
  Sherivs AI Gateway; platform agents are a future phase.
- **Governed evolution:** 32 architecture phases in `architecture/`;
  control plane in the seven root documents.

## What does not exist yet

- No deployment/CI configuration (`infrastructure/` is a placeholder).
- No mobile app, marketplace, developer platform, or education cloud.
- No standalone backend services (planned; see `backend/`).

## Source of truth

- Control plane: `CONSTITUTION.md`, `PRINCIPLES.md`, `BOUNDARIES.md`,
  `REGISTRY.md`, `DEPENDENCY.md`, `DECISIONS.md`, `PROGRESS.md`.
- Architecture roadmap: `architecture/`.
- Verified stack: `docs/stack.md`.

