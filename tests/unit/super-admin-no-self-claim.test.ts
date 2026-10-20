/**
 * SHERIVS-007 — no client path can create a super admin.
 *
 * (1) Code: the public /super-admin-bootstrap page and its server functions
 *     (checkPlatformBootstrap / claimFirstSuperAdmin) are gone, and no
 *     frontend source inserts/upserts into super_admins.
 * (2) Database: migration 20261020000140 revokes every client write path
 *     (anon: nothing; authenticated: SELECT + UPDATE(full_name) only; no
 *     INSERT/DELETE/ALL policy). The behavioral proof that an authenticated
 *     non-admin cannot become super admin against a real Postgres is
 *     tests/sql/super-admin-no-self-claim.sql (run on a local stack).
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(e)) out.push(full);
  }
  return out;
}

describe("no in-app super-admin self-claim (code)", () => {
  it("the bootstrap route is gone and not in the route tree", () => {
    expect(existsSync(join(ROOT, "frontend/src/routes/super-admin-bootstrap.tsx"))).toBe(false);
    expect(read("frontend/src/routeTree.gen.ts")).not.toContain("super-admin-bootstrap");
  });

  it("the bootstrap server functions are gone", () => {
    const src = read("frontend/src/lib/runtime/scholar/provisioning.functions.ts");
    expect(src).not.toMatch(/claimFirstSuperAdmin|checkPlatformBootstrap/);
  });

  it("no frontend source writes rows into super_admins", () => {
    const writer = /\.from\(\s*["'`]super_admins["'`]\s*\)\s*\.(insert|upsert|delete)\(/;
    for (const file of walk(join(ROOT, "frontend/src"))) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(writer);
    }
  });
});

describe("no client super-admin write path (database)", () => {
  const mig = read("database/supabase/migrations/20261020000140_sherivs_007_lock_super_admins.sql");

  it("revokes everything from anon and authenticated, then re-grants read + name update only", () => {
    expect(mig).toMatch(/REVOKE ALL ON TABLE public\.super_admins FROM anon;/);
    expect(mig).toMatch(/REVOKE ALL ON TABLE public\.super_admins FROM authenticated;/);
    expect(mig).toMatch(/GRANT SELECT ON TABLE public\.super_admins TO authenticated;/);
    expect(mig).toMatch(/GRANT UPDATE \(full_name\) ON TABLE public\.super_admins TO authenticated;/);
    expect(mig).not.toMatch(/GRANT[^;]*\b(INSERT|DELETE|TRUNCATE|ALL)\b[^;]*TO (anon|authenticated)/);
  });

  it("drops the FOR ALL client policy and adds no INSERT policy", () => {
    expect(mig).toMatch(/DROP POLICY IF EXISTS "Super admin manages super_admins"/);
    expect(mig).not.toMatch(/CREATE POLICY[^;]*FOR (ALL|INSERT|DELETE)/);
  });

  it("ships a behavioral SQL proof and a paste-ready prod lock", () => {
    const proof = read("tests/sql/super-admin-no-self-claim.sql");
    expect(proof).toMatch(/authenticated INSERT into empty super_admins refused/);
    expect(proof).toMatch(/ROLLBACK;/);
    expect(read("docs/ops/sql/lock-super-admin-bootstrap.sql")).toContain("20261020000140");
  });
});
