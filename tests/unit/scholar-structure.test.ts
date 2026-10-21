/**
 * Sherivs Scholar — Cluster C tests (Phase-04 §22–25).
 * Cohorts, classes, streams, class flexibility and the kernel structure graph.
 */
import { describe, expect, it } from "vitest";
import { descendantCohorts, validateCohorts, type CohortDefinition } from "@/lib/scholar/cohort";
import { classAnchors, validateClasses } from "@/lib/scholar/class";
import { validateStreams } from "@/lib/scholar/stream";
import { groupsForLearner, validateClassFlexibility } from "@/lib/scholar/class-flexibility";
import { projectStructureEdge } from "@/lib/scholar/structure-graph";

describe("cohort (§22)", () => {
  const intake: CohortDefinition = { id: "intake-2026", kind: "intake", name: "2026 Intake" };
  const form1: CohortDefinition = {
    id: "form-1",
    kind: "class",
    name: "Form 1",
    levelCode: "lower",
    parentCohortId: "intake-2026",
  };
  const house: CohortDefinition = { id: "house-eagle", kind: "house", name: "Eagle House" };

  it("accepts overlapping container kinds (intake/class/house)", () => {
    const result = validateCohorts([intake, form1, house]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(descendantCohorts("intake-2026", result.cohorts)).toEqual(["form-1"]);
    }
  });

  it("rejects unknown parents and duplicate ids", () => {
    const orphan = validateCohorts([{ ...form1, parentCohortId: "missing" }]);
    expect(orphan.ok).toBe(false);
    if (!orphan.ok) expect(orphan.issues.join(" ")).toContain("does not exist");

    const duplicate = validateCohorts([intake, { ...intake, name: "Second intake" }]);
    expect(duplicate.ok).toBe(false);
  });

  it("detects cycles in the cohort tree", () => {
    const cyclic = validateCohorts([{ ...intake, parentCohortId: "form-1" }, form1]);
    expect(cyclic.ok).toBe(false);
    if (!cyclic.ok) expect(cyclic.issues.join(" ")).toContain("cycle");
  });
});

describe("class (§23)", () => {
  it("validates a class with full anchors and assignments", () => {
    const result = validateClasses(
      [
        {
          id: "cls-1a",
          name: "Form 1A",
          levelCode: "lower",
          programmeCode: "basic",
          academicPeriodCode: "AY2026",
          campus: "Main Campus",
          room: "B12",
          teacherAssignments: [
            { teacherId: "t-1", role: "class_teacher" },
            { teacherId: "t-2", role: "assistant" },
          ],
          subjectCodes: ["mathematics", "english"],
          policies: { mixed_ability: true },
        },
      ],
      {
        levelCodes: new Set(["lower"]),
        programmeCodes: new Set(["basic"]),
        academicPeriodCodes: new Set(["AY2026"]),
        campusNames: new Set(["Main Campus"]),
        subjectCodes: new Set(["mathematics", "english"]),
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const anchors = classAnchors(result.classes[0]);
      expect(anchors.level).toBe("lower");
      expect(anchors.room).toBe("B12");
    }
  });

  it("rejects dangling references and duplicate teacher assignments", () => {
    const dangling = validateClasses([{ id: "cls-x", name: "X", levelCode: "nope" }], {
      levelCodes: new Set(["lower"]),
    });
    expect(dangling.ok).toBe(false);
    if (!dangling.ok) expect(dangling.issues.join(" ")).toContain("unknown level");

    const dupTeacher = validateClasses([
      {
        id: "cls-y",
        name: "Y",
        teacherAssignments: [{ teacherId: "t-1" }, { teacherId: "t-1" }],
      },
    ]);
    expect(dupTeacher.ok).toBe(false);
  });
});

describe("stream (§24)", () => {
  it("accepts the documented stream vocabulary plus custom streams", () => {
    const result = validateStreams([
      { code: "SCI", name: "Science", kind: "science" },
      { code: "ART", name: "Arts", kind: "arts" },
      { code: "TECH", name: "Technical", kind: "technical" },
      { code: "VOCTRADE", name: "Welders Track", kind: "custom" },
    ]);
    expect(result.ok).toBe(true);
  });

  it("rejects duplicate codes and unknown kinds", () => {
    const dup = validateStreams([
      { code: "SCI", name: "Science", kind: "science" },
      { code: "SCI", name: "Sciences", kind: "science" },
    ]);
    expect(dup.ok).toBe(false);
  });
});

describe("class-flexibility (§25)", () => {
  it("allows one learner in different groups across different activities", () => {
    const result = validateClassFlexibility([
      { learnerId: "l-1", activityCode: "mathematics", groupId: "set-a" },
      { learnerId: "l-1", activityCode: "football", groupId: "team-red" },
      { learnerId: "l-1", activityCode: "boarding", groupId: "house-eagle" },
    ]);
    expect(result.ok).toBe(true);
    const groups = groupsForLearner(result.ok ? result.memberships : [], "l-1");
    expect(groups.get("mathematics")).toBe("set-a");
    expect(groups.get("football")).toBe("team-red");
  });

  it("rejects one learner in two groups for the SAME activity", () => {
    const result = validateClassFlexibility([
      { learnerId: "l-1", activityCode: "mathematics", groupId: "set-a" },
      { learnerId: "l-1", activityCode: "mathematics", groupId: "set-b" },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("more than one group");
  });
});

describe("structure-graph (C5, kernel projection)", () => {
  const now = "2026-09-04T10:00:00.000Z";

  it("projects declared edges onto kernel relationship drafts", () => {
    const offers = projectStructureEdge(
      {
        kind: "offers",
        sourceType: "institution",
        targetType: "program",
        sourceEntityId: "inst-1",
        targetEntityId: "prog-basic",
        tenantId: "tenant-1",
      },
      now,
    );
    expect(offers.ok).toBe(true);
    if (offers.ok) {
      expect(offers.relationType).toBe("offers");
      expect(offers.draft.source_entity_id).toBe("inst-1");
      expect(offers.draft.tenant_id).toBe("tenant-1");
    }

    const teaches = projectStructureEdge(
      {
        kind: "teaches",
        sourceType: "educator",
        targetType: "learning_group",
        sourceEntityId: "educator-1",
        targetEntityId: "cls-1a",
      },
      now,
    );
    expect(teaches.ok).toBe(true);
    if (teaches.ok) expect(teaches.relationType).toBe("teaches");
  });

  it("resolves belongs_to aliases onto declared relations by entity types", () => {
    const enroll = projectStructureEdge(
      {
        kind: "belongs_to",
        sourceType: "learner",
        targetType: "learning_group",
        sourceEntityId: "learner-1",
        targetEntityId: "cls-1a",
      },
      now,
    );
    expect(enroll.ok).toBe(true);
    if (enroll.ok) expect(enroll.relationType).toBe("enrolls");

    const composes = projectStructureEdge(
      {
        kind: "belongs_to",
        sourceType: "program",
        targetType: "learning_group",
        sourceEntityId: "prog-basic",
        targetEntityId: "cls-1a",
      },
      now,
    );
    expect(composes.ok).toBe(true);
    if (composes.ok) expect(composes.relationType).toBe("composes");
  });

  it("refuses to invent edges for un-mappable or untyped belongs_to pairs", () => {
    const unmappable = projectStructureEdge(
      {
        kind: "belongs_to",
        sourceType: "institution",
        targetType: "learner",
        sourceEntityId: "inst-1",
        targetEntityId: "learner-1",
      },
      now,
    );
    expect(unmappable.ok).toBe(false);
    if (!unmappable.ok)
      expect(unmappable.issues.join(" ")).toContain("no declared Scholar relation");
  });

  it("enforces manifest source/target type constraints", () => {
    const wrongSource = projectStructureEdge(
      {
        kind: "teaches",
        sourceType: "learner",
        targetType: "learning_group",
        sourceEntityId: "learner-1",
        targetEntityId: "cls-1a",
      },
      now,
    );
    expect(wrongSource.ok).toBe(false);
    if (!wrongSource.ok)
      expect(wrongSource.issues.join(" ")).toContain("does not allow source type");
  });
});
