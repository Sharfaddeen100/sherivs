/**
 * Sherivs Scholar — facility availability, scheduling & conflicts
 * (Phase-04 §74–76).
 *
 * Facilities declare availability, capacity, restrictions, equipment and
 * maintenance state (§74). Conflict detection finds double bookings, capacity
 * violations, incompatible activities and maintenance conflicts (§75).
 * Maintenance states are operational, degraded, maintenance and unavailable
 * (§76).
 */

export type FacilityState = "operational" | "degraded" | "maintenance" | "unavailable";

export const FACILITY_STATES: readonly FacilityState[] = [
  "operational",
  "degraded",
  "maintenance",
  "unavailable",
] as const;

export interface FacilityStatus {
  facilityId: string;
  state: FacilityState;
  capacity: number;
}

export interface FacilityBooking {
  facilityId: string;
  activityRef: string;
  /** Inclusive minutes from 00:00 (0–1439 start, ≤1440 end). */
  startMinute: number;
  endMinute: number;
  attendees: number;
}

export type FacilityConflictKind =
  "double_booking" | "capacity_violation" | "incompatible_activity" | "maintenance_conflict";

export interface FacilityConflict {
  kind: FacilityConflictKind;
  facilityId: string;
  detail: string;
}

export function validateFacilityBookings(bookings: readonly FacilityBooking[]): string[] {
  const issues: string[] = [];
  for (const booking of bookings) {
    if (!booking.facilityId.trim() || !booking.activityRef.trim()) {
      issues.push("a booking requires facilityId and activityRef");
      continue;
    }
    if (!Number.isInteger(booking.startMinute) || !Number.isInteger(booking.endMinute)) {
      issues.push(`booking "${booking.activityRef}": times must be whole minutes`);
      continue;
    }
    if (
      booking.startMinute < 0 ||
      booking.endMinute > 1440 ||
      booking.endMinute <= booking.startMinute
    ) {
      issues.push(`booking "${booking.activityRef}": invalid time window (0–1440, end > start)`);
    }
    if (!Number.isInteger(booking.attendees) || booking.attendees < 1) {
      issues.push(`booking "${booking.activityRef}": attendees must be a positive integer`);
    }
  }
  return issues;
}

function windowsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function detectFacilityConflicts(
  bookings: readonly FacilityBooking[],
  statuses: ReadonlyMap<string, FacilityStatus>,
  incompatiblePairs: ReadonlyArray<readonly [string, string]> = [],
  maintenanceWindows: ReadonlyArray<{
    facilityId: string;
    startMinute: number;
    endMinute: number;
  }> = [],
): FacilityConflict[] {
  const conflicts: FacilityConflict[] = [];

  for (const booking of bookings) {
    const status = statuses.get(booking.facilityId);
    if (status) {
      if (status.state === "maintenance" || status.state === "unavailable") {
        conflicts.push({
          kind: "maintenance_conflict",
          facilityId: booking.facilityId,
          detail: `booking "${booking.activityRef}" targets a facility in state "${status.state}"`,
        });
      }
      if (booking.attendees > status.capacity) {
        conflicts.push({
          kind: "capacity_violation",
          facilityId: booking.facilityId,
          detail: `booking "${booking.activityRef}" needs ${booking.attendees} seats but capacity is ${status.capacity}`,
        });
      }
    }

    for (const window of maintenanceWindows) {
      if (
        window.facilityId === booking.facilityId &&
        windowsOverlap(booking.startMinute, booking.endMinute, window.startMinute, window.endMinute)
      ) {
        conflicts.push({
          kind: "maintenance_conflict",
          facilityId: booking.facilityId,
          detail: `booking "${booking.activityRef}" overlaps a maintenance window`,
        });
      }
    }
  }

  for (let i = 0; i < bookings.length; i += 1) {
    for (let j = i + 1; j < bookings.length; j += 1) {
      const a = bookings[i];
      const b = bookings[j];
      if (a.facilityId !== b.facilityId) continue;
      if (!windowsOverlap(a.startMinute, a.endMinute, b.startMinute, b.endMinute)) continue;
      const activityPair: [string, string] = [a.activityRef, b.activityRef];
      const isIncompatible = incompatiblePairs.some(
        (pair) =>
          (pair[0] === activityPair[0] && pair[1] === activityPair[1]) ||
          (pair[0] === activityPair[1] && pair[1] === activityPair[0]),
      );
      conflicts.push({
        kind: isIncompatible ? "incompatible_activity" : "double_booking",
        facilityId: a.facilityId,
        detail: `"${a.activityRef}" and "${b.activityRef}" overlap at facility "${a.facilityId}"${isIncompatible ? " and are incompatible" : ""}`,
      });
    }
  }

  return conflicts;
}
