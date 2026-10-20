-- Behavioral proof (LOCAL disposable Supabase stack, as postgres, after
-- migration 20261020000150): clients can't create, grant or escalate platform
-- staff; staff see only their own rows; capability checks follow roles and
-- status. Rolls back; leaves no rows. Expect ok = true for every row.
BEGIN;
CREATE TEMP TABLE ps_results (check_name text, ok boolean) ON COMMIT DROP;
GRANT INSERT ON ps_results TO authenticated, anon;

INSERT INTO auth.users (id, instance_id, aud, role, email, email_confirmed_at) VALUES
  ('21111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'outsider@example.test', now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'support@example.test', now()),
  ('23333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'suspended@example.test', now());
INSERT INTO public.platform_staff (id, email, full_name, status) VALUES
  ('22222222-2222-4222-8222-222222222222', 'support@example.test', 'Support Person', 'invited'),
  ('23333333-3333-4333-8333-333333333333', 'suspended@example.test', 'Suspended Person', 'suspended');
INSERT INTO public.platform_staff_roles (staff_id, role_code) VALUES
  ('22222222-2222-4222-8222-222222222222', 'support'),
  ('23333333-3333-4333-8333-333333333333', 'platform_admin');

-- Outsider (signed in, not staff)
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"21111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
DO $t$ BEGIN
  INSERT INTO public.platform_staff (id, email, full_name, status)
  VALUES ('21111111-1111-4111-8111-111111111111', 'outsider@example.test', 'Intruder', 'active');
  INSERT INTO ps_results VALUES ('outsider cannot insert platform_staff', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO ps_results VALUES ('outsider cannot insert platform_staff', true);
END $t$;
DO $t$ BEGIN
  INSERT INTO public.platform_staff_roles (staff_id, role_code)
  VALUES ('22222222-2222-4222-8222-222222222222', 'platform_admin');
  INSERT INTO ps_results VALUES ('outsider cannot grant roles', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO ps_results VALUES ('outsider cannot grant roles', true);
END $t$;
DO $t$ BEGIN
  TRUNCATE public.platform_staff CASCADE;
  INSERT INTO ps_results VALUES ('outsider cannot truncate', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO ps_results VALUES ('outsider cannot truncate', true);
END $t$;
INSERT INTO ps_results VALUES ('outsider sees no staff rows', (SELECT count(*) FROM public.platform_staff) = 0);
INSERT INTO ps_results VALUES ('outsider is not platform staff', NOT public.is_platform_staff());
INSERT INTO ps_results VALUES ('outsider claim does nothing', NOT public.claim_platform_staff_invite());

-- Invited support member: claims own invite, then sees only own row
SELECT set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
INSERT INTO ps_results VALUES ('invited staff is not yet active staff', NOT public.is_platform_staff());
INSERT INTO ps_results VALUES ('invited staff claims own invite', public.claim_platform_staff_invite());
INSERT INTO ps_results VALUES ('claimed staff is active staff', public.is_platform_staff());
INSERT INTO ps_results VALUES ('support has tenants.read', public.has_platform_capability('platform.tenants.read'));
INSERT INTO ps_results VALUES ('support lacks staff.manage', NOT public.has_platform_capability('platform.staff.manage'));
INSERT INTO ps_results VALUES ('support sees only own staff row', (SELECT count(*) FROM public.platform_staff) = 1);
DO $t$ BEGIN
  UPDATE public.platform_staff SET status = 'active' WHERE id = '23333333-3333-4333-8333-333333333333';
  INSERT INTO ps_results VALUES ('staff cannot update staff rows', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO ps_results VALUES ('staff cannot update staff rows', true);
END $t$;

-- Suspended platform_admin: no capabilities, cannot self-reactivate
SELECT set_config('request.jwt.claims', '{"sub":"23333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
INSERT INTO ps_results VALUES ('suspended admin is not staff', NOT public.is_platform_staff());
INSERT INTO ps_results VALUES ('suspended admin has no capability', NOT public.has_platform_capability('platform.staff.read'));
INSERT INTO ps_results VALUES ('suspended cannot claim back', NOT public.claim_platform_staff_invite());

RESET ROLE;
SET LOCAL ROLE anon;
DO $t$ BEGIN
  PERFORM 1 FROM public.platform_staff;
  INSERT INTO ps_results VALUES ('anon cannot read platform_staff', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO ps_results VALUES ('anon cannot read platform_staff', true);
END $t$;
RESET ROLE;

INSERT INTO ps_results VALUES ('suspended row still suspended',
  (SELECT status FROM public.platform_staff WHERE id = '23333333-3333-4333-8333-333333333333') = 'suspended');

SELECT check_name, ok FROM ps_results ORDER BY check_name;
ROLLBACK;
