# CoreGrid Scholar - Repository Audit

**Date:** 2026-08-15
**Branch:** `coregrid-scholar-migration`
**Audit type:** Pre-migration architecture and security audit

---

## 1. Executive summary

The repository (`remix-of-school-os`) contains a mature, feature-rich
multi-tenant school management application ("Universal School OS" /
"Vibeora" branding) built as a TanStack Start full-stack web app with a
Supabase (Postgres) backend. The application is substantial: 300 source
files under `src/`, 133 route files, 103 UI component files, 29 database
migrations, and 8 role-based portals.

Three pre-existing defects blocked the production build and were repaired
during migration so the platform ships verified:

1. `src/routes/_authenticated/admin/classes.tsx` was corrupted with
   JSON-escaped sequences (`\"`, `\n`) starting at line 102, causing a
   syntax error.
2. `src/styles.css` had a CSS `@import` after `@source`, violating the
   `@import`-must-precede-all-other-statements rule.
3. `vite.config.ts` omitted the Tailwind v4 Vite plugin
   (`@tailwindcss/vite`), which the Lovable platform wrapper used to
   supply; without it the local build cannot compile Tailwind CSS.

The migration renames the project to **CoreGrid Scholar**, reorganizes the
repository into the CoreGrid platform structure, and preserves all existing
functionality.

---

## 2. Current architecture (pre-migration)

### Application topology

Single full-stack web application:

- **Framework:** TanStack Start (Vite + Nitro) with React 19, TypeScript,
  file-based routing (`src/routes/`), and server functions
  (`createServerFn`) as the BFF layer.
- **UI:** Tailwind CSS v4, shadcn/ui (Radix primitives), Recharts, Lucide
  React. Tenant-tunable colors injected at runtime from
  `schools.primary_color` / `secondary_color`.
- **Data:** Supabase (Postgres) - database, auth, storage, realtime.
- **Payments:** Paystack (inline checkout + HMAC-verified webhooks).
- **Notifications:** web push (VAPID), in-app notifications.
- **AI:** feature-level assistants for admin, teacher, student, and parent
  portals via an AI gateway (NVIDIA-compatible endpoints).

### Portals (role-based routing)

`frontend/src/routes/_authenticated/` contains 8 portals:

| Portal | Routes |
| --- | --- |
| Super Admin | platform schools, billing, tiers, config, logs, support |
| HQ | finance, reports, dashboard |
| Admin / Principal | dashboard, students, teachers, fees, attendance, timetable, exams, HR, payroll, inventory, library, bus, hostel, health, CMS, AI assistants, audit, digital twin |
| Bursar | fee plans, receipts, reconciliation, reports, financial intelligence |
| Teacher | gradebook, attendance, lesson plans, class intelligence, biometric enrollment |
| Parent | children, grades, fees, attendance, bus tracking, report cards, AI assistant |
| Student | dashboard, grades, fees, timetable, attendance, AI tutor |
| Driver | dashboard, students, routes |

### Authentication

- Supabase Auth (email/password, password reset with rate limiting).
- Server-side token validation middleware (`requireSupabaseAuth`) verifies
  Bearer JWTs via `supabase.auth.getClaims`.
- SSR auth attachment middleware sets the session for server-rendered
  requests.
- Reset-password flow is rate-limited (3 requests / 15 minutes) and audited.

### Authorization

- **Database layer:** Postgres Row-Level Security (RLS) on all tenant
  tables, enforced with helper functions (`get_my_school_id`,
  `is_super_admin`, `get_my_role`).
- **Application layer:** role guards (`role-guard.tsx`), role-based
  dashboard redirects (`roles.ts`), and tenant context resolution
  (`tenant.ts` - query param `?school=` or subdomain).
- **Server layer:** service-role client (`client.server.ts`) is used only
  in server contexts; public webhook endpoints verify HMAC signatures.

### Tenant isolation

- Every tenant table carries `school_id`.
- RLS policies restrict access to `get_my_school_id()` rows unless the
  caller is a super admin.
- Public read is allowed only for published marketing content
  (testimonials, FAQs, programs, facilities, news, events, blog).
- `database/queries/rls-isolation-check.sql` verifies RLS is enabled,
  policies exist, and the anonymous role cannot read PII tables.

### Database

- 29 applied migrations under `supabase/migrations/` covering the full
  school-management schema (schools, users, students, classes, grades,
  attendance, fees, timetables, news, events, messages, notifications,
  audit_logs, subscriptions, webhooks, and more).
- `supabase/config.toml` links the local project to hosted project
  `srhmfaoyhpvhdfxmagho`.

### Deployment configuration

- No Dockerfile, CI/CD, or cloud configuration exists in the repository.
- Hosted Supabase project is linked locally; web app builds with Vite.
- `public/robots.txt` points the sitemap at a legacy Lovable host.

### Testing infrastructure

- Vitest: 3 unit test files, 24 tests (auth helpers, roles, subscription
  tiers) - previously co-located in `src/lib/`.
- Playwright: 6 e2e files covering enterprise checklist, gallery upload,
  mobile sidebar, mobile swipe-open, and preview-public-site.
- `scripts/smoke.sh`: HTTP smoke checks against a running dev server.
- No CI pipeline exists yet.

---

## 3. Existing technologies

| Layer | Technology |
| --- | --- |
| Language | TypeScript 5.8 (strict) |
| Frontend | React 19, TanStack Router 1.x, TanStack Query 5 |
| Meta-framework | TanStack Start 1.x (Vite 8, Nitro, rolldown) |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI, tw-animate-css |
| Backend | TanStack Start server functions + Nitro |
| Database | Supabase / Postgres with RLS |
| Auth | Supabase Auth |
| Payments | Paystack (inline + webhooks) |
| Charts/Icons | Recharts, Lucide React |
| AI | AI SDK (`ai` + `@ai-sdk/openai-compatible`), NVIDIA-compatible gateway |
| Push | Web Push API + VAPID |
| Testing | Vitest 4, Playwright 1.61 |
| Package managers | npm (primary), bun lockfile present |

---

## 4. Files analyzed

All 727 tracked files were surveyed. Key areas:

- **Config/metadata:** `package.json`, `package-lock.json`, `bun.lock`,
  `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`,
  `playwright.config.ts`, `eslint.config.js`, `components.json`,
  `.prettierrc`, `.prettierignore`, `.gitignore`, `bunfig.toml`,
  `.mcp.json`, `supabase/config.toml`
- **Source:** 300 files under `frontend/src/` (133 routes, 103 components,
  40 lib modules, hooks, contexts, integrations, types)
- **Database:** 29 migrations + RLS isolation check
- **Tests:** 3 unit + 6 e2e files
- **Scripts:** smoke test
- **Docs:** README (archived to `docs/product-spec.md`), routes README
- **Tooling state:** `.claude/`, `.claude-flow/`, `.lovable/`, `.swarm/`,
  `.tanstack/` (agent/IDE state, preserved in place)

---

## 5. Security findings

| # | Finding | Severity | Action |
| --- | --- | --- | --- |
| 1 | `.env` (service-role key, publishable keys) was tracked in git | Critical | Untracked; `.env.example` added; `.env` ignored. **Rotate keys.** |
| 2 | `.mcp.json` embeds a GitHub PAT and Supabase service-role key | Critical | Flagged; convert to environment-variable references before sharing/pushing. **Rotate keys.** |
| 3 | Authentication relies on Supabase Auth + JWT validation middleware | Good | Preserved; document in constitution |
| 4 | Tenant isolation enforced by RLS + `school_id` | Good | Preserved; regression gate in `database/queries/` |
| 5 | Service-role client is server-only | Good | Preserved; import-protection linting active |
| 6 | Public webhook endpoints self-verify HMAC signatures | Good | Preserved |
| 7 | Secrets referenced by name only in `.env.example` | Good | Added |
| 8 | No CI secrets scanning | Medium | Add secret-scanning to CI when CI is introduced |

### Future authorization compatibility

The current role model is the foundation for the enterprise authorization
roadmap:

- **RBAC** - existing roles + dashboard routing map directly
- **ABAC** - attribute checks can layer onto the existing `users` /
  `schools` attributes
- **ReBAC** - relationships (parent_student_map, class/teacher links) are
  already modeled and can feed graph-based policies
- **PBAC** - policy-as-code can be introduced with the Security Engine
- **RLS** - already the isolation boundary; extend policy coverage per
  table as features land
- **Multi-tenancy** - `school_id` + RLS is the current model; hierarchy
  (school -> district -> state) is a phase-03 concern

---

## 6. Migration plan (executed)

1. Create branch `coregrid-scholar-migration` from the backup commit.
2. Repair pre-existing build defects (classes.tsx, styles.css, Tailwind
   plugin).
3. Create the CoreGrid Scholar platform root structure.
4. Move code logically:
   - `src/` -> `frontend/src/`, `public/` -> `frontend/public/`
   - `supabase/` -> `database/supabase/`
   - RLS check -> `database/queries/`
   - unit tests -> `tests/unit/`
   - README spec -> `docs/product-spec.md`
5. Rename identity to CoreGrid Scholar (package, UI, metadata, docs).
6. Create architecture (32 phases), constitution, decisions, progress, and
   `.codex/` systems.
7. Harden secrets handling (untrack `.env`, add `.env.example`).
8. Verify build + unit tests; write deliverables.
9. Commit: "Transform Remix School OS into CoreGrid Scholar foundation".

---

## 7. Risks

- **Historical secrets:** credentials were committed in past revisions;
  rotation is required and is an external action (tracked in
  `progress/blocked.md`).
- **Supabase CLI workflow change:** commands now need
  `--workdir database/supabase`; documented in `database/README.md`.
- **Legacy branding in data:** DB columns/feature flags still use
  `vibeora_*` / "School OS" identifiers; renamed only via forward
  migrations, never by editing history.
- **Platform domains:** `PLATFORM_HOSTS` still lists legacy domains;
  updating them requires DNS cutover coordination.
- **BFF extraction debt:** API routes and services remain co-located in the
  web app; extraction is tracked, not silently deferred.

---

## 8. Recommended improvements

1. Rotate all credentials that ever touched git; move `.mcp.json` secrets
   to environment variables.
2. Introduce CI (build + unit + e2e + secret scan + RLS check) before
   merging further work.
3. Add `.env`-style git hooks (secret pre-commit scanner).
4. Ratify constitution documents and start filling phase files.
5. Add scripts/check script that runs build + tests + RLS check in one
   command.
6. Plan the backend extraction and mobile/agent phases from
   `remaining-work.md`.
