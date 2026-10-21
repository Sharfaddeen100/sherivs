/**
 * Sherivs Scholar — examination security (Phase-04 §50).
 *
 * Candidate verification, seating, invigilation, examination rooms, secure
 * papers, controlled access and incident reporting are typed configuration.
 * The guarantees enforced here are the ones that matter: a candidate cannot
 * be seated twice for the same examination, a room cannot hold more candidates
 * than its declared capacity, and incidents are never silently dropped.
 */

import { isValidIsoDate } from "./academic-period";

export interface ExaminationRoom {
  id: string;
  name: string;
  capacity: number;
}

export interface SeatAllocation {
  examinationId: string;
  candidateId: string;
  roomId?: string | null;
  seatNumber?: string | null;
  invigilatorIds?: string[];
}

export type SecurityIncidentKind =
  | "candidate_verification_failure"
  | "seating_conflict"
  | "invigilation_breach"
  | "paper_compromise"
  | "unauthorized_access"
  | "other";

export const SECURITY_INCIDENT_KINDS: readonly SecurityIncidentKind[] = [
  "candidate_verification_failure",
  "seating_conflict",
  "invigilation_breach",
  "paper_compromise",
  "unauthorized_access",
  "other",
] as const;

export interface SecurityIncident {
  examinationId: string;
  kind: SecurityIncidentKind;
  reportedBy: string;
  occurredAt?: string | null;
  detail: string;
}

export function validateSeatAllocations(
  allocations: readonly SeatAllocation[],
  rooms: readonly ExaminationRoom[] = [],
  knownExaminationIds?: ReadonlySet<string> | null,
): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  const capacity = new Map(rooms.map((room) => [room.id, room.capacity]));

  for (const allocation of allocations) {
    if (!allocation.examinationId.trim() || !allocation.candidateId.trim()) {
      issues.push("a seat allocation requires examinationId and candidateId");
      continue;
    }
    const key = `${allocation.examinationId}::${allocation.candidateId}`;
    if (seen.has(key)) {
      issues.push(
        `candidate "${allocation.candidateId}" is seated twice for examination "${allocation.examinationId}"`,
      );
    }
    seen.add(key);
    if (knownExaminationIds && !knownExaminationIds.has(allocation.examinationId)) {
      issues.push(`allocation references unknown examination "${allocation.examinationId}"`);
    }
  }

  for (const room of rooms) {
    if (!Number.isInteger(room.capacity) || room.capacity < 1) {
      issues.push(`room "${room.id}": capacity must be a positive integer`);
    }
  }
  for (const [roomId, limit] of capacity) {
    const seated = allocations.filter((a) => a.roomId === roomId).length;
    if (seated > limit) {
      issues.push(`room "${roomId}" is over capacity: ${seated} seated for capacity ${limit}`);
    }
  }

  return issues;
}

export function validateSecurityIncident(incident: SecurityIncident): string[] {
  const issues: string[] = [];
  if (!incident.examinationId.trim()) issues.push("an incident requires an examinationId");
  if (!incident.reportedBy.trim()) issues.push("an incident requires a reporter");
  if (!incident.detail.trim()) issues.push("an incident requires detail");
  if (!SECURITY_INCIDENT_KINDS.includes(incident.kind)) {
    issues.push(`kind must be one of ${SECURITY_INCIDENT_KINDS.join(", ")}`);
  }
  if (incident.occurredAt != null && !isValidIsoDate(incident.occurredAt.slice(0, 10))) {
    issues.push("occurredAt must be a valid ISO date/time");
  }
  return issues;
}
