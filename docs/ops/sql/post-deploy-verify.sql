-- =============================================================================
-- SHERIVS rollout POST-DEPLOY VERIFICATION (READ-ONLY). Run in the SQL Editor after
-- each phase. Set the phase on the first line (1 = after Phase 1 DB push, 3 = after
-- Phase 3). Every row must show ok = true. Any false = STOP and consult the rollback
-- section of docs/ops/ROLLOUT-SHERIVS-001-005.md.
-- =============================================================================
WITH params AS (SELECT 1 AS phase),  -- <<< change to 3 after Phase 3
checks(name, ok) AS (
  VALUES
  ('9 phase-1 release migrations recorded',
     (SELECT count(*) = 9 FROM supabase_migrations.schema_migrations WHERE version IN
       ('20261020000020','20261020000030','20261020000040','20261020000050',
        '20261020000060','20261020000070','20261020000090','20261020000100','20261020000110'))),
  ('phase-3 migration 0120 recorded iff phase = 3',
     EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20261020000120')
       = ((SELECT phase FROM params) = 3)),
  ('identity freeze NOT applied (separate decision)',
     NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20261015000010')),
  ('paystack_secret_key hidden from anon (phase 3)',
     (SELECT phase FROM params) < 3 OR NOT coalesce(has_column_privilege('anon','public.schools','paystack_secret_key','SELECT'), false)),
  ('paystack_secret_key hidden from authenticated (phase 3)',
     (SELECT phase FROM params) < 3 OR NOT coalesce(has_column_privilege('authenticated','public.schools','paystack_secret_key','SELECT'), false)),
  ('cg_idempotency_record RLS on',
     (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.cg_idempotency_record'::regclass)),
  ('NDPA tables exist',
     to_regclass('public.consent_records') IS NOT NULL AND to_regclass('public.data_subject_requests') IS NOT NULL
     AND to_regclass('public.security_incidents') IS NOT NULL),
  ('school_tenant_map backfilled (>= 1 row per school that has a cg_tenant)',
     (SELECT count(*) FROM public.school_tenant_map) =
     (SELECT count(*) FROM public.cg_tenant t JOIN public.schools s ON s.id = t.id)),
  ('old school-wide fees/students policies gone',
     NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND policyname IN ('tenant_all_fees','tenant_all_students','platform_fee_ledger_school_access'))),
  ('new fees/students policies present',
     (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND policyname IN ('fees_read','fees_write','students_read','students_write')) = 4),
  ('restrictive write policies on 37 tables',
     (SELECT count(DISTINCT tablename) FROM pg_policies WHERE schemaname='public' AND policyname='sv4_insert_role' AND permissive='RESTRICTIVE') = 37),
  ('no TRUNCATE for anon/authenticated',
     NOT EXISTS (SELECT 1 FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee IN ('anon','authenticated') AND privilege_type='TRUNCATE')),
  ('anon can still submit admissions',
     has_table_privilege('anon','public.admission_applications','INSERT')),
  ('anon cannot write fees/students/users',
     NOT (has_table_privilege('anon','public.fees','UPDATE') OR has_table_privilege('anon','public.students','UPDATE') OR has_table_privilege('anon','public.users','UPDATE'))),
  ('website RPCs still public',
     (SELECT bool_and(has_function_privilege('anon', p.oid, 'EXECUTE')) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.proname IN ('public_school_stats','public_teachers'))),
  ('no USING(true) policies in public',
     NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND (qual='true' OR with_check='true'))),
  ('every public table has RLS',
     NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity))
)
SELECT name, coalesce(ok, false) AS ok FROM checks ORDER BY ok, name;
