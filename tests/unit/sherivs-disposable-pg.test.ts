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
} from "../../scripts/lib/sherivs-disposable-pg.mjs";
import {
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF,
} from "../../scripts/lib/sherivs-db-target.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CLI = join(ROOT, "scripts/sherivs-001-qualify-disposable-pg.mjs");
const LOOPBACK = "postgresql://postgres:fixture-not-a-secret@127.0.0.1:54322/postgres";
const LOCALHOST = "postgresql://postgres:fixture-not-a-secret@localhost:5432/postgres";
const PRODUCTION_URL = `postgresql://postgres.${PRODUCTION_PROJECT_REF}:fixture-not-a-secret@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`;
const STAGING_URL = `postgresql://postgres:fixture-not-a-secret@db.${STAGING_PROJECT_REF}.supabase.co:5432/postgres`;
const NAMED_REMOTE = "postgresql://postgres:fixture-not-a-secret@db.example.com:5432/postgres";

const require = createRequire(import.meta.url);

describe("disposable PostgreSQL isolation qualifier (no sockets)", () => {
  it("does not import the pg client", () => {
    const src = require("node:fs").readFileSync(
      join(ROOT, "scripts/lib/sherivs-disposable-pg.mjs"),
      "utf8",
    );
    expect(src).not.toMatch(/from ["']pg["']/);
    expect(src).not.toMatch(/new \w+\.Client/);
    expect(src).toContain("does not open sockets");
  });

  it("does not treat a LOCAL_DATABASE_URL name as proof of isolation", () => {
    const result = qualifyDisposablePostgres({
      SHERIVS_DATABASE_TARGET: "development",
      LOCAL_DATABASE_URL: PRODUCTION_URL,
    });
    expect(result.qualified).toBe(false);
    expect(result.endpoint?.loopback).toBe(false);
    expect(result.code).toBe("DISPOSABLE_PRODUCTION_REF");
  });

  it("qualifies only an explicit development target with a loopback host", () => {
    const result = qualifyDisposablePostgres({
      SHERIVS_DATABASE_TARGET: "development",
      SHERIVS_DISPOSABLE_DATABASE_URL: LOOPBACK,
    });
    expect(result.qualified).toBe(true);
    expect(result.connects).toBe(false);
    expect(result.endpoint).toEqual({
      protocol: "postgresql",
      host: "127.0.0.1",
      port: "54322",
      loopback: true,
      hostedSupabase: false,
      refs: { production: false, staging: false },
    });
  });

  it("accepts localhost as loopback", () => {
    const result = qualifyDisposablePostgres({
      SHERIVS_DATABASE_TARGET: "development",
      SHERIVS_DISPOSABLE_DATABASE_URL: LOCALHOST,
    });
    expect(result.qualified).toBe(true);
    expect(result.endpoint?.host).toBe("localhost");
  });

  it("refuses staging and production targets even with a loopback URL", () => {
    for (const target of ["staging", "production"]) {
      const result = qualifyDisposablePostgres({
        SHERIVS_DATABASE_TARGET: target,
        SHERIVS_DISPOSABLE_DATABASE_URL: LOOPBACK,
      });
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
    const result = qualifyDisposablePostgres({
      SHERIVS_DATABASE_TARGET: "development",
      DATABASE_URL: LOOPBACK,
      STAGING_DATABASE_URL: STAGING_URL,
    });
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
