/**
 * Sherivs Scholar — counselling (Phase-04 §54).
 *
 * Counselling models counsellors, appointments, cases, referrals and
 * interventions. §54 requires STRICT ACCESS CONTROLS for sensitive counselling
 * information — this module carries a restricted-access guard whose allow-list
 * is supplied by policy (roles come from the P08 gate, never the client).
 */

export interface Counsellor {
  id: string;
  name: string;
}

export type CaseStatus = "open" | "in_progress" | "closed";

export interface CounsellingAppointment {
  id: string;
  counsellorId: string;
  studentId: string;
  scheduledAt: string;
  notes?: string | null;
}

export interface CounsellingCase {
  id: string;
  studentId: string;
  status: CaseStatus;
  openedAt: string;
  closedAt?: string | null;
}

export interface CounsellingReferral {
  id: string;
  caseId: string;
  toService: string;
  reason: string;
}

export interface CounsellingIntervention {
  id: string;
  caseId: string;
  type: string;
  startedAt: string;
  endedAt?: string | null;
}

export const COUNSELLING_CASE_STATUSES: readonly CaseStatus[] = [
  "open",
  "in_progress",
  "closed",
] as const;

export function validateCounselling(
  counsellors: readonly Counsellor[],
  appointments: readonly CounsellingAppointment[],
  cases: readonly CounsellingCase[],
): string[] {
  const issues: string[] = [];
  const counsellorIds = new Set(counsellors.map((c) => c.id));
  const caseIds = new Set(cases.map((c) => c.id));
  const appointmentIds = new Set<string>();

  for (const counsellor of counsellors) {
    if (!counsellor.id.trim()) issues.push("a counsellor requires an id");
    if (!counsellor.name.trim()) issues.push(`counsellor "${counsellor.id}": name is required`);
  }
  for (const appointment of appointments) {
    if (!appointment.id.trim()) issues.push("an appointment requires an id");
    else if (appointmentIds.has(appointment.id))
      issues.push(`duplicate appointment id "${appointment.id}"`);
    appointmentIds.add(appointment.id);
    if (!counsellorIds.has(appointment.counsellorId)) {
      issues.push(
        `appointment "${appointment.id}": unknown counsellor "${appointment.counsellorId}"`,
      );
    }
    if (!appointment.studentId.trim())
      issues.push(`appointment "${appointment.id}": studentId is required`);
    if (!Number.isFinite(Date.parse(appointment.scheduledAt))) {
      issues.push(`appointment "${appointment.id}": scheduledAt must be a valid timestamp`);
    }
  }
  for (const counsellingCase of cases) {
    if (!counsellingCase.id.trim()) issues.push("a counselling case requires an id");
    if (!caseIds.has(counsellingCase.id))
      issues.push(`case "${counsellingCase.id}" missing from index`);
    if (!counsellingCase.studentId.trim())
      issues.push(`case "${counsellingCase.id}": studentId is required`);
    if (!COUNSELLING_CASE_STATUSES.includes(counsellingCase.status)) {
      issues.push(
        `case "${counsellingCase.id}": status must be one of ${COUNSELLING_CASE_STATUSES.join(", ")}`,
      );
    }
  }
  return issues;
}

export function validateCounsellingReferral(referral: CounsellingReferral): string[] {
  const issues: string[] = [];
  if (!referral.id.trim() || !referral.caseId.trim())
    issues.push("a referral requires id and caseId");
  if (!referral.toService.trim()) issues.push(`referral "${referral.id}": toService is required`);
  if (!referral.reason.trim()) issues.push(`referral "${referral.id}": reason is required`);
  return issues;
}

export function validateCounsellingIntervention(intervention: CounsellingIntervention): string[] {
  const issues: string[] = [];
  if (!intervention.id.trim() || !intervention.caseId.trim())
    issues.push("an intervention requires id and caseId");
  if (!intervention.type.trim()) issues.push(`intervention "${intervention.id}": type is required`);
  if (!Number.isFinite(Date.parse(intervention.startedAt))) {
    issues.push(`intervention "${intervention.id}": startedAt must be a valid timestamp`);
  }
  if (intervention.endedAt && intervention.endedAt < intervention.startedAt) {
    issues.push(`intervention "${intervention.id}": endedAt precedes startedAt`);
  }
  return issues;
}

/**
 * §54 strict-access guard: a counselling case is readable only by roles on the
 * designated allow-list (default: school admin + designated safeguarding
 * officer). The role list must be resolved server-side through P08.
 */
export function canAccessCounsellingCase(
  actorRoles: readonly string[],
  allowedRoles: readonly string[] = ["school_admin", "designated_safeguarding_officer"],
): boolean {
  return actorRoles.some((role) => allowedRoles.includes(role));
}
