-- Rollback SHERIVS-002 0020. WARNING: disables RLS on cg_idempotency_record again. Emergency use only.
ALTER TABLE public.cg_idempotency_record DISABLE ROW LEVEL SECURITY;
