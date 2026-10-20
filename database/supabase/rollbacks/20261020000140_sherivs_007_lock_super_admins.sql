-- Rollback of 20261020000140_sherivs_007_lock_super_admins.sql: restores the
-- pre-007 grants and the FOR ALL policy (re-opens TRUNCATE for anon/authenticated).
BEGIN;
DROP POLICY IF EXISTS super_admins_update_self_profile ON public.super_admins;
DROP POLICY IF EXISTS "Super admin manages super_admins" ON public.super_admins;
CREATE POLICY "Super admin manages super_admins" ON public.super_admins
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
GRANT ALL ON TABLE public.super_admins TO anon, authenticated;
COMMIT;
