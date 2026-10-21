/**
 * Sherivs Scholar — privacy, child data, audit, retention, residency
 * (Phase-04 §136–140, M3).
 *
 * Privacy boundary contract: sensitive educational data is PURPOSE-LIMITED
 * (§136), student information receives heightened child-data protection
 * (§137), sensitive mutations produce audit records (§138), retention rules
 * are configurable (§139) and residency is supported where jurisdiction
 * requires it (§140). M2 (tenant isolation §134) and M4 (security §141) are
 * consumed from P03/P08/P09 and the dedicated security phases — this module
 * carries only the Scholar privacy SEMANTICS, never a second enforcement
 * stack.
 */

export type DataPurpose =
  "administration" | "teaching" | "assessment" | "welfare" | "communication" | "analytics";

export const DATA_PURPOSES: readonly DataPurpose[] = [
  "administration",
  "teaching",
  "assessment",
  "welfare",
  "communication",
  "analytics",
] as const;

export interface DataUsePurpose {
  id: string;
  purpose: DataPurpose;
  dataKinds: string[];
  retentionDays?: number | null;
  residencyRegion?: string | null;
}

export function validateDataPurposes(input: readonly DataUsePurpose[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const use of input) {
    const id = use.id.trim();
    if (!id) {
      issues.push("a data-use purpose requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate data-use purpose id "${id}"`);
    ids.add(id);
    if (!DATA_PURPOSES.includes(use.purpose)) {
      issues.push(`purpose "${id}": purpose must be one of ${DATA_PURPOSES.join(", ")}`);
    }
    if (use.dataKinds.length === 0) issues.push(`purpose "${id}": dataKinds must not be empty`);
    if (
      use.retentionDays != null &&
      (!Number.isInteger(use.retentionDays) || use.retentionDays < 1)
    ) {
      issues.push(`purpose "${id}": retentionDays must be a positive integer when provided`);
    }
  }
  return issues;
}

/** §137: student data kinds that always require heightened protection. */
export const CHILD_DATA_KINDS: readonly string[] = [
  "attendance",
  "grades",
  "assessment",
  "discipline",
  "welfare",
  "safeguarding",
  "counselling",
  "health",
] as const;

export function isChildData(dataKind: string): boolean {
  return CHILD_DATA_KINDS.includes(dataKind);
}

/**
 * §136 purpose limitation: a processing purpose may use a data kind only when
 * it declared it AND (for child data) retention is defined.
 */
export function purposeAllowsDataKind(
  use: DataUsePurpose,
  dataKind: string,
): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!use.dataKinds.includes(dataKind)) {
    reasons.push(`purpose "${use.id}" does not declare data kind "${dataKind}"`);
  }
  if (isChildData(dataKind) && use.retentionDays == null) {
    reasons.push(`child data "${dataKind}" requires a retention rule`);
  }
  return { allowed: reasons.length === 0, reasons };
}

/** §139/§140 retention + residency summary for a purpose. */
export function retentionSummary(use: DataUsePurpose): {
  retentionDays: number | null;
  residencyRegion: string | null;
} {
  return { retentionDays: use.retentionDays ?? null, residencyRegion: use.residencyRegion ?? null };
}

/** §138: an audit record for a sensitive mutation (append-only by contract). */
export interface SensitiveAccessAudit {
  at: string;
  actorIdentityId: string;
  action: string;
  subjectKind: string;
  subjectId: string;
  purpose?: string | null;
  outcome: "allowed" | "denied";
}

export function validateAuditRecord(record: SensitiveAccessAudit): string[] {
  const issues: string[] = [];
  if (!Number.isFinite(Date.parse(record.at)))
    issues.push("audit record requires a valid timestamp");
  if (!record.actorIdentityId.trim() || !record.subjectId.trim()) {
    issues.push("audit record requires actorIdentityId and subjectId");
  }
  if (!record.action.trim()) issues.push("audit record requires an action");
  if (!record.subjectKind.trim()) issues.push("audit record requires a subjectKind");
  return issues;
}
