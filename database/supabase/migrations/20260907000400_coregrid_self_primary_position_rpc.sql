-- =============================================================================
-- CoreGrid self-position RPC (Phase 06/25) — a member's OWN primary position
-- =============================================================================
-- Author: CoreGrid Autonomous Engineering Loop (2026-09-07)
-- Status: APPLIED + VERIFIED 2026-09-07 on project nwrflbpbhyiqdptmlccm.
--
-- cg_workforce_position is zero-policy RLS (service-role only). This
-- security-definer function lets the AUTHENTICATED member read ONLY their own
-- active primary position (identity_ref = auth.uid()) for chrome/label
-- derivation. Self-scope is enforced inside the function; there is no
-- parameter, so no tenant or identity can ever be supplied by the client.
--
-- Advisory boundary unchanged: the returned row is workforce REALITY for
-- display/chrome resolution and is never an authorization grant. Phase 08
-- remains the only authorization authority.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_my_primary_workforce_position()
RETURNS TABLE (
  id              uuid,
  identity_ref    text,
  kind_code       text,
  kind_title      text,
  family          text,
  employment_type text,
  started_on      date,
  ended_on        date,
  status          text,
  is_primary      boolean,
  authority_group text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT w.id, w.identity_ref, w.kind_code, k.title, k.family,
         w.employment_type, w.started_on, w.ended_on, w.status, w.is_primary,
         k.authority_group
  FROM public.cg_workforce_position w
  JOIN public.cg_workforce_kind k
    ON k.runtime_ref = w.runtime_ref AND k.kind_code = w.kind_code
  WHERE w.identity_ref = auth.uid()::text
    AND w.is_primary
    AND w.status IN ('active','on_leave')
  ORDER BY w.started_on DESC, w.created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_primary_workforce_position() TO authenticated;
