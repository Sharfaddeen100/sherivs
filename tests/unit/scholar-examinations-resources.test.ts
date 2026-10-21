/**
 * Sherivs Scholar — Cluster I tests (Phase-04 §45–51, 133).
 * Lesson resources, assignments, examinations, exam security, practical exams,
 * event-contract idempotency.
 */
import { describe, expect, it } from "vitest";
import { validateLessonResources } from "@/lib/scholar/lesson-resources";
import {
  advanceAssignment,
  ASSIGNMENT_STATES,
  canTransitionAssignment,
  validateAssignments,
} from "@/lib/scholar/assignment-lifecycle";
import { validateExaminations } from "@/lib/scholar/examination";
import {
  validateSeatAllocations,
  validateSecurityIncident,
} from "@/lib/scholar/examination-security";
import {
  validatePracticalSessions,
  validatePracticalVenues,
} from "@/lib/scholar/practical-examination";
import {
  deriveIdempotencyKey,
  eventKey,
  isDuplicate,
  scholarEventDraft,
  stableChecksum,
} from "@/lib/scholar/event-contracts";

describe("lesson-resources (§46)", () => {
  it("accepts a mixed resource catalogue", () => {
    const result = validateLessonResources([
      { id: "res-bk", kind: "textbook", name: "Mathematics Learner's Book", quantity: 40 },
      { id: "res-lab", kind: "laboratory_equipment", name: "Microscopes", quantity: 8 },
      { id: "res-vid", kind: "video", name: "Cell biology clip" },
      { id: "res-ws", kind: "worksheet", name: "Fractions worksheet" },
    ]);
    expect(result.ok).toBe(true);
  });

  it("rejects negative quantities and duplicate ids", () => {
    const negative = validateLessonResources([
      { id: "res-x", kind: "device", name: "X", quantity: -1 },
    ]);
    expect(negative.ok).toBe(false);
    const duplicate = validateLessonResources([
      { id: "res-x", kind: "device", name: "A" },
      { id: "res-x", kind: "device", name: "B" },
    ]);
    expect(duplicate.ok).toBe(false);
  });
});

describe("assignments (§47–48)", () => {
  it("accepts every assignment form", () => {
    const result = validateAssignments(
      ["individual", "group", "practical", "project", "research", "field_work"].map(
        (form, index) => ({
          id: `asn-${index}`,
          form: form as "individual",
          title: `${form} task`,
        }),
      ),
    );
    expect(result.ok).toBe(true);
  });

  it("enforces the lifecycle state machine (§48)", () => {
    expect(canTransitionAssignment("proposed", "assigned")).toBe(true);
    expect(canTransitionAssignment("assigned", "submitted")).toBe(true);
    expect(canTransitionAssignment("submitted", "assessed")).toBe(true);
    expect(canTransitionAssignment("assessed", "returned")).toBe(true);
    expect(canTransitionAssignment("returned", "archived")).toBe(true);
    expect(canTransitionAssignment("proposed", "submitted")).toBe(false);
    expect(canTransitionAssignment("submitted", "returned")).toBe(false);

    const jump = advanceAssignment({ assignmentId: "asn-1", state: "assigned" }, "assessed");
    expect(jump.ok).toBe(false);
    if (!jump.ok) expect(jump.issue).toContain("cannot move");

    const valid = advanceAssignment({ assignmentId: "asn-1", state: "proposed" }, "assigned");
    expect(valid.ok).toBe(true);
    expect(ASSIGNMENT_STATES).toHaveLength(6);
  });
});

describe("examinations (§49)", () => {
  it("accepts internal/external/practical/oral/continuous definitions", () => {
    const result = validateExaminations([
      { id: "ex-1", kind: "internal", name: "Term 1 Exam", date: "2026-03-16" },
      { id: "ex-2", kind: "continuous_assessment", name: "CA 2" },
      { id: "ex-3", kind: "oral", name: "Oral French", date: "2026-03-18", endDate: "2026-03-20" },
      { id: "ex-4", kind: "external", name: "WAEC English" },
    ]);
    expect(result.ok).toBe(true);
  });

  it("rejects inverted exam windows", () => {
    const result = validateExaminations([
      { id: "ex-x", kind: "internal", name: "X", date: "2026-03-20", endDate: "2026-03-18" },
    ]);
    expect(result.ok).toBe(false);
  });
});

describe("examination-security (§50)", () => {
  it("enforces one seat per candidate and room capacity", () => {
    const issues = validateSeatAllocations(
      [
        { examinationId: "ex-1", candidateId: "l-1", roomId: "rm-1", seatNumber: "1" },
        { examinationId: "ex-1", candidateId: "l-2", roomId: "rm-1", seatNumber: "2" },
        { examinationId: "ex-1", candidateId: "l-3", roomId: "rm-1", seatNumber: "3" },
      ],
      [{ id: "rm-1", name: "Hall A", capacity: 2 }],
      new Set(["ex-1"]),
    );
    expect(issues.join(" ")).toContain("over capacity");
  });

  it("rejects double seating and unknown examinations", () => {
    const issues = validateSeatAllocations(
      [
        { examinationId: "ex-1", candidateId: "l-1" },
        { examinationId: "ex-1", candidateId: "l-1" },
      ],
      [],
      new Set(["ex-1"]),
    );
    expect(issues.join(" ")).toContain("seated twice");

    const unknown = validateSeatAllocations(
      [{ examinationId: "ghost", candidateId: "l-1" }],
      [],
      new Set(["ex-1"]),
    );
    expect(unknown.join(" ")).toContain("unknown examination");
  });

  it("validates incident reporting", () => {
    expect(
      validateSecurityIncident({
        examinationId: "ex-1",
        kind: "candidate_verification_failure",
        reportedBy: "ident-invigilator",
        detail: "Candidate could not verify identity",
      }),
    ).toEqual([]);
    expect(
      validateSecurityIncident({ examinationId: "", kind: "other", reportedBy: "", detail: "" }),
    ).toHaveLength(3);
  });
});

describe("practical-examinations (§51)", () => {
  it("validates venues and sessions against practical exams", () => {
    const venueIssues = validatePracticalVenues([
      { id: "ven-lab", kind: "laboratory", name: "Chemistry Lab", stationCapacity: 12 },
      { id: "ven-farm", kind: "farm", name: "School Farm" },
    ]);
    expect(venueIssues).toEqual([]);

    const sessionIssues = validatePracticalSessions(
      [
        {
          id: "ps-1",
          examinationId: "ex-practical-1",
          venueId: "ven-lab",
          stationIds: ["s1", "s2"],
          assessorIds: ["ident-a1"],
          candidateIds: Array.from({ length: 13 }, (_, i) => `l-${i}`),
        },
      ],
      [{ id: "ven-lab", kind: "laboratory", name: "Chemistry Lab", stationCapacity: 12 }],
      [{ id: "ex-practical-1", kind: "practical", name: "Chemistry Practical" }],
    );
    expect(sessionIssues.join(" ")).toContain("exceed venue station capacity");
  });

  it("rejects non-practical examinations and missing stations", () => {
    const issues = validatePracticalSessions(
      [
        {
          id: "ps-x",
          examinationId: "ex-1",
          venueId: "ven-lab",
          stationIds: [],
          assessorIds: [],
          candidateIds: [],
        },
      ],
      [{ id: "ven-lab", kind: "laboratory", name: "Lab", stationCapacity: 12 }],
      [{ id: "ex-1", kind: "internal", name: "Written" }],
    );
    expect(issues.join(" ")).toContain("not a practical examination");
    expect(issues.join(" ")).toContain("at least one station");
  });
});

describe("event-contracts (§131–133)", () => {
  const input = {
    eventType: "scholar.exam.paper_opened",
    aggregateType: "scholar.examination",
    aggregateId: "ex-1",
    payload: { candidateId: "l-1" },
  };

  it("derives stable event keys and idempotency keys", () => {
    expect(eventKey(input)).toBe("scholar.exam.paper_opened::scholar.examination::ex-1");
    const derived = deriveIdempotencyKey(input);
    expect(derived).toBe(deriveIdempotencyKey(input));
    expect(stableChecksum(["a", "b"])).toBe(stableChecksum(["a", "b"]));
  });

  it("emits kernel drafts with dedup identity and guards replay (§133)", () => {
    const emitted = scholarEventDraft(input, "2026-09-04T10:00:00.000Z");
    expect(emitted.event.event_type).toBe("scholar.exam.paper_opened");
    expect(emitted.event.idempotency_key).toBeTruthy();
    const replayed = scholarEventDraft(input, "2026-09-04T10:05:00.000Z");
    expect(isDuplicate(emitted.key, new Set([replayed.key]))).toBe(true);
    expect(isDuplicate("other::key", new Set([emitted.key]))).toBe(false);
  });
});
