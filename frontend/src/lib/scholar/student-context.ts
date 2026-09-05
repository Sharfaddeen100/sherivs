/**
 * CoreGrid Scholar — student identity + educational context (Phase-04 §26–27).
 *
 * §26: the runtime CONSUMES the authoritative identity from Phase 02
 * (`cg_identity` via `identity-registry.ts`) and ADDS educational context —
 * it never re-creates a student identity store. §27: the educational profile
 * may reference enrolment, programme, class, subjects, academic history,
 * activities and support needs. Attendance/competency/assessment data is
 * owned by its own clusters (G/H/J) and referenced here, never duplicated.
 * Sensitive profile information is governed by policy, not by this module.
 */

import { identityDraft, type IdentityRegistryRow } from "@/lib/identity-registry";

export type EnrolmentStatus =
  | "enrolled"
  | "transferred_in"
  | "transferred_out"
  | "withdrawn"
  | "graduated"
  | "suspended"
  | "custom";

export const ENROLMENT_STATUSES: readonly EnrolmentStatus[] = [
  "enrolled",
  "transferred_in",
  "transferred_out",
  "withdrawn",
  "graduated",
  "suspended",
  "custom",
] as const;

export interface AcademicHistoryEntry {
  periodCode: string;
  classCohortId?: string | null;
  outcome?: string | null;
}

export interface StudentProfile {
  /** Authoritative P02 identity row id (kind must be "human"). */
  studentId: string;
  tenantId?: string | null;
  enrolmentStatus: EnrolmentStatus;
  programmeCode?: string | null;
  classCohortIds?: string[];
  subjectCodes?: string[];
  academicHistory?: AcademicHistoryEntry[];
  activityRefs?: string[];
  supportNeedRefs?: string[];
  progression?: {
    currentLevelCode?: string | null;
    nextLevelCode?: string | null;
    note?: string | null;
  } | null;
}

export interface StudentReferenceIndex {
  programmeCodes?: ReadonlySet<string>;
  levelCodes?: ReadonlySet<string>;
  cohortIds?: ReadonlySet<string>;
  subjectCodes?: ReadonlySet<string>;
  academicPeriodCodes?: ReadonlySet<string>;
}

export type StudentProfileValidation =
  { ok: true; profile: StudentProfile } | { ok: false; issues: string[] };

export function validateStudentProfile(
  profile: StudentProfile,
  refs: StudentReferenceIndex = {},
): StudentProfileValidation {
  const issues: string[] = [];

  if (!profile.studentId.trim()) issues.push("studentId (P02 identity id) is required");
  if (!ENROLMENT_STATUSES.includes(profile.enrolmentStatus)) {
    issues.push(`enrolmentStatus must be one of ${ENROLMENT_STATUSES.join(", ")}`);
  }
  if (
    profile.programmeCode &&
    refs.programmeCodes &&
    !refs.programmeCodes.has(profile.programmeCode)
  ) {
    issues.push(`unknown programme "${profile.programmeCode}"`);
  }
  if (Array.isArray(profile.classCohortIds)) {
    for (const id of profile.classCohortIds) {
      if (refs.cohortIds && !refs.cohortIds.has(id)) issues.push(`unknown class/cohort "${id}"`);
    }
  }
  if (Array.isArray(profile.subjectCodes)) {
    for (const code of profile.subjectCodes) {
      if (refs.subjectCodes && !refs.subjectCodes.has(code))
        issues.push(`unknown subject "${code}"`);
    }
  }
  if (Array.isArray(profile.academicHistory)) {
    for (const entry of profile.academicHistory) {
      if (!entry.periodCode.trim()) issues.push("academic history requires a periodCode");
      else if (refs.academicPeriodCodes && !refs.academicPeriodCodes.has(entry.periodCode)) {
        issues.push(`academic history references unknown period "${entry.periodCode}"`);
      }
    }
  }
  if (profile.progression) {
    if (
      profile.progression.currentLevelCode &&
      refs.levelCodes &&
      !refs.levelCodes.has(profile.progression.currentLevelCode)
    ) {
      issues.push(`unknown progression level "${profile.progression.currentLevelCode}"`);
    }
    if (
      profile.progression.nextLevelCode &&
      refs.levelCodes &&
      !refs.levelCodes.has(profile.progression.nextLevelCode)
    ) {
      issues.push(`unknown progression level "${profile.progression.nextLevelCode}"`);
    }
  }

  return issues.length === 0 ? { ok: true, profile } : { ok: false, issues };
}

/**
 * §26 consumption: build the P02 identity draft a student profile anchors to.
 * Learners are human identities — the kind is asserted, never invented.
 */
export function learnerIdentityDraft(
  displayName: string,
  input: { externalSubject?: string | null; tenantId?: string | null; verified?: boolean },
  now: string,
): IdentityRegistryRow {
  return identityDraft({ kind: "human", displayName, ...input }, now);
}

/** Guard that a stored P02 identity is actually a human learner identity. */
export function assertHumanLearnerIdentity(row: Pick<IdentityRegistryRow, "kind">): void {
  if (row.kind !== "human") {
    throw new Error(`student identity must be kind "human" (got "${row.kind}")`);
  }
}

/** Readable summary of the educational context added over P02 identity. */
export function studentContextSummary(profile: StudentProfile): {
  studentId: string;
  status: EnrolmentStatus;
  programme: string | null;
  classes: string[];
  subjects: string[];
  sensitive: string[];
} {
  return {
    studentId: profile.studentId,
    status: profile.enrolmentStatus,
    programme: profile.programmeCode ?? null,
    classes: [...(profile.classCohortIds ?? [])],
    subjects: [...(profile.subjectCodes ?? [])],
    // Policy-governed (§27): caller decides whether these may be revealed.
    sensitive: [
      ...(profile.supportNeedRefs ?? []).map((ref) => `support:${ref}`),
      ...(profile.activityRefs ?? []).map((ref) => `activity:${ref}`),
    ],
  };
}
