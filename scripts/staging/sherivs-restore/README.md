# SHERIVS staging-only migration runner

ACTIVE-V1. Staging project `dvxszhracsjwdancijdc` only.

This runner is the fail-closed replacement for `scripts/db-apply.mjs` for the
approved 71-file Scholar baseline. It does **not** change `db-apply.mjs`.

**This directory does not authorize a live apply.** Written human
authorization is still required. Canonical restore reintroduces OPEN
SHERIVS-001 / 002 / 003. Proposed `*.sql.proposed` files are never included.

## Pinned source

| Pin | Value |
|-----|--------|
| Commit | `d195ba861f80379b79533126653b9cee82a8e872` |
| Tree | `bbd828951e166662bbe831fd74972e1a15488468` |
| Count | 71 |
| Directory | `database/supabase/migrations/` |

The default working tree may have 69 files. The runner loads bytes from the
pinned Git commit. It does not switch branches and does not use an unmatched
working tree as the apply source.

## Modes

```
node scripts/staging/sherivs-restore/cli.mjs --mode=manifest
node scripts/staging/sherivs-restore/cli.mjs --mode=offline
node scripts/staging/sherivs-restore/cli.mjs --mode=preflight
```

`--mode=execute` additionally requires:

- `--confirm-staging-ref=dvxszhracsjwdancijdc`
- `--confirm-source-commit=d195ba861f80379b79533126653b9cee82a8e872`
- `--i-authorize-staging-restore`

The CLI still **does not construct a live `pg` client**. A later authorized
process must inject a connector. Credentials alone never start apply.

## Environment

Required for offline/preflight/execute target checks:

- `STAGING_DATABASE_URL` and/or `SHERIVS_RLS_STAGING_URL`
- `COREGRID_DB_CA_CERT` or `STAGING_DB_CA_CERT` (PEM or path)

Refused if set: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, `COREGRID_DB_INSECURE_TLS=1`.

Hostname allowlist: `db.dvxszhracsjwdancijdc.supabase.co` or
`*.pooler.supabase.com` with user `postgres.dvxszhracsjwdancijdc`.

## Isolation and ledger

One new connection per migration file. Migration `#23`
(`SET statement_timeout = '0'`) cannot leak into later files.

Ledger: `supabase_migrations.sherivs_staging_ledger` plus
`supabase_migrations.schema_migrations(version)` on success so a later
correctly linked CLI does not replay non-idempotent files. STARTED is
committed first; SQL + version + SUCCEEDED share one transaction. Crashes
leave STARTED → continuation refused.

Partial failure default recovery: recreate staging. No automatic retry.

## Catalog

Preflight records `catalog: NOT_CHECKED`. GATE4 emptiness is historical and
is not treated as proof.
