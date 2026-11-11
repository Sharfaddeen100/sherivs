# Deployment authority statement (single source of truth)

Version target: governance/documentation only (M0.2-F). Evidence date: 2026-11-11. Replaces ad-hoc statements in `infrastructure/README.md`, `SHERIVS_PROGRAM_STATUS.md` and `.github/workflows/release.yml` comments where they conflict.

| Surface | Authoritative path | Evidence | Status |
|---|---|---|---|
| Web app (sherivs.com) | Vercel, deployed by the `vercel-prod` job of `.github/workflows/verify.yml` on push to `master`, environment `Production` | `verify.yml` (job `vercel-prod`), `SHERIVS_PROGRAM_STATUS.md` section on Vercel | **Operational** |
| Pull-request previews | `preview` job of `verify.yml`, same-repo PRs only, environment `Preview` | `verify.yml` (job `preview`) | Operational |
| Database | Hosted Supabase, changes only via reviewed migrations and the guarded `prod-migrate-one.yml` workflow (typed confirmation, environment `Production`) | `database/supabase/migrations/`, `prod-migrate-one.yml` | Operational |
| Security batteries | `security-batteries.yml`, master + schedule/dispatch only, environment `security-batteries` | M0.2-A | Operational once secrets are scoped |
| Cloud fabric (Terraform/Kubernetes) | `infrastructure/`, plan/apply via `infrastructure-plan-apply.yml` (environments `infrastructure-plan`, `infrastructure-apply`) | `infrastructure/README.md` | **Authored, not applied**; no production traffic; not part of V1 delivery claims |
| Docker image + SSH deploy | `release.yml` | fails closed without `DEPLOY_SSH_*` credentials | **Inactive legacy path**; do not treat as the production route |

## Rules

1. A deployment claim must name the row above it relies on. Rows marked authored/inactive are not shipped.
2. Production-class environments (`Production`, `infrastructure-apply`, `security-batteries`) must have required reviewers and a `master`-only deployment policy (`.github/governance/environments.json`). Until the owner applies it, "human approval" is **not enforced**; comments claiming it are aspirational.
3. GitHub environment names are case-insensitive; `production` and `Production` are the same environment.
4. V2 (device/IoT) and V3 (Reality Intelligence) capabilities are frozen (AGENTS.md section 45) and must not appear in V1 delivery claims.
5. `CoreGrid` is the internal runtime/architecture name and appears in historical documents, migrations and ADRs; customer-facing surfaces use Sherivs / Sherivs Scholar.
