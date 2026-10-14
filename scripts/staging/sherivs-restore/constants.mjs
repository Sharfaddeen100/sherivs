/**
 * SHERIVS-STAGING-MIGRATION-RUNNER-001
 *
 * Pinned restore identity. Changing these values is a change-control event,
 * not a runtime override, except tests that pass an explicit fixture manifest.
 *
 * ACTIVE-V1 ONLY. This module does not connect to a database.
 */

export const PINNED_SOURCE_COMMIT =
  "d195ba861f80379b79533126653b9cee82a8e872";
export const PINNED_SOURCE_TREE =
  "bbd828951e166662bbe831fd74972e1a15488468";
export const PINNED_MIGRATION_DIRECTORY = "database/supabase/migrations";
export const PINNED_MIGRATION_COUNT = 71;

export const STAGING_PROJECT_REF = "dvxszhracsjwdancijdc";
export const PRODUCTION_PROJECT_REF = "nwrflbpbhyiqdptmlccm";

export const TRANSPORT_FIRST =
  "20261002000014_coregrid_v2_transport_buses_rls.sql";
export const TRANSPORT_SECOND =
  "20261003000041_coregrid_transport_bus_reads.sql";

export const STAGING_URL_ENV_NAMES = Object.freeze([
  "STAGING_DATABASE_URL",
  "SHERIVS_RLS_STAGING_URL",
]);

export const FORBIDDEN_FALLBACK_ENV_NAMES = Object.freeze([
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_PROJECT_ID",
]);

export const PRODUCTION_HOST_MARKERS = Object.freeze([
  `${PRODUCTION_PROJECT_REF}.supabase.co`,
  `db.${PRODUCTION_PROJECT_REF}.supabase.co`,
  "www.sherivs.com",
  "app.sherivs.com",
  "console.sherivs.com",
]);

export const ALLOWED_DIRECT_HOST = `db.${STAGING_PROJECT_REF}.supabase.co`;
export const ALLOWED_POOLER_HOST_SUFFIX = ".pooler.supabase.com";
export const ALLOWED_POOLER_USER = `postgres.${STAGING_PROJECT_REF}`;

export const CA_ENV_NAMES = Object.freeze([
  "COREGRID_DB_CA_CERT",
  "STAGING_DB_CA_CERT",
]);
export const INSECURE_TLS_ENV = "COREGRID_DB_INSECURE_TLS";

/** Only these URL query keys are accepted. Values are still validated. */
export const ALLOWED_URL_QUERY_KEYS = Object.freeze(["sslmode"]);
/** sslmode may be omitted or exactly verify-full. All other modes fail closed. */
export const ALLOWED_SSLMODE = Object.freeze(["verify-full"]);
export const FORBIDDEN_SSLMODE = Object.freeze([
  "disable",
  "allow",
  "prefer",
  "require",
  "verify-ca",
  "no-verify",
]);
export const FORBIDDEN_PG_SSL_ENV = Object.freeze([
  "PGSSLMODE",
  "PGSSLROOTCERT",
  "PGSSLCERT",
  "PGSSLKEY",
  "PGSSLNEGOTIATION",
]);
export const REQUIRED_PG_PORT = 5432;

/**
 * Session advisory-lock keys for the restore run (two int4 arguments to
 * pg_try_advisory_lock). Chosen as unique ASCII 'SHRV' / 'STAG' so they
 * do not collide with typical application locks. Scope: entire restore
 * attempt, held on a dedicated lock session, not on per-file apply
 * connections.
 */
export const ADVISORY_LOCK_CLASSID = 0x53485256; // 'SHRV'
export const ADVISORY_LOCK_OBJID = 0x53544147; // 'STAG'
export const ADVISORY_LOCK_SCOPE = "entire_restore_run";

export const MODES = Object.freeze({
  MANIFEST: "manifest",
  OFFLINE: "offline",
  PREFLIGHT: "preflight",
  EXECUTE: "execute",
});

export const LEDGER_SCHEMA = "supabase_migrations";
export const LEDGER_TABLE = "sherivs_staging_ledger";
export const SCHEMA_MIGRATIONS_TABLE = "schema_migrations";

export const LEDGER_STATUS = Object.freeze({
  STARTED: "started",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  AMBIGUOUS: "ambiguous",
  RECONCILIATION_REQUIRED: "reconciliation_required",
});

export const TX_OUTCOME = Object.freeze({
  COMMITTED: "committed",
  ROLLED_BACK: "rolled_back",
  UNKNOWN: "unknown",
  NOT_STARTED: "not_started",
});
