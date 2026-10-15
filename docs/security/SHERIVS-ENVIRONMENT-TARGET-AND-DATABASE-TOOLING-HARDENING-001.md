# SHERIVS-ENVIRONMENT-TARGET-AND-DATABASE-TOOLING-HARDENING-001

**Mission ID:** SHERIVS-ENVIRONMENT-TARGET-AND-DATABASE-TOOLING-HARDENING-001  
**Mission type:** Implementation + offline verification + evidence reporting  
**Classification:** Critical Infrastructure Safety / Database Target Isolation / Engineering Governance  
**Version-target classification:** ACTIVE-V1 tooling and application-config safety. No V2/V3 implementation.  
**Verification date:** 2026-10-15  
**Final verdict:** **PASS WITH CONDITIONS**

This mission hardens repository database-target selection so protected operations fail closed when the intended environment cannot be established unambiguously. It is not a restore, not a production cleanup, not a migration execution, and not authorization to inspect live systems.

---

## 1. Mission identity and scope

**In scope:**

- Inventory of repository scripts and configuration capable of selecting or operating on Supabase/PostgreSQL.
- Explicit fail-closed target contract for protected database-execution entry points.
- Removal of unscoped `DATABASE_URL` fallbacks and implicit production project-ref defaults in those scripts.
- Environment classification that keeps unknown unknown.
- Browser/server public-client configuration boundary.
- Offline unit tests for the contract.
- Preservation of existing staging migration-runner safeguards.

**Out of scope / not executed:**

- Production or staging database access, restore, migration apply, `db push` / `db reset` / `db dump`.
- Supabase, Vercel, GitHub, or other live network operations.
- Secret or environment-variable modification in Cursor, Vercel, or cloud platforms.
- DNS, deployment, or production/staging resource changes.
- Closing SHERIVS-001, SHERIVS-002, or SHERIVS-003.
- Application-runtime host binding (`SUPABASE_URL` injected by a deployment) beyond the public-client fallback contract.
- Wrapping the Supabase CLI so `config.toml` cannot be used as a live target.

---

## 2. Executive summary

Historical findings were re-inspected against current source. They were still present:

- `scripts/db-apply.mjs`, `scripts/db-run.mjs`, and `scripts/db-apply-one.mjs` used unscoped `DATABASE_URL` then constructed `pg.Client`.
- Management and apply scripts defaulted `projectRef` to production `nwrflbpbhyiqdptmlccm`.
- `classifyEnvironment` mapped missing/unknown `NODE_ENV` to `"development"`.
- Browser client configuration used `VITE_SUPABASE_* || process.env.SUPABASE_*`.
- `database/supabase/config.toml` still pins the production project ref.

A shared helper `scripts/lib/sherivs-db-target.mjs` now requires `SHERIVS_DATABASE_TARGET=development|staging|production` before protected Postgres or management-API operations. Credentials do not select a target. Staging refuses unscoped `DATABASE_URL`. Production requires a separate `SHERIVS_CONFIRM_PRODUCTION=nwrflbpbhyiqdptmlccm` confirmation. Refusal occurs before client construction.

The staging migration runner was not weakened. Canonical pin remains commit `d195ba861f80379b79533126653b9cee82a8e872`, tree `bbd828951e166662bbe831fd74972e1a15488468`, 71 SQL files. Offline runner tests: 108/108 passed.

This report does **not** prove live staging or production is safe.

---

## 3. Initial repository state

Observed at mission start, before implementation:

| Item | Value |
|---|---|
| Branch | `cursor/sherivs-environment-target-db-hardening-d80b` created from `cursor/sherivs-production-demo-ui-metric-correction-5537` |
| Baseline HEAD | `c9de2cf322a11384c85ee5057753cd3ebc6ddcb2` |
| Baseline tree | `2a2c18374b2c00cdc7ceae536144fea286bbe93b` |
| Working tree | clean |
| Unrelated work | none observed; previous demo-UI correction remained intact at `c9de2cf` |

No `git reset`, `git clean`, or discard was performed.

---

## 4. Branch and baseline HEAD SHA

| Item | Value |
|---|---|
| Branch | `cursor/sherivs-environment-target-db-hardening-d80b` |
| Baseline HEAD | `c9de2cf322a11384c85ee5057753cd3ebc6ddcb2` |
| Preferred PR base | `cursor/sherivs-production-demo-ui-metric-correction-5537` |
| Known production ref (governance only) | `nwrflbpbhyiqdptmlccm` |
| Known staging ref (governance only) | `dvxszhracsjwdancijdc` |

These refs were used only as offline validation constants. They were not contacted.

---

## 5. Final HEAD SHA

Recorded after the evidence-report commit on this branch. See section 6 for implementation commits and the Git block at the end of this file after commit.

Inspection HEAD before this report file: `d50567b0c33d747f2a21834fa8c469b2c5c92c8c`  
Inspection tree before this report file: `0fd5f05fa192bb9bd62aa1ba0f6deef4959e75ba`

The report commit updates HEAD; the committed copy of this document records that later SHA in the repository log.

---

## 6. Implementation commit SHA

| Commit | Subject |
|---|---|
| `cf9452444c34b44bc4f0718ffbc80a9d7684ea73` | fail-closed targeting |
| `d50567b0c33d747f2a21834fa8c469b2c5c92c8c` | keep Supabase client fail-closed throw |

---

## 7. Working-tree status

Before this report file: implementation commits pushed; working tree clean except this new report.

Unrelated demo-UI files were not modified. Historical `architecture/proofs/role-assignment-substrate.proof.json` was regenerated by an offline verifier run during tests and **restored** to the committed live-era artifact so this mission did not overwrite prior live evidence.

---

## 8. Database-tooling inventory

**Search method:** recursive ripgrep over `*.{mjs,js,ts,yml,yaml,toml,sh,json}` for `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_*`, `STAGING_DATABASE_URL`, `projectRef`, `project_id`, `nwrflbpbhyiqdptmlccm`, `dvxszhracsjwdancijdc`; glob of `scripts/**/*.{mjs,js,ts,sh}` and `.github/workflows/*`.

**Limitations:** completeness is limited to those path/extension patterns. Binary files, undocumented operator aliases, and live cloud configuration were not inventoried. This inventory is source-level, not live.

### Protected execution scripts (can mutate or query a database)

| File | Operation | DB access | Mutate | Previous target selection | Disposition |
|---|---|---|---|---|---|
| `scripts/db-apply.mjs` | apply all SQL | yes | schema | unscoped `DATABASE_URL` | **corrected** |
| `scripts/db-run.mjs` | run SQL file/inline | yes | yes | unscoped `DATABASE_URL` | **corrected** |
| `scripts/db-apply-one.mjs` | apply one migration | yes | schema | unscoped `DATABASE_URL` (dry-run skipped URL) | **corrected** (dry-run still offline) |
| `scripts/db-apply-mgmt.mjs` | management-API apply | yes | schema | `argv[2] ?? production` | **corrected** |
| `scripts/db-run-mgmt.mjs` | management-API query | yes | possible | `argv[3] ?? production` | **corrected** |
| `scripts/apply-approved-v1-migrations.mjs` | management-API apply | yes | schema | production default | **corrected** |
| `scripts/apply-canonical-mr100.mjs` | management-API apply | yes | schema | production default | **corrected** |
| `scripts/apply-canonical-hardening.mjs` | apply / verify-only / manifest | yes except manifest | schema | production default | **corrected** (manifest remains offline) |
| `scripts/apply-foundation-migration.mjs` | management-API apply | yes | schema | production default | **corrected** |
| `scripts/apply-foundation-from-env-local.mjs` | restore paused project + apply | yes | schema + restore | hardcoded production | **corrected** |
| `scripts/restore-recovery-drill.mjs` | drill table backup/destroy/restore | yes | drill table | `argv ?? production` | **corrected** |
| `scripts/verify-recovery-drill.mjs` | rehearse / live SELECT 1 | live mode yes | no in live pre-pass | production default | **corrected** (rehearse still offline) |
| `scripts/probe-foundation-database.mjs` | management query | yes | no | hardcoded production | **corrected** |
| `scripts/run-rls-isolation-check.mjs` | management query | yes | no | hardcoded production | **corrected** |
| `scripts/exercise-foundation-loop.mjs` | live foundation loop | yes | yes | hardcoded production | **corrected** |
| `scripts/assess-foundation-conformance.mjs` | live catalog + source | yes | no | hardcoded production | **corrected** |
| `scripts/inspect-supabase-github.mjs` | management GET | yes (API) | no | hardcoded production | **corrected** |
| `scripts/generate-database-types.mjs` | CLI introspection | yes | no | URL/`SUPABASE_PROJECT_ID`/production fallback | **corrected** |
| `scripts/verify-neutral-tenant-primitives.mjs` | catalog SELECT | yes | no | production default | **corrected** |
| `scripts/verify-rls-isolation-battery.mjs` | live battery | CLI yes | probe seed | URL-derived ref | **corrected** (CLI `ensureCredentials` only; import remains inert) |
| `scripts/verify-role-assignment-substrate.mjs` | static + optional live | live if URL | no | unscoped `DATABASE_URL` | **corrected** (static still runs without URL) |
| `scripts/event-fabric.mjs` | outbox delivery | yes | yes | `SUPABASE_URL` + service role | **corrected** |
| `scripts/infrastructure/supabase-config-check.mjs` | backups/RLS probe | live unless `--static` | no | `SUPABASE_PROJECT_REF` | **corrected** for live path; `--static` unchanged |
| `scripts/lib/pg-connect.mjs` | shared connector | yes | n/a | caller URL; DNS before target | **corrected** (target before `hostReachable`) |
| `scripts/lib/pg-ssl.mjs` | TLS policy | no | no | defaulted to `DATABASE_URL` | **corrected** (explicit string required) |

### Staging runner (preserved)

| File | Disposition |
|---|---|
| `scripts/staging/sherivs-restore/*` | **unchanged** — already refuses `DATABASE_URL`, production ref, and unprefixed URLs |

### Harmless / not applicable / remaining controls

| File | Notes | Disposition |
|---|---|---|
| `database/supabase/config.toml` | CLI pin to production; not an execution default for repo scripts | **preserved** with warning comment |
| `frontend/src/integrations/supabase/client.ts` | public client | **corrected** public-config contract |
| `frontend/src/integrations/supabase/client.server.ts` | service-role server client; no VITE fallback | **unchanged** (runtime host binding) |
| `scripts/provision-vercel-env.mjs` | Vercel env upsert, not a DB client | **not applicable** / remaining operator risk |
| `.github/workflows/security-batteries.yml` | live-credential-gated CI | **corrected** to set explicit target/confirm instead of script defaults |
| Adapter `LIVE_ENABLED` tests | skip unless `DATABASE_URL` | **unchanged**; connector now refuses without target |
| Application routes using `supabase` | not scripts | **not applicable** to script targeting |

---

## 9. Unsafe patterns found

Observed in current source before correction (not assumed from historical reports):

1. Unscoped `DATABASE_URL` in `db-apply.mjs` / `db-run.mjs` / `db-apply-one.mjs` then `new pg.Client`.
2. Production project-ref defaults (`argv ?? "nwrflbpbhyiqdptmlccm"` or hardcoded) in management/apply/probe scripts.
3. `classifyEnvironment` unknown → `"development"` in `frontend/src/lib/env.ts`.
4. Browser/SSR mix: `import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL` in `client.ts`.
5. `generate-database-types.mjs` falling back to canonical production ref.
6. `pgSslConfig()` defaulting to `process.env.DATABASE_URL`.
7. `connectCoregridPostgres` performing DNS/`hostReachable` without an explicit target.
8. `verify-role-assignment-substrate.mjs` live path connecting whenever `DATABASE_URL` was set.
9. `event-fabric.mjs` connecting with service role whenever URL+key existed.
10. CI workflow named production as `CANONICAL_PROJECT_REF` while scripts independently defaulted to the same ref.

---

## 10. Unsafe patterns corrected

- Shared contract `scripts/lib/sherivs-db-target.mjs`: `resolveExplicitTarget`, `resolvePostgresConnection`, `resolveManagementProjectRef`, `openValidatedPostgresClient`.
- All listed protected scripts call `requirePostgresTarget` or `requireManagementTarget` before fetch/`pg.Client`.
- Staging URL env names only: `STAGING_DATABASE_URL` / `SHERIVS_RLS_STAGING_URL`; `DATABASE_URL` is a forbidden fallback.
- Production URL env: `PRODUCTION_DATABASE_URL` plus `SHERIVS_CONFIRM_PRODUCTION`.
- Development may use `DATABASE_URL` or `DEVELOPMENT_DATABASE_URL`, but refuses known production/staging refs in the string.
- `classifyEnvironment` returns `"unknown"`; `scripts/verify-env.ts` exits 1 on unknown.
- Public client config in `frontend/src/integrations/supabase/public-config.ts`.
- CI workflow sets `SHERIVS_DATABASE_TARGET`, `SHERIVS_PROJECT_REF`, and `SHERIVS_CONFIRM_PRODUCTION` explicitly.

---

## 11. Patterns intentionally preserved and why

| Pattern | Why preserved |
|---|---|
| Staging runner pin and forbidden fallbacks | LAW 7; already stricter than the new general contract |
| `database/supabase/config.toml` production `project_id` | Changing it to staging would retarget every unaudited `supabase` CLI invocation; documented remaining control |
| `client.server.ts` using `SUPABASE_URL` + service role | Legitimate server-only client; adding `SHERIVS_DATABASE_TARGET` would require live host env changes (prohibited) |
| Manifest / `--rehearse` / `--dry-run` / `--static` / `--help` / `--dry-parse-scope` | Offline modes that do not connect |
| Historical live proof artifact for role-assignment substrate | Not overwritten by this offline run |
| SHERIVS-001/002/003 | Remain OPEN (LAW 10) |

---

## 12. Explicit target-selection contract

Environment variable: **`SHERIVS_DATABASE_TARGET`**

Allowed values: `development` | `staging` | `production`

Supporting variables:

- `SHERIVS_PROJECT_REF` — explicit project ref when using the management API
- `SHERIVS_CONFIRM_PRODUCTION` — must equal `nwrflbpbhyiqdptmlccm` for production operations
- Staging URLs: `STAGING_DATABASE_URL` or `SHERIVS_RLS_STAGING_URL`
- Production URL: `PRODUCTION_DATABASE_URL`
- Development URLs: `DEVELOPMENT_DATABASE_URL` or `DATABASE_URL`

Rules:

1. Missing target → `TARGET_MISSING`
2. Empty target → `TARGET_EMPTY`
3. `unknown` → `TARGET_UNKNOWN`
4. Other values → `TARGET_UNSUPPORTED`
5. `NODE_ENV`/`APP_ENV` in `{development,staging,production}` disagreeing with the target → `TARGET_CONFLICT`
6. CLI ref vs `SHERIVS_PROJECT_REF` disagreement → `TARGET_CONFLICT`
7. Production ref as staging → `TARGET_PRODUCTION_AS_STAGING`
8. Staging ref as production → `TARGET_STAGING_AS_PRODUCTION`
9. `DATABASE_URL` does not override staging/production targets
10. Credential presence does not establish a target
11. Selecting production does not authorize the operation without `SHERIVS_CONFIRM_PRODUCTION`
12. Existing runner production-refusal and live-execute block remain separate
13. Unprovable target → refuse
14. Helper does not import `pg`; `openValidatedPostgresClient` calls a factory only after validation
15. `redactSecrets` strips passwords and token-like values from diagnostics

---

## 13. Environment classification rules

`classifyEnvironment` in `frontend/src/lib/env.ts`:

- Known: `local` | `development` | `test` | `staging` | `production` (trimmed, case-insensitive)
- Missing, empty, or unrecognized → **`unknown`**
- Unknown is not development
- `scripts/verify-env.ts` fails closed if classification is `unknown`

This is independent of `SHERIVS_DATABASE_TARGET`. An unknown Node environment does not become a database target.

---

## 14. Project-reference validation rules

Known refs used as deny/allow constants only:

- Production: `nwrflbpbhyiqdptmlccm`
- Staging: `dvxszhracsjwdancijdc`

Management operations require an explicit ref (argv or `SHERIVS_PROJECT_REF`). There is no production default.

Hostname-alone is not treated as infallible identity for non-Supabase URLs. For `*.supabase.co` / `*.supabase.com` URLs, the declared target must match the known ref embedded in the string when the target is staging or production. Development refuses both known live refs.

---

## 15. URL and credential handling

| Target | Accepted URL sources | Forbidden |
|---|---|---|
| development | `DEVELOPMENT_DATABASE_URL` or `DATABASE_URL` | known prod/staging refs in the URL |
| staging | `STAGING_DATABASE_URL` / `SHERIVS_RLS_STAGING_URL` | `DATABASE_URL`, production ref |
| production | `PRODUCTION_DATABASE_URL` plus confirm env | `DATABASE_URL`, staging ref, missing confirm |

Service-role keys, access tokens, and generic URLs never select the target.

---

## 16. Connection-before-validation analysis

**Implemented / independently verified offline:**

- `scripts/lib/sherivs-db-target.mjs` does not import `pg` and does not call `fetch`.
- `openValidatedPostgresClient` does not invoke the factory on invalid config (`tests/unit/sherivs-db-target.test.ts` TEST 11).
- `scripts/db-apply.mjs` and `scripts/db-apply-mgmt.mjs` spawned with stripped env exit 2 with `TARGET_MISSING` and do not print fixture secrets.
- `connectCoregridPostgres` calls `resolveExplicitTarget` + `assertUrlMatchesTarget` before `hostReachable` (DNS/socket).

**Not tested live:** no real `pg.Client.connect()` against staging or production was attempted (prohibited).

---

## 17. Offline test inventory and results

| ID | Requirement | Result |
|---|---|---|
| TEST 1 | Missing target | **pass** |
| TEST 2 | Empty target | **pass** |
| TEST 3 | Unknown/unsupported target | **pass** |
| TEST 4 | Unknown environment stays unknown | **pass** (`env.test.ts` + helper) |
| TEST 5 | Staging rejects production ref | **pass** |
| TEST 6 | Production rejects staging ref | **pass** |
| TEST 7 | URL/target mismatch | **pass** |
| TEST 8 | No implicit `DATABASE_URL` fallback | **pass** |
| TEST 9 | Credential presence insufficient | **pass** |
| TEST 10 | Conflict detection | **pass** |
| TEST 11 | No factory/socket before refusal | **pass** |
| TEST 12 | Production auth remains separate | **pass** |
| TEST 13 | Existing runner tests | **pass** 108/108 |
| TEST 14 | Browser/server config boundary | **pass** |
| TEST 15 | Local development compatibility | **pass** |
| TEST 16 | Diagnostics redaction | **pass** |

Additional: `env.test.ts`, `pg-ssl-tls-policy.test.ts`, `h3-052-log-redaction.test.ts`, `mh-06-apply-marshal.test.ts`, `h3-001-recovery-drill.test.ts`, `role-substrate-proof.test.ts`.

---

## 18. Exact commands executed

Database/network/live commands were **not** executed. Offline commands:

```sh
git rev-parse HEAD
git status --porcelain
npx vitest run tests/unit/sherivs-db-target.test.ts tests/unit/env.test.ts tests/unit/pg-ssl-tls-policy.test.ts tests/unit/role-substrate-proof.test.ts tests/unit/h3-001-recovery-drill.test.ts tests/unit/mh-06-apply-marshal.test.ts
npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts tests/unit/sherivs-db-target.test.ts tests/unit/env.test.ts
npx vitest run
npx vitest run tests/unit/h3-052-log-redaction.test.ts tests/unit/sherivs-db-target.test.ts tests/unit/env.test.ts
npx vitest run tests/unit/h3-052-log-redaction.test.ts tests/unit/sherivs-db-target.test.ts tests/unit/env.test.ts tests/unit/pg-ssl-tls-policy.test.ts tests/unit/role-substrate-proof.test.ts tests/unit/sherivs-staging-migration-runner.test.ts tests/unit/mh-06-apply-marshal.test.ts tests/unit/h3-001-recovery-drill.test.ts
```

Vitest was run with `DATABASE_URL`, `STAGING_DATABASE_URL`, `PRODUCTION_DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, and related vars unset.

---

## 19. Test output summaries and exit codes

**In-scope suite (after client throw restoration), exit 0:**

- Test files: 8 passed
- Tests: 213 passed
- Includes runner 108/108

**Earlier focused suite, exit 0:** 6 files / 78 passed (before adding h3-052 and runner to the same invocation).

**Full `npx vitest run` before the client throw restoration, exit 1:**

- Tests: 1 failed | 9036 passed | 14 skipped
- Test files: 5 failed | 426 passed | 2 skipped
- The one assertion failure was `tests/unit/h3-052-log-redaction.test.ts` expecting `throw new Error(` in `client.ts`. Fixed in `d50567b`. Re-run of that file: 27/27 passed.
- Four additional **file-load** failures (`mobile-connectivity`, `mobile-mission-contracts`, `mobile-env-contract`, `mobile-serverfn-client`) were `TSConfckParseError: failed to resolve "extends":"expo/tsconfig.base"`. They do not import the target helper. Treated as **pre-existing environment/tooling**, not as a targeting defect. Not re-run against the baseline in this mission.

Typecheck (`npm run typecheck`) was **not run** as a claimed pass. Full-repo `tsc` was skipped to avoid treating unrelated type drift as this mission's evidence.

---

## 20. Migration-runner compatibility evidence

Independent offline re-run of `tests/unit/sherivs-staging-migration-runner.test.ts`:

- 108 tests passed, exit 0
- Manifest still reports source commit `d195ba861f80379b79533126653b9cee82a8e872`, tree `bbd828951e166662bbe831fd74972e1a15488468`, count 71
- `LIVE_EXECUTE_NOT_ENABLED` still asserted
- Production ref refusal remains in runner `constants.mjs` / `target.mjs` (unchanged in this mission's diff)

`securityProof` and `schemaEquivalence` are **not** marked true. This is not a live catalog observation.

---

## 21. Diff summary

Primary additions:

- `scripts/lib/sherivs-db-target.mjs`
- `frontend/src/integrations/supabase/public-config.ts`
- `tests/unit/sherivs-db-target.test.ts`
- this report

Primary modifications: protected `scripts/*.mjs` listed in section 8, `frontend/src/lib/env.ts`, `frontend/src/integrations/supabase/client.ts`, `scripts/verify-env.ts`, `scripts/lib/pg-connect.mjs`, `scripts/lib/pg-ssl.mjs`, `.github/workflows/security-batteries.yml`, `database/supabase/config.toml` (comment only plus preserved pin), related offline tests.

Not modified: `scripts/staging/sherivs-restore/**` logic, migration SQL, RLS policies, demo-UI correction.

---

## 22. Network / database / deployment boundary confirmation

**Did not occur:**

- Production database connection
- Staging database connection
- Supabase management API calls
- Vercel API calls
- GitHub API writes except the forge PR tool already used for this branch
- Migration apply/restore/`db push`/`db reset`
- Secret or cloud env mutation
- DNS or deployment
- Reading customer records

Git `push` of this feature branch and PR creation are source-control operations, not database operations.

---

## 23. Remaining risks

1. **Application runtime targeting** — `client.server.ts` and host-injected `SUPABASE_URL` still bind the running app to whatever the deployment provides. Not covered by `SHERIVS_DATABASE_TARGET`. **Unverified live.**
2. **Supabase CLI `config.toml` pin** — `project_id = "nwrflbpbhyiqdptmlccm"` remains. An operator running `supabase` CLI against this file can still target production. **Remaining control required:** do not run CLI live from this pin without a separate authorization.
3. **CI batteries** — workflow now *explicitly* sets production target + confirm. If repository secrets exist, scheduled jobs can still touch the canonical project. That is explicit, not silent, and was not executed here.
4. **`provision-vercel-env.mjs`** — can copy process env to Vercel. Not a DB script; still an operator hazard. Not run.
5. **Adapter live tests** — skip without `DATABASE_URL`; if both URL and target are set in a future environment, they could connect. This mission unset those vars.
6. **Source-level guards are not production proof** until deployed.
7. Parent-engagement `news_reads` query (section 24).
8. SHERIVS-001/002/003 (section 25).

---

## 24. Parent-engagement tenant-scoping concern (separate OPEN investigation)

**Not modified in this mission.**

Offline source inspection of `frontend/src/routes/_authenticated/admin/intelligence.tsx`:

- Surrounding queries in the same `Promise.all` filter `.eq("school_id", schoolId)` (`fees`, `users`, `students`, `attendance_logs`, `school_sports`, `teacher_performance_profiles`, grades).
- `news_reads` is selected as `supabase.from("news_reads").select("user_id").gte("read_at", monthStart)` with **no** `school_id` filter.

Offline schema inspection of `packages/contracts/src/database.ts`:

- `news_reads.Row` includes required `school_id: string`
- Relationship `news_reads_school_id_fkey` → `schools.id`

**Facts:** the table has a school column and FK; this UI query does not filter it.

**Not established:** whether RLS on `news_reads` would still constrain rows by tenant; whether the metric can observe another school's reads. That requires live/policy analysis outside this mission.

**Status:** OPEN separate investigation. Do not treat as resolved.

---

## 25. SHERIVS-001 / 002 / 003 status

| ID | Severity | Status |
|---|---|---|
| SHERIVS-001 | CRITICAL — identity self-update / role/school privilege escalation | **OPEN** |
| SHERIVS-002 | HIGH — broad tenant policies, excessive grants, TRUNCATE exposure | **OPEN** |
| SHERIVS-003 | HIGH — sensitive HR/financial/NIN/banking/biometric exposure | **OPEN** |

Environment-target hardening does **not** remediate those authorization defects. Severity is not downgraded.

---

## 26. Recommended next mission

**SHERIVS-001 identity privilege-escalation remediation** remains the highest-severity open finding and should not be displaced by tooling work.

For remaining environment-target controls specifically:

**SHERIVS-APPLICATION-RUNTIME-AND-CLI-TARGET-CONTROLS-001** — bind the running app and the Supabase CLI pin (`config.toml`) to an explicit non-silent target contract without implying production access, and keep SHERIVS-001/002/003 OPEN.

Do not authorize live restore or production cleanup in that mission unless separately written.

---

## 27. Reproducible offline verification commands

```sh
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
git status --porcelain
unset DATABASE_URL DEVELOPMENT_DATABASE_URL STAGING_DATABASE_URL SHERIVS_RLS_STAGING_URL PRODUCTION_DATABASE_URL SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY SUPABASE_ACCESS_TOKEN SUPABASE_DB_URL SHERIVS_DATABASE_TARGET SHERIVS_PROJECT_REF SHERIVS_CONFIRM_PRODUCTION SUPABASE_PROJECT_ID
npx vitest run tests/unit/sherivs-db-target.test.ts tests/unit/env.test.ts tests/unit/pg-ssl-tls-policy.test.ts tests/unit/h3-052-log-redaction.test.ts tests/unit/role-substrate-proof.test.ts tests/unit/mh-06-apply-marshal.test.ts tests/unit/h3-001-recovery-drill.test.ts tests/unit/sherivs-staging-migration-runner.test.ts
```

Expected: exit 0, 8 files, 213 tests passed (counts valid for this commit family; later edits may change counts).

Do not run `scripts/db-apply.mjs`, staging restore execute, or any command that needs a live URL.

---

## Verdict meaning

**PASS WITH CONDITIONS**

- In-scope protected **scripts** no longer silently default to production or unscoped `DATABASE_URL`.
- Relevant offline tests passed.
- Conditions: application runtime host binding, `config.toml` CLI pin, CI explicit production batteries, and SHERIVS-001/002/003 remain.
- This is **not** PASS for live infrastructure.

---

## Observed vs assumed

| Claim | Kind |
|---|---|
| Historical unsafe patterns were still in source at `c9de2cf` | **Observed** |
| Helper refuses before factory invocation | **Observed** (unit test) |
| Runner pin 71 / `d195ba8` / `bbd82895` | **Observed** (test stdout + `constants.mjs`) |
| Live production/staging configuration | **Unverified** |
| Deployed Vercel `SUPABASE_URL` | **Unverified** |
| `news_reads` RLS effectiveness | **Unverified** |
| Mobile vitest file-load errors are pre-existing | **Assumed from missing expo tsconfig; not proven against baseline in this run** |
