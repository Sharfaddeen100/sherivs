-- =============================================================================
-- SHERIVS-010 — Security P2.
--   1. anon EXECUTE on the zero-argument identity helpers (public.get_my_*,
--      public.is_*_admin) is revoked WHEN SAFE: only for helpers
--      that no RLS policy reachable by anon / PUBLIC calls (revoking those
--      would turn anon reads into errors). Each decision is RAISEd as NOTICE.
--      For anon these helpers already return NULL/false (no auth.uid()).
--   2. Super-admin grant / activation changes are written to audit_logs by
--      trigger (catches SQL-editor grants that bypass the app).
--   3. public.security_alerts(hours): failed-login spikes, new / reactivated
--      super admins, platform role escalation. service_role only (the app
--      gates it on platform.audit.read).
-- Rollback: database/supabase/rollbacks/20261020000170_sherivs_010_security_p2.sql
-- =============================================================================
BEGIN;

-- 1. Guarded anon EXECUTE revoke --------------------------------------------
DO $rev$
DECLARE
  fn text;
  used boolean;
BEGIN
  FOR fn IN
    SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.pronargs = 0
       AND (p.proname LIKE 'get\_my\_%' OR p.proname ~ '^is_[a-z]+_admin$')
  LOOP
    IF to_regprocedure(format('public.%I()', fn)) IS NULL THEN
      RAISE NOTICE 'skip %: not present', fn;
      CONTINUE;
    END IF;
    SELECT EXISTS (
      SELECT 1 FROM pg_policies p
       WHERE p.schemaname = 'public'
         AND ('public' = ANY (p.roles) OR 'anon' = ANY (p.roles))
         AND (coalesce(p.qual, '') ~ (fn || '\(') OR coalesce(p.with_check, '') ~ (fn || '\(')))
      INTO used;
    IF used THEN
      RAISE NOTICE 'keep anon EXECUTE on %: referenced by an anon-reachable RLS policy', fn;
    ELSE
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I() FROM PUBLIC, anon', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I() TO authenticated, service_role', fn);
      RAISE NOTICE 'revoked anon EXECUTE on %', fn;
    END IF;
  END LOOP;
END
$rev$;

-- 2. Audit super-admin changes ----------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_super_admin_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.is_active IS DISTINCT FROM OLD.is_active) THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_value)
    VALUES (auth.uid(),
            CASE WHEN TG_OP = 'INSERT' THEN 'security.super_admin_granted'
                 WHEN NEW.is_active THEN 'security.super_admin_reactivated'
                 ELSE 'security.super_admin_deactivated' END,
            'super_admins', NEW.id,
            jsonb_build_object('email', NEW.email, 'is_active', NEW.is_active,
                               'db_user', current_user));
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.audit_super_admin_change() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS super_admins_audit ON public.super_admins;
CREATE TRIGGER super_admins_audit AFTER INSERT OR UPDATE ON public.super_admins
  FOR EACH ROW EXECUTE FUNCTION public.audit_super_admin_change();

-- 3. Alert scan ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.security_alerts(p_hours integer DEFAULT 24,
                                                  p_failed_login_threshold integer DEFAULT 10)
RETURNS TABLE (kind text, subject text, event_count bigint, first_at timestamptz, last_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  WITH w AS (SELECT now() - make_interval(hours => greatest(1, least(p_hours, 720))) AS since)
  SELECT 'failed_login_spike', coalesce(a.new_value->>'email', a.ip_address, 'unknown'),
         count(*), min(a.created_at), max(a.created_at)
    FROM public.audit_logs a, w
   WHERE a.action = 'login_failed' AND a.created_at >= w.since
   GROUP BY 2
  HAVING count(*) >= p_failed_login_threshold
  UNION ALL
  SELECT 'super_admin_change', a.action || ':' || coalesce(a.new_value->>'email', a.record_id::text),
         1, a.created_at, a.created_at
    FROM public.audit_logs a, w
   WHERE a.action IN ('security.super_admin_granted', 'security.super_admin_reactivated')
     AND a.created_at >= w.since
  UNION ALL
  SELECT 'role_escalation', a.action || ':' || coalesce(a.record_id::text, '?'),
         1, a.created_at, a.created_at
    FROM public.audit_logs a, w
   WHERE a.created_at >= w.since
     AND ((a.action = 'platform_staff.set_roles'
           AND (a.new_value->'details'->'added') ? 'platform_admin')
       OR (a.action = 'platform_staff.invite'
           AND (a.new_value->'details'->'roles') ? 'platform_admin'))
  ORDER BY 5 DESC;
$$;
REVOKE ALL ON FUNCTION public.security_alerts(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.security_alerts(integer, integer) TO service_role;

COMMIT;
