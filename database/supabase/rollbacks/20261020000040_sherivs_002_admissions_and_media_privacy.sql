-- Rollback for 20261020000040_sherivs_002_admissions_and_media_privacy.sql
-- Restores the prior (looser) policies exactly as defined in:
--   20260626133221_e95464b7-... (admission_applications SELECT/UPDATE)
--   20260707223958_421f2364-... (school-media public read)
--   20260626133249_c712dcde-... (admins read student documents)
-- Rolling back re-opens applicant PII to every school member and school-media
-- to anonymous reads. Local disposable stack only unless explicitly approved.
BEGIN;

DROP POLICY IF EXISTS "school admins read applications" ON public.admission_applications;
DROP POLICY IF EXISTS "school admins update applications" ON public.admission_applications;

CREATE POLICY "school admins read applications"
  ON public.admission_applications FOR SELECT
  TO authenticated
  USING (school_id = public.get_my_school_id() OR public.is_super_admin());

CREATE POLICY "school admins update applications"
  ON public.admission_applications FOR UPDATE
  TO authenticated
  USING (school_id = public.get_my_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());

DO $storage$
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'SHERIVS-002 rollback: storage.objects absent, skipped';
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS "school-media public read" ON storage.objects';
  EXECUTE $p$
    CREATE POLICY "school-media public read"
    ON storage.objects FOR SELECT
    TO anon
    USING (bucket_id = 'school-media')
  $p$;

  EXECUTE 'DROP POLICY IF EXISTS "admins read student documents" ON storage.objects';
  EXECUTE $p$
    CREATE POLICY "admins read student documents"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'student-documents'
        AND (
          public.is_super_admin()
          OR (storage.foldername(name))[2] = public.get_my_school_id()::text
        )
      )
  $p$;
END
$storage$;

DROP FUNCTION IF EXISTS public.can_manage_admissions();

COMMIT;
