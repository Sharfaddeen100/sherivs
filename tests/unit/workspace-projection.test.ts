/**
 * CoreGrid — Phase 06 Workspace Engine: composition projection tests.
 *
 * The workspace must be a projection of authority, so these tests assert the
 * property that matters rather than snapshots: every item a role receives is one
 * the role's capabilities allow, and nothing else. An empty workspace stays empty.
 */
import { describe, expect, it } from "vitest";

import {
  projectWorkspace,
  projectWorkspaces,
  projectionMatrix,
} from "@/lib/workspace-projection";
import { scholarCapabilitiesForRole } from "@/lib/workspace-engine/nav-catalog";
import type { AppRole } from "@/lib/roles";

const ROLES: readonly AppRole[] = ["admin", "teacher", "student", "parent"];

describe("Phase 06 — the workspace is computed from authorization", () => {
  it("grants only items the role's capabilities allow", () => {
    for (const role of ROLES) {
      const capabilities = scholarCapabilitiesForRole(role);
      const projection = projectWorkspace(role);

      for (const section of projection.sections) {
        for (const item of section.items) {
          for (const required of item.capabilities ?? []) {
            expect(
              capabilities.has(required),
              `role ${role} received ${item.key} without capability ${required}`,
            ).toBe(true);
          }
        }
      }
      expect(projection.capabilityCount).toBe(capabilities.size);
      expect(projection.itemCount).toBe(
        projection.sections.reduce((total, section) => total + section.items.length, 0),
      );
    }
  });

  it("never duplicates an item across sections", () => {
    for (const role of ROLES) {
      const keys = projectWorkspace(role).sections.flatMap((section) =>
        section.items.map((item) => item.key),
      );
      expect(new Set(keys).size, `role ${role} has duplicate navigation keys`).toBe(keys.length);
    }
  });

  it("states an empty workspace instead of inventing destinations", () => {
    for (const role of ROLES) {
      const projection = projectWorkspace(role);
      if (projection.empty) {
        expect(projection.itemCount).toBe(0);
        expect(projection.home).toBeNull();
      } else {
        expect(projection.home, `role ${role} must resolve a home when it has items`).toBeTruthy();
      }
    }
  });

  it("resolves home and quick navigation consistently with the sections", () => {
    for (const role of ROLES) {
      const projection = projectWorkspace(role);
      const keys = projection.sections.flatMap((section) => section.items.map((item) => item.key));
      for (const quickKey of projection.quickNavKeys) {
        expect(keys, `role ${role} quick nav ${quickKey} must exist in its sections`).toContain(
          quickKey,
        );
      }
      expect(projection.quickNavKeys.length).toBeLessThanOrEqual(5);
    }
  });
});

describe("Phase 06 — projections are deterministic and auditable", () => {
  it("returns the same composition for the same roles, in order", () => {
    const first = projectWorkspaces(ROLES).map((projection) => projection.itemCount);
    const second = projectWorkspaces(ROLES).map((projection) => projection.itemCount);

    expect(first).toEqual(second);
    expect(projectWorkspaces(ROLES).map((projection) => projection.role)).toEqual([...ROLES]);
  });

  it("exposes the who-sees-what matrix derived from the same engine", () => {
    const matrix = projectionMatrix(ROLES);

    expect(Object.keys(matrix)).toEqual([...ROLES]);
    for (const role of ROLES) {
      expect(matrix[role]).toEqual(
        projectWorkspace(role).sections.flatMap((section) => section.items.map((item) => item.key)),
      );
    }
    // A role with no authority yields an empty list, not a default page.
    const empty = projectWorkspaces(ROLES).find((projection) => projection.empty);
    if (empty) expect(matrix[empty.role]).toEqual([]);
  });
});
