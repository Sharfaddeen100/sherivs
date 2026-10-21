/**
 * Sherivs Scholar — special educational needs (Phase-04 §53).
 *
 * Accommodations are configurable: additional time, alternative assessment,
 * accessibility resources, specialized classrooms, support staff and
 * assistive technology (plus institution-defined kinds). Which learner needs
 * which accommodation is declared by the institution — never assumed.
 * SEN data is sensitive and stays policy-governed.
 */

export type AccommodationKind =
  | "additional_time"
  | "alternative_assessment"
  | "accessibility_resources"
  | "specialized_classroom"
  | "support_staff"
  | "assistive_technology"
  | "custom";

export const ACCOMMODATION_KINDS: readonly AccommodationKind[] = [
  "additional_time",
  "alternative_assessment",
  "accessibility_resources",
  "specialized_classroom",
  "support_staff",
  "assistive_technology",
  "custom",
] as const;

export interface Accommodation {
  kind: AccommodationKind;
  note?: string | null;
}

export interface SenProfile {
  studentId: string;
  accommodations: Accommodation[];
}

export function validateSenProfiles(input: readonly SenProfile[]): string[] {
  const issues: string[] = [];
  const students = new Set<string>();
  for (const profile of input) {
    if (!profile.studentId.trim()) {
      issues.push("an SEN profile requires a studentId");
      continue;
    }
    if (students.has(profile.studentId)) {
      issues.push(`duplicate SEN profile for student "${profile.studentId}"`);
    }
    students.add(profile.studentId);
    if (profile.accommodations.length === 0) {
      issues.push(`SEN profile "${profile.studentId}": at least one accommodation is expected`);
    }
    for (const accommodation of profile.accommodations) {
      if (!ACCOMMODATION_KINDS.includes(accommodation.kind)) {
        issues.push(
          `SEN profile "${profile.studentId}": accommodation kind must be one of ${ACCOMMODATION_KINDS.join(", ")}`,
        );
      }
    }
  }
  return issues;
}
