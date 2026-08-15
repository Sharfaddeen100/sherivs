# Security Policy

- Never commit secrets. Environment variables belong in `.env` (local only)
  and are documented in `.env.example`.
- Never edit applied database migrations; schema changes are forward
  migrations only.
- Treat Row-Level Security as the tenant isolation boundary. Never weaken an
  RLS policy to make application code easier.
- Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`,
  VAPID private keys, AI keys) must only be used in server contexts.
- Log security-sensitive actions through `audit_logs`; never log raw
  credentials or tokens.

