/**
 * CoreGrid Scholar — automation policy adapter (Phase 17 consumption, R-20).
 *
 * Scholar is a CONSUMER of the domain-neutral Phase-17 automation engine. This
 * module maps Scholar operation kinds to risk levels and evaluates condition
 * sets through `automation-core.applyFailClosed` — the kernel stays the owner
 * of the decision rule; Scholar only supplies its own risk data and inputs.
 * Unknown kinds FAIL CLOSED (never silently allowed).
 */
import {
  applyFailClosed,
  riskLevelOrdinal,
  type ConditionEvaluation,
  type RiskLevel,
} from "@/lib/automation-core";

export type ScholarAutomationKind =
  | "fee_reminder"
  | "attendance_alert"
  | "timetable_publish"
  | "grade_publish"
  | "position_end_prompt"
  | "exam_change"
  | "fee_waiver"
  | "writeoff";

export const SCHOLAR_AUTOMATION_RISK: Readonly<Record<ScholarAutomationKind, RiskLevel>> = {
  fee_reminder: "R1",
  attendance_alert: "R1",
  timetable_publish: "R0",
  grade_publish: "R2",
  position_end_prompt: "R2",
  exam_change: "R3",
  fee_waiver: "R3",
  writeoff: "R4",
};

export const SCHOLAR_AUTOMATION_KINDS = Object.keys(
  SCHOLAR_AUTOMATION_RISK,
) as ScholarAutomationKind[];

export interface ScholarAutomationInput {
  kind: string;
  conditions: ConditionEvaluation[];
}

export interface ScholarAutomationDecision {
  proceed: boolean;
  reason: string;
  risk: RiskLevel | null;
}

/** Evaluate a Scholar operation against its conditions (fail-closed). */
export function evaluateScholarAutomation(
  input: ScholarAutomationInput,
): ScholarAutomationDecision {
  const risk = SCHOLAR_AUTOMATION_RISK[input.kind as ScholarAutomationKind];
  if (!risk) {
    return {
      proceed: false,
      reason: `Unknown Scholar automation kind "${input.kind}" — fail closed`,
      risk: null,
    };
  }
  const highRisk = riskLevelOrdinal(risk) >= riskLevelOrdinal("R3");
  const verdict = applyFailClosed(input.conditions, highRisk);
  return { proceed: verdict.proceed, reason: verdict.reason, risk };
}
