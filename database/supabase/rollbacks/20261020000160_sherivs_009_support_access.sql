-- Rollback of 20261020000160_sherivs_009_support_access.sql (grants are lost).
BEGIN;
DROP TABLE IF EXISTS public.platform_support_grants;
DROP FUNCTION IF EXISTS public.has_support_access(uuid);
COMMIT;
