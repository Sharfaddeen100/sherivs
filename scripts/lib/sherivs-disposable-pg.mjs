/**
 * SHERIVS-001 disposable PostgreSQL isolation qualifier.
 *
 * This module does not import `pg`, does not open sockets, and does not
 * execute SQL. A variable named LOCAL_DATABASE_URL is not proof of isolation.
 * The hostname must independently parse as loopback, the authority must
 * include an explicit port, libpq endpoint-override query keys are refused,
 * and the operator must attest an ephemeral local lifecycle.
 *
 * Loopback is necessary and not sufficient. An SSH tunnel or local proxy can
 * bind 127.0.0.1 while forwarding to production. Qualification therefore also
 * requires SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local. That attestation
 * is not cryptographic proof; it is an explicit ownership claim the operator
 * must be able to defend with lifecycle evidence (create/teardown of a
 * disposable instance they control).
 */

import {
  inspectKnownProjectRefs,
  looksLikeSupabaseHost,
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF,
  redactSecrets,
} from "./sherivs-db-target.mjs";

export const DISPOSABLE_TARGET = "development";
export const DISPOSABLE_LIFECYCLE_ENV = "SHERIVS_DISPOSABLE_PG_LIFECYCLE";
export const DISPOSABLE_LIFECYCLE_ALLOWED = "ephemeral-local";
export const DISPOSABLE_URL_ENV_NAMES = Object.freeze([
  "SHERIVS_DISPOSABLE_DATABASE_URL",
  "LOCAL_DATABASE_URL",
  "DEVELOPMENT_DATABASE_URL",
  "DATABASE_URL",
]);

const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1"]);
/**
 * libpq / node-pg honour these query keys over URL authority. A loopback
 * authority with ?host= or ?hostaddr= pointing elsewhere is a remote
 * endpoint. Refuse them even when the override value is also loopback so
 * the intended host and port are exactly the authority components.
 */
const LIBPQ_ENDPOINT_OVERRIDE_KEYS = new Set(["host", "hostaddr", "port"]);

export class DisposablePgError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.name = "DisposablePgError";
    this.code = code;
  }
}

function trimEnv(env, name) {
  const value = env?.[name];
  return value == null ? "" : String(value).trim();
}

function parseEndpoint(connectionString) {
  try {
    const url = new URL(connectionString);
    const endpointOverrides = [];
    for (const [key] of url.searchParams.entries()) {
      const lowered = String(key).toLowerCase();
      if (LIBPQ_ENDPOINT_OVERRIDE_KEYS.has(lowered) && !endpointOverrides.includes(lowered)) {
        endpointOverrides.push(lowered);
      }
    }
    return {
      protocol: url.protocol.replace(/:$/, ""),
      host: url.hostname,
      port: url.port || null,
      endpointOverrides,
    };
  } catch {
    // Do not salvage a host from userinfo via regex. Malformed strings fail closed.
    return {
      protocol: null,
      host: null,
      port: null,
      unparseable: true,
      endpointOverrides: [],
    };
  }
}

function isLoopbackHost(host) {
  const h = String(host || "").replace(/^\[|\]$/g, "").toLowerCase();
  return LOOPBACK.has(h);
}

function isPostgresProtocol(protocol) {
  return protocol === "postgres" || protocol === "postgresql";
}

function portStatus(port) {
  if (port == null || String(port).trim() === "") {
    return { ok: false, code: "DISPOSABLE_PORT_REQUIRED" };
  }
  if (!/^[0-9]+$/.test(String(port))) {
    return { ok: false, code: "DISPOSABLE_PORT_INVALID" };
  }
  const n = Number(port);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    return { ok: false, code: "DISPOSABLE_PORT_INVALID" };
  }
  return { ok: true, code: null };
}

/**
 * Classify a connection string without connecting.
 * Never returns the raw URL or userinfo.
 */
export function classifyConnectionString(connectionString, sourceName = "connection URL") {
  if (!connectionString || String(connectionString).trim() === "") {
    return {
      sourceName,
      present: false,
      qualified: false,
      code: "DISPOSABLE_URL_MISSING",
    };
  }
  const endpoint = parseEndpoint(connectionString);
  const refs = inspectKnownProjectRefs(connectionString);
  const hosted = looksLikeSupabaseHost(connectionString) ||
    /\.supabase\.com$/i.test(String(endpoint.host || "").replace(/^\[|\]$/g, "")) ||
    /pooler\.supabase\.com$/i.test(String(endpoint.host || "").replace(/^\[|\]$/g, ""));
  const loopback = isLoopbackHost(endpoint.host);
  const postgres = isPostgresProtocol(endpoint.protocol);
  const port = portStatus(endpoint.port);
  let code = "DISPOSABLE_OK";
  if (endpoint.unparseable || !endpoint.host) code = "DISPOSABLE_URL_UNPARSEABLE";
  else if (!postgres) code = "DISPOSABLE_PROTOCOL_UNSUPPORTED";
  else if (refs.production) code = "DISPOSABLE_PRODUCTION_REF";
  else if (refs.staging) code = "DISPOSABLE_STAGING_REF";
  else if (hosted) code = "DISPOSABLE_REMOTE_SUPABASE";
  else if (endpoint.endpointOverrides.length > 0) code = "DISPOSABLE_ENDPOINT_OVERRIDE";
  else if (!port.ok) code = port.code;
  else if (!loopback) code = "DISPOSABLE_HOST_NOT_LOOPBACK";
  return {
    sourceName,
    present: true,
    qualified: code === "DISPOSABLE_OK",
    code,
    protocol: endpoint.protocol,
    host: endpoint.host,
    port: endpoint.port,
    loopback,
    hostedSupabase: hosted,
    endpointOverrides: endpoint.endpointOverrides,
    refs: {
      production: refs.production,
      staging: refs.staging,
    },
  };
}

function selectCandidate(env) {
  for (const name of DISPOSABLE_URL_ENV_NAMES) {
    const value = trimEnv(env, name);
    if (value) return { name, value };
  }
  return null;
}

function lifecycleStatus(env) {
  if (!Object.prototype.hasOwnProperty.call(env ?? {}, DISPOSABLE_LIFECYCLE_ENV) ||
      env[DISPOSABLE_LIFECYCLE_ENV] == null) {
    return { ok: false, value: null, code: "DISPOSABLE_LIFECYCLE_REQUIRED" };
  }
  const value = String(env[DISPOSABLE_LIFECYCLE_ENV]).trim();
  if (value === "") {
    return { ok: false, value: null, code: "DISPOSABLE_LIFECYCLE_REQUIRED" };
  }
  if (value !== DISPOSABLE_LIFECYCLE_ALLOWED) {
    return { ok: false, value, code: "DISPOSABLE_LIFECYCLE_REFUSED" };
  }
  return { ok: true, value, code: null };
}

/**
 * Positive isolation check. Never opens a database connection.
 */
export function qualifyDisposablePostgres(env = process.env) {
  const targetRaw = env?.SHERIVS_DATABASE_TARGET;
  const targetMissing = targetRaw == null;
  const target = targetMissing ? null : String(targetRaw).trim().toLowerCase();
  const candidate = selectCandidate(env);
  const classified = candidate
    ? classifyConnectionString(candidate.value, candidate.name)
    : { sourceName: null, present: false, qualified: false, code: "DISPOSABLE_URL_MISSING" };
  const lifecycle = lifecycleStatus(env);

  const reasons = [];
  if (targetMissing || target === "") {
    reasons.push("SHERIVS_DATABASE_TARGET is required and must be development");
  } else if (target !== DISPOSABLE_TARGET) {
    reasons.push(`SHERIVS_DATABASE_TARGET=${target} is not an isolated disposable target`);
  }
  if (!lifecycle.ok) {
    if (lifecycle.code === "DISPOSABLE_LIFECYCLE_REQUIRED") {
      reasons.push(
        `${DISPOSABLE_LIFECYCLE_ENV} is required and must be ${DISPOSABLE_LIFECYCLE_ALLOWED}; loopback is not proof of a disposable lifecycle`,
      );
    } else {
      reasons.push(
        `${DISPOSABLE_LIFECYCLE_ENV} value is not an allowed disposable lifecycle attestation`,
      );
    }
  }
  if (!classified.present) {
    reasons.push("no candidate connection URL is set");
  } else if (!classified.qualified) {
    reasons.push(`${classified.sourceName} failed ${classified.code}`);
  }
  const liveUrlPresent = Boolean(
    trimEnv(env, "STAGING_DATABASE_URL") ||
      trimEnv(env, "PRODUCTION_DATABASE_URL") ||
      trimEnv(env, "SHERIVS_RLS_STAGING_URL"),
  );
  const databaseUrlPresent = Boolean(trimEnv(env, "DATABASE_URL"));
  const namedDisposableCandidate =
    Boolean(classified.sourceName) && classified.sourceName !== "DATABASE_URL";
  const unscopedWhileLive = classified.sourceName === "DATABASE_URL" && liveUrlPresent;
  const mixedLiveWithNamedDisposable = namedDisposableCandidate && liveUrlPresent;
  const mixedNamedDisposableWithDatabaseUrl = namedDisposableCandidate && databaseUrlPresent;
  if (unscopedWhileLive) {
    reasons.push(
      "unscoped DATABASE_URL is not a disposable candidate while staging or production URL variables are present; set SHERIVS_DISPOSABLE_DATABASE_URL to a loopback endpoint",
    );
  }
  if (mixedLiveWithNamedDisposable) {
    reasons.push(
      "staging or production URL variables are present alongside a named disposable candidate; isolate the shell so the qualifier and harness select the same target",
    );
  }
  if (mixedNamedDisposableWithDatabaseUrl) {
    reasons.push(
      "DATABASE_URL is set alongside a named disposable URL; unset DATABASE_URL so the qualifier and harness cannot select different targets",
    );
  }

  const mixedUrlEnv = mixedLiveWithNamedDisposable || mixedNamedDisposableWithDatabaseUrl;
  const qualified =
    target === DISPOSABLE_TARGET &&
    lifecycle.ok === true &&
    classified.qualified === true &&
    classified.loopback === true &&
    classified.refs?.production !== true &&
    classified.refs?.staging !== true &&
    !unscopedWhileLive &&
    !mixedUrlEnv;

  let code = "DISPOSABLE_NOT_QUALIFIED";
  if (qualified) code = "DISPOSABLE_QUALIFIED";
  else if (targetMissing || target === "" || (target && target !== DISPOSABLE_TARGET)) {
    code = classified.code || "DISPOSABLE_NOT_QUALIFIED";
  } else if (!lifecycle.ok) code = lifecycle.code;
  else if (mixedUrlEnv) code = "DISPOSABLE_MIXED_URL_ENV";
  else if (!classified.present || !classified.qualified || unscopedWhileLive) {
    code = unscopedWhileLive && classified.qualified
      ? "DISPOSABLE_UNSCOPED_WHILE_LIVE"
      : (classified.code || "DISPOSABLE_NOT_QUALIFIED");
  }

  return {
    qualified,
    target: target || null,
    code,
    candidate: classified.sourceName,
    lifecycle: lifecycle.value,
    endpoint: classified.present
      ? {
          protocol: classified.protocol,
          host: classified.host,
          port: classified.port,
          loopback: classified.loopback,
          hostedSupabase: classified.hostedSupabase,
          endpointOverrides: classified.endpointOverrides || [],
          refs: classified.refs,
        }
      : null,
    reasons,
    productionProjectRef: PRODUCTION_PROJECT_REF,
    stagingProjectRef: STAGING_PROJECT_REF,
    connects: false,
  };
}

export function assertDisposablePostgres(env = process.env) {
  const result = qualifyDisposablePostgres(env);
  if (!result.qualified) {
    throw new DisposablePgError(
      result.code,
      redactSecrets(result.reasons.join("; ") || "disposable PostgreSQL is not qualified"),
    );
  }
  return result;
}
