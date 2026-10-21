import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/contexts/app-context";
import { supabase } from "@/integrations/supabase/client";
import { decideAdminAreaAccess, ADMIN_ROLES } from "@/lib/runtime/scholar/admissions-access";
import { RoleGuard } from "@/components/role-guard";

type RpcClient = { rpc(fn: string): PromiseLike<{ data: unknown; error: { message: string } | null }> };

/** Same predicate the RLS uses: admin/principal or an active registrar position. */
export function useCanManageAdmissions(enabled = true): boolean | null {
  const { profile, role } = useApp();
  const q = useQuery({
    queryKey: ["can-manage-admissions", profile?.id, role],
    enabled: enabled && !!profile?.id && !!role && role !== "parent" && role !== "student",
    queryFn: async () => {
      const { data, error } = await (supabase as unknown as RpcClient).rpc("can_manage_admissions");
      if (error) return false;
      return data === true;
    },
  });
  if (!enabled || !role || role === "parent" || role === "student") return false;
  return q.isPending ? null : (q.data ?? false);
}

export function AdminAreaGuard({ children }: { children: ReactNode }) {
  const { role, superAdmin, loading } = useApp();
  const { pathname } = useLocation();
  const canManage = useCanManageAdmissions();

  if (loading) {
    return <div className="min-h-[50vh] grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }
  const decision = decideAdminAreaAccess({ role, superAdmin: !!superAdmin, pathname, canManageAdmissions: canManage });
  if (decision === "pending") {
    return <div className="min-h-[50vh] grid place-items-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (decision === "allow") return <>{children}</>;
  // Denied: reuse the standard access-denied panel (admin/principal only wording).
  return <RoleGuard allow={[...ADMIN_ROLES]}>{children}</RoleGuard>;
}
