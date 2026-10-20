-- =============================================================================
-- SHERIVS — ACTIVATE info@sherivs.com AS PLATFORM SUPER ADMIN. Paste into the
-- Supabase SQL editor and run as-is (no placeholders).
--
--   (a) STOPs if the auth account info@sherivs.com does not exist
--   (b) confirms the email (email_confirmed_at = now()) only if not yet confirmed
--   (c) adds the account to public.super_admins exactly as create-super-admin.sql
--   (d) ends with check_name | ok rows — all must be true
-- Idempotent: safe to re-run. Then sign out and sign in again → /internal.
-- =============================================================================
BEGIN;

CREATE TEMP TABLE sa_input ON COMMIT DROP AS
SELECT 'info@sherivs.com'::text              AS email,
       'Muhammad Sheriff Yusuf Wasili'::text AS full_name;

DO $guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users u JOIN sa_input i ON lower(u.email) = i.email) THEN
    RAISE EXCEPTION 'STOP: no auth account for info@sherivs.com; sign up first';
  END IF;
END
$guard$;

UPDATE auth.users u
   SET email_confirmed_at = now()
  FROM sa_input i
 WHERE lower(u.email) = i.email
   AND u.email_confirmed_at IS NULL;

INSERT INTO public.super_admins (id, full_name, email, role, is_active)
SELECT u.id, i.full_name, i.email, 'super_admin', true
  FROM auth.users u JOIN sa_input i ON lower(u.email) = i.email
ON CONFLICT (id) DO UPDATE SET is_active = true, full_name = EXCLUDED.full_name;

COMMIT;

SELECT check_name, ok FROM (VALUES
  ('info@sherivs.com email confirmed',
     EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = 'info@sherivs.com' AND email_confirmed_at IS NOT NULL)),
  ('info@sherivs.com is an active super admin',
     EXISTS (SELECT 1 FROM public.super_admins s JOIN auth.users u ON u.id = s.id
              WHERE lower(u.email) = 'info@sherivs.com' AND s.is_active AND s.role = 'super_admin')),
  ('exactly one active super admin',
     (SELECT count(*) FROM public.super_admins WHERE is_active) = 1)
) AS t(check_name, ok);
