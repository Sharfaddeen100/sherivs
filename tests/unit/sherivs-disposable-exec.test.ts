/**
 * Disposable execution harness. These tests never connect and never execute SQL.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import {
  DISPOSABLE_EXECUTE_ALLOWED,
  DISPOSABLE_EXECUTE_ENV,
  DISPOSABLE_EXECUTE_SHA_ENV,
  DISPOSABLE_LIVE_EXECUTE_ENABLED,
  DISPOSABLE_URL_ENV,
  DISPOSABLE_WRAPS_OUTER_TRANSACTION,
  FORBIDDEN_URL_ENV_NAMES,
  PINNED_FORWARD,
  PINNED_ROLLBACK,
  decideDisposableExecution,
  planDisposableExecution,
  runDisposableExecution,
} from "../../scripts/lib/sherivs-disposable-exec.mjs";
import {
  DISPOSABLE_LIFECYCLE_ALLOWED,
  DISPOSABLE_LIFECYCLE_ENV,
} from "../../scripts/lib/sherivs-disposable-pg.mjs";
import {
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF,
} from "../../scripts/lib/sherivs-db-target.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CLI = join(ROOT, "scripts/sherivs-001-disposable-exec.mjs");
const LOOPBACK = "postgresql://postgres:fixture-not-a-secret@127.0.0.1:54322/postgres";
const PRODUCTION_URL = `postgresql://postgres.${PRODUCTION_PROJECT_REF}:fixture-not-a-secret@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`;
const require = createRequire(import.meta.url);

function sha256File(relativePath: string) {
  return createHash("sha256").update(readFileSync(join(ROOT, relativePath))).digest("hex");
}

function qualifiedEnv(extra: Record<string, string | undefined> = {}) {
  return {
    SHERIVS_DATABASE_TARGET: "development",
    [DISPOSABLE_LIFECYCLE_ENV]: DISPOSABLE_LIFECYCLE_ALLOWED,
    [DISPOSABLE_URL_ENV]: LOOPBACK,
    ...extra,
  };
}

function authorizedEnv(extra: Record<string, string | undefined> = {}) {
  return qualifiedEnv({
    [DISPOSABLE_EXECUTE_ENV]: DISPOSABLE_EXECUTE_ALLOWED,
    [DISPOSABLE_EXECUTE_SHA_ENV]: PINNED_FORWARD.sha256,
    ...extra,
  });
}

describe("disposable execution harness (no sockets, no SQL)", () => {
  it("does not import pg and does not wrap an outer BEGIN", () => {
    const src = require("node:fs").readFileSync(
      join(ROOT, "scripts/lib/sherivs-disposable-exec.mjs"),
      "utf8",
    );
    expect(src).not.toMatch(/from ["']pg["']/);
    expect(src).not.toMatch(/await import\(["']pg["']\)/);
    expect(src).not.toMatch(/client\.query\(["']BEGIN["']\)/);
    expect(DISPOSABLE_LIVE_EXECUTE_ENABLED).toBe(false);
    expect(DISPOSABLE_WRAPS_OUTER_TRANSACTION).toBe(false);
    expect(src).toContain("does not import `pg`");
    expect(src).toContain("Qualification is not permission to execute");
  });

  it("CLI does not import pg", () => {
    const src = require("node:fs").readFileSync(CLI, "utf8");
    expect(src).not.toMatch(/from ["']pg["']/);
    expect(src).toContain("Never uses DATABASE_URL");
  });

  it("pins the proposed forward and rollback SHA-256 values currently on disk", () => {
    expect(sha256File(PINNED_FORWARD.relativePath)).toBe(PINNED_FORWARD.sha256);
    expect(sha256File(PINNED_ROLLBACK.relativePath)).toBe(PINNED_ROLLBACK.sha256);
    const plan = planDisposableExecution(qualifiedEnv());
    expect(plan.artifacts).toHaveLength(2);
    expect(plan.artifacts.every((item) => item.shaMatches)).toBe(true);
    expect(plan.artifacts.every((item) => item.hasBegin && item.hasCommit)).toBe(true);
  });

  it("inspects without treating qualification as execute authorization", () => {
    const plan = planDisposableExecution(qualifiedEnv());
    expect(plan.operation).toBe("inspect");
    expect(plan.qualified).toBe(true);
    expect(plan.authorized).toBe(false);
    expect(plan.connects).toBe(false);
    expect(plan.connected).toBe(false);
    expect(plan.liveExecuteEnabled).toBe(false);
    expect(plan.qualification.connects).toBe(false);
    expect(plan.requalification.matchesFirst).toBe(true);
    expect(plan.candidate).toBe(DISPOSABLE_URL_ENV);
    expect(decideDisposableExecution(plan)).toEqual({
      action: "report",
      code: "DISPOSABLE_INSPECT_OK",
    });
  });

  it("never falls back to DATABASE_URL", () => {
    const viaFallback = planDisposableExecution({
      SHERIVS_DATABASE_TARGET: "development",
      [DISPOSABLE_LIFECYCLE_ENV]: DISPOSABLE_LIFECYCLE_ALLOWED,
      DATABASE_URL: LOOPBACK,
    });
    expect(viaFallback.qualified).toBe(false);
    expect(viaFallback.gates.noForbiddenUrlEnv).toBe(false);
    expect(viaFallback.reasons.join(" ")).toMatch(/DATABASE_URL/);
    expect(viaFallback.qualification.candidate).toBeNull();
  });

  it("refuses mixed shells that still have live or unscoped URL variables", () => {
    const plan = planDisposableExecution(qualifiedEnv({
      DATABASE_URL: PRODUCTION_URL,
    }));
    expect(plan.qualified).toBe(false);
    expect(plan.gates.noForbiddenUrlEnv).toBe(false);
    expect(FORBIDDEN_URL_ENV_NAMES).toContain("DATABASE_URL");
  });

  it("refuses production and staging project refs in URL or SUPABASE_URL env names", () => {
    const prod = planDisposableExecution(qualifiedEnv({
      [DISPOSABLE_URL_ENV]: PRODUCTION_URL,
    }));
    expect(prod.qualified).toBe(false);
    expect(prod.qualification.code).toBe("DISPOSABLE_PRODUCTION_REF");

    const stagingUrl = `postgresql://postgres:fixture-not-a-secret@db.${STAGING_PROJECT_REF}.supabase.co:5432/postgres`;
    const staging = planDisposableExecution(qualifiedEnv({
      [DISPOSABLE_URL_ENV]: stagingUrl,
    }));
    expect(staging.qualified).toBe(false);

    const supabase = planDisposableExecution(qualifiedEnv({
      SUPABASE_URL: `https://${PRODUCTION_PROJECT_REF}.supabase.co`,
    }));
    expect(supabase.qualified).toBe(false);
    expect(supabase.gates.noLiveProjectRefEnv).toBe(false);
  });

  it("refuses arbitrary SQL environment variables", () => {
    const plan = planDisposableExecution(qualifiedEnv({
      SHERIVS_DISPOSABLE_SQL: "DROP TABLE public.users;",
    }));
    expect(plan.qualified).toBe(false);
    expect(plan.gates.noArbitrarySqlEnv).toBe(false);
  });

  it("does not apply every file in the migrations directory", () => {
    const src = require("node:fs").readFileSync(
      join(ROOT, "scripts/lib/sherivs-disposable-exec.mjs"),
      "utf8",
    );
    expect(src).not.toMatch(/readdirSync/);
    const plan = planDisposableExecution(authorizedEnv(), {
      operation: "apply-proposed-freeze",
    });
    expect(plan.selectedArtifact?.relativePath).toBe(PINNED_FORWARD.relativePath);
    expect(plan.artifacts).toHaveLength(2);
  });

  it("qualification success does not authorize apply", async () => {
    const plan = planDisposableExecution(qualifiedEnv(), {
      operation: "apply-proposed-freeze",
    });
    expect(plan.qualified).toBe(true);
    expect(plan.authorized).toBe(false);
    expect(plan.code).toBe("DISPOSABLE_EXECUTE_NOT_AUTHORIZED");
    expect(decideDisposableExecution(plan).action).toBe("refuse");
    const ran = await runDisposableExecution(qualifiedEnv(), {
      operation: "apply-proposed-freeze",
      connectFactory: async () => {
        throw new Error("connectFactory must not run");
      },
    });
    expect(ran.connected).toBe(false);
    expect(ran.executedSql).toBe(false);
    expect(ran.code).toBe("DISPOSABLE_EXECUTE_NOT_AUTHORIZED");
  });

  it("authorized apply is still refused while live execute is disabled", async () => {
    let factoryCalls = 0;
    const ran = await runDisposableExecution(authorizedEnv(), {
      operation: "apply-proposed-freeze",
      connectFactory: async () => {
        factoryCalls += 1;
        throw new Error("connectFactory must not run");
      },
    });
    expect(ran.qualified).toBe(true);
    expect(ran.authorized).toBe(true);
    expect(ran.gates.shaPinned).toBe(true);
    expect(ran.code).toBe("DISPOSABLE_LIVE_EXECUTE_NOT_ENABLED");
    expect(ran.connected).toBe(false);
    expect(ran.executedSql).toBe(false);
    expect(factoryCalls).toBe(0);
    expect(decideDisposableExecution(ran).code).toBe("DISPOSABLE_LIVE_EXECUTE_NOT_ENABLED");
  });

  it("refuses apply when the offered SHA-256 does not match the pin", () => {
    const plan = planDisposableExecution(authorizedEnv({
      [DISPOSABLE_EXECUTE_SHA_ENV]: "0".repeat(64),
    }), { operation: "apply-proposed-freeze" });
    expect(plan.code).toBe("DISPOSABLE_SHA_MISMATCH");
    expect(plan.gates.shaPinned).toBe(false);
  });

  it("refuses unknown operations instead of scanning for SQL files", () => {
    const plan = planDisposableExecution(qualifiedEnv(), { operation: "apply-all" });
    expect(plan.code).toBe("DISPOSABLE_OPERATION_REFUSED");
    expect(plan.connects).toBe(false);
  });

  it("decide() would allow connect only when every gate is true", () => {
    const ready = decideDisposableExecution({
      operation: "apply-proposed-freeze",
      wrapsOuterTransaction: false,
      gates: {
        qualified: true,
        authorized: true,
        shaPinned: true,
        liveExecuteEnabled: true,
        connectorInjected: true,
      },
    });
    expect(ready).toEqual({ action: "connect", code: "DISPOSABLE_APPLY_READY" });
    const wrapped = decideDisposableExecution({
      operation: "apply-proposed-freeze",
      wrapsOuterTransaction: true,
      gates: {
        qualified: true,
        authorized: true,
        shaPinned: true,
        liveExecuteEnabled: true,
        connectorInjected: true,
      },
    });
    expect(wrapped.code).toBe("DISPOSABLE_OUTER_TRANSACTION_REFUSED");
  });

  it("CLI inspect prints no userinfo and does not connect", () => {
    const spawned = spawnSync(process.execPath, [CLI, "--operation=inspect"], {
      env: {
        PATH: process.env.PATH,
        SHERIVS_DATABASE_TARGET: "development",
        DATABASE_URL: PRODUCTION_URL,
      },
      encoding: "utf8",
    });
    expect(spawned.status).toBe(0);
    expect(spawned.stdout).toContain('"operation": "inspect"');
    expect(spawned.stdout).toContain('"connected": false');
    expect(spawned.stdout).toContain('"executedSql": false');
    expect(spawned.stdout).toContain('"qualified": false');
    expect(spawned.stdout).not.toMatch(/fixture-not-a-secret/);
    expect(spawned.stdout).not.toMatch(/postgres\./);
  });

  it("CLI apply-proposed-freeze exits 2 without connecting even when authorized", () => {
    const spawned = spawnSync(process.execPath, [CLI, "--operation=apply-proposed-freeze"], {
      env: {
        PATH: process.env.PATH,
        SHERIVS_DATABASE_TARGET: "development",
        [DISPOSABLE_LIFECYCLE_ENV]: DISPOSABLE_LIFECYCLE_ALLOWED,
        [DISPOSABLE_URL_ENV]: LOOPBACK,
        [DISPOSABLE_EXECUTE_ENV]: DISPOSABLE_EXECUTE_ALLOWED,
        [DISPOSABLE_EXECUTE_SHA_ENV]: PINNED_FORWARD.sha256,
      },
      encoding: "utf8",
    });
    expect(spawned.status).toBe(2);
    expect(spawned.stdout).toContain("DISPOSABLE_LIVE_EXECUTE_NOT_ENABLED");
    expect(spawned.stdout).toContain('"connected": false');
    expect(spawned.stdout).not.toMatch(/fixture-not-a-secret/);
  });
});
