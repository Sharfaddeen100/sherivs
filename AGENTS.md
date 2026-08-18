# AGENTS.md - Agent Operating Instructions

This file explains how AI coding agents operate in this repository. It
summarizes the control plane; it does not replace it.

## Repository mission

CoreGrid Scholar: the first production runtime of the CoreGrid platform
ecosystem - a multi-tenant education operating system migrated from the
School OS codebase through controlled, non-destructive evolution.

## Authority hierarchy

Read, in order, before doing any work:

1. `CONSTITUTION.md` - non-negotiable rules
2. `PRINCIPLES.md` - engineering philosophy
3. `BOUNDARIES.md` - layer and domain ownership
4. `REGISTRY.md` - what exists and where
5. `DEPENDENCY.md` - dependency map and constraints
6. `DECISIONS.md` - decision index (`decisions/` holds the ADRs)
7. `PROGRESS.md` - current state, blockers, next milestones
8. `.codex/instructions.md` - Codex-specific engineering loop

`architecture/` defines the 32-phase roadmap. `docs/` holds supporting
documentation. Historical documents never silently override the control
plane.

## Safe operating procedure

1. Orient: read the control plane and the relevant architecture phase.
2. Verify: check the actual code, schema, and git state - do not trust
   descriptions over evidence.
3. Preserve: never delete working code, tests, migrations, or documentation
   without a verified reason and explicit authorization.
4. Scope: confirm the task belongs to an approved phase or is a documented
   repair.
5. Implement the smallest change that satisfies the scope.
6. Test: unit tests, e2e where relevant, production build.
7. Document: update decisions, progress, and affected docs.
8. Ship: work through the branch/PR workflow
   (`.codex/pull-request-policy.md`).

## Repository commands

```powershell
Get-Location
git status --short --branch
git log -5 --oneline --decorate
```

## Verification commands

```powershell
npm.cmd run build              # production build (client + SSR)
npx.cmd vitest run             # unit tests
npx.cmd tsc --noEmit           # typecheck (known pre-existing failures)
npm.cmd run lint               # lint (known pre-existing failures)
npm.cmd run test:e2e           # e2e (requires dev server)
scripts\verification\check.ps1 # build + unit tests + typecheck bundle
```

## Testing requirements

- Unit tests: `tests/unit/`, Vitest.
- E2E tests: `tests/e2e/`, Playwright.
- Database isolation: `database/queries/rls-isolation-check.sql` must pass
  before and after schema changes.
- A change is not complete until the production build passes.

## Database rules

- Applied migrations are immutable; every schema change is a new migration.
- Multi-tenancy is enforced by RLS on `school_id`; never weaken a policy.
- Service-role access is server-only and must be justified.

## RLS rules

- RLS is the tenant isolation boundary, not application checks.
- Never bypass RLS to simplify a query.

## Security rules

- Never commit secrets, tokens, or private keys.
- `.env` is local-only; use `.env.example` for names.
- Server secrets (service-role, Paystack, VAPID private, AI keys) never
  reach client bundles.
- Log sensitive actions via `audit_logs`; never log raw credentials.

## Documentation rules

- Update the control plane, decisions, and progress whenever state changes.
- Markdown documents commands; executable automation lives in `scripts/`.
- Documentation describes reality; planned features are labeled Planned.

## Migration rules

- Replace ambiguity, not the codebase.
- Preserve evidence; classify rather than delete
  (Canonical/Current/Historical/Superseded).
- Moving a file requires searching references, updating them, and
  re-verifying.

## Agent boundaries

- Agents may read and analyze anything in the repository.
- Agents may edit files within the workspace.
- Agents may not perform destructive operations without explicit
  authorization.

## Destructive-operation restrictions

Without explicit human authorization, agents must not run:

```text
git reset --hard
git clean -fd
git checkout .
git restore .
rm -rf / Remove-Item -Recurse on broad paths
mass deletion of docs or migrations
database resets / RLS changes / auth changes / payment changes
deployment changes
```

When in doubt, stop and ask.
