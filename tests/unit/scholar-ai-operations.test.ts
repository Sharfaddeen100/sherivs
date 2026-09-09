/**
 * CoreGrid Scholar — AI operations adapter tests (Phase 26 consumption).
 */
import { describe, expect, it } from "vitest";
import {
  scholarAiOperationGate,
  scholarAiRisk,
  scholarAiShouldEscalate,
} from "../../frontend/src/lib/runtime/scholar-ai-operations";

describe("Scholar AI operations (kernel-owned governance)", () => {
  it("classifies Scholar operations through the kernel risk rule", () => {
    expect(scholarAiRisk("lesson_plan_draft")).toBe("low");
    expect(scholarAiRisk("discipline_summary")).toBe("medium");
    expect(scholarAiRisk("exam_security_insight")).toBe("high");
    expect(scholarAiRisk("financial_budget_proposal")).toBe("high");
    expect(scholarAiRisk("lockdown_recommendation")).toBe("critical");
    expect(scholarAiRisk("mystery_operation")).toBeNull();
  });

  it("lets low/medium operations run without approval", () => {
    expect(
      scholarAiOperationGate({
        kind: "lesson_plan_draft",
        humanApproval: false,
        multiModelVerified: false,
      }).allowed,
    ).toBe(true);
    expect(
      scholarAiOperationGate({
        kind: "discipline_summary",
        humanApproval: false,
        multiModelVerified: false,
      }).requiresApproval,
    ).toBe(false);
  });

  it("requires multi-model verification or approval for high risk", () => {
    const high = { kind: "exam_security_insight", humanApproval: false, multiModelVerified: false };
    expect(scholarAiOperationGate(high).allowed).toBe(false);
    expect(scholarAiOperationGate(high).requiresApproval).toBe(true);
    expect(scholarAiOperationGate({ ...high, multiModelVerified: true }).allowed).toBe(true);
  });

  it("mandates human approval AND verification for critical risk", () => {
    const critical = {
      kind: "lockdown_recommendation",
      humanApproval: true,
      multiModelVerified: true,
    };
    expect(scholarAiOperationGate(critical).allowed).toBe(true);
    expect(scholarAiOperationGate({ ...critical, multiModelVerified: false }).allowed).toBe(false);
    expect(scholarAiOperationGate({ ...critical, humanApproval: false }).allowed).toBe(false);
  });

  it("escalates low confidence and unknown kinds (fail closed)", () => {
    const base = {
      kind: "grade_summary",
      evidenceConflict: false,
      authorizationAmbiguous: false,
      policyUnclear: false,
    };
    expect(scholarAiShouldEscalate({ ...base, confidence: 0.4 })).toBe(true);
    expect(scholarAiShouldEscalate({ ...base, confidence: 0.9 })).toBe(false);
    expect(
      scholarAiShouldEscalate({
        kind: "mystery_operation",
        confidence: 0.99,
        evidenceConflict: false,
        authorizationAmbiguous: false,
        policyUnclear: false,
      }),
    ).toBe(true);
  });
});
