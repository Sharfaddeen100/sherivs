/**
 * Sherivs — Phase 09 Security & Trust Fabric: the self-report EXERCISES the
 * shipped state machines rather than describing them.
 *
 * What this suite protects: every invariant the fabric claims is checked by a
 * real call, every exercised path refuses the unsafe direction, the fabric's own
 * reading of "usable" is distinguished from the enforcement surface's reading,
 * and the gaps it has are counted instead of implied complete.
 */
import { describe, expect, it } from "vitest";

import {
  TRUST_FABRIC_CAPABILITY,
  trustExercises,
  trustFabricGaps,
  trustFabricReport,
  trustInvariantChecks,
} from "@/lib/trust-fabric-report";

describe("Phase 09 — trust fabric self-report", () => {
  const report = trustFabricReport();

  it("names its capability and counts the real vocabulary", () => {
    expect(report.capability).toBe(TRUST_FABRIC_CAPABILITY);
    expect(report.vocabulary.states).toBe(10);
    expect(report.vocabulary.subjectTypes).toBe(12);
    expect(report.vocabulary.relationshipTypes).toBe(13);
    expect(report.vocabulary.scoreFactors).toBe(11);
  });

  it("holds every invariant it checks", () => {
    const failing = report.invariants.filter((check) => !check.holds);
    expect(failing.map((check) => check.id)).toEqual([]);
    expect(report.verdict.satisfied).toBe(report.verdict.invariantCount);
  });

  it("exercises every trust family with a real call that produces an outcome", () => {
    expect(report.exercises.length).toBeGreaterThanOrEqual(12);
    expect(report.exercises.every((exercise) => exercise.outcome.length > 0)).toBe(true);
    const ids = report.exercises.map((exercise) => exercise.id);
    expect(ids).toContain("device-trust");
    expect(ids).toContain("workload-trust");
    expect(ids).toContain("agent-and-model-trust");
    expect(ids).toContain("certificate-trust");
    expect(ids).toContain("federation");
    expect(ids).toContain("zero-trust");
  });

  it("refuses the unsafe direction in every exercised path", () => {
    const notRefusing = report.exercises.filter((exercise) => !exercise.refused);
    expect(notRefusing.map((exercise) => exercise.id)).toEqual([]);
  });

  it("reports its gaps instead of implying completeness", () => {
    expect(report.gaps.length).toBeGreaterThanOrEqual(10);
    expect(report.gaps.every((gap) => gap.status === "DECLARED")).toBe(true);
    expect(report.verdict.reported).toBe(report.gaps.length);
  });

  it("separates the fabric's usable set from the enforcement reading and names the difference", () => {
    expect(report.usability.usableStates).toContain("VERIFIED");
    expect(report.usability.phase08UsableStates).not.toContain("VERIFIED");
    expect(report.usability.differOn).toEqual(["VERIFIED"]);
    expect(report.usability.terminalStates).toEqual(["REVOKED"]);
  });

  it("never treats UNKNOWN as usable", () => {
    expect(report.usability.usableStates).not.toContain("UNKNOWN");
    expect(report.usability.phase08UsableStates).not.toContain("UNKNOWN");
    expect(report.usability.usableStates).not.toContain("UNVERIFIED");
  });

  it("exposes the same checks through their individual functions", () => {
    expect(trustInvariantChecks().length).toBe(report.invariants.length);
    expect(trustExercises().length).toBe(report.exercises.length);
    expect(trustFabricGaps().length).toBe(report.gaps.length);
  });
});
