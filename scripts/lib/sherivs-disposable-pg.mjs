/**
 * SHERIVS-001 disposable PostgreSQL isolation qualifier.
 *
 * This module does not import `pg`, does not open sockets, and does not
 * execute SQL. A variable named LOCAL_DATABASE_URL is not proof of isolation.
 * The hostname must independently parse as loopback, and the string must not
 * contain production or staging project refs or hosted Supabase hostnames.
 */

import {
  inspectKnownProjectRefs,
  looksLikeSupabaseHost,
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF,
  redactSecrets,
} from "./sherivs-db-target.mjs";

export const DISPOSABLE_TARGET = "development";
export const DISPOSABLE_URL_ENV_NAMES = Object.freeze([
  "SHERIVS_DISPOSABLE_DATABASE_URL",
  "LOCAL_DATABASE_URL",
  "DEVELOPMENT_DATABASE_URL",
  "DATABASE_URL",
]);

const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1"]);

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
    return {
      protocol: url.protocol.replace(/:$/, ""),
      host: url.hostname,
      port: url.port || null,
    };
  } catch {
    const match = String(connectionString).match(/@([^/:]+)/);
    return {
      protocol: null,
      host: match ? match[1] : null,
      port: null,
      unparseable: true,
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
    /\.supabase\.com$/i.test(String(endpoint.host || "")) ||
    /pooler\.supabase\.com$/i.test(String(endpoint.host || ""));
  const loopback = isLoopbackHost(endpoint.host);
  const postgres = isPostgresProtocol(endpoint.protocol);
  let code = "DISPOSABLE_OK";
  if (endpoint.unparseable || !endpoint.host) code = "DISPOSABLE_URL_UNPARSEABLE";
  else if (!postgres) code = "DISPOSABLE_PROTOCOL_UNSUPPORTED";
  else if (refs.production) code = "DISPOSABLE_PRODUCTION_REF";
  else if (refs.staging) code = "DISPOSABLE_STAGING_REF";
  else if (hosted) code = "DISPOSABLE_REMOTE_SUPABASE";
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

  const reasons = [];
  if (targetMissing || target === "") {
    reasons.push("SHERIVS_DATABASE_TARGET is required and must be development");
  } else if (target !== DISPOSABLE_TARGET) {
    reasons.push(`SHERIVS_DATABASE_TARGET=${target} is not an isolated disposable target`);
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
  const unscopedWhileLive = classified.sourceName === "DATABASE_URL" && liveUrlPresent;
  if (unscopedWhileLive) {
    reasons.push(
      "unscoped DATABASE_URL is not a disposable candidate while staging or production URL variables are present; set SHERIVS_DISPOSABLE_DATABASE_URL to a loopback endpoint",
    );
  }

  const qualified =
    target === DISPOSABLE_TARGET &&
    classified.qualified === true &&
    classified.loopback === true &&
    classified.refs?.production !== true &&
    classified.refs?.staging !== true &&
    !unscopedWhileLive;

  return {
    qualified,
    target: target || null,
    code: qualified ? "DISPOSABLE_QUALIFIED" : (classified.code || "DISPOSABLE_NOT_QUALIFIED"),
    candidate: classified.sourceName,
    endpoint: classified.present
      ? {
          protocol: classified.protocol,
          host: classified.host,
          port: classified.port,
          loopback: classified.loopback,
          hostedSupabase: classified.hostedSupabase,
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
