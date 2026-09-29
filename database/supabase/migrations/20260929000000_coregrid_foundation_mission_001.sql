-- =============================================================================
-- CoreGrid Foundation Mission 001 — durable control-plane records
-- =============================================================================
-- Status: AUTHORED, NOT APPLIED. Do not treat this file as a live database.
-- Apply only with an approved environment:
--   supabase db push --workdir database/supabase
-- Rollback (not applied by this migration):
--   database/supabase/rollbacks/20260929000000_coregrid_foundation_mission_001.sql
--
-- Owners:
--   mission intent / lifecycle  — mechanism 06
--   evidence identity           — mechanism 04
--   execution record / rollback — mechanism 08
--   verification                — mechanism 09
--   conformance                 — mechanism 10
--
-- Domain-neutral. No anon or authenticated privileges. RLS is enabled with
-- zero policies, so those roles are denied. Service-role server functions are
-- the only intended writer, and they are not created here.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cg_mission_intent (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id          text NOT NULL CHECK (length(mission_id) BETWEEN 1 AND 160),
  version             text NOT NULL CHECK (length(version) BETWEEN 1 AND 32),
  tenant_id           text NOT NULL CHECK (length(tenant_id) BETWEEN 1 AND 128),
  purpose             text NOT NULL CHECK (length(purpose) BETWEEN 1 AND 200),
  authority_ref       text NOT NULL CHECK (length(authority_ref) BETWEEN 1 AND 200),
  context_ref         text NOT NULL CHECK (length(context_ref) BETWEEN 1 AND 200),
  owner_ref           text NOT NULL CHECK (length(owner_ref) BETWEEN 1 AND 200),
  non_scope           text[] NOT NULL DEFAULT '{}'::text[],
  authorized_actions  text[] NOT NULL DEFAULT '{}'::text[],
  lifecycle           text NOT NULL CHECK (lifecycle IN ('proposed','authorized','revoked','closed')),
  expires_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mission_id, version)
);

COMMENT ON TABLE public.cg_mission_intent IS
  'Foundation mission intent. Mechanism 06 coordinates lifecycle. '
  'Persistence does not grant execution authority.';

CREATE INDEX IF NOT EXISTS cg_mission_intent_tenant_idx
  ON public.cg_mission_intent (tenant_id, lifecycle);

DROP TRIGGER IF EXISTS cg_mission_intent_touch ON public.cg_mission_intent;
CREATE TRIGGER cg_mission_intent_touch
  BEFORE UPDATE ON public.cg_mission_intent
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.cg_execution_record (
  id                text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 160),
  idempotency_key   text NOT NULL CHECK (length(idempotency_key) BETWEEN 1 AND 200),
  mission_id        text NOT NULL,
  mission_version   text NOT NULL,
  tenant_id         text NOT NULL,
  actor_id          text NOT NULL CHECK (length(actor_id) BETWEEN 1 AND 160),
  action            text NOT NULL CHECK (length(action) BETWEEN 1 AND 160),
  reality_ref       text NOT NULL CHECK (length(reality_ref) BETWEEN 1 AND 200),
  requested_at      timestamptz NOT NULL,
  attempt_id        text NOT NULL CHECK (length(attempt_id) BETWEEN 1 AND 180),
  started_at        timestamptz NOT NULL,
  status            text NOT NULL CHECK (status IN ('admitted','denied','rolled_back')),
  reason            text,
  external_effect   text NOT NULL CHECK (external_effect IN ('none','recorded_intent','compensation_required')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, mission_id, idempotency_key, action),
  FOREIGN KEY (tenant_id, mission_id, mission_version)
    REFERENCES public.cg_mission_intent (tenant_id, mission_id, version),
  CHECK (status <> 'admitted' OR external_effect = 'recorded_intent'),
  CHECK (status <> 'denied' OR external_effect = 'none'),
  CHECK (status <> 'rolled_back' OR external_effect = 'compensation_required')
);

COMMENT ON TABLE public.cg_execution_record IS
  'Current execution projection. Request, attempt, result and external effect '
  'stay distinct. Rollback changes this projection and appends history.';

CREATE INDEX IF NOT EXISTS cg_execution_record_tenant_idx
  ON public.cg_execution_record (tenant_id, mission_id);

DROP TRIGGER IF EXISTS cg_execution_record_touch ON public.cg_execution_record;
CREATE TRIGGER cg_execution_record_touch
  BEFORE UPDATE ON public.cg_execution_record
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.cg_execution_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id     text NOT NULL REFERENCES public.cg_execution_record(id) ON DELETE RESTRICT,
  recorded_at      timestamptz NOT NULL DEFAULT now(),
  status           text NOT NULL CHECK (status IN ('admitted','denied','rolled_back')),
  reason           text,
  external_effect  text NOT NULL CHECK (external_effect IN ('none','recorded_intent','compensation_required'))
);

COMMENT ON TABLE public.cg_execution_history IS
  'Append-only execution history. Updates and deletes are rejected.';

CREATE INDEX IF NOT EXISTS cg_execution_history_execution_idx
  ON public.cg_execution_history (execution_id, recorded_at);

CREATE OR REPLACE FUNCTION public.cg_foundation_reject_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'cg_execution_history is append-only';
END;
$$;

DROP TRIGGER IF EXISTS cg_execution_history_append_only ON public.cg_execution_history;
CREATE TRIGGER cg_execution_history_append_only
  BEFORE UPDATE OR DELETE ON public.cg_execution_history
  FOR EACH ROW EXECUTE FUNCTION public.cg_foundation_reject_history_mutation();

CREATE TABLE IF NOT EXISTS public.cg_foundation_evidence (
  evidence_id   text PRIMARY KEY CHECK (length(evidence_id) BETWEEN 1 AND 160),
  producer      text NOT NULL CHECK (length(producer) BETWEEN 1 AND 160),
  actor_id      text NOT NULL CHECK (length(actor_id) BETWEEN 1 AND 160),
  tenant_id     text NOT NULL CHECK (length(tenant_id) BETWEEN 1 AND 128),
  observed_at   timestamptz NOT NULL,
  recorded_at   timestamptz NOT NULL,
  provenance    text NOT NULL CHECK (length(provenance) BETWEEN 1 AND 500),
  integrity     text NOT NULL CHECK (length(integrity) BETWEEN 1 AND 128),
  lifecycle     text NOT NULL CHECK (lifecycle IN ('active','superseded','revoked')),
  lineage       text[] NOT NULL DEFAULT '{}'::text[],
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cg_foundation_evidence IS
  'Evidence identity and lifecycle. Evidence does not decide verification.';

CREATE INDEX IF NOT EXISTS cg_foundation_evidence_tenant_idx
  ON public.cg_foundation_evidence (tenant_id, lifecycle);

CREATE TABLE IF NOT EXISTS public.cg_verification_result (
  verification_id  text PRIMARY KEY CHECK (length(verification_id) BETWEEN 1 AND 180),
  execution_id     text NOT NULL REFERENCES public.cg_execution_record(id) ON DELETE RESTRICT,
  evidence_ids     text[] NOT NULL DEFAULT '{}'::text[],
  decision         text NOT NULL CHECK (decision IN ('verified','failed','inconclusive')),
  reason           text NOT NULL CHECK (length(reason) BETWEEN 1 AND 200),
  created_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (decision <> 'verified' OR cardinality(evidence_ids) > 0)
);

COMMENT ON TABLE public.cg_verification_result IS
  'Independent verification. Execution success is not a sufficient input.';

CREATE TABLE IF NOT EXISTS public.cg_conformance_assessment (
  assessment_id          text PRIMARY KEY CHECK (length(assessment_id) BETWEEN 1 AND 180),
  verification_id        text NOT NULL REFERENCES public.cg_verification_result(verification_id) ON DELETE RESTRICT,
  declared_contract_id   text NOT NULL,
  observed_contract_id   text NOT NULL,
  declared_version       text NOT NULL,
  observed_version       text NOT NULL,
  decision               text NOT NULL CHECK (decision IN ('conformant','nonconformant','not_assessed')),
  reason                 text NOT NULL CHECK (length(reason) BETWEEN 1 AND 200),
  created_at             timestamptz NOT NULL DEFAULT now(),
  CHECK (
    decision <> 'conformant'
    OR (declared_contract_id = observed_contract_id AND declared_version = observed_version)
  )
);

COMMENT ON TABLE public.cg_conformance_assessment IS
  'Independent conformance. A verified result can still be nonconformant.';

ALTER TABLE public.cg_mission_intent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cg_execution_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cg_execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cg_foundation_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cg_verification_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cg_conformance_assessment ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.cg_mission_intent,
  public.cg_execution_record,
  public.cg_execution_history,
  public.cg_foundation_evidence,
  public.cg_verification_result,
  public.cg_conformance_assessment
FROM anon, authenticated;
