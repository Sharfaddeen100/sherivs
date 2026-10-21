-- Rollback for SHERIVS-004 privilege hardening: restores the Supabase default grants.
BEGIN;
GRANT TRUNCATE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRUNCATE ON TABLES TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
DO $do$
DECLARE f regprocedure;
BEGIN
  FOR f IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
            WHERE n.nspname='public' AND p.proname IN ('list_workforce_positions','assign_workforce_position','end_workforce_position',
              'get_org_profile','upsert_org_profile','list_role_assignments','assign_role','end_role_assignment',
              'list_role_grants','grant_role_capability','revoke_role_capability','get_my_primary_workforce_position')
  LOOP EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', f); END LOOP;
END $do$;
COMMIT;
