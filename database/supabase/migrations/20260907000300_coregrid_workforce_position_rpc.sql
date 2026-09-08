-- =============================================================================
-- CoreGrid workforce-position RPC surface (Phase 25 Workforce Identity, S2)
-- =============================================================================
-- Author: CoreGrid Autonomous Engineering Loop (2026-09-07)
-- Status: AUTH NOT VALIDATED -- apply after 20260907000000 (substrate) and
--         20260907000100 (runtime:scholar catalog seed).
--         Apply with `supabase db push --workdir database/supabase`, then run
--         `node scripts/verify-workforce-substrate.mjs` and extend
--         database/queries/rls-isolation-check.sql coverage (§8).
--
-- cg_workforce_position is zero-policy RLS (service-role only). These
-- SECURITY DEFINER functions expose a scoped, gate-checked surface to the
-- authenticated role for org-admin HR operations. Every function enforces:
--   actor is school admin (role admin|principal) AND actor school == tenant.
-- The tenant is NEVER trusted from the client — it is re-derived from the
-- actor inside each function.
--
-- Advisory boundary unchanged: positions are workforce REALITY data and are
-- never authorization inputs (Phase 08 remains the only authority).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. List positions for a tenant (org admin scope enforced)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_workforce_positions(p_tenant uuid)
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
  WHERE w.tenant_ref = p_tenant::text
    AND public.is_school_admin()
    AND public.get_my_school_id() = p_tenant
  ORDER BY w.is_primary DESC, w.started_on DESC, w.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_workforce_positions(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. Assign (or re-activate) a workforce position for an identity
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_workforce_position(
  p_tenant          uuid,
  p_identity        uuid,
  p_kind_code       text,
  p_runtime         text DEFAULT 'runtime:scholar',
  p_primary         boolean DEFAULT false,
  p_employment_type text DEFAULT 'full_time',
  p_started_on      date DEFAULT CURRENT_DATE
)
RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_position_id uuid;
BEGIN
  IF NOT public.is_school_admin() OR public.get_my_school_id() <> p_tenant THEN
    RAISE EXCEPTION 'Forbidden: school admin role required';
  END IF;
  IF p_employment_type NOT IN ('full_time','part_time','contract','volunteer','intern','seconded') THEN
    RAISE EXCEPTION 'Invalid employment type';
  END IF;

  -- Demote an existing primary before promoting a new one (single primary rule).
  IF p_primary THEN
    UPDATE public.cg_workforce_position
       SET is_primary = false, updated_at = now()
     WHERE tenant_ref = p_tenant::text
       AND runtime_ref = p_runtime
       AND identity_ref = p_identity::text
       AND is_primary
       AND status IN ('proposed','active','on_leave');
  END IF;

  -- Re-activate a previously ended appointment instead of duplicating it.
  INSERT INTO public.cg_workforce_position (
    tenant_ref, runtime_ref, kind_code, identity_ref, is_primary,
    employment_type, started_on, status, attributes
  ) VALUES (
    p_tenant::text, p_runtime, p_kind_code, p_identity::text, p_primary,
    p_employment_type, p_started_on, 'active', '{}'::jsonb
  )
  ON CONFLICT (tenant_ref, runtime_ref, identity_ref, kind_code)
  DO UPDATE SET is_primary = EXCLUDED.is_primary,
                employment_type = EXCLUDED.employment_type,
                started_on = EXCLUDED.started_on,
                ended_on = NULL,
                status = 'active',
                updated_at = now()
  RETURNING id INTO v_position_id;

  RETURN v_position_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_workforce_position(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_workforce_position(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_workforce_position(uuid, uuid, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_workforce_position(uuid, uuid, text, text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_workforce_position(uuid, uuid, text, text, boolean, text, date) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. End (revoke) a workforce position
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.end_workforce_position(
  p_position_id uuid,
  p_ended_on    date DEFAULT CURRENT_DATE
)
RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant text;
BEGIN
  SELECT tenant_ref INTO v_tenant
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

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.end_workforce_position(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_workforce_position(uuid, date) TO authenticated;
