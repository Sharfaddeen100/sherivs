
-- Tighten audit_logs: only admins and super-admins can read; tenant writes still allowed
DROP POLICY IF EXISTS tenant_all_audit_logs ON public.audit_logs;
CREATE POLICY audit_logs_admin_read ON public.audit_logs
  FOR SELECT TO authenticated
  USING ((school_id = public.get_my_school_id() AND public.is_school_admin()) OR public.is_super_admin());
CREATE POLICY audit_logs_tenant_write ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());

-- Tighten teacher_performance_profiles: admins or the teacher themselves
DROP POLICY IF EXISTS tenant_all_teacher_performance_profiles ON public.teacher_performance_profiles;
CREATE POLICY tpp_self_or_admin_read ON public.teacher_performance_profiles
  FOR SELECT TO authenticated
  USING (
    (school_id = public.get_my_school_id() AND (public.is_school_admin() OR teacher_id = auth.uid()))
    OR public.is_super_admin()
  );
CREATE POLICY tpp_admin_write ON public.teacher_performance_profiles
  FOR ALL TO authenticated
  USING ((school_id = public.get_my_school_id() AND public.is_school_admin()) OR public.is_super_admin())
  WITH CHECK ((school_id = public.get_my_school_id() AND public.is_school_admin()) OR public.is_super_admin());

-- Tighten webhook_logs: admins/super-admins only
DROP POLICY IF EXISTS tenant_all_webhook_logs ON public.webhook_logs;
CREATE POLICY webhook_logs_admin_only ON public.webhook_logs
  FOR ALL TO authenticated
  USING ((school_id = public.get_my_school_id() AND public.is_school_admin()) OR public.is_super_admin())
  WITH CHECK ((school_id = public.get_my_school_id() AND public.is_school_admin()) OR public.is_super_admin());

-- Tighten qr_tokens: admins, teachers, or the creator; prevents students/parents from reading live tokens
DROP POLICY IF EXISTS tenant_all_qr_tokens ON public.qr_tokens;
CREATE POLICY qr_tokens_scoped ON public.qr_tokens
  FOR ALL TO authenticated
  USING (
    (school_id = public.get_my_school_id() AND (
      public.is_school_admin()
      OR created_by = auth.uid()
      OR public.get_my_role() = 'teacher'
    ))
    OR public.is_super_admin()
  )
  WITH CHECK (
    school_id = public.get_my_school_id() AND created_by = auth.uid()
  );

-- Tighten platform_config: super-admins only
DROP POLICY IF EXISTS platform_config_read_all ON public.platform_config;
CREATE POLICY platform_config_super_admin_read ON public.platform_config
  FOR SELECT TO authenticated
  USING (public.is_super_admin());
