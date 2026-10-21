/**
 * Sherivs Scholar — practical examinations (Phase-04 §51).
 *
 * Practical examinations run in laboratories, workshops, farms, kitchens,
 * clinics and technical rooms — venues are configuration. A practical session
 * names its venue, stations, assessors and candidates; which facilities a
 * practical needs is declared by the institution (never assumed).
 */

import type { ExaminationDefinition } from "./examination";

export type PracticalVenueKind =
  "laboratory" | "workshop" | "farm" | "kitchen" | "clinic" | "technical_room" | "custom";

export const PRACTICAL_VENUE_KINDS: readonly PracticalVenueKind[] = [
  "laboratory",
  "workshop",
  "farm",
  "kitchen",
  "clinic",
  "technical_room",
  "custom",
] as const;

export interface PracticalVenue {
  id: string;
  kind: PracticalVenueKind;
  name: string;
  stationCapacity?: number | null;
}

export interface PracticalExamination {
  id: string;
  /** Must reference a practical examination definition when one exists. */
  examinationId: string;
  venueId: string;
  stationIds: string[];
  assessorIds: string[];
  candidateIds: string[];
  equipment?: string[];
}

export function validatePracticalVenues(input: readonly PracticalVenue[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const venue of input) {
    const id = venue.id.trim();
    if (!id) {
      issues.push("a practical venue requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate venue id "${id}"`);
    ids.add(id);
    if (!venue.name.trim()) issues.push(`venue "${id}": name is required`);
    if (!PRACTICAL_VENUE_KINDS.includes(venue.kind)) {
      issues.push(`venue "${id}": kind must be one of ${PRACTICAL_VENUE_KINDS.join(", ")}`);
    }
    if (
      venue.stationCapacity != null &&
      (!Number.isInteger(venue.stationCapacity) || venue.stationCapacity < 1)
    ) {
      issues.push(`venue "${id}": stationCapacity must be a positive integer when provided`);
    }
  }
  return issues;
}

export function validatePracticalSessions(
  sessions: readonly PracticalExamination[],
  venues: readonly PracticalVenue[],
  examinations?: readonly ExaminationDefinition[] | null,
): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  const venueById = new Map(venues.map((v) => [v.id, v]));
  const examById = new Map((examinations ?? []).map((e) => [e.id, e]));

  for (const session of sessions) {
    if (!session.id.trim()) {
      issues.push("a practical session requires an id");
      continue;
    }
    if (ids.has(session.id)) issues.push(`duplicate practical session id "${session.id}"`);
    ids.add(session.id);
    if (!session.examinationId.trim())
      issues.push(`practical "${session.id}": examinationId is required`);
    const venue = venueById.get(session.venueId);
    if (!venue) issues.push(`practical "${session.id}": unknown venue "${session.venueId}"`);
    if (examinations) {
      const exam = examById.get(session.examinationId);
      if (!exam)
        issues.push(`practical "${session.id}": unknown examination "${session.examinationId}"`);
      else if (exam.kind !== "practical") {
        issues.push(
          `practical "${session.id}": examination "${session.examinationId}" is not a practical examination`,
        );
      }
    }
    if (session.stationIds.length === 0)
      issues.push(`practical "${session.id}": at least one station is required`);
    if (session.assessorIds.length === 0)
      issues.push(`practical "${session.id}": at least one assessor is required`);
    const seated = session.candidateIds.length;
    if (venue?.stationCapacity != null && seated > venue.stationCapacity) {
      issues.push(
        `practical "${session.id}": ${seated} candidates exceed venue station capacity ${venue.stationCapacity}`,
      );
    }
  }
  return issues;
}
