/**
 * SHERIVS-001 disposable-only execution harness (pre-execution).
 *
 * Qualification is not permission to execute.
 * Live apply is disabled in this module (`DISPOSABLE_LIVE_EXECUTE_ENABLED`).
 * This file does not import `pg`, does not open sockets, and does not
 * execute SQL. A future authorized process must inject a connect factory
 * after that flag is reviewed and enabled.
 *
 * Transaction contract for a future apply: submit the whole proposed file
 * with client.query(sql) and no outer BEGIN/COMMIT. The file already wraps
 * BEGIN/COMMIT. Do not use scripts/staging/sherivs-restore/runner.mjs.
 * Do not use scripts/db-apply.mjs (applies every *.sql).
 * Do not use scripts/db-apply-one.mjs (DATABASE_URL fallback; *.sql only).
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  inspectKnownProjectRefs,
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF,
  redactSecrets,
} from "./sherivs-db-target.mjs";
import {
  DISPOSABLE_LIFECYCLE_ALLOWED,
  DISPOSABLE_LIFECYCLE_ENV,
  DisposablePgError,
  qualifyDisposablePostgres,
} from "./sherivs-disposable-pg.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

export const DISPOSABLE_LIVE_EXECUTE_ENABLED = false;
export const DISPOSABLE_WRAPS_OUTER_TRANSACTION = false;
export const DISPOSABLE_URL_ENV = "SHERIVS_DISPOSABLE_DATABASE_URL";
export const DISPOSABLE_EXECUTE_ENV = "SHERIVS_DISPOSABLE_EXECUTE";
export const DISPOSABLE_EXECUTE_ALLOWED = "I-AUTHORIZE-DISPOSABLE-APPLY";
export const DISPOSABLE_EXECUTE_SHA_ENV = "SHERIVS_DISPOSABLE_EXECUTE_SHA256";

export const OPERATIONS = Object.freeze([
  "inspect",
  "apply-proposed-freeze",
  "apply-proposed-rollback",
]);

export const FORBIDDEN_URL_ENV_NAMES = Object.freeze([
  "DATABASE_URL",
  "LOCAL_DATABASE_URL",
  "DEVELOPMENT_DATABASE_URL",
  "STAGING_DATABASE_URL",
  "PRODUCTION_DATABASE_URL",
  "SHERIVS_RLS_STAGING_URL",
]);

export const FORBIDDEN_LIVE_REF_ENV_NAMES = Object.freeze([
  "SUPABASE_URL",
  "STAGING_SUPABASE_URL",
  "SHERIVS_SUPABASE_URL",
]);

export const FORBIDDEN_SQL_ENV_NAMES = Object.freeze([
  "SHERIVS_DISPOSABLE_SQL",
  "MIGRATION_SQL",
  "SQL",
]);

export const PINNED_FORWARD = Object.freeze({
  id: "forward",
  relativePath: "database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed",
  sha256: "62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416",
});

export const PINNED_ROLLBACK = Object.freeze({
  id: "rollback",
  relativePath: "database/supabase/rollbacks/20261015000010_sherivs_identity_privilege_freeze.sql.proposed",
  sha256: "6a9363db98dd3c82036b315e67d38559a0db00583b8ea7de541375a334bfb7e4",
});

function trimEnv(env, name) {
  const value = env?.[name];
  return value == null ? "" : String(value).trim();
}

function sha256Hex(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function hashPinnedArtifact(pin) {
  const absolutePath = join(ROOT, pin.relativePath);
  const bytes = readFileSync(absolutePath);
  const sha256 = sha256Hex(bytes);
  const text = bytes.toString("utf8");
  return {
    id: pin.id,
    relativePath: pin.relativePath,
    sha256,
    pinnedSha256: pin.sha256,
    shaMatches: sha256 === pin.sha256,
    bytes: bytes.length,
    hasBegin: /^\s*BEGIN;/m.test(text),
    hasCommit: /^\s*COMMIT;/m.test(text),
  };
}

function presentEnvNames(env, names) {
  return names.filter((name) => trimEnv(env, name) !== "");
}

function liveRefEnvHits(env) {
  const hits = [];
  for (const name of FORBIDDEN_LIVE_REF_ENV_NAMES) {
    const value = trimEnv(env, name);
    if (!value) continue;
    const refs = inspectKnownProjectRefs(value);
    if (refs.production || refs.staging) hits.push(name);
  }
  return hits;
}

function qualificationEnv(env) {
  return {
    SHERIVS_DATABASE_TARGET: env?.SHERIVS_DATABASE_TARGET,
    [DISPOSABLE_LIFECYCLE_ENV]: env?.[DISPOSABLE_LIFECYCLE_ENV],
    [DISPOSABLE_URL_ENV]: env?.[DISPOSABLE_URL_ENV],
  };
}

function parseOperation(raw) {
  const operation = raw == null || String(raw).trim() === "" ? "inspect" : String(raw).trim();
  if (!OPERATIONS.includes(operation)) {
    throw new DisposablePgError(
      "DISPOSABLE_OPERATION_REFUSED",
      `operation is not in the disposable allowlist: inspect, apply-proposed-freeze, apply-proposed-rollback`,
    );
  }
  return operation;
}

function selectedPin(operation) {
  if (operation === "apply-proposed-rollback") return PINNED_ROLLBACK;
  if (operation === "apply-proposed-freeze") return PINNED_FORWARD;
  return null;
}

/**
 * Plan a disposable operation without connecting.
 */
export function planDisposableExecution(env = process.env, options = {}) {
  const reasons = [];
  let operation;
  try {
    operation = parseOperation(options.operation);
  } catch (err) {
    return {
      operation: options.operation ?? null,
      qualified: false,
      authorized: false,
      liveExecuteEnabled: DISPOSABLE_LIVE_EXECUTE_ENABLED,
      wrapsOuterTransaction: DISPOSABLE_WRAPS_OUTER_TRANSACTION,
      connects: false,
      connected: false,
      candidate: DISPOSABLE_URL_ENV,
      code: err instanceof DisposablePgError ? err.code : "DISPOSABLE_OPERATION_REFUSED",
      reasons: [redactSecrets(err instanceof Error ? err.message : String(err))],
      gates: {
        qualified: false,
        authorized: false,
        shaPinned: false,
        noForbiddenUrlEnv: false,
        noArbitrarySqlEnv: false,
        noLiveProjectRefEnv: false,
        liveExecuteEnabled: DISPOSABLE_LIVE_EXECUTE_ENABLED,
        connectorInjected: false,
      },
      artifacts: [],
      qualification: null,
      requalification: null,
      productionProjectRef: PRODUCTION_PROJECT_REF,
      stagingProjectRef: STAGING_PROJECT_REF,
    };
  }

  const forbiddenUrls = presentEnvNames(env, FORBIDDEN_URL_ENV_NAMES);
  const arbitrarySql = presentEnvNames(env, FORBIDDEN_SQL_ENV_NAMES);
  const liveRefHits = liveRefEnvHits(env);
  const noForbiddenUrlEnv = forbiddenUrls.length === 0;
  const noArbitrarySqlEnv = arbitrarySql.length === 0;
  const noLiveProjectRefEnv = liveRefHits.length === 0;

  if (!noForbiddenUrlEnv) {
    reasons.push(
      `forbidden URL environment variable(s) present: ${forbiddenUrls.join(", ")}; disposable execute never uses DATABASE_URL or live fallbacks`,
    );
  }
  if (!noArbitrarySqlEnv) {
    reasons.push("arbitrary SQL environment variables are refused");
  }
  if (!noLiveProjectRefEnv) {
    reasons.push("a live production or staging project reference is present in the environment");
  }

  const disposableUrl = trimEnv(env, DISPOSABLE_URL_ENV);
  if (!disposableUrl) {
    reasons.push(`${DISPOSABLE_URL_ENV} is required; DATABASE_URL is not a fallback`);
  }

  const qualification = qualifyDisposablePostgres(qualificationEnv(env));
  const requalification = qualifyDisposablePostgres(qualificationEnv(env));
  const requalifyMatches =
    qualification.qualified === requalification.qualified &&
    qualification.code === requalification.code &&
    JSON.stringify(qualification.endpoint) === JSON.stringify(requalification.endpoint);

  if (!qualification.qualified) {
    reasons.push(`shared qualifier refused: ${qualification.code}`);
  }
  if (!requalifyMatches) {
    reasons.push("immediate re-qualification did not match the first qualification");
  }

  const forward = hashPinnedArtifact(PINNED_FORWARD);
  const rollback = hashPinnedArtifact(PINNED_ROLLBACK);
  const artifacts = [forward, rollback];
  const pin = selectedPin(operation);
  const selected = pin ? artifacts.find((item) => item.id === pin.id) : null;
  const authorizeValue = trimEnv(env, DISPOSABLE_EXECUTE_ENV);
  const authorized = authorizeValue === DISPOSABLE_EXECUTE_ALLOWED;
  const offeredSha = trimEnv(env, DISPOSABLE_EXECUTE_SHA_ENV);
  let shaPinned = forward.shaMatches && rollback.shaMatches;
  if (operation !== "inspect") {
    if (!authorized) {
      reasons.push(`${DISPOSABLE_EXECUTE_ENV} must equal the explicit disposable apply authorization value`);
    }
    if (!selected) {
      reasons.push("no pinned artifact selected");
      shaPinned = false;
    } else if (!selected.shaMatches) {
      reasons.push("pinned proposed SQL bytes do not match the harness SHA-256");
      shaPinned = false;
    } else if (offeredSha !== selected.pinnedSha256) {
      reasons.push(`${DISPOSABLE_EXECUTE_SHA_ENV} must equal the pinned SHA-256 of the selected file`);
      shaPinned = false;
    }
    if (selected && (!selected.hasBegin || !selected.hasCommit)) {
      reasons.push("selected file is missing explicit BEGIN/COMMIT required by the disposable apply contract");
      shaPinned = false;
    }
  } else if (!forward.shaMatches || !rollback.shaMatches) {
    reasons.push("proposed SQL bytes do not match the harness SHA-256 pins");
  }

  const qualified =
    qualification.qualified === true &&
    requalifyMatches &&
    noForbiddenUrlEnv &&
    noArbitrarySqlEnv &&
    noLiveProjectRefEnv &&
    Boolean(disposableUrl);

  const connectorInjected = typeof options.connectFactory === "function";
  const gates = {
    qualified,
    authorized: operation === "inspect" ? false : authorized,
    shaPinned,
    noForbiddenUrlEnv,
    noArbitrarySqlEnv,
    noLiveProjectRefEnv,
    liveExecuteEnabled: DISPOSABLE_LIVE_EXECUTE_ENABLED,
    connectorInjected,
  };

  let code = "DISPOSABLE_INSPECT_OK";
  if (operation === "inspect") {
    code = qualified && shaPinned ? "DISPOSABLE_INSPECT_OK" : (qualification.code || "DISPOSABLE_NOT_QUALIFIED");
  } else if (!qualified) {
    code = qualification.qualified ? "DISPOSABLE_NOT_QUALIFIED" : (qualification.code || "DISPOSABLE_NOT_QUALIFIED");
  } else if (!authorized) {
    code = "DISPOSABLE_EXECUTE_NOT_AUTHORIZED";
  } else if (!shaPinned) {
    code = "DISPOSABLE_SHA_MISMATCH";
  } else if (!DISPOSABLE_LIVE_EXECUTE_ENABLED) {
    code = "DISPOSABLE_LIVE_EXECUTE_NOT_ENABLED";
  } else if (!connectorInjected) {
    code = "DISPOSABLE_CONNECTOR_NOT_INJECTED";
  } else {
    code = "DISPOSABLE_APPLY_READY";
  }

  return {
    operation,
    qualified,
    authorized: gates.authorized,
    liveExecuteEnabled: DISPOSABLE_LIVE_EXECUTE_ENABLED,
    wrapsOuterTransaction: DISPOSABLE_WRAPS_OUTER_TRANSACTION,
    connects: false,
    connected: false,
    candidate: DISPOSABLE_URL_ENV,
    code,
    reasons: reasons.map((item) => redactSecrets(item)),
    gates,
    artifacts: artifacts.map((item) => ({
      id: item.id,
      relativePath: item.relativePath,
      sha256: item.sha256,
      pinnedSha256: item.pinnedSha256,
      shaMatches: item.shaMatches,
      bytes: item.bytes,
      hasBegin: item.hasBegin,
      hasCommit: item.hasCommit,
    })),
    selectedArtifact: selected
      ? {
          id: selected.id,
          relativePath: selected.relativePath,
          sha256: selected.sha256,
          shaMatches: selected.shaMatches,
        }
      : null,
    qualification: {
      qualified: qualification.qualified,
      code: qualification.code,
      candidate: qualification.candidate,
      lifecycle: qualification.lifecycle,
      endpoint: qualification.endpoint,
      connects: qualification.connects,
    },
    requalification: {
      qualified: requalification.qualified,
      code: requalification.code,
      matchesFirst: requalifyMatches,
      connects: requalification.connects,
    },
    productionProjectRef: PRODUCTION_PROJECT_REF,
    stagingProjectRef: STAGING_PROJECT_REF,
    lifecycleAllowed: DISPOSABLE_LIFECYCLE_ALLOWED,
  };
}

/**
 * Decide whether a plan may proceed to a connect factory.
 * Live execute remains disabled; "connect" is unreachable until the flag changes.
 */
export function decideDisposableExecution(plan) {
  if (!plan || typeof plan !== "object") {
    return { action: "refuse", code: "DISPOSABLE_NOT_QUALIFIED" };
  }
  if (plan.operation === "inspect" || plan.operation == null) {
    return { action: "report", code: plan.code || "DISPOSABLE_INSPECT_OK" };
  }
  if (!plan.gates?.qualified) {
    return { action: "refuse", code: plan.code || "DISPOSABLE_NOT_QUALIFIED" };
  }
  if (!plan.gates?.authorized) {
    return { action: "refuse", code: "DISPOSABLE_EXECUTE_NOT_AUTHORIZED" };
  }
  if (!plan.gates?.shaPinned) {
    return { action: "refuse", code: "DISPOSABLE_SHA_MISMATCH" };
  }
  if (!plan.gates?.liveExecuteEnabled) {
    return { action: "refuse", code: "DISPOSABLE_LIVE_EXECUTE_NOT_ENABLED" };
  }
  if (!plan.gates?.connectorInjected) {
    return { action: "refuse", code: "DISPOSABLE_CONNECTOR_NOT_INJECTED" };
  }
  if (plan.wrapsOuterTransaction) {
    return { action: "refuse", code: "DISPOSABLE_OUTER_TRANSACTION_REFUSED" };
  }
  return { action: "connect", code: "DISPOSABLE_APPLY_READY" };
}

/**
 * Run the harness. Never opens a database connection.
 *
 * Apply operations are planned and then refused with
 * DISPOSABLE_LIVE_EXECUTE_NOT_ENABLED. SQL apply is not implemented in this
 * pre-execution review: even a synthetic plan whose decide() action is
 * "connect" is refused here. A later mission must add the connect path.
 */
export async function runDisposableExecution(env = process.env, options = {}) {
  const plan = planDisposableExecution(env, {
    ...options,
    connectFactory: options.connectFactory,
  });
  const decision = decideDisposableExecution(plan);
  if (decision.action === "report") {
    return {
      ...plan,
      decision: "report",
      connected: false,
      connects: false,
      executedSql: false,
    };
  }
  return {
    ...plan,
    decision: "refuse",
    connected: false,
    connects: false,
    executedSql: false,
    code:
      decision.action === "connect"
        ? "DISPOSABLE_LIVE_EXECUTE_NOT_ENABLED"
        : decision.code,
  };
}
