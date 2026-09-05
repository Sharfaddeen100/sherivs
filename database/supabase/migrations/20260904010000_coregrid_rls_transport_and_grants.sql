-- CoreGrid — RLS correction for legacy findings (2026-09-04, live dev project).
--
-- 1. transport_buses: replace the school-wide `buses_school_rw` FOR ALL policy
--    (finding 2026-09-03 confirmed live) with:
--      - SELECT  → school-scoped (preserves realtime bus visibility for parents)
--      - UPDATE  → driver_id = auth.uid() OR school admin (scoped writes)
--      - INSERT / DELETE → school admin only
--    Super-admin and service-role paths are unaffected.
-- 2. Least-privilege grants: anon/authenticated must not hold TRUNCATE, TRIGGER
--    or REFERENCES on these tables — RLS cannot protect TRUNCATE.
-- 3. users: NO policy change — the school-scoped SELECT is required by the
--    fanout push path (push_token reads within the school) and rosters;
--    cross-school reads remain blocked by the same policy.

DROP POLICY IF EXISTS buses_school_rw ON public.transport_buses;

CREATE POLICY buses_school_read ON public.transport_buses
  FOR SELECT
  USING ((school_id = public.get_my_school_id()) OR public.is_super_admin());

CREATE POLICY buses_driver_or_admin_update ON public.transport_buses
  FOR UPDATE
  USING (
    ((school_id = public.get_my_school_id())
      AND ((driver_id = auth.uid()) OR public.is_school_admin()))
    OR public.is_super_admin()
  )
  WITH CHECK (
    ((school_id = public.get_my_school_id())
      AND ((driver_id = auth.uid()) OR public.is_school_admin()))
    OR public.is_super_admin()
  );

CREATE POLICY buses_school_admin_insert ON public.transport_buses
  FOR INSERT
  WITH CHECK (
    ((school_id = public.get_my_school_id()) AND public.is_school_admin())
    OR public.is_super_admin()
  );

CREATE POLICY buses_school_admin_delete ON public.transport_buses
  FOR DELETE
  USING (
    ((school_id = public.get_my_school_id()) AND public.is_school_admin())
    OR public.is_super_admin()
  );

REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.transport_buses FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.users FROM anon, authenticated;
