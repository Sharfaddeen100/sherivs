/**
 * CoreGrid Scholar — safeguarding (Phase-04 §56).
 *
 * Safeguarding supports CONTROLLED cases, incident reports, escalation,
 * responsible officers and restricted evidence. Everything here is
 * high-sensitivity by default: restricted evidence names its access roles
 * explicitly and escalation always names the officer and reason.
 */

export interface SafeguardingCase {
  id: string;
  studentId: string;
  status: "open" | "investigating" | "monitored" | "closed";
  openedAt: string;
  responsibleOfficerId?: string | null;
}

export type SafeguardingIncidentKind = "abuse" | "neglect" | "bullying" | "self_harm" | "other";

export interface SafeguardingIncident {
  id: string;
  caseId: string;
  date: string;
  kind: SafeguardingIncidentKind;
  detail: string;
}

export interface SafeguardingEscalation {
  id: string;
  caseId: string;
  escalatedTo: string;
  reason: string;
  at: string;
}

export interface RestrictedEvidence {
  id: string;
  caseId: string;
  evidenceRef: string;
  /** Roles allowed to view — must be explicitly non-empty. */
  accessRoles: string[];
}

export const SAFEGUARDING_STATUSES = ["open", "investigating", "monitored", "closed"] as const;
export const SAFEGUARDING_INCIDENT_KINDS: readonly SafeguardingIncidentKind[] = [
  "abuse",
  "neglect",
  "bullying",
  "self_harm",
  "other",
] as const;

export function validateSafeguardingCases(input: readonly SafeguardingCase[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const safeguardingCase of input) {
    if (!safeguardingCase.id.trim()) {
      issues.push("a safeguarding case requires an id");
      continue;
    }
    if (ids.has(safeguardingCase.id))
      issues.push(`duplicate safeguarding case id "${safeguardingCase.id}"`);
    ids.add(safeguardingCase.id);
    if (!safeguardingCase.studentId.trim())
      issues.push(`case "${safeguardingCase.id}": studentId is required`);
    if (!(SAFEGUARDING_STATUSES as readonly string[]).includes(safeguardingCase.status)) {
      issues.push(
        `case "${safeguardingCase.id}": status must be one of ${SAFEGUARDING_STATUSES.join(", ")}`,
      );
    }
  }
  return issues;
}

export function validateSafeguardingIncidents(
  input: readonly SafeguardingIncident[],
  knownCaseIds?: ReadonlySet<string> | null,
): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const incident of input) {
    if (!incident.id.trim()) {
      issues.push("an incident requires an id");
      continue;
    }
    if (ids.has(incident.id)) issues.push(`duplicate incident id "${incident.id}"`);
    ids.add(incident.id);
    if (!knownCaseIds || knownCaseIds.has(incident.caseId)) {
      if (!incident.caseId.trim()) issues.push(`incident "${incident.id}": caseId is required`);
    } else {
      issues.push(`incident "${incident.id}": unknown safeguarding case "${incident.caseId}"`);
    }
    if (!SAFEGUARDING_INCIDENT_KINDS.includes(incident.kind)) {
      issues.push(
        `incident "${incident.id}": kind must be one of ${SAFEGUARDING_INCIDENT_KINDS.join(", ")}`,
      );
    }
    if (!incident.detail.trim()) issues.push(`incident "${incident.id}": detail is required`);
  }
  return issues;
}

export function validateEscalation(escalation: SafeguardingEscalation): string[] {
  const issues: string[] = [];
  if (!escalation.id.trim() || !escalation.caseId.trim())
    issues.push("an escalation requires id and caseId");
  if (!escalation.escalatedTo.trim())
    issues.push(`escalation "${escalation.id}": escalatedTo is required`);
  if (!escalation.reason.trim()) issues.push(`escalation "${escalation.id}": reason is required`);
  if (!Number.isFinite(Date.parse(escalation.at))) {
    issues.push(`escalation "${escalation.id}": at must be a valid timestamp`);
  }
  return issues;
}

/** Restricted evidence is only viewable by explicitly named roles (§56). */
export function validateRestrictedEvidence(input: readonly RestrictedEvidence[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const evidence of input) {
    if (!evidence.id.trim()) {
      issues.push("restricted evidence requires an id");
      continue;
    }
    if (ids.has(evidence.id)) issues.push(`duplicate restricted-evidence id "${evidence.id}"`);
    ids.add(evidence.id);
    if (!evidence.evidenceRef.trim())
      issues.push(`evidence "${evidence.id}": evidenceRef is required`);
    if (!evidence.caseId.trim()) issues.push(`evidence "${evidence.id}": caseId is required`);
    if (evidence.accessRoles.length === 0) {
      issues.push(`evidence "${evidence.id}": accessRoles must not be empty (no default access)`);
    }
  }
  return issues;
}
