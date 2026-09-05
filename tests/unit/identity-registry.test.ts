/**
 * CoreGrid — Phase 02 cg_identity typed contract tests (P02 L2).
 *
 * Pins the pure contract of `identity-registry.ts` AND its coherence with the
 * live migration SQL (20260904020000_coregrid_l2_identity_tenancy.sql) so the
 * CHECK clauses and the TypeScript vocabulary can never drift apart.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  IDENTITY_KINDS,
  IDENTITY_STATES,
  identityDraft,
  isIdentityKind,
  isIdentityState,
} from "@/lib/identity-registry";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const MIGRATION = readFileSync(
  join(ROOT, "database/supabase/migrations/20260904020000_coregrid_l2_identity_tenancy.sql"),
  "utf8",
);

describe("identity-registry — cg_identity typed contract", () => {
  it("declares the canonical actor kinds", () => {
    expect(IDENTITY_KINDS).toEqual([
      "human",
      "organization",
      "agent",
      "service",
      "device",
      "runtime",
    ]);
  });

  it("declares lifecycle states that appear verbatim in the migration CHECK", () => {
    for (const state of IDENTITY_STATES) {
      expect(MIGRATION).toContain(`'${state}'`);
    }
    for (const kind of IDENTITY_KINDS) {
      expect(MIGRATION).toContain(`'${kind}'`);
    }
  });

  it("guards kinds and states", () => {
    expect(isIdentityKind("human")).toBe(true);
    expect(isIdentityKind("robot")).toBe(false);
    expect(isIdentityState("active")).toBe(true);
    expect(isIdentityState("deleted")).toBe(true);
    expect(isIdentityState("archived")).toBe(true);
    expect(isIdentityState("disabled")).toBe(false);
  });

  it("builds a row with defaults (state provisioned, verified false)", () => {
    const now = "2026-09-04T00:00:00.000Z";
    const row = identityDraft({ kind: "agent", displayName: "  Scheduler Agent  " }, now);
    expect(row).toEqual({
      kind: "agent",
      display_name: "Scheduler Agent",
      external_subject: null,
      entity_id: null,
      tenant_id: null,
      state: "provisioned",
      verified: false,
      created_at: now,
      updated_at: now,
    });
  });

  it("honours explicit state/verified/links and trims nullable fields", () => {
    const now = "2026-09-04T00:00:00.000Z";
    const row = identityDraft(
      {
        kind: "human",
        displayName: "Ada",
        externalSubject: "auth|123",
        entityId: "  ",
        tenantId: " school-a ",
        state: "active",
        verified: true,
      },
      now,
    );
    expect(row.external_subject).toBe("auth|123");
    expect(row.entity_id).toBeNull();
    expect(row.tenant_id).toBe("school-a");
    expect(row.state).toBe("active");
    expect(row.verified).toBe(true);
  });

  it("fails closed on unknown kinds, states and blank/over-long names", () => {
    // Invalid enum values are compile-time errors on the typed contract; the
    // `as never` casts here deliberately test the runtime guard layer.
    expect(() => identityDraft({ kind: "robot" as never, displayName: "x" }, "now")).toThrow();
    expect(() =>
      identityDraft({ kind: "human", displayName: "x", state: "disabled" as never }, "now"),
    ).toThrow();
    expect(() => identityDraft({ kind: "human", displayName: "   " }, "now")).toThrow();
    expect(() => identityDraft({ kind: "human", displayName: "a".repeat(201) }, "now")).toThrow();
  });
});
