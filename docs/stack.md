# CoreGrid Scholar - Verified Stack

> Status: Canonical. Verified against `package.json`, `package-lock.json`,
> installed versions (`npm ls`), and source usage. Status legend:
> INSTALLED (in lockfile), USED (imported by code/config),
> CONFIGURED (env/config only), PLANNED, LEGACY, UNUSED.

## Framework & runtime

| Technology | Version | Purpose | Actual usage | Status |
| --- | --- | --- | --- | --- |
| TypeScript (strict) | 5.9.x | Language | all source | USED |
| React | 19.2.x | UI runtime | components/routes | USED |
| TanStack Start | 1.168.x | SSR meta-framework | `frontend/src`, `vite.config.ts` | USED |
| TanStack Router | 1.170.x | File-based routing | `frontend/src/routes` | USED |
| TanStack React Query | 5.101.x | Server-state cache | hooks/routes | USED |
| Vite | 8.2.x | Build/dev server | `vite.config.ts` | USED |
| Nitro | 3.0.x-beta | SSR server | build output | USED (via Start) |
| Node.js | >=22.12 | Runtime | engines | USED |

## UI

| Technology | Version | Purpose | Actual usage | Status |
| --- | --- | --- | --- | --- |
| Tailwind CSS | 4.3.x | Styling | `frontend/src/styles.css` | USED |
| @tailwindcss/vite | 4.3.x | Tailwind plugin | `vite.config.ts` | USED |
| shadcn/ui (Radix primitives) | ~30 packages | Component system | `frontend/src/components/ui` | USED |
| Lucide React | 0.575.x | Icons | components | USED |
| Recharts | 2.15.x | Charts | analytics/intelligence | USED |
| React Hook Form | 7.7x | Forms | forms across portals | USED |
| @hookform/resolvers | 5.8.x | Schema resolvers | with zod | USED |
| Zod | 4.4.x | Validation | server functions, forms | USED |
| date-fns | 4.4.x | Dates | many routes | USED |
| Sonner | 2.x | Toasts | UI | USED |
| cmdk | 1.x | Command palette | command-center | USED |
| Vaul | 1.x | Drawers | UI | USED |
| Embla Carousel | 8.6.x | Carousels | UI | USED |
| jspdf / html2canvas-pro | 4.x / 2.x | PDF generation | report cards, receipts | USED |
| class-variance-authority / clsx / tailwind-merge | 0.7/2.1/3.5 | Variants + class merge | ui components | USED |
| tw-animate-css | 1.3.x | Animation utilities | styles.css | USED |

## Data & platform services

| Technology | Version | Purpose | Actual usage | Status |
| --- | --- | --- | --- | --- |
| Supabase (Postgres) | 2.112.x client | DB, auth, realtime, storage | `frontend/src/integrations/supabase/` | USED |
| Supabase Realtime | (in client) | Live channels | 13+ `.channel()` call sites | USED |
| Supabase Storage | (in client) | File uploads | message attachments | USED |
| Supabase Auth | (in client) | Authentication | auth routes, middleware | USED |
| RLS | (Postgres) | Tenant isolation | migrations + queries | USED |

## AI

| Technology | Version | Purpose | Actual usage | Status |
| --- | --- | --- | --- | --- |
| Vercel AI SDK (`ai`) | 6.0.x | AI orchestration | `lib/*ai*`, gateway | USED |
| @ai-sdk/openai-compatible | 2.0.x | OpenAI-compatible provider | `lib/ai-gateway.server.ts` | USED |
| AI Gateway endpoint | - | Model routing | `AI_GATEWAY_URL` / `AI_API_KEY` | CONFIGURED |
| NVIDIA vars | - | Legacy gateway config | `.env` only; not read by code | LEGACY |

## Integrations

| Technology | Purpose | Actual usage | Status |
| --- | --- | --- | --- |
| Paystack | Payments | inline + HMAC webhook | USED |
| Web Push (VAPID) | Push notifications | `lib/push*`, sw.js | USED |
| Twilio | SMS gateway | env vars; digital-twin fallback | CONFIGURED |

## Testing & quality

| Technology | Version | Purpose | Actual usage | Status |
| --- | --- | --- | --- | --- |
| Vitest | 4.1.x | Unit tests | `tests/unit` (24 tests) | USED |
| Playwright | 1.6x | E2E tests | `tests/e2e` | USED |
| ESLint 9 + typescript-eslint | 9.x / 8.x | Lint | repo | USED (failing pre-existing) |
| Prettier | 3.7.x | Format | repo | USED |
| @vitejs/plugin-react | 5.2.x | React transform | build | USED |
| vite-tsconfig-paths | 6.x | Path aliases | config | INSTALLED (alias handled directly) |

## Tooling / agent systems

| Technology | Purpose | Location | Status |
| --- | --- | --- | --- |
| Claude Code | Agent config | `.claude/` | USED (tooling) |
| Claude Flow (ruflo) | Orchestration | `.claude-flow/`, MCP | USED (tooling) |
| Ruv Swarm | Swarm memory | `.swarm/` | USED (tooling) |
| Flow Nexus | Agent platform | `.mcp.json` | CONFIGURED |
| GitHub MCP | GitHub access | `.mcp.json` | CONFIGURED |
| Supabase MCP | Supabase access | `.mcp.json` | CONFIGURED |

## Notes

- `bun.lock` was removed with the Lovable toolchain (TEC-004); npm +
  `package-lock.json` is the canonical package manager.
- No Docker, CI/CD, or deployment configuration exists yet (PLANNED).
- The stack is verified from the actual repository; nothing here claims
  usage that the code does not show.

