/**
 * Per-migration connections. Network is opt-in.
 *
 * Unit tests must never set allowNetwork=true. The CLI execute path is the
 * only intended caller of a live client, and this mission does not invoke it.
 *
 * TLS: Client is constructed from discrete host/port/user/password/database
 * plus a frozen ssl object. `connectionString` is never passed, because
 * pg@8.23.1 would let URL sslmode overwrite rejectUnauthorized/ca.
 */

import { randomUUID } from "node:crypto";
import { buildPinnedClientConfig } from "./tls.mjs";

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
        throw Object.assign(
          new Error("CONNECTION_ISOLATION_VIOLATION: overlapping connection"),
          { code: "CONNECTION_ISOLATION_VIOLATION" },
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
            return options.onQuery({ id, label, sql, params });
          }
          return { rows: [], rowCount: 0 };
        },
      };
      try {
        return await fn(client);
      } finally {
        closed.push(id);
        events.push({ type: "close", id, label });
        if (active === id) active = null;
      }
    },
  };
}

/**
 * Inspect the ssl object pg@8.23.1 would actually use.
 * Constructs Client in-process and does **not** call connect().
 */
export function inspectConstructedClientSsl(connectionString, env) {
  const { config, tls } = buildPinnedClientConfig(connectionString, env);
  const keys = Object.keys(config);
  if (keys.includes("connectionString")) {
    throw Object.assign(
      new Error("TLS_CONNECTION_STRING_LEAK: pinned config must not include connectionString"),
      { code: "TLS_CONNECTION_STRING_LEAK" },
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
 * Constructs Client **without** connect().
 */
export function demonstrateDriverSslOverwrite(connectionString, ssl, ClientCtor) {
  if (!ClientCtor) {
    throw Object.assign(new Error("CLIENT_CTOR_REQUIRED"), {
      code: "CLIENT_CTOR_REQUIRED",
    });
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

export function createLiveConnector(options) {
  if (!options?.allowNetwork) {
    throw Object.assign(
      new Error("NETWORK_DISABLED: live connector refused"),
      { code: "NETWORK_DISABLED" },
    );
  }
  if (!options.connectionString) {
    throw Object.assign(new Error("TARGET_MISSING"), { code: "TARGET_MISSING" });
  }
  const { config } = buildPinnedClientConfig(
    options.connectionString,
    options.env ?? process.env,
  );
  if ("connectionString" in config) {
    throw Object.assign(
      new Error("TLS_CONNECTION_STRING_LEAK"),
      { code: "TLS_CONNECTION_STRING_LEAK" },
    );
  }
  return {
    kind: "live",
    allowNetwork: true,
    async withConnection(label, fn) {
      const pg = await import("pg");
      const Client = pg.default?.Client ?? pg.Client;
      const client = new Client(config);
      await client.connect();
      const wrapped = {
        id: randomUUID(),
        label,
        query: (sql, params) => client.query(sql, params),
      };
      try {
        return await fn(wrapped);
      } finally {
        try {
          await client.end();
        } catch (closeErr) {
          wrapped.closeError = closeErr;
        }
      }
    },
  };
}
