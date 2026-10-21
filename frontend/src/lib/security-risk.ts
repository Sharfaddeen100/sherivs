/**
 * Sherivs — Security Engine risk evaluation (Phase 08, Section K).
 *
 * Implements `architecture/phase-08-security-engine.md`:
 * - Risk signals (K.2): unusual location/device/time/behavior, privilege
 *   escalation, repeated failures, abnormal volume, impossible travel,
 *   anomalous agent behavior, suspicious tool usage.
 * - Risk levels (K.3): LOW, GUARDED, ELEVATED, HIGH, CRITICAL.
 * - Risk actions (K.4): allow, additional verification, reduced privileges,
 *   rate limiting, temporary block, quarantine, human review.
 */

export type RiskLevel = "LOW" | "GUARDED" | "ELEVATED" | "HIGH" | "CRITICAL";

export const RISK_LEVELS: readonly RiskLevel[] = [
  "LOW",
  "GUARDED",
  "ELEVATED",
  "HIGH",
  "CRITICAL",
] as const;

export type RiskSignalType =
  | "unusual_location"
  | "unusual_device"
  | "unusual_time"
  | "unusual_behavior"
  | "privilege_escalation"
  | "repeated_failures"
  | "abnormal_request_volume"
  | "suspicious_api_pattern"
  | "impossible_travel"
  | "anomalous_agent_behavior"
  | "suspicious_tool_usage";

export const RISK_SIGNAL_TYPES: readonly RiskSignalType[] = [
  "unusual_location",
  "unusual_device",
  "unusual_time",
  "unusual_behavior",
  "privilege_escalation",
  "repeated_failures",
  "abnormal_request_volume",
  "suspicious_api_pattern",
  "impossible_travel",
  "anomalous_agent_behavior",
  "suspicious_tool_usage",
] as const;

export interface RiskSignal {
  type: RiskSignalType;
  /** Signal weight, 0-100. Higher = more suspicious. */
  weight: number;
  evidence: string;
}

/** Weight assigned to each signal category when none is explicitly provided. */
const DEFAULT_SIGNAL_WEIGHTS: Record<RiskSignalType, number> = {
  unusual_location: 20,
  unusual_device: 25,
  unusual_time: 10,
  unusual_behavior: 20,
  privilege_escalation: 60,
  repeated_failures: 35,
  abnormal_request_volume: 30,
  suspicious_api_pattern: 40,
  impossible_travel: 70,
  anomalous_agent_behavior: 45,
  suspicious_tool_usage: 50,
} as const;

export function defaultSignalWeight(type: RiskSignalType): number {
  return DEFAULT_SIGNAL_WEIGHTS[type];
}

/* ─────────────────────────────────────────────────────────────
 * Risk scoring (K.2, K.3)
 * ────────────────────────────────────────────────────────────*/

export interface RiskScoreResult {
  score: number;
  level: RiskLevel;
  signals: RiskSignal[];
}

/**
 * Combine risk signals into a bounded score (0-100) and a discrete level.
 * Scoring is additive but capped; a single CRITICAL-weight signal (>=70)
 * always forces at least HIGH regardless of other signals (Section K).
 */
export function evaluateRisk(signals: RiskSignal[]): RiskScoreResult {
  const rawScore = signals.reduce((sum, s) => sum + s.weight, 0);
  const score = Math.min(100, Math.max(0, rawScore));
  const hasCriticalSignal = signals.some((s) => s.weight >= 70);

  let level: RiskLevel;
  if (hasCriticalSignal || score >= 85) {
    level = "CRITICAL";
  } else if (score >= 60) {
    level = "HIGH";
  } else if (score >= 35) {
    level = "ELEVATED";
  } else if (score >= 15) {
    level = "GUARDED";
  } else {
    level = "LOW";
  }

  return { score, level, signals };
}

/* ─────────────────────────────────────────────────────────────
 * Risk actions (K.4)
 * ────────────────────────────────────────────────────────────*/

export type RiskAction =
  | "allow"
  | "additional_verification"
  | "reduced_privileges"
  | "rate_limit"
  | "temporary_block"
  | "quarantine"
  | "human_review";

export function riskActionForLevel(level: RiskLevel): RiskAction {
  switch (level) {
    case "LOW":
      return "allow";
    case "GUARDED":
      return "additional_verification";
    case "ELEVATED":
      return "reduced_privileges";
    case "HIGH":
      return "rate_limit";
    case "CRITICAL":
      return "quarantine";
  }
}

/**
 * High-risk actions on sensitive resources should always escalate to human
 * review regardless of the base risk-level action (Section K.4, N.3).
 */
export function riskActionForSensitiveOperation(
  level: RiskLevel,
  isSensitiveOperation: boolean,
): RiskAction {
  if (isSensitiveOperation && (level === "HIGH" || level === "CRITICAL")) {
    return "human_review";
  }
  return riskActionForLevel(level);
}
