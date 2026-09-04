/**
 * CoreGrid — P33 kernel ↔ database-tooling coherence tests.
 *
 * The universal kernel substrate is deny-by-default: RLS enabled, zero
 * policies, zero anon/authenticated grants (see kernel-purity.test.ts). The
 * database verification tooling (database/queries/rls-isolation-check.sql)
 * MUST agree with that posture or the two artifacts silently drift:
 *
 * - tables with RLS + zero policies are a FAIL only when anon/authenticated
 *   still hold grants (deny-by-default tables are safe without policies);
 * - kernel tables (cg_%) must have RLS enabled and zero anon/authenticated
 *   grants — verified explicitly.
 *
 * These tests are static coherence guards (the SQL itself runs only against a
 * live database via psql).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

const KERNEL_MIGRATION = join(
  ROOT,
  "database/supabase/migrations/20260903000000_coregrid_universal_kernel_substrate.sql",
);
const RLS_CHECK = join(ROOT, "database/queries/rls-isolation-check.sql");

describe("P33 kernel ↔ RLS isolation-check coherence", () => {
  it("declares the kernel migration and RLS check files", () => {
    expect(readFileSync(KERNEL_MIGRATION, "utf8").length).toBeGreaterThan(0);
    expect(readFileSync(RLS_CHECK, "utf8").length).toBeGreaterThan(0);
  });

  it("treats deny-by-default tables (RLS, zero policies, zero grants) as safe", () => {
    const sql = readFileSync(RLS_CHECK, "utf8");
    // The zero-policy FAIL now requires anon/authenticated grants to exist.
    expect(sql).toMatch(/ZERO policies/);
    expect(sql).toMatch(/deny-by-default/);
    expect(sql).toMatch(/HAVING count\(p\.policyname\) = 0 AND count\(g\.grantee\) > 0/);
  });

  it("explicitly enforces the kernel deny-by-default posture for cg_% tables", () => {
    const sql = readFileSync(RLS_CHECK, "utf8");
    expect(sql).toMatch(/kernel table .* RLS DISABLED/);
    expect(sql).toMatch(/table_name LIKE 'cg\\_%'/);
    expect(sql).toMatch(/g\.grantee IN \('anon','authenticated'\)/);
  });

  it("agrees with the kernel migration (REVOKE from anon/authenticated, RLS enabled)", () => {
    const migration = readFileSync(KERNEL_MIGRATION, "utf8");
    const check = readFileSync(RLS_CHECK, "utf8");
    expect(migration).toMatch(/REVOKE ALL ON TABLE public\.cg_entity/);
    expect(migration).toMatch(/FROM anon, authenticated/);
    expect(migration).toMatch(/ENABLE ROW LEVEL SECURITY/);
    // The check must never bless a migration that grants kernel tables to anon.
    expect(check).toMatch(/cg\\_%/);
    expect(migration).not.toMatch(/GRANT .*TO anon|GRANT .*TO authenticated/i);
  });
});
