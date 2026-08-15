# Database

All database concerns for CoreGrid Scholar.

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

