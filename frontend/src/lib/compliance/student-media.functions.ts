import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { tokenMsRemaining } from "@/lib/auth-helpers";
import { writeAuditRecord } from "@/lib/server/write-audit";
import { hasConsent } from "./consent.functions";
import { loadActor, throwIfError, type ComplianceDb } from "./db";
import {
  STUDENT_MEDIA_BUCKET,
  STUDENT_MEDIA_MAX_BYTES,
  STUDENT_MEDIA_TYPES,
  studentMediaExtension,
  studentMediaPath,
} from "./student-media";

/**
 * Server-side student photo/media upload (NDPA `photos_media` purpose).
 * Authenticate -> resolve school from the actor -> authorize (active admin,
 * principal or teacher of the student's school) -> consent check -> upload via
 * the service role -> audit. Direct client writes to the student media prefix
 * are denied by storage RLS, so this is the only write path.
 */

export type StorageAdmin = {
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        body: Uint8Array,
        opts: { contentType: string; upsert: boolean },
      ): PromiseLike<{ error: { message: string } | null }>;
    };
  };
};

export type StudentMediaInput = {
  studentId: string;
  contentType: string;
  base64: string;
};

const UPLOAD_ROLES = ["admin", "principal", "teacher"];

export async function performStudentMediaUpload(deps: {
  adminClient: ComplianceDb & StorageAdmin;
  actorId: string;
  input: StudentMediaInput;
}) {
  const { adminClient: db, actorId, input } = deps;
  const [actor, studentRes] = await Promise.all([
    loadActor(db, actorId),
    db.from("students").select("id, school_id").eq("id", input.studentId).maybeSingle(),
  ]);
  throwIfError(studentRes, "Failed to load student");
  const student = studentRes?.data as { id: string; school_id: string } | null;

  const authorized =
    !!student &&
    !!actor &&
    actor.is_active !== false &&
    actor.school_id === student.school_id &&
    UPLOAD_ROLES.includes(actor.role ?? "");
  // Same message for unknown, foreign and unauthorized: no cross-tenant oracle.
  if (!authorized || !student) throw new Error("Forbidden: cannot upload media for this student");
  const schoolId = student.school_id;

  const ext = studentMediaExtension(input.contentType);
  if (!ext) throw new Error("Unsupported media type");
  const body = new Uint8Array(Buffer.from(input.base64, "base64"));
  if (body.byteLength === 0 || body.byteLength > STUDENT_MEDIA_MAX_BYTES) {
    throw new Error("Media must be between 1 byte and 8 MB");
  }

  if (!(await hasConsent(db, input.studentId, "photos_media", schoolId))) {
    await writeAuditRecord(db, {
      action: "student_media.upload",
      gate: "performStudentMediaUpload",
      tenantId: schoolId,
      actorId,
      table: "students",
      recordId: input.studentId,
      outcome: "denied",
      details: { purpose: "photos_media", reason: "no_consent" },
    });
    throw new Error("Consent required: no current photos_media consent for this student");
  }

  const path = studentMediaPath(schoolId, input.studentId, `${randomUUID()}.${ext}`);
  const up = await db.storage
    .from(STUDENT_MEDIA_BUCKET)
    .upload(path, body, { contentType: input.contentType, upsert: false });
  throwIfError(up, "Media upload failed");

  await writeAuditRecord(db, {
    action: "student_media.upload",
    gate: "performStudentMediaUpload",
    tenantId: schoolId,
    actorId,
    table: "students",
    recordId: input.studentId,
    outcome: "succeeded",
    details: { purpose: "photos_media", bytes: body.byteLength, content_type: input.contentType },
  });
  return { path, bucket: STUDENT_MEDIA_BUCKET };
}

const schema = z.object({
  studentId: z.string().uuid(),
  contentType: z.enum(STUDENT_MEDIA_TYPES),
  // ~8 MB of bytes as base64; the byte limit is re-checked after decoding.
  base64: z.string().min(1).max(Math.ceil((STUDENT_MEDIA_MAX_BYTES * 4) / 3) + 8),
});

export const uploadStudentMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => schema.parse(i))
  .handler(async ({ data, context }) => {
    const exp = (context as { claims?: { exp?: number } | null }).claims?.exp;
    if (typeof exp !== "number" || tokenMsRemaining(exp) <= 0) throw new Error("Session expired");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return performStudentMediaUpload({
      adminClient: supabaseAdmin as unknown as ComplianceDb & StorageAdmin,
      actorId: context.userId,
      input: data,
    });
  });
