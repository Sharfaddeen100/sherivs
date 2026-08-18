# PROGRESS

> Status: Canonical (index). Answers: "Where are we now?" Detailed records
> live in `progress/`; this file is the current-state index.

## Current phase

Phase 01 (Foundation) - governance and control plane. The repository is
post-migration (School OS -> CoreGrid Scholar) and is now establishing its
control-plane documentation and verified baseline.

## Completed work

- School OS -> CoreGrid Scholar migration (structure, identity, branding)
- 32-phase architecture roadmap established
- Production build repaired and passing
- Unit test baseline passing (24 tests)
- Lovable platform toolchain removed
- Control-plane documents created:
  `CONSTITUTION.md`, `PRINCIPLES.md`, `REGISTRY.md`, `DEPENDENCY.md`,
  `BOUNDARIES.md`, `DECISIONS.md`, `PROGRESS.md`
- `AGENTS.md` repaired to reference the control plane
- `docs/stack.md` + `docs/architecture/*` established from verified facts

## Current work

- (none in flight; user phase-file content is in the working tree, uncommitted)

## Known problems

- Lint is not clean: ~8,200 errors, dominated by Prettier CRLF/format
  issues plus pre-existing `any`/hook-deps warnings (PRE-EXISTING).
- Secrets historically committed (`.env`, `.mcp.json`) - rotation pending
  (blocked on external action).
- No CI/CD, no deployment configuration (planned).
- `PLATFORM_HOSTS` and `robots.txt` still reference legacy domains until DNS
  cutover.

## Blocked work

- Secrets rotation (external action required).
- Platform domain cutover (DNS).
- Supabase CLI workflows now require `--workdir database/supabase`.

## Open architectural questions

- Backend extraction criteria (see `remaining-work.md` and ADR-002).
- Authorization model evolution (RBAC/ABAC/ReBAC/PBAC) under Security
  Engine phase.
- Which phase content gets authored next (skeletons are empty).

## Next milestones

1. Ratify constitution policies (currently placeholders in `constitution/`).
2. Author phase 01 (Foundation) and phase 02 (Identity) content.
3. Introduce CI (build + unit + e2e + secret scan + RLS check).
4. Execute backend extraction planning (ADR-002 follow-up).

## Verification status

| Check | Command | Status |
| --- | --- | --- |
| Production build | `npm run build` | Passing |
| Unit tests | `npx vitest run` | Passing (24) |
| Typecheck | `npx tsc --noEmit` | Failing (PRE-EXISTING: 7 x TS2322 in admin route headers) |
| Lint | `npm run lint` | Failing (PRE-EXISTING) |
| E2E | `npm run test:e2e` | Preserved; requires dev server |
| RLS isolation | `database/queries/rls-isolation-check.sql` | Requires DB access |

## Recent changes

- `102e9aa` Remove Lovable platform branding and toolchain
- `a908697` Replace architecture phases with 32-phase roadmap
- `ebffcc7` Fix dev dependency scan (@ alias in Vite config)
- `01dca86` Transform Remix School OS into CoreGrid Scholar foundation

## Migration status

Control-plane governance: complete (this commit). Controlled implementation
of architecture phases: not started (skeletons only).

## Technical debt

- Deprecated `createServerFn().inputValidator()` usage across server
  functions.
- Typecheck debt: 7 x TS2322 - `PageHeader` `actions` array of
  `{label, onClick}` passed where `ReactNode` is expected (audit,
  examinations, extracurricular, financial-reports, inventory, payroll,
  visitors).
- `AdminDashboard` route export code-splitting warning.
- Prettier/CRLF formatting debt across the repository.
- `any` types in intelligence/support routes (lint debt).

## Known risks

- CRITICAL: un-rotated historical secrets.
- HIGH: no CI gate before changes merge.
- MEDIUM: BFF extraction coupling; legacy domain config.
- LOW: lint/format debt.
