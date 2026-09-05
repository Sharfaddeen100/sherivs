/**
 * CoreGrid Scholar — attendance events (Phase-04 §39).
 *
 * Attendance events — present, absent, late, excused, early departure, remote
 * and field activity (§39) — are projected onto the universal kernel event
 * contract (`kernel/reality.ts` eventDraft). Every event carries a stable
 * aggregate identity and (when supplied by the runtime) an idempotency key so
 * the event fabric never double-counts a mark.
 */

import { eventDraft } from "@/lib/kernel/reality";
import { isValidIsoDate } from "./academic-period";
import type { AttendanceContext, AttendanceStatus } from "./attendance-model";

export const ATTENDANCE_EVENT_KINDS: readonly AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "excused",
  "early_departure",
  "remote",
  "field_activity",
] as const;

export interface AttendanceEventInput {
  context: AttendanceContext;
  /** Class/event/practical/boarding-group scope. */
  subjectId: string;
  /** Identity (student/staff) whose attendance is being recorded. */
  personId: string;
  date: string;
  status: AttendanceStatus;
  shiftName?: string | null;
  occurredAt?: string | null;
  actorIdentity?: string | null;
  tenantId?: string | null;
  idempotencyKey?: string | null;
  notes?: string | null;
}

export function recordAttendanceEvent(input: AttendanceEventInput, now: string) {
  if (!ATTENDANCE_EVENT_KINDS.includes(input.status)) {
    throw new Error(`status must be one of ${ATTENDANCE_EVENT_KINDS.join(", ")}`);
  }
  if (!input.subjectId.trim() || !input.personId.trim()) {
    throw new Error("subjectId and personId are required");
  }
  if (!isValidIsoDate(input.date)) {
    throw new Error("date must be YYYY-MM-DD");
  }
  const aggregateId = `${input.context}::${input.subjectId}::${input.personId}::${input.date}`;
  return eventDraft(
    {
      eventType: `scholar.attendance.${input.status}`,
      aggregateType: "scholar.attendance",
      aggregateId,
      actorIdentity: input.actorIdentity,
      tenantId: input.tenantId,
      correlationId: input.idempotencyKey ? `idem:${input.idempotencyKey}` : null,
      idempotencyKey: input.idempotencyKey,
      payload: {
        context: input.context,
        subjectId: input.subjectId,
        personId: input.personId,
        date: input.date,
        status: input.status,
        shiftName: input.shiftName ?? null,
        notes: input.notes ?? null,
      },
      occurredAt: input.occurredAt ?? `${input.date}T00:00:00.000Z`,
    },
    now,
  );
}
