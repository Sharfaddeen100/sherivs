/**
 * NDPA 2023 — purpose-based consent decision (pure, no I/O).
 *
 * Children's data: optional processing purposes default DENY and need an
 * explicit, current-policy-version grant by the guardian (or a school admin
 * recording paper/verbal consent). core_education is the school's contractual
 * / public-task basis and stays allowed unless explicitly withdrawn.
 * LEGAL REVIEW REQUIRED: the default-allow of core_education.
 */

export const CONSENT_PURPOSES = [
  "core_education",
  "photos_media",
  "ai_processing",
  "messaging_sms_whatsapp",
] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export const OPTIONAL_PURPOSES: readonly ConsentPurpose[] = CONSENT_PURPOSES.filter(
  (p) => p !== "core_education",
);

/** Bump when the privacy notice changes materially; older grants stop counting. */
export const CURRENT_CONSENT_POLICY_VERSION = "2026-10-v1";

export const CAPTURE_METHODS = [
  "web_form",
  "paper_signed",
  "verbal_recorded",
  "admin_entered",
] as const;
export type CaptureMethod = (typeof CAPTURE_METHODS)[number];

export type ConsentRecordLike = {
  student_id: string;
  purpose: string;
  status: string;
  policy_version: string;
};

export function isConsentPurpose(v: string): v is ConsentPurpose {
  return (CONSENT_PURPOSES as readonly string[]).includes(v);
}

export function decideConsent(
  records: readonly ConsentRecordLike[],
  studentId: string,
  purpose: ConsentPurpose,
): boolean {
  const mine = records.filter((r) => r.student_id === studentId && r.purpose === purpose);
  if (purpose === "core_education") {
    return !mine.some((r) => r.status === "withdrawn");
  }
  return mine.some(
    (r) => r.status === "granted" && r.policy_version === CURRENT_CONSENT_POLICY_VERSION,
  );
}
