-- SHERIVS-001 identity freeze — local disposable PostgreSQL verification.
-- Run ONLY against a disposable loopback database where
-- database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed
-- has been applied:
--   psql -v ON_ERROR_STOP=1 -f tests/integration/sherivs-001-identity-freeze.local.sql
-- Connect as postgres. Everything is rolled back; only synthetic rows are used.

BEGIN;

INSERT INTO auth.users (id) VALUES
  ('a0000000-0000-4000-8000-00000000000a'),
  ('b0000000-0000-4000-8000-00000000000b');

INSERT INTO public.schools (id, name, slug) VALUES
  ('51000000-0000-4000-8000-0000000000a1', 'SHERIVS Synthetic School One', 'sherivs-synth-one'),
  ('51000000-0000-4000-8000-0000000000b2', 'SHERIVS Synthetic School Two', 'sherivs-synth-two');

INSERT INTO public.users (id, school_id, full_name, email, phone, role, is_active) VALUES
  ('a0000000-0000-4000-8000-00000000000a', '51000000-0000-4000-8000-0000000000a1',
   'Synthetic User A', 'a@sherivs.invalid', '000', 'teacher', true),
  ('b0000000-0000-4000-8000-00000000000b', '51000000-0000-4000-8000-0000000000b2',
   'Synthetic User B', 'b@sherivs.invalid', '000', 'admin', true);

-- (a) authenticated user A: self privilege changes raise; profile fields pass
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-00000000000a', true);
SELECT set_config('request.jwt.claims',
  '{"sub":"a0000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;

DO $t$
DECLARE
  v_msg text;
  v_expected constant text :=
    'Forbidden: only service_role may modify privileged identity fields (role, school_id, is_active)';
BEGIN
  IF current_user <> 'authenticated' THEN
    RAISE EXCEPTION 'FAIL (a) expected current_user authenticated, got %', current_user;
  END IF;

  BEGIN
    UPDATE public.users SET role = 'admin' WHERE id = 'a0000000-0000-4000-8000-00000000000a';
    RAISE EXCEPTION 'FAIL (a) self role update was allowed';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg IS DISTINCT FROM v_expected THEN
      RAISE EXCEPTION 'FAIL (a) self role: unexpected message: %', v_msg;
    END IF;
    RAISE NOTICE 'PASS (a) authenticated self role update denied';
  END;

  BEGIN
    UPDATE public.users SET school_id = '51000000-0000-4000-8000-0000000000b2'
     WHERE id = 'a0000000-0000-4000-8000-00000000000a';
    RAISE EXCEPTION 'FAIL (a) self school_id update was allowed';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg IS DISTINCT FROM v_expected THEN
      RAISE EXCEPTION 'FAIL (a) self school_id: unexpected message: %', v_msg;
    END IF;
    RAISE NOTICE 'PASS (a) authenticated self school_id update denied';
  END;

  BEGIN
    UPDATE public.users SET is_active = false WHERE id = 'a0000000-0000-4000-8000-00000000000a';
    RAISE EXCEPTION 'FAIL (a) self is_active update was allowed';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg IS DISTINCT FROM v_expected THEN
      RAISE EXCEPTION 'FAIL (a) self is_active: unexpected message: %', v_msg;
    END IF;
    RAISE NOTICE 'PASS (a) authenticated self is_active update denied';
  END;

  UPDATE public.users SET full_name = 'Synthetic User A Renamed', phone = '111'
   WHERE id = 'a0000000-0000-4000-8000-00000000000a';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAIL (a) self full_name/phone update affected no row';
  END IF;
  RAISE NOTICE 'PASS (a) authenticated self full_name/phone update allowed';
END
$t$;

RESET ROLE;

DO $t$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users
     WHERE id = 'a0000000-0000-4000-8000-00000000000a'
       AND role = 'teacher' AND is_active = true
       AND school_id = '51000000-0000-4000-8000-0000000000a1'
       AND full_name = 'Synthetic User A Renamed' AND phone = '111'
  ) THEN
    RAISE EXCEPTION 'FAIL (a) post-state of user A is not as expected';
  END IF;
  RAISE NOTICE 'PASS (a) post-state verified';
END
$t$;

-- (b) postgres forging service_role JWT GUCs (sub = B) must NOT bypass the trigger
SELECT set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-00000000000b', true);
SELECT set_config('request.jwt.claims',
  '{"sub":"b0000000-0000-4000-8000-00000000000b","role":"service_role"}', true);
SELECT set_config('request.jwt.claim.role', 'service_role', true);

DO $t$
DECLARE
  v_msg text;
  v_expected constant text :=
    'Forbidden: only service_role may modify privileged identity fields (role, school_id, is_active)';
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'FAIL (b) expected current_user postgres, got %', current_user;
  END IF;

  BEGIN
    UPDATE public.users SET role = 'admin' WHERE id = 'a0000000-0000-4000-8000-00000000000a';
    RAISE EXCEPTION 'FAIL (b) postgres with forged service_role GUCs changed role';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg IS DISTINCT FROM v_expected THEN
      RAISE EXCEPTION 'FAIL (b) unexpected message: %', v_msg;
    END IF;
    RAISE NOTICE 'PASS (b) postgres with forged JWT GUCs denied role change on another user';
  END;
END
$t$;

-- (c) PostgreSQL role service_role may change privileged columns
SET LOCAL ROLE service_role;

DO $t$
BEGIN
  IF current_user <> 'service_role' THEN
    RAISE EXCEPTION 'FAIL (c) expected current_user service_role, got %', current_user;
  END IF;

  UPDATE public.users SET role = 'principal' WHERE id = 'a0000000-0000-4000-8000-00000000000a';
  RAISE NOTICE 'PASS (c) service_role role change allowed';

  UPDATE public.users SET school_id = '51000000-0000-4000-8000-0000000000b2'
   WHERE id = 'a0000000-0000-4000-8000-00000000000a';
  RAISE NOTICE 'PASS (c) service_role school_id change allowed';

  UPDATE public.users SET is_active = false WHERE id = 'a0000000-0000-4000-8000-00000000000a';
  RAISE NOTICE 'PASS (c) service_role is_active change allowed';
END
$t$;

RESET ROLE;

DO $t$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users
     WHERE id = 'a0000000-0000-4000-8000-00000000000a'
       AND role = 'principal' AND is_active = false
       AND school_id = '51000000-0000-4000-8000-0000000000b2'
  ) THEN
    RAISE EXCEPTION 'FAIL (c) service_role changes were not persisted';
  END IF;
  RAISE NOTICE 'PASS (c) post-state verified';
  RAISE NOTICE 'ALL PASS';
END
$t$;

ROLLBACK;
