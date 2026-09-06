/**
 * CoreGrid Scholar — student welfare (Phase-04 §55).
 *
 * Welfare supports cases, referrals, support services, emergency contacts and
 * institutional interventions. Welfare data is sensitive; access is governed by
 * policy elsewhere in the runtime.
 */

export interface WelfareCase {
  id: string;
  studentId: string;
  status: "open" | "in_progress" | "monitored" | "closed";
  openedAt: string;
  kind?: string | null;
  assignedSupportStaffId?: string | null;
}

export interface SupportService {
  id: string;
  name: string;
  provider?: string | null;
  contactRef?: string | null;
}

export interface EmergencyContact {
  id: string;
  studentId: string;
  contactIdentityId: string;
  priority: number;
}

export interface WelfareIntervention {
  id: string;
  caseId: string;
  type: string;
  startedAt: string;
}

export const WELFARE_CASE_STATUSES = ["open", "in_progress", "monitored", "closed"] as const;

export function validateWelfareCases(input: readonly WelfareCase[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const welfareCase of input) {
    if (!welfareCase.id.trim()) {
      issues.push("a welfare case requires an id");
      continue;
    }
    if (ids.has(welfareCase.id)) issues.push(`duplicate welfare case id "${welfareCase.id}"`);
    ids.add(welfareCase.id);
    if (!welfareCase.studentId.trim())
      issues.push(`welfare case "${welfareCase.id}": studentId is required`);
    if (!(WELFARE_CASE_STATUSES as readonly string[]).includes(welfareCase.status)) {
      issues.push(
        `welfare case "${welfareCase.id}": status must be one of ${WELFARE_CASE_STATUSES.join(", ")}`,
      );
    }
  }
  return issues;
}

export function validateSupportServices(input: readonly SupportService[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const service of input) {
    if (!service.id.trim()) {
      issues.push("a support service requires an id");
      continue;
    }
    if (ids.has(service.id)) issues.push(`duplicate support service id "${service.id}"`);
    ids.add(service.id);
    if (!service.name.trim()) issues.push(`support service "${service.id}": name is required`);
  }
  return issues;
}

export function validateEmergencyContacts(
  input: readonly EmergencyContact[],
  knownStudentIds?: ReadonlySet<string> | null,
): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const contact of input) {
    if (!contact.id.trim()) {
      issues.push("an emergency contact requires an id");
      continue;
    }
    if (seen.has(contact.id)) issues.push(`duplicate emergency contact id "${contact.id}"`);
    seen.add(contact.id);
    if (!contact.studentId.trim() || !contact.contactIdentityId.trim()) {
      issues.push(
        `emergency contact "${contact.id}": studentId and contactIdentityId are required`,
      );
    }
    if (knownStudentIds && !knownStudentIds.has(contact.studentId)) {
      issues.push(
        `emergency contact "${contact.id}" references unknown student "${contact.studentId}"`,
      );
    }
    if (!Number.isInteger(contact.priority) || contact.priority < 1) {
      issues.push(`emergency contact "${contact.id}": priority must be a positive integer`);
    }
  }
  return issues;
}

export function validateWelfareInterventions(input: readonly WelfareIntervention[]): string[] {
  const issues: string[] = [];
  for (const intervention of input) {
    if (!intervention.id.trim() || !intervention.caseId.trim()) {
      issues.push("an intervention requires id and caseId");
      continue;
    }
    if (!intervention.type.trim())
      issues.push(`intervention "${intervention.id}": type is required`);
    if (!Number.isFinite(Date.parse(intervention.startedAt))) {
      issues.push(`intervention "${intervention.id}": startedAt must be a valid timestamp`);
    }
  }
  return issues;
}
