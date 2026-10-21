/**
 * Sherivs Scholar — automation policy adapter tests (Phase 17 consumption).
 */
import { describe, expect, it } from "vitest";
import {
  evaluateScholarAutomation,
  SCHOLAR_AUTOMATION_KINDS,
  SCHOLAR_AUTOMATION_RISK,
} from "../../frontend/src/lib/runtime/scholar-automation-policy";

const trueCondition = { conditionId: "ok", result: "TRUE" as const, detail: "verified" };

describe("Scholar automation policy", () => {
  it("covers every Scholar operation kind with a risk level", () => {
    expect(SCHOLAR_AUTOMATION_KINDS.length).toBeGreaterThanOrEqual(8);
    for (const kind of SCHOLAR_AUTOMATION_KINDS) {
      expect(SCHOLAR_AUTOMATION_RISK[kind]).toMatch(/^R[0-4]$/);
    }
  });

  it("proceeds when every condition is TRUE", () => {
    const decision = evaluateScholarAutomation({
      kind: "grade_publish",
      conditions: [trueCondition],
    });
    expect(decision.proceed).toBe(true);
    expect(decision.risk).toBe("R2");
  });

  it("fails closed on UNKNOWN conditions — even more so for high-risk kinds", () => {
    const unknown = { conditionId: "ambig", result: "UNKNOWN" as const, detail: "no signal" };
    expect(
      evaluateScholarAutomation({ kind: "timetable_publish", conditions: [unknown] }).proceed,
    ).toBe(false);
    expect(evaluateScholarAutomation({ kind: "writeoff", conditions: [unknown] }).reason).toContain(
      "fail closed",
    );
  });

  it("blocks errors and not-all-true sets", () => {
    const error = { conditionId: "boom", result: "ERROR" as const, detail: "evaluation error" };
    expect(evaluateScholarAutomation({ kind: "fee_reminder", conditions: [error] }).proceed).toBe(
      false,
    );
    const notTrue = { conditionId: "nope", result: "FALSE" as const, detail: "not met" };
    expect(
      evaluateScholarAutomation({ kind: "attendance_alert", conditions: [notTrue] }).proceed,
    ).toBe(false);
  });

  it("fails closed on unknown kinds", () => {
    const decision = evaluateScholarAutomation({ kind: "mystery", conditions: [trueCondition] });
    expect(decision.proceed).toBe(false);
    expect(decision.risk).toBeNull();
  });
});
