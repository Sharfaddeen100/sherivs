-- =============================================================================
-- SHERIVS-002 step 2: admissions PII is registrar/admin-only; school-media is
-- no longer world-readable.
-- Status: authored for SHERIVS-002; verified ONLY on a local disposable
-- loopback Supabase stack. Not applied to staging or production.
--
-- Findings fixed:
--   1. admission_applications SELECT/UPDATE were school-wide: any teacher,
--      parent, student, driver or bursar of the school could read applicant /
--      guardian PII and change decisions. Now limited to
--      public.can_manage_admissions() (admin, principal, or an active
--      'registrar' workforce position in the caller's school) or super admin.
--      The public pending-only INSERT policy (20261020000030) is untouched.
--   2. storage "school-media public read" let anon list/read every object in
--      the bucket. Dropped. Authenticated own-school read/insert/update/delete
--      policies are kept.
--   3. storage "admins read student documents" was named for admins but let any
--      authenticated member of the school read admission documents. Now limited
--      to super admin or can_manage_admissions() within the school folder.
--
-- Website image impact: ImageUploadField (frontend/src/components/admin/
-- crud-list.tsx) stores 10-year SIGNED URLs. Signed URLs are validated by the
-- storage API token, not by RLS, so existing website images keep rendering.
-- No frontend/mobile code uses getPublicUrl / storage/v1/object/public for
-- school-media, so no bucket is made public and no code path changes.
--
-- Rollback: database/supabase/rollbacks/20261020000040_sherivs_002_admissions_and_media_privacy.sql
-- =============================================================================
BEGIN;

-- identity_ref is auth.uid()::text across cg_ tables; tenant_ref is the school
-- id text. The position is never authorization by itself elsewhere, but here it
-- grants a narrowly scoped admissions capability and is read only inside this
-- SECURITY DEFINER predicate (cg_workforce_position RLS is not widened).
CREATE OR REPLACE FUNCTION public.can_manage_admissions()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
     WHERE u.id = auth.uid()
       AND u.is_active IS TRUE
       AND u.school_id IS NOT NULL
       AND (
         u.role IN ('admin', 'principal')
         OR EXISTS (
           SELECT 1
             FROM public.cg_workforce_position w
            WHERE w.tenant_ref   = u.school_id::text
              AND w.identity_ref = u.id::text
              AND w.runtime_ref  = 'runtime:scholar'
              AND w.kind_code    = 'registrar'
              AND w.status       = 'active'
              AND (w.started_on IS NULL OR w.started_on <= CURRENT_DATE)
              AND (w.ended_on IS NULL OR w.ended_on > CURRENT_DATE)
         )
       )
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_admissions() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_admissions() FROM anon;
GRANT EXECUTE ON FUNCTION public.can_manage_admissions() TO authenticated;

DROP POLICY IF EXISTS "school admins read applications" ON public.admission_applications;
DROP POLICY IF EXISTS "school admins update applications" ON public.admission_applications;

CREATE POLICY "school admins read applications"
  ON public.admission_applications FOR SELECT
  TO authenticated
  USING (
    (school_id = public.get_my_school_id() AND public.can_manage_admissions())
    OR public.is_super_admin()
  );

CREATE POLICY "school admins update applications"
  ON public.admission_applications FOR UPDATE
  TO authenticated
  USING (
    (school_id = public.get_my_school_id() AND public.can_manage_admissions())
    OR public.is_super_admin()
  )
  WITH CHECK (
    (school_id = public.get_my_school_id() AND public.can_manage_admissions())
    OR public.is_super_admin()
  );

-- Storage policies live in storage.objects, owned by supabase_storage_admin.
-- Guard so a stack without the storage schema does not fail the migration.
DO $storage$
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'SHERIVS-002: storage.objects absent, storage policies skipped';
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS "school-media public read" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "admins read student documents" ON storage.objects';
  EXECUTE $p$
    CREATE POLICY "admins read student documents"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'student-documents'
        AND (
          public.is_super_admin()
          OR (
            (storage.foldername(name))[2] = public.get_my_school_id()::text
            AND public.can_manage_admissions()
          )
        )
      )
  $p$;
END
$storage$;

COMMIT;
