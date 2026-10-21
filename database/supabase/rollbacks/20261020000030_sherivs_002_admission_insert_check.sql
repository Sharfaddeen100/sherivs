-- Rollback SHERIVS-002 0030: restores the original permissive admissions insert policy.
-- WARNING: re-allows arbitrary field values (status, decision notes, inactive schools) on public submissions.
BEGIN;
DROP POLICY IF EXISTS "public can submit applications" ON public.admission_applications;
CREATE POLICY "public can submit applications" ON public.admission_applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);
COMMIT;
