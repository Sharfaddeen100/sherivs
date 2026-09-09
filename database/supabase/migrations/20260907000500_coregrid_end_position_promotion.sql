-- =============================================================================
-- CoreGrid end-position primary promotion (Phase 25 workforce lifecycle)
-- =============================================================================
-- Author: CoreGrid Autonomous Engineering Loop (2026-09-07)
-- Status: APPLIED + VERIFIED 2026-09-07 on project nwrflbpbhyiqdptmlccm.
--
-- Replaces `end_workforce_position` (20260907000300) so ending a member's
-- PRIMARY appointment automatically promotes their most recently started open
-- secondary appointment. Workforce reality: a Head of Department who steps
-- down but remains a Subject Teacher must not lose a primary position (their
-- chrome/landing derive from the primary post). Ends a secondary appointment
-- without impact. All scope gates unchanged (school admin + own-tenant,
-- re-derived inside the function).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.end_workforce_position(
  p_position_id uuid,
  p_ended_on    date DEFAULT CURRENT_DATE
)
RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant       text;
  v_identity     text;
  v_was_primary  boolean;
BEGIN
  SELECT tenant_ref, identity_ref, is_primary
    INTO v_tenant, v_identity, v_was_primary
    FROM public.cg_workforce_position
   WHERE id = p_position_id;

  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Position not found';
  END IF;
  IF NOT public.is_school_admin() OR public.get_my_school_id() <> v_tenant::uuid THEN
    RAISE EXCEPTION 'Forbidden: school admin role required';
  END IF;

  UPDATE public.cg_workforce_position
     SET status = 'ended', ended_on = p_ended_on,
         is_primary = false, updated_at = now()
   WHERE id = p_position_id;

  -- If the ended appointment was the member's primary and they still hold
  -- other open appointments, promote the most recently started one so the
  -- single-primary invariant is preserved for chrome/landing derivation.
  IF v_was_primary THEN
    UPDATE public.cg_workforce_position
       SET is_primary = true, updated_at = now()
     WHERE id = (
       SELECT id
         FROM public.cg_workforce_position
        WHERE tenant_ref = v_tenant
          AND identity_ref = v_identity
          AND id <> p_position_id
          AND is_primary = false
          AND status IN ('active','on_leave')
        ORDER BY started_on DESC, created_at DESC
        LIMIT 1
     );
  END IF;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.end_workforce_position(uuid, date) TO authenticated;
