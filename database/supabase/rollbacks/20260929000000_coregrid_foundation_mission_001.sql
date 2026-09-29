-- Rollback for 20260929000000_coregrid_foundation_mission_001.sql
-- Not a forward migration. Run only after confirming no retained foundation
-- records are still required as evidence.
-- History is dropped with the execution records. This destroys persisted
-- history; do not run it to "undo" a single execution.

DROP TRIGGER IF EXISTS cg_execution_history_append_only ON public.cg_execution_history;
DROP FUNCTION IF EXISTS public.cg_foundation_reject_history_mutation();

DROP TABLE IF EXISTS public.cg_conformance_assessment;
DROP TABLE IF EXISTS public.cg_verification_result;
DROP TABLE IF EXISTS public.cg_foundation_evidence;
DROP TABLE IF EXISTS public.cg_execution_history;
DROP TABLE IF EXISTS public.cg_execution_record;
DROP TABLE IF EXISTS public.cg_mission_intent;
