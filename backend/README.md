# Backend

Future home of standalone backend services extracted from the web
application.

**Current state:** The web app in `frontend/src/` is a full-stack TanStack
Start application. Its BFF layer is co-located:

- API route handlers: `frontend/src/routes/api/**`
- Server functions (services/business logic): `frontend/src/lib/*.functions.ts`
- Server-only integrations: `frontend/src/integrations/supabase/*.server.ts`
- SSR entry: `frontend/src/server.ts`, `frontend/src/start.ts`

Extraction to this directory is tracked in `remaining-work.md` and
`decisions/architecture-decisions.md` (ADR-002). Do not move these files
without updating the build pipeline and re-verifying the production build.

