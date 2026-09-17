# Database

All database concerns for the CoreGrid platform.

```
database/
  supabase/        the Supabase project (config + migrations)
  queries/         manual SQL checks (RLS isolation, audits)
```

## Supabase CLI

The Supabase project lives at `database/supabase/`. Run CLI commands with
`--workdir`:

```sh
supabase start --workdir database/supabase
supabase db push --workdir database/supabase
supabase link --workdir database/supabase
```

## Rules

- Applied migrations are immutable - never edit them.
- Row-Level Security is the tenant isolation boundary.
- The RLS isolation check (`database/queries/rls-isolation-check.sql`) must
  pass before and after any schema change.
- Never expose secrets through RLS-readable columns; column-level privileges
  are enforced for legacy secret columns (see
  `docs/security/supabase-hardening.md`).

## Security hardening

The Supabase integration was professionally reviewed on 2026-08-19. Findings
and fixes (Paystack secret exposure, realtime publication completeness,
server-only import protection, env hygiene) are documented in
`docs/security/supabase-hardening.md`.
