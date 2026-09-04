-- =============================================================================
-- CoreGrid Universal Reality Intelligence Kernel — substrate (Phase 33 URIK, S2)
-- =============================================================================
-- Author: CoreGrid Autonomous Engineering Loop (2026-09-03)
-- Status: AUTH NOT VALIDATED — authored without a reachable database.
--         Apply with `supabase db push --workdir database/supabase` and then
--         extend database/queries/rls-isolation-check.sql coverage.
--
-- ARCHITECTURAL BOUNDARY (Phase 01 §5, PRINCIPLES §5, BOUNDARIES §2):
--   This substrate is domain-agnostic by construction. It MUST NOT contain any
--   domain vocabulary. Domain runtimes (healthcare, government, agriculture,
--   manufacturing, ...) are installed later as consumers that extend these
--   primitives; they are never embedded here. If a domain term is required,
--   it belongs in a domain migration, not in this kernel.
--
-- Primitives provided (first slice):
--   cg_entity        — universal entity registry with provenance/temporal state
--   cg_relationship  — typed, time-bounded relationships between entities
--   cg_event         — versioned event/outbox records (command-query-event)
--   cg_observation   — truth-hierarchy observations (never collapse kinds)
--
-- Security posture: control-plane substrate. No privileges are granted to the
--   anon or authenticated roles; Row-Level Security is enabled with zero
--   policies, so those roles are denied by default. Access is limited to the
--   service role (server functions). Consuming domain runtimes author their
--   own scoped policies against these tables when installed.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Universal entity registry
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cg_entity (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     text NOT NULL CHECK (length(entity_type) BETWEEN 1 AND 128),
  tenant_id       text,
  state           text,
  classification  text NOT NULL DEFAULT 'INTERNAL'
                    CHECK (classification IN (
                      'PUBLIC','INTERNAL','CONFIDENTIAL',
                      'SENSITIVE','RESTRICTED','HIGHLY_RESTRICTED'
                    )),
  attributes      jsonb NOT NULL DEFAULT '{}'::jsonb
                    CHECK (jsonb_typeof(attributes) = 'object'),
  source_type     text,
  source_ref      text,
  observed_at     timestamptz,
  recorded_at     timestamptz NOT NULL DEFAULT now(),
  valid_from      timestamptz,
  valid_to        timestamptz,
  superseded_by   uuid REFERENCES public.cg_entity(id),
  confidence      numeric(4,3),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to > valid_from),
  CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

COMMENT ON TABLE public.cg_entity IS
  'Universal entity registry. Domain-agnostic; carries provenance, temporal '
  'validity, data classification and confidence. Domain runtimes extend via '
  'entity_type + attributes; they never redefine this table.';

CREATE INDEX IF NOT EXISTS cg_entity_tenant_idx         ON public.cg_entity (tenant_id);
CREATE INDEX IF NOT EXISTS cg_entity_type_idx           ON public.cg_entity (entity_type);
CREATE INDEX IF NOT EXISTS cg_entity_tenant_type_idx    ON public.cg_entity (tenant_id, entity_type);
CREATE INDEX IF NOT EXISTS cg_entity_classification_idx ON public.cg_entity (classification);
CREATE INDEX IF NOT EXISTS cg_entity_superseded_idx     ON public.cg_entity (superseded_by) WHERE superseded_by IS NOT NULL;

CREATE TRIGGER cg_entity_touch
  BEFORE UPDATE ON public.cg_entity
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Typed relationship registry
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cg_relationship (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id uuid NOT NULL REFERENCES public.cg_entity(id) ON DELETE RESTRICT,
  target_entity_id uuid NOT NULL REFERENCES public.cg_entity(id) ON DELETE RESTRICT,
  relation_type    text NOT NULL CHECK (length(relation_type) BETWEEN 1 AND 128),
  tenant_id        text,
  attributes       jsonb NOT NULL DEFAULT '{}'::jsonb
                     CHECK (jsonb_typeof(attributes) = 'object'),
  source_ref       text,
  observed_at      timestamptz,
  recorded_at      timestamptz NOT NULL DEFAULT now(),
  valid_from       timestamptz,
  valid_to         timestamptz,
  confidence       numeric(4,3),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (source_entity_id <> target_entity_id),
  CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to > valid_from),
  CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

COMMENT ON TABLE public.cg_relationship IS
  'Typed, time-bounded relationship between two entities. Relationship and '
  'entity registries form the substrate of a universal reality graph; domain '
  'ontologies extend relation_type values.';

CREATE INDEX IF NOT EXISTS cg_relationship_tenant_idx ON public.cg_relationship (tenant_id);
CREATE INDEX IF NOT EXISTS cg_relationship_source_idx ON public.cg_relationship (source_entity_id, relation_type);
CREATE INDEX IF NOT EXISTS cg_relationship_target_idx ON public.cg_relationship (target_entity_id, relation_type);

CREATE TRIGGER cg_relationship_touch
  BEFORE UPDATE ON public.cg_relationship
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Versioned event / outbox registry
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cg_event (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      text NOT NULL CHECK (length(event_type) BETWEEN 1 AND 200),
  aggregate_type  text NOT NULL CHECK (length(aggregate_type) BETWEEN 1 AND 200),
  aggregate_id    text NOT NULL,
  actor_identity  text,
  tenant_id       text,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  recorded_at     timestamptz NOT NULL DEFAULT now(),
  correlation_id  text,
  idempotency_key text UNIQUE,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb
                    CHECK (jsonb_typeof(payload) = 'object'),
  payload_version integer NOT NULL DEFAULT 1 CHECK (payload_version >= 1),
  state           text NOT NULL DEFAULT 'pending'
                    CHECK (state IN ('pending','published','failed','acknowledged','dead')),
  attempts        integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cg_event IS
  'Versioned event/outbox registry. Idempotency keys, correlation ids and a '
  'delivery state machine support exactly-once intent at the application layer.';

CREATE INDEX IF NOT EXISTS cg_event_tenant_time_idx ON public.cg_event (tenant_id, occurred_at);
CREATE INDEX IF NOT EXISTS cg_event_state_idx       ON public.cg_event (state);
CREATE INDEX IF NOT EXISTS cg_event_aggregate_idx   ON public.cg_event (aggregate_type, aggregate_id);

CREATE TRIGGER cg_event_touch
  BEFORE UPDATE ON public.cg_event
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Truth-hierarchy observation registry
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cg_observation (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_entity_id   uuid NOT NULL REFERENCES public.cg_entity(id) ON DELETE RESTRICT,
  kind                text NOT NULL CHECK (kind IN ('observed','reported','inferred','predicted','simulated')),
  statement           jsonb NOT NULL DEFAULT '{}'::jsonb
                        CHECK (jsonb_typeof(statement) = 'object'),
  observer_identity   text,
  tenant_id           text,
  source_type         text,
  source_ref          text,
  confidence          numeric(4,3),
  evidence_entity_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  observed_at         timestamptz,
  recorded_at         timestamptz NOT NULL DEFAULT now(),
  superseded_by       uuid REFERENCES public.cg_observation(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

COMMENT ON TABLE public.cg_observation IS
  'Truth-hierarchy observation registry. Kinds are never collapsed: observed, '
  'reported, inferred, predicted and simulated states remain distinct so that '
  'intelligence never silently overwrites canonical truth.';

CREATE INDEX IF NOT EXISTS cg_observation_subject_idx ON public.cg_observation (subject_entity_id);
CREATE INDEX IF NOT EXISTS cg_observation_kind_idx    ON public.cg_observation (kind, tenant_id);
CREATE INDEX IF NOT EXISTS cg_observation_tenant_idx  ON public.cg_observation (tenant_id);

CREATE TRIGGER cg_observation_touch
  BEFORE UPDATE ON public.cg_observation
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- 4b. Domain-runtime registry
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cg_domain_runtime (
  id          text PRIMARY KEY CHECK (id ~ '^[a-z][a-z0-9]*:[a-z0-9-]+$'),
  name        text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  version     text NOT NULL CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  status      text NOT NULL DEFAULT 'proposed'
                CHECK (status IN ('proposed','review','approved','active','suspended','retired')),
  manifest    jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(manifest) = 'object'),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cg_domain_runtime IS
  'Registry of installed domain runtimes. Each row stores a validated manifest '
  'declaring the runtime ontology over the universal substrate, consumed '
  'capabilities, policies and interfaces. Installing a runtime is a data '
  'operation over this table; it never requires rewriting the kernel.';

CREATE TRIGGER cg_domain_runtime_touch
  BEFORE UPDATE ON public.cg_domain_runtime
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Security posture (control-plane substrate)
-- -----------------------------------------------------------------------------
ALTER TABLE public.cg_entity          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cg_relationship    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cg_event            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cg_observation      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cg_domain_runtime   ENABLE ROW LEVEL SECURITY;

-- Deny anon/authenticated by default; no RLS policies are created here.
-- Service role access is used by server functions. Consuming domain runtimes
-- author their own scoped policies when installed (never modify this file).
REVOKE ALL ON TABLE public.cg_entity, public.cg_relationship, public.cg_event, public.cg_observation, public.cg_domain_runtime
  FROM anon, authenticated;
GRANT ALL ON TABLE public.cg_entity, public.cg_relationship, public.cg_event, public.cg_observation, public.cg_domain_runtime
  TO service_role;


