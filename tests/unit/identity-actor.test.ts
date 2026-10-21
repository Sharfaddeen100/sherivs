/**
 * Sherivs — Phase 02 identity actor context unit tests.
 *
 * Validates role parsing, platform vs school scope rules, and fail-closed
 * resolution of the runtime actor context (no silent nulls, no invented
 * roles, no platform actor forced into a school scope).
 */

import { describe, expect, it } from "vitest";
import {
  parseAppRole,
  isPlatformRole,
  resolveIdentityActor,
  actorScope,
  ALL_APP_ROLES,
  type IdentityActorSource,
} from "@/lib/identity-actor";

function source(overrides: Partial<IdentityActorSource> = {}): IdentityActorSource {
  return {
    userId: "user-1",
    email: "admin@school.example",
    role: "admin",
    schoolId: "school-a",
    isActive: true,
    ...overrides,
  };
}

describe("parseAppRole", () => {
  it("accepts every registered AppRole", () => {
    for (const role of ALL_APP_ROLES) {
      expect(parseAppRole(role)).toBe(role);
    }
  });

  it("rejects unknown, blank, and null roles", () => {
    expect(parseAppRole("owner")).toBeNull();
    expect(parseAppRole("  ")).toBeNull();
    expect(parseAppRole(null)).toBeNull();
  });
});

describe("isPlatformRole", () => {
  it("treats super_admin and hq as platform roles", () => {
    expect(isPlatformRole("super_admin")).toBe(true);
    expect(isPlatformRole("hq")).toBe(true);
    expect(isPlatformRole("admin")).toBe(false);
    expect(isPlatformRole("teacher")).toBe(false);
  });
});

describe("resolveIdentityActor", () => {
  it("resolves a school-scoped admin actor", () => {
    const result = resolveIdentityActor(source());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actor.role).toBe("admin");
      expect(result.actor.schoolId).toBe("school-a");
      expect(result.actor.isPlatform).toBe(false);
      expect(actorScope(result.actor)).toBe("school-a");
    }
  });

  it("resolves a platform super_admin without a school scope", () => {
    const result = resolveIdentityActor(source({ role: "super_admin", schoolId: null }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actor.isPlatform).toBe(true);
      expect(result.actor.schoolId).toBeNull();
      expect(actorScope(result.actor)).toBeNull();
    }
  });

  it("fails closed on a missing user id", () => {
    const result = resolveIdentityActor(source({ userId: " " }));
    expect(result.ok).toBe(false);
  });

  it("fails closed on an inactive identity", () => {
    const result = resolveIdentityActor(source({ isActive: false }));
    expect(result.ok).toBe(false);
  });

  it("fails closed on an unknown role", () => {
    const result = resolveIdentityActor(source({ role: "sysadmin" }));
    expect(result.ok).toBe(false);
  });

  it("requires a school id for school-scoped roles", () => {
    const result = resolveIdentityActor(source({ role: "teacher", schoolId: null }));
    expect(result.ok).toBe(false);
  });

  it("normalises whitespace email to null while keeping a valid school scope", () => {
    const result = resolveIdentityActor(source({ email: "  " }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actor.email).toBeNull();
      expect(result.actor.schoolId).toBe("school-a");
    }
  });

  it("fails closed for school roles when the school scope is blank or missing", () => {
    const failed = resolveIdentityActor(source({ schoolId: " " }));
    expect(failed.ok).toBe(false);
    const missing = resolveIdentityActor(source({ schoolId: null }));
    expect(missing.ok).toBe(false);
  });
});
