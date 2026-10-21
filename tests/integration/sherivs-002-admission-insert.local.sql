-- SHERIVS-002: public admission INSERT policy probe (migration 20261020000030).
-- Disposable loopback DB only; run as supabase_admin (needs session_replication_role).
-- Everything is rolled back.
BEGIN;
SET LOCAL session_replication_role = replica;
INSERT INTO public.schools(id,name,slug,is_active) VALUES
  ('54000000-0000-4000-8000-000000000001','Probe Active','sv2-probe-active',true),
  ('54000000-0000-4000-8000-000000000002','Probe Inactive','sv2-probe-inactive',false);
SET LOCAL session_replication_role = origin;
SET LOCAL ROLE anon;
DO $$
DECLARE base text := 'INSERT INTO public.admission_applications(school_id,application_number,student_first_name,student_last_name,student_date_of_birth,applying_for_class,academic_year_applying,parent_one_name,parent_one_relationship,parent_one_phone,parent_one_email%s) VALUES (%L,%L,''x'',''x'',''2015-01-01'',''x'',''x'',''x'',''x'',''x'',''x''%s)';
BEGIN
  EXECUTE format(base, '', '54000000-0000-4000-8000-000000000001', 'SV2-1', '');
  RAISE NOTICE 'PASS pending application to an active school is allowed';
  BEGIN
    EXECUTE format(base, ',status', '54000000-0000-4000-8000-000000000001', 'SV2-2', ',''accepted''');
    RAISE EXCEPTION 'FAIL pre-accepted application was allowed';
  EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS pre-accepted application denied'; END;
  BEGIN
    EXECUTE format(base, ',decision_notes', '54000000-0000-4000-8000-000000000001', 'SV2-3', ',''forged''');
    RAISE EXCEPTION 'FAIL reviewer field was allowed';
  EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS reviewer-owned field denied'; END;
  BEGIN
    EXECUTE format(base, '', '54000000-0000-4000-8000-000000000002', 'SV2-4', '');
    RAISE EXCEPTION 'FAIL inactive school was allowed';
  EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS inactive school denied'; END;
  RAISE NOTICE 'ALL PASS';
END $$;
ROLLBACK;
