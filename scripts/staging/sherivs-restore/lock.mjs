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
 * Capability boundary:
 * - `kind: "advisory"` on an arbitrary object is **not** proof that a
 *   PostgreSQL advisory lock is held.
 * - Writable public fields (`liveCapable`, `authenticity`) are **not**
 *   proof. Live capability is a module-scoped WeakSet membership that
 *   no public factory in this mission can populate.
 * - Only controllers minted by this module's official factories are trusted.
 * - The official offline factory issues `authenticity: "fake-offline"`
 *   controllers. They may be used with mock/offline connectors only.
 * - Spreading or copying an official controller drops WeakSet identity
 *   and the non-enumerable brand.
 * - A genuine PostgreSQL lock-session implementation is **not** provided
 *   here. `createLivePostgresLockSession` throws
 *   LIVE_LOCK_SESSION_NOT_AUTHORIZED and never brands a controller.
 * - Live execution (allowNetwork / live connector) requires
 *   `isLiveCapableLockController`, which is unsatisfiable in this mission.
 *
 * Limitation: this is in-process trust. A later edit of this module could
 * add to the live WeakSet. That is a change-control event, not a runtime
 * override. Property assignment, object literals, and copies cannot mint
 * the capability.
 *
 * This module does not open a network connection.
 */

import {
  ADVISORY_LOCK_CLASSID,
  ADVISORY_LOCK_OBJID,
  ADVISORY_LOCK_SCOPE,
  LIVE_LOCK_SESSION_CODE,
} from "./constants.mjs";

const AUTHENTIC_LOCKS = new WeakSet();
const LIVE_CAPABLE_LOCKS = new WeakSet();
const LOCK_BRAND = Symbol("sherivs.advisoryLock");
const LOCK_CAPABILITY = Symbol("sherivs.lockCapability");

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

export const LOCK_AUTHENTICITY = Object.freeze({
  FAKE_OFFLINE: "fake-offline",
  POSTGRES_SESSION: "postgres-session",
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
    authenticityRequired: LOCK_AUTHENTICITY.POSTGRES_SESSION,
    liveImplementation: "unavailable",
    liveCode: "LIVE_LOCK_SESSION_NOT_AUTHORIZED",
    stubKindIsNotProof:
      "an object with kind:advisory is not a PostgreSQL advisory lock",
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
    authenticity: LOCK_AUTHENTICITY.FAKE_OFFLINE,
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

function defineImmutable(lock, key, value, enumerable) {
  Object.defineProperty(lock, key, {
    value,
    enumerable,
    configurable: false,
    writable: false,
  });
}

/**
 * Brand an official controller. Live capability is a separate WeakSet
 * that this function never writes. Public fields are non-writable so
 * assignment cannot impersonate a live session.
 */
function brandLock(lock, capability) {
  const authenticity =
    capability === LOCK_AUTHENTICITY.POSTGRES_SESSION
      ? LOCK_AUTHENTICITY.POSTGRES_SESSION
      : LOCK_AUTHENTICITY.FAKE_OFFLINE;
  defineImmutable(lock, LOCK_BRAND, true, false);
  defineImmutable(lock, LOCK_CAPABILITY, authenticity, false);
  defineImmutable(lock, "kind", "advisory", true);
  defineImmutable(lock, "authenticity", authenticity, true);
  defineImmutable(lock, "liveCapable", authenticity === LOCK_AUTHENTICITY.POSTGRES_SESSION, true);
  AUTHENTIC_LOCKS.add(lock);
  return lock;
}

/**
 * Intentionally unused. No public or internal caller in this mission
 * may populate LIVE_CAPABLE_LOCKS.
 */
function markLiveCapable() {
  fail(
    LIVE_LOCK_SESSION_CODE,
    "no live lock capability can be minted in this mission; LIVE_CAPABLE_LOCKS stays empty",
  );
}

/**
 * Official lock controller. This factory never opens PostgreSQL.
 * Issued controllers are `fake-offline` and are not live-execution capable.
 */
export function createAdvisoryLock({ session, owner, authenticity } = {}) {
  if (!session) fail("LOCK_SESSION_REQUIRED", "advisory lock requires a session");
  const auth = authenticity ?? LOCK_AUTHENTICITY.FAKE_OFFLINE;
  if (auth === LOCK_AUTHENTICITY.POSTGRES_SESSION) {
    fail(
      LIVE_LOCK_SESSION_CODE,
      "this factory cannot mint a PostgreSQL lock session",
    );
  }
  if (auth !== LOCK_AUTHENTICITY.FAKE_OFFLINE) {
    fail("LOCK_AUTHENTICITY_REFUSED", `authenticity ${auth} is not issued by this factory`);
  }

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
        fail("LOCK_ACQUIRE_FAILED", "another restore holder is active");
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

  return brandLock(
    {
      scope: ADVISORY_LOCK_SCOPE,
      plan: advisoryLockPlan(),
      getState: () => ({ ...state }),
      acquire,
      probe,
      release,
    },
    LOCK_AUTHENTICITY.FAKE_OFFLINE,
  );
}

/**
 * Genuine PostgreSQL advisory-lock session. Not implemented in this mission.
 */
export function createLivePostgresLockSession() {
  fail(
    LIVE_LOCK_SESSION_CODE,
    "a reviewed PostgreSQL advisory-lock session is not implemented; do not substitute a fake kind:advisory stub",
  );
}

export function isAuthenticLockController(lock) {
  return Boolean(lock) && AUTHENTIC_LOCKS.has(lock) && lock[LOCK_BRAND] === true;
}

/**
 * Live capability is WeakSet membership, not a public field.
 * This mission never adds a controller to LIVE_CAPABLE_LOCKS.
 */
export function isLiveCapableLockController(lock) {
  return (
    isAuthenticLockController(lock) &&
    LIVE_CAPABLE_LOCKS.has(lock) &&
    lock[LOCK_CAPABILITY] === LOCK_AUTHENTICITY.POSTGRES_SESSION
  );
}

/**
 * Capability check. `kind: "advisory"` is not sufficient.
 *
 * @param {object} lock
 * @param {{ requireLiveCapable?: boolean }} [options]
 */
export function assertTrustedLockController(lock, options = {}) {
  if (!lock) {
    fail(
      "LOCK_REQUIRED",
      "execute requires an advisory lock controller; a process-local mutex is not sufficient",
    );
  }
  if (lock.kind === "mutex" || lock.kind === "memory") {
    fail(
      "LOCK_NOT_DISTRIBUTED",
      "process-local lock is not sufficient for multiple runner processes",
    );
  }
  if (!isAuthenticLockController(lock)) {
    fail(
      "LOCK_CONTROLLER_UNTRUSTED",
      "kind:advisory is not proof that a PostgreSQL advisory lock is held; controller was not minted by the official factory",
    );
  }
  if (lock.kind !== "advisory") {
    fail("LOCK_KIND_REFUSED", `lock kind ${lock.kind} is not advisory`);
  }
  if (typeof lock.acquire !== "function" || typeof lock.probe !== "function") {
    fail("LOCK_CONTROLLER_MALFORMED", "authentic lock must expose acquire and probe");
  }
  if (options.requireLiveCapable) {
    if (!isLiveCapableLockController(lock)) {
      fail(
        "LOCK_LIVE_CAPABILITY_UNSATISFIED",
        "a fake or offline advisory lock cannot satisfy the live-execution capability; writable liveCapable/authenticity fields are not proof",
      );
    }
  }
  return lock;
}
