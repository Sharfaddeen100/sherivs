-- =============================================================================
-- SHERIVS-003 — NDPA foundations RLS / privilege checks (LOCAL, DISPOSABLE ONLY)
-- =============================================================================
-- Run as supabase_admin against a disposable loopback database that has
-- database/supabase/migrations applied (including 20261020000060):
--
--   psql "postgresql://supabase_admin@127.0.0.1:<port>/<disposable_db>" \
--        -v ON_ERROR_STOP=1 -f tests/integration/sherivs-003-ndpa.local.sql
--
-- One transaction, always rolled back. Every expectation raises an explicit
-- exception on failure; the only caught error class is the SQLSTATE the test
-- is asserting (insufficient_privilege / check_violation), never OTHERS.
-- NOTICE 'ALL PASS' is printed only after every check ran.
-- Never point this at a hosted / linked Supabase project.
-- =============================================================================
BEGIN;

DO $guard$
BEGIN
  IF NOT (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'SV3: must run as a superuser on a disposable DB';
  END IF;
  IF inet_server_addr() IS NOT NULL
     AND NOT (inet_server_addr() <<= '127.0.0.0/8'::inet OR inet_server_addr() = '::1'::inet)
     AND coalesce(current_setting('sv3.allow_non_loopback', true), 'off') <> 'on' THEN
    RAISE EXCEPTION 'SV3: refusing non-loopback server address %', inet_server_addr();
  END IF;
  IF to_regclass('public.consent_records') IS NULL
     OR to_regclass('public.data_subject_requests') IS NULL
     OR to_regclass('public.security_incidents') IS NULL
     OR to_regprocedure('public.retention_dry_run()') IS NULL THEN
    RAISE EXCEPTION 'SV3: migration 20261020000060 not applied';
  END IF;
END
$guard$;

CREATE SCHEMA sv3;
GRANT USAGE ON SCHEMA sv3 TO anon, authenticated, service_role;

CREATE FUNCTION sv3.login(_uid uuid) RETURNS void LANGUAGE plpgsql AS $f$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', _uid::text, true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  EXECUTE 'SET LOCAL ROLE authenticated';
END $f$;

CREATE FUNCTION sv3.login_as(_role text) RETURNS void LANGUAGE plpgsql AS $f$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claims', json_build_object('role', _role)::text, true);
  PERFORM set_config('request.jwt.claim.role', _role, true);
  EXECUTE format('SET LOCAL ROLE %I', _role);
END $f$;

CREATE FUNCTION sv3.logout() RETURNS void LANGUAGE plpgsql AS $f$
BEGIN EXECUTE 'RESET ROLE'; END $f$;

CREATE FUNCTION sv3.cnt(_label text, _sql text, _expected bigint) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE n bigint;
BEGIN
  EXECUTE 'SELECT count(*) FROM (' || _sql || ') q' INTO n;
  IF n IS DISTINCT FROM _expected THEN
    RAISE EXCEPTION 'SV3 FAIL [%]: expected % rows, got %', _label, _expected, n;
  END IF;
END $f$;

-- Statement must fail with insufficient_privilege (42501: grant or RLS check).
CREATE FUNCTION sv3.denied(_label text, _sql text) RETURNS void LANGUAGE plpgsql AS $f$
BEGIN
  BEGIN
    EXECUTE _sql;
  EXCEPTION
    WHEN insufficient_privilege THEN RETURN;
    -- Integrity guards from the SHERIVS-003 migration (school membership) also deny.
    -- Only our own guard messages count; any other check_violation fails the run.
    WHEN check_violation THEN
      IF SQLERRM ~ '^(consent_records|data_subject_requests): .*(does not belong to school|immutable)' THEN RETURN; END IF;
      RAISE;
  END;
  RAISE EXCEPTION 'SV3 FAIL [%]: statement was allowed but must be denied', _label;
END $f$;

CREATE FUNCTION sv3.allowed(_label text, _sql text) RETURNS void LANGUAGE plpgsql AS $f$
BEGIN
  EXECUTE _sql;  -- any error propagates and fails the run
END $f$;

CREATE FUNCTION sv3.check_violation(_label text, _sql text) RETURNS void LANGUAGE plpgsql AS $f$
BEGIN
  BEGIN
    EXECUTE _sql;
  EXCEPTION WHEN check_violation THEN
    RETURN;
  END;
  RAISE EXCEPTION 'SV3 FAIL [%]: statement must raise check_violation', _label;
END $f$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA sv3 TO anon, authenticated, service_role;

-- ------------------------------------------------------------------- seed ---
-- Schools A / B; per school: admin, teacher, parent(s), student (+ student user).
INSERT INTO auth.users (id) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001'), ('aaaaaaaa-0000-4000-8000-000000000002'),
  ('aaaaaaaa-0000-4000-8000-000000000003'), ('aaaaaaaa-0000-4000-8000-000000000004'),
  ('aaaaaaaa-0000-4000-8000-000000000005'),
  ('bbbbbbbb-0000-4000-8000-000000000001'), ('bbbbbbbb-0000-4000-8000-000000000002'),
  ('bbbbbbbb-0000-4000-8000-000000000004'), ('bbbbbbbb-0000-4000-8000-000000000005');

INSERT INTO public.schools (id, name, slug) VALUES
  ('53000000-0000-4000-8000-0000000000a1', 'SV3 School A', 'sv3-school-a'),
  ('53000000-0000-4000-8000-0000000000b2', 'SV3 School B', 'sv3-school-b');

INSERT INTO public.users (id, school_id, full_name, email, role, is_active) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', '53000000-0000-4000-8000-0000000000a1', 'Admin A',   'adm-a@sv3.invalid', 'admin',   true),
  ('aaaaaaaa-0000-4000-8000-000000000002', '53000000-0000-4000-8000-0000000000a1', 'Parent A1', 'par-a1@sv3.invalid','parent',  true),
  ('aaaaaaaa-0000-4000-8000-000000000003', '53000000-0000-4000-8000-0000000000a1', 'Parent A2', 'par-a2@sv3.invalid','parent',  true),
  ('aaaaaaaa-0000-4000-8000-000000000004', '53000000-0000-4000-8000-0000000000a1', 'Teacher A', 'tch-a@sv3.invalid', 'teacher', true),
  ('aaaaaaaa-0000-4000-8000-000000000005', '53000000-0000-4000-8000-0000000000a1', 'Student A1','stu-a1@sv3.invalid','student', true),
  ('bbbbbbbb-0000-4000-8000-000000000001', '53000000-0000-4000-8000-0000000000b2', 'Admin B',   'adm-b@sv3.invalid', 'admin',   true),
  ('bbbbbbbb-0000-4000-8000-000000000002', '53000000-0000-4000-8000-0000000000b2', 'Parent B',  'par-b@sv3.invalid', 'parent',  true),
  ('bbbbbbbb-0000-4000-8000-000000000004', '53000000-0000-4000-8000-0000000000b2', 'Teacher B', 'tch-b@sv3.invalid', 'teacher', true),
  ('bbbbbbbb-0000-4000-8000-000000000005', '53000000-0000-4000-8000-0000000000b2', 'Student B1','stu-b1@sv3.invalid','student', true);

INSERT INTO public.students (id, school_id, user_id, admission_number) VALUES
  ('5a000000-0000-4000-8000-000000000001', '53000000-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-000000000005', 'SV3-A1'),
  ('5a000000-0000-4000-8000-000000000002', '53000000-0000-4000-8000-0000000000a1', NULL, 'SV3-A2'),
  ('5b000000-0000-4000-8000-000000000001', '53000000-0000-4000-8000-0000000000b2', 'bbbbbbbb-0000-4000-8000-000000000005', 'SV3-B1');

INSERT INTO public.parent_student_map (school_id, parent_id, student_id) VALUES
  ('53000000-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-000000000002', '5a000000-0000-4000-8000-000000000001'),
  ('53000000-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-000000000003', '5a000000-0000-4000-8000-000000000002'),
  ('53000000-0000-4000-8000-0000000000b2', 'bbbbbbbb-0000-4000-8000-000000000002', '5b000000-0000-4000-8000-000000000001');

INSERT INTO public.consent_records (id, school_id, student_id, purpose, status, policy_version, granted_at, capture_method) VALUES
  ('c0000000-0000-4000-8000-0000000000a1', '53000000-0000-4000-8000-0000000000a1', '5a000000-0000-4000-8000-000000000001', 'photos_media', 'granted', 'v1', now(), 'web_form'),
  ('c0000000-0000-4000-8000-0000000000a2', '53000000-0000-4000-8000-0000000000a1', '5a000000-0000-4000-8000-000000000002', 'ai_processing', 'granted', 'v1', now(), 'web_form'),
  ('c0000000-0000-4000-8000-0000000000b1', '53000000-0000-4000-8000-0000000000b2', '5b000000-0000-4000-8000-000000000001', 'ai_processing', 'granted', 'v1', now(), 'web_form');
INSERT INTO public.consent_events (school_id, consent_id, student_id, purpose, action, policy_version, capture_method) VALUES
  ('53000000-0000-4000-8000-0000000000a1', 'c0000000-0000-4000-8000-0000000000a1', '5a000000-0000-4000-8000-000000000001', 'photos_media', 'grant', 'v1', 'web_form'),
  ('53000000-0000-4000-8000-0000000000a1', 'c0000000-0000-4000-8000-0000000000a2', '5a000000-0000-4000-8000-000000000002', 'ai_processing', 'grant', 'v1', 'web_form'),
  ('53000000-0000-4000-8000-0000000000b2', 'c0000000-0000-4000-8000-0000000000b1', '5b000000-0000-4000-8000-000000000001', 'ai_processing', 'grant', 'v1', 'web_form');

INSERT INTO public.data_subject_requests (id, school_id, subject_type, subject_student_id, requester_user_id, request_type) VALUES
  ('d0000000-0000-4000-8000-0000000000a1', '53000000-0000-4000-8000-0000000000a1', 'student', '5a000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', 'erasure'),
  ('d0000000-0000-4000-8000-0000000000b1', '53000000-0000-4000-8000-0000000000b2', 'student', '5b000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'access_export');
INSERT INTO public.data_subject_request_events (request_id, school_id, from_status, to_status, actor_id) VALUES
  ('d0000000-0000-4000-8000-0000000000a1', '53000000-0000-4000-8000-0000000000a1', NULL, 'received', 'aaaaaaaa-0000-4000-8000-000000000002'),
  ('d0000000-0000-4000-8000-0000000000b1', '53000000-0000-4000-8000-0000000000b2', NULL, 'received', 'bbbbbbbb-0000-4000-8000-000000000002');

INSERT INTO public.security_incidents (id, school_id, severity, category, description) VALUES
  ('e0000000-0000-4000-8000-0000000000a1', '53000000-0000-4000-8000-0000000000a1', 'high', 'unauthorised_access', 'sv3 school A incident'),
  ('e0000000-0000-4000-8000-0000000000b1', '53000000-0000-4000-8000-0000000000b2', 'low', 'misdirected_email', 'sv3 school B incident'),
  ('e0000000-0000-4000-8000-0000000000f1', NULL, 'critical', 'platform', 'sv3 platform-wide incident');

-- Old rows for the retention dry run (created_at far past every window).
INSERT INTO public.messages (school_id, sender_id, recipient_id, body, created_at) VALUES
  ('53000000-0000-4000-8000-0000000000a1', 'aaaaaaaa-0000-4000-8000-000000000004', 'aaaaaaaa-0000-4000-8000-000000000002', 'old msg', now() - interval '900 days');
INSERT INTO public.fees (school_id, student_id, fee_type, amount, created_at) VALUES
  ('53000000-0000-4000-8000-0000000000a1', '5a000000-0000-4000-8000-000000000001', 'tuition', 100, now() - interval '3000 days');

-- ------------------------------------------------- DB-level defaults/guards ---
DO $chk$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public.security_incidents WHERE id = 'e0000000-0000-4000-8000-0000000000a1';
  IF r.ndpc_notification_due_at <> r.detected_at + interval '72 hours' THEN
    RAISE EXCEPTION 'SV3 FAIL: ndpc_notification_due_at must be detected_at + 72h';
  END IF;
END
$chk$;
SELECT sv3.cnt('dsr due_at = received_at + 30d',
  $$SELECT 1 FROM public.data_subject_requests WHERE due_at - received_at BETWEEN interval '29 days 23 hours' AND interval '30 days 1 hour'$$, 2);

SELECT sv3.check_violation('consent for student of another school',
  $$INSERT INTO public.consent_records (school_id, student_id, purpose, status, policy_version, capture_method)
    VALUES ('53000000-0000-4000-8000-0000000000b2', '5a000000-0000-4000-8000-000000000001', 'photos_media', 'granted', 'v1', 'web_form')$$);
SELECT sv3.check_violation('consent guardian of another school',
  $$INSERT INTO public.consent_records (school_id, student_id, guardian_user_id, purpose, status, policy_version, capture_method)
    VALUES ('53000000-0000-4000-8000-0000000000a1', '5a000000-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'photos_media', 'granted', 'v1', 'web_form')$$);
SELECT sv3.check_violation('consent purpose outside the allowed set',
  $$INSERT INTO public.consent_records (school_id, student_id, purpose, status, policy_version, capture_method)
    VALUES ('53000000-0000-4000-8000-0000000000a1', '5a000000-0000-4000-8000-000000000002', 'marketing', 'granted', 'v1', 'web_form')$$);
SELECT sv3.check_violation('dsr requester of another school',
  $$INSERT INTO public.data_subject_requests (school_id, subject_type, subject_user_id, requester_user_id, request_type)
    VALUES ('53000000-0000-4000-8000-0000000000a1', 'user', 'aaaaaaaa-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'erasure')$$);
SELECT sv3.denied('consent_events is append-only (UPDATE)',
  $$UPDATE public.consent_events SET action = 'withdraw'$$);
SELECT sv3.denied('consent_events is append-only (DELETE)',
  $$DELETE FROM public.consent_events$$);
SELECT sv3.denied('dsr events are append-only',
  $$DELETE FROM public.data_subject_request_events$$);

-- ------------------------------------------------------- consent_records ----
SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000001');  -- admin A
SELECT sv3.cnt('adminA sees school A consent only', 'SELECT 1 FROM public.consent_records', 2);
SELECT sv3.cnt('adminA sees no school B consent', $$SELECT 1 FROM public.consent_records WHERE school_id = '53000000-0000-4000-8000-0000000000b2'$$, 0);
SELECT sv3.cnt('adminA sees school A consent events only', 'SELECT 1 FROM public.consent_events', 2);
SELECT sv3.denied('adminA cannot INSERT consent directly',
  $$INSERT INTO public.consent_records (school_id, student_id, purpose, status, policy_version, capture_method)
    VALUES ('53000000-0000-4000-8000-0000000000a1', '5a000000-0000-4000-8000-000000000002', 'photos_media', 'granted', 'v1', 'admin_entered')$$);
SELECT sv3.denied('adminA cannot UPDATE consent directly', $$UPDATE public.consent_records SET status = 'withdrawn'$$);
SELECT sv3.denied('adminA cannot DELETE consent directly', $$DELETE FROM public.consent_records$$);
SELECT sv3.denied('adminA cannot INSERT consent_events', $$INSERT INTO public.consent_events (school_id, consent_id, student_id, purpose, action, policy_version, capture_method)
  VALUES ('53000000-0000-4000-8000-0000000000a1', 'c0000000-0000-4000-8000-0000000000a1', '5a000000-0000-4000-8000-000000000001', 'photos_media', 'withdraw', 'v1', 'web_form')$$);

SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000002');  -- parent A1 (guardian of A1)
SELECT sv3.cnt('parentA1 sees only own child consent', 'SELECT 1 FROM public.consent_records', 1);
SELECT sv3.cnt('parentA1 sees own child consent row', $$SELECT 1 FROM public.consent_records WHERE student_id = '5a000000-0000-4000-8000-000000000001'$$, 1);
SELECT sv3.cnt('parentA1 sees only own child consent events', 'SELECT 1 FROM public.consent_events', 1);
SELECT sv3.denied('parent cannot INSERT consent directly',
  $$INSERT INTO public.consent_records (school_id, student_id, purpose, status, policy_version, capture_method)
    VALUES ('53000000-0000-4000-8000-0000000000a1', '5a000000-0000-4000-8000-000000000001', 'ai_processing', 'granted', 'v1', 'web_form')$$);
SELECT sv3.denied('parent cannot UPDATE consent directly', $$UPDATE public.consent_records SET status = 'granted'$$);
SELECT sv3.denied('parent cannot DELETE consent directly', $$DELETE FROM public.consent_records$$);

SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000003');  -- parent A2
SELECT sv3.cnt('parentA2 sees only own child consent', 'SELECT 1 FROM public.consent_records', 1);
SELECT sv3.cnt('parentA2 does not see child A1 consent', $$SELECT 1 FROM public.consent_records WHERE student_id = '5a000000-0000-4000-8000-000000000001'$$, 0);

SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000004');  -- teacher A
SELECT sv3.cnt('teacherA sees no consent', 'SELECT 1 FROM public.consent_records', 0);
SELECT sv3.cnt('teacherA sees no dsr', 'SELECT 1 FROM public.data_subject_requests', 0);
SELECT sv3.cnt('teacherA sees no incidents', 'SELECT 1 FROM public.security_incidents', 0);
SELECT sv3.cnt('teacherA sees no dsr events', 'SELECT 1 FROM public.data_subject_request_events', 0);

SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000005');  -- student A1 (own data subject)
SELECT sv3.cnt('student sees no consent', 'SELECT 1 FROM public.consent_records', 0);
SELECT sv3.cnt('student sees no dsr', 'SELECT 1 FROM public.data_subject_requests', 0);

SELECT sv3.login('bbbbbbbb-0000-4000-8000-000000000001');  -- admin B
SELECT sv3.cnt('adminB sees only school B consent', 'SELECT 1 FROM public.consent_records', 1);
SELECT sv3.cnt('adminB cannot see school A consent', $$SELECT 1 FROM public.consent_records WHERE school_id = '53000000-0000-4000-8000-0000000000a1'$$, 0);
SELECT sv3.cnt('adminB cannot see school A dsr', $$SELECT 1 FROM public.data_subject_requests WHERE school_id = '53000000-0000-4000-8000-0000000000a1'$$, 0);
SELECT sv3.cnt('adminB cannot see school A incidents', $$SELECT 1 FROM public.security_incidents WHERE school_id = '53000000-0000-4000-8000-0000000000a1'$$, 0);

SELECT sv3.login('bbbbbbbb-0000-4000-8000-000000000002');  -- parent B
SELECT sv3.cnt('parentB sees no school A consent', $$SELECT 1 FROM public.consent_records WHERE school_id = '53000000-0000-4000-8000-0000000000a1'$$, 0);

SELECT sv3.login_as('anon');
SELECT sv3.denied('anon cannot read consent', 'SELECT 1 FROM public.consent_records');
SELECT sv3.denied('anon cannot read dsr', 'SELECT 1 FROM public.data_subject_requests');
SELECT sv3.denied('anon cannot read incidents', 'SELECT 1 FROM public.security_incidents');
SELECT sv3.logout();

-- --------------------------------------------------- data_subject_requests ---
SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000002');  -- parent A1
SELECT sv3.cnt('parentA1 sees only own request', 'SELECT 1 FROM public.data_subject_requests', 1);
SELECT sv3.cnt('parentA1 sees own request events', 'SELECT 1 FROM public.data_subject_request_events', 1);
SELECT sv3.allowed('parentA1 may file export request for own child',
  $$INSERT INTO public.data_subject_requests (school_id, subject_type, subject_student_id, requester_user_id, request_type)
    VALUES ('53000000-0000-4000-8000-0000000000a1', 'student', '5a000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', 'access_export')$$);
SELECT sv3.allowed('parentA1 may file request about self',
  $$INSERT INTO public.data_subject_requests (school_id, subject_type, subject_user_id, requester_user_id, request_type)
    VALUES ('53000000-0000-4000-8000-0000000000a1', 'user', 'aaaaaaaa-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000002', 'access_export')$$);
SELECT sv3.denied('parentA1 cannot file for unlinked student A2',
  $$INSERT INTO public.data_subject_requests (school_id, subject_type, subject_student_id, requester_user_id, request_type)
    VALUES ('53000000-0000-4000-8000-0000000000a1', 'student', '5a000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000002', 'erasure')$$);
SELECT sv3.denied('parentA1 cannot file into school B',
  $$INSERT INTO public.data_subject_requests (school_id, subject_type, subject_student_id, requester_user_id, request_type)
    VALUES ('53000000-0000-4000-8000-0000000000b2', 'student', '5b000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', 'erasure')$$);
SELECT sv3.denied('parentA1 cannot file about another user',
  $$INSERT INTO public.data_subject_requests (school_id, subject_type, subject_user_id, requester_user_id, request_type)
    VALUES ('53000000-0000-4000-8000-0000000000a1', 'user', 'aaaaaaaa-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000002', 'erasure')$$);
SELECT sv3.denied('parentA1 cannot file as another requester',
  $$INSERT INTO public.data_subject_requests (school_id, subject_type, subject_student_id, requester_user_id, request_type)
    VALUES ('53000000-0000-4000-8000-0000000000a1', 'student', '5a000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000003', 'erasure')$$);
SELECT sv3.denied('parentA1 cannot pre-verify a request (status column not granted)',
  $$INSERT INTO public.data_subject_requests (school_id, subject_type, subject_student_id, requester_user_id, request_type, status)
    VALUES ('53000000-0000-4000-8000-0000000000a1', 'student', '5a000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', 'erasure', 'verified')$$);
SELECT sv3.denied('parentA1 cannot set a custom due_at',
  $$INSERT INTO public.data_subject_requests (school_id, subject_type, subject_student_id, requester_user_id, request_type, due_at)
    VALUES ('53000000-0000-4000-8000-0000000000a1', 'student', '5a000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', 'erasure', now() + interval '3650 days')$$);
SELECT sv3.denied('parent cannot UPDATE dsr', $$UPDATE public.data_subject_requests SET status = 'completed'$$);
SELECT sv3.denied('parent cannot DELETE dsr', $$DELETE FROM public.data_subject_requests$$);
SELECT sv3.denied('parent cannot INSERT dsr events',
  $$INSERT INTO public.data_subject_request_events (request_id, school_id, to_status) VALUES ('d0000000-0000-4000-8000-0000000000a1', '53000000-0000-4000-8000-0000000000a1', 'completed')$$);
SELECT sv3.cnt('parentA1 now sees 3 own requests', 'SELECT 1 FROM public.data_subject_requests', 3);

SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000003');  -- parent A2
SELECT sv3.cnt('parentA2 sees no one else''s requests', 'SELECT 1 FROM public.data_subject_requests', 0);
SELECT sv3.cnt('parentA2 sees no one else''s request events', 'SELECT 1 FROM public.data_subject_request_events', 0);

SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000001');  -- admin A
SELECT sv3.cnt('adminA sees all school A requests', 'SELECT 1 FROM public.data_subject_requests', 3);
SELECT sv3.cnt('adminA sees no school B request', $$SELECT 1 FROM public.data_subject_requests WHERE school_id = '53000000-0000-4000-8000-0000000000b2'$$, 0);
SELECT sv3.denied('adminA cannot UPDATE dsr directly', $$UPDATE public.data_subject_requests SET status = 'verified'$$);
SELECT sv3.denied('adminA cannot DELETE dsr', $$DELETE FROM public.data_subject_requests$$);
SELECT sv3.cnt('adminA sees school A dsr events', 'SELECT 1 FROM public.data_subject_request_events', 1);

SELECT sv3.login('bbbbbbbb-0000-4000-8000-000000000001');  -- admin B
SELECT sv3.cnt('adminB sees only school B request', 'SELECT 1 FROM public.data_subject_requests', 1);

-- ------------------------------------------------------ security_incidents ---
SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000001');  -- admin A
SELECT sv3.cnt('adminA sees own school incident only (no platform, no B)', 'SELECT 1 FROM public.security_incidents', 1);
SELECT sv3.denied('adminA cannot INSERT incident directly',
  $$INSERT INTO public.security_incidents (school_id, severity, category, description) VALUES ('53000000-0000-4000-8000-0000000000a1', 'low', 'x', 'y')$$);
SELECT sv3.denied('adminA cannot UPDATE incident directly', $$UPDATE public.security_incidents SET status = 'closed'$$);
SELECT sv3.denied('adminA cannot DELETE incident', $$DELETE FROM public.security_incidents$$);
SELECT sv3.login('bbbbbbbb-0000-4000-8000-000000000001');  -- admin B
SELECT sv3.cnt('adminB sees own school incident only', 'SELECT 1 FROM public.security_incidents', 1);
SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000002');  -- parent
SELECT sv3.cnt('parent sees no incidents', 'SELECT 1 FROM public.security_incidents', 0);
SELECT sv3.logout();

-- ----------------------------------------------------------- retention -----
SELECT set_config('sv3.msgs', (SELECT count(*) FROM public.messages)::text, true);
SELECT set_config('sv3.fees', (SELECT count(*) FROM public.fees)::text, true);
SELECT set_config('sv3.audit', (SELECT count(*) FROM public.audit_logs)::text, true);

SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000001');  -- school admin is NOT enough
SELECT sv3.denied('authenticated school admin cannot run retention_dry_run', 'SELECT * FROM public.retention_dry_run()');
SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000002');
SELECT sv3.denied('authenticated parent cannot run retention_dry_run', 'SELECT * FROM public.retention_dry_run()');
SELECT sv3.login_as('anon');
SELECT sv3.denied('anon cannot run retention_dry_run', 'SELECT * FROM public.retention_dry_run()');

SELECT sv3.login_as('service_role');
SELECT sv3.cnt('service_role gets one row per mapped table', 'SELECT * FROM public.retention_dry_run()', 6);
SELECT sv3.cnt('dry run flags the aged message',
  $$SELECT 1 FROM public.retention_dry_run() WHERE table_name = 'messages' AND record_count >= 1 AND oldest IS NOT NULL$$, 1);
SELECT sv3.cnt('dry run flags the aged fee',
  $$SELECT 1 FROM public.retention_dry_run() WHERE table_name = 'fees' AND record_count >= 1$$, 1);
SELECT sv3.cnt('dry run reports zero (not omitted) for attendance with no aged rows',
  $$SELECT 1 FROM public.retention_dry_run() WHERE table_name = 'attendance' AND record_count = 0$$, 1);
SELECT sv3.logout();

DO $nodel$
BEGIN
  IF (SELECT count(*) FROM public.messages)::text <> current_setting('sv3.msgs')
     OR (SELECT count(*) FROM public.fees)::text <> current_setting('sv3.fees')
     OR (SELECT count(*) FROM public.audit_logs)::text <> current_setting('sv3.audit') THEN
    RAISE EXCEPTION 'SV3 FAIL: retention_dry_run changed row counts';
  END IF;
END
$nodel$;

DO $done$ BEGIN RAISE NOTICE 'ALL PASS'; END $done$;

ROLLBACK;
