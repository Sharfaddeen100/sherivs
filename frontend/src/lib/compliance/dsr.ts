/**
 * NDPA 2023 — data subject request (DSR) rules (pure, no I/O).
 *
 * Status workflow, 30-day SLA and the per-table ERASURE_POLICY. The policy
 * reuses the ADR-005 / RETENTION_POLICY_SCHEDULE principles: immutable audit
 * is retained (never mutated here), financial records keep amounts but lose
 * personal fields, communication content is erased. Documented in
 * docs/compliance/erasure-policy.md. LEGAL REVIEW REQUIRED.
 */

export const DSR_STATUSES = ["received", "verified", "completed", "rejected"] as const;
export type DsrStatus = (typeof DSR_STATUSES)[number];
export const DSR_REQUEST_TYPES = ["access_export", "erasure"] as const;
export type DsrRequestType = (typeof DSR_REQUEST_TYPES)[number];
export const DSR_SUBJECT_TYPES = ["student", "user"] as const;
export type DsrSubjectType = (typeof DSR_SUBJECT_TYPES)[number];

export const DSR_SLA_DAYS = 30;

export const DSR_TRANSITIONS: Readonly<Record<DsrStatus, readonly DsrStatus[]>> = {
  received: ["verified", "rejected"],
  verified: ["completed", "rejected"],
  completed: [],
  rejected: [],
};

export function canTransition(from: DsrStatus, to: DsrStatus): boolean {
  return DSR_TRANSITIONS[from]?.includes(to) ?? false;
}

export function computeDueAt(receivedAtIso: string): string {
  const d = new Date(receivedAtIso);
  d.setUTCDate(d.getUTCDate() + DSR_SLA_DAYS);
  return d.toISOString();
}

export type ErasureAction = "delete" | "anonymize" | "retain";

export interface ErasureRule {
  table: string;
  /** Retention-schedule record family (RETENTION_POLICY_SCHEDULE.json). */
  category: string;
  action: ErasureAction;
  /** Whose id the key columns hold. */
  subject: "student" | "user";
  /** Columns matched against the subject id; each is applied as a separate statement. */
  keys: readonly string[];
  /** Personal-field overwrite for action=anonymize. */
  patch?: (subjectId: string) => Record<string, unknown>;
  /** Included in access exports. */
  exportable: boolean;
  reason: string;
}

const ERASED = "Erased subject";

export const ERASURE_POLICY: readonly ErasureRule[] = [
  {
    table: "students", category: "identity-profile", action: "anonymize", subject: "student",
    keys: ["id"], exportable: true,
    patch: (id) => ({
      admission_number: `ERASED-${id}`,
      date_of_birth: null, gender: null, blood_group: null, genotype: null, home_address: null,
      state_of_origin: null, lga: null, religion: null, medical_conditions: null,
      disability_notes: null, parent_name: null, parent_phone: null, parent_email: null,
      parent_id: null, user_id: null, previous_school: null, is_active: false,
    }),
    reason: "Row kept so child tables keep referential integrity; every identifying field cleared.",
  },
  {
    table: "parent_student_map", category: "identity-profile", action: "delete", subject: "student",
    keys: ["student_id"], exportable: true,
    reason: "Guardian link is relationship data about the erased subject.",
  },
  {
    table: "grades", category: "education-record", action: "anonymize", subject: "student",
    keys: ["student_id"], exportable: true, patch: () => ({ grade_remark: null }),
    reason: "Scores are unlinkable once the student row is anonymized; free-text remarks cleared.",
  },
  {
    table: "attendance", category: "attendance-activity", action: "anonymize", subject: "student",
    keys: ["student_id"], exportable: true, patch: () => ({ note: null }),
    reason: "RP-ATTND-EDU; free-text notes cleared, status/date kept unlinkable.",
  },
  {
    table: "fees", category: "financial", action: "anonymize", subject: "student",
    keys: ["student_id"], exportable: true,
    patch: () => ({ paystack_reference: null, paystack_access_code: null }),
    reason: "RP-FINAN-EDU legal-obligation retention: amounts kept, payment identifiers cleared.",
  },
  {
    table: "student_platform_fee_ledger", category: "financial", action: "anonymize",
    subject: "student", keys: ["student_id"], exportable: true,
    patch: () => ({ payment_reference: null }),
    reason: "RP-FINAN-EDU: amounts kept, payment reference cleared.",
  },
  {
    table: "digital_twin_calls", category: "communication", action: "anonymize", subject: "student",
    keys: ["student_id"], exportable: true,
    patch: () => ({
      recipient_name: ERASED, recipient_phone: null, call_transcript: null, call_summary: null,
      call_recording_url: null,
    }),
    reason: "Call content and recipient contact cleared; call metadata kept.",
  },
  {
    table: "consent_records", category: "consent-proof", action: "retain", subject: "student",
    keys: ["student_id"], exportable: true,
    reason: "Proof of consent / withdrawal must survive erasure (accountability).",
  },
  {
    table: "consent_events", category: "consent-proof", action: "retain", subject: "student",
    keys: ["student_id"], exportable: true,
    reason: "Append-only consent history; retained as proof.",
  },
  {
    table: "users", category: "identity-profile", action: "anonymize", subject: "user",
    keys: ["id"], exportable: true,
    patch: () => ({
      full_name: ERASED, email: null, phone: null, avatar_url: null, address: null, gender: null,
      date_of_birth: null, nin: null, emergency_contact: null, emergency_contact_name: null,
      bank_name: null, account_number: null, is_active: false,
    }),
    reason: "Profile row kept for FK integrity (audit, payroll); personal fields cleared and account deactivated.",
  },
  {
    table: "messages", category: "communication", action: "anonymize", subject: "user",
    keys: ["sender_id", "recipient_id"], exportable: true,
    patch: () => ({ subject: null, body: "[content erased per data subject request]" }),
    reason: "Message content is deleted (body is NOT NULL, so overwritten); thread metadata kept.",
  },
  {
    table: "notifications", category: "communication", action: "delete", subject: "user",
    keys: ["user_id"], exportable: true,
    reason: "Ephemeral in-app notices; no retention value.",
  },
  {
    table: "parent_student_map", category: "identity-profile", action: "delete", subject: "user",
    keys: ["parent_id"], exportable: true,
    reason: "Guardian link of the erased user.",
  },
  {
    table: "staff_payroll", category: "financial", action: "anonymize", subject: "user",
    keys: ["user_id"], exportable: true, patch: () => ({ user_id: null }),
    reason: "RP-FINAN-EDU: amounts kept, link to the person severed.",
  },
  {
    table: "audit_logs", category: "audit", action: "retain", subject: "user",
    keys: ["user_id"], exportable: false,
    reason: "Immutable audit (ADR-005); tombstoning of embedded values needs a separate ruling.",
  },
  {
    table: "subscriptions", category: "financial", action: "retain", subject: "user",
    keys: [], exportable: false,
    reason: "School-level billing; no subject identifier column.",
  },
  {
    table: "data_subject_requests", category: "consent-proof", action: "retain", subject: "user",
    keys: ["requester_user_id"], exportable: false,
    reason: "Evidence that the request was handled within the SLA.",
  },
];

export type SubjectRef = { studentId?: string | null; userId?: string | null };

export interface ErasureStep {
  table: string;
  column: string;
  subjectId: string;
  action: Exclude<ErasureAction, "retain">;
  patch?: Record<string, unknown>;
}

function ruleSubjectId(rule: ErasureRule, ref: SubjectRef): string | null {
  return (rule.subject === "student" ? ref.studentId : ref.userId) ?? null;
}

/** Ordered mutating steps for the subject; retained tables are excluded. */
export function planErasure(ref: SubjectRef): ErasureStep[] {
  const steps: ErasureStep[] = [];
  for (const rule of ERASURE_POLICY) {
    if (rule.action === "retain") continue;
    const subjectId = ruleSubjectId(rule, ref);
    if (!subjectId) continue;
    for (const column of rule.keys) {
      steps.push({
        table: rule.table,
        column,
        subjectId,
        action: rule.action as Exclude<ErasureAction, "retain">,
        patch: rule.patch?.(subjectId),
      });
    }
  }
  return steps;
}

export interface ExportSource {
  table: string;
  column: string;
  subjectId: string;
}

export function planExport(ref: SubjectRef): ExportSource[] {
  const out: ExportSource[] = [];
  for (const rule of ERASURE_POLICY) {
    if (!rule.exportable) continue;
    const subjectId = ruleSubjectId(rule, ref);
    if (!subjectId) continue;
    for (const column of rule.keys) out.push({ table: rule.table, column, subjectId });
  }
  return out;
}
