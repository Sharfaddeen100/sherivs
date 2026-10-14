/**
 * Per-migration connections. Network is opt-in.
 *
 * Unit tests must never set allowNetwork=true. The CLI execute path is the
 * only intended caller, and this mission does not invoke it.
 */

import { randomUUID } from "node:crypto";
import { strictTlsConfig } from "./tls.mjs";

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
  const tls = strictTlsConfig(options.connectionString, options.env ?? process.env);
  return {
    kind: "live",
    allowNetwork: true,
    async withConnection(label, fn) {
      const pg = await import("pg");
      const Client = pg.default?.Client ?? pg.Client;
      const client = new Client({
        connectionString: options.connectionString,
        ssl: tls.ssl,
      });
      await client.connect();
      const wrapped = {
        id: randomUUID(),
        label,
        query: (sql, params) => client.query(sql, params),
      };
      try {
        return await fn(wrapped);
      } finally {
        await client.end().catch(() => {});
      }
    },
  };
}
