/**
 * SHERIVS-004 — who may start a payment for a fee row.
 *
 * RLS scopes fee visibility to the school only, so any school member (e.g. a
 * student) could otherwise start/overwrite the payment reference of any
 * invoice. Allowed: school finance staff, the parent mapped to the student, or
 * the student themself. All reads run on the caller's RLS-scoped client.
 */
type Result<T> = PromiseLike<{ data: T | null; error?: { message: string } | null }>;

export interface FeeAccessDb {
  from(table: string): {
    select(cols: string): {
      eq(col: string, value: string): {
        maybeSingle(): Result<Record<string, unknown>>;
        eq(col: string, value: string): { maybeSingle(): Result<Record<string, unknown>> };
      };
    };
  };
}

const FINANCE_ROLES = ["admin", "principal", "bursar"];

export async function canInitiateFeePayment(
  db: unknown,
  userId: string,
  fee: { school_id: string; student_id: string },
): Promise<boolean> {
  const client = db as FeeAccessDb;
  const { data: actor } = await client
    .from("users")
    .select("role, school_id, is_active")
    .eq("id", userId)
    .maybeSingle();
  if (!actor || actor.school_id !== fee.school_id || actor.is_active === false) return false;
  if (FINANCE_ROLES.includes(String(actor.role))) return true;

  const { data: link } = await client
    .from("parent_student_map")
    .select("student_id")
    .eq("parent_id", userId)
    .eq("student_id", fee.student_id)
    .maybeSingle();
  if (link) return true;

  const { data: self } = await client
    .from("students")
    .select("id")
    .eq("id", fee.student_id)
    .eq("user_id", userId)
    .maybeSingle();
  return !!self;
}
