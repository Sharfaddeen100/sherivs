-- SHERIVS-007: lock public.super_admins so no client session can create a
-- super admin.
--
-- Found on prod (read-only, 2026-10-20): RLS is on and the only write policy
-- ("Super admin manages super_admins", FOR ALL, is_super_admin()) already
-- refuses a non-super-admin INSERT. But anon and authenticated still hold
-- table-level INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER, and TRUNCATE is
-- NOT subject to RLS: anyone with the public anon key could empty the table.
-- With the (now removed) /super-admin-bootstrap page that meant: truncate,
-- then claim the platform.
--
-- After this migration:
--   * anon: no privileges at all;
--   * authenticated: SELECT (RLS: own row, or any row for a super admin) and
--     UPDATE of full_name only (RLS: super admins only);
--   * no INSERT / DELETE policy for clients: super admins are created only by
--     an operator as service_role / postgres (docs/ops/sql/create-super-admin.sql).
-- Idempotent. Rollback: database/supabase/rollbacks/20261020000140_*.sql
BEGIN;

REVOKE ALL ON TABLE public.super_admins FROM anon;
REVOKE ALL ON TABLE public.super_admins FROM authenticated;
GRANT SELECT ON TABLE public.super_admins TO authenticated;
GRANT UPDATE (full_name) ON TABLE public.super_admins TO authenticated;
GRANT ALL ON TABLE public.super_admins TO service_role;

DROP POLICY IF EXISTS "Super admin manages super_admins" ON public.super_admins;
DROP POLICY IF EXISTS super_admins_update_self_profile ON public.super_admins;
CREATE POLICY super_admins_update_self_profile ON public.super_admins
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() AND id = auth.uid())
  WITH CHECK (public.is_super_admin() AND id = auth.uid());

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

COMMIT;
