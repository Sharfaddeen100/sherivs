/**
 * SHERIVS-ENVIRONMENT-TARGET-AND-DATABASE-TOOLING-HARDENING-001
 *
 * Fail-closed database target selection. This module does not import `pg`,
 * does not open sockets, and does not contact Supabase.
 *
 * Contract:
 *   SHERIVS_DATABASE_TARGET = development | staging | production
 *
 * Credentials, DATABASE_URL presence, NODE_ENV, and project-ref defaults
 * never select a target. Missing, empty, unknown, or conflicting indicators
 * refuse the operation.
 */

export const PRODUCTION_PROJECT_REF = "nwrflbpbhyiqdptmlccm";
export const STAGING_PROJECT_REF = "dvxszhracsjwdancijdc";

export const DATABASE_TARGET_ENV = "SHERIVS_DATABASE_TARGET";
export const PROJECT_REF_ENV = "SHERIVS_PROJECT_REF";
export const PRODUCTION_CONFIRM_ENV = "SHERIVS_CONFIRM_PRODUCTION";

export const ALLOWED_TARGETS = Object.freeze(["development", "staging", "production"]);

export const STAGING_URL_ENV_NAMES = Object.freeze([
  "STAGING_DATABASE_URL",
  "SHERIVS_RLS_STAGING_URL",
]);

export const DEVELOPMENT_URL_ENV_NAMES = Object.freeze([
  "DEVELOPMENT_DATABASE_URL",
  "DATABASE_URL",
]);

export const PRODUCTION_URL_ENV_NAMES = Object.freeze(["PRODUCTION_DATABASE_URL"]);

const DATABASE_TARGET_NODE_VALUES = new Set(["development", "staging", "production"]);

const URL_WITH_PASSWORD = /([a-z][a-z0-9+.-]*:\/\/[^:/?#\s]+:)[^@/\s]+@/gi;
const TOKENISH =
  /\b(sbp_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|sk_live_[A-Za-z0-9]+)\b/gi;
const SERVICE_ROLEISH = /\bservice_role\b/gi;

export class DatabaseTargetError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.name = "DatabaseTargetError";
    this.code = code;
  }
}

export function redactSecrets(value) {
  if (value == null) return value;
  let text = String(value);
  text = text.replace(URL_WITH_PASSWORD, "$1***@");
  text = text.replace(TOKENISH, "[redacted-token]");
  text = text.replace(SERVICE_ROLEISH, "[redacted]");
  return text;
}

function fail(code, message) {
  throw new DatabaseTargetError(code, message);
}

function trimEnv(env, name) {
  const value = env?.[name];
  return value == null ? "" : String(value).trim();
}

function databaseTargetHint(raw) {
  const n = String(raw ?? "").trim().toLowerCase();
  return DATABASE_TARGET_NODE_VALUES.has(n) ? n : null;
}

export function inspectKnownProjectRefs(haystack) {
  const text = String(haystack ?? "").toLowerCase();
  const production = text.includes(PRODUCTION_PROJECT_REF);
  const staging = text.includes(STAGING_PROJECT_REF);
  return { production, staging, both: production && staging };
}

export function looksLikeSupabaseHost(value) {
  return /\.supabase\.(co|com)\b/i.test(String(value ?? ""));
}

/**
 * Resolve the explicit database target. Never infers from credentials.
 */
export function resolveExplicitTarget(env = process.env) {
  if (!Object.prototype.hasOwnProperty.call(env, DATABASE_TARGET_ENV) || env[DATABASE_TARGET_ENV] == null) {
    fail(
      "TARGET_MISSING",
      `${DATABASE_TARGET_ENV} is required. Set it to development, staging, or production. Credentials do not select a target.`,
    );
  }

  const raw = env[DATABASE_TARGET_ENV];
  if (String(raw).trim() === "") {
    fail("TARGET_EMPTY", `${DATABASE_TARGET_ENV} is empty. Set it to development, staging, or production.`);
  }

  const target = String(raw).trim().toLowerCase();
  if (target === "unknown") {
    fail("TARGET_UNKNOWN", `${DATABASE_TARGET_ENV}=unknown is not an executable target.`);
  }
  if (!ALLOWED_TARGETS.includes(target)) {
    fail(
      "TARGET_UNSUPPORTED",
      `${DATABASE_TARGET_ENV} value is not supported. Allowed: development, staging, production.`,
    );
  }

  const nodeHint = databaseTargetHint(env.NODE_ENV);
  const appHint = databaseTargetHint(env.APP_ENV);
  if (nodeHint && appHint && nodeHint !== appHint) {
    fail(
      "TARGET_CONFLICT",
      "NODE_ENV and APP_ENV disagree about the database environment class.",
    );
  }
  if (nodeHint && nodeHint !== target) {
    fail(
      "TARGET_CONFLICT",
      `NODE_ENV indicates ${nodeHint} but ${DATABASE_TARGET_ENV} is ${target}.`,
    );
  }
  if (appHint && appHint !== target) {
    fail(
      "TARGET_CONFLICT",
      `APP_ENV indicates ${appHint} but ${DATABASE_TARGET_ENV} is ${target}.`,
    );
  }

  return target;
}

export function assertProductionAuthorization(env = process.env) {
  const confirm = trimEnv(env, PRODUCTION_CONFIRM_ENV);
  if (confirm !== PRODUCTION_PROJECT_REF) {
    fail(
      "TARGET_PRODUCTION_NOT_AUTHORIZED",
      `Selecting production does not authorize the operation. Set ${PRODUCTION_CONFIRM_ENV}=${PRODUCTION_PROJECT_REF} as a separate confirmation. This is not an automatic approval mechanism.`,
    );
  }
}

export function assertUrlMatchesTarget(connectionString, target, sourceName = "connection URL") {
  if (!connectionString || String(connectionString).trim() === "") {
    fail("TARGET_URL_MISSING", `${sourceName} is missing.`);
  }

  const refs = inspectKnownProjectRefs(connectionString);
  if (refs.both) {
    fail(
      "TARGET_CONFLICT",
      `${sourceName} contains both production and staging project references.`,
    );
  }

  if (target === "staging" && refs.production) {
    fail(
      "TARGET_PRODUCTION_AS_STAGING",
      `Staging operations refuse production project ref ${PRODUCTION_PROJECT_REF}.`,
    );
  }
  if (target === "production" && refs.staging) {
    fail(
      "TARGET_STAGING_AS_PRODUCTION",
      `Production operations refuse staging project ref ${STAGING_PROJECT_REF}.`,
    );
  }
  if (target === "development" && refs.production) {
    fail(
      "TARGET_DEVELOPMENT_LIVE_REF",
      `Development operations refuse production project ref ${PRODUCTION_PROJECT_REF}.`,
    );
  }
  if (target === "development" && refs.staging) {
    fail(
      "TARGET_DEVELOPMENT_LIVE_REF",
      `Development operations refuse staging project ref ${STAGING_PROJECT_REF}.`,
    );
  }

  if (looksLikeSupabaseHost(connectionString)) {
    if (target === "staging" && !refs.staging) {
      fail(
        "TARGET_URL_TARGET_MISMATCH",
        `${sourceName} is a Supabase URL but does not identify staging project ${STAGING_PROJECT_REF}.`,
      );
    }
    if (target === "production" && !refs.production) {
      fail(
        "TARGET_URL_TARGET_MISMATCH",
        `${sourceName} is a Supabase URL but does not identify production project ${PRODUCTION_PROJECT_REF}.`,
      );
    }
  }
}

function firstSetEnv(env, names) {
  const found = [];
  for (const name of names) {
    const value = trimEnv(env, name);
    if (value) found.push({ name, value });
  }
  return found;
}

/**
 * Resolve a Postgres connection string for a protected script.
 * Does not create a client and does not open a socket.
 */
export function resolvePostgresConnection(env = process.env) {
  const target = resolveExplicitTarget(env);

  if (target === "staging") {
    const generic = trimEnv(env, "DATABASE_URL");
    if (generic) {
      fail(
        "TARGET_FORBIDDEN_FALLBACK",
        "Staging operations refuse unscoped DATABASE_URL. Use STAGING_DATABASE_URL or SHERIVS_RLS_STAGING_URL.",
      );
    }
    const found = firstSetEnv(env, STAGING_URL_ENV_NAMES);
    if (found.length === 0) {
      fail(
        "TARGET_STAGING_URL_MISSING",
        "Staging operations require STAGING_DATABASE_URL or SHERIVS_RLS_STAGING_URL. Credential presence is not target proof.",
      );
    }
    if (found.length > 1 && found.some((item) => item.value !== found[0].value)) {
      fail("TARGET_CONFLICT", "STAGING_DATABASE_URL and SHERIVS_RLS_STAGING_URL disagree.");
    }
    const { name, value } = found[0];
    assertUrlMatchesTarget(value, "staging", name);
    return {
      target,
      connectionString: value,
      sourceName: name,
      projectRef: STAGING_PROJECT_REF,
    };
  }

  if (target === "production") {
    assertProductionAuthorization(env);
    const generic = trimEnv(env, "DATABASE_URL");
    if (generic) {
      fail(
        "TARGET_FORBIDDEN_FALLBACK",
        "Production operations refuse unscoped DATABASE_URL. Use PRODUCTION_DATABASE_URL.",
      );
    }
    const productionUrl = trimEnv(env, "PRODUCTION_DATABASE_URL");
    if (!productionUrl) {
      fail(
        "TARGET_PRODUCTION_URL_MISSING",
        "Production operations require PRODUCTION_DATABASE_URL. Selecting production is not authorization and DATABASE_URL is not a fallback.",
      );
    }
    assertUrlMatchesTarget(productionUrl, "production", "PRODUCTION_DATABASE_URL");
    return {
      target,
      connectionString: productionUrl,
      sourceName: "PRODUCTION_DATABASE_URL",
      projectRef: PRODUCTION_PROJECT_REF,
    };
  }

  const developmentPreferred = trimEnv(env, "DEVELOPMENT_DATABASE_URL");
  const generic = trimEnv(env, "DATABASE_URL");
  if (developmentPreferred && generic && developmentPreferred !== generic) {
    fail("TARGET_CONFLICT", "DEVELOPMENT_DATABASE_URL and DATABASE_URL disagree.");
  }
  const connectionString = developmentPreferred || generic;
  const sourceName = developmentPreferred ? "DEVELOPMENT_DATABASE_URL" : "DATABASE_URL";
  if (!connectionString) {
    fail(
      "TARGET_DEVELOPMENT_URL_MISSING",
      "Development operations require DEVELOPMENT_DATABASE_URL or DATABASE_URL after SHERIVS_DATABASE_TARGET=development.",
    );
  }
  assertUrlMatchesTarget(connectionString, "development", sourceName);
  return {
    target,
    connectionString,
    sourceName,
    projectRef: null,
  };
}

function normalizeProjectRef(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function assertProjectRefMatchesTarget(projectRef, target) {
  const ref = normalizeProjectRef(projectRef);
  if (!ref) {
    fail(
      "TARGET_PROJECT_REF_MISSING",
      "An explicit project reference is required. Production is not the default.",
    );
  }
  if (ref === PRODUCTION_PROJECT_REF && target === "staging") {
    fail(
      "TARGET_PRODUCTION_AS_STAGING",
      `Staging operations refuse production project ref ${PRODUCTION_PROJECT_REF}.`,
    );
  }
  if (ref === STAGING_PROJECT_REF && target === "production") {
    fail(
      "TARGET_STAGING_AS_PRODUCTION",
      `Production operations refuse staging project ref ${STAGING_PROJECT_REF}.`,
    );
  }
  if (target === "development" && (ref === PRODUCTION_PROJECT_REF || ref === STAGING_PROJECT_REF)) {
    fail(
      "TARGET_DEVELOPMENT_LIVE_REF",
      "Development operations refuse the known production and staging project references.",
    );
  }
  if (target === "staging" && ref !== STAGING_PROJECT_REF) {
    fail(
      "TARGET_PROJECT_REF_MISMATCH",
      `Staging operations require project ref ${STAGING_PROJECT_REF}.`,
    );
  }
  if (target === "production" && ref !== PRODUCTION_PROJECT_REF) {
    fail(
      "TARGET_PROJECT_REF_MISMATCH",
      `Production operations require project ref ${PRODUCTION_PROJECT_REF}.`,
    );
  }
  return ref;
}

/**
 * Resolve a Supabase management-API project ref. No production default.
 */
export function resolveManagementProjectRef(env = process.env, argvRef) {
  const target = resolveExplicitTarget(env);
  const fromArgv = normalizeProjectRef(argvRef);
  const fromEnv = normalizeProjectRef(env[PROJECT_REF_ENV]);

  if (fromArgv && fromEnv && fromArgv !== fromEnv) {
    fail(
      "TARGET_CONFLICT",
      `CLI project ref and ${PROJECT_REF_ENV} disagree.`,
    );
  }

  const projectRef = fromArgv || fromEnv;
  if (!projectRef) {
    fail(
      "TARGET_PROJECT_REF_MISSING",
      `Pass an explicit project ref or set ${PROJECT_REF_ENV}. The production project is not a default.`,
    );
  }

  const validated = assertProjectRefMatchesTarget(projectRef, target);
  if (target === "production") {
    assertProductionAuthorization(env);
  }

  return { target, projectRef: validated };
}

/**
 * Validate then invoke a caller-supplied factory. Used to prove refusal
 * happens before client construction.
 */
export function openValidatedPostgresClient(env, connectFactory) {
  const resolved = resolvePostgresConnection(env);
  if (typeof connectFactory !== "function") {
    fail("TARGET_INTERNAL", "A connect factory is required after validation.");
  }
  return connectFactory({
    connectionString: resolved.connectionString,
    target: resolved.target,
    sourceName: resolved.sourceName,
    projectRef: resolved.projectRef,
  });
}

export function exitOnDatabaseTargetError(err) {
  const message = redactSecrets(err instanceof Error ? err.message : String(err));
  console.error(message);
  process.exit(2);
}

export function requirePostgresTarget(env = process.env) {
  try {
    return resolvePostgresConnection(env);
  } catch (err) {
    exitOnDatabaseTargetError(err);
    throw err;
  }
}

export function requireManagementTarget(env = process.env, argvRef) {
  try {
    return resolveManagementProjectRef(env, argvRef);
  } catch (err) {
    exitOnDatabaseTargetError(err);
    throw err;
  }
}
