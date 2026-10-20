-- Rollback SHERIVS-002 0020. WARNING: disables RLS on cg_idempotency_record again. Emergency use only.
-- ROLLOUT NOTE: production already had RLS enabled on this table out of band
-- (captured in 20261003000042). Rolling back SHERIVS must NOT switch it off, so
-- this rollback is intentionally a no-op. Original statement, for reference:
--   ALTER TABLE public.cg_idempotency_record DISABLE ROW LEVEL SECURITY;
SELECT 1;
