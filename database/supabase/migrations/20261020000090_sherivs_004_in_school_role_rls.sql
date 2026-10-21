-- =============================================================================
-- SHERIVS-004: in-school role RLS for fees, students and the platform fee ledger.
-- Verified ONLY on a local disposable loopback Supabase stack. Not applied remotely.
--
-- Before: tenant_all_fees / tenant_all_students / platform_fee_ledger_school_access
-- were FOR ALL with school_id = get_my_school_id(): ANY member of a school (parent,
-- student, driver, ...) could mark any fee paid, edit any student record, and read
-- every student's fees and personal data through PostgREST.
--
-- After:
--   read  fees    : school staff (admin, principal, bursar, hq, teacher) of the school;
--                   a parent linked to the student; the student themself; super admin.
--   read  students: school staff (+ driver) of the school; linked parent; the student; super admin.
--   write fees    : admin, principal, bursar of the school; super admin.
--   write students: admin, principal of the school, or can_manage_admissions(); super admin.
--   ledger        : read admin/principal/bursar/hq; no client writes (server/service role only).
-- Server functions using the service role are unaffected.
-- Rollback: database/supabase/rollbacks/20261020000090_sherivs_004_in_school_role_rls.sql
-- =============================================================================
BEGIN;

CREATE OR REPLACE FUNCTION public.my_active_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.role FROM public.users u WHERE u.id = auth.uid() AND u.is_active = true
$$;

-- True when the caller may see the given student as parent or as the student.
CREATE OR REPLACE FUNCTION public.is_linked_to_student(p_student uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.students s
     WHERE s.id = p_student
       AND s.school_id = public.get_my_school_id()
       AND (
         s.user_id = auth.uid()
         OR s.parent_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.parent_student_map m
                     WHERE m.student_id = s.id AND m.parent_id = auth.uid())
         OR (s.parent_email IS NOT NULL AND public.my_active_role() = 'parent'
             AND lower(s.parent_email) = (SELECT lower(u.email) FROM public.users u WHERE u.id = auth.uid()))
       ))
$$;

REVOKE ALL ON FUNCTION public.my_active_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_linked_to_student(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_active_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_linked_to_student(uuid) TO authenticated, service_role;

-- fees ----------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_all_fees ON public.fees;
CREATE POLICY fees_read ON public.fees FOR SELECT TO authenticated USING (
  public.is_super_admin()
  OR (school_id = public.get_my_school_id()
      AND (public.my_active_role() IN ('admin','principal','bursar','hq','teacher')
           OR public.is_linked_to_student(student_id))));
CREATE POLICY fees_write ON public.fees FOR ALL TO authenticated
  USING (public.is_super_admin()
         OR (school_id = public.get_my_school_id() AND public.my_active_role() IN ('admin','principal','bursar')))
  WITH CHECK (public.is_super_admin()
         OR (school_id = public.get_my_school_id() AND public.my_active_role() IN ('admin','principal','bursar')));

-- students ------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_all_students ON public.students;
CREATE POLICY students_read ON public.students FOR SELECT TO authenticated USING (
  public.is_super_admin()
  OR (school_id = public.get_my_school_id()
      AND (public.my_active_role() IN ('admin','principal','bursar','hq','teacher','driver')
           OR public.is_linked_to_student(id))));
CREATE POLICY students_write ON public.students FOR ALL TO authenticated
  USING (public.is_super_admin()
         OR (school_id = public.get_my_school_id()
             AND (public.my_active_role() IN ('admin','principal') OR public.can_manage_admissions())))
  WITH CHECK (public.is_super_admin()
         OR (school_id = public.get_my_school_id()
             AND (public.my_active_role() IN ('admin','principal') OR public.can_manage_admissions())));

-- platform fee ledger ---------------------------------------------------------
DROP POLICY IF EXISTS platform_fee_ledger_school_access ON public.student_platform_fee_ledger;
CREATE POLICY platform_fee_ledger_read ON public.student_platform_fee_ledger FOR SELECT TO authenticated USING (
  public.is_super_admin()
  OR (school_id = public.get_my_school_id() AND public.my_active_role() IN ('admin','principal','bursar','hq')));
CREATE POLICY platform_fee_ledger_super_write ON public.student_platform_fee_ledger FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

COMMIT;
