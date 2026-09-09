-- =============================================================================
-- CoreGrid organization-profile substrate (domain-neutral, Phase 25/33)
-- =============================================================================
-- Author: CoreGrid Autonomous Engineering Loop (2026-09-07)
-- Status: APPLIED + VERIFIED 2026-09-07 on project nwrflbpbhyiqdptmlccm.
--
-- Generic per-tenant profile store so an organization's own choices (school
-- template features, day model, streams...) persist and drive every surface.
-- Domain-agnostic shape: (tenant_ref, runtime_ref, profile_key, payload).
-- Domain runtimes (Scholar) define their own profile keys + validation; this
-- table only stores JSON payloads — the kernel never interprets them.
-- Zero-policy RLS (service role only); org-admin RPCs provide scoped access.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cg_org_profile (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_ref   text NOT NULL CHECK (length(tenant_ref) BETWEEN 1 AND 128),
  runtime_ref  text NOT NULL,
  profile_key  text NOT NULL CHECK (length(profile_key) BETWEEN 1 AND 128),
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb
                 CHECK (jsonb_typeof(payload) = 'object'),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_ref, runtime_ref, profile_key)
);

COMMENT ON TABLE public.cg_org_profile IS
  'Domain-neutral organization profile store. The kernel never interprets '
  'payloads; domain runtimes own keys and validation. Never an authorization '
  'input (Phase 08 remains the only authority).';

CREATE TRIGGER cg_org_profile_touch
  BEFORE UPDATE ON public.cg_org_profile
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.cg_org_profile ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.cg_org_profile FROM anon, authenticated;
GRANT ALL ON TABLE public.cg_org_profile TO service_role;

-- -----------------------------------------------------------------------------
-- Org-admin RPC surface (gate: is_school_admin AND own tenant)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_org_profile(
  p_tenant uuid, p_runtime text, p_profile_key text
)
RETURNS TABLE (id uuid, payload jsonb, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, payload, updated_at
    FROM public.cg_org_profile
   WHERE tenant_ref = p_tenant::text
     AND runtime_ref = p_runtime
     AND profile_key = p_profile_key
     AND public.is_school_admin()
     AND public.get_my_school_id() = p_tenant
$$;

GRANT EXECUTE ON FUNCTION public.get_org_profile(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.upsert_org_profile(
  p_tenant uuid, p_runtime text, p_profile_key text, p_payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_school_admin() OR public.get_my_school_id() <> p_tenant THEN
    RAISE EXCEPTION 'Forbidden: school admin role required';
  END IF;
  IF jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'payload must be a JSON object';
  END IF;

  INSERT INTO public.cg_org_profile (tenant_ref, runtime_ref, profile_key, payload)
  VALUES (p_tenant::text, p_runtime, p_profile_key, p_payload)
  ON CONFLICT (tenant_ref, runtime_ref, profile_key)
  DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_org_profile(uuid, text, text, jsonb) TO authenticated;
