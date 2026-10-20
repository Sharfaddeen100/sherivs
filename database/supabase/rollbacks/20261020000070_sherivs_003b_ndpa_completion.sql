-- Rollback for 20261020000070 (SHERIVS-003b). Local disposable stack only.
-- Restores holds_tenant_role to its pre-bridge body and the original school-media
-- write policies. Dropping student_id loses admission<->student links.
BEGIN;

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

  RETURN EXISTS (
    SELECT 1
      FROM public.cg_org_membership m
     WHERE m.tenant_id = p_tenant
       AND m.principal_ref = auth.uid()::text
       AND m.role_ref = p_role_ref
       AND m.state = 'active'
  );
END;
$function$;

DROP TRIGGER IF EXISTS cg_tenant_school_map ON public.cg_tenant;
DROP FUNCTION IF EXISTS public.school_tenant_map_autofill();
DROP TABLE IF EXISTS public.school_tenant_map;

DO $storage$
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN RETURN; END IF;
  EXECUTE 'DROP POLICY IF EXISTS "school-media insert own school" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "school-media update own school" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "school-media delete own school" ON storage.objects';
  EXECUTE $p$CREATE POLICY "school-media insert own school" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'school-media' AND (storage.foldername(name))[1] = public.get_my_school_id()::text)$p$;
  EXECUTE $p$CREATE POLICY "school-media update own school" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'school-media' AND (storage.foldername(name))[1] = public.get_my_school_id()::text)$p$;
  EXECUTE $p$CREATE POLICY "school-media delete own school" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'school-media' AND (storage.foldername(name))[1] = public.get_my_school_id()::text)$p$;
END
$storage$;

DROP INDEX IF EXISTS public.admission_applications_student_idx;
ALTER TABLE public.admission_applications DROP COLUMN IF EXISTS student_id;
COMMIT;
