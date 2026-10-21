/**
 * Sherivs Scholar — educational workflow triggers (Phase-04 §114–115,
 * BOUNDARY: L3).
 *
 * Phase 17 owns automation EXECUTION; Phase 04 owns educational meaning and
 * CONTEXT (§115). This module therefore declares the TRIGGERS and context the
 * Scholar runtime supplies to P17 — it never executes workflows itself.
 */

export type EducationalTriggerType =
  | "configuration_changed"
  | "enrolment_changed"
  | "attendance_anomaly"
  | "examination_published"
  | "grade_recorded"
  | "facility_conflict"
  | "guardian_relationship_changed"
  | "custom";

export const EDUCATIONAL_TRIGGER_TYPES: readonly EducationalTriggerType[] = [
  "configuration_changed",
  "enrolment_changed",
  "attendance_anomaly",
  "examination_published",
  "grade_recorded",
  "facility_conflict",
  "guardian_relationship_changed",
  "custom",
] as const;

export interface EducationalTrigger {
  id: string;
  type: EducationalTriggerType;
  eventType: string;
  /** Educational context for the workflow — P17 executes from this. */
  contextRef?: string | null;
  tenantId?: string | null;
}

export function validateEducationalTriggers(input: readonly EducationalTrigger[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const trigger of input) {
    const id = trigger.id.trim();
    if (!id) {
      issues.push("a trigger requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate trigger id "${id}"`);
    ids.add(id);
    if (!EDUCATIONAL_TRIGGER_TYPES.includes(trigger.type)) {
      issues.push(`trigger "${id}": type must be one of ${EDUCATIONAL_TRIGGER_TYPES.join(", ")}`);
    }
    if (!trigger.eventType.trim()) issues.push(`trigger "${id}": eventType is required`);
  }
  return issues;
}
