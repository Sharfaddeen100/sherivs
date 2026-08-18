# REGISTRY

> Status: Canonical. The repository's master registry and map. Answers:
> "What exists in this repository, and where?" Entries are verified against
> the repository; planned items are labeled Planned.

## Repository layout

```
frontend/         web platform (TanStack Start full-stack app)
backend/          future standalone services (empty; planned)
mobile/           future mobile platform (empty; planned)
agents/           future CoreGrid AI agents (empty; planned)
database/         Supabase project, migrations, SQL checks
infrastructure/   future deployment/cloud config (empty; planned)
architecture/     32-phase CoreGrid-Scholar roadmap
constitution/     detailed policy documents
decisions/        ADR records (indexed by DECISIONS.md)
progress/         detailed progress records (indexed by PROGRESS.md)
docs/             audit, product spec, architecture, stack
scripts/          automation (smoke, verification)
tests/            unit (Vitest) and e2e (Playwright)
.codex/           Codex engineering memory
.claude/          Claude Code agents/commands/skills
.claude-flow/     Claude Flow orchestration state
.swarm/           Ruv Swarm memory (SQLite)
```

## Applications

| Name | Type | Location | Status |
| --- | --- | --- | --- |
| CoreGrid Scholar web app | Full-stack web app (SSR + SPA) | `frontend/src/` | Current |
| Server functions (BFF) | TanStack Start server functions | `frontend/src/lib/*.functions.ts` | Current |
| HTTP API routes | Route handlers | `frontend/src/routes/api/**` | Current |
| Backend services | Standalone services | `backend/` | Planned |
| Mobile app | Mobile platform | `mobile/` | Planned |

## Domains

| Domain | Location | Status |
| --- | --- | --- |
| Authentication | `frontend/src/integrations/supabase/`, `lib/auth-helpers.ts` | Current |
| Authorization / roles | `frontend/src/lib/roles.ts`, `components/role-guard.tsx` | Current |
| Tenant resolution | `frontend/src/lib/tenant.ts` | Current |
| Academics (grades, exams, report cards) | `frontend/src/routes/_authenticated/admin|teacher|student/**` | Current |
| Students | admin routes + `lib/class-levels.ts` | Current |
| Staff / teachers | admin/teacher routes, `lib/teachers.functions.ts` | Current |
| Attendance / biometrics | `lib/attendance.functions.ts`, teacher routes | Current |
| Fees / payments | `lib/paystack.functions.ts`, bursar routes | Current |
| Communication (messages, broadcast, notifications) | `lib/messages-*.functions.ts`, `notifications-*` | Current |
| Operations (bus, hostel, library, health, inventory, HR, payroll) | admin routes | Current |
| AI features | `components/ai/**`, `lib/*ai*.functions.ts` | Current |
| Digital twin | `lib/digital-twin.functions.ts` | Current |
| Analytics / intelligence | admin intelligence routes, `use-school-stats.ts` | Current |

## Data

| Item | Location | Notes |
| --- | --- | --- |
| Schema + migrations (29) | `database/supabase/migrations/` | Immutable history |
| Supabase project config | `database/supabase/config.toml` | Project `srhmfaoyhpvhdfxmagho` |
| Generated DB types | `frontend/src/integrations/supabase/types.ts` | Contract for rows |
| RLS isolation check | `database/queries/rls-isolation-check.sql` | Regression gate |
| Tenant tables | `schools`, `users`, `students`, `classes`, `grades`, `fees`, `attendance`, ... | `school_id`-scoped + RLS |
| Audit | `audit_logs` table + `lib/audit.ts` | Sensitive actions |

## Integrations

| Integration | Module | Status |
| --- | --- | --- |
| Supabase (DB/auth/realtime/storage) | `frontend/src/integrations/supabase/` | Current |
| Paystack | `lib/paystack.functions.ts`, `paystack-inline.ts`, webhook route | Current |
| Web Push (VAPID) | `lib/push.server.ts`, `push-client.ts`, `public/sw.js` | Current |
| Twilio (SMS gateway) | env vars; fallback in digital-twin module | Configured |
| AI gateway (OpenAI-compatible) | `lib/ai-gateway.server.ts` | Current |
| NVIDIA (legacy env vars) | `.env` only; not read by code | Legacy |

## AI

| Item | Location | Status |
| --- | --- | --- |
| AI SDK (Vercel `ai` + openai-compatible) | dependency + `lib/ai-gateway.server.ts` | Current |
| Lesson-plan AI | `lib/lesson-plan-ai.functions.ts` | Current |
| Timetable AI | `lib/timetable.functions.ts` | Current |
| Expense insights AI | `lib/expense-insights.functions.ts` | Current |
| Digital twin AI | `lib/digital-twin.functions.ts` | Current |
| Portal assistants (admin/teacher/student/parent) | `components/ai/**` | Current |
| Platform agents | `agents/` | Planned |

## Tests

| Suite | Location | Command | Status |
| --- | --- | --- | --- |
| Unit (Vitest, 24 tests) | `tests/unit/` | `npx vitest run` | Passing |
| E2E (Playwright) | `tests/e2e/` | `npm run test:e2e` | Preserved (needs dev server) |
| RLS isolation | `database/queries/rls-isolation-check.sql` | psql | Requires DB access |
| Smoke | `scripts/smoke.sh` | `scripts/smoke.sh` | Requires dev server |
| Verification bundle | `scripts/verification/check.ps1` | see scripts/README | New |

## Documentation

| Document | Location | Classification |
| --- | --- | --- |
| CONSTITUTION.md | root | Canonical |
| PRINCIPLES.md | root | Canonical |
| REGISTRY.md | root | Canonical |
| DEPENDENCY.md | root | Canonical |
| BOUNDARIES.md | root | Canonical |
| DECISIONS.md | root | Canonical (index) |
| PROGRESS.md | root | Canonical (index) |
| AGENTS.md | root | Canonical |
| README.md | root | Canonical |
| Product spec (archived) | `docs/product-spec.md` | Historical |
| Migration audit | `docs/migration-audit.md` | Historical (record of migration) |
| Migration report | `migration-report.md` | Historical (record of migration) |
| Architecture map | `architecture-map.md` | Current |
| Remaining work | `remaining-work.md` | Current (superseded by PROGRESS.md index) |
| Architecture phases (32) | `architecture/` | Current (skeletons; content pending) |
| Constitution policies | `constitution/` | Current (placeholders pending ratification) |
| Decisions/ADRs | `decisions/` | Current |
| Progress records | `progress/` | Current |
| Stack | `docs/stack.md` | Canonical |
| Architecture docs | `docs/architecture/` | Canonical |

## Agent systems

| System | Location | Purpose | Status |
| --- | --- | --- | --- |
| Codex | `.codex/` + `AGENTS.md` | Engineering memory + rules | Current |
| Claude Code | `.claude/` | Agents, commands, skills | Current (tooling) |
| Claude Flow | `.claude-flow/` | Orchestration state | Current (tooling) |
| Ruv Swarm | `.swarm/` (`memory.db`, `schema.sql`) | Swarm memory | Current (tooling) |
| MCP servers | `.mcp.json` | Claude Flow, Ruv Swarm, Flow Nexus, GitHub, Supabase | Current (secrets pending rotation) |

## Infrastructure

| Item | Location | Status |
| --- | --- | --- |
| Hosted Supabase | `database/supabase/config.toml` | Current |
| Build output | `dist/` (gitignored) | Current |
| Deployment config | `infrastructure/` | Planned |
| CI/CD | (none) | Planned |

