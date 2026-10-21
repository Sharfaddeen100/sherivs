-- =============================================================================
-- SHERIVS-002: tighten the public admission-application INSERT policy.
-- Status: authored for SHERIVS-002; verified ONLY on a local disposable
-- loopback Supabase stack. Not applied to staging or production.
--
-- Before: "public can submit applications" was INSERT ... WITH CHECK (true)
-- for anon/authenticated, so any client could create an application for any
-- school (intended) but ALSO pre-set reviewer-owned fields (status =
-- 'accepted', interview/decision notes, AI review verdicts) and target an
-- inactive school.
-- After: submitting to any ACTIVE school is still allowed (public admissions
-- form, frontend/src/routes/admissions.tsx), but only as a fresh 'pending'
-- application with no reviewer-owned fields set.
-- =============================================================================
BEGIN;

DROP POLICY IF EXISTS "public can submit applications" ON public.admission_applications;

CREATE POLICY "public can submit applications" ON public.admission_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND interview_date IS NULL
    AND interview_notes IS NULL
    AND decision_notes IS NULL
    AND ai_review_result IS NULL
    AND ai_reviewed_at IS NULL
    AND ai_recommendation IS NULL
    AND EXISTS (
      SELECT 1 FROM public.schools s
       WHERE s.id = admission_applications.school_id
         AND s.is_active = true
    )
  );

COMMIT;
