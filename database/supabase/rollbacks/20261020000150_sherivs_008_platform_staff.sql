-- Rollback of 20261020000150_sherivs_008_platform_staff.sql. Drops the
-- internal-console staff model (all staff rows and role grants are lost;
-- auth accounts and super_admins are untouched).
BEGIN;
DROP TABLE IF EXISTS public.platform_staff_roles;
DROP TABLE IF EXISTS public.platform_roles;
DROP TABLE IF EXISTS public.platform_staff;
DROP FUNCTION IF EXISTS public.claim_platform_staff_invite();
DROP FUNCTION IF EXISTS public.has_platform_capability(text);
DROP FUNCTION IF EXISTS public.is_platform_staff();
COMMIT;
