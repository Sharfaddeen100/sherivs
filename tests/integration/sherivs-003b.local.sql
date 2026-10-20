-- =============================================================================
-- SHERIVS-003b — NDPA completion checks (LOCAL, DISPOSABLE ONLY)
-- =============================================================================
-- Covers migration 20261020000070: school_tenant_map + tenant-admin bridge,
-- student-media storage write denial, admission_applications.student_id.
--
--   PGOPTIONS="-c sv3.allow_non_loopback=on" \
--   psql "postgresql://supabase_admin:postgres@127.0.0.1:54322/postgres" \
--        -v ON_ERROR_STOP=1 -f tests/integration/sherivs-003b.local.sql
--
-- One transaction, always rolled back. NOTICE 'ALL PASS' only after every check.
-- Never point this at a hosted / linked Supabase project.
-- =============================================================================
BEGIN;

DO $guard$
BEGIN
  IF NOT (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'SV3b: must run as a superuser on a disposable DB';
  END IF;
  IF inet_server_addr() IS NOT NULL
     AND NOT (inet_server_addr() <<= '127.0.0.0/8'::inet OR inet_server_addr() = '::1'::inet)
     AND coalesce(current_setting('sv3.allow_non_loopback', true), 'off') <> 'on' THEN
    RAISE EXCEPTION 'SV3b: refusing non-loopback server address %', inet_server_addr();
  END IF;
  IF to_regclass('public.school_tenant_map') IS NULL THEN
    RAISE EXCEPTION 'SV3b: migration 20261020000070 not applied';
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
INSERT INTO auth.users (id) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001'), ('aaaaaaaa-0000-4000-8000-000000000002'),
  ('aaaaaaaa-0000-4000-8000-000000000004'), ('aaaaaaaa-0000-4000-8000-000000000006'),
  ('bbbbbbbb-0000-4000-8000-000000000001');

INSERT INTO public.schools (id, name, slug) VALUES
  ('53000000-0000-4000-8000-0000000000a1', 'SV3b School A', 'sv3b-school-a'),
  ('53000000-0000-4000-8000-0000000000b2', 'SV3b School B', 'sv3b-school-b'),
  ('53000000-0000-4000-8000-0000000000c3', 'SV3b School C (unmapped)', 'sv3b-school-c');

INSERT INTO public.users (id, school_id, full_name, email, role, is_active) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', '53000000-0000-4000-8000-0000000000a1', 'Admin A',     'adm-a@sv3b.invalid', 'admin',     true),
  ('aaaaaaaa-0000-4000-8000-000000000002', '53000000-0000-4000-8000-0000000000a1', 'Parent A',    'par-a@sv3b.invalid', 'parent',    true),
  ('aaaaaaaa-0000-4000-8000-000000000004', '53000000-0000-4000-8000-0000000000a1', 'Teacher A',   'tch-a@sv3b.invalid', 'teacher',   true),
  ('aaaaaaaa-0000-4000-8000-000000000006', '53000000-0000-4000-8000-0000000000a1', 'Principal A', 'prn-a@sv3b.invalid', 'principal', true),
  ('bbbbbbbb-0000-4000-8000-000000000001', '53000000-0000-4000-8000-0000000000b2', 'Admin B',     'adm-b@sv3b.invalid', 'admin',     true);

-- Tenants provisioned with id = school id; the trigger must fill the map.
INSERT INTO public.cg_tenant (id, tenant_type, name, slug) VALUES
  ('53000000-0000-4000-8000-0000000000a1', 'school', 'SV3b A', 'sv3b-a'),
  ('53000000-0000-4000-8000-0000000000b2', 'school', 'SV3b B', 'sv3b-b');

INSERT INTO storage.buckets (id, name) VALUES ('school-media', 'school-media') ON CONFLICT DO NOTHING;

SELECT sv3.cnt('map auto-filled for both mapped schools', $$SELECT 1 FROM public.school_tenant_map WHERE school_id IN ('53000000-0000-4000-8000-0000000000a1','53000000-0000-4000-8000-0000000000b2') AND school_id = tenant_id$$, 2);
SELECT sv3.cnt('unmapped school has no map row', $$SELECT 1 FROM public.school_tenant_map WHERE school_id = '53000000-0000-4000-8000-0000000000c3'$$, 0);

-- 1. tenant admin bridge ------------------------------------------------------
SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000001');
SELECT sv3.cnt('school A admin => is_tenant_admin(A)', $$SELECT 1 WHERE public.is_tenant_admin('53000000-0000-4000-8000-0000000000a1')$$, 1);
SELECT sv3.cnt('school A admin => NOT is_tenant_admin(B)', $$SELECT 1 WHERE public.is_tenant_admin('53000000-0000-4000-8000-0000000000b2')$$, 0);
SELECT sv3.cnt('school A admin => holds_tenant_role administrator on A', $$SELECT 1 WHERE public.holds_tenant_role('53000000-0000-4000-8000-0000000000a1','role:administrator')$$, 1);
SELECT sv3.cnt('bridge grants administrator only, not other roles', $$SELECT 1 WHERE public.holds_tenant_role('53000000-0000-4000-8000-0000000000a1','role:teacher')$$, 0);
SELECT sv3.cnt('garbage / null tenant ids are false, never an error', $$SELECT 1 WHERE public.is_tenant_admin('not-a-uuid') OR public.is_tenant_admin(NULL)$$, 0);
SELECT sv3.cnt('unmapped school tenant id is false', $$SELECT 1 WHERE public.is_tenant_admin('53000000-0000-4000-8000-0000000000c3')$$, 0);
SELECT sv3.cnt('admin sees only own school map row', $$SELECT 1 FROM public.school_tenant_map$$, 1);
SELECT sv3.denied('authenticated cannot insert map row', $$INSERT INTO public.school_tenant_map (school_id, tenant_id) VALUES ('53000000-0000-4000-8000-0000000000c3','53000000-0000-4000-8000-0000000000a1')$$);
SELECT sv3.denied('authenticated cannot update map row', $$UPDATE public.school_tenant_map SET tenant_id = tenant_id$$);
SELECT sv3.denied('authenticated cannot delete map row', $$DELETE FROM public.school_tenant_map$$);
SELECT sv3.logout();

SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000006');
SELECT sv3.cnt('principal A => is_tenant_admin(A)', $$SELECT 1 WHERE public.is_tenant_admin('53000000-0000-4000-8000-0000000000a1')$$, 1);
SELECT sv3.cnt('principal A => NOT is_tenant_admin(B)', $$SELECT 1 WHERE public.is_tenant_admin('53000000-0000-4000-8000-0000000000b2')$$, 0);
SELECT sv3.logout();

SELECT sv3.login('bbbbbbbb-0000-4000-8000-000000000001');
SELECT sv3.cnt('school B admin => is_tenant_admin(B)', $$SELECT 1 WHERE public.is_tenant_admin('53000000-0000-4000-8000-0000000000b2')$$, 1);
SELECT sv3.cnt('school B admin => NOT is_tenant_admin(A)', $$SELECT 1 WHERE public.is_tenant_admin('53000000-0000-4000-8000-0000000000a1')$$, 0);
SELECT sv3.logout();

SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000004');
SELECT sv3.cnt('teacher => not tenant admin', $$SELECT 1 WHERE public.is_tenant_admin('53000000-0000-4000-8000-0000000000a1')$$, 0);
SELECT sv3.denied('teacher cannot write map', $$INSERT INTO public.school_tenant_map (school_id, tenant_id) VALUES ('53000000-0000-4000-8000-0000000000c3','53000000-0000-4000-8000-0000000000a1')$$);
SELECT sv3.logout();

SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000002');
SELECT sv3.cnt('parent => not tenant admin', $$SELECT 1 WHERE public.is_tenant_admin('53000000-0000-4000-8000-0000000000a1')$$, 0);
SELECT sv3.logout();

-- A deactivated admin loses the bridge.
SELECT sv3.login_as('service_role');
UPDATE public.users SET is_active = false WHERE id = 'aaaaaaaa-0000-4000-8000-000000000001';
SELECT sv3.logout();
SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000001');
SELECT sv3.cnt('inactive admin => not tenant admin', $$SELECT 1 WHERE public.is_tenant_admin('53000000-0000-4000-8000-0000000000a1')$$, 0);
SELECT sv3.logout();
SELECT sv3.login_as('service_role');
UPDATE public.users SET is_active = true WHERE id = 'aaaaaaaa-0000-4000-8000-000000000001';
SELECT sv3.logout();

SELECT sv3.login_as('anon');
-- anon has no EXECUTE on the predicate at all (deny, never true).
SELECT sv3.denied('anon => cannot evaluate is_tenant_admin', $$SELECT public.is_tenant_admin('53000000-0000-4000-8000-0000000000a1')$$);
SELECT sv3.denied('anon cannot read map', $$SELECT * FROM public.school_tenant_map$$);
SELECT sv3.logout();

-- 2. student media storage writes --------------------------------------------
SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000004');
SELECT sv3.denied('direct insert into student media path denied',
  $$INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('school-media', '53000000-0000-4000-8000-0000000000a1/students/5a000000-0000-4000-8000-000000000001/x.png', auth.uid())$$);
SELECT sv3.denied('mixed-case student media path denied',
  $$INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('school-media', '53000000-0000-4000-8000-0000000000a1/Students/s/x.png', auth.uid())$$);
SELECT sv3.allowed('school website media still allowed',
  $$INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('school-media', '53000000-0000-4000-8000-0000000000a1/1700000000-abc123.jpg', auth.uid())$$);
SELECT sv3.allowed('staff media path still allowed',
  $$INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('school-media', '53000000-0000-4000-8000-0000000000a1/staff/u1/portrait.jpg', auth.uid())$$);
SELECT sv3.denied('other school website path still denied',
  $$INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('school-media', '53000000-0000-4000-8000-0000000000b2/x.jpg', auth.uid())$$);
SELECT sv3.logout();

-- A pre-existing student object cannot be modified by authenticated users (DELETE is also
-- blocked by storage.protect_delete outside the Storage API).
INSERT INTO storage.objects (bucket_id, name, owner) VALUES
  ('school-media', '53000000-0000-4000-8000-0000000000a1/students/5a000000-0000-4000-8000-000000000001/seed.png', NULL);
SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000001');
DO $m$
DECLARE n bigint;
BEGIN
  UPDATE storage.objects SET name = name WHERE bucket_id = 'school-media' AND name LIKE '%/students/%';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'SV3b FAIL: admin updated % student media object(s)', n; END IF;
END
$m$;
SELECT sv3.denied('admin cannot move website object into student path',
  $$UPDATE storage.objects SET name = '53000000-0000-4000-8000-0000000000a1/students/s/y.jpg' WHERE bucket_id='school-media' AND name LIKE '%/1700000000-abc123.jpg'$$);
SELECT sv3.logout();

-- 3. admissions link column ----------------------------------------------------
SELECT sv3.cnt('admission_applications.student_id exists and is nullable',
  $$SELECT 1 FROM information_schema.columns WHERE table_name='admission_applications' AND column_name='student_id' AND is_nullable='YES'$$, 1);

DO $done$ BEGIN RAISE NOTICE 'ALL PASS'; END $done$;

ROLLBACK;
