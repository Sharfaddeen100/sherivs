-- Rollback SHERIVS-002 0120 (formerly 0010): restores table-level SELECT on public.schools.
-- WARNING: this re-exposes schools.paystack_secret_key to anon/authenticated. Emergency use only.
BEGIN;
GRANT SELECT ON public.schools TO anon, authenticated;
COMMIT;
