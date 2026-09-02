/**
 * CoreGrid Scholar — Phase 11 Academic Learning Intelligence unit tests
 * (academic-core).
 *
 * Validates:
 * - Learner reference contract and tenant consistency (F.1, D.2).
 * - Learning evidence contract: provenance, score/weight/confidence bounds
 *   (F.5, P, Q).
 * - Learning progress state derivation (AA).
 */

import { describe, expect, it } from "vitest";
import { tenantId } from "@/lib/tenant-core";
import {
  createLearnerReference,
  isLearnerTenantConsistent,
  createLearningEvidence,
  evaluateLearningProgress,
  type LearningEvidence,
} from "@/lib/academic-core";

const TENANT_A = tenantId("tenant-a");
const TENANT_B = tenantId("tenant-b");
const NOW = "2026-01-01T00:00:00Z";

function makeEvidence(overrides: Partial<LearningEvidence> = {}): LearningEvidence {
  const created = createLearningEvidence({
    tenantId: TENANT_A,
    learnerId: "learner-1",
    courseId: "course-1",
    competencyId: "comp-algebra",
    kind: "observed_fact",
    source: "examination",
    sourceRecordId: "exam-1",
    score: 70,
    weight: 2,
    observedAt: NOW,
    actorId: "teacher-1",
    methodology: "summative-exam",
    confidence: 0.9,
    provenanceRef: "prov-1",
  });
  if (!created.ok) throw new Error("fixture failed");
  return { ...created.evidence, ...overrides };
}

describe("createLearnerReference (F.1)", () => {
  it("creates a tenant-scoped learner reference", () => {
    const result = createLearnerReference({
      learnerId: "learner-1",
      tenantId: TENANT_A,
      cohortId: "cohort-1",
      enrolledCourseIds: ["course-1"],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.learner.tenantId).toBe(TENANT_A);
    }
  });

  it("rejects an empty learner id", () => {
    const result = createLearnerReference({ learnerId: "", tenantId: TENANT_A });
    expect(result.ok).toBe(false);
  });

  it("is tenant-consistent only within its own tenant (D.2)", () => {
    const result = createLearnerReference({ learnerId: "learner-1", tenantId: TENANT_A });
    if (!result.ok) throw new Error("fixture failed");
    expect(isLearnerTenantConsistent(result.learner, TENANT_A)).toBe(true);
    expect(isLearnerTenantConsistent(result.learner, TENANT_B)).toBe(false);
  });
});

describe("createLearningEvidence (F.5, P, Q)", () => {
  it("creates an evidence record with provenance", () => {
    const evidence = makeEvidence();
    expect(evidence.kind).toBe("observed_fact");
    expect(evidence.provenanceRef).toBe("prov-1");
    expect(evidence.sourceRecordId).toBe("exam-1");
  });

  it("rejects an out-of-range score", () => {
    const result = createLearningEvidence({
      tenantId: TENANT_A,
      learnerId: "learner-1",
      courseId: "course-1",
      competencyId: "comp-1",
      kind: "observed_fact",
      source: "quiz",
      sourceRecordId: "q1",
      score: 120,
      weight: 1,
      observedAt: NOW,
      actorId: "teacher-1",
      methodology: "quiz",
      confidence: 0.8,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects non-positive weight", () => {
    const result = createLearningEvidence({
      tenantId: TENANT_A,
      learnerId: "learner-1",
      courseId: "course-1",
      competencyId: "comp-1",
      kind: "observed_fact",
      source: "quiz",
      sourceRecordId: "q1",
      score: 50,
      weight: 0,
      observedAt: NOW,
      actorId: "teacher-1",
      methodology: "quiz",
      confidence: 0.8,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects out-of-range confidence", () => {
    const result = createLearningEvidence({
      tenantId: TENANT_A,
      learnerId: "learner-1",
      courseId: "course-1",
      competencyId: "comp-1",
      kind: "observed_fact",
      source: "quiz",
      sourceRecordId: "q1",
      score: 50,
      weight: 1,
      observedAt: NOW,
      actorId: "teacher-1",
      methodology: "quiz",
      confidence: 1.5,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects evidence without a source record reference (Q)", () => {
    const result = createLearningEvidence({
      tenantId: TENANT_A,
      learnerId: "learner-1",
      courseId: "course-1",
      competencyId: "comp-1",
      kind: "observed_fact",
      source: "quiz",
      sourceRecordId: "",
      score: 50,
      weight: 1,
      observedAt: NOW,
      actorId: "teacher-1",
      methodology: "quiz",
      confidence: 0.8,
    });
    expect(result.ok).toBe(false);
  });
});

describe("evaluateLearningProgress (AA)", () => {
  it("reports NOT_STARTED with no evidence", () => {
    const result = evaluateLearningProgress({
      learnerId: "learner-1",
      tenantId: TENANT_A,
      courseId: "course-1",
      competencyId: "comp-1",
      masteryEstimate: 0,
      evidenceCount: 0,
      hasBlockingPrerequisiteGap: false,
      modelVersion: "v1",
      now: NOW,
    });
    expect(result.progress.state).toBe("NOT_STARTED");
  });

  it("reports MASTERED at or above the mastery threshold", () => {
    const result = evaluateLearningProgress({
      learnerId: "learner-1",
      tenantId: TENANT_A,
      courseId: "course-1",
      competencyId: "comp-1",
      masteryEstimate: 85,
      evidenceCount: 3,
      hasBlockingPrerequisiteGap: false,
      modelVersion: "v1",
      now: NOW,
    });
    expect(result.progress.state).toBe("MASTERED");
  });

  it("reports APPROACHING_MASTERY between thresholds", () => {
    const result = evaluateLearningProgress({
      learnerId: "learner-1",
      tenantId: TENANT_A,
      courseId: "course-1",
      competencyId: "comp-1",
      masteryEstimate: 65,
      evidenceCount: 2,
      hasBlockingPrerequisiteGap: false,
      modelVersion: "v1",
      now: NOW,
    });
    expect(result.progress.state).toBe("APPROACHING_MASTERY");
  });

  it("reports NEEDS_REVIEW below expectations", () => {
    const result = evaluateLearningProgress({
      learnerId: "learner-1",
      tenantId: TENANT_A,
      courseId: "course-1",
      competencyId: "comp-1",
      masteryEstimate: 30,
      evidenceCount: 2,
      hasBlockingPrerequisiteGap: false,
      modelVersion: "v1",
      now: NOW,
    });
    expect(result.progress.state).toBe("NEEDS_REVIEW");
  });

  it("reports BLOCKED when a blocking prerequisite gap exists", () => {
    const result = evaluateLearningProgress({
      learnerId: "learner-1",
      tenantId: TENANT_A,
      courseId: "course-1",
      competencyId: "comp-1",
      masteryEstimate: 90,
      evidenceCount: 5,
      hasBlockingPrerequisiteGap: true,
      modelVersion: "v1",
      now: NOW,
    });
    expect(result.progress.state).toBe("BLOCKED");
  });
});
