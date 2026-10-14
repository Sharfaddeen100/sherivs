# SHERIVS staging-only migration runner

ACTIVE-V1. Staging project `dvxszhracsjwdancijdc` only.

This runner is the fail-closed replacement for `scripts/db-apply.mjs` for the
approved 71-file Scholar baseline. It does **not** change `db-apply.mjs`.

**This directory does not authorize a live apply.** Written human
authorization is still required. Canonical restore reintroduces OPEN
SHERIVS-001 / 002 / 003. Proposed `*.sql.proposed` files are never included.
The CLI still does not construct a live `pg` client.

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
- `COREGRID_DB_CA_CERT` or `STAGING_DB_CA_CERT` (PEM or path to an X.509 CA)

Refused if set: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, `COREGRID_DB_INSECURE_TLS=1`,
`PGSSLMODE`, `PGSSLROOTCERT`, `PGSSLCERT`, `PGSSLKEY`, `PGSSLNEGOTIATION`.

Hostname allowlist: `db.dvxszhracsjwdancijdc.supabase.co` or
`*.pooler.supabase.com` with user `postgres.dvxszhracsjwdancijdc`. Port must
be 5432.

## TLS (R-TLS-1)

`pg@8.23.1` overwrites an explicit `ssl` object when `connectionString` is
also passed (`sslmode=no-verify` → `rejectUnauthorized: false`). This runner
never passes `connectionString` into `pg.Client`. It parses URL components
itself, allowlists query keys (`sslmode=verify-full` only), pins
`rejectUnauthorized: true` plus the parsed CA, and refuses `sslmode=disable`,
`sslmode=no-verify`, conflicting query parameters, and non-CA PEM.

## Isolation, lock, and ledger

One new connection per migration file. Migration `#23`
(`SET statement_timeout = '0'`) cannot leak into later files.

Concurrency: a PostgreSQL **session advisory lock** on a dedicated lock
session spans the whole restore attempt. It is not taken on apply
connections. A process-local mutex is refused. Lock failure or lock-session
loss blocks continuation and does not auto-retry.

Ledger: `supabase_migrations.sherivs_staging_ledger` plus
`supabase_migrations.schema_migrations(version)` on success so a later
correctly linked CLI does not replay non-idempotent files. Unique indexes
on `(attempt_id, filename)` and on `filename` where status is `started` or
`succeeded`. STARTED is committed first; SQL + version + SUCCEEDED share one
transaction. Crashes leave STARTED → continuation refused.

The private ledger is **not** sole completion authority. Execute reconciles:

1. pinned manifest checksums
2. vendor `schema_migrations` (absent or available)
3. observed catalog tables/policies

Ledger-complete with missing schema objects is refused. Vendor/ledger
disagreement is refused. Partial or unknown schema is refused. Unexpected
public tables are reported and block. Schema existence is **not** security
proof.

Partial failure default recovery: recreate staging. No automatic retry.

## Catalog

Preflight records `catalog: NOT_CHECKED`. GATE4 emptiness is historical and
is not treated as proof. A future read-only staging catalog is still
required before any live execute.
