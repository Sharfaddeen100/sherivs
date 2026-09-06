/**
 * CoreGrid Scholar — communication + notification context (Phase-04 §112–113).
 *
 * School communications should understand the student, class, teacher,
 * guardian, institution, event and policy they concern (§112), and
 * notifications must be CONTEXTUAL — never generic (§113). This module models
 * the audience/reference context purely; delivery is governed by policy.
 */

export type CommunicationAudienceKind =
  "student" | "class" | "teacher" | "guardian" | "institution" | "event" | "policy";

export const COMMUNICATION_AUDIENCE_KINDS: readonly CommunicationAudienceKind[] = [
  "student",
  "class",
  "teacher",
  "guardian",
  "institution",
  "event",
  "policy",
] as const;

export interface CommunicationContextRef {
  audienceKind: CommunicationAudienceKind;
  refId: string;
  /** Policy-controlled channel allow-list for this recipient. */
  allowedChannels?: string[];
}

export interface CommunicationContext {
  subject: string;
  refs: CommunicationContextRef[];
}

export function validateCommunicationContext(context: CommunicationContext): string[] {
  const issues: string[] = [];
  if (!context.subject.trim()) issues.push("a communication requires a subject");
  const seen = new Set<string>();
  for (const ref of context.refs) {
    if (!ref.audienceKind || !COMMUNICATION_AUDIENCE_KINDS.includes(ref.audienceKind)) {
      issues.push(`audienceKind must be one of ${COMMUNICATION_AUDIENCE_KINDS.join(", ")}`);
    }
    if (!ref.refId.trim()) issues.push("a communication ref requires a refId");
    const key = `${ref.audienceKind}::${ref.refId}`;
    if (seen.has(key)) issues.push(`duplicate communication ref "${key}"`);
    seen.add(key);
  }
  return issues;
}

/** Group refs by audience so notifications resolve per context (§113). */
export function contextualAudience(
  context: CommunicationContext,
): Map<CommunicationAudienceKind, string[]> {
  const grouped = new Map<CommunicationAudienceKind, string[]>();
  for (const ref of context.refs) {
    const list = grouped.get(ref.audienceKind) ?? [];
    list.push(ref.refId);
    grouped.set(ref.audienceKind, list);
  }
  return grouped;
}
