/**
 * CoreGrid Scholar — evidence model + learning evidence graph
 * (Phase-04 §100–101).
 *
 * Educational evidence may include assignments, exams, projects, practicals,
 * attendance, competency and teacher observation (§100). Evidence anchors to
 * its learner and (optionally) subject/competency, forming a learning evidence
 * graph (§101) that later clusters consume.
 */

import { isValidIsoDate } from "./academic-period";

export type EvidenceKind =
  | "assignment"
  | "exam"
  | "project"
  | "practical"
  | "attendance"
  | "competency"
  | "teacher_observation"
  | "custom";

export const EVIDENCE_KINDS: readonly EvidenceKind[] = [
  "assignment",
  "exam",
  "project",
  "practical",
  "attendance",
  "competency",
  "teacher_observation",
  "custom",
] as const;

export interface EvidenceItem {
  id: string;
  studentId: string;
  kind: EvidenceKind;
  capturedAt: string;
  artifactRef?: string | null;
  subjectCode?: string | null;
  competencyCode?: string | null;
  sourceRef?: string | null;
}

export function validateEvidence(input: readonly EvidenceItem[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const item of input) {
    const id = item.id.trim();
    if (!id) {
      issues.push("evidence requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate evidence id "${id}"`);
    ids.add(id);
    if (!item.studentId.trim()) issues.push(`evidence "${id}": studentId is required`);
    if (!EVIDENCE_KINDS.includes(item.kind)) {
      issues.push(`evidence "${id}": kind must be one of ${EVIDENCE_KINDS.join(", ")}`);
    }
    if (!Number.isFinite(Date.parse(item.capturedAt))) {
      issues.push(`evidence "${id}": capturedAt must be a valid timestamp`);
    }
    if (item.subjectCode && item.competencyCode) {
      // Both anchors allowed; nothing to enforce beyond reference checks later.
    }
  }
  return issues;
}

/** Group evidence by student for the learning evidence graph (§101). */
export function evidenceForStudent(
  evidence: readonly EvidenceItem[],
  studentId: string,
): EvidenceItem[] {
  return evidence.filter((item) => item.studentId === studentId);
}

/** Latest evidence per student+kind (by capturedAt), for portfolio feeds. */
export function latestEvidencePerKind(
  evidence: readonly EvidenceItem[],
  studentId: string,
): Map<EvidenceKind, EvidenceItem> {
  const latest = new Map<EvidenceKind, EvidenceItem>();
  for (const item of evidenceForStudent(evidence, studentId)) {
    const current = latest.get(item.kind);
    if (!current || item.capturedAt > current.capturedAt) latest.set(item.kind, item);
  }
  return latest;
}

export function isIsoDate(value: string): boolean {
  return isValidIsoDate(value);
}
