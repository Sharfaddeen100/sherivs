/**
 * Central audit-trail helper. Never throws: audit failures must not break a mutation.
 * Accepts either positional arguments (original call style) or a single params
 * object, so both call styles are safe across the app.
 */
import { supabase } from "@/integrations/supabase/client";

export type AuditAction = "create" | "update" | "delete" | string;

export type AuditParams = {
  schoolId: string;
  userId: string;
  action: AuditAction;
  tableName: string;
  recordId?: string;
  details?: Record<string, unknown>;
};

export async function logAudit(params: AuditParams): Promise<void>;
export async function logAudit(
  schoolId: string,
  userId: string,
  action: AuditAction,
  table: string,
  recordId: string,
  details?: Record<string, unknown>,
): Promise<void>;
export async function logAudit(
  a: AuditParams | string,
  userId?: string,
  action?: AuditAction,
  table?: string,
  recordId?: string,
  details?: Record<string, unknown>,
): Promise<void> {
  const p: AuditParams =
    typeof a === "string"
      ? {
          schoolId: a,
          userId: userId!,
          action: action!,
          tableName: table!,
          recordId,
          details,
        }
      : a;

  try {
    await supabase.from("audit_logs").insert({
      school_id: p.schoolId,
      user_id: p.userId,
      action: p.action,
      table_name: p.tableName,
      record_id: p.recordId ?? null,
      new_value: (p.details ?? null) as never,
    });
  } catch {
    /* audit logging is best-effort */
  }
}
