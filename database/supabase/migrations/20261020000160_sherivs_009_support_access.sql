-- =============================================================================
-- SHERIVS-009 — Internal console phase 4: time-limited support access grants.
--
-- A super admin grants ONE active platform staff member read access to ONE
-- tenant (organization) for a bounded window (max 8 hours) with a stated reason.
-- Grants are created / revoked only by server functions (service role, after
-- the super-admin gate) and every grant, revoke and support read is audited.
-- Clients may only SELECT their own grants (super admins see all).
-- Rollback: database/supabase/rollbacks/20261020000160_sherivs_009_support_access.sql
-- =============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_support_grants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    uuid NOT NULL REFERENCES public.platform_staff(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL, -- organization id (validated by the grant server function)
  reason      text NOT NULL CHECK (length(btrim(reason)) BETWEEN 10 AND 500),
  granted_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  starts_at   timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  revoked_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_support_grants_window CHECK (
    expires_at > starts_at AND expires_at <= starts_at + interval '8 hours')
);
CREATE INDEX IF NOT EXISTS platform_support_grants_active_idx
  ON public.platform_support_grants (staff_id, tenant_id, expires_at) WHERE revoked_at IS NULL;

-- True when the caller is ACTIVE platform staff holding platform.support.handle
-- and an unrevoked, unexpired grant for p_tenant. Super admins: always true.
CREATE OR REPLACE FUNCTION public.has_support_access(p_tenant uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.is_super_admin()
      OR (public.has_platform_capability('platform.support.handle')
          AND EXISTS (SELECT 1 FROM public.platform_support_grants g
                       WHERE g.staff_id = auth.uid() AND g.tenant_id = p_tenant
                         AND g.revoked_at IS NULL
                         AND now() >= g.starts_at AND now() < g.expires_at));
$$;
REVOKE ALL ON FUNCTION public.has_support_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_support_access(uuid) TO authenticated, service_role;

ALTER TABLE public.platform_support_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.platform_support_grants FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.platform_support_grants TO authenticated;
GRANT ALL ON TABLE public.platform_support_grants TO service_role;

DROP POLICY IF EXISTS platform_support_grants_read ON public.platform_support_grants;
CREATE POLICY platform_support_grants_read ON public.platform_support_grants
  FOR SELECT TO authenticated
  USING (staff_id = auth.uid() OR public.has_platform_capability('platform.audit.read'));

COMMIT;
