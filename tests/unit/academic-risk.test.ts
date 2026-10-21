/**
 * Sherivs Scholar — Phase 11 Academic Learning Intelligence unit tests
 * (academic-risk).
 *
 * Validates:
 * - Academic risk signals: probabilistic, explainable, never a diagnosis
 *   (AI, AJ).
 * - Fairness guard: sensitive attributes must not be used improperly (AK).
 * - Aggregate privacy: individual data must not leak through aggregates (AM).
 * - Recommendation safety: no fabricated evidence, mandatory explainability
 *   (AV, AW).
 */

import { describe, expect, it } from "vitest";
import { tenantId } from "@/lib/tenant-core";
import {
  evaluateAcademicRisk,
  usesSensitiveAttributeImproperly,
  computeAggregateStat,
  canExposeAggregate,
  createAcademicRecommendation,
  type AggregateViewPolicy,
} from "@/lib/academic-risk";

const TENANT_A = tenantId("tenant-a");
const NOW = "2026-01-01T00:00:00Z";

describe("evaluateAcademicRisk (AI, AJ)", () => {
  it("produces no signals for a healthy learner", () => {
    const { signals } = evaluateAcademicRisk({
      learnerId: "learner-1",
      tenantId: TENANT_A,
      persistentGaps: 0,
      performanceDelta: 0,
      failedAssessments: 0,
      missingPrerequisiteCount: 0,
      inactivityDays: 2,
      hasUnusualPerformanceChange: false,
      modelVersion: "risk-v1",
      now: NOW,
    });
    expect(signals).toHaveLength(0);
  });

  it("detects persistent gaps, declining performance, and repeated failures", () => {
    const { signals } = evaluateAcademicRisk({
      learnerId: "learner-1",
      tenantId: TENANT_A,
      persistentGaps: 3,
      performanceDelta: -30,
      failedAssessments: 3,
      missingPrerequisiteCount: 0,
      inactivityDays: 1,
      hasUnusualPerformanceChange: false,
      modelVersion: "risk-v1",
      now: NOW,
    });
    const types = signals.map((s) => s.type);
    expect(types).toContain("persistent_learning_gap");
    expect(types).toContain("declining_performance");
    expect(types).toContain("repeated_failed_assessments");
  });

  it("detects missing prerequisites and prolonged inactivity", () => {
    const { signals } = evaluateAcademicRisk({
      learnerId: "learner-1",
      tenantId: TENANT_A,
      persistentGaps: 0,
      performanceDelta: 0,
      failedAssessments: 0,
      missingPrerequisiteCount: 2,
      inactivityDays: 30,
      hasUnusualPerformanceChange: false,
      modelVersion: "risk-v1",
      now: NOW,
    });
    const types = signals.map((s) => s.type);
    expect(types).toContain("missing_prerequisite");
    expect(types).toContain("prolonged_inactivity");
  });

  it("produces explainable, bounded, probabilistic signals (AJ)", () => {
    const { signals } = evaluateAcademicRisk({
      learnerId: "learner-1",
      tenantId: TENANT_A,
      persistentGaps: 5,
      performanceDelta: -50,
      failedAssessments: 5,
      missingPrerequisiteCount: 5,
      inactivityDays: 100,
      hasUnusualPerformanceChange: true,
      modelVersion: "risk-v1",
      now: NOW,
    });
    for (const signal of signals) {
      expect(signal.strength).toBeGreaterThanOrEqual(0);
      expect(signal.strength).toBeLessThanOrEqual(100);
      expect(signal.confidence).toBeGreaterThan(0);
      expect(signal.confidence).toBeLessThanOrEqual(1);
      expect(signal.modelVersion).toBe("risk-v1");
      expect(signal.evidenceRefs.length).toBeGreaterThan(0);
      expect(signal.status).toBe("active");
    }
  });
});

describe("Fairness guard (AK)", () => {
  it("rejects improper use of sensitive attributes", () => {
    const result = usesSensitiveAttributeImproperly(["demographic", "language"]);
    expect(result.improper).toBe(true);
    expect(result.rejected).toEqual(["demographic", "language"]);
  });

  it("allows non-sensitive attributes", () => {
    const result = usesSensitiveAttributeImproperly(["attendance_rate", "assignment_score"]);
    expect(result.improper).toBe(false);
  });
});

describe("Aggregate privacy (AM)", () => {
  it("computes aggregate stats without individual values", () => {
    const stat = computeAggregateStat([40, 60, 80]);
    expect(stat).not.toBeNull();
    if (stat) {
      expect(stat.mean).toBe(60);
      expect(stat.min).toBe(40);
      expect(stat.max).toBe(80);
      expect(stat.count).toBe(3);
    }
  });

  it("returns null for an empty group", () => {
    expect(computeAggregateStat([])).toBeNull();
  });

  it("refuses to expose small groups without authorization (AM)", () => {
    const policy: AggregateViewPolicy = { minimumGroupSize: 5, allowSmallGroups: false };
    expect(canExposeAggregate(3, policy)).toBe(false);
    expect(canExposeAggregate(5, policy)).toBe(true);
  });
});

describe("Recommendation safety (AV, AW)", () => {
  it("creates a recommendation with full explainability", () => {
    const result = createAcademicRecommendation({
      learnerId: "learner-1",
      tenantId: TENANT_A,
      recommendation: "Recommend additional practice on algebra",
      reason: "Mastery estimate 55 below expected 70",
      evidenceRefs: ["evt-1", "evt-2"],
      confidence: 0.8,
      uncertainty: 0.2,
      expectedBenefit: "Improved algebra mastery",
      limitations: ["Estimate based on two observations"],
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recommendation.evidenceRefs).toHaveLength(2);
    }
  });

  it("rejects a recommendation without evidence (no fabricated evidence, AW)", () => {
    const result = createAcademicRecommendation({
      learnerId: "learner-1",
      tenantId: TENANT_A,
      recommendation: "Promote learner",
      reason: "High confidence",
      evidenceRefs: [],
      confidence: 0.9,
      uncertainty: 0.1,
      expectedBenefit: "Acceleration",
      limitations: [],
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects out-of-range confidence/uncertainty (AV)", () => {
    const result = createAcademicRecommendation({
      learnerId: "learner-1",
      tenantId: TENANT_A,
      recommendation: "Provide tutoring",
      reason: "Gap detected",
      evidenceRefs: ["evt-1"],
      confidence: 1.5,
      uncertainty: 0.1,
      expectedBenefit: "Improvement",
      limitations: [],
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });
});
