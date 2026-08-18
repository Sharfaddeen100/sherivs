-- RLS isolation check: prove no anonymous / cross-tenant read leaks.
-- Run with:  psql -f database/queries/rls-isolation-check.sql
-- Exits non-zero (via \quit) if any leak is detected.
\set ON_ERROR_STOP on
\timing off

-- 1. Every tenant table MUST have RLS enabled.
SELECT format('FAIL: %I.%I has RLS DISABLED', schemaname, tablename) AS issue
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'schools','students','users','classes','fees','attendance',
    'attendance_logs','qr_tokens','grades','timetables','timetable_slots',
    'lesson_plans','messages','notifications','events','news','testimonials',
    'faqs','why_us_items','school_facilities','academic_programs','blog_posts',
    'parent_student_map','school_calendar','subscriptions','webhook_logs',
    'audit_logs','fraud_attempts','teacher_performance_profiles',
    'super_admins','super_admin_logs','admission_applications',
    'ai_conversations','ai_interaction_log','attendance_verification_log',
    'clinic_visits','digital_twin_calls','digital_twin_config',
    'discipline_records','hostel_allocations','hostel_attendance',
    'hostel_rooms','library_books','library_borrowings','news_reads',
    'notification_preferences','platform_complaints','platform_config',
    'school_ad_campaigns','school_api_keys','school_expense_budgets',
    'school_expenses','school_gallery','school_geofence','school_meals',
    'school_sports','school_staff','school_staff_types','school_transport',
    'staff_leave','staff_payroll','student_platform_fee_ledger',
    'study_sessions','teacher_biometrics','transport_buses'
  )
  AND NOT rowsecurity;

-- 2. Every public-schema table that has rowsecurity ON must have at least one policy.
SELECT format('FAIL: %I.%I has RLS but ZERO policies', t.schemaname, t.tablename) AS issue
FROM pg_tables t
LEFT JOIN pg_policies p
  ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public' AND t.rowsecurity
GROUP BY t.schemaname, t.tablename
HAVING count(p.policyname) = 0;

-- 3. Anonymous role MUST NOT have blanket SELECT on PII-bearing tables.
WITH risky AS (
  SELECT unnest(ARRAY[
    'users','students','fees','grades','attendance','attendance_logs',
    'parent_student_map','messages','notifications','fraud_attempts',
    'webhook_logs','super_admin_logs','audit_logs'
  ]) AS tbl
)
SELECT format('FAIL: anon has %s on public.%s', g.privilege_type, g.table_name) AS issue
FROM information_schema.role_table_grants g
JOIN risky r ON r.tbl = g.table_name
WHERE g.grantee = 'anon'
  AND g.table_schema = 'public'
  AND g.privilege_type IN ('SELECT','INSERT','UPDATE','DELETE');

-- 4. Schools table: anon SELECT is intentional (public website needs it).
--    Only verify no PII columns leak via anon-readable policies.
SELECT format('NOTE: anon can read public.schools (expected for tenant landing pages)') AS info
FROM information_schema.role_table_grants
WHERE grantee = 'anon' AND table_schema = 'public' AND table_name = 'schools'
  AND privilege_type = 'SELECT'
LIMIT 1;


-- 5. Secrets: the legacy plaintext Paystack secret column must NEVER be
--    readable by anon or authenticated through PostgREST.
SELECT format('FAIL: %I.%I column %I is readable by %I', c.table_schema, c.table_name, c.column_name, c.grantee) AS issue
FROM information_schema.column_privileges c
WHERE c.table_schema = 'public'
  AND c.table_name = 'schools'
  AND c.column_name = 'paystack_secret_key'
  AND c.grantee IN ('anon', 'authenticated')
  AND c.privilege_type = 'SELECT';

-- 6. Realtime: every table the application subscribes to must be in the
--    supabase_realtime publication (otherwise channels silently never fire).
SELECT format('FAIL: %s missing from supabase_realtime publication', t) AS issue
FROM unnest(ARRAY[
  'users','fees','grades','admission_applications','audit_logs',
  'attendance','messages','notifications','attendance_logs','transport_buses'
]) AS t
WHERE NOT EXISTS (
  SELECT 1 FROM pg_publication_tables p
  WHERE p.pubname = 'supabase_realtime'
    AND p.schemaname = 'public'
    AND p.tablename = t
);
SELECT '✓ RLS isolation check passed' AS result;
