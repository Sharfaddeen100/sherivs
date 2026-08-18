# Frontend Architecture

> Status: Canonical. Describes the web platform in `frontend/`.

## Location and layout

```
frontend/
  public/          static assets (service worker, robots.txt)
  src/
    components/    UI + design system (shadcn/ui, Radix, portal components)
    routes/        file-based routes (pages, layouts, API routes)
    hooks/         shared React hooks
    contexts/      app context (school, auth, theme)
    lib/           domain logic, server functions, integrations
    integrations/  Supabase clients and auth middleware
    types/         shared TypeScript types
```

## Routing

TanStack Router file-based routing. Public marketing routes, auth routes,
and `_authenticated/` role portals (super-admin, hq, admin, bursar, teacher,
parent, student, driver). Layouts via `__root.tsx` and `_authenticated/route.tsx`.

## Data flow

- Client components call TanStack server functions (BFF) or Supabase
  directly for RLS-scoped reads.
- Server functions validate with Zod and run server-side.
- React Query caches server state.

## Styling

Tailwind CSS v4 with tenant-tunable colors injected from
`schools.primary_color` / `secondary_color`. Design tokens in
`styles.css`; no hardcoded brand colors in components.

## Boundaries

UI never imports service-role clients; server-only modules are enforced by
import-protection linting. See `BOUNDARIES.md`.

