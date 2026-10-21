# SHERIVS-ENVIRONMENT-SEPARATION-AND-DEMO-CONTAMINATION-AUDIT-001

**Mission ID:** SHERIVS-ENVIRONMENT-SEPARATION-AND-DEMO-CONTAMINATION-AUDIT-001  
**Mission type:** Read-only repository, configuration, and architecture inventory  
**Version-target classification:** ACTIVE-V1 inventory only. No V2/V3 implementation. No remediation.  
**Date (authoring):** 2026-10-15  
**Inspected commit:** `b320f6887911eda0084bee12c5afeb5f682573c8`  
**Inspected tree:** `20261c70c2e0d5ad53106d0123a3c7f3050c02cc`  
**Inspected branch at start of inventory:** `cursor/sherivs-migration-runner-index-observation-review-5537`  
**Report branch:** `cursor/sherivs-environment-separation-demo-audit-5537`  
**Verdict:** **PASS WITH CONDITIONS**

This document is an inventory. It prepares a remediation plan. It does not execute remediation.

---

## 1. Executive summary

Sherivs is a single TanStack Start + Vite web application (`frontend/src`) plus an Expo mobile client (`mobile/`). There is no separate production website app, customer app, or console app. Path-based portals (`/admin`, `/teacher`, `/parent`, `/bursar`, `/hq`, `/student`, `/driver`, `/super-admin`, `/command-centre`) share one deployment. Intended production hosts remain `sherivs.com`, `www.sherivs.com`, `app.sherivs.com`, and `console.sherivs.com`. This audit does not add domains, change DNS, or modify Vercel configuration.

Production and staging **code** are the same application. Environment separation is supposed to come from deployment bindings (Supabase project, secrets, payment mode, demo gate). Repository evidence shows that separation is incomplete in several places:

1. The public `/auth` page always renders an “Enterprise demo” button that calls `provisionDemoEnterprise`. The server function refuses unless `ALLOW_DEMO_PROVISIONING === "true"`. The **code default** in `.env.example` is `false`. The **production runtime value is UNKNOWN**. Playwright’s local webServer default is `"true"`.
2. The public `/` route, when no tenant slug is resolved, renders an in-memory Command Centre that uses `tenant:coregrid-demo` and `user:demo-administrator` and never persists. That UI is a confirmed production execution path on any host that `resolveTenantSlug()` treats as a platform host.
3. Authenticated school-admin and teacher intelligence pages mix live Supabase reads with hard-coded scores (`parentScore = 70`, `feeScore = 100`, empty-attendance treated as 100, empty-grades treated as 60). Those pages are production-reachable for signed-in school users.
4. Tenant/host configuration still names `universalschoolos.com`, not `sherivs.com`. `console` is not a reserved subdomain. A request to `console.sherivs.com` would resolve tenant slug `console`.
5. Unscoped apply/query scripts (`scripts/db-apply.mjs`, `scripts/db-run.mjs`, and several management-API scripts) accept `DATABASE_URL` or default `projectRef` to production `nwrflbpbhyiqdptmlccm`. The staging migration runner refuses those fallbacks. This audit did not run any of those scripts.
6. No repository evidence establishes that demo rows exist in production, that they do not exist, or that they have been moved to staging. GATE4 emptiness is **historical** and is **not in this tree**. Current live state of both environments is **UNKNOWN**.

SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain **OPEN**. The migration runner review (`docs/security/rls-prep/SHERIVS-MIGRATION-RUNNER-INDEX-AND-OBSERVATION-COMPLETENESS-REVIEW-001.md`) remains **PASS WITH CONDITIONS**. Catalog observer unused, CHECK comparison textual, grant comparison explicit-tuple only, FORCE RLS incomplete, `securityProof` and `schemaEquivalence` false, live connector and live advisory-lock session unauthorized. This audit is not authorization to connect to a database.

**Highest-priority future remediations (not performed here):**

1. Authorized read-only inspection of production `ALLOW_DEMO_PROVISIONING` and whether identifiers such as `demo-enterprise` / `admin@demo.school` exist as live rows.
2. Hide or remove the public demo button on production hosts; keep provisioning gated and off.
3. Replace hard-coded `parentScore` / `feeScore` / empty-as-perfect fallbacks with live authorized data or an explicit unknown/empty state.
4. Stop shipping the public in-memory Command Centre as the production `/` experience on Sherivs hosts, or require authentication.
5. Align `PLATFORM_HOSTS`, reserved subdomains, and canonical URLs to the intended Sherivs hosts in application source (DNS unchanged).
6. Keep unscoped `DATABASE_URL` apply scripts refused or explicitly environment-pinned; do not run them as part of this mission.
7. Perform a fresh authorized read-only catalog of staging and production before any restore, copy, or deletion.

---

## 2. Exact commit and working-tree status

Recorded immediately before this report was authored, from local git only. No remotes were contacted for this status block.

| Item | Value |
|---|---|
| `git rev-parse HEAD` | `b320f6887911eda0084bee12c5afeb5f682573c8` |
| `git rev-parse HEAD^{tree}` | `20261c70c2e0d5ad53106d0123a3c7f3050c02cc` |
| `git log -1 --oneline` | `b320f68 docs: independent review of index allowlist and observation completeness` |
| Branch at inventory start | `cursor/sherivs-migration-runner-index-observation-review-5537` |
| `git status --porcelain` at inventory start | empty (clean) |
| Working-tree modifications by this mission | this report only (docs) |

Parent review of the migration runner is `docs/security/rls-prep/SHERIVS-MIGRATION-RUNNER-INDEX-AND-OBSERVATION-COMPLETENESS-REVIEW-001.md` on the same commit.

---

## 3. Repository scope inspected

Inspected offline from the local checkout. No PostgreSQL, no Supabase API, no Vercel API, no DNS, no HTTP to application hosts.

### Inspected

- Application constitution and governance: `AGENTS.md`
- Application entry and routing: `package.json`, `vite.config.ts`, `frontend/src/server.ts`, `frontend/src/router.tsx`, `frontend/src/routes/**` (161 route modules)
- Tenant/host resolution: `frontend/src/lib/tenant.ts`, `frontend/src/routes/index.tsx`
- Auth and demo provisioning: `frontend/src/routes/auth.tsx`, `frontend/src/routes/login.tsx`, `frontend/src/routes/super-admin-bootstrap.tsx`, `frontend/src/lib/runtime/scholar/demo-provision.functions.ts`
- Authenticated shell: `frontend/src/routes/_authenticated/route.tsx`
- Public Command Centre: `frontend/src/components/command-centre/command-centre.tsx`
- Authenticated command centre: `frontend/src/routes/_authenticated/command-centre/index.tsx`
- Placeholder disposition registry: `frontend/src/lib/runtime/scholar/placeholder-dispositions.ts`
- Hard-coded score paths: `frontend/src/routes/_authenticated/admin/intelligence.tsx`, `health-certificate.tsx`, `frontend/src/routes/_authenticated/teacher/class-intelligence.tsx`
- Super-admin self-reports: `frontend/src/lib/communication-steward-report.ts`, `frontend/src/lib/academic-intelligence-report.ts`, related `*-report.ts` modules
- Marketing copy: `frontend/src/routes/(site)/-content/site-content.ts`, `pricing-tiers.ts`
- Environment contracts: `.env.example`, `mobile/.env.example`, `infrastructure/deploy/scholar.env.example`, `frontend/src/lib/env.ts`, `frontend/src/lib/providers/provider-credentials.ts`, `scripts/verify-env.ts`
- Supabase clients: `frontend/src/integrations/supabase/client.ts`, `client.server.ts`
- Local Supabase CLI pin: `database/supabase/config.toml`
- Staging runner isolation: `scripts/staging/sherivs-restore/constants.mjs` and README
- Unscoped DB scripts: `scripts/db-apply.mjs`, `scripts/db-run.mjs`, and argv-defaulting management scripts
- CI: `.github/workflows/verify.yml`, `security-batteries.yml`, sibling workflows
- E2E/smoke: `playwright.config.ts`, `scripts/smoke.sh`
- Payments/comms stubs: `frontend/src/lib/payments/paystack-testmode.server.ts`, `frontend/src/lib/communications/vapi-voice.server.ts`
- Prior Sherivs runner/review reports under `docs/security/rls-prep/`
- Historical GATE4 references in those reports (GATE4 file itself is **absent** from this tree)

### Not inspected live (explicitly out of scope)

- Production project `nwrflbpbhyiqdptmlccm`
- Staging project `dvxszhracsjwdancijdc`
- Vercel project bindings, preview protection, and env values
- DNS and certificate state
- Auth users, schools, students, fees, storage objects
- Payment live/test mode actually configured on each host
- Whether `ALLOW_DEMO_PROVISIONING` is set in any deployed environment

---

## 4. Route and module inventory

### 4.1 Application entry points

| Surface | Path | Behavior | Classification |
|---|---|---|---|
| Web SSR/server | `frontend/src/server.ts` | TanStack Start server entry; wraps catastrophic SSR errors | SHARED_APPLICATION_CODE |
| Web router | `frontend/src/router.tsx` | `createRouter` over generated `routeTree.gen` | SHARED_APPLICATION_CODE |
| Vite / Start plugin | `vite.config.ts` | `srcDirectory: ./frontend/src`, alias `@` → `frontend/src`, client import protection for `*.server.ts` | SHARED_APPLICATION_CODE |
| npm scripts | `package.json` | `dev`/`build`/`preview`/`verify`/`test:unit`/`test:e2e` | SHARED_APPLICATION_CODE |
| Mobile | `mobile/` Expo app | Calls web `/_serverFn` endpoints; env via `EXPO_PUBLIC_*` | SHARED_APPLICATION_CODE |
| No `App.tsx` / `main.tsx` / `vercel.json` | — | Confirmed absent from this tree | ENVIRONMENT_SPECIFIC (Vercel config is outside the repo; current binding UNKNOWN) |

There is one web application. Portals are routes, not separately deployed apps.

### 4.2 Public website routes

| Route | File | Current behavior | Data source | Production-reachable | Customer-visible |
|---|---|---|---|---|---|
| `/` | `frontend/src/routes/index.tsx` | Loading → tenant `PublicSchoolSite` if school resolved → else public `CommandCentre` | App context / school row / in-memory Command Centre | Yes | Yes |
| `/coregrid` | `frontend/src/routes/(site)/coregrid.tsx` + `(site)/route.tsx` | Marketing layout and copy | Static `site-content.ts` / pricing tiers | Yes | Yes |
| `/auth` | `frontend/src/routes/auth.tsx` | Sign-in / sign-up / forgot + always-visible Enterprise demo button | Supabase auth + `provisionDemoEnterprise` | Yes (UI always; provisioning gated) | Yes |
| `/login` | `frontend/src/routes/login.tsx` | Redirect to `/auth` | None | Yes | Yes |
| `/reset-password` | `frontend/src/routes/reset-password.tsx` | Password reset | Supabase auth | Yes | Yes |
| `/super-admin-bootstrap` | `frontend/src/routes/super-admin-bootstrap.tsx` | First super-admin claim; locks after one exists | `checkPlatformBootstrap` / `claimFirstSuperAdmin` | Yes (locks after bootstrap) | Public URL; useful only before first super-admin |
| `/privacy`, `/rules`, `/platform`, `/platform/org`, `/blog`, `/blog/$slug`, `/admissions`, `/marketplace`, `/events/$id`, `/news/$id` | matching `frontend/src/routes/*.tsx` | Public/marketing or CMS-backed public pages | Mix of static copy and tenant CMS/school data | Yes | Yes |
| `/foundation-loop`, `/scholar-foundation-loop`, `/reality/$class` | matching route files | Foundation / reality loop surfaces | Server functions / kernel | Yes if routed | Mixed; treat as product surfaces, not demo fixtures |
| `/sitemap.xml` | `frontend/src/routes/sitemap[.]xml.ts` | Sitemap; tenant sites as `/?school=<slug>` | School slugs from data layer | Yes | Yes (machines) |
| `/manifest.webmanifest` | `frontend/src/routes/manifest[.]webmanifest.ts` | PWA manifest | Platform / tenant brand | Yes | Yes |
| `/health.json` | `frontend/src/routes/health[.]json.ts` | Health JSON | Process/local | Yes | Operational |
| `/api/public/webhooks/paystack` | `frontend/src/routes/api/public/webhooks/paystack.ts` | Paystack webhook; signature required | Paystack + `PAYSTACK_SECRET_KEY` | Yes | Not a UI |
| `/api/public/audit/password-reset` | `frontend/src/routes/api/public/audit.password-reset.ts` | Login-failure audit sink | Server audit | Yes | Not a UI |

Canonical `<link>` and `og:url` on `/` still point at `https://universalschoolos.com/` (`index.tsx` 26–28). That is a host-identity defect, not demo business data.

### 4.3 Customer application routes

All sit under `frontend/src/routes/_authenticated/`. The layout (`_authenticated/route.tsx` 41–47) redirects unauthenticated users to `/auth`.

| Portal | Route prefix | Representative files | Typical data source |
|---|---|---|---|
| School admin | `/admin/*` | 58 modules including `dashboard.tsx`, `students.tsx`, `fees.tsx`, `intelligence.tsx`, `health-certificate.tsx` | Supabase / portal-overview server functions; some V2 planned-capability pages; two hard-coded parent scores |
| Teacher | `/teacher/*` | `dashboard.tsx`, `attendance.tsx`, `gradebook.tsx`, `class-intelligence.tsx` | Live class/attendance/grades; fee risk hard-coded 100 |
| Parent | `/parent/*` | `dashboard.tsx`, `fees.tsx`, `attendance.tsx`, `children.tsx` | Tenant-scoped live data |
| Student | `/student/*` | `dashboard.tsx`, `attendance.tsx`, `report-card.tsx` | Tenant-scoped live data |
| Bursar | `/bursar/*` | `dashboard.tsx`, `fee-plans.tsx`, `receipts.tsx`, `financial-intelligence.tsx` | Fees / payments |
| HQ | `/hq/*` | `dashboard.tsx`, `finance.tsx`, `reports.tsx` | Multi-school HQ reads |
| Driver | `/driver/*` | `dashboard.tsx`, `students.tsx` | Transport assignments |
| Shared | `/messages`, `/settings` | `_authenticated/messages.tsx`, `settings.tsx` | Messaging / profile |

### 4.4 Internal console routes

| Portal | Route prefix | Notes |
|---|---|---|
| Super-admin | `/super-admin/*` | Control-plane: tenants, schools, billing, logs, platform-config, self-report intelligence modules |
| Authenticated command centre | `/command-centre` | V1-012 honest substrate: live `super_admin_logs` + kernel outbox; planned-capability for alerts/incidents. Super-admin gated. Distinct from the **public** Command Centre on `/`. |

There is no host-specific console application. `console.sherivs.com` is a production host marker in the staging runner (`scripts/staging/sherivs-restore/constants.mjs` 41–43) but is **not** reserved in `frontend/src/lib/tenant.ts`.

### 4.5 Dashboard implementations

| Dashboard | File | Data source | Notes |
|---|---|---|---|
| Public Command Centre | `frontend/src/components/command-centre/command-centre.tsx` | In-memory React state + pure onboarding/policy engines | See finding F-CC-1 |
| Authenticated command centre | `frontend/src/routes/_authenticated/command-centre/index.tsx` | `loadPlatformAuditTrail`, `loadKernelEventOutboxState` | Honest empty/error; no invented numbers |
| Admin dashboard | `frontend/src/routes/_authenticated/admin/dashboard.tsx` | Portal overview / school data | Covered by V1-011 disposition as real or planned |
| Super-admin dashboard | `frontend/src/routes/_authenticated/super-admin/dashboard.tsx` | Supabase queries | Disposition `AUDITED_REAL` |
| Role dashboards | teacher/parent/student/bursar/hq/driver `dashboard.tsx` | Role-scoped live queries | No demo fixture identifiers found in those files during this audit |

### 4.6 Reusable UI and data-access layers

| Layer | Location | Classification |
|---|---|---|
| shadcn/Radix/Tailwind UI | `frontend/src/components/ui/*` | SHARED_APPLICATION_CODE |
| Portal shell | `frontend/src/components/portal-shell.tsx`, `planned-capability-state.tsx` | SHARED_APPLICATION_CODE |
| Public school site | `frontend/src/components/public/site` | SHARED_APPLICATION_CODE |
| Client Supabase | `frontend/src/integrations/supabase/client.ts` | ENVIRONMENT_SPECIFIC binding; SHARED_APPLICATION_CODE client |
| Service-role server client | `frontend/src/integrations/supabase/client.server.ts` | ENVIRONMENT_SPECIFIC secret; bypasses RLS by design |
| Server functions | `frontend/src/lib/**/*.functions.ts` | SHARED_APPLICATION_CODE |
| Provider registry | `frontend/src/lib/providers/provider-credentials.ts` | SHARED_APPLICATION_CODE (names only) |

### 4.7 Mock API implementations

No `*mock*` application modules were found under the repository root. “Mock” appears in tests, in `frontend/src/lib/integration-connect.ts` (`mockProviderId` for isolated provider tests), and in comments. There is no production mock HTTP API layer.

Self-report modules (communication steward, academic intelligence, scheduling, financial operations, trust fabric) **construct in-process synthetic organizations** to exercise engines and print a proof report. They are not REST mocks. They execute on super-admin routes if those routes are deployed.

### 4.8 Tenant and host behavior

`frontend/src/lib/tenant.ts` 16–40:

- `PLATFORM_HOSTS`: `localhost`, `127.0.0.1`, `universalschoolos.com`, `www.universalschoolos.com`, `app.universalschoolos.com`.
- `RESERVED_SUBS`: `www`, `app`, `api`, `admin`, `dashboard`.
- Resolution order: `?school=<slug>`, else first subdomain label if host is not a platform host and the label is not reserved.
- `sherivs.com` / `www.sherivs.com` / `app.sherivs.com` / `console.sherivs.com` are **absent**.
- `console` is **not reserved**.

Implications (code-level, not live-DNS-proven):

| Host | `resolveTenantSlug()` result | `/` render if unauthenticated |
|---|---|---|
| `localhost` / `universalschoolos.com` / `www` / `app.universalschoolos.com` | `null` | Public Command Centre |
| `sherivs.com` / `www.sherivs.com` (not in PLATFORM_HOSTS; not a 3-label host) | `null` | Public Command Centre |
| `app.sherivs.com` | `null` (reserved `app`) | Public Command Centre |
| `console.sherivs.com` | `"console"` | Looks up school slug `console`; if none, Command Centre still renders (`index.tsx` 133–140: Command Centre when `school` is falsy) |
| `tenant.sherivs.com` | `"tenant"` | Public school site if a school row exists |

Further verification required: live DNS, Vercel host routing, and whether any school slug `console` exists. This audit does not claim those live facts.

---

## 5. Hard-coded and mock-data findings with file/line evidence

Each finding uses exactly one primary classification. “Safe to delete” is never inferred from the words demo/test/sample/mock.

### F-AUTH-1 — Public Enterprise demo button

| Field | Value |
|---|---|
| File / lines | `frontend/src/routes/auth.tsx` 9, 29–47, 269–289 |
| Component / route | `AuthPage` / `/auth` |
| Current behavior | Always renders “Sign in as Enterprise demo”. `handleDemoLogin` calls `provisionDemoEnterprise` then `signInWithPassword` with the returned generated password. |
| Data source | Server function (gated) + Supabase auth |
| Can execute in production | **UI: yes.** Provisioning write: only if `ALLOW_DEMO_PROVISIONING === "true"` on that deployment. Production value **UNKNOWN**. |
| Customer-visible | Yes, on the public sign-in page |
| Callers | Ordinary visitors to `/auth` and `/login` |
| Classification | DEMO_ONLY (button + provisioner); gate is ENVIRONMENT_SPECIFIC |
| Recommended disposition | Restrict the button to an explicit non-production demo mode, or hide it unless the server reports the gate is on. Do not enable the gate in production. Do not delete without human approval (E2E and operator workflows depend on it). |
| Confidence | High (source read) |
| Further verification | Authorized env inspection of production/staging `ALLOW_DEMO_PROVISIONING`; authorized read-only search for `demo-enterprise` / `admin@demo.school` rows |

### F-PROV-1 — Demo enterprise provisioner

| Field | Value |
|---|---|
| File / lines | `frontend/src/lib/runtime/scholar/demo-provision.functions.ts` 19–47, 105–156, 158–182, 204–216, 249–345 |
| Function | `provisionDemoEnterprise` |
| Current behavior | If gate is `"true"`, service-role upserts school `demo-enterprise` (“Demo Enterprise Academy”), nine role emails (`super@universalschool.os`, `admin@demo.school`, …), class `Grade 7A`, student `DEMO-001`, bus `DEMO-BUS-1` / plate `DEMO-2026`, enterprise subscription amount 0. Passwords generated once per run. |
| Data source | Hard-coded fixture identifiers + live DB writes through service role |
| Can execute in production | **Possible**, if the production process has the gate on and a service-role key. Not proven. |
| Customer-visible | Resulting rows would be, if created |
| Callers | `auth.tsx`; unit invariants in `tests/unit/scholar-invariant-*.test.ts`; Playwright when webServer sets the gate |
| Classification | DEMO_ONLY (identifiers + writer); ENVIRONMENT_SPECIFIC (gate) |
| Recommended disposition | Keep gated off in production. Move provisioning to staging-only fixtures after a dedicated demo mode exists. Never treat identifier presence in source as proof of live rows. |
| Confidence | High for code; none for live rows |
| Further verification | Yes — live row search is a separately authorized mission |

### F-CC-1 — Public in-memory Command Centre

| Field | Value |
|---|---|
| File / lines | `frontend/src/components/command-centre/command-centre.tsx` 52–54, 119–174, 193–217, 227–254; mounted from `frontend/src/routes/index.tsx` 137–140 |
| Component / route | `CommandCentre` / `/` |
| Current behavior | Anyone on a non-tenant `/` can step through organization/role/policy “provisioning”. State is React `useState`. `createOrganizationOnboarding` / `createSecurityPolicy` run in-process with `DEMO_TENANT = "tenant:coregrid-demo"` and `DEMO_AUTHOR = "user:demo-administrator"`. No Supabase write observed in this component. |
| Data source | In-memory + pure domain functions |
| Can execute in production | **Yes** (UI). Does not by itself insert schools. |
| Customer-visible | Yes |
| Callers | `index.tsx` when `school` is falsy |
| Classification | DEMO_ONLY presentation of SHARED_APPLICATION_CODE engines |
| Recommended disposition | Do not ship as the production marketing/home experience on Sherivs hosts. Keep engines as shared code. Replace `/` with the marketing site (`/coregrid`) or an authenticated console. |
| Confidence | High |
| Further verification | Confirm production host routing for `/` vs `/coregrid` |

### F-SCORE-1 — Hard-coded parent engagement score 70

| Field | Value |
|---|---|
| File / lines | `frontend/src/routes/_authenticated/admin/intelligence.tsx` 138, 140–146, 164; `frontend/src/routes/_authenticated/admin/health-certificate.tsx` 141–149, 172 |
| Route | `/admin/intelligence`, `/admin/health-certificate` |
| Current behavior | Attendance, academics, fees, and staff scores are derived from live queries. Parent engagement is a constant `70` and is 15% of the overall school-health number. `health-certificate.tsx` comments it as “placeholder”. |
| Data source | Constant, not DB |
| Can execute in production | **Yes**, for authenticated school-admin users |
| Customer-visible | Yes, to school operators (not the anonymous public) |
| Callers | Those route components |
| Classification | SHARED_APPLICATION_CODE with residual DEMO_ONLY metric (primary: SHARED_APPLICATION_CODE; the constant itself is the contamination) |
| Recommended disposition | Read authorized live parent-engagement data, or drop the component and show an explicit “not measured” empty state. Do not keep a silent 70. |
| Confidence | High |
| Further verification | Product decision on whether parent engagement is a V1 metric |

### F-SCORE-2 — Teacher class risk uses feeScore 100 and empty-as-good defaults

| Field | Value |
|---|---|
| File / lines | `frontend/src/routes/_authenticated/teacher/class-intelligence.tsx` 104–109 |
| Route | `/teacher/class-intelligence` |
| Current behavior | `attScore = srate ?? 100` (no attendance → perfect); `grScore = savg ?? 60`; `feeScore = 100` always. Risk = `100 - (0.4 att + 0.35 grade + 0.25 fee)`. Fees never affect risk. |
| Data source | Live attendance/grades + constants |
| Can execute in production | **Yes**, authenticated teachers |
| Customer-visible | Yes, to teachers |
| Classification | SHARED_APPLICATION_CODE with hard-coded fee/empty fallbacks |
| Recommended disposition | Use live fee data or omit fees; treat missing attendance/grades as unknown, not 100/60. |
| Confidence | High |
| Further verification | Confirm bursar/fee tables are the intended source |

### F-SCORE-3 — Empty fee book treated as 100% collection

| Field | Value |
|---|---|
| File / lines | `intelligence.tsx` 129; `health-certificate.tsx` 132 |
| Current behavior | `feeScore = totalBilled > 0 ? collected/billed * 100 : 100` |
| Data source | Live fees when rows exist; constant 100 when none |
| Production-reachable | Yes |
| Classification | SHARED_APPLICATION_CODE (empty-state policy, not a fake revenue chart) |
| Recommended disposition | Prefer “no fee data” over 100% collection. This is optimistic empty-state, not invented revenue, but it inflates school health. |
| Confidence | High |

### F-REPORT-1 — Super-admin self-reports use synthetic organizations

| Field | Value |
|---|---|
| Files / lines | `frontend/src/lib/communication-steward-report.ts` 175–188, 593–600 (“Riverside Institute”, “Northgate Clinic”); `frontend/src/lib/academic-intelligence-report.ts` 41–43 (`tenant-riverside`, `learner-1`) |
| Routes | `/super-admin/communication-steward`, `/super-admin/academic-intelligence` (and sibling self-report routes listed in `placeholder-dispositions.ts` 210–336) |
| Current behavior | Builds in-process orgs/learners, runs engines, renders a proof report. Does not claim these are live tenants. |
| Data source | In-memory fixtures inside report builders |
| Can execute in production | **Yes**, for users who can open super-admin routes |
| Customer-visible | Internal console only, not public marketing |
| Classification | SHARED_APPLICATION_CODE (honest self-report). Synthetic names are scenario fixtures, not customer records. |
| Recommended disposition | Remain shared application code. Label the UI as “engine self-report / synthetic scenario” if not already obvious. Do not delete because names look like schools. |
| Confidence | High |
| Further verification | UX review that a super-admin cannot mistake Riverside for a live tenant |

### F-DISP-1 — Prior fabricated metrics removed (historical, now planned capability)

| Field | Value |
|---|---|
| File / lines | `frontend/src/lib/runtime/scholar/placeholder-dispositions.ts` 47–208 |
| Routes | `/admin/inventory`, `/admin/examinations`, `/admin/visitors`, `/admin/intelligence-ai`, `/admin/intelligence-operations`, `/admin/intelligence-parents`, `/admin/intelligence-students`, `/admin/intelligence-teachers` |
| Current behavior (as documented in-repo) | V2_CLASSIFIED pages now render `PlannedCapabilityState` without invented numbers. Previously documented fakes included “Active agents 8”, “Live attendance 94%”, “Trust score 4.7”, “Avg success score 82”. |
| This audit | Confirmed the registry and the visitors page note (`visitors.tsx` planned-capability copy). Did not re-read every V2 page body line-by-line. |
| Classification | SHARED_APPLICATION_CODE (honest planned state) |
| Recommended disposition | Remain. Residual review of each V2 page body is listed as further verification. |
| Confidence | Medium-high for the registry; medium for unre-read page bodies |
| Further verification | Line-audit each V2_CLASSIFIED page for leftover numeric theatre |

### F-SITE-1 — Marketing capability copy

| Field | Value |
|---|---|
| File / lines | `frontend/src/routes/(site)/-content/site-content.ts` 34–125 |
| Route | `/coregrid` |
| Current behavior | Static capability/governance/runtime narrative. Explicitly “no fake state”. |
| Classification | PRODUCTION_REQUIRED / SHARED_APPLICATION_CODE (product marketing) |
| Recommended disposition | Remain. This is not demo business data. |
| Confidence | High |

### F-TIER-1 — Subscription tier catalog

| Field | Value |
|---|---|
| File | `frontend/src/lib/subscription-tiers.ts` (header 1–30+) |
| Current behavior | Commercial tier matrix still imported by live consumers; documented as deprecated as a decision surface. Feature-access decisions are supposed to use `getMyFeatureAccess`. |
| Classification | SHARED_APPLICATION_CODE (product defaults, not demo students/fees) |
| Recommended disposition | Remain until the financial reconciliation program finishes; not a demo-contamination delete candidate. |
| Confidence | High |

### F-SMOKE-1 — Smoke script probes `?school=demo`

| Field | Value |
|---|---|
| File / lines | `scripts/smoke.sh` 21–29 |
| Current behavior | HTTP status checks against local `BASE` for `/`, `/auth`, and `/?school=` slugs `unknown-slug`, `demo`, `test`. Does not provision. |
| Classification | TEST_ONLY |
| Recommended disposition | Remain as local smoke. `demo` here is a slug probe, not evidence of a live demo school. |
| Confidence | High |

### Distinctions (not classified as demo data)

| Kind | Examples | Why not demo contamination |
|---|---|---|
| UI labels / placeholders | “Search posts…”, “YYYY-MM-DD”, “pk_test_…” hint on settings | Form UX, not business records |
| Product defaults | `ORG_TYPE_OPTIONS`, `SUBSCRIPTION_TIERS`, Nigeria/NGN defaults on Command Centre form | Configuration catalogs |
| Planned-capability copy | Inventory/visitors/intelligence-ai honest empty states | Anti-theatre, not fake metrics |
| Test fixtures | Vitest/Playwright factories, `tests/unit/sherivs-staging-migration-runner.test.ts` staging URL fixtures | TEST_ONLY; fixture host strings are not secrets |
| Historical docs | GATE4 emptiness, prior “dev project” notes | Historical observations, not current live state |

---

## 6. Demo provisioning and seed-script inventory

### 6.1 Demo provisioning

| Item | Detail |
|---|---|
| Gate name | `ALLOW_DEMO_PROVISIONING` |
| Example default | `.env.example` 16: `false`. Comment: never enable on production. |
| Deploy example | `infrastructure/deploy/scholar.env.example` also `false` |
| Enforcement | `demo-provision.functions.ts` 212–216: throw unless value is exactly `"true"` |
| Auth UI | Always offers the action (`auth.tsx` 269–289) |
| Playwright | `playwright.config.ts` 41: `ALLOW_DEMO_PROVISIONING: process.env.ALLOW_DEMO_PROVISIONING ?? "true"` for the **local** webServer only |
| Unit guards | `tests/unit/scholar-invariant-environment-gated.test.ts` and siblings assert the gate regex remains |
| Passwords | Generated; no fixed password constant (V1-008) |
| Writes (if gated on) | `schools`, `auth.users`, `users`, `super_admins`, `classes`, `students`, `parent_student_map`, `transport_buses`, `subscriptions` |
| Live row existence | **UNKNOWN** in production and staging |

### 6.2 Seed / catalog SQL (not demo schools)

Workforce/pricing catalog rows are seeded by migrations and treated as platform catalog data (see `tests/unit/workforce-kinds.test.ts` “seeded database catalog”). Those are **product catalogs**, classification SHARED_APPLICATION_CODE / PRODUCTION_REQUIRED, not demo students.

No standalone `*seed*` application script that inserts Demo Enterprise Academy was found. Provisioning is the TypeScript server function above.

### 6.3 Test fixtures

| Location | Role | Classification |
|---|---|---|
| `tests/e2e/*` | Local Playwright; may provision when gate is on | TEST_ONLY |
| `tests/unit/**` | Isolated fixtures; staging runner tests use fake URLs containing the staging ref | TEST_ONLY |
| `scripts/smoke.sh` | Local HTTP status | TEST_ONLY |
| `playwright.config.ts` gate default `"true"` | Local e2e convenience | TEST_ONLY, with ENVIRONMENT_SPECIFIC risk if copied into a deploy env |

### 6.4 Authentication shortcuts

| Item | Evidence | Classification |
|---|---|---|
| Demo one-click sign-in | `auth.tsx` `handleDemoLogin` | DEMO_ONLY, gated writes |
| `/login` → `/auth` | `login.tsx` 4–7 | PRODUCTION_REQUIRED alias |
| Super-admin bootstrap | `super-admin-bootstrap.tsx` 1–11, 50–64; locks when a super-admin exists | PRODUCTION_REQUIRED first-run; not a demo backdoor after bootstrap |
| Authenticated layout | `_authenticated/route.tsx` 43–46 `getUser()` or redirect | PRODUCTION_REQUIRED |
| Fixed demo passwords | None found in application source | — |

No password-bypass or “skip auth in production” flag was found.

---

## 7. Environment configuration inventory (names only; no values)

Secret **values** are not printed. Classification of current deployed values is UNKNOWN unless a file contains only a non-secret example.

### 7.1 Core application variables

| Name | Consumers (representative) | Expected class | Required | Fallback that could cross environments | Current value known? |
|---|---|---|---|---|---|
| `ALLOW_DEMO_PROVISIONING` | `demo-provision.functions.ts`; Playwright default `"true"` | ENVIRONMENT_SPECIFIC; must be unset/false in production | No (absence = deny) | Playwright default `"true"` if unset **in e2e webServer only**. Production absence is deny. | Example `false`; live UNKNOWN |
| `SUPABASE_URL` | server client, `env.ts` REQUIRED_VARS, health scripts | ENVIRONMENT_SPECIFIC | Yes (app) | Must not point staging app at production project or the reverse | UNKNOWN live |
| `SUPABASE_PUBLISHABLE_KEY` | server + client | ENVIRONMENT_SPECIFIC (public key, RLS-bound) | Yes | Pair must match the URL’s project | UNKNOWN |
| `VITE_SUPABASE_URL` | `client.ts` 35; baked at **build** time | ENVIRONMENT_SPECIFIC | Yes for client | Build-time bake: a production build using a staging URL (or reverse) is a cross-env defect | UNKNOWN |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `client.ts` 36–37 | ENVIRONMENT_SPECIFIC | Yes for client | Same bake risk | UNKNOWN |
| `SUPABASE_SERVICE_ROLE_KEY` | `client.server.ts`; REQUIRED in staging/production classifiers | ENVIRONMENT_SPECIFIC secret | Yes for server writes / demo provision | Service role bypasses RLS; wrong project = wrong universe | UNKNOWN |
| `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` | `.env.example`; some scripts | ENVIRONMENT_SPECIFIC | Documented | `database/supabase/config.toml` hard-pins `nwrflbpbhyiqdptmlccm` | Repo pin = production ref; live Vercel UNKNOWN |
| `SUPABASE_ACCESS_TOKEN` | management-API scripts; CI batteries | ENVIRONMENT_SPECIFIC / INFRA secret | For those scripts | Scripts default project ref to production | UNKNOWN |
| `DATABASE_URL` | `db-apply.mjs`, `db-run.mjs`, `db-apply-one.mjs`, `pg-ssl.mjs`, verify scripts | ENVIRONMENT_SPECIFIC secret | For those scripts | **Unscoped:** whatever URL is set is the target. Staging runner **refuses** this name (`constants.mjs` 30–36) | UNKNOWN; **do not run** |
| `STAGING_DATABASE_URL` / `SHERIVS_RLS_STAGING_URL` | staging runner only | ENVIRONMENT_SPECIFIC staging | For a future authorized restore | Runner refuses production ref and production host markers | UNKNOWN; unused in this mission |
| `COREGRID_DB_CA_CERT` / `STAGING_DB_CA_CERT` | runner TLS / `pg-ssl.mjs` | ENVIRONMENT_SPECIFIC | For verify-full TLS | — | UNKNOWN |
| `COREGRID_DB_INSECURE_TLS` | runner | must stay unset/false | No | Enabling would weaken TLS; not authorized here | UNKNOWN |
| `APP_ENV` / `NODE_ENV` | `scripts/verify-env.ts` 10: `classifyEnvironment(NODE_ENV ?? APP_ENV)` | ENVIRONMENT_SPECIFIC | No | Unknown/empty → **development** (`env.ts` 79–82), which does **not** require service-role in `REQUIRED_VARS` | UNKNOWN |
| `PAYSTACK_SECRET_KEY` | paystack functions, webhook, testmode module | ENVIRONMENT_SPECIFIC secret | For payments | Live vs `sk_test_` must match environment. Testmode module refuses non-`sk_test_` | UNKNOWN |
| `PAYSTACK_BASE_URL` | `.env.example` | ENVIRONMENT_SPECIFIC | No | Default comment `https://api.paystack.co` | UNKNOWN |
| `RESEND_API_KEY` / `RESEND_FROM_ADDRESS` | email adapter | ENVIRONMENT_SPECIFIC | For email | Historical docs mention domain `sherivs.com`; live domain status not rechecked | UNKNOWN |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` / `TWILIO_API_KEY` / `TWILIO_GATEWAY_URL` | telephony | ENVIRONMENT_SPECIFIC | For SMS/voice | — | UNKNOWN |
| `VAPI_API_KEY` | `vapi-voice.server.ts` | ENVIRONMENT_SPECIFIC | No | Stub never places a live Vapi call; present key still returns `provider_not_live` | UNKNOWN |
| `AI_API_KEY` / `AI_GATEWAY_URL` / `AI_DRILL_MODEL` / `NVIDIA_API_KEY` / `NVIDIA_BASE_URL` | AI gateway | ENVIRONMENT_SPECIFIC | For AI | — | UNKNOWN |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` / `VITE_VAPID_PUBLIC_KEY` | web push | ENVIRONMENT_SPECIFIC | For push | Private must stay server-only | UNKNOWN |
| `POSTHOG_PERSONAL_API_KEY` / `POSTHOG_PROJECT_API_KEY` / `POSTHOG_API_URL` | provider-health | ENVIRONMENT_SPECIFIC | No | Analytics ingestion still gated by §19/§20/§21 comments | UNKNOWN |
| `SENTRY_AUTH_TOKEN` | CI/release | INFRA | No | — | UNKNOWN |
| `NEW_RELIC_ACCOUNT_ID` / `NEW_RELIC_LICENSE_KEY` / `NEW_RELIC_USER_KEY` / `NEW_RELIC_API_URL` | provider-health | ENVIRONMENT_SPECIFIC / INFRA | No | Example API host in `.env.example` is EU | UNKNOWN |
| `REDIS_REST_URL` / `REDIS_REST_TOKEN` | optional rate-limit | ENVIRONMENT_SPECIFIC | No | Absent → in-process limiter | UNKNOWN |
| `CLOUDFLARE_API_TOKEN` / `VERCEL_API_TOKEN` / `EXPO_TOKEN` | INFRA only | ENVIRONMENT_SPECIFIC | CI/deploy | — | UNKNOWN |
| `PLAYWRIGHT_BASE_URL` | e2e | TEST_ONLY | No | Default `http://localhost:8080` | local default only |
| Mobile `EXPO_PUBLIC_APP_ENV` | `mobile/src/api/contracts/env.ts` | ENVIRONMENT_SPECIFIC | Yes for mobile | `development` \| `preview` \| `production`; example `development`; example web base `https://app.coregrid.example` | UNKNOWN live |
| Mobile `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | mobile bundle | ENVIRONMENT_SPECIFIC | Yes | Must match the web app’s project | UNKNOWN |
| Mobile `EXPO_PUBLIC_COREGRID_WEB_BASE_URL` | mobile | ENVIRONMENT_SPECIFIC | Yes | Wrong host → wrong server functions | UNKNOWN |

### 7.2 Client fallback that can mix planes

`frontend/src/integrations/supabase/client.ts` 35–37:

```
VITE_SUPABASE_URL || process.env.SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
```

If a server render sees empty Vite defines and a different `SUPABASE_URL` than the client bundle, SSR and browser can target different projects. Classification: ENVIRONMENT_SPECIFIC risk. Live occurrence: UNKNOWN.

### 7.3 Scripts that default to production (do not run)

| Script | Default | Risk |
|---|---|---|
| `scripts/db-apply.mjs` | `process.env.DATABASE_URL` only; no project pin | Applies **all** migrations to whatever URL is set |
| `scripts/db-run.mjs` / `db-apply-one.mjs` | `DATABASE_URL` only | Same |
| `scripts/db-apply-mgmt.mjs` | `argv[2] ?? "nwrflbpbhyiqdptmlccm"` | Production project ref default |
| `scripts/db-run-mgmt.mjs` | `argv[3] ?? "nwrflbpbhyiqdptmlccm"` | Same |
| `scripts/apply-approved-v1-migrations.mjs` | `argv[2] ?? "nwrflbpbhyiqdptmlccm"` | Same |
| `scripts/apply-canonical-mr100.mjs` | `argv[2] ?? "nwrflbpbhyiqdptmlccm"` | Same |
| `scripts/apply-canonical-hardening.mjs` | positionals default production | Same |
| `scripts/apply-foundation-migration.mjs` | `argv[2] ?? "nwrflbpbhyiqdptmlccm"` | Same |
| `scripts/apply-foundation-from-env-local.mjs` | hard-coded production ref | Same |
| `scripts/restore-recovery-drill.mjs` | `argv[2] ??` production | Writes a drill table on canonical DB when run |
| `scripts/verify-recovery-drill.mjs` | `DEFAULT_PROJECT_REF` production | Read/verify against canonical |
| `scripts/verify-neutral-tenant-primitives.mjs` | `argv[2] ??` production | Same |
| `scripts/run-rls-isolation-check.mjs` | hard-coded production | Same |
| `scripts/probe-foundation-database.mjs` | hard-coded production | Same |
| `scripts/assess-foundation-conformance.mjs` | hard-coded production | Same |
| `scripts/exercise-foundation-loop.mjs` | hard-coded production | Same |
| `scripts/inspect-supabase-github.mjs` | hard-coded production | Same |
| `scripts/generate-database-types.mjs` | `CANONICAL_PROJECT_REF` production | Types from production |
| `database/supabase/config.toml` | `project_id = "nwrflbpbhyiqdptmlccm"` | Local Supabase CLI pin is production |

**Contrast:** `scripts/staging/sherivs-restore/` pins staging `dvxszhracsjwdancijdc`, refuses production ref, refuses `DATABASE_URL` / `SUPABASE_URL` / service-role / access-token fallbacks, refuses `www/app/console.sherivs.com` as production host markers. Live execute remains unauthorized.

### 7.4 CI / Vercel / domains

| Item | Evidence | Classification | Known? |
|---|---|---|---|
| `verify.yml` | typecheck, unit, registry, drift, neutrality, secret-scan, production **build** — no live DB | SHARED_APPLICATION_CODE CI | Known as workflow text |
| `security-batteries.yml` | Live-credential-gated batteries against the **canonical** database; restore drill excluded from PRs because it writes | ENVIRONMENT_SPECIFIC; defaults to production/canonical | Workflow text known; this mission did not trigger it |
| Other workflows | `release.yml`, `drift-watch.yml`, `infrastructure-*.yml` | ENVIRONMENT_SPECIFIC | Text only |
| `vercel.json` | **Absent** | ENVIRONMENT_SPECIFIC config lives in Vercel, not this repo | UNKNOWN |
| Preview protection | Not in repo | ENVIRONMENT_SPECIFIC | UNKNOWN; this mission must not disable it |
| Domains | Intended: `sherivs.com`, `www.sherivs.com`, `app.sherivs.com`, `console.sherivs.com`. Code still cites `universalschoolos.com`. | ENVIRONMENT_SPECIFIC + SHARED_APPLICATION_CODE defect | DNS live state UNKNOWN |

### 7.5 Payment test vs live

| Surface | Behavior | Classification |
|---|---|---|
| `paystack-testmode.server.ts` | Refuses any secret that does not start with `sk_test_` | TEST_ONLY / ENVIRONMENT_SPECIFIC test rails |
| `paystack.functions.ts` / webhook | Uses `PAYSTACK_SECRET_KEY` without a test-prefix check in the snippet read | ENVIRONMENT_SPECIFIC; live vs test is whichever key is bound |
| School settings public key | Zod allows `pk_test_` or `pk_live_` | ENVIRONMENT_SPECIFIC per-school setting |

Whether production currently holds a live or test Paystack key is UNKNOWN.

---

## 8. Production / staging boundary assessment

### 8.1 What the repository defines

| Plane | Intended identity | How the repo treats it |
|---|---|---|
| Shared application source | One tree | Correct: one `frontend/src` |
| Production database | Project ref `nwrflbpbhyiqdptmlccm` | Named in `.env.example` comment, `config.toml`, many scripts, runner `PRODUCTION_PROJECT_REF` |
| Staging database | Project ref `dvxszhracsjwdancijdc` | Named only in staging runner + its tests + Sherivs reports |
| Production hosts | `sherivs.com`, `www`, `app`, `console` | Named as **refuse** markers in the runner; **not** used as app `PLATFORM_HOSTS` |
| Staging hostname | None (do not create one) | No staging host in app tenant resolver |
| Demo provisioning | Off everywhere unless explicitly enabled | Code default off; UI still exposed; Playwright local default on |
| Migration execution | Staging runner vs unscoped apply scripts | Two different safety postures |

### 8.2 Proposed environment boundary (design only; not implemented)

This is a proposed control plane. It does not create resources, DNS, or Vercel changes.

| Resource | Production | Staging | Shared source |
|---|---|---|---|
| Application source | Same commit promoted after gates | Same commit, separate deploy | `frontend/`, `mobile/`, `packages/` |
| Deployment | Existing Sherivs production hosts only | Existing isolated staging project / preview; **no new hostname created by this mission** | — |
| Database | `nwrflbpbhyiqdptmlccm` only | `dvxszhracsjwdancijdc` only | Migrations in git; apply via environment-pinned runners |
| Secrets | Production-only store | Staging-only store | Names in `.env.example` |
| `SUPABASE_*` / `VITE_SUPABASE_*` | Production project pair, baked for production builds | Staging project pair, baked for staging builds | No silent fallback across stores |
| `DATABASE_URL` | Production DBA channel only; never a script default | Staging DBA channel as `STAGING_DATABASE_URL` only | Unscoped scripts should refuse or require an explicit pin in a future remediation |
| `ALLOW_DEMO_PROVISIONING` | unset / `false` | may be `true` only on isolated staging | Server function remains fail-closed |
| Paystack | `sk_live_` / `pk_live_` only | `sk_test_` / `pk_test_` only | Testmode module already refuses live keys |
| Email / SMS / storage | Production providers and buckets | Staging providers and buckets | Adapters |
| Auth | Production GoTrue / users | Staging GoTrue / users | No shared user directory |
| Demo fixtures | None | Optional gated provisioner or SQL fixtures | Provisioner source may remain, execution must not |
| Seed / catalog SQL | Product catalogs only | Product catalogs + optional demo school | Never classify catalog seeds as demo-deletable |
| CI `verify.yml` | Build/test only | Same | SHARED |
| CI live batteries | Canonical/production only under existing human-gated workflow | Separate staging battery, not yet present | Do not point staging batteries at production |
| Migration runner | Must keep refusing production | Only authorized path for the 71-file restore | `scripts/staging/sherivs-restore/` |
| UI feature flags | No public demo button; no in-memory Command Centre as `/` | Demo button allowed if gate on | Flag evaluated server-side |
| Storage | Production buckets | Staging buckets | No copy in this mission |
| DNS | Existing four hosts only | No new host | — |

### 8.3 Boundary defects visible in source

1. App host allowlist is still Universal School OS, not Sherivs.
2. Unscoped apply scripts can target production by default or by ambiguous `DATABASE_URL`.
3. Demo UI is compiled into every environment.
4. Client Vite bake can freeze the wrong project into a deploy.
5. `classifyEnvironment` unknown → `development` weakens `verify-env` required-secret checks.
6. CI security batteries are documented against the canonical (production) database.
7. No in-repo Vercel project split is visible.

### 8.4 What this assessment does **not** claim

- That staging is empty today.
- That production contains Demo Enterprise Academy.
- That demo content has been copied to staging.
- That Vercel preview protection is on or off.
- That SHERIVS-001/002/003 are resolved.

---

## 9. Resource classification table

| ID | Resource | Primary class | Notes |
|---|---|---|---|
| R1 | TanStack Start app / portals | SHARED_APPLICATION_CODE | One app, many routes |
| R2 | Marketing `/coregrid` copy | PRODUCTION_REQUIRED | Not fake metrics |
| R3 | `/auth` demo button | DEMO_ONLY | Always compiled |
| R4 | `provisionDemoEnterprise` | DEMO_ONLY | Writes only if gated |
| R5 | `ALLOW_DEMO_PROVISIONING` | ENVIRONMENT_SPECIFIC | Default deny |
| R6 | Public Command Centre + `DEMO_TENANT` | DEMO_ONLY | In-memory; production-reachable UI |
| R7 | Authenticated `/command-centre` | SHARED_APPLICATION_CODE | Honest live/empty |
| R8 | `parentScore = 70` | SHARED_APPLICATION_CODE (contaminated metric) | Production-reachable |
| R9 | Teacher `feeScore = 100` | SHARED_APPLICATION_CODE (contaminated metric) | Production-reachable |
| R10 | Empty fees → 100% collection | SHARED_APPLICATION_CODE | Optimistic empty state |
| R11 | V2 planned-capability pages | SHARED_APPLICATION_CODE | Do not delete as “demo” |
| R12 | Super-admin self-reports (Riverside / Northgate / tenant-riverside) | SHARED_APPLICATION_CODE | Synthetic engine proofs |
| R13 | Subscription / workforce catalogs | PRODUCTION_REQUIRED | Product data |
| R14 | Playwright gate default `"true"` | TEST_ONLY | Local webServer only |
| R15 | `scripts/smoke.sh` `?school=demo` | TEST_ONLY | Slug probe |
| R16 | Staging restore runner | ENVIRONMENT_SPECIFIC | Staging pin; live execute unauthorized |
| R17 | `scripts/db-apply.mjs` family | ENVIRONMENT_SPECIFIC | Unscoped; production-capable |
| R18 | Management scripts defaulting `nwrflbpbhyiqdptmlccm` | ENVIRONMENT_SPECIFIC | Production default |
| R19 | `database/supabase/config.toml` project_id | ENVIRONMENT_SPECIFIC | Production pin |
| R20 | Paystack testmode module | TEST_ONLY | Refuses live keys |
| R21 | Vapi stub | SHARED_APPLICATION_CODE | Never live-calls |
| R22 | Super-admin bootstrap | PRODUCTION_REQUIRED | First-run lock |
| R23 | `PLATFORM_HOSTS` / canonical universalschoolos URLs | SHARED_APPLICATION_CODE (host defect) | Needs Sherivs alignment, no DNS change here |
| R24 | Vercel project / preview / env values | ENVIRONMENT_SPECIFIC | UNKNOWN (not in repo) |
| R25 | Production DB rows (demo org, users, fees, …) | UNKNOWN_REQUIRES_REVIEW | No live observation this mission |
| R26 | Staging DB rows / emptiness | UNKNOWN_REQUIRES_REVIEW | GATE4 historical and absent from this tree |
| R27 | Historical GATE4 catalog | UNKNOWN_REQUIRES_REVIEW | Prior report only; not current |
| R28 | `security-batteries.yml` canonical DB jobs | ENVIRONMENT_SPECIFIC | Must not be treated as staging |
| R29 | Mobile Expo env | ENVIRONMENT_SPECIFIC | Example host is not Sherivs |
| R30 | SHERIVS-001 / 002 / 003 | UNKNOWN_REQUIRES_REVIEW | Remain OPEN |
| R31 | Dedicated staging-only fixture pack (SQL or gated provisioner bound to `dvxszhracsjwdancijdc`) | STAGING_FIXTURE (intended) / **absent today** | No controlled staging-only fixture exists in this tree. `provisionDemoEnterprise` is DEMO_ONLY today because the gate is environment-agnostic. After isolation it should become a STAGING_FIXTURE, not a production path. |

**STAGING_FIXTURE occupancy:** empty in the current repository. Do not invent a staging fixture by copying production rows. Create one only after the section 14 staging inspection and a separate authorized mission.

Nothing in this table is approved for deletion solely because its name contains demo, test, sample, or mock.

---

## 10. Confirmed findings versus unknown live state

### Confirmed in this repository (code / docs)

- Single-app architecture and path-based portals.
- Public demo button and gated provisioner with fixed fixture identifiers.
- Public in-memory Command Centre on `/`.
- Hard-coded parent score 70 and teacher feeScore 100.
- Host allowlist still `universalschoolos.com`.
- `console` not reserved.
- Unscoped and production-defaulting DB scripts exist.
- Staging runner refuses production and `DATABASE_URL`.
- Placeholder-disposition program removed a documented set of fabricated admin metrics and replaced them with planned-capability or live reads.
- Playwright local default enables demo provisioning.
- GATE4 catalog file is not in this tree; prior reports call it historical (timestamp cited elsewhere as 2026-10-14T18:34:55Z on another branch).
- SHERIVS-001/002/003 are still described as OPEN in the current runner review.
- Runner `securityProof` / `schemaEquivalence` remain false per that review.

### Unknown live state (not established)

- Whether production or staging currently has `ALLOW_DEMO_PROVISIONING=true`.
- Whether `demo-enterprise`, `admin@demo.school`, `DEMO-001`, or `DEMO-BUS-1` exist as rows in either database.
- Whether any customer-visible production page is rendering those rows.
- Whether staging is empty, partially restored, or contaminated.
- Whether demo data was copied from production to staging (no evidence in this tree that a copy ran).
- Vercel env bindings, preview protection, and which Supabase project each host uses.
- Live Paystack mode, Resend domain status, Twilio numbers, storage bucket contents.
- Whether a school slug `console` exists.
- Effective RLS / grants / FORCE RLS on either database (runner limitations + no connection).

### Must not be inferred

- Identifier in source ≠ row in production.
- Old GATE4 empty catalog ≠ staging empty today.
- Provisioner existence ≠ provisioner has been executed.
- “Demo” in a name ≠ safe to delete.

---

## 11. Demo-contamination risks

| Risk | What can appear | Execution path | Recommendation (future) |
|---|---|---|---|
| Public demo CTA | Demo product narrative + one-click provision | **Confirmed production UI path.** Writes **possible** if gate on | Hide button unless server says gate on; keep production gate off |
| Demo school/users/student/bus/fees | Fake school and people | **Possible** production write path; live rows UNKNOWN | Inspect live; if present, human-approved isolation or removal **after** backup/authorization — not in this mission |
| In-memory Command Centre | Fake orgs/roles/policies, demo tenant IDs | **Confirmed production UI path**; not DB | Replace `/` on Sherivs hosts with marketing or auth |
| Fake / inflated health scores | Parent 70; fees 100 when empty; teacher fees always 100; missing attendance as 100 | **Confirmed production path** for signed-in staff | Live data or explicit unknown |
| Removed invented AI/ops/parent/student/teacher theatre | Previously “94% attendance”, “412 parents”, etc. | **Historically present**; registry says removed. Residual page-body review incomplete | Remain planned-capability; re-read pages |
| Super-admin Riverside / Northgate | Synthetic org names in reports | **Confirmed** for super-admin users | Keep as labeled self-report |
| Marketing capabilities | Platform narrative | Production marketing, not fake revenue | Remain |
| Sample API responses | None found as a mock server | N/A | — |
| Fake notifications / activity feeds | Former command-centre theatre documented as removed (`command-centre/index.tsx` 31–40) | Authenticated replacement is live/empty | Remain |
| Mock charts | Not found as a dedicated chart fixture after V1-011 | Residual review | Line-audit remaining dashboards |
| `?school=demo` | Would show a school named `demo` **if** such a row exists | Possible; live row UNKNOWN | Inspect live slugs; smoke.sh does not create them |
| Cross-env apply | Migrations or drills against production | Scripts exist; **not run** | Pin/refuse; authorized operators only |
| Vite bake mismatch | Staging UI talking to production API or reverse | Possible; live UNKNOWN | Per-environment build secrets |
| Host mismatch | `universalschoolos.com` canonical; `console` as tenant | Confirmed in code | Align source hosts; do not change DNS here |

No finding in this table is a claim that the production database currently stores demo records.

---

## 12. Recommended remediation plan, ordered by risk

**Do not execute these items in this mission.** Order is risk, not calendar.

### R0 — Preconditions (blocking for any write)

1. Written human authorization naming the target environment.
2. Fresh authorized **read-only** inventory of production and staging (section 14).
3. Confirm SHERIVS-001/002/003 still OPEN and that runner live execute is still unauthorized until its conditions clear.
4. No copy of production data into staging as a “cleanup”.
5. No deletion of users/orgs/storage without a named backup and approval.

### R1 — Production execution-path contamination (application)

1. Verify production `ALLOW_DEMO_PROVISIONING` is not `"true"`. If it is, turn it off under change control (separate authorized ops mission).
2. Stop rendering the Enterprise demo button on production hosts (server-flag or host allowlist). Keep the provisioner code until a staging demo mode exists.
3. Replace `parentScore = 70` and teacher `feeScore = 100` / empty-as-perfect fallbacks.
4. Do not use public Command Centre as Sherivs `/`. Prefer `/coregrid` marketing or authenticated entry.
5. Add `console` (and intended Sherivs platform hosts) to resolver reserved/platform lists in source. Do not add DNS.

### R2 — Environment identity

1. Change `PLATFORM_HOSTS` and canonical/og URLs from `universalschoolos.com` to the existing Sherivs hosts in application source.
2. Confirm Vercel host → project bindings in an authorized console review (no config change here).
3. Ensure production and staging Vite builds bake matching `VITE_SUPABASE_*` pairs.
4. Set explicit `APP_ENV=production` / `staging` so `verify-env` cannot classify as development.

### R3 — Script and CI blast radius

1. Future remediation: unscoped `DATABASE_URL` apply scripts refuse production unless an explicit `--confirm-production-ref=` is supplied, **or** remain DBA-only with documented danger. Do not “fix” them by pointing at staging implicitly.
2. Management-API scripts should not default `argv` to `nwrflbpbhyiqdptmlccm`.
3. Keep `security-batteries.yml` recognized as canonical/production. Do not run it as a staging probe.
4. Keep the staging runner as the only restore path; do not enable live execute here.

### R4 — Demo data lifecycle (only after R0 live inventory)

1. If production has demo rows: decide retain (wrong), quarantine, or approved delete. This audit does not choose.
2. If staging should host a demo: provision **only** there with the gate on, isolated auth, test payments.
3. Do not move production demo rows to staging as a migration of contamination.
4. Do not enable demo provisioning in production to “test the cleanup”.

### R5 — Residual review

1. Line-audit remaining dashboards and V2 pages for leftover numeric theatre.
2. Label super-admin self-reports as synthetic.
3. Confirm mobile `EXPO_PUBLIC_*` targets the same environment as the web host.
4. Re-read Paystack live vs test keys per environment.

---

## 13. Explicit list of actions NOT performed

- No PostgreSQL or Supabase access.
- No network requests to application, payment, email, or cloud-control APIs for inventory purposes.
- No SQL executed.
- No migrations applied or generated.
- No staging restore.
- No production or staging modification.
- No deploy.
- No secret, environment variable, DNS, or credential change.
- No deletion of users, organizations, demo records, or storage objects.
- No copy of production data into staging.
- No enabling of demo provisioning.
- No enabling of live migration execution.
- No application behavior change.
- No canonical migration SQL change.
- No Vercel configuration change.
- No preview-protection change.
- No new hostname.
- No deletion script or migration script produced.
- No claim that production demo records exist.
- No claim that demo content has moved to staging.
- No claim that SHERIVS-001, SHERIVS-002, or SHERIVS-003 is resolved.
- No secret values printed.

Git commit/push of **this documentation** is a source-control action for the inventory deliverable. It is not a production, staging, or database change.

---

## 14. Requirements for future authorized read-only environment inspections

Each environment needs its own written authorization. Read-only. No apply, no restore, no delete.

### 14.1 Production (`nwrflbpbhyiqdptmlccm` and Sherivs hosts)

Evidence required:

1. Deployed env names (not values) for `ALLOW_DEMO_PROVISIONING`, `SUPABASE_URL` project ref, `APP_ENV`/`NODE_ENV`, Paystack key class (`sk_live_` vs `sk_test_` prefix only), Resend domain status.
2. Vercel project: which git branch, which hosts, preview protection, which env group.
3. Host headers: `sherivs.com`, `www`, `app`, `console` → which deployment.
4. Read-only existence checks (boolean, minimized): school slug `demo-enterprise`; emails `admin@demo.school` / `super@universalschool.os`; admission `DEMO-001`; bus `DEMO-BUS-1`; slug `console`; slug `demo`.
5. Counts only: schools, auth users, students — no PII dumps.
6. Storage bucket list (names), not object download.
7. RLS / policy / FORCE RLS catalog if and only if a later authorized observer exists; do not use the unused `CATALOG_OBSERVE_SQL` as if it were complete (runner review conditions).

### 14.2 Staging (`dvxszhracsjwdancijdc`)

Evidence required:

1. Fresh emptiness/non-emptiness catalog. **Do not reuse GATE4.**
2. Same identifier booleans as production (to detect accidental copy or prior provision).
3. Confirm restore has **not** been assumed from old reports.
4. Confirm `STAGING_DATABASE_URL` is the only DSN and does not equal production.
5. Confirm staging runner live connector / advisory lock remain unauthorized until separately approved.

### 14.3 What the observer must emit

Present arrays (including empty) for every class `catalogBlocksCompletion` requires. A missing array is incomplete, not “zero extras”. See `SHERIVS-MIGRATION-RUNNER-INDEX-AND-OBSERVATION-COMPLETENESS-REVIEW-001.md`.

---

## 15. Dependencies on migration-runner and application-security work

| Dependency | Status | Effect on this audit |
|---|---|---|
| Index/observation completeness review | PASS WITH CONDITIONS at `b320f68` | Catalog observer unused; cannot treat any old catalog as current |
| CHECK comparison textual | Open condition | Schema equivalence not proven |
| Grant comparison = explicit GRANT tuples | Open condition | Effective privileges UNKNOWN |
| FORCE RLS comparison incomplete | Open condition | UNKNOWN |
| `securityProof` / `schemaEquivalence` | false | Do not claim staging matches source |
| Live connector / live advisory lock | Not authorized | This audit must not connect |
| SHERIVS-001 / 002 / 003 | OPEN | Application RLS findings remain open; this inventory does not close them |
| Unscoped `db-apply.mjs` | Unchanged; must stay unused here | Production apply risk remains |
| V1-011 placeholder dispositions | In tree | Reduces but does not eliminate contamination (F-SCORE-*) |
| V1-008 generated demo passwords | In tree | Removes fixed passwords; does not remove fixture identifiers or the public button |

A future restore does not by itself remove production demo UI. Application remediation (section 12 R1) is a separate track from staging schema restore.

---

## 16. Recommended UI/UX readiness gate

Do not treat the product as UI-ready for Sherivs production customers until **all** of the following are true. This gate is a recommendation, not an implementation.

1. **Host identity:** `/` and document canonical/og URLs name Sherivs hosts; `PLATFORM_HOSTS` and reserved subs match `sherivs.com` / `www` / `app` / `console`. DNS unchanged by the engineering change; ops already owns the four hosts.
2. **No public demo provision:** `/auth` does not offer Enterprise demo on production. Server gate is false/unset and verified by authorized env inspection.
3. **No in-memory command theatre on `/`:** Unauthenticated Sherivs `/` is marketing (`/coregrid`) or sign-in, not `tenant:coregrid-demo`.
4. **No silent fake scores:** Admin/teacher health and risk components either use authorized live data or an explicit “not measured” state. No `70` / `100` placeholders.
5. **Honest empty states:** V2 pages remain planned-capability; V1 pages show empty, not invented compliance.
6. **Self-reports labeled:** Super-admin Riverside/Northgate reports cannot be mistaken for tenants.
7. **Tenant resolution:** `console.sherivs.com` is platform, not school slug `console`, unless a real tenant is intentionally named that (it should not be).
8. **Payments:** Production UI never initializes Paystack with test keys; staging never uses live keys.
9. **Environment proof:** Authorized read-only inspection (section 14) recorded for both environments after the code changes land.
10. **Security:** SHERIVS-001/002/003 still tracked; UI-ready does not mean RLS-ready.

Until that gate is evidenced, treat public `/` and `/auth` as **not ready** for a contamination-free Sherivs launch narrative.

---

## 17. Outstanding risks and confidence levels

| Risk | Confidence | Severity |
|---|---|---|
| Production demo button is customer-visible | High | High (UX + accidental provision if gate on) |
| Production gate is actually `"true"` | None (UNKNOWN) | Critical if true; unknown until inspected |
| Demo rows already exist in production | None (UNKNOWN) | High if true |
| Demo rows already exist in staging / were copied | None (UNKNOWN) | Medium; do not assume empty |
| Public Command Centre ships on Sherivs `/` | High for code path; medium for actual host mapping | Medium-high |
| `parentScore` / `feeScore` distort operator decisions | High | Medium-high (canonical-truth violation) |
| `console` slug collision | High for code; live slug UNKNOWN | Medium |
| Host allowlist still Universal School OS | High | Medium (SEO/identity + tenant resolution) |
| Unscoped apply script hits production | High that the script can; not run here | Critical if executed |
| Vite bake / client-server URL split | Medium (code allows); live UNKNOWN | High if present |
| `classifyEnvironment` → development | High for helper; usage is `verify-env`, not the running app gate | Medium |
| Residual numeric theatre on unread portal pages | Medium | Medium |
| CI batteries touch canonical DB | High (workflow text) | High if triggered accidentally |
| Runner conditions + OPEN SHERIVS-001/002/003 | High | Blocks any “staging is restored / production is clean” claim |
| Secret leakage in this report | High that names only were recorded | — |

**Overall confidence in the inventory of source and config references:** high.  
**Overall confidence in live production/staging data and deploy bindings:** none — UNKNOWN.

---

## Verdict

**PASS WITH CONDITIONS**

The repository inventory is complete enough to plan remediation. It is not complete enough to execute remediation, declare either database clean, or close security findings.

Conditions:

1. Live environment variable values and Vercel bindings remain UNKNOWN.
2. Live row presence for demo identifiers remains UNKNOWN.
3. GATE4 is historical and not in this tree; staging emptiness is UNKNOWN.
4. Not every one of 161 route modules received a full numeric-theatre re-read; V2 registry plus three confirmed score sites are the evidenced core.
5. SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain OPEN.
6. Migration-runner live catalog/lock/execute remain unauthorized.
7. This document must not be cited as proof that demo data has moved to staging.

---

## Required closing statements

No database or network was contacted.  
No staging restoration occurred.  
No production resources were changed.  
No demo records were copied or deleted.  
No secrets were exposed.  
SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain OPEN.

Inventory only. No remediation executed.
