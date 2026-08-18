# CoreGrid Scholar - Remaining Work

Future implementation roadmap. Phases reference
`architecture/phase-XX-*.md` files (content pending).

## Immediate follow-ups (before next release)

1. **Rotate credentials** that existed in git history (Supabase service
   role, `.mcp.json` GitHub token, Supabase keys in `.mcp.json`).
2. **Move `.mcp.json` secrets to environment variables** so the file can be
   shared safely.
3. **Ratify constitution** - replace placeholders in `constitution/` and
   record ratification in `decisions/`.
4. **Add CI** - build + unit tests + e2e + secret scan + RLS isolation
   check on every PR (`.codex/pull-request-policy.md`).
5. **Single verification command** - add `scripts/check` (PowerShell +
   bash) that runs build, unit tests, and RLS checks.
6. **Fill phase 01 (Foundation)** and **phase 02 (Identity)** content in
   `architecture/`.

## Phase-by-phase roadmap

| Phase | Deliverable | Depends on |
| --- | --- | --- |
| 01 Foundation | CI/CD, observability, error tracking, deployment config in `infrastructure/` | now |
| 02 Identity | Platform identity model, SSO/OIDC, account lifecycle | 01 |
| 03 Multi-Tenancy | Tenant hierarchy (school -> district -> state), tenant provisioning API | 02 |
| 04 Education Reality Engine | Curriculum, assessment, learning-objective model | 03 |
| 05 Core Application Runtime | Application runtime foundation, module boundaries, shared kernel | 01, 02 |
| 06 Workspace Engine | Unified workspace for staff/student workflows | 04 |
| 07 AI Agent System | Platform agents with scopes, audit trails (see `constitution/ai-agent-policy.md`) | 02, 08 |
| 08 Security Engine | RBAC/ABAC/ReBAC/PBAC policy engine, security audit hardening | 02, 03 |
| 09 Security Trust Fabric | Trust, attestation, key management, secure communication | 08 |
| 10 Communication Platform | Messages/notifications/push as platform services | 01 |
| 11 Academic Intelligence | Academic record, assessment, and progression intelligence | 04 |
| 12 Scheduling Intelligence | Timetable and resource scheduling engine | 04, 05 |
| 13 Financial System | Extract Paystack integration, billing, invoicing | 01, 03 |
| 14 Data Platform | Data access layer, realtime contracts, backup/restore guarantees | 01 |
| 15 Hardware Integration | Biometrics, geofence, QR/face attendance as a service | 08 |
| 16 Digital Twin | Formalize digital-twin functions into an engine | 04, 14 |
| 17 Automation Engine | Workflow/automation for school operations | 01 |
| 18 Analytics Intelligence | Reporting, dashboards, data warehouse readiness | 14 |
| 19 Command Centre | Unified operations dashboard and control plane | 06, 10 |
| 20 Government Education Cloud | District/state rollups, compliance | 03, 18 |
| 21 Global Cloud Fabric | Multi-region cloud fabric and edge distribution | 14, 31 |
| 22 Mobile Platform | Mobile app (see `mobile/`) | 10, 15 |
| 23 Web Platform | Web platform ownership (current app) | now |
| 24 CoreGrid Experience & Design Intelligence | Design language, component system, accessibility, UX intelligence | 23 |
| 25 Institutional Onboarding, Administration & Workforce Identity Platform | School onboarding flows, administration console, staff identity lifecycle | 02, 03 |
| 26 AI Intelligence Layer | Gateway, model routing, evals, cost controls | 07 |
| 27 Marketplace | Third-party app/school-content marketplace | 28 |
| 28 Developer Platform | Public API, webhooks, SDKs | 01, 14 |
| 29 CoreGrid Integration | CoreGrid ecosystem protocols | 28 |
| 30 Globalization | i18n, l10n, multi-currency, regional compliance | 03, 13 |
| 31 Enterprise Scale | High availability, sharding, multi-region | 01, 14 |
| 32 Future Evolution | Long-term platform evolution governance | all |

## Backend extraction plan (ADR-002 follow-up)

Current BFF co-location in `frontend/src/`:

- `frontend/src/routes/api/**` - HTTP API routes
- `frontend/src/lib/*.functions.ts` - server functions
- `frontend/src/integrations/supabase/client.server.ts` - service-role client
- `frontend/src/server.ts`, `frontend/src/start.ts` - SSR entry

Extraction criteria (do not extract before these are met):

- A second consumer exists (mobile, marketplace, or external client).
- Load/scale testing shows the web runtime is the bottleneck.
- Observability (logging, tracing, error capture) exists for the extracted
  service.

When extracting, move modules to `backend/` per
`decisions/architecture-decisions.md` (ADR-002) and update the build
pipeline with verification.

## Authorization roadmap (SEC-004)

- **Now:** roles + dashboard routing + RLS (current model).
- **Phase 02/03:** identity model, tenant hierarchy, claim structure.
- **Phase 08:** policy engine supporting RBAC -> ABAC -> ReBAC -> PBAC with
  RLS as the enforcement boundary.

## Known deferred items

- Rename `vibeora_*` database identifiers via forward migrations (data
  compatibility first).
- Update `PLATFORM_HOSTS` and `robots.txt` on DNS cutover to CoreGrid
  Scholar domains.
- Replace deprecated `createServerFn().inputValidator()` calls.
- Fix pre-existing typecheck debt (7 x TS2322: `PageHeader` `actions`
  typed as `ReactNode` instead of an actions array) in admin routes
  (audit, examinations, extracurricular, financial-reports, inventory,
  payroll, visitors).
- Address `AdminDashboard` route export code-splitting warning.
