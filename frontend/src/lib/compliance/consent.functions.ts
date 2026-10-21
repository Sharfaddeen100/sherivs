import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { tokenMsRemaining } from "@/lib/auth-helpers";
import { writeAuditRecord } from "@/lib/server/write-audit";
import {
  CAPTURE_METHODS,
  CONSENT_PURPOSES,
  CURRENT_CONSENT_POLICY_VERSION,
  decideConsent,
  type CaptureMethod,
  type ConsentPurpose,
  type ConsentRecordLike,
} from "./consent";
import { isSchoolAdminOf, loadActor, throwIfError, type ComplianceDb } from "./db";
import { SystemClock, TimeAuthority } from "../kernel/time-authority";

/** J-023: time enters only via the kernel time-authority — no direct wall-clock sampling. */
const timeAuthority = new TimeAuthority(new SystemClock());

/**
 * Consent server paths. Reads and writes go through the service-role client:
 * consent_records has no client write grants (migration 20261020000060).
 */

/** Server-side consent lookup for a specific data subject, scoped to the school. */
export async function hasConsent(
  client: ComplianceDb,
  studentId: string,
  purpose: ConsentPurpose,
  schoolId: string,
): Promise<boolean> {
  const res = await client
    .from("consent_records")
    .select("student_id, purpose, status, policy_version")
    .eq("school_id", schoolId)
    .eq("student_id", studentId)
    .eq("purpose", purpose);
  // Fail closed: an unreadable consent table must never read as consent to optional purposes.
  if (res?.error) return purpose === "core_education";
  return decideConsent((res?.data ?? []) as ConsentRecordLike[], studentId, purpose);
}

/** Batch variant: the subset of studentIds that may be processed for the purpose. */
export async function filterConsentedStudents(
  client: ComplianceDb,
  studentIds: readonly string[],
  purpose: ConsentPurpose,
  schoolId: string,
): Promise<Set<string>> {
  const out = new Set<string>();
  if (!studentIds.length) return out;
  const res = await client
    .from("consent_records")
    .select("student_id, purpose, status, policy_version")
    .eq("school_id", schoolId)
    .eq("purpose", purpose)
    .in("student_id", [...studentIds]);
  const rows = (res?.error ? null : res?.data ?? []) as ConsentRecordLike[] | null;
  for (const id of studentIds) {
    if (rows ? decideConsent(rows, id, purpose) : purpose === "core_education") out.add(id);
  }
  return out;
}

export type ConsentChangeInput = {
  studentId: string;
  purpose: ConsentPurpose;
  action: "grant" | "withdraw";
  captureMethod?: CaptureMethod;
  notes?: string;
};

export type PerformConsentDeps = {
  adminClient: ComplianceDb;
  actorId: string;
  input: ConsentChangeInput;
};

const ADMIN_CAPTURE: readonly CaptureMethod[] = ["admin_entered", "paper_signed", "verbal_recorded"];

export async function performConsentChange(deps: PerformConsentDeps) {
  const { adminClient: db, actorId, input } = deps;
  const [actor, studentRes] = await Promise.all([
    loadActor(db, actorId),
    db.from("students").select("id, school_id").eq("id", input.studentId).maybeSingle(),
  ]);
  throwIfError(studentRes, "Failed to load student");
  const student = studentRes?.data as { id: string; school_id: string } | null;
  const schoolId = student?.school_id ?? null;

  let role: "guardian" | "admin" | null = null;
  if (student && actor && actor.school_id === schoolId && actor.is_active !== false) {
    if (isSchoolAdminOf(actor, student.school_id)) {
      role = "admin";
    } else {
      const link = await db
        .from("parent_student_map")
        .select("id")
        .eq("parent_id", actorId)
        .eq("student_id", input.studentId)
        .eq("school_id", student.school_id)
        .maybeSingle();
      throwIfError(link, "Failed to load guardian link");
      if (link?.data) role = "guardian";
    }
  }

  if (!role || !student) {
    try {
      await writeAuditRecord(db, {
        action: `consent.${input.action}`,
        gate: "performConsentChange",
        tenantId: actor?.school_id ?? null,
        actorId,
        table: "consent_records",
        recordId: null,
        outcome: "denied",
        details: { purpose: input.purpose, student_id: input.studentId },
      });
    } catch {
      // best-effort: the denial must still surface
    }
    throw new Error("Forbidden: only the student's guardian or a school admin may change consent");
  }

  // Guardians always act via the web form; only admins may record paper/verbal consent.
  const captureMethod: CaptureMethod =
    role === "guardian" ? "web_form" : (input.captureMethod ?? "admin_entered");
  if (role === "admin" && !ADMIN_CAPTURE.includes(captureMethod)) {
    throw new Error("Invalid capture method for admin-recorded consent");
  }

  const now = timeAuthority.now().at;
  const status = input.action === "grant" ? "granted" : "withdrawn";
  const existing = await db
    .from("consent_records")
    .select("id")
    .eq("school_id", student.school_id)
    .eq("student_id", input.studentId)
    .eq("purpose", input.purpose)
    .maybeSingle();
  throwIfError(existing, "Failed to load consent record");

  const fields = {
    status,
    policy_version: CURRENT_CONSENT_POLICY_VERSION,
    capture_method: captureMethod,
    captured_by: actorId,
    guardian_user_id: role === "guardian" ? actorId : null,
    notes: input.notes ?? null,
    ...(input.action === "grant"
      ? { granted_at: now, withdrawn_at: null }
      : { withdrawn_at: now }),
  };

  let consentId: string;
  if (existing?.data?.id) {
    consentId = existing.data.id as string;
    const upd = await db
      .from("consent_records")
      .update(fields)
      .eq("id", consentId)
      .eq("school_id", student.school_id);
    throwIfError(upd, "Failed to update consent");
  } else {
    const ins = await db
      .from("consent_records")
      .insert({
        school_id: student.school_id,
        student_id: input.studentId,
        purpose: input.purpose,
        ...fields,
      })
      .select("id")
      .single();
    throwIfError(ins, "Failed to record consent");
    consentId = ins.data.id as string;
  }

  const ev = await db.from("consent_events").insert({
    school_id: student.school_id,
    consent_id: consentId,
    student_id: input.studentId,
    purpose: input.purpose,
    action: input.action,
    policy_version: CURRENT_CONSENT_POLICY_VERSION,
    actor_id: actorId,
    capture_method: captureMethod,
    at: now,
  });
  throwIfError(ev, "Failed to append consent event");

  await writeAuditRecord(db, {
    action: `consent.${input.action}`,
    gate: role === "admin" ? "requireSchoolAdminScope" : "guardianLink",
    tenantId: student.school_id,
    actorId,
    table: "consent_records",
    recordId: consentId,
    outcome: "succeeded",
    details: {
      purpose: input.purpose,
      student_id: input.studentId,
      capture_method: captureMethod,
      policy_version: CURRENT_CONSENT_POLICY_VERSION,
    },
  });

  return { ok: true as const, consentId, status };
}

const schema = z.object({
  studentId: z.string().uuid(),
  purpose: z.enum(CONSENT_PURPOSES),
  captureMethod: z.enum(CAPTURE_METHODS).optional(),
  notes: z.string().trim().max(500).optional(),
});

async function run(
  action: "grant" | "withdraw",
  data: z.infer<typeof schema>,
  context: { userId: string; claims?: { exp?: number } | null },
) {
  if (typeof context.claims?.exp === "number" && tokenMsRemaining(context.claims.exp) <= 0) {
    throw new Error("Session expired");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return performConsentChange({
    adminClient: supabaseAdmin as unknown as ComplianceDb,
    actorId: context.userId,
    input: { ...data, action },
  });
}

export const grantConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => run("grant", data, context));

export const withdrawConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => run("withdraw", data, context));
