-- =============================================================================
-- SHERIVS-003b: NDPA completion.
-- Status: authored; verified ONLY on a local disposable loopback Supabase stack.
-- Not applied to staging or production.
--
--   1. admission_applications.student_id (nullable FK) so admissions PII can be
--      reached by access/erasure requests (DSR registry, dsr.ts).
--   2. Storage: authenticated users can no longer write objects under the
--      student media prefix <school_id>/students/... of the school-media bucket.
--      That prefix is written only by the consent-checked server function
--      (photos_media) using the service role. Website / staff media paths
--      (<school_id>/<file>, <school_id>/staff/...) are unchanged.
--   3. public.school_tenant_map: explicit Scholar school <-> CoreGrid tenant
--      mapping, and holds_tenant_role / is_tenant_admin additionally recognise
--      a school admin/principal of the mapped school as tenant administrator
--      (ONLY that tenant, ONLY role:administrator). Signatures unchanged.
--
-- Rollback: database/supabase/rollbacks/20261020000070_sherivs_003b_ndpa_completion.sql
-- =============================================================================
BEGIN;

-- 1 -------------------------------------------------------------------------
ALTER TABLE public.admission_applications
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS admission_applications_student_idx
  ON public.admission_applications (student_id) WHERE student_id IS NOT NULL;

-- 2 -------------------------------------------------------------------------
DO $storage$
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'SHERIVS-003b: storage.objects absent, storage policies skipped';
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS "school-media insert own school" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "school-media update own school" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "school-media delete own school" ON storage.objects';

  EXECUTE $p$
    CREATE POLICY "school-media insert own school"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'school-media'
        AND (storage.foldername(name))[1] = public.get_my_school_id()::text
        AND coalesce(lower((storage.foldername(name))[2]), '') <> 'students'
      )
  $p$;
  EXECUTE $p$
    CREATE POLICY "school-media update own school"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'school-media'
        AND (storage.foldername(name))[1] = public.get_my_school_id()::text
        AND coalesce(lower((storage.foldername(name))[2]), '') <> 'students'
      )
      WITH CHECK (
        bucket_id = 'school-media'
        AND (storage.foldername(name))[1] = public.get_my_school_id()::text
        AND coalesce(lower((storage.foldername(name))[2]), '') <> 'students'
      )
  $p$;
  EXECUTE $p$
    CREATE POLICY "school-media delete own school"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'school-media'
        AND (storage.foldername(name))[1] = public.get_my_school_id()::text
        AND coalesce(lower((storage.foldername(name))[2]), '') <> 'students'
      )
  $p$;
END
$storage$;

-- 3 -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_tenant_map (
  school_id uuid PRIMARY KEY REFERENCES public.schools(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.cg_tenant(id)
);
COMMENT ON TABLE public.school_tenant_map IS
  'Scholar school (users.school_id) to CoreGrid tenant (cg_tenant.id). Service-role/migration writes only.';

INSERT INTO public.school_tenant_map (school_id, tenant_id)
SELECT s.id, t.id
  FROM public.cg_tenant t
  JOIN public.schools s ON s.id = t.id
ON CONFLICT DO NOTHING;

-- Keep the map complete for tenants provisioned later with id = school id.
CREATE OR REPLACE FUNCTION public.school_tenant_map_autofill()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.school_tenant_map (school_id, tenant_id)
  SELECT s.id, NEW.id FROM public.schools s WHERE s.id = NEW.id
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION public.school_tenant_map_autofill() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS cg_tenant_school_map ON public.cg_tenant;
CREATE TRIGGER cg_tenant_school_map
  AFTER INSERT ON public.cg_tenant
  FOR EACH ROW EXECUTE FUNCTION public.school_tenant_map_autofill();

ALTER TABLE public.school_tenant_map ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.school_tenant_map FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.school_tenant_map TO authenticated;
GRANT ALL ON public.school_tenant_map TO service_role;

DROP POLICY IF EXISTS "school_tenant_map read own school" ON public.school_tenant_map;
CREATE POLICY "school_tenant_map read own school"
  ON public.school_tenant_map FOR SELECT TO authenticated
  USING (school_id = public.get_my_school_id() OR public.is_super_admin());

-- Same body as before plus ONE extra grant path: the school admin/principal of
-- the school mapped to p_tenant holds role:administrator on that tenant only.
CREATE OR REPLACE FUNCTION public.holds_tenant_role(p_tenant text, p_role_ref text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_tenant IS NULL OR p_role_ref IS NULL OR auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.cg_role_assignment r
     WHERE r.tenant_ref = p_tenant
       AND r.identity_ref = auth.uid()::text
       AND r.role_id = p_role_ref
       AND r.status = 'active'
       AND r.started_on <= CURRENT_DATE
       AND (r.ended_on IS NULL OR r.ended_on >= CURRENT_DATE)
  ) THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.cg_org_membership m
     WHERE m.tenant_id = p_tenant
       AND m.principal_ref = auth.uid()::text
       AND m.role_ref = p_role_ref
       AND m.state = 'active'
  ) THEN
    RETURN true;
  END IF;

  -- Scholar model bridge: administrator only, mapped tenant only.
  IF p_role_ref = 'role:administrator' AND public.is_school_admin() THEN
    RETURN EXISTS (
      SELECT 1
        FROM public.school_tenant_map m
       WHERE m.tenant_id::text = p_tenant
         AND m.school_id = public.get_my_school_id()
    );
  END IF;

  RETURN false;
END;
$function$;

COMMIT;
