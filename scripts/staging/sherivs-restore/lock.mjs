/**
 * Restore-run concurrency protection.
 *
 * Why a PostgreSQL session advisory lock (not a process-local mutex):
 * - Two runner *processes* can otherwise both evaluate an empty ledger and
 *   both apply the same non-idempotent CREATE TABLE / CREATE POLICY.
 * - Session advisory locks are database-local, exclusive, and released
 *   automatically when the lock backend dies (connection loss / crash).
 * - Transaction-level advisory locks would be released at COMMIT on the
 *   lock session and cannot span the 71 per-file apply connections.
 *
 * Interaction with per-migration connection isolation:
 * - The lock is held on a *dedicated* session that never executes migration
 *   SQL. That session stays open for the whole attempt.
 * - Each migration still uses its own apply connection (see connect.mjs).
 * - Apply connections do not take the advisory lock; they rely on the lock
 *   session remaining alive. The runner probes the lock session before
 *   every file. Probe failure stops the run as uncertain — no automatic
 *   retry (non-idempotent SQL may already have committed on another
 *   backend).
 * - Unique index on (filename) WHERE status IN ('started','succeeded') is
 *   defense in depth if the lock session dies during a TOCTOU window.
 *
 * Scope: entire restore attempt (all files), one holder per database.
 * Lifetime: acquire after execute authorization / TLS pin, before ledger
 * bootstrap and apply; release in finally, or implicitly on session end.
 *
 * This module does not open a network connection. Live pg_try_advisory_lock
 * is a documented SQL plan for a future authorized connector. Offline tests
 * inject a fake advisory session that interprets the same SQL.
 */

import {
  ADVISORY_LOCK_CLASSID,
  ADVISORY_LOCK_OBJID,
  ADVISORY_LOCK_SCOPE,
} from "./constants.mjs";

function fail(code, detail) {
  const err = new Error(`${code}: ${detail}`);
  err.code = code;
  throw err;
}

export const LOCK_STATES = Object.freeze({
  UNLOCKED: "unlocked",
  HELD: "held",
  RELEASED: "released",
  ACQUIRE_FAILED: "acquire_failed",
  CONNECTION_LOST: "connection_lost",
  PROBE_FAILED: "probe_failed",
});

export const LOCK_SQL = Object.freeze({
  acquire: "SELECT pg_try_advisory_lock($1, $2) AS acquired",
  probe: `SELECT granted
            FROM pg_locks
           WHERE locktype = 'advisory'
             AND pid = pg_backend_pid()
             AND classid = $1
             AND objid = $2`,
  release: "SELECT pg_advisory_unlock($1, $2) AS released",
});

export function advisoryLockPlan() {
  return {
    kind: "advisory",
    scope: ADVISORY_LOCK_SCOPE,
    lifetime:
      "dedicated lock session, held from acquire until explicit unlock or backend death",
    classid: ADVISORY_LOCK_CLASSID,
    objid: ADVISORY_LOCK_OBJID,
    sql: LOCK_SQL,
    perMigrationIsolation:
      "lock session is distinct from per-file apply connections; apply SQL never runs on the lock backend",
    connectionLoss:
      "PostgreSQL releases a session advisory lock when the lock backend exits; the runner then treats in-flight work as uncertain and refuses automatic retry",
    staleAttempts:
      "a later process may acquire the lock after backend death; evaluateLedger + catalog reconcile refuse STARTED/partial/failed prefixes instead of replaying SQL",
    whyNotProcessLocal:
      "a mutex in one Node process cannot serialize two runner processes against the same staging database",
  };
}

/**
 * Pure lock state machine. Offline-testable without a database.
 *
 * @param {{ status: string, owner: string | null }} state
 * @param {{ type: string, owner?: string }} event
 */
export function transitionLock(state, event) {
  const status = state?.status ?? LOCK_STATES.UNLOCKED;
  const owner = state?.owner ?? null;
  switch (event.type) {
    case "acquire_ok": {
      if (status === LOCK_STATES.HELD && owner && owner !== event.owner) {
        return {
          status: LOCK_STATES.ACQUIRE_FAILED,
          owner,
          ok: false,
          code: "LOCK_HELD",
        };
      }
      return {
        status: LOCK_STATES.HELD,
        owner: event.owner,
        ok: true,
        code: null,
      };
    }
    case "acquire_conflict":
      return {
        status: LOCK_STATES.ACQUIRE_FAILED,
        owner,
        ok: false,
        code: "LOCK_HELD",
      };
    case "probe_ok":
      if (status !== LOCK_STATES.HELD || owner !== event.owner) {
        return {
          status: LOCK_STATES.PROBE_FAILED,
          owner,
          ok: false,
          code: "LOCK_NOT_HELD",
        };
      }
      return { status: LOCK_STATES.HELD, owner, ok: true, code: null };
    case "probe_lost":
    case "connection_lost":
      return {
        status: LOCK_STATES.CONNECTION_LOST,
        owner: null,
        ok: false,
        code: "LOCK_CONNECTION_LOST",
      };
    case "release_ok":
      return {
        status: LOCK_STATES.RELEASED,
        owner: null,
        ok: true,
        code: null,
      };
    case "release_after_lost":
      return {
        status: LOCK_STATES.CONNECTION_LOST,
        owner: null,
        ok: false,
        code: "LOCK_CONNECTION_LOST",
      };
    default:
      return {
        status: LOCK_STATES.PROBE_FAILED,
        owner,
        ok: false,
        code: "LOCK_EVENT_UNKNOWN",
      };
  }
}

export function createLockRegistry() {
  return { holder: null };
}

/**
 * Fake backend that understands LOCK_SQL. Does not open a socket.
 * Two controllers sharing a registry simulate two runner processes.
 */
export function createFakeAdvisorySession(registry) {
  if (!registry) fail("LOCK_REGISTRY_REQUIRED", "advisory session needs a registry");
  const session = {
    kind: "advisory-session",
    alive: true,
    async query(sql, params) {
      if (!session.alive) {
        fail("LOCK_CONNECTION_LOST", "lock session is not alive");
      }
      const text = String(sql);
      const classid = Number(params?.[0]);
      const objid = Number(params?.[1]);
      if (text.includes("pg_try_advisory_lock")) {
        if (
          registry.holder &&
          registry.holder !== session &&
          registry.holder.alive
        ) {
          return { rows: [{ acquired: false }], rowCount: 1 };
        }
        registry.holder = session;
        session._classid = classid;
        session._objid = objid;
        return { rows: [{ acquired: true }], rowCount: 1 };
      }
      if (text.includes("pg_advisory_unlock")) {
        const released = registry.holder === session;
        if (released) registry.holder = null;
        return { rows: [{ released }], rowCount: 1 };
      }
      if (text.includes("pg_locks")) {
        const granted =
          registry.holder === session &&
          session.alive &&
          session._classid === classid &&
          session._objid === objid;
        return { rows: granted ? [{ granted: true }] : [], rowCount: granted ? 1 : 0 };
      }
      fail("LOCK_SQL_UNEXPECTED", "fake session refused unknown SQL");
    },
    async end() {
      session.alive = false;
      if (registry.holder === session) registry.holder = null;
    },
    simulateConnectionLoss() {
      session.alive = false;
      if (registry.holder === session) registry.holder = null;
    },
  };
  return session;
}

export function createAdvisoryLock({ session, owner }) {
  if (!session) fail("LOCK_SESSION_REQUIRED", "advisory lock requires a session");
  let state = { status: LOCK_STATES.UNLOCKED, owner: null };
  const keys = [ADVISORY_LOCK_CLASSID, ADVISORY_LOCK_OBJID];
  const lockOwner = owner ?? "restore";

  async function acquire() {
    try {
      const result = await session.query(LOCK_SQL.acquire, keys);
      const acquired = Boolean(result?.rows?.[0]?.acquired);
      state = transitionLock(
        state,
        acquired
          ? { type: "acquire_ok", owner: lockOwner }
          : { type: "acquire_conflict", owner: lockOwner },
      );
      if (!state.ok) {
        const err = new Error("LOCK_ACQUIRE_FAILED: another restore holder is active");
        err.code = "LOCK_ACQUIRE_FAILED";
        throw err;
      }
      return { ok: true, scope: ADVISORY_LOCK_SCOPE, owner: lockOwner };
    } catch (err) {
      if (err?.code === "LOCK_CONNECTION_LOST" || err?.code === "LOCK_ACQUIRE_FAILED") {
        throw err;
      }
      const wrapped = new Error("LOCK_ACQUIRE_FAILED: lock session query failed");
      wrapped.code = "LOCK_ACQUIRE_FAILED";
      throw wrapped;
    }
  }

  async function probe() {
    if (!session.alive) {
      state = transitionLock(state, { type: "connection_lost", owner: lockOwner });
      fail("LOCK_CONNECTION_LOST", "lock session ended; in-flight work is uncertain");
    }
    try {
      const result = await session.query(LOCK_SQL.probe, keys);
      const granted = Boolean(result?.rows?.[0]?.granted);
      state = transitionLock(
        state,
        granted
          ? { type: "probe_ok", owner: lockOwner }
          : { type: "probe_lost", owner: lockOwner },
      );
      if (!state.ok) {
        fail("LOCK_CONNECTION_LOST", "advisory lock is not held; refusing to continue");
      }
      return { ok: true };
    } catch (err) {
      if (err?.code === "LOCK_CONNECTION_LOST") throw err;
      state = transitionLock(state, { type: "connection_lost", owner: lockOwner });
      fail("LOCK_CONNECTION_LOST", "lock probe failed; refusing to continue");
    }
  }

  async function release() {
    if (!session.alive) {
      state = transitionLock(state, { type: "release_after_lost" });
      return { ok: false, code: "LOCK_CONNECTION_LOST", released: false };
    }
    try {
      await session.query(LOCK_SQL.release, keys);
      state = transitionLock(state, { type: "release_ok" });
      return { ok: true, released: true };
    } catch {
      state = transitionLock(state, { type: "release_after_lost" });
      return { ok: false, code: "LOCK_CONNECTION_LOST", released: false };
    }
  }

  return {
    kind: "advisory",
    scope: ADVISORY_LOCK_SCOPE,
    plan: advisoryLockPlan(),
    getState: () => ({ ...state }),
    acquire,
    probe,
    release,
  };
}
