# Technology Decisions

## Current platform stack (preserved, not replaced)

- **Runtime:** TanStack Start (Vite + Nitro) with React 19 + TypeScript
- **Database / Auth / Storage / Realtime:** Supabase (Postgres + RLS)
- **Styling:** Tailwind CSS v4 + shadcn/ui (Radix primitives)
- **Charts / Icons:** Recharts, Lucide React
- **Payments:** Paystack (inline + webhooks)
- **Server functions:** TanStack Start `createServerFn` (BFF layer)
- **Testing:** Vitest (unit) + Playwright (e2e)
- **Package manager:** npm (lockfile committed), bun also present

## TEC-001 - Keep the TanStack Start monolith for phase 01 (2026-08-15)

**Context:** A microservice split was considered during migration.

**Decision:** Keep the full-stack web app as the first production runtime.
Extract services to `backend/` only when a boundary is load-tested and
observable.

**Consequences:** Fastest path to a production runtime; service extraction is
tracked in `remaining-work.md`.

## TEC-002 - No dependency upgrades during migration (2026-08-15)

**Context:** Dependency churn would obscure the migration and risk regressions.

**Decision:** Lockfiles (`package-lock.json`, `bun.lock`) are unchanged except
for the package name in metadata. Upgrades are planned separately.

**Consequences:** Reproducible builds on the migration branch; deprecation
warnings (e.g. `inputValidator`) remain as known debt.

## TEC-003 - Tailwind v4 plugin is part of the canonical build config (2026-08-15)

**Context:** The local `vite.config.ts` omitted `@tailwindcss/vite`, which the
Lovable platform wrapper used to supply, breaking local builds and styling.

**Decision:** `@tailwindcss/vite` is now declared directly in `vite.config.ts`.

**Consequences:** Local and production builds are self-contained and no longer
depend on platform-injected config.

