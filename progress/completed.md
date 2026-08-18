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
- `migration-report.md`, `architecture-map.md`, `remaining-work.md` written
