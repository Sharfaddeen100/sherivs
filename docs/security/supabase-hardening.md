# Supabase Integration - Professional Review & Hardening

> Status: Current. Date: 2026-08-19. Reviewed: Supabase schema, RLS,
> realtime, storage, clients, auth, and secrets handling. This record lists
> verified findings and the hardening applied in this migration.

## Verdict

The Supabase integration is professionally structured overall: RLS is
enabled on tenant tables with scoped helper functions, migrations are
immutable, realtime and storage already had idempotent policy migrations,
there are no `security definer` functions, service-role access is
server-only, and webhooks self-verify signatures. One critical exposure and
several hygiene gaps were found and fixed.

## Findings

### CRITICAL - Plaintext Paystack secret readable by anonymous users

- `schools.paystack_secret_key` is a legacy plaintext column.
- The RLS policy "Anyone can read active schools" plus
  `GRANT SELECT ON public.schools TO anon` let any visitor read the full
  row (including the secret) through PostgREST `select=*`.
- The column is unused by application code (API keys now live encrypted in
  `school_api_keys`), so it was a pure liability.

**Fix:** column-level `REVOKE SELECT (paystack_secret_key)` from
`anon, authenticated` in migration
`20260819000000_coregrid_harden_schools_and_realtime.sql`. PostgREST omits
revoked columns from `select=*` responses, so no code change was needed.

### HIGH - Realtime publication incomplete

- Channels subscribe to `users`, `fees`, `grades`, `admission_applications`,
  and `audit_logs`, but only `attendance`, `messages`, `notifications`,
  `attendance_logs`, and `transport_buses` were in the
  `supabase_realtime` publication.
- In production those channels would silently never fire.

**Fix:** the same migration adds the five missing tables to the publication
idempotently.

### MEDIUM - Server-only module protection absent from build

- The self-contained `vite.config.ts` did not configure import protection,
  so a client bundle could import the service-role client
  (`client.server.ts`) without a build error.

**Fix:** `importProtection` added to `tanstackStart()` - client bundles
fail the build if they import `**/*.server.ts`, `**/server/**`, or
`server-only`.

### MEDIUM - Service-role key under a VITE_ name

- `.env.example` (and the local `.env`) declared
  `VITE_SUPABASE_SERVICE_ROLE_KEY`, which would be embedded in client
  bundles if anything referenced it.

**Fix:** removed from `.env.example` and `.env`; documentation now states
the service-role key is server-only and must never be `VITE_`-prefixed.

### LOW - Local machine state tracked in git

- `database/supabase/.temp/**` (project refs, pooler URLs) was committed.

**Fix:** untracked and ignored.

### LOW - RLS isolation check coverage

- The check script only covered a subset of tenant tables.

**Fix:** expanded to all public tables and added two new assertions:
the Paystack secret column has no `anon`/`authenticated` SELECT privilege,
and every subscribed realtime table is in the publication.

## How to apply

```sh
supabase db push --workdir database/supabase
```

Then run the RLS isolation check against the database:

```sh
psql "$DATABASE_URL" -f database/queries/rls-isolation-check.sql
```

## Residual recommendations

- **Rotate all credentials that touched git history**, including the
  service-role key and the GitHub token embedded in `.mcp.json`.
- Move `.mcp.json` secrets to environment-variable references.
- Run the RLS isolation check in CI on every schema change.
- Deprecate and drop the legacy `schools.paystack_secret_key` column with a
  future forward migration once the encrypted `school_api_keys` flow is
  confirmed in production.

## 2026-09-03 Addendum — remediation applied (Phase 01 S1 hardening)

- `.mcp.json`: removed the embedded Supabase project URL and key material.
  The `supabase` MCP server now expects `SUPABASE_URL` and a Supabase key
  supplied by the host environment; no credential values remain in tracked
  files. See AD-181.
- `scripts/verification/secret-scan.mjs`: added `supabase-project-url` and
  `supabase-publishable-key` patterns so any future regression fails CI.
- Public demo provisioning (`demo-provision.functions.ts`) is now
  environment-gated: it runs only when `ALLOW_DEMO_PROVISIONING=true`
  (default `false`, documented in `.env.example`).
- `tests/unit/foundation.test.ts` extended (8 → 12 tests) to mechanically
  enforce the two invariants above.
- **Residual (owner action):** rotating every credential that touched git
  history remains outstanding; the publishable-key material removed from
  `.mcp.json` should still be revoked/rotated at the Supabase project.


