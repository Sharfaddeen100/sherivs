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

The CLI still **does not construct a live `pg` client**. `createLiveConnector`
is disabled in this mission even if `allowNetwork` is true; it does not
construct `pg.Client` or call `connect()`. A later authorized live-connector
mission is required. Credentials alone never start apply.

`--mode=execute` still returns `LIVE_EXECUTE_NOT_ENABLED`. An object with
`kind: "advisory"` is not treated as a PostgreSQL advisory lock. Live lock
sessions are not implemented (`LIVE_LOCK_SESSION_NOT_AUTHORIZED`).

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
connections. A process-local mutex is refused. Only lock controllers minted
by the official factory are trusted; `kind: "advisory"` on an arbitrary
object is not proof that a lock is held. Writable `liveCapable` /
`authenticity` fields are not proof — live capability is a module-scoped
WeakSet that no public factory in this mission can populate. Official
offline controllers are `fake-offline` and cannot satisfy live execution.
Copies and property assignment cannot mint the capability. Lock failure or
lock-session loss blocks continuation and does not auto-retry.

Each apply connection is closed after success and after failure. Cleanup
errors are attached to the original failure and do not replace it. Close
failure after COMMIT is treated as an uncertain transaction outcome with no
automatic retry.

Ledger: `supabase_migrations.sherivs_staging_ledger` plus
`supabase_migrations.schema_migrations(version)` on success so a later
correctly linked CLI does not replay non-idempotent files. Unique indexes
on `(attempt_id, filename)` and on `filename` where status is `started` or
`succeeded`. STARTED is committed first; SQL + version + SUCCEEDED share one
transaction. Crashes leave STARTED → continuation refused.

The private ledger is **not** sole completion authority. Execute reconciles:

1. pinned manifest checksums
2. vendor `schema_migrations` (absent or available)
3. observed catalog against a static expected-object contract (tables,
   columns, constraints, indexes, functions, triggers, RLS, policies
   including command/roles/USING/WITH CHECK, table and column grants,
   storage metadata where parseable)

Missing policies, incorrect policy command / role / permissive mode,
omitted observation fields (column type, function returns, USING/WITH CHECK
keys, RLS bits), column/constraint/grant mismatches (constraint identity,
not kind-only), implicit-PK foreign keys that cannot resolve the referenced
PRIMARY KEY, same-name different-signature functions, missing or unexpected
function grants, missing required functions or triggers, unexpected public
columns / constraints / indexes / triggers / storage buckets, unexpected
WITH GRANT OPTION, unexpected objects, and required objects that cannot be
derived statically (NOT VERIFIED) all block `already_complete`. The only
documented extra-object allowlist is a constraint-implied unique btree
index whose uniqueness, simple ordered keys, non-partial predicate, and
empty INCLUDE are proven. Omitted index fields and omitted catalog
object-class keys are incomplete or unverified, not empty defaults.
A contract match is **not** live schema equivalence and **not**
application-security proof. Implicit `REFERENCES table` is resolved against
the referenced relation's PRIMARY KEY or fails closed. SQL NULL USING/WITH
CHECK is legally absent; an omitted observation key is not. Grant compare
is explicit SQL tuples, not inherited or default privilege equivalence.

Partial failure default recovery: recreate staging. No automatic retry.

## Catalog

Preflight records `catalog: NOT_CHECKED`. GATE4 emptiness is historical and
is not treated as proof. A future read-only staging catalog is still
required before any live execute. This runner does not query a database.
