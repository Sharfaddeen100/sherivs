/**
 * CoreGrid Scholar — AI safety boundary (Phase-04 §117, 146, O3).
 *
 * AI cannot invent student records, invent school policies, invent
 * permissions, alter authoritative grades without authorization or override
 * institutional rules (§117). This module encodes those prohibitions as pure
 * guards with a DENY-BY-DEFAULT posture: an AI proposal is allowed only when
 * it passes an explicit, authorized, read-only-or-scoped check.
 */

export type AiActionKind =
  | "read"
  | "propose"
  | "summarize"
  | "generate"
  | "mutate_student_record"
  | "mutate_policy"
  | "mutate_permission"
  | "alter_grade"
  | "override_rule";

export const AI_FORBIDDEN_ACTIONS: readonly AiActionKind[] = [
  "mutate_student_record",
  "mutate_policy",
  "mutate_permission",
  "alter_grade",
  "override_rule",
] as const;

export interface AiProposal {
  action: AiActionKind;
  targetKind: string;
  summary: string;
  authorizedByRole?: string | null;
}

export interface AiSafetyDecision {
  allowed: boolean;
  reasons: string[];
}

/** §117: mutations of canonical reality require human authorization. */
export function decideAiAction(proposal: AiProposal): AiSafetyDecision {
  const reasons: string[] = [];

  if (AI_FORBIDDEN_ACTIONS.includes(proposal.action)) {
    reasons.push(
      `action "${proposal.action}" may not be executed by AI — it mutates authoritative state`,
    );
  }
  if (!proposal.summary.trim()) {
    reasons.push("every AI action requires an explainable summary");
  }
  if (
    proposal.action !== "read" &&
    proposal.action !== "summarize" &&
    proposal.action !== "generate" &&
    !proposal.authorizedByRole
  ) {
    reasons.push("mutating-adjacent actions require an explicit authorizing role");
  }

  return { allowed: reasons.length === 0, reasons };
}

/**
 * §117 explicit check: AI may never CREATE a student record — it may only
 * propose one for a human to approve through the governed config flow.
 */
export function aiMayCreateStudentRecord(proposal: Omit<AiProposal, "action">): boolean {
  return decideAiAction({ ...proposal, action: "mutate_student_record" }).allowed;
}
