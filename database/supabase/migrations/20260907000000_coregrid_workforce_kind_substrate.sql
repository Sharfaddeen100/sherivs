-- =============================================================================
-- CoreGrid Workforce-Kind Substrate (Phase 25 Workforce Identity, S2)
-- =============================================================================
-- Author: CoreGrid Autonomous Engineering Loop (2026-09-07)
-- Status: APPLIED + VERIFIED 2026-09-07 on project nwrflbpbhyiqdptmlccm
--         (applied via Management API). Proof:
--         node scripts/verify-workforce-substrate.mjs -> 7/7 PASS.
--
-- ARCHITECTURAL BOUNDARY (Phase 01 §5, PRINCIPLES §5, BOUNDARIES §2):
--   This substrate is domain-agnostic by construction. It models WORKFORCE
--   REALITY -- positions a person holds inside an organization -- never
--   authorization. Authorization stays in Phase 08 (capability-gated role
--   decision) and is NOT derived from these rows by any layer.
--
--   Primitives provided:
--     cg_workforce_kind     -- platform catalog of position kinds per domain
--                             runtime (runtime-agnostic table shape; content
--                             is installed per runtime, e.g. runtime:scholar)
--     cg_workforce_position -- tenant-scoped, time-bounded appointment of an
--                             identity to a workforce kind (multi-position
--                             per person allowed; single primary per tenant)
--
-- Security posture: control-plane substrate. Row-Level Security enabled with
--   zero policies; anon/authenticated are denied by default. Access is limited
--   to the service role (server functions). This matches the Phase 33 kernel
--   substrate convention exactly.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. Workforce-kind catalog (platform, per-runtime)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cg_workforce_kind (
  runtime_ref      text NOT NULL REFERENCES public.cg_domain_runtime(id) ON DELETE CASCADE,
  kind_code        text NOT NULL CHECK (kind_code ~ '^[a-z][a-z0-9_]{2,63}$'),
  title            text NOT NULL CHECK (length(title) BETWEEN 2 AND 140),
  aliases          text[] NOT NULL DEFAULT '{}'::text[]
                     CHECK (cardinality(aliases) <= 12),
  family           text NOT NULL CHECK (family IN (
                     'governance','leadership','teaching','learning_support',
                     'learner_welfare','health','administration','finance',
                     'operations','facilities','transport','security',
                     'extended_services'
                   )),
  employment_class text NOT NULL CHECK (employment_class IN (
                     'governance_volunteer','teaching','support',
                     'non_teaching','intern','volunteer','contract'
                   )),
  is_teaching      boolean NOT NULL DEFAULT false,
  is_leadership    boolean NOT NULL DEFAULT false,
  authority_group  text NOT NULL CHECK (authority_group IN (
                     'org_admin','teaching_leadership','teaching_staff',
                     'learning_support','learner_welfare','administration',
                     'finance_officer','operations','facilities','transport',
                     'security','governance','extended_services'
                   )),
  description      text NOT NULL DEFAULT '' CHECK (length(description) <= 500),
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active','deprecated')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (runtime_ref, kind_code),
  -- Advisory-data integrity: a teaching flag never decorates a non-teaching
  -- family, and leadership flags only decorate senior authority groups
  -- (org_admin/governance/finance_officer/teaching_leadership). The rule is
  -- access-group based and domain-neutral by construction.
  CHECK (NOT is_teaching OR family IN ('teaching','learning_support','leadership')),
  CHECK (
    NOT is_leadership OR authority_group IN (
      'org_admin','governance','finance_officer','teaching_leadership'
    )
  )
);

COMMENT ON TABLE public.cg_workforce_kind IS
  'Platform workforce-kind catalog. Rows are workforce REALITY data installed '
  'per domain runtime; they are never authorization inputs. Authorization is '
  'resolved exclusively by the Phase 08 role/capability gate.';

CREATE INDEX IF NOT EXISTS cg_workforce_kind_runtime_idx  ON public.cg_workforce_kind (runtime_ref);
CREATE INDEX IF NOT EXISTS cg_workforce_kind_family_idx   ON public.cg_workforce_kind (runtime_ref, family);
CREATE INDEX IF NOT EXISTS cg_workforce_kind_teach_idx    ON public.cg_workforce_kind (runtime_ref, is_teaching) WHERE is_teaching;
CREATE INDEX IF NOT EXISTS cg_workforce_kind_lead_idx     ON public.cg_workforce_kind (runtime_ref, is_leadership) WHERE is_leadership;

CREATE TRIGGER cg_workforce_kind_touch
  BEFORE UPDATE ON public.cg_workforce_kind
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Workforce-position registry (tenant-scoped appointments)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cg_workforce_position (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_ref       text NOT NULL CHECK (length(tenant_ref) BETWEEN 1 AND 128),
  runtime_ref      text NOT NULL,
  kind_code        text NOT NULL,
  identity_ref     text NOT NULL CHECK (length(identity_ref) BETWEEN 1 AND 128),
  is_primary       boolean NOT NULL DEFAULT false,
  employment_type  text NOT NULL DEFAULT 'full_time' CHECK (employment_type IN (
                     'full_time','part_time','contract','volunteer','intern','seconded'
                   )),
  started_on       date NOT NULL,
  ended_on         date,
  status           text NOT NULL DEFAULT 'active' CHECK (status IN (
                     'proposed','active','on_leave','suspended','ended','revoked'
                   )),
  attributes       jsonb NOT NULL DEFAULT '{}'::jsonb
                     CHECK (jsonb_typeof(attributes) = 'object'),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (runtime_ref, kind_code)
    REFERENCES public.cg_workforce_kind (runtime_ref, kind_code) ON DELETE RESTRICT,
  CHECK (ended_on IS NULL OR started_on IS NULL OR ended_on >= started_on),
  UNIQUE (tenant_ref, runtime_ref, identity_ref, kind_code)
);

COMMENT ON TABLE public.cg_workforce_position IS
  'Tenant-scoped workforce appointment. A person may hold several positions '
  'in one organization (e.g. subject teacher AND examination officer), with a '
  'single primary position per tenant for chrome/landing derivation. Never an '
  'authorization input; Phase 08 remains the only authorization authority.';

-- One primary position per identity per tenant.
CREATE UNIQUE INDEX IF NOT EXISTS cg_workforce_position_one_primary_idx
  ON public.cg_workforce_position (tenant_ref, runtime_ref, identity_ref)
  WHERE is_primary;

CREATE INDEX IF NOT EXISTS cg_workforce_position_person_idx
  ON public.cg_workforce_position (tenant_ref, runtime_ref, identity_ref);
CREATE INDEX IF NOT EXISTS cg_workforce_position_kind_idx
  ON public.cg_workforce_position (tenant_ref, runtime_ref, kind_code);
CREATE INDEX IF NOT EXISTS cg_workforce_position_open_idx
  ON public.cg_workforce_position (tenant_ref, status)
  WHERE status IN ('proposed','active','on_leave','suspended');

CREATE TRIGGER cg_workforce_position_touch
  BEFORE UPDATE ON public.cg_workforce_position
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Security posture (control-plane substrate)
-- -----------------------------------------------------------------------------
ALTER TABLE public.cg_workforce_kind     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cg_workforce_position ENABLE ROW LEVEL SECURITY;

-- Deny anon/authenticated by default; no RLS policies are created here.
-- Service-role access is used by server functions (account administration,
-- HR surfaces). Consuming domain runtimes author their own scoped policies
-- when installed (never modify this file).
REVOKE ALL ON TABLE public.cg_workforce_kind, public.cg_workforce_position
  FROM anon, authenticated;
GRANT ALL ON TABLE public.cg_workforce_kind, public.cg_workforce_position
  TO service_role;
