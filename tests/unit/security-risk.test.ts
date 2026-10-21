/**
 * Sherivs Scholar — Phase 08 Security Engine unit tests (security-risk).
 *
 * Validates:
 * - Risk scoring from combined signals (Section K.2, K.3).
 * - Risk-level to risk-action mapping (Section K.4).
 * - Sensitive-operation escalation to human review (Section N.3).
 */

import { describe, expect, it } from "vitest";
import {
  evaluateRisk,
  riskActionForLevel,
  riskActionForSensitiveOperation,
  defaultSignalWeight,
  type RiskSignal,
} from "@/lib/security-risk";

function signal(overrides: Partial<RiskSignal> = {}): RiskSignal {
  return {
    type: "unusual_location",
    weight: defaultSignalWeight("unusual_location"),
    evidence: "login from new country",
    ...overrides,
  };
}

describe("evaluateRisk (Sections K.2, K.3)", () => {
  it("returns LOW for no signals", () => {
    const result = evaluateRisk([]);
    expect(result.level).toBe("LOW");
    expect(result.score).toBe(0);
  });

  it("returns GUARDED for a single low-weight signal", () => {
    const result = evaluateRisk([signal({ weight: 20 })]);
    expect(result.level).toBe("GUARDED");
  });

  it("returns ELEVATED for combined mid-weight signals", () => {
    const result = evaluateRisk([signal({ weight: 20 }), signal({ weight: 20 })]);
    expect(result.level).toBe("ELEVATED");
  });

  it("returns HIGH for combined high-weight signals", () => {
    const result = evaluateRisk([signal({ weight: 30 }), signal({ weight: 35 })]);
    expect(result.level).toBe("HIGH");
  });

  it("forces CRITICAL when any single signal has weight >= 70 (impossible travel)", () => {
    const result = evaluateRisk([signal({ type: "impossible_travel", weight: 70 })]);
    expect(result.level).toBe("CRITICAL");
  });

  it("caps the score at 100 even with many high signals", () => {
    const result = evaluateRisk([
      signal({ weight: 60 }),
      signal({ weight: 60 }),
      signal({ weight: 60 }),
    ]);
    expect(result.score).toBe(100);
  });
});

describe("riskActionForLevel (Section K.4)", () => {
  it("maps LOW to allow", () => {
    expect(riskActionForLevel("LOW")).toBe("allow");
  });

  it("maps CRITICAL to quarantine", () => {
    expect(riskActionForLevel("CRITICAL")).toBe("quarantine");
  });

  it("maps HIGH to rate_limit", () => {
    expect(riskActionForLevel("HIGH")).toBe("rate_limit");
  });
});

describe("riskActionForSensitiveOperation (Sections K.4, N.3)", () => {
  it("escalates HIGH risk on a sensitive operation to human_review", () => {
    expect(riskActionForSensitiveOperation("HIGH", true)).toBe("human_review");
  });

  it("escalates CRITICAL risk on a sensitive operation to human_review", () => {
    expect(riskActionForSensitiveOperation("CRITICAL", true)).toBe("human_review");
  });

  it("does not escalate LOW risk on a sensitive operation", () => {
    expect(riskActionForSensitiveOperation("LOW", true)).toBe("allow");
  });

  it("does not escalate HIGH risk on a non-sensitive operation", () => {
    expect(riskActionForSensitiveOperation("HIGH", false)).toBe("rate_limit");
  });
});
