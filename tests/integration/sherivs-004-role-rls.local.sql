-- =============================================================================
-- SHERIVS-004 — in-school role RLS + privilege hardening checks (LOCAL, DISPOSABLE ONLY)
-- Covers migrations 20261020000090 / 0100 / 0110.
--   PGOPTIONS="-c sv3.allow_non_loopback=on" \
--   psql "postgresql://supabase_admin:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f tests/integration/sherivs-004-role-rls.local.sql
-- One transaction, always rolled back. NOTICE 'ALL PASS' only after every check.
-- Note: RLS silently filters UPDATE/DELETE (0 rows) -> sv4.affected checks row counts;
-- RLS-rejected INSERTs raise 42501 -> sv3.denied.
-- =============================================================================
BEGIN;

DO $guard$
BEGIN
  IF NOT (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'SV4: must run as a superuser on a disposable DB';
  END IF;
  IF inet_server_addr() IS NOT NULL
     AND NOT (inet_server_addr() <<= '127.0.0.0/8'::inet OR inet_server_addr() = '::1'::inet)
     AND coalesce(current_setting('sv3.allow_non_loopback', true), 'off') <> 'on' THEN
    RAISE EXCEPTION 'SV4: refusing non-loopback server address %', inet_server_addr();
  END IF;
  IF to_regprocedure('public.is_linked_to_student(uuid)') IS NULL THEN
    RAISE EXCEPTION 'SV4: migrations 20261020000090-0110 not applied';
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

CREATE FUNCTION sv3.affected(_label text, _sql text, _expected bigint) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE n bigint;
BEGIN
  EXECUTE _sql; GET DIAGNOSTICS n = ROW_COUNT;
  IF n IS DISTINCT FROM _expected THEN
    RAISE EXCEPTION 'SV3 FAIL [%]: expected % affected rows, got %', _label, _expected, n;
  END IF;
END $f$;
GRANT EXECUTE ON FUNCTION sv3.affected(text,text,bigint) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------- seed ---
-- a1 admin, a2 parent(linked S1), a3 student(S1 user), a4 teacher, a5 bursar, a6 other parent, b1 admin B
INSERT INTO auth.users (id) SELECT ('aaaaaaaa-0000-4000-8000-00000000000'||i)::uuid FROM generate_series(1,6) i;
INSERT INTO auth.users (id) VALUES ('bbbbbbbb-0000-4000-8000-000000000001');
INSERT INTO public.schools (id, name, slug) VALUES
  ('54000000-0000-4000-8000-0000000000a1', 'SV4 School A', 'sv4-school-a'),
  ('54000000-0000-4000-8000-0000000000b2', 'SV4 School B', 'sv4-school-b');
INSERT INTO public.users (id, school_id, full_name, email, role, is_active) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001','54000000-0000-4000-8000-0000000000a1','Admin A','adm@sv4.invalid','admin',true),
  ('aaaaaaaa-0000-4000-8000-000000000002','54000000-0000-4000-8000-0000000000a1','Parent A','par@sv4.invalid','parent',true),
  ('aaaaaaaa-0000-4000-8000-000000000003','54000000-0000-4000-8000-0000000000a1','Student A','stu@sv4.invalid','student',true),
  ('aaaaaaaa-0000-4000-8000-000000000004','54000000-0000-4000-8000-0000000000a1','Teacher A','tch@sv4.invalid','teacher',true),
  ('aaaaaaaa-0000-4000-8000-000000000005','54000000-0000-4000-8000-0000000000a1','Bursar A','bur@sv4.invalid','bursar',true),
  ('aaaaaaaa-0000-4000-8000-000000000006','54000000-0000-4000-8000-0000000000a1','Parent Other','par2@sv4.invalid','parent',true),
  ('bbbbbbbb-0000-4000-8000-000000000001','54000000-0000-4000-8000-0000000000b2','Admin B','admb@sv4.invalid','admin',true);
INSERT INTO public.students (id, school_id, user_id) VALUES
  ('5c000000-0000-4000-8000-000000000001','54000000-0000-4000-8000-0000000000a1','aaaaaaaa-0000-4000-8000-000000000003'),
  ('5c000000-0000-4000-8000-000000000002','54000000-0000-4000-8000-0000000000a1',NULL),
  ('5c000000-0000-4000-8000-0000000000b1','54000000-0000-4000-8000-0000000000b2',NULL);
INSERT INTO public.parent_student_map (school_id, parent_id, student_id) VALUES
  ('54000000-0000-4000-8000-0000000000a1','aaaaaaaa-0000-4000-8000-000000000002','5c000000-0000-4000-8000-000000000001');
INSERT INTO public.fees (school_id, student_id, fee_type, amount, status) VALUES
  ('54000000-0000-4000-8000-0000000000a1','5c000000-0000-4000-8000-000000000001','tuition',5000,'unpaid'),
  ('54000000-0000-4000-8000-0000000000a1','5c000000-0000-4000-8000-000000000002','tuition',7000,'unpaid'),
  ('54000000-0000-4000-8000-0000000000b2','5c000000-0000-4000-8000-0000000000b1','tuition',9000,'unpaid');
INSERT INTO public.student_platform_fee_ledger (school_id, student_id, academic_year, term)
  VALUES ('54000000-0000-4000-8000-0000000000a1','5c000000-0000-4000-8000-000000000001','2026','1');

-- 0090: fees / students / ledger ------------------------------------------------
SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000002');  -- linked parent
SELECT sv3.cnt('parent sees only linked child fees', $$SELECT 1 FROM public.fees WHERE school_id='54000000-0000-4000-8000-0000000000a1'$$, 1);
SELECT sv3.cnt('parent sees only linked child', $$SELECT 1 FROM public.students$$, 1);
SELECT sv3.affected('parent cannot mark own child fee paid', $$UPDATE public.fees SET status='paid'$$, 0);
SELECT sv3.affected('parent cannot edit students', $$UPDATE public.students SET home_address='x'$$, 0);
SELECT sv3.denied('parent cannot create fee', $$INSERT INTO public.fees (school_id, student_id, fee_type, amount) VALUES ('54000000-0000-4000-8000-0000000000a1','5c000000-0000-4000-8000-000000000001','x',1)$$);
SELECT sv3.cnt('parent cannot read platform ledger', $$SELECT 1 FROM public.student_platform_fee_ledger$$, 0);
SELECT sv3.denied('parent cannot write platform ledger', $$INSERT INTO public.student_platform_fee_ledger (school_id, academic_year, term) VALUES ('54000000-0000-4000-8000-0000000000a1','2026','2')$$);
SELECT sv3.denied('parent cannot link self to another child (0100)', $$INSERT INTO public.parent_student_map (school_id, parent_id, student_id) VALUES ('54000000-0000-4000-8000-0000000000a1','aaaaaaaa-0000-4000-8000-000000000002','5c000000-0000-4000-8000-000000000002')$$);
SELECT sv3.denied('parent cannot write attendance (0100)', $$INSERT INTO public.attendance (school_id, student_id, date, status) VALUES ('54000000-0000-4000-8000-0000000000a1','5c000000-0000-4000-8000-000000000001','2026-10-01','present')$$);
SELECT sv3.logout();

SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000006');  -- unlinked parent
SELECT sv3.cnt('unlinked parent sees no fees', $$SELECT 1 FROM public.fees$$, 0);
SELECT sv3.cnt('unlinked parent sees no students', $$SELECT 1 FROM public.students$$, 0);
SELECT sv3.logout();

SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000003');  -- student S1
SELECT sv3.cnt('student sees only own fee', $$SELECT 1 FROM public.fees$$, 1);
SELECT sv3.cnt('student sees only self', $$SELECT 1 FROM public.students$$, 1);
SELECT sv3.affected('student cannot mark fee paid', $$UPDATE public.fees SET status='paid'$$, 0);
SELECT sv3.denied('student cannot write discipline (0100)', $$INSERT INTO public.discipline_records (school_id, student_id) VALUES ('54000000-0000-4000-8000-0000000000a1','5c000000-0000-4000-8000-000000000001')$$);
SELECT sv3.logout();

SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000004');  -- teacher
SELECT sv3.cnt('teacher sees school A fees', $$SELECT 1 FROM public.fees$$, 2);
SELECT sv3.cnt('teacher sees school A students', $$SELECT 1 FROM public.students$$, 2);
SELECT sv3.affected('teacher cannot change fees', $$UPDATE public.fees SET status='paid'$$, 0);
SELECT sv3.affected('teacher cannot edit students', $$UPDATE public.students SET home_address='x'$$, 0);
SELECT sv3.allowed('teacher can record attendance', $$INSERT INTO public.attendance (school_id, student_id, date, status) VALUES ('54000000-0000-4000-8000-0000000000a1','5c000000-0000-4000-8000-000000000001','2026-10-01','present')$$);
SELECT sv3.denied('teacher cannot write clinic visits (admin only)', $$INSERT INTO public.clinic_visits (school_id) VALUES ('54000000-0000-4000-8000-0000000000a1')$$);
SELECT sv3.denied('teacher cannot write payroll', $$INSERT INTO public.staff_payroll (school_id, month, year) VALUES ('54000000-0000-4000-8000-0000000000a1',1,2026)$$);
SELECT sv3.logout();

SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000005');  -- bursar
SELECT sv3.affected('bursar can update school A fees', $$UPDATE public.fees SET status='paid' WHERE student_id='5c000000-0000-4000-8000-000000000001'$$, 1);
SELECT sv3.allowed('bursar can create fee', $$INSERT INTO public.fees (school_id, student_id, fee_type, amount) VALUES ('54000000-0000-4000-8000-0000000000a1','5c000000-0000-4000-8000-000000000002','books',100)$$);
SELECT sv3.cnt('bursar reads ledger', $$SELECT 1 FROM public.student_platform_fee_ledger$$, 1);
SELECT sv3.affected('bursar cannot update school B fees', $$UPDATE public.fees SET status='paid' WHERE school_id='54000000-0000-4000-8000-0000000000b2'$$, 0);
SELECT sv3.logout();

SELECT sv3.login('aaaaaaaa-0000-4000-8000-000000000001');  -- admin A
SELECT sv3.affected('admin can edit own-school students', $$UPDATE public.students SET home_address='y' WHERE school_id='54000000-0000-4000-8000-0000000000a1'$$, 2);
SELECT sv3.affected('admin cannot edit school B students', $$UPDATE public.students SET home_address='y' WHERE school_id='54000000-0000-4000-8000-0000000000b2'$$, 0);
SELECT sv3.allowed('admin can write clinic visit', $$INSERT INTO public.clinic_visits (school_id) VALUES ('54000000-0000-4000-8000-0000000000a1')$$);
SELECT sv3.allowed('admin can link parent', $$INSERT INTO public.parent_student_map (school_id, parent_id, student_id) VALUES ('54000000-0000-4000-8000-0000000000a1','aaaaaaaa-0000-4000-8000-000000000006','5c000000-0000-4000-8000-000000000002')$$);
SELECT sv3.denied('admin A cannot link in school B', $$INSERT INTO public.parent_student_map (school_id, parent_id, student_id) VALUES ('54000000-0000-4000-8000-0000000000b2','aaaaaaaa-0000-4000-8000-000000000006','5c000000-0000-4000-8000-0000000000b1')$$);
SELECT sv3.logout();

SELECT sv3.login('bbbbbbbb-0000-4000-8000-000000000001');
SELECT sv3.cnt('admin B sees no school A fees', $$SELECT 1 FROM public.fees WHERE school_id='54000000-0000-4000-8000-0000000000a1'$$, 0);
SELECT sv3.logout();

-- 0080: privileges ---------------------------------------------------------------
SELECT sv3.cnt('no TRUNCATE for anon/authenticated on public tables', $$SELECT 1 FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee IN ('anon','authenticated') AND privilege_type='TRUNCATE'$$, 0);
SELECT sv3.cnt('anon has no write grant on fees/students/users', $$SELECT 1 FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee='anon' AND table_name IN ('fees','students','users','staff_payroll') AND privilege_type IN ('INSERT','UPDATE','DELETE')$$, 0);
SELECT sv3.cnt('anon keeps admissions insert (public form)', $$SELECT 1 WHERE has_table_privilege('anon','public.admission_applications','INSERT')$$, 1);
SELECT sv3.cnt('anon cannot execute assign_role', $$SELECT 1 FROM pg_proc WHERE proname='assign_role' AND has_function_privilege('anon', oid, 'EXECUTE')$$, 0);
SELECT sv3.cnt('anon keeps public_school_stats', $$SELECT 1 FROM pg_proc WHERE proname='public_school_stats' AND has_function_privilege('anon', oid, 'EXECUTE')$$, 1);
SELECT sv3.login_as('anon');
SELECT sv3.denied('anon cannot TRUNCATE fees', $$TRUNCATE public.fees$$);
SELECT sv3.logout();

DO $$ BEGIN RAISE NOTICE 'ALL PASS'; END $$;
ROLLBACK;
