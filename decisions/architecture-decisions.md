# Architecture Decisions

## ADR-001 - Platform root structure (2026-08-15)

**Context:** The repository must become the first production runtime of the
CoreGrid platform ecosystem while preserving the existing School OS
application.

**Decision:** Adopt the CoreGrid Scholar platform root layout with
`architecture/`, `constitution/`, `decisions/`, `progress/`, `backend/`,
`frontend/`, `mobile/`, `agents/`, `database/`, `infrastructure/`, `tests/`,
`docs/`, `scripts/`, and `.codex/` as first-class directories.

**Consequences:** Documentation and policy live at the repository root where
agents can find them; future engines slot into the phase map in
`architecture/`.

## ADR-002 - Web application source lives in frontend/ (2026-08-15)

**Context:** The application is a TanStack Start full-stack app whose routing,
SSR entry, API routes, and UI are coupled inside one `src/` tree.

**Decision:** Move `src/` to `frontend/src/` and configure the build via
`srcDirectory` and `routesDirectory`. Server-side route handlers
(`frontend/src/routes/api/**`) and services (`frontend/src/lib/*.functions.ts`)
remain co-located as a BFF layer until extraction to `backend/` is justified
and tested (see `remaining-work.md`).

**Consequences:** The web platform is physically inside `frontend/`; no
features were split or rewritten. Backend extraction is a tracked future
phase, not an implicit rewrite.

## ADR-003 - Database assets relocated under database/ (2026-08-15)

**Context:** Schema, migrations, and database queries previously lived in
`supabase/` and `scripts/`.

**Decision:** Move the Supabase project to `database/supabase/` and the RLS
isolation check to `database/queries/`. Supabase CLI commands must use
`--workdir database/supabase` (documented in `database/README.md`).

**Consequences:** All database concerns are under one directory. Applied
migrations are treated as immutable history and were not edited.

## ADR-004 - Production build repaired, not redesigned (2026-08-15)

**Context:** The production build was broken by (1) a JSON-escaped corruption
in `classes.tsx`, (2) invalid CSS `@import` ordering, and (3) the missing
Tailwind v4 Vite plugin in the local build config.

**Decision:** Repair all three defects as part of the migration so the
platform ships with a verified production build. No architectural redesign
was performed.

**Consequences:** `npm run build` and unit tests pass on the migration
branch; defects and fixes are recorded in `migration-report.md`.

## ADR-005 - Top-level control-plane documents (2026-08-18)

**Context:** The repository's governance was spread across directory-based
systems (`constitution/`, `decisions/`, `progress/`) without a small set of
top-level control documents that act as the repository's operating system.
Markdown files and directories were also at risk of being confused.

**Decision:** Establish seven top-level control documents as files -
`CONSTITUTION.md`, `PRINCIPLES.md`, `REGISTRY.md`, `DEPENDENCY.md`,
`BOUNDARIES.md`, `DECISIONS.md`, `PROGRESS.md` - and repair `AGENTS.md` to
reference them. The `.md` suffix means "Markdown document" and is never used
for directories. Detailed policy, ADRs, and progress records remain in
`constitution/`, `decisions/`, and `progress/` respectively; the root files
are the authority and index.

**Consequences:** A future engineer or agent can orient from seven files.
Historical documents are preserved and classified rather than deleted.
Commands are documented in Markdown and executed by scripts under
`scripts/`.

