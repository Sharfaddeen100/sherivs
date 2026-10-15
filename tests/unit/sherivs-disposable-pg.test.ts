/**
 * Isolation qualifier for disposable PostgreSQL. These tests never connect.
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import {
  classifyConnectionString,
  qualifyDisposablePostgres,
  assertDisposablePostgres,
  DisposablePgError,
  DISPOSABLE_LIFECYCLE_ENV,
  DISPOSABLE_LIFECYCLE_ALLOWED,
} from "../../scripts/lib/sherivs-disposable-pg.mjs";
import {
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF,
} from "../../scripts/lib/sherivs-db-target.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CLI = join(ROOT, "scripts/sherivs-001-qualify-disposable-pg.mjs");
const LOOPBACK = "postgresql://postgres:fixture-not-a-secret@127.0.0.1:54322/postgres";
const LOCALHOST = "postgresql://postgres:fixture-not-a-secret@localhost:5432/postgres";
const IPV6_LOOPBACK = "postgresql://postgres:fixture-not-a-secret@[::1]:54322/postgres";
const PRODUCTION_URL = `postgresql://postgres.${PRODUCTION_PROJECT_REF}:fixture-not-a-secret@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`;
const STAGING_URL = `postgresql://postgres:fixture-not-a-secret@db.${STAGING_PROJECT_REF}.supabase.co:5432/postgres`;
const NAMED_REMOTE = "postgresql://postgres:fixture-not-a-secret@db.example.com:5432/postgres";

const require = createRequire(import.meta.url);

function developmentEnv(extra = {}) {
  return {
    SHERIVS_DATABASE_TARGET: "development",
    [DISPOSABLE_LIFECYCLE_ENV]: DISPOSABLE_LIFECYCLE_ALLOWED,
    SHERIVS_DISPOSABLE_DATABASE_URL: LOOPBACK,
    ...extra,
  };
}

describe("disposable PostgreSQL isolation qualifier (no sockets)", () => {
  it("does not import the pg client", () => {
    const src = require("node:fs").readFileSync(
      join(ROOT, "scripts/lib/sherivs-disposable-pg.mjs"),
      "utf8",
    );
    expect(src).not.toMatch(/from ["']pg["']/);
    expect(src).not.toMatch(/new \w+\.Client/);
    expect(src).toContain("does not open sockets");
    expect(src).toContain("hostaddr");
  });

  it("does not treat a LOCAL_DATABASE_URL name as proof of isolation", () => {
    const result = qualifyDisposablePostgres(developmentEnv({
      SHERIVS_DISPOSABLE_DATABASE_URL: undefined,
      LOCAL_DATABASE_URL: PRODUCTION_URL,
    }));
    expect(result.qualified).toBe(false);
    expect(result.endpoint?.loopback).toBe(false);
    expect(result.code).toBe("DISPOSABLE_PRODUCTION_REF");
  });

  it("qualifies only an explicit development target with a loopback host, explicit port, and lifecycle attestation", () => {
    const result = qualifyDisposablePostgres(developmentEnv());
    expect(result.qualified).toBe(true);
    expect(result.connects).toBe(false);
    expect(result.lifecycle).toBe("ephemeral-local");
    expect(result.endpoint).toEqual({
      protocol: "postgresql",
      host: "127.0.0.1",
      port: "54322",
      loopback: true,
      hostedSupabase: false,
      endpointOverrides: [],
      refs: { production: false, staging: false },
    });
  });

  it("accepts localhost as loopback", () => {
    const result = qualifyDisposablePostgres(developmentEnv({
      SHERIVS_DISPOSABLE_DATABASE_URL: LOCALHOST,
    }));
    expect(result.qualified).toBe(true);
    expect(result.endpoint?.host).toBe("localhost");
  });

  it("accepts IPv6 loopback [::1] with an explicit port", () => {
    const classified = classifyConnectionString(IPV6_LOOPBACK, "SHERIVS_DISPOSABLE_DATABASE_URL");
    expect(classified.qualified).toBe(true);
    expect(classified.loopback).toBe(true);
    expect(classified.port).toBe("54322");
    const result = qualifyDisposablePostgres(developmentEnv({
      SHERIVS_DISPOSABLE_DATABASE_URL: IPV6_LOOPBACK,
    }));
    expect(result.qualified).toBe(true);
    const host = String(result.endpoint?.host || "").replace(/^\[|\]$/g, "");
    expect(host).toBe("::1");
  });

  it("refuses staging and production targets even with a loopback URL", () => {
    for (const target of ["staging", "production"]) {
      const result = qualifyDisposablePostgres(developmentEnv({
        SHERIVS_DATABASE_TARGET: target,
      }));
      expect(result.qualified).toBe(false);
    }
  });

  it("refuses hosted Supabase and unknown remote hosts", () => {
    expect(classifyConnectionString(STAGING_URL, "STAGING_DATABASE_URL").code).toBe(
      "DISPOSABLE_STAGING_REF",
    );
    expect(classifyConnectionString(NAMED_REMOTE, "DATABASE_URL").qualified).toBe(false);
    expect(classifyConnectionString(NAMED_REMOTE, "DATABASE_URL").code).toBe(
      "DISPOSABLE_HOST_NOT_LOOPBACK",
    );
  });

  it("refuses unscoped DATABASE_URL while staging URL variables are present", () => {
    const result = qualifyDisposablePostgres(developmentEnv({
      SHERIVS_DISPOSABLE_DATABASE_URL: undefined,
      DATABASE_URL: LOOPBACK,
      STAGING_DATABASE_URL: STAGING_URL,
    }));
    expect(result.qualified).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/unscoped DATABASE_URL/);
  });

  it("assertDisposablePostgres throws without connecting", () => {
    expect(() => assertDisposablePostgres({})).toThrow(DisposablePgError);
  });

  it("CLI exits 2 and prints no userinfo when unqualified", () => {
    const spawned = spawnSync(process.execPath, [CLI], {
      env: {
        PATH: process.env.PATH,
        SHERIVS_DATABASE_TARGET: "development",
        DATABASE_URL: PRODUCTION_URL,
      },
      encoding: "utf8",
    });
    expect(spawned.status).toBe(2);
    expect(spawned.stdout).toContain('"qualified": false');
    expect(spawned.stdout).not.toMatch(/fixture-not-a-secret/);
    expect(spawned.stdout).not.toMatch(/postgres\./);
  });
});

describe("libpq endpoint-override and alias fail-closed cases (no sockets)", () => {
  it("refuses ?host= override even when the authority is loopback", () => {
    const url = `${LOOPBACK}?host=db.example.com`;
    const classified = classifyConnectionString(url, "SHERIVS_DISPOSABLE_DATABASE_URL");
    expect(classified.qualified).toBe(false);
    expect(classified.code).toBe("DISPOSABLE_ENDPOINT_OVERRIDE");
    expect(classified.endpointOverrides).toContain("host");
    expect(classified.host).toBe("127.0.0.1");
    const result = qualifyDisposablePostgres(developmentEnv({
      SHERIVS_DISPOSABLE_DATABASE_URL: url,
    }));
    expect(result.qualified).toBe(false);
    expect(result.code).toBe("DISPOSABLE_ENDPOINT_OVERRIDE");
  });

  it("refuses ?hostaddr= override even when the authority is loopback", () => {
    const url = `${LOOPBACK}?hostaddr=8.8.8.8`;
    const classified = classifyConnectionString(url, "SHERIVS_DISPOSABLE_DATABASE_URL");
    expect(classified.qualified).toBe(false);
    expect(classified.code).toBe("DISPOSABLE_ENDPOINT_OVERRIDE");
    expect(classified.endpointOverrides).toContain("hostaddr");
    const result = qualifyDisposablePostgres(developmentEnv({
      SHERIVS_DISPOSABLE_DATABASE_URL: url,
    }));
    expect(result.qualified).toBe(false);
  });

  it("refuses uppercase HOST/HOSTADDR/PORT query keys", () => {
    expect(classifyConnectionString(`${LOOPBACK}?HOST=db.example.com`).code).toBe(
      "DISPOSABLE_ENDPOINT_OVERRIDE",
    );
    expect(classifyConnectionString(`${LOOPBACK}?HOSTADDR=1.2.3.4`).code).toBe(
      "DISPOSABLE_ENDPOINT_OVERRIDE",
    );
    expect(classifyConnectionString(`${LOOPBACK}?PORT=5432`).code).toBe(
      "DISPOSABLE_ENDPOINT_OVERRIDE",
    );
  });

  it("refuses ?port= override even when it matches the authority port", () => {
    const url = `${LOOPBACK}?port=54322`;
    expect(classifyConnectionString(url).code).toBe("DISPOSABLE_ENDPOINT_OVERRIDE");
    expect(classifyConnectionString(url).qualified).toBe(false);
  });

  it("refuses a loopback-valued ?host= override so authority is the sole endpoint", () => {
    const url = `${LOOPBACK}?host=127.0.0.1`;
    expect(classifyConnectionString(url).code).toBe("DISPOSABLE_ENDPOINT_OVERRIDE");
  });

  it("refuses unix-socket ?host= paths attached to a loopback authority", () => {
    const url = `${LOOPBACK}?host=/var/run/postgresql`;
    expect(classifyConnectionString(url).code).toBe("DISPOSABLE_ENDPOINT_OVERRIDE");
  });

  it("refuses a missing explicit port", () => {
    const url = "postgresql://postgres:fixture-not-a-secret@127.0.0.1/postgres";
    expect(classifyConnectionString(url).code).toBe("DISPOSABLE_PORT_REQUIRED");
    expect(classifyConnectionString(url).qualified).toBe(false);
  });

  it("refuses hostname aliases and non-allowlisted loopback forms", () => {
    expect(classifyConnectionString(
      "postgresql://postgres:fixture-not-a-secret@localhost.:5432/postgres",
    ).code).toBe("DISPOSABLE_HOST_NOT_LOOPBACK");
    expect(classifyConnectionString(
      "postgresql://postgres:fixture-not-a-secret@127.0.0.2:5432/postgres",
    ).code).toBe("DISPOSABLE_HOST_NOT_LOOPBACK");
    expect(classifyConnectionString(
      "postgresql://postgres:fixture-not-a-secret@0.0.0.0:5432/postgres",
    ).code).toBe("DISPOSABLE_HOST_NOT_LOOPBACK");
    expect(classifyConnectionString(
      "postgresql://postgres:fixture-not-a-secret@[::ffff:127.0.0.1]:5432/postgres",
    ).code).toBe("DISPOSABLE_HOST_NOT_LOOPBACK");
    expect(classifyConnectionString(
      "postgresql://postgres:fixture-not-a-secret@127.1:5432/postgres",
    ).code).toBe("DISPOSABLE_HOST_NOT_LOOPBACK");
  });

  it("refuses unix-socket URLs with an empty authority host", () => {
    const url = "postgresql:///postgres?host=/tmp";
    const classified = classifyConnectionString(url);
    expect(classified.qualified).toBe(false);
    expect(classified.code).toBe("DISPOSABLE_URL_UNPARSEABLE");
  });

  it("refuses keyword=value DSNs instead of guessing a host", () => {
    const classified = classifyConnectionString(
      "host=127.0.0.1 port=5432 user=postgres password=fixture-not-a-secret dbname=postgres",
    );
    expect(classified.qualified).toBe(false);
    expect(classified.code).toBe("DISPOSABLE_URL_UNPARSEABLE");
    expect(classified.host).toBeNull();
  });

  it("fails closed when userinfo contains an unencoded @ that yields a remote host", () => {
    const classified = classifyConnectionString(
      "postgresql://u:p@ss@db.example.com:5432/postgres",
    );
    expect(classified.qualified).toBe(false);
    expect(["DISPOSABLE_HOST_NOT_LOOPBACK", "DISPOSABLE_URL_UNPARSEABLE"]).toContain(
      classified.code,
    );
  });

  it("treats userinfo that looks like loopback as userinfo when the host is remote", () => {
    const classified = classifyConnectionString(
      "postgresql://127.0.0.1:5432@db.example.com:5432/postgres",
    );
    expect(classified.qualified).toBe(false);
    expect(classified.loopback).toBe(false);
  });

  it("refuses non-postgres protocols even on loopback", () => {
    expect(classifyConnectionString("http://127.0.0.1:5432/postgres").code).toBe(
      "DISPOSABLE_PROTOCOL_UNSUPPORTED",
    );
  });

  it("allows sslmode=disable on an otherwise qualified loopback URL", () => {
    const url = `${LOOPBACK}?sslmode=disable`;
    expect(classifyConnectionString(url).qualified).toBe(true);
    expect(classifyConnectionString(url).endpointOverrides).toEqual([]);
  });

  it("does not qualify loopback without an ephemeral-local lifecycle attestation", () => {
    const missing = qualifyDisposablePostgres({
      SHERIVS_DATABASE_TARGET: "development",
      SHERIVS_DISPOSABLE_DATABASE_URL: LOOPBACK,
    });
    expect(missing.qualified).toBe(false);
    expect(missing.code).toBe("DISPOSABLE_LIFECYCLE_REQUIRED");

    const empty = qualifyDisposablePostgres({
      SHERIVS_DATABASE_TARGET: "development",
      SHERIVS_DISPOSABLE_DATABASE_URL: LOOPBACK,
      [DISPOSABLE_LIFECYCLE_ENV]: "   ",
    });
    expect(empty.qualified).toBe(false);
    expect(empty.code).toBe("DISPOSABLE_LIFECYCLE_REQUIRED");

    const other = qualifyDisposablePostgres({
      SHERIVS_DATABASE_TARGET: "development",
      SHERIVS_DISPOSABLE_DATABASE_URL: LOOPBACK,
      [DISPOSABLE_LIFECYCLE_ENV]: "ssh-tunnel",
    });
    expect(other.qualified).toBe(false);
    expect(other.code).toBe("DISPOSABLE_LIFECYCLE_REFUSED");
  });

  it("does not treat NODE_ENV or APP_ENV as lifecycle proof", () => {
    const result = qualifyDisposablePostgres({
      SHERIVS_DATABASE_TARGET: "development",
      NODE_ENV: "development",
      APP_ENV: "development",
      SHERIVS_DISPOSABLE_DATABASE_URL: LOOPBACK,
    });
    expect(result.qualified).toBe(false);
    expect(result.code).toBe("DISPOSABLE_LIFECYCLE_REQUIRED");
  });
});
