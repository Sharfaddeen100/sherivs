/**
 * CoreGrid Scholar — student documents + document relationships
 * (Phase-04 §98–99).
 *
 * Documents may include report cards, certificates, transcripts, letters,
 * statements and attendance records (§98). Documents MUST reference their
 * educational context (§99) — a document that cannot name its student (and
 * its period/subject where relevant) is not valid.
 */

import { isValidIsoDate } from "./academic-period";

export type DocumentKind =
  | "report_card"
  | "certificate"
  | "transcript"
  | "letter"
  | "statement"
  | "attendance_record"
  | "custom";

export const DOCUMENT_KINDS: readonly DocumentKind[] = [
  "report_card",
  "certificate",
  "transcript",
  "letter",
  "statement",
  "attendance_record",
  "custom",
] as const;

export interface StudentDocument {
  id: string;
  studentId: string;
  kind: DocumentKind;
  issuedAt?: string | null;
  /** §99: educational context — period/subject/class refs where applicable. */
  periodCode?: string | null;
  subjectCode?: string | null;
  classCohortId?: string | null;
  contentRef?: string | null;
}

export function validateDocuments(input: readonly StudentDocument[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const document of input) {
    const id = document.id.trim();
    if (!id) {
      issues.push("a document requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate document id "${id}"`);
    ids.add(id);
    // §99: educational context is mandatory.
    if (!document.studentId.trim()) {
      issues.push(`document "${id}": studentId (educational context) is required`);
    }
    if (!DOCUMENT_KINDS.includes(document.kind)) {
      issues.push(`document "${id}": kind must be one of ${DOCUMENT_KINDS.join(", ")}`);
    }
    if (document.issuedAt && !isValidIsoDate(document.issuedAt.slice(0, 10))) {
      issues.push(`document "${id}": issuedAt must be a valid date/time`);
    }
  }
  return issues;
}
