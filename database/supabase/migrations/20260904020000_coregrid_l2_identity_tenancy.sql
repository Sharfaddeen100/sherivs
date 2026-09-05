-- CoreGrid — Phase 02/03 universal L2 data models (2026-09-04, dev validated).
--
-- Platform-level L2 models, canonical names sourced from the phase documents:
--   • cg_identity  — P02 C2 "Identity Registry" (identity records, metadata,
--     status; lifecycle states per P02 C1). Generic actor kinds only; links
--     into the P33 kernel substrate via cg_entity (never a second engine).
--   • cg_tenant     — P03 H1 "Tenant Entity" (tenant_id, tenant_type, name,
--     status, parent_tenant_id, region, environment) with the H2 status enum.
--
-- These are PLATFORM tables (owned by P02/P03), NOT kernel substrate and NOT
-- Scholar vocabulary. RLS posture matches the kernel: deny-by-default for
-- anon/authenticated; service-role only. Domain runtimes (Scholar first) map
-- their tenant rows onto cg_tenant at runtime; the legacy `schools` table
-- remains the Scholar runtime's domain projection.
--
-- Schema-level L2 evidence only — no phase is marked COMPLETE (§98: no
-- isolated completion; typed contracts + live consumption follow).

CREATE TABLE IF NOT EXISTS public.cg_identity (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            text NOT NULL CHECK (kind IN ('human','organization','agent','service','device','runtime')),
  display_name    text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 200),
  external_subject text UNIQUE,
  entity_id       uuid REFERENCES public.cg_entity(id) ON DELETE SET NULL,
  tenant_id       text,
  state           text NOT NULL DEFAULT 'provisioned'
                    CHECK (state IN ('provisioned','active','suspended','archived','deleted')),
  verified        boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cg_identity IS
  'P02 universal identity registry (C2). Generic actor kinds; lifecycle and '
  'verification state; optionally linked to a kernel cg_entity representation.';

CREATE INDEX IF NOT EXISTS cg_identity_kind_idx     ON public.cg_identity (kind);
CREATE INDEX IF NOT EXISTS cg_identity_tenant_idx   ON public.cg_identity (tenant_id);
CREATE INDEX IF NOT EXISTS cg_identity_entity_idx   ON public.cg_identity (entity_id);

CREATE TRIGGER cg_identity_touch
  BEFORE UPDATE ON public.cg_identity
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.cg_tenant (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_type     text NOT NULL CHECK (length(tenant_type) BETWEEN 1 AND 80),
  name            text NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  slug            text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?$'),
  status          text NOT NULL DEFAULT 'PROVISIONING'
                    CHECK (status IN ('PROVISIONING','ACTIVE','RESTRICTED','SUSPENDED','MIGRATING','ARCHIVED','TERMINATING','TERMINATED')),
  parent_tenant_id uuid REFERENCES public.cg_tenant(id) ON DELETE SET NULL,
  region          text,
  environment     text NOT NULL DEFAULT 'development'
                    CHECK (environment IN ('development','staging','production')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (parent_tenant_id IS NULL OR parent_tenant_id <> id)
);

COMMENT ON TABLE public.cg_tenant IS
  'P03 universal tenant entity (H1) with hierarchy (parent_tenant_id) and the '
  'H2 status lifecycle. Root tenants have parent_tenant_id NULL.';

CREATE INDEX IF NOT EXISTS cg_tenant_type_idx    ON public.cg_tenant (tenant_type);
CREATE INDEX IF NOT EXISTS cg_tenant_parent_idx  ON public.cg_tenant (parent_tenant_id);
CREATE INDEX IF NOT EXISTS cg_tenant_status_idx  ON public.cg_tenant (status);

CREATE TRIGGER cg_tenant_touch
  BEFORE UPDATE ON public.cg_tenant
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Security posture (matches the kernel substrate): deny-by-default.
-- -----------------------------------------------------------------------------
ALTER TABLE public.cg_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cg_tenant    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.cg_identity, public.cg_tenant FROM anon, authenticated;
GRANT ALL ON TABLE public.cg_identity, public.cg_tenant TO service_role;
