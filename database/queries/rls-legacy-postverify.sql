-- CoreGrid — post-fix verification (single statement so the API returns one result).
SELECT json_build_object(
  'transport_buses_policies', (
    SELECT json_agg(x) FROM (
      SELECT policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'transport_buses'
      ORDER BY cmd
    ) x
  ),
  'users_policies', (
    SELECT json_agg(x) FROM (
      SELECT policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'users'
      ORDER BY cmd
    ) x
  ),
  'dangerous_grants_remaining', (
    SELECT json_agg(x) FROM (
      SELECT table_name, grantee, privilege_type
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name IN ('transport_buses', 'users')
        AND grantee IN ('anon', 'authenticated')
        AND privilege_type IN ('TRUNCATE', 'TRIGGER', 'REFERENCES')
      ORDER BY table_name, grantee
    ) x
  )
) AS report;
