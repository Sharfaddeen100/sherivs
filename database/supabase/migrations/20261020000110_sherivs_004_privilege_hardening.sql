-- =============================================================================
-- SHERIVS-004: privilege hardening (defense in depth; RLS remains the primary control).
-- Verified ONLY on a local disposable loopback Supabase stack. Not applied remotely.
--   1. TRUNCATE bypasses RLS: revoke it from anon/authenticated on every public table
--      and from future tables created by postgres.
--   2. anon INSERT/UPDATE/DELETE revoked on every public table where no RLS policy
--      for that command names anon, or is a PUBLIC policy that an anonymous caller
--      could satisfy (one not keyed on auth.uid()/school/super-admin helpers). Public forms that do have an anon
--      policy (e.g. admissions) keep their grant.
--   3. anon may no longer EXECUTE role/workforce/org-profile management RPCs. Helper
--      predicates used inside RLS policies (is_super_admin, get_my_school_id, ...)
--      and the public_* website RPCs keep anon EXECUTE.
-- Rollback: database/supabase/rollbacks/20261020000110_sherivs_004_privilege_hardening.sql
-- =============================================================================
BEGIN;

REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE TRUNCATE ON TABLES FROM anon, authenticated;

DO $do$
DECLARE r record; v_cmd text;
BEGIN
  FOR r IN
    SELECT c.relname
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
  LOOP
    FOREACH v_cmd IN ARRAY ARRAY['INSERT','UPDATE','DELETE'] LOOP
      IF has_table_privilege('anon', format('public.%I', r.relname), v_cmd)
         AND NOT EXISTS (
           SELECT 1 FROM pg_policies p
            WHERE p.schemaname = 'public' AND p.tablename = r.relname
              AND p.cmd IN (v_cmd, 'ALL')
              AND ('anon' = ANY (p.roles)
                   OR ('public' = ANY (p.roles)
                       AND coalesce(p.with_check, p.qual, 'true') !~
                           '(uid\(\)|get_my_school_id|is_super_admin|is_school_admin|my_active_role|can_manage_admissions)')))
      THEN
        EXECUTE format('REVOKE %s ON public.%I FROM anon', v_cmd, r.relname);
      END IF;
    END LOOP;
  END LOOP;
END
$do$;

DO $do$
DECLARE f regprocedure;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname IN ('list_workforce_positions','assign_workforce_position','end_workforce_position',
                         'get_org_profile','upsert_org_profile','list_role_assignments','assign_role',
                         'end_role_assignment','list_role_grants','grant_role_capability','revoke_role_capability',
                         'get_my_primary_workforce_position')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f);
  END LOOP;
END
$do$;

COMMIT;
