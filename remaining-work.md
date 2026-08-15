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
| 03 Multi-tenancy | Tenant hierarchy (school -> district -> state), tenant provisioning API | 02 |
| 04 Education Reality Engine | Curriculum, assessment, learning-objective model | 03 |
| 05 Workspace Engine | Unified workspace for staff/student workflows | 04 |
| 06 AI Agent System | Platform agents with scopes, audit trails (see `constitution/ai-agent-policy.md`) | 02, 07 |
| 07 Security Engine | RBAC/ABAC/ReBAC/PBAC policy engine, security audit hardening | 02, 03 |
| 08 Communication Platform | Messages/notifications/push as platform services | 01 |
| 09 Payment & Billing Engine | Extract Paystack integration, billing, invoicing | 01, 03 |
| 10 Data Platform | Data access layer, realtime contracts, backup/restore guarantees | 01 |
| 11 Hardware Integration | Biometrics, geofence, QR/face attendance as a service | 07 |
| 12 Digital Twin | Formalize digital-twin functions into an engine | 04, 10 |
| 13 Automation Engine | Workflow/automation for school operations | 01 |
| 14 Analytics Engine | Reporting, dashboards, data warehouse readiness | 10 |
| 15 Government Education Cloud | District/state rollups, compliance | 03, 14 |
| 16 Mobile Platform | Mobile app (see `mobile/`) | 08, 11 |
| 17 Web Platform | Web platform ownership (current app) | now |
| 18 AI Intelligence Layer | Gateway, model routing, evals, cost controls | 06 |
| 19 Marketplace | Third-party app/school-content marketplace | 20 |
| 20 Developer Platform | Public API, webhooks, SDKs | 01, 10 |
| 21 CoreGrid Integration | CoreGrid ecosystem protocols | 20 |
| 22 Globalization | i18n, l10n, multi-currency, regional compliance | 03, 09 |
| 23 Enterprise Scale | High availability, sharding, multi-region | 01, 10 |
| 24 Future Evolution | Long-term platform evolution governance | all |

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
- **Phase 07:** policy engine supporting RBAC -> ABAC -> ReBAC -> PBAC with
  RLS as the enforcement boundary.

## Known deferred items

- Rename `vibeora_*` database identifiers via forward migrations (data
  compatibility first).
- Update `PLATFORM_HOSTS` and `robots.txt` on DNS cutover to CoreGrid
  Scholar domains.
- Replace deprecated `createServerFn().inputValidator()` calls.
- Address `AdminDashboard` route export code-splitting warning.

