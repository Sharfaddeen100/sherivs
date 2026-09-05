-- CoreGrid — legacy RLS re-verification (recorded findings 2026-09-03).
-- Read-only introspection: actual policies + grants for the two tables behind
-- the recorded findings (transport_buses driver scope; users SELECT / push).
SELECT tablename, policyname, cmd, roles::text AS roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('transport_buses', 'users')
ORDER BY tablename, cmd;

SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('transport_buses', 'users')
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;
