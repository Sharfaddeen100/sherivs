# SHERIVS PROGRAM STATUS

Category Formation Program — status report per master directive §46.
Report date: 2026-10-08. Branch: `cursor/sherivs-refoundation-2507`. Every status is evidence-backed; classifications use §43 vocabulary (IMPLEMENTED / PARTIAL / VERIFIED / DEPLOYED / OPERATIONAL / BLOCKED / UNKNOWN).

## 1. Executive summary

The experience boundary is locked and the customer-facing brand migration is complete on production (sherivs.com). Four independent verification methods (SSR HTML scan, route sweep, unit-test boundary pins, domain-neutrality gate) confirm zero CoreGrid leakage on public surfaces. The universal-vs-domain architecture correction is partially executed: identity routing, multi-membership, and internal-control isolation are DEPLOYED; the universal workspace shell and the institutional-intelligence core (reality/memory/context primitives above the domain layer) remain the primary open engineering fronts.

## 2. Category definition

"Institutional Intelligence Infrastructure" adopted as the public category; homepage communicates it (`frontend/src/components/public/sherivs-home.tsx`, live HTML). Platform primitives are being kept domain-neutral via `scripts/verify-domain-neutrality.mjs` (STATUS=PASS, quarantine baseline ADR-013). Restaurant concepts verified ISOLATED as `fixture:restaurant` domain config (`frontend/src/lib/domain-config/restaurant.ts`, I-030) — no universal contamination found beyond doc-comment references.

## 3. Experience boundary

`SHERIVS_EXPERIENCE_BOUNDARY.md` — VERIFIED as the governing route inventory. All routes classified into planes A–D. Open: `/reality/$class` + `/marketplace` public/internal narrative review; `/privacy` duplicate redirect; `/coregrid` compat retirement.

## 4. Route architecture

Single-application boundary model (no multi-app split) per §7 "operational simplicity" rule. Planes separated by route groups: `(site)/` public, `_authenticated/` customer + internal, `(site)/coregrid` compat. SSR homepage served on platform host. Evidence: live route sweep 14/14 HTTP 200.

## 5. Brand migration status

`SHERIVS_BRAND_MIGRATION.md` — 24 customer-facing occurrences migrated across 26 files (commits `8f5a193`, `abab29f`, `c3aa8d9`). Production HTML scan: 0 CoreGrid hits on `/`, `/marketplace`, `/reality/school`, `/privacy`. ~1,760 historical/architectural references intentionally retained (HISTORICAL_REFERENCE). LEGACY identifier registry with removal criteria documented in the ledger.

## 6. Identity architecture

Identity gateway chain (authenticate → memberships → runtime → workspace → destination) IMPLEMENTED and DEPLOYED: `frontend/src/lib/identity/identity.ts`, `resolve-identity.functions.ts`; destinations `/internal`, `/organizations`, `/welcome`, workspace. Multi-membership storage LIVE (migration `20261008000050`, RLS forced, behavioral matrix verified via JWT impersonation). Login never hard-routes to Scholar. VERIFIED.

## 7. Organization architecture

Organization = tenant primitive (`organization_memberships`, active-org switching via `switchActiveOrganization`). Organization public experience exists via subdomain/`?school=` resolution + generated-site engine (`generated-site-view.ts`, `/reality/:class`). PARTIAL: org public experience still Scholar-shaped (school entity); universal organization model beyond school rows is the next structural mission.

## 8. Runtime architecture

Domain-runtime boundary enforced: runtimes register via `domainRef` (`kernel/object-type-registry.ts`); Scholar is a runtime, not the platform (`frontend/src/lib/runtime/`). Universal shell (`_authenticated/route.tsx`) still carries Scholar-era navigation composition — runtime-aware shell composition PARTIAL.

## 9. Reality architecture

Bitemporal kernel substrate exists (`coregrid_v1_kernel_bitemporal`, evidence lifecycle, event security migrations — VERIFIED at DB level per prior live checks). Reality-model exposure to organization workspaces is PARTIAL (education reality screens exist: `admin/education-reality.tsx`).

## 10. Mission architecture

Mission primitives exist at DB/kernel level (mission lease, idempotency, cost attribution migrations; `worker-missions` super-admin surface IMPLEMENTED as internal control). Program-level mission portfolio (this directive) tracked in this document and the two deliverables.

## 11. Workforce architecture

Worker registry + launch contract IMPLEMENTED internally (`frontend/src/lib/workforce/`, worker launch server runtime, AI prompt now Sherivs-branded). Workers are governed (lease, verification, evidence migrations present). NOT yet: dynamic worker wake/sleep per mission demand — PARTIAL/UNKNOWN (no evidence of activation loop in production).

## 12. Jarvis architecture

Internal control surface renamed Sherivs Control (command-centre heading + operations projection title). Jarvis as distinct executive-intelligence layer: NOT IMPLEMENTED in the repository evidence reviewed this pass — UNKNOWN beyond command-centre operations projection.

## 13. AI Gateway

Canonical gateway exists with model registry + routing tests (`tests/unit/ai-gateway-*.test.ts`, 8,915 tests passing include gateway adoption checks). VERIFIED as internal capability; model ≠ worker separation present in contracts.

## 14. Security posture

RLS mandatory on tenant tables (memberships verified live: ENABLED+FORCED, fail-closed probes). Service-role isolation, secret firewall (`verify:secrets` PASS). CVE-2026-102989 remediated (react-start ≥1.168.60). zod 4.6.5 with H3 remediation ledger. Public metadata surfaces minimal. VERIFIED.

## 15. Evidence posture

Evidence lifecycle substrate at DB level (evidence migrations live). Engineering reports under `progress/` (H3 waves). This program's evidence: this report + boundary/brand deliverables + commit history.

## 16. Verification posture

Unit: 8,915 pass (4 pre-existing mobile collection failures — `mobile/node_modules` absent). Typecheck PASS. Secrets PASS. Domain-neutrality PASS. RLS behavioral matrix PASS (2026-10-08). E2E pyramid beyond unit: PARTIAL (no production E2E run recorded this pass).

## 17. Communication integrations

Provider abstraction present (`communication-providers.ts` — Resend/Twilio/Vapi adapters per `docs/` stack). Provider displayName rebranded. Live provider delivery: NOT verified this pass (requires external credentials) — UNKNOWN/OPERATIONAL-UNVERIFIED.

## 18. Infrastructure

Vercel (web, tanstack-start preset, productionBranch `master`) DEPLOYED/OPERATIONAL — deployments `dpl_7xmNiZMaVeZiw38z4qAcdWzGEfbG` (69a3632), `dpl_EFDiuoziFoPjNJ6kb52kPx7w1ENS` (8f5a193), `dpl_8HdaZW9GEonGjyKxzeXooTdAt8Hf` (abab29f), `dpl_AyYFyJM8X6KUtizpkzQ9RZdyVGuR` (c3aa8d9, current). Supabase project `nwrflbpbhyiqdptmlccm` — migrations applied. Redis/Kubernetes/Elasticsearch deliberately NOT introduced (§27 simplest-architecture rule).

## 19. Web/PWA

PWA manifest + service worker operational; SW user-facing strings migrated to Sherivs; offline shell cache name LEGACY (test-pinned). VERIFIED at code level; live SW push delivery unverified this pass.

## 20. Mobile

Mobile sources exist (`mobile/`) but are not installed/built in this environment (4 collection failures). MOBILE READY: NOT CLAIMED — BLOCKED on environment (requires `mobile/node_modules` install + device build).

## 21. Testing

Unit suite comprehensive (structural pins on boundaries: `sherivs-refoundation.test.ts`, domain-neutrality gate). RLS/security tests present. E2E/critical-flow automation (signup→org→runtime→mission chains): PARTIAL — next milestone.

## 22. Performance

SSR homepage 30 KB initial HTML with full hero/CTA (no loading shell) — DEPLOYED. No authenticated machinery in public SSR path. Lighthouse/LCP/INP field metrics: not measured this pass — UNKNOWN.

## 23. Deployment

Vercel production: sherivs.com → www (308) → READY deployments above; all 14 routes 200; zero CoreGrid in served HTML. DNS already routed via Vercel domains config. OPERATIONAL.

## 24. V1 status

V1 envelope (AGENTS.md §45): organizational capability platform with Scholar runtime — identity, membership, workspace, governance substrate DEPLOYED. V1-complete is NOT claimed: universal workspace shell, org onboarding pipeline, and org-public-experience generation remain.

## 25. V2 status

Device/IoT capabilities FROZEN — no work performed (twin/facility screens are pre-existing; only brand strings touched).

## 26. Deferred status

All deferrals carry reason/owner/removal-criteria in `SHERIVS_BRAND_MIGRATION.md` (identifier registry) and `SHERIVS_EXPERIENCE_BOUNDARY.md` (open items).

## 27. Known risks

- `/coregrid` compat path and `/privacy` duplicate remain until link hygiene + redirect mission.
- `@coregrid/contracts` + root package name still carry legacy identifiers (internal-only).
- `COREGRID_INTERNAL` enum persists in role data until identifier-migration mission.

## 28. Known blockers

- None blocking current phase. Mobile build requires environment provisioning (not a Cursor-side action).

## 29. Technical debt

Mobile test environment; zod version pinning history (resolved); hydration swap on `?school=` preview URLs during load; scholar-shaped universal shell.

## 30–32. Evidence links

- `SHERIVS_EXPERIENCE_BOUNDARY.md`, `SHERIVS_BRAND_MIGRATION.md` (repository root)
- Commits: `8f5a193`, `abab29f`, `c3aa8d9` on `cursor/sherivs-refoundation-2507` (mirrored to `master`)
- PR: https://github.com/vibeoraai-bit/coregrid-scholar-migration/pull/5
- Deployments: `dpl_AyYFyJM8X6KUtizpkzQ9RZdyVGuR` (current production, sha `c3aa8d9`)

## 33. Outstanding human actions

- None required for the current milestone. Next phase (organization onboarding at scale) may require billing/provider credentials when real organizations are provisioned (Paystack/Resend/Twilio keys) — BLOCKED_EXTERNAL_ACTION only at that point.
