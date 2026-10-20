-- =============================================================================
-- SHERIVS — LOCK public.super_admins (production). Paste into the Supabase SQL editor.
--
-- Closes the last database path to "become super admin from the app":
--   * anon / authenticated lose INSERT, DELETE, TRUNCATE (TRUNCATE bypasses RLS:
--     today anyone with the public anon key can empty this table);
--   * the client "manage" policy is replaced by: a super admin may update only
--     their own display name.
-- Super admins are then created ONLY with docs/ops/sql/create-super-admin.sql.
-- Same statements as migration 20261020000140_sherivs_007_lock_super_admins.sql,
-- and it records that migration in the ledger (as `supabase db push` would).
-- One transaction. Safe to re-run.
-- =============================================================================
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


INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20261020000140', 'sherivs_007_lock_super_admins')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ---- Verification (read-only). Every "ok" must be true. ----
SELECT check_name, ok FROM (VALUES
  ('anon has no privilege on super_admins',
     NOT (has_table_privilege('anon','public.super_admins','SELECT') OR has_table_privilege('anon','public.super_admins','INSERT')
       OR has_table_privilege('anon','public.super_admins','UPDATE') OR has_table_privilege('anon','public.super_admins','DELETE')
       OR has_table_privilege('anon','public.super_admins','TRUNCATE'))),
  ('authenticated cannot INSERT/DELETE/TRUNCATE super_admins',
     NOT (has_table_privilege('authenticated','public.super_admins','INSERT') OR has_table_privilege('authenticated','public.super_admins','DELETE')
       OR has_table_privilege('authenticated','public.super_admins','TRUNCATE'))),
  ('authenticated can only update full_name',
     has_column_privilege('authenticated','public.super_admins','full_name','UPDATE')
     AND NOT has_column_privilege('authenticated','public.super_admins','is_active','UPDATE')
     AND NOT has_column_privilege('authenticated','public.super_admins','id','UPDATE')),
  ('no client INSERT/ALL policy on super_admins',
     NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='super_admins' AND cmd IN ('ALL','INSERT','DELETE'))),
  ('RLS on super_admins', (SELECT relrowsecurity FROM pg_class WHERE oid='public.super_admins'::regclass)),
  ('service_role can still insert', has_table_privilege('service_role','public.super_admins','INSERT')),
  ('migration 20261020000140 recorded',
     EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261020000140'))
) AS t(check_name, ok);
