-- Behavioral proof (run on a LOCAL disposable Supabase stack, as postgres,
-- after migration 20261020000140): an authenticated non-admin, and anon,
-- cannot become (or erase) a super admin. Rolls back; leaves no rows.
-- Expect the final SELECT to return ok = true for every row.
BEGIN;
CREATE TEMP TABLE sa_results (check_name text, ok boolean) ON COMMIT DROP;
GRANT INSERT ON sa_results TO authenticated, anon;

-- A plain signed-in account with no super_admins row, and the table EMPTY
-- (the old bootstrap precondition).
INSERT INTO auth.users (id, instance_id, aud, role, email)
VALUES ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated', 'non-admin@example.test');
DELETE FROM public.super_admins;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

DO $t$ BEGIN
  INSERT INTO public.super_admins (id, full_name, email)
  VALUES ('11111111-1111-4111-8111-111111111111', 'Intruder', 'non-admin@example.test');
  INSERT INTO sa_results VALUES ('authenticated INSERT into empty super_admins refused', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO sa_results VALUES ('authenticated INSERT into empty super_admins refused', true);
END $t$;

DO $t$ BEGIN
  TRUNCATE public.super_admins;
  INSERT INTO sa_results VALUES ('authenticated TRUNCATE refused', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO sa_results VALUES ('authenticated TRUNCATE refused', true);
END $t$;

DO $t$ BEGIN
  PERFORM public.is_super_admin();
  INSERT INTO sa_results VALUES ('authenticated is still not super admin', NOT public.is_super_admin());
END $t$;

RESET ROLE;
SET LOCAL ROLE anon;
DO $t$ BEGIN
  INSERT INTO public.super_admins (id, full_name, email)
  VALUES ('11111111-1111-4111-8111-111111111111', 'Intruder', 'non-admin@example.test');
  INSERT INTO sa_results VALUES ('anon INSERT refused', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO sa_results VALUES ('anon INSERT refused', true);
END $t$;
DO $t$ BEGIN
  TRUNCATE public.super_admins;
  INSERT INTO sa_results VALUES ('anon TRUNCATE refused', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO sa_results VALUES ('anon TRUNCATE refused', true);
END $t$;
RESET ROLE;

INSERT INTO sa_results VALUES ('super_admins still empty',
  (SELECT count(*) FROM public.super_admins) = 0);

SELECT check_name, ok FROM sa_results ORDER BY check_name;
ROLLBACK;
