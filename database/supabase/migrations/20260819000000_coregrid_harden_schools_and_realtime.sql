-- CoreGrid Scholar - Supabase hardening (forward migration).
-- 1) Never expose the legacy plaintext Paystack secret through RLS reads.
-- 2) Complete the realtime publication for tables the application subscribes to.
-- Applied migrations are immutable; this is a new forward migration.

-- ---------------------------------------------------------------------------
-- 1. Column-level revoke on public.schools
-- The schools table carries a legacy plaintext paystack_secret_key column.
-- PostgREST expands select=* to the columns the requesting role can read, so
-- revoking column-level SELECT removes it from every client response (anon
-- and authenticated) without touching the RLS policies that keep the public
-- site and portals working.
REVOKE SELECT (paystack_secret_key) ON public.schools FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Realtime publication completeness
-- The app subscribes to postgres_changes on these tables; Supabase Realtime
-- only delivers changes for tables in the supabase_realtime publication.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users',
    'fees',
    'grades',
    'admission_applications',
    'audit_logs'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

