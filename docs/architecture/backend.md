# Backend Architecture

> Status: Current. Today's "backend" is the BFF layer of the TanStack Start
> web app; standalone services are planned.

## Current BFF layer

| Surface | Location |
| --- | --- |
| HTTP API routes | `frontend/src/routes/api/**` (Paystack webhook, audit endpoints) |
| Server functions | `frontend/src/lib/*.functions.ts` (business logic, AI, integrations) |
| SSR entry | `frontend/src/server.ts`, `frontend/src/start.ts` |
| Server-only Supabase client | `frontend/src/integrations/supabase/client.server.ts` |
| Auth middleware | `frontend/src/integrations/supabase/auth-middleware.ts` |

## Rules

- Server functions validate input with Zod.
- Service-role client is server-only and used for trusted operations
  (provisioning, webhooks, super-admin).
- Webhook endpoints self-verify signatures (Paystack HMAC-SHA512).

## Planned extraction

`backend/` is the future home of standalone services. Extraction criteria
(ADR-002): a second consumer exists, load testing shows the web runtime is
the bottleneck, and observability exists for the extracted service. See
`remaining-work.md` and `BOUNDARIES.md`.

