# DEPENDENCY

> Status: Canonical. Architectural dependency map. Distinguishes direct
> runtime, dev, infrastructure, external services, AI providers, database,
> agent tooling, optional, legacy, unused, and planned dependencies. This is
> not a copy of package.json; entries are verified against actual usage.

## Dependency categories in this repository

| Category | Examples |
| --- | --- |
| Direct runtime | react, @tanstack/react-start, @supabase/supabase-js, ai, zod, tailwindcss |
| Development | typescript, vite, vitest, eslint, prettier, @playwright/test, @tailwindcss/vite |
| Infrastructure | hosted Supabase project (no local container config) |
| External service | Supabase, Paystack, Web Push (VAPID), Twilio, AI gateway |
| AI provider | OpenAI-compatible endpoint (`AI_GATEWAY_URL`); NVIDIA vars legacy |
| Database | Postgres via Supabase (schema in `database/supabase/migrations`) |
| Agent tooling | Claude Code, Claude Flow, Ruv Swarm, Codex memory |
| Optional | none declared as optional at runtime |
| Legacy | NVIDIA env vars (`.env` only); `vibeora_*` identifiers in schema |
| Unused | none confirmed in package.json (see notes) |
| Planned | backend services, mobile, marketplace, deployment stack |

## Key dependencies

| Dependency | Version | Purpose | Used where | Class | Vendor lock-in | Sensitivity | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| react / react-dom | 19.2.x | UI runtime | all components | runtime, direct | low | - | Current |
| @tanstack/react-start | 1.168.x | SSR framework, routing, server functions | whole app | runtime, direct | medium | - | Current |
| @tanstack/react-router | 1.170.x | file-based routing | routes | runtime, direct | medium | - | Current |
| @tanstack/react-query | 5.101.x | data fetching/cache | hooks/routes | runtime, direct | medium | - | Current |
| vite | 8.2.x | build/dev server | build | dev, direct | low | - | Current |
| nitro | 3.0.x-beta | SSR server runtime | build output | runtime (via start) | low | - | Current |
| typescript | 5.9.x | language/typecheck | all | dev, direct | low | - | Current |
| tailwindcss + @tailwindcss/vite | 4.3.x | styling | styles.css | runtime+dev | medium | - | Current |
| @supabase/supabase-js | 2.112.x | DB, auth, realtime, storage | integrations/ | runtime, direct | high | HIGH (service-role) | Current |
| ai + @ai-sdk/openai-compatible | 6.0.x / 2.0.x | AI SDK + provider | lib/*ai*, gateway | runtime | medium | MEDIUM (API keys) | Current |
| zod | 4.4.x | validation | server functions, forms | runtime, direct | low | - | Current |
| recharts | 2.15.x | charts | analytics/intelligence routes | runtime | low | - | Current |
| react-hook-form + resolvers | 7.7x / 5.x | forms | forms across portals | runtime | low | - | Current |
| date-fns | 4.4.x | dates | many routes | runtime | low | - | Current |
| @radix-ui/* (~30 pkgs) | 1.x/2.x | accessible primitives | ui components | runtime | medium | - | Current |
| lucide-react | 0.575.x | icons | UI | runtime | low | - | Current |
| sonner, cmdk, vaul, embla | various | toasts, palette, drawers, carousel | UI | runtime | low | - | Current |
| jspdf + html2canvas-pro | 4.x / 2.x | PDF/report generation | report cards, receipts | runtime | medium | - | Current |
| vitest | 4.1.x | unit tests | tests/unit | dev | low | - | Current |
| @playwright/test | 1.6x | e2e tests | tests/e2e | dev | low | - | Current |
| eslint + prettier | 9.x / 3.x | lint/format | repo | dev | low | - | Current |
| @vitejs/plugin-react | 5.2.x | React transform | build | dev | low | - | Current |
| vite-tsconfig-paths | 6.x | tsconfig path support | build/dev | dev | low | - | Installed (alias handled directly in vite.config) |

## External services

| Service | Access | Config | Sensitivity |
| --- | --- | --- | --- |
| Supabase | `frontend/src/integrations/supabase/` | `.env` (SUPABASE_*) | HIGH |
| Paystack | `lib/paystack*` + webhook | `PAYSTACK_SECRET_KEY` | HIGH |
| Web Push | `lib/push*` + sw.js | VAPID keys | MEDIUM |
| Twilio | digital-twin fallback | TWILIO_* | MEDIUM |
| AI gateway | `lib/ai-gateway.server.ts` | `AI_API_KEY`, `AI_GATEWAY_URL` | MEDIUM |

## Findings

- **Critical dependencies:** Supabase (data + auth + realtime + storage),
  TanStack Start (entire app runtime). Both are stable, widely adopted, and
  abstracted at integration boundaries.
- **Vendor coupling:** Supabase is the highest-coupling dependency; the
  schema uses Postgres-native features (RLS, generated columns) so a move
  would be a database migration, not a swap.
- **Legacy:** `NVIDIA_API_KEY` / `NVIDIA_BASE_URL` in `.env` are not read by
  any code; `vibeora_*` identifiers in schema/feature flags are preserved
  for data compatibility (renamed only via forward migration).
- **Removed:** `@lovable.dev/vite-tanstack-config` and its transitive
  toolchain (recorded in `decisions/technology-decisions.md`, TEC-004);
  `bun.lock` removed (Bun regenerates from the standard registry).
- **No dependency removals or additions** are authorized during this phase
  beyond the recorded Lovable removal.

