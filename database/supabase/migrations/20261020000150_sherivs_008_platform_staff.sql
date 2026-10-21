-- =============================================================================
-- SHERIVS-008 — Internal console: platform staff, platform roles, capabilities.
--
-- Sherivs' own (non-customer) workforce. public.super_admins stays the top
-- tier and is unchanged. Staff are created ONLY by server functions running
-- with the service role after a super-admin check (invite flow); clients get
-- read access to their own rows and nothing else. No client INSERT / UPDATE /
-- DELETE / TRUNCATE on any of these tables.
-- Rollback: database/supabase/rollbacks/20261020000150_sherivs_008_platform_staff.sql
-- =============================================================================
BEGIN;

-- 1. Role catalogue (fixed, seeded; changed only by migration) ---------------
CREATE TABLE IF NOT EXISTS public.platform_roles (
  code          text PRIMARY KEY CHECK (code ~ '^[a-z][a-z_]{1,40}$'),
  label         text NOT NULL,
  description   text NOT NULL,
  capabilities  text[] NOT NULL DEFAULT '{}',
  is_privileged boolean NOT NULL DEFAULT false,
  sort_order    integer NOT NULL DEFAULT 100
);

INSERT INTO public.platform_roles (code, label, description, capabilities, is_privileged, sort_order) VALUES
  ('platform_admin', 'Platform admin', 'Runs the internal console; manages staff and roles (not super admins).',
     ARRAY['platform.staff.read','platform.staff.manage','platform.tenants.read','platform.config.read','platform.audit.read'], true, 10),
  ('support',     'Support',     'Customer support: tenant registry and support queue.',
     ARRAY['platform.tenants.read','platform.support.handle'], false, 20),
  ('engineering', 'Engineering', 'Platform architecture, runtime registry and kernel capabilities.',
     ARRAY['platform.engineering.read','platform.config.read'], false, 30),
  ('security',    'Security',    'Trust fabric, audit and security invariants.',
     ARRAY['platform.security.read','platform.audit.read'], false, 40),
  ('finance',     'Finance',     'Billing and financial operations.',
     ARRAY['platform.finance.read'], false, 50),
  ('sales',       'Sales',       'Tenant registry and demo requests.',
     ARRAY['platform.tenants.read','platform.sales.handle'], false, 60),
  ('operations',  'Operations',  'Platform operations and AI workforce missions.',
     ARRAY['platform.operations.read','platform.config.read'], false, 70)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description,
  capabilities = EXCLUDED.capabilities, is_privileged = EXCLUDED.is_privileged,
  sort_order = EXCLUDED.sort_order;

-- 2. Staff ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_staff (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  full_name     text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 2 AND 120),
  department    text CHECK (department IS NULL OR length(department) <= 80),
  status        text NOT NULL DEFAULT 'invited'
                  CHECK (status IN ('invited','active','suspended','revoked')),
  invited_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at    timestamptz NOT NULL DEFAULT now(),
  activated_at  timestamptz,
  suspended_at  timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS platform_staff_email_key ON public.platform_staff (lower(email));

CREATE TABLE IF NOT EXISTS public.platform_staff_roles (
  staff_id   uuid NOT NULL REFERENCES public.platform_staff(id) ON DELETE CASCADE,
  role_code  text NOT NULL REFERENCES public.platform_roles(code),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (staff_id, role_code)
);

-- 3. Authorization helpers (SECURITY DEFINER, pinned search_path) ---------------
CREATE OR REPLACE FUNCTION public.is_platform_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.is_super_admin()
      OR EXISTS (SELECT 1 FROM public.platform_staff s
                  WHERE s.id = auth.uid() AND s.status = 'active');
$$;

CREATE OR REPLACE FUNCTION public.has_platform_capability(p_capability text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.is_super_admin()
      OR EXISTS (SELECT 1
                   FROM public.platform_staff s
                   JOIN public.platform_staff_roles sr ON sr.staff_id = s.id
                   JOIN public.platform_roles r ON r.code = sr.role_code
                  WHERE s.id = auth.uid() AND s.status = 'active'
                    AND p_capability = ANY (r.capabilities));
$$;

-- An invited staff member activates THEIR OWN pre-created invite after
-- accepting it (email confirmed). Never re-activates suspended / revoked rows
-- and grants nothing: roles are assigned only by the server (super admin).
CREATE OR REPLACE FUNCTION public.claim_platform_staff_invite()
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.platform_staff s
     SET status = 'active', activated_at = now(), updated_at = now()
    FROM auth.users u
   WHERE s.id = auth.uid() AND u.id = s.id
     AND s.status = 'invited' AND u.email_confirmed_at IS NOT NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.is_platform_staff() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_platform_capability(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_platform_staff_invite() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_staff() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_platform_capability(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_platform_staff_invite() TO authenticated;

-- 4. RLS + grants --------------------------------------------------------------
ALTER TABLE public.platform_roles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_staff       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_staff_roles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.platform_roles, public.platform_staff, public.platform_staff_roles
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.platform_roles, public.platform_staff, public.platform_staff_roles
  TO authenticated;
GRANT ALL ON TABLE public.platform_roles, public.platform_staff, public.platform_staff_roles
  TO service_role;

DROP POLICY IF EXISTS platform_roles_read ON public.platform_roles;
CREATE POLICY platform_roles_read ON public.platform_roles FOR SELECT TO authenticated
  USING (public.is_platform_staff()
         OR EXISTS (SELECT 1 FROM public.platform_staff s WHERE s.id = auth.uid()));

DROP POLICY IF EXISTS platform_staff_read ON public.platform_staff;
CREATE POLICY platform_staff_read ON public.platform_staff FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_platform_capability('platform.staff.read'));

DROP POLICY IF EXISTS platform_staff_roles_read ON public.platform_staff_roles;
CREATE POLICY platform_staff_roles_read ON public.platform_staff_roles FOR SELECT TO authenticated
  USING (staff_id = auth.uid() OR public.has_platform_capability('platform.staff.read'));

COMMIT;
