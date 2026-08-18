# Security Architecture

> Status: Canonical. Verified security posture; open items are explicit.

## Authentication

- Supabase Auth (email/password), JWT claims, rate-limited password reset
  (`lib/auth-helpers.ts`).
- Server-side token validation middleware (`auth-middleware.ts`) for
  authenticated server functions.

## Authorization

- Application: roles -> portal routing (`lib/roles.ts`) + `role-guard.tsx`.
- Database: RLS policies + helper functions.

## Tenant isolation

- RLS on all tenant tables; `school_id` scope; super-admin bypass.

## Secrets

- `.env` local-only and ignored; `.env.example` documents names.
- `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, VAPID private keys,
  AI keys are server-side.
- Known risk: credentials existed in git history and `.mcp.json`; rotation
  is pending (tracked in `PROGRESS.md`).

## Attack surface notes

- Paystack webhook verifies HMAC-SHA512 signatures.
- Public audit endpoint never reveals validation details (anti-enumeration).
- Import-protection linting blocks service-role imports in client bundles.
- RLS isolation check guards cross-tenant reads.

## Open hardening (planned)

- CI secret scanning, dependency audit, and security checks.
- Security Engine phase (`architecture/phase-08-security-engine.md`) for
  RBAC/ABAC/ReBAC/PBAC and audit hardening.

