/**
 * CoreGrid Scholar — Cluster L tests (Phase-04 §71–73, 112–127).
 * Reality graph, communication context, workflow triggers, search scope,
 * knowledge facts, temporal history + snapshots.
 */
import { describe, expect, it } from "vitest";
import {
  GRAPH_EDGE_KINDS,
  resolveOntologyRelation,
  validateGraphEdges,
} from "@/lib/scholar/reality-graph";
import {
  contextualAudience,
  validateCommunicationContext,
  type CommunicationContext,
} from "@/lib/scholar/communication-context";
import { validateEducationalTriggers } from "@/lib/scholar/workflow-triggers";
import {
  resolveQueryIntent,
  resolveSearchScope,
  type RoleSearchScope,
} from "@/lib/scholar/search-context";
import { validateKnowledgeFacts } from "@/lib/scholar/knowledge-facts";
import {
  appendSnapshot,
  snapshotAsOf,
  validRecordsOn,
  validateTemporalRecords,
  type RealitySnapshot,
} from "@/lib/scholar/history";

describe("reality-graph (§71–73, 123)", () => {
  it("exposes the §123 relationship vocabulary", () => {
    expect(GRAPH_EDGE_KINDS).toContain("teaches");
    expect(GRAPH_EDGE_KINDS).toContain("assessed_by");
    expect(GRAPH_EDGE_KINDS).toContain("scheduled_in");
  });

  it("validates graph edges against known entities", () => {
    const issues = validateGraphEdges(
      [
        {
          kind: "teaches",
          sourceEntityId: "educator-1",
          sourceType: "educator",
          targetEntityId: "cls-1a",
          targetType: "learning_group",
        },
        { kind: "located_in", sourceEntityId: "fac-lab", targetEntityId: "bld-1" },
      ],
      new Set(["educator-1", "cls-1a", "fac-lab", "bld-1"]),
    );
    expect(issues).toEqual([]);
  });

  it("rejects self-edges, duplicates and unknown entities", () => {
    const issues = validateGraphEdges(
      [
        { kind: "teaches", sourceEntityId: "x", targetEntityId: "x" },
        { kind: "teaches", sourceEntityId: "a", targetEntityId: "b" },
        { kind: "teaches", sourceEntityId: "a", targetEntityId: "b" },
      ],
      new Set(["a", "b"]),
    );
    expect(issues.join(" ")).toContain("itself");
    expect(issues.join(" ")).toContain("duplicate graph edge");
  });

  it("resolves §123 kinds onto declared ontology relations or refuses honestly", () => {
    expect(resolveOntologyRelation("teaches", "educator", "learning_group")).toBe("teaches");
    expect(resolveOntologyRelation("enrolled_in", "learner", "learning_group")).toBe("enrolls");
    expect(resolveOntologyRelation("attends", null, null)).toBe(null);
    expect(resolveOntologyRelation("teaches", "learner", "learning_group")).toBe(null);
  });
});

describe("communication-context (§112–113)", () => {
  it("groups contextual audience refs", () => {
    const context: CommunicationContext = {
      subject: "Field trip permission",
      refs: [
        { audienceKind: "guardian", refId: "ident-g1", allowedChannels: ["sms", "email"] },
        { audienceKind: "class", refId: "cls-1a" },
        { audienceKind: "teacher", refId: "ident-t1" },
      ],
    };
    expect(validateCommunicationContext(context)).toEqual([]);
    const audience = contextualAudience(context);
    expect(audience.get("guardian")).toEqual(["ident-g1"]);
    expect(audience.get("class")).toEqual(["cls-1a"]);
  });

  it("rejects unknown audience kinds and duplicates", () => {
    const issues = validateCommunicationContext({
      subject: "X",
      refs: [
        { audienceKind: "bus" as unknown as "student", refId: "1" },
        { audienceKind: "student", refId: "l-1" },
        { audienceKind: "student", refId: "l-1" },
      ],
    });
    expect(issues.join(" ")).toContain("audienceKind must be one of");
    expect(issues.join(" ")).toContain("duplicate communication ref");
  });
});

describe("workflow-triggers (§114–115 boundary)", () => {
  it("declares triggers for P17 execution without executing anything", () => {
    const issues = validateEducationalTriggers([
      {
        id: "trig-1",
        type: "examination_published",
        eventType: "scholar.examination.published",
        tenantId: "tenant-1",
      },
      { id: "trig-2", type: "attendance_anomaly", eventType: "scholar.attendance.anomaly" },
    ]);
    expect(issues).toEqual([]);
    const dup = validateEducationalTriggers([
      { id: "trig-1", type: "grade_recorded", eventType: "scholar.grade.recorded" },
      { id: "trig-1", type: "grade_recorded", eventType: "scholar.grade.recorded" },
    ]);
    expect(dup.join(" ")).toContain("duplicate");
  });
});

describe("search-context (§119–121)", () => {
  const matrix: RoleSearchScope[] = [
    { role: "teacher", allowedKinds: ["student", "class", "subject", "assessment"] },
    {
      role: "school_admin",
      allowedKinds: ["student", "teacher", "class", "subject", "facility", "device"],
    },
  ];

  it("grants exactly the kinds a role's policy allows (§121)", () => {
    const scope = resolveSearchScope("teacher", matrix, ["student", "facility", "subject"]);
    expect(scope.allowedKinds).toEqual(["student", "subject"]);
    expect(scope.deniedKinds).toEqual(["facility"]);
  });

  it("denies unknown roles everything (deny by default)", () => {
    const scope = resolveSearchScope("parent", matrix);
    expect(scope.allowedKinds).toEqual([]);
  });

  it("interprets semantic queries without widening authorization", () => {
    const result = resolveQueryIntent("Show SS2 mathematics students", "teacher", matrix);
    expect(result.kinds).toContain("student");
    expect(result.kinds).toContain("subject");
  });
});

describe("knowledge-facts (§122–123)", () => {
  it("accepts structured facts with sources and confidence", () => {
    const issues = validateKnowledgeFacts([
      {
        factType: "teaches",
        subjectId: "educator-1",
        objectId: "cls-1a",
        tenantId: "tenant-1",
        confidence: 1,
        source: "configuration",
      },
      {
        factType: "located_in",
        subjectId: "fac-lab",
        objectId: "bld-1",
        confidence: 0.9,
        source: "observation",
      },
    ]);
    expect(issues).toEqual([]);
  });

  it("rejects self-facts, bad confidence and duplicates", () => {
    const issues = validateKnowledgeFacts([
      {
        factType: "teaches",
        subjectId: "x",
        objectId: "x",
        confidence: 1,
        source: "configuration",
      },
      { factType: "teaches", subjectId: "a", objectId: "b", confidence: 2, source: "event" },
      { factType: "teaches", subjectId: "a", objectId: "b", confidence: 0.5, source: "event" },
    ]);
    expect(issues.join(" ")).toContain("itself");
    expect(issues.join(" ")).toContain("confidence");
    expect(issues.join(" ")).toContain("duplicate fact");
  });
});

describe("history (§124–127)", () => {
  it("validates temporal records and answers as-of queries", () => {
    const records = [
      { entityKind: "class", entityId: "cls-1a", validFrom: "2026-01-05", validTo: "2026-12-18" },
      {
        entityKind: "class",
        entityId: "cls-1a-old",
        validFrom: "2025-01-06",
        validTo: "2025-12-19",
      },
    ];
    expect(validateTemporalRecords(records)).toEqual([]);
    expect(validRecordsOn(records, "2026-03-01").map((r) => r.entityId)).toEqual(["cls-1a"]);
    expect(validRecordsOn(records, "2025-06-01").map((r) => r.entityId)).toEqual(["cls-1a-old"]);
  });

  it("preserves immutable snapshots and supports the time machine (§126–127)", () => {
    const s1: RealitySnapshot = {
      snapshotId: "snap-1",
      takenAt: "2026-01-10T00:00:00.000Z",
      scope: "configuration",
      contentRef: "blueprint:v1",
    };
    const s2: RealitySnapshot = {
      snapshotId: "snap-2",
      takenAt: "2026-06-01T00:00:00.000Z",
      scope: "curriculum",
      contentRef: "curriculum:v2",
    };

    const appended = appendSnapshot([], s1);
    expect(appended.ok).toBe(true);
    let list: RealitySnapshot[] = appended.ok ? appended.snapshots : [];

    const duplicate = appendSnapshot(list, s1);
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.issue).toContain("immutable");

    const second = appendSnapshot(list, s2);
    list = second.ok ? second.snapshots : list;

    expect(snapshotAsOf(list, "2026-03-01T00:00:00.000Z")?.snapshotId).toBe("snap-1");
    expect(snapshotAsOf(list, "2026-07-01T00:00:00.000Z")?.snapshotId).toBe("snap-2");
    expect(snapshotAsOf(list, "2025-01-01T00:00:00.000Z")).toBe(null);
  });

  it("rejects temporal records with inverted validity windows", () => {
    const issues = validateTemporalRecords([
      { entityKind: "class", entityId: "c", validFrom: "2026-06-01", validTo: "2026-01-01" },
    ]);
    expect(issues.join(" ")).toContain("validTo precedes validFrom");
  });
});
