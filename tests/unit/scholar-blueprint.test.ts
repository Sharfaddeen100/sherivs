/**
 * Sherivs Scholar — blueprint tests (Phase-04 §81–82,128–129).
 */
import { describe, expect, it } from "vitest";
import {
  createBlueprint,
  isNewerThan,
  rollbackTarget,
  validateBlueprint,
} from "@/lib/scholar/blueprint";
import { buildSchoolSpec } from "@/lib/scholar/school-builder";

const LEVELS = [
  { name: "Lower Primary", code: "lower", sortOrder: 0 },
  { name: "Upper Primary", code: "upper", sortOrder: 1 },
];
const PROGRAMMES = [{ name: "Foundation", code: "foundation", sortOrder: 0 }];

function okSpec() {
  const built = buildSchoolSpec({ levels: LEVELS, programmes: PROGRAMMES });
  if (!built.ok) throw new Error("fixture spec must build");
  return built.spec;
}

describe("blueprint — versioned institution model (§81–82)", () => {
  it("creates the root version (v1) and links successors", () => {
    const spec = okSpec();
    const v1 = createBlueprint({
      spec,
      blueprintId: "inst-1",
      author: "admin",
      reason: "initial build",
      now: "2026-09-04T00:00:00.000Z",
    });
    expect(v1.ok).toBe(true);
    if (!v1.ok) return;
    expect(v1.blueprint.header.version).toBe(1);
    expect(v1.blueprint.header.previousVersion).toBeNull();

    const v2 = createBlueprint({
      spec,
      blueprintId: "inst-1",
      author: "admin",
      reason: "add evening shift",
      now: "2026-09-05T00:00:00.000Z",
      previous: v1.blueprint.header,
    });
    expect(v2.ok).toBe(true);
    if (!v2.ok) return;
    expect(v2.blueprint.header.version).toBe(2);
    expect(v2.blueprint.header.previousVersion).toBe(1);
    expect(rollbackTarget(v2.blueprint)).toBe(1);
    expect(isNewerThan(v2.blueprint, v1.blueprint)).toBe(true);
  });

  it("requires author and reason (audit trail)", () => {
    const result = createBlueprint({
      spec: okSpec(),
      blueprintId: "inst-1",
      author: "   ",
      reason: "",
      now: "2026-09-04T00:00:00.000Z",
    });
    expect(result.ok).toBe(false);
  });

  it("refuses to version an invalid spec (re-validates A1/A2)", () => {
    const spec = okSpec();
    spec.levels = [];
    const result = createBlueprint({
      spec,
      blueprintId: "inst-1",
      author: "admin",
      reason: "bad",
      now: "2026-09-04T00:00:00.000Z",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("levels");
  });

  it("re-validates stored blueprints as a rollback safety net", () => {
    const v1 = createBlueprint({
      spec: okSpec(),
      blueprintId: "inst-1",
      author: "admin",
      reason: "initial",
      now: "2026-09-04T00:00:00.000Z",
    });
    if (!v1.ok) throw new Error("fixture");
    expect(validateBlueprint(v1.blueprint).ok).toBe(true);
  });
});
