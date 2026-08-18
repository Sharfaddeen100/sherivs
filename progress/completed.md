# Completed

- Repository audit (`docs/migration-audit.md`)
- Migration branch `coregrid-scholar-migration` created with backup commit
- Platform root structure created
- `src/` -> `frontend/src/`, `public/` -> `frontend/public/`
- `supabase/` -> `database/supabase/`, RLS check -> `database/queries/`
- Unit tests relocated to `tests/unit/`
- Product spec archived to `docs/product-spec.md`
- Identity renamed to CoreGrid Scholar (UI, metadata, README, docs)
- Architecture (32 phase skeletons), constitution, decisions, progress,
  `.codex/` scaffolding created
- Production build repaired and verified
- `.env` untracked; `.env.example` added
- Lovable platform toolchain removed (`.lovable/`, dev dependency, error
  reporter, Bun lockfile)
- Control plane established: `CONSTITUTION.md`, `PRINCIPLES.md`,
  `REGISTRY.md`, `DEPENDENCY.md`, `BOUNDARIES.md`, `DECISIONS.md`,
  `PROGRESS.md` + repaired `AGENTS.md`
- Verified stack (`docs/stack.md`) and architecture documentation
  (`docs/architecture/*`) created
- Verification bundle added (`scripts/verification/check.ps1`)
- `migration-report.md`, `architecture-map.md`, `remaining-work.md` written
