/**
 * Sherivs Scholar — boarding model (Phase-04 §57).
 *
 * Boarding configuration covers dormitories, houses, beds, supervisors,
 * schedules, meals, attendance and incidents. This module keeps the boarding
 * reality honest: beds belong to declared facilities, a learner holds at most
 * one ACTIVE boarding assignment, and declared bed capacity is never exceeded.
 */

import { isValidIsoDate } from "./academic-period";

export interface BoardingFacility {
  id: string;
  name: string;
  kind: "dormitory" | "house" | "custom";
  bedCount: number;
  supervisorIds?: string[];
  campus?: string | null;
}

export interface BoardingAssignment {
  studentId: string;
  facilityId: string;
  active?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
}

export type BoardingIncidentKind = "wellbeing" | "safety" | "discipline" | "other";

export interface BoardingIncident {
  facilityId: string;
  date: string;
  kind: BoardingIncidentKind;
  reportedBy: string;
  detail: string;
}

export interface MealSchedule {
  id: string;
  facilityId: string;
  name: string;
  /** Free-form time/days — institutions define boarding rhythm. */
  when?: string | null;
}

export function validateBoarding(
  facilities: readonly BoardingFacility[],
  assignments: readonly BoardingAssignment[],
): string[] {
  const issues: string[] = [];
  const facilityIds = new Set<string>();

  for (const facility of facilities) {
    const id = facility.id.trim();
    if (!id) {
      issues.push("a boarding facility requires an id");
      continue;
    }
    if (facilityIds.has(id)) issues.push(`duplicate boarding facility id "${id}"`);
    facilityIds.add(id);
    if (!facility.name.trim()) issues.push(`boarding facility "${id}": name is required`);
    if (!Number.isInteger(facility.bedCount) || facility.bedCount < 0) {
      issues.push(`boarding facility "${id}": bedCount must be a non-negative integer`);
    }
    if (facility.supervisorIds?.some((s) => !s.trim())) {
      issues.push(`boarding facility "${id}": supervisor ids must not be blank`);
    }
  }

  const activeByStudent = new Set<string>();
  const countByFacility = new Map<string, number>();
  for (const assignment of assignments) {
    if (!assignment.studentId.trim() || !assignment.facilityId.trim()) {
      issues.push("a boarding assignment requires studentId and facilityId");
      continue;
    }
    if (!facilityIds.has(assignment.facilityId)) {
      issues.push(`boarding assignment references unknown facility "${assignment.facilityId}"`);
    }
    if (assignment.active !== false) {
      if (activeByStudent.has(assignment.studentId)) {
        issues.push(
          `student "${assignment.studentId}" has more than one active boarding assignment`,
        );
      }
      activeByStudent.add(assignment.studentId);
      countByFacility.set(
        assignment.facilityId,
        (countByFacility.get(assignment.facilityId) ?? 0) + 1,
      );
    }
    if (assignment.validFrom && !isValidIsoDate(assignment.validFrom)) {
      issues.push(
        `boarding assignment for "${assignment.studentId}": validFrom must be YYYY-MM-DD`,
      );
    }
  }
  for (const facility of facilities) {
    const occupied = countByFacility.get(facility.id) ?? 0;
    if (occupied > facility.bedCount) {
      issues.push(
        `boarding facility "${facility.id}" is over capacity: ${occupied} assigned for ${facility.bedCount} beds`,
      );
    }
  }

  return issues;
}

export const BOARDING_INCIDENT_KINDS: readonly BoardingIncidentKind[] = [
  "wellbeing",
  "safety",
  "discipline",
  "other",
] as const;

export function validateBoardingIncident(incident: BoardingIncident): string[] {
  const issues: string[] = [];
  if (!incident.facilityId.trim()) issues.push("an incident requires a facilityId");
  if (!isValidIsoDate(incident.date)) issues.push("incident date must be YYYY-MM-DD");
  if (!BOARDING_INCIDENT_KINDS.includes(incident.kind)) {
    issues.push(`incident kind must be one of ${BOARDING_INCIDENT_KINDS.join(", ")}`);
  }
  if (!incident.reportedBy.trim()) issues.push("an incident requires a reporter");
  if (!incident.detail.trim()) issues.push("an incident requires detail");
  return issues;
}

export function validateMealSchedules(
  schedules: readonly MealSchedule[],
  knownFacilityIds: ReadonlySet<string>,
): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const schedule of schedules) {
    const id = schedule.id.trim();
    if (!id) {
      issues.push("a meal schedule requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate meal schedule id "${id}"`);
    ids.add(id);
    if (!knownFacilityIds.has(schedule.facilityId)) {
      issues.push(
        `meal schedule "${id}" references unknown boarding facility "${schedule.facilityId}"`,
      );
    }
    if (!schedule.name.trim()) issues.push(`meal schedule "${id}": name is required`);
  }
  return issues;
}
