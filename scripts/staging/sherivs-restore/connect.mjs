/**
 * Per-migration connections. Network is not available in this mission.
 *
 * `createLiveConnector` is disabled until a separately approved live-connector
 * mission. It must not construct `pg.Client` or call `connect()`, including
 * when `allowNetwork` is true. CLI manifest / offline / preflight / execute
 * paths never import or invoke it.
 *
 * TLS pin (for a future authorized connector): discrete host/port/user/
 * password/database plus a frozen ssl object. `connectionString` is never
 * passed, because pg@8.23.1 would let URL sslmode overwrite
 * rejectUnauthorized/ca.
 *
 * Constructor-only helpers (`demonstrateDriverSslOverwrite`) exist to prove
 * that driver overwrite. They must not call `connect()`.
 */

import { randomUUID } from "node:crypto";
import { LIVE_CONNECTOR_CODE } from "./constants.mjs";
import { buildPinnedClientConfig } from "./tls.mjs";

export { LIVE_CONNECTOR_CODE };

function fail(code, detail) {
  const err = new Error(`${code}: ${detail}`);
  err.code = code;
  throw err;
}

/**
 * Offline mock. Never imports `pg`, never constructs a Client, never connects.
 *
 * Lifecycle:
 * - `opened` is recorded before `onOpen`.
 * - `closed` is recorded even when `onOpen` fails or `fn` throws.
 * - A cleanup (`onClose`) error is attached to the original failure and
 *   must not replace it.
 * - Cleanup failure after successful work is `CONNECTION_CLOSE_FAILED`
 *   (transaction outcome is then uncertain — no automatic retry).
 */
export function createMockConnector(options = {}) {
  const opened = [];
  const closed = [];
  const queries = [];
  const events = [];
  let active = null;
  let seq = 0;
  const applied = [];

  return {
    kind: "mock",
    allowNetwork: false,
    opened,
    closed,
    queries,
    events,
    applied,
    async withConnection(label, fn) {
      if (active) {
        fail(
          "CONNECTION_ISOLATION_VIOLATION",
          "overlapping connection",
        );
      }
      const id = `mock-${++seq}-${randomUUID()}`;
      opened.push({ id, label });
      events.push({ type: "open", id, label });
      active = id;
      const client = {
        id,
        label,
        async query(sql, params) {
          queries.push({ id, label, sql, params });
          if (typeof options.onQuery === "function") {
            return options.onQuery({ id, label, sql, params, client });
          }
          return { rows: [], rowCount: 0 };
        },
      };

      let workError = null;
      let workResult;
      let workCompleted = false;
      try {
        if (typeof options.onOpen === "function") {
          await options.onOpen({ id, label, client });
        }
        workResult = await fn(client);
        workCompleted = true;
      } catch (err) {
        workError = err;
      }

      let closeError = null;
      try {
        if (typeof options.onClose === "function") {
          await options.onClose({ id, label, client });
        }
      } catch (err) {
        closeError = err;
      }

      closed.push(id);
      events.push({
        type: "close",
        id,
        label,
        closeError: closeError ? String(closeError.message ?? closeError) : undefined,
      });
      if (active === id) active = null;

      if (workError) {
        if (closeError) {
          workError.closeError = closeError;
          if (workError.cause == null) workError.cause = closeError;
        }
        throw workError;
      }
      if (closeError) {
        const err = new Error(
          "CONNECTION_CLOSE_FAILED: cleanup failed after the connection work returned",
        );
        err.code = "CONNECTION_CLOSE_FAILED";
        err.closeError = closeError;
        err.afterSuccess = workCompleted;
        throw err;
      }
      return workResult;
    },
  };
}

/**
 * Inspect the ssl object the pinned builder would pass.
 * Does **not** construct Client and does **not** call connect().
 */
export function inspectConstructedClientSsl(connectionString, env) {
  const { config, tls } = buildPinnedClientConfig(connectionString, env);
  const keys = Object.keys(config);
  if (keys.includes("connectionString")) {
    fail(
      "TLS_CONNECTION_STRING_LEAK",
      "pinned config must not include connectionString",
    );
  }
  return {
    configKeys: keys,
    hasConnectionString: Object.prototype.hasOwnProperty.call(config, "connectionString"),
    rejectUnauthorized: config.ssl?.rejectUnauthorized === true,
    caPresent: typeof config.ssl?.ca === "string" && config.ssl.ca.includes("BEGIN CERTIFICATE"),
    sslIsFalse: config.ssl === false,
    sslModeInSslObject: config.ssl?.sslmode,
    builderRejectUnauthorized: tls.rejectUnauthorized === true,
  };
}

/**
 * Document the pg@8.23.1 overwrite that this runner must not use.
 * Constructs Client **without** connect(). Not an apply path.
 */
export function demonstrateDriverSslOverwrite(connectionString, ssl, ClientCtor) {
  if (!ClientCtor) {
    fail("CLIENT_CTOR_REQUIRED", "Client constructor required for overwrite demonstration");
  }
  const naive = new ClientCtor({
    connectionString,
    ssl,
  });
  const pinned = new ClientCtor({
    host: "127.0.0.1",
    port: 5432,
    user: "postgres",
    password: "x",
    database: "postgres",
    ssl,
  });
  return {
    naiveSsl: naive.connectionParameters.ssl,
    pinnedSsl: pinned.connectionParameters.ssl,
    naiveOverwrote:
      JSON.stringify(naive.connectionParameters.ssl) !== JSON.stringify(ssl),
  };
}

/**
 * Live PostgreSQL connector. Disabled in this mission.
 *
 * A later approved live-connector mission must:
 * - use `buildPinnedClientConfig` and never pass `connectionString`;
 * - be independently re-reviewed;
 * - never be reachable from CLI manifest / offline / preflight;
 * - never be implied by `--allow-network` alone.
 */
export function createLiveConnector(options = {}) {
  if (!options?.allowNetwork) {
    fail("NETWORK_DISABLED", "live connector refused");
  }
  fail(
    LIVE_CONNECTOR_CODE,
    "live PostgreSQL connector is disabled until a separately approved live-connector mission; this factory must not construct pg.Client or call connect()",
  );
}

export function liveConnectorPlan() {
  return {
    authorized: false,
    constructsClient: false,
    callsConnect: false,
    code: LIVE_CONNECTOR_CODE,
    requiredFutureApprovals: [
      "written human authorization naming staging ref and source pin",
      "independently reviewed live connector using discrete TLS config",
      "independently reviewed PostgreSQL advisory-lock session",
      "fresh read-only staging catalog",
    ],
  };
}
