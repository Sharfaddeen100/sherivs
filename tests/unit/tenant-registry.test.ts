/**
 * Sherivs — Phase 03 cg_tenant typed contract tests (P03 L2).
 *
 * Pins the pure contract of `tenant-registry.ts` AND its coherence with the
 * live migration SQL (20260904020000_coregrid_l2_identity_tenancy.sql) so the
 * H2 status enum, environment CHECK and the TypeScript vocabulary cannot drift.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TENANT_ENVIRONMENTS,
  TENANT_STATUSES,
  isTenantEnvironment,
  isTenantStatus,
  tenantDraft,
} from "@/lib/tenant-registry";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const MIGRATION = readFileSync(
  join(ROOT, "database/supabase/migrations/20260904020000_coregrid_l2_identity_tenancy.sql"),
  "utf8",
);

describe("tenant-registry — cg_tenant typed contract", () => {
  it("declares the H2 status lifecycle", () => {
    expect(TENANT_STATUSES).toEqual([
      "PROVISIONING",
      "ACTIVE",
      "RESTRICTED",
      "SUSPENDED",
      "MIGRATING",
      "ARCHIVED",
      "TERMINATING",
      "TERMINATED",
    ]);
  });

  it("declares statuses/environments that appear verbatim in the migration CHECK", () => {
    for (const status of TENANT_STATUSES) {
      expect(MIGRATION).toContain(`'${status}'`);
    }
    for (const env of TENANT_ENVIRONMENTS) {
      expect(MIGRATION).toContain(`'${env}'`);
    }
  });

  it("guards statuses and environments", () => {
    expect(isTenantStatus("ACTIVE")).toBe(true);
    expect(isTenantStatus("active")).toBe(false);
    expect(isTenantStatus("PROVISIONING")).toBe(true);
    expect(isTenantEnvironment("development")).toBe(true);
    expect(isTenantEnvironment("production")).toBe(true);
    expect(isTenantEnvironment("dev")).toBe(false);
  });

  it("builds a row with defaults (status PROVISIONING, environment development)", () => {
    const now = "2026-09-04T00:00:00.000Z";
    const row = tenantDraft(
      { tenantType: "platform", name: "  Root Org  ", slug: "root-org" },
      now,
    );
    expect(row).toEqual({
      tenant_type: "platform",
      name: "Root Org",
      slug: "root-org",
      status: "PROVISIONING",
      parent_tenant_id: null,
      region: null,
      environment: "development",
      created_at: now,
      updated_at: now,
    });
  });

  it("preserves the hierarchy link and explicit fields", () => {
    const now = "2026-09-04T00:00:00.000Z";
    const row = tenantDraft(
      {
        tenantType: "platform",
        name: "Child",
        slug: "child-1",
        status: "ACTIVE",
        parentTenantId: "00000000-0000-0000-0000-000000000001",
        region: "eu-west-1",
        environment: "staging",
      },
      now,
    );
    expect(row.parent_tenant_id).toBe("00000000-0000-0000-0000-000000000001");
    expect(row.status).toBe("ACTIVE");
    expect(row.region).toBe("eu-west-1");
    expect(row.environment).toBe("staging");
  });

  it("fails closed on unknown statuses/environments and malformed slugs", () => {
    const base = { tenantType: "platform", name: "X", slug: "x-1" };
    // `as never` casts deliberately test the runtime guard layer.
    expect(() => tenantDraft({ ...base, status: "LIVE" as never }, "now")).toThrow();
    expect(() => tenantDraft({ ...base, environment: "dev" as never }, "now")).toThrow();
    expect(() => tenantDraft({ ...base, slug: "UPPER" }, "now")).toThrow();
    expect(() => tenantDraft({ ...base, slug: "" }, "now")).toThrow();
    expect(() => tenantDraft({ ...base, name: "   " }, "now")).toThrow();
  });
});
