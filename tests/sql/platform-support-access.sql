-- Behavioral proof (LOCAL disposable stack, as postgres, after 0150 + 0160).
-- Expect ok = true for every row. Rolls back.
BEGIN;
CREATE TEMP TABLE sg_results (check_name text, ok boolean) ON COMMIT DROP;
GRANT INSERT ON sg_results TO authenticated;

INSERT INTO auth.users (id, instance_id, aud, role, email, email_confirmed_at) VALUES
  ('31111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sup@example.test', now()),
  ('32222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'eng@example.test', now());
INSERT INTO public.platform_staff (id, email, full_name, status) VALUES
  ('31111111-1111-4111-8111-111111111111', 'sup@example.test', 'Support', 'active'),
  ('32222222-2222-4222-8222-222222222222', 'eng@example.test', 'Engineer', 'active');
INSERT INTO public.platform_staff_roles (staff_id, role_code) VALUES
  ('31111111-1111-4111-8111-111111111111', 'support'),
  ('32222222-2222-4222-8222-222222222222', 'engineering');
INSERT INTO public.schools (id, name, slug) VALUES
  ('3aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Grant School', 'grant-school-test'),
  ('3bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Other School', 'other-school-test');
INSERT INTO public.platform_support_grants (staff_id, tenant_id, reason, expires_at) VALUES
  ('31111111-1111-4111-8111-111111111111', '3aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Ticket 123: login issue', now() + interval '1 hour'),
  ('32222222-2222-4222-8222-222222222222', '3aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Ticket 124: wrong role, no support cap', now() + interval '1 hour');

DO $t$ BEGIN
  INSERT INTO public.platform_support_grants (staff_id, tenant_id, reason, expires_at)
  VALUES ('31111111-1111-4111-8111-111111111111', '3aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Too long a window here', now() + interval '9 hours');
  INSERT INTO sg_results VALUES ('window > 8h rejected', false);
EXCEPTION WHEN check_violation THEN
  INSERT INTO sg_results VALUES ('window > 8h rejected', true);
END $t$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"31111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
INSERT INTO sg_results VALUES ('support has access to granted school', public.has_support_access('3aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'));
INSERT INTO sg_results VALUES ('support has no access to other school', NOT public.has_support_access('3bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'));
INSERT INTO sg_results VALUES ('support sees only own grants', (SELECT count(*) FROM public.platform_support_grants) = 1);
DO $t$ BEGIN
  INSERT INTO public.platform_support_grants (staff_id, tenant_id, reason, expires_at)
  VALUES ('31111111-1111-4111-8111-111111111111', '3bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'self-granting attempt', now() + interval '1 hour');
  INSERT INTO sg_results VALUES ('staff cannot self-grant', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO sg_results VALUES ('staff cannot self-grant', true);
END $t$;
DO $t$ BEGIN
  UPDATE public.platform_support_grants SET expires_at = now() + interval '7 hours';
  INSERT INTO sg_results VALUES ('staff cannot extend grants', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO sg_results VALUES ('staff cannot extend grants', true);
END $t$;

SELECT set_config('request.jwt.claims', '{"sub":"32222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
INSERT INTO sg_results VALUES ('grant without support capability is useless',
  NOT public.has_support_access('3aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'));
RESET ROLE;

UPDATE public.platform_support_grants SET revoked_at = now()
 WHERE staff_id = '31111111-1111-4111-8111-111111111111';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"31111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
INSERT INTO sg_results VALUES ('revoked grant gives no access', NOT public.has_support_access('3aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'));
RESET ROLE;

SELECT check_name, ok FROM sg_results ORDER BY check_name;
ROLLBACK;
