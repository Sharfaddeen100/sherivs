DROP POLICY IF EXISTS "tenant_all_messages" ON public.messages;
CREATE POLICY "msg_select_own" ON public.messages FOR SELECT TO authenticated
  USING ((school_id = get_my_school_id()) AND (sender_id = auth.uid() OR recipient_id = auth.uid()) OR is_super_admin());
CREATE POLICY "msg_insert_sender" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (school_id = get_my_school_id() AND sender_id = auth.uid());
CREATE POLICY "msg_update_recipient" ON public.messages FOR UPDATE TO authenticated
  USING (school_id = get_my_school_id() AND recipient_id = auth.uid())
  WITH CHECK (school_id = get_my_school_id() AND recipient_id = auth.uid());

DROP POLICY IF EXISTS "tenant_all_notifications" ON public.notifications;
CREATE POLICY "notif_select_own" ON public.notifications FOR SELECT TO authenticated
  USING ((school_id = get_my_school_id() AND user_id = auth.uid()) OR is_super_admin());
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE TO authenticated
  USING (school_id = get_my_school_id() AND user_id = auth.uid())
  WITH CHECK (school_id = get_my_school_id() AND user_id = auth.uid());
CREATE POLICY "notif_insert_tenant" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (school_id = get_my_school_id());