-- Rollback SHERIVS-004 in-school role RLS (restores the previous FOR ALL school policies).
BEGIN;
DROP POLICY IF EXISTS fees_read ON public.fees;
DROP POLICY IF EXISTS fees_write ON public.fees;
CREATE POLICY tenant_all_fees ON public.fees FOR ALL USING ((school_id = get_my_school_id()) OR is_super_admin()) WITH CHECK ((school_id = get_my_school_id()) OR is_super_admin());
DROP POLICY IF EXISTS students_read ON public.students;
DROP POLICY IF EXISTS students_write ON public.students;
CREATE POLICY tenant_all_students ON public.students FOR ALL USING ((school_id = get_my_school_id()) OR is_super_admin()) WITH CHECK ((school_id = get_my_school_id()) OR is_super_admin());
DROP POLICY IF EXISTS platform_fee_ledger_read ON public.student_platform_fee_ledger;
DROP POLICY IF EXISTS platform_fee_ledger_super_write ON public.student_platform_fee_ledger;
CREATE POLICY platform_fee_ledger_school_access ON public.student_platform_fee_ledger FOR ALL TO authenticated USING ((school_id = get_my_school_id()) OR is_super_admin()) WITH CHECK ((school_id = get_my_school_id()) OR is_super_admin());
DROP FUNCTION IF EXISTS public.is_linked_to_student(uuid);
DROP FUNCTION IF EXISTS public.my_active_role();
COMMIT;
