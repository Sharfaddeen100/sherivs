-- Rollback of 20261020000170_sherivs_010_security_p2.sql. Restores anon
-- EXECUTE on the identity helpers (pre-010 state) and drops alerts + trigger.
BEGIN;
DROP FUNCTION IF EXISTS public.security_alerts(integer, integer);
DROP TRIGGER IF EXISTS super_admins_audit ON public.super_admins;
DROP FUNCTION IF EXISTS public.audit_super_admin_change();
DO $g$
DECLARE fn text;
BEGIN
  FOR fn IN
    SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.pronargs = 0
       AND (p.proname LIKE 'get\_my\_%' OR p.proname ~ '^is_[a-z]+_admin$')
  LOOP
    IF to_regprocedure(format('public.%I()', fn)) IS NOT NULL THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I() TO anon', fn);
    END IF;
  END LOOP;
END
$g$;
COMMIT;
