/**
 * Sherivs Scholar — temporal reality, history and snapshots (Phase-04
 * §124–127).
 *
 * Relationships carry validity periods (§124); the system preserves historical
 * educational states (§125); authorized users may inspect historical class
 * structures, staff assignments, curricula, schedules and policies (§126); and
 * institutional configurations can be snapshotted (§127). Snapshots are
 * IMMUTABLE — appending always produces a new list and never mutates a
 * previous one.
 */

import { isValidIsoDate } from "./academic-period";

export interface TemporalRecord {
  entityKind: string;
  entityId: string;
  validFrom?: string | null;
  validTo?: string | null;
}

export type SnapshotScope = "configuration" | "structure" | "curriculum" | "schedule" | "policies";

export interface RealitySnapshot {
  snapshotId: string;
  takenAt: string;
  scope: SnapshotScope;
  contentRef: string;
  reason?: string | null;
}

export function validateTemporalRecords(input: readonly TemporalRecord[]): string[] {
  const issues: string[] = [];
  for (const record of input) {
    if (!record.entityKind.trim() || !record.entityId.trim()) {
      issues.push("a temporal record requires entityKind and entityId");
      continue;
    }
    if (record.validFrom != null && !isValidIsoDate(record.validFrom)) {
      issues.push(`record "${record.entityKind}:${record.entityId}": validFrom must be YYYY-MM-DD`);
    }
    if (record.validTo != null && !isValidIsoDate(record.validTo)) {
      issues.push(`record "${record.entityKind}:${record.entityId}": validTo must be YYYY-MM-DD`);
    }
    if (record.validFrom && record.validTo && record.validTo < record.validFrom) {
      issues.push(`record "${record.entityKind}:${record.entityId}": validTo precedes validFrom`);
    }
  }
  return issues;
}

/** Records valid on a date (§124–125 historical reality). */
export function validRecordsOn(records: readonly TemporalRecord[], date: string): TemporalRecord[] {
  return records.filter((record) => {
    if (record.validFrom && record.validFrom > date) return false;
    if (record.validTo && record.validTo < date) return false;
    return true;
  });
}

/** Append an immutable snapshot; duplicate ids or times are rejected. */
export function appendSnapshot(
  snapshots: readonly RealitySnapshot[],
  next: RealitySnapshot,
): { ok: true; snapshots: RealitySnapshot[] } | { ok: false; issue: string } {
  if (!next.snapshotId.trim()) return { ok: false, issue: "a snapshot requires a snapshotId" };
  if (!next.contentRef.trim())
    return { ok: false, issue: `snapshot "${next.snapshotId}": contentRef is required` };
  if (!Number.isFinite(Date.parse(next.takenAt))) {
    return {
      ok: false,
      issue: `snapshot "${next.snapshotId}": takenAt must be a valid ISO timestamp`,
    };
  }
  if (snapshots.some((s) => s.snapshotId === next.snapshotId)) {
    return {
      ok: false,
      issue: `snapshot "${next.snapshotId}" already exists — snapshots are immutable`,
    };
  }
  return { ok: true, snapshots: [...snapshots, next] };
}

/** The latest snapshot taken at or before `at` — the time-machine read (§126). */
export function snapshotAsOf(
  snapshots: readonly RealitySnapshot[],
  at: string,
): RealitySnapshot | null {
  let latest: RealitySnapshot | null = null;
  for (const snapshot of snapshots) {
    if (snapshot.takenAt > at) continue;
    if (latest === null || snapshot.takenAt > latest.takenAt) latest = snapshot;
  }
  return latest;
}
