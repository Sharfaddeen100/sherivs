# SHERIVS-PRODUCTION-DEMO-UI-AND-METRIC-CORRECTION-001

**Mission ID:** SHERIVS-PRODUCTION-DEMO-UI-AND-METRIC-CORRECTION-001  
**This document revision:** Independent engineering evidence collection, verification, and report completion.  
**Mission type:** Application-code-only correction, followed by report-only verification.  
**Version-target classification:** ACTIVE-V1 application UI/metric honesty. No V2/V3 implementation.  
**Source audit:** `docs/security/SHERIVS-ENVIRONMENT-SEPARATION-AND-DEMO-CONTAMINATION-AUDIT-001.md`  
**Verification date:** 2026-10-15  
**Final verdict:** **PASS WITH CONDITIONS**

This document preserves the implementation record and adds independently re-verified Git, source, and offline-test evidence. It does not deploy. It does not claim the live production site has changed. It does not infer the deployed value of `ALLOW_DEMO_PROVISIONING`.

---

## 1. Mission identity and scope

**In scope (already implemented; verified here, not re-implemented):**

- Public `/auth` demo CTA default-hidden, explicit `?demoEntry=true` only.
- Public `/` no longer mounting the in-memory Command Centre for unauthenticated, no-tenant visitors.
- Removal of fabricated `parentScore = 70`, `feeScore = 100`, empty attendance as 100%, empty grades as 60 from the named production-reachable portal paths.
- Offline unit/structural tests for those behaviors.

**Out of scope / not executed:**

- Production or staging inspection, deployment, DNS, Vercel, secrets, environment-variable mutation.
- Database connections, SQL, migrations, restore, copy/delete of demo records.
- Closing SHERIVS-001, SHERIVS-002, or SHERIVS-003.
- Host-identity alignment (`PLATFORM_HOSTS` / Sherivs canonical URLs).
- Full UI modernization.
- Playwright, browser, live-server, or production UX testing.

**This verification pass** did not start a new implementation, did not refactor application code, and did not create a new feature. Application source was inspected as committed. The only file updated by this verification pass is this report.

---

## 2. Executive summary

Independent inspection of branch `cursor/sherivs-production-demo-ui-metric-correction-5537` at HEAD `9d9299b4b2dfd634f99e9258937cb2cfa51055c6` found a **clean working tree**. The UI/metric implementation is **committed** at `45def42ecafd53613809046f012352756379ff21`, with follow-on test and documentation commits listed in section 4.

Source-level verification:

- `/auth` hides the Enterprise demo CTA unless `window.location.search` contains `demoEntry=true`. The visible panel is labelled **Isolated demo mode**. Sign-in, sign-up, and forgot-password remain. The query parameter does not replace the server gate.
- `provisionDemoEnterprise` still throws unless `process.env.ALLOW_DEMO_PROVISIONING !== "true"` is false, **before** importing the service-role client. `git diff` against the inventory base shows **zero bytes** changed in that file.
- Unauthenticated `/` with no resolved school renders `PublicPlatformHome`. No file in `frontend/` currently imports `@/components/command-centre/command-centre`. The fixture IDs `tenant:coregrid-demo` / `user:demo-administrator` remain only inside that unmounted component file.
- `frontend/` contains no remaining `parentScore = 70`, `feeScore = 100`, `srate ?? 100`, or `savg ?? 60`. Honest-score helpers return `null` for empty inputs.

Offline tests were **re-run** during this verification (exit 0; 10 files; 109 passed). Playwright, live browser, production, and database tests were **NOT EXECUTED** (network/database/credentials required).

Live `ALLOW_DEMO_PROVISIONING`, Vercel bindings, and whether `sherivs.com` serves this commit remain **UNKNOWN**. SHERIVS-001 / 002 / 003 remain **OPEN**.

---

## 3. Final verdict and its precise meaning

**PASS WITH CONDITIONS**

Meaning:

- In-scope **source** changes are present on this branch and match the mission requirements as written in application code.
- Relevant **offline** tests were independently re-run and passed.
- No material in-scope implementation defect was found that would fail the source correction.
- Material **environmental** facts remain unverified: deployed env values, live hosts, production/staging data.
- Outstanding **database security** findings SHERIVS-001 / 002 / 003 are not remediated by this UI work.

This verdict is **not** PASS. It does **not** mean production was deployed, production behavior was tested, or RLS findings were resolved.

---

## 4. Branch name and current HEAD SHA

Recorded from local git immediately before this documentation update. No remotes were queried for this block except the already-configured `git status` tracking line.

| Item | Value |
|---|---|
| Branch | `cursor/sherivs-production-demo-ui-metric-correction-5537` |
| Inspection HEAD | `9d9299b4b2dfd634f99e9258937cb2cfa51055c6` |
| Inspection tree | `3ceb83bca5c7e16570b7cf0205b544db1b9ed309` |
| `git log -1` subject | `docs: record demo UI and metric correction evidence` |
| Tracking | `origin/cursor/sherivs-production-demo-ui-metric-correction-5537` (status: up to date at inspection) |
| PR | https://github.com/vibeoraai-bit/coregrid-scholar-migration/pull/37 |
| Inventory base | `190955201514edc6932296b001f1f28729703aee` |

A later documentation-only commit may advance HEAD after this file is written. Implementation SHAs below do not depend on that.

---

## 5. Implementation commit SHA

| Role | SHA | Subject |
|---|---|---|
| **Implementation** | `45def42ecafd53613809046f012352756379ff21` | `fix: hide public demo UI and stop inventing health scores` |
| Comment hygiene | `7404298d5f1f8dd546cd33ec6e27f10448eca1d5` | `test: avoid demo-tenant identifier in the public homepage comment` |
| First report | `ec29decaf68a33edf21a5a54e1a5b843ba0db1f5` | `docs: record demo UI and metric correction evidence` |
| Report SHA cleanup | `0e0329a927e01dab5ef2fc3f00fa2103cf280196` | `docs: drop self-referential report SHA` |
| Additional tests | `9a526b65d08d2d14137f4e23af95dee6e79169ff` | `test: cover demo-entry env isolation and feature-locked metric gates` |
| Prior report refresh | `9d9299b4b2dfd634f99e9258937cb2cfa51055c6` | `docs: record demo UI and metric correction evidence` |

Implementation is **committed**. It is not sitting uncommitted in the working tree.

---

## 6. Working-tree status

At inspection:

```
On branch cursor/sherivs-production-demo-ui-metric-correction-5537
Your branch is up to date with 'origin/cursor/sherivs-production-demo-ui-metric-correction-5537'.
nothing to commit, working tree clean
```

`git status --porcelain=v1` was empty. No unrelated uncommitted files were present. This verification pass did not reset, discard, or stage application files.

---

## 7. Files changed and concise descriptions

`git diff --name-status 190955201514edc6932296b001f1f28729703aee..9d9299b4b2dfd634f99e9258937cb2cfa51055c6`:

| Status | Path | Description |
|---|---|---|
| A | `docs/security/SHERIVS-PRODUCTION-DEMO-UI-AND-METRIC-CORRECTION-001.md` | This report |
| A | `frontend/src/components/public/platform-home.tsx` | Public no-tenant home |
| A | `frontend/src/lib/runtime/scholar/demo-entry.ts` | `?demoEntry=true` helper |
| A | `frontend/src/lib/runtime/scholar/honest-scores.ts` | Null-on-empty score composition |
| M | `frontend/src/routes/auth.tsx` | Demo CTA gated by helper |
| M | `frontend/src/routes/index.tsx` | Mount `PublicPlatformHome` |
| M | `frontend/src/routes/_authenticated/admin/intelligence.tsx` | Honest scores + existing news-read parent rate |
| M | `frontend/src/routes/_authenticated/admin/health-certificate.tsx` | Honest scores; parent unavailable |
| M | `frontend/src/routes/_authenticated/teacher/class-intelligence.tsx` | Risk from available attendance/grades only |
| A | `tests/unit/demo-entry.test.ts` | Demo-entry + auth wiring |
| A | `tests/unit/honest-scores.test.ts` | Empty/missing/populated scores |
| A | `tests/unit/sherivs-production-demo-ui-correction.test.ts` | Route/metric structural tests |

No other paths appear in that diff. Unrelated application or tooling changes are **not** present in the mission range.

---

## 8. Demo-entry source and server-gate verification

### 8.1 Source-level behavior verified

| Requirement | Evidence | Result |
|---|---|---|
| A. Hidden by default | `demo-entry.ts` 18–19, 32–34: null/empty search → false. `auth.tsx` 31–32, 273–299: CTA only if `showDemoEntry`. | **Verified in source** |
| B. Only `?demoEntry=true` | `DEMO_ENTRY_ENABLED_VALUE = "true"` (`demo-entry.ts` 12–13, 22, 25, 28). Loose values are not accepted in the string/URLSearchParams paths. Record path also accepts boolean `true`. | **Verified in source** |
| C. Isolated demo mode label | `auth.tsx` 278–284: heading **Isolated demo mode**; copy states hidden unless explicitly requested | **Verified in source** |
| D. Sign-in / sign-up / forgot | `auth.tsx` 17, 65–147, 195–269, 300–335: `signin` / `signup` / `forgot` modes unchanged in this mission’s files | **Verified in source** (ordinary flows not browser-tested) |
| E. Query param does not bypass server auth | UI calls `provisionDemo()` (`auth.tsx` 34–39). Handler still gates at `demo-provision.functions.ts` 212–216 **before** `import("@/integrations/supabase/client.server")` at 218 | **Verified in source** |
| F. Literal `ALLOW_DEMO_PROVISIONING === "true"` | Code is `!== "true"` throw (`demo-provision.functions.ts` 212). Equivalent fail-closed literal. | **Verified in source** |
| G. `NODE_ENV` not used as identity | `demo-entry.ts` executable body has no `NODE_ENV` / `import.meta.env` / `process.env`. `auth.tsx` demo visibility uses `window.location.search` only. | **Verified in source** |
| H. Env/server gate unmodified | `git diff` base..HEAD on `demo-provision.functions.ts`, `.env.example`, `playwright.config.ts`, `infrastructure/deploy/scholar.env.example`: empty | **Verified from diff** |

`.env.example` line 16 remains `ALLOW_DEMO_PROVISIONING=false`. Playwright local webServer still defaults the gate to `"true"` (`playwright.config.ts` 41) — **unchanged** by this mission, TEST_ONLY config.

### 8.2 Test behavior verified

`tests/unit/demo-entry.test.ts` asserts default hidden, rejects `demoEntry=1` / `TRUE` / `yes`, accepts `demoEntry=true`, strips comments and forbids env reads in the helper, keeps sign-in/sign-up/reset strings in `auth.tsx`, and asserts the provisioner gate precedes the service-role import.

`tests/unit/onboarding-credential-isolation.test.ts` and `tests/unit/scholar-invariant-environment-gated.test.ts` still pin the same gate.

### 8.3 Live production configuration

**UNKNOWN.** Deployed `ALLOW_DEMO_PROVISIONING` was not read. Do not infer it.

If a live process has the gate `"true"` **and** a visitor uses `?demoEntry=true`, provisioning can still run. The default `/auth` page does not show the button.

### 8.4 Not independently verified

- Browser click-through of sign-in/sign-up/forgot.
- SSR vs client first paint of `showDemoEntry` (`typeof window !== "undefined"` is false during SSR; CTA hidden on server render).
- Whether any reverse proxy strips query parameters.

---

## 9. Public homepage correction evidence

### 9.1 `/` visitor path (`frontend/src/routes/index.tsx`)

| Condition | Render | Lines |
|---|---|---|
| `loading` | Loading placeholder | 126–128 |
| `school` truthy (tenant subdomain or `?school=`) | `PublicSchoolSite` | 130–133 |
| else | `PublicPlatformHome` | 135–137 |
| `!loading && role && !tenantSlug` | `navigate` to `scholarWorkspaceHome(role)` | 34–38 |

Import is `PublicPlatformHome` (`index.tsx` 6). There is **no** import of `CommandCentre` on this route.

### 9.2 `PublicPlatformHome`

`frontend/src/components/public/platform-home.tsx` 13–79: existing `/icons/icon-192.png`, `PLATFORM_NAME` / `PLATFORM_TAGLINE` / `PLATFORM_PAGE_DESCRIPTION`, links to `/auth` and `/coregrid`. No live metrics, no `tenant:coregrid-demo`.

No file named as a Sherivs-specific logo exists in the tree. The existing public icon is reused. **Verified.**

### 9.3 In-memory Command Centre

`frontend/src/components/command-centre/command-centre.tsx` 52–53 still defines `DEMO_TENANT = "tenant:coregrid-demo"` and `DEMO_AUTHOR = "user:demo-administrator"`.

Repository search for `from "@/components/command-centre/command-centre"` and `<CommandCentre` under `frontend/` returned **no matches**. The component is **unmounted** from current application routes, not only from `/`.

Authenticated `/command-centre` (`frontend/src/routes/_authenticated/command-centre/index.tsx`) is a different surface (`CommandCentreOperations`), super-admin gated, and was not modified in this mission’s diff.

### 9.4 Domain routing

`frontend/src/lib/tenant.ts` is **UNCHANGED** vs inventory base (`git diff` empty). `PLATFORM_HOSTS` still lists `universalschoolos.com` variants. `index.tsx` 24–26 still uses canonical/og `https://universalschoolos.com/`. DNS and Vercel were not changed (no `vercel.json` in the repository).

### 9.5 Remaining hardcoded demo on other routes

Replacing `/` does **not** eliminate all demo content in the application. Remaining (out of this mission’s mount path, still in tree):

- Unmounted `command-centre.tsx` fixture tenant IDs.
- Gated `/auth?demoEntry=true` provisioner identifiers (`demo-enterprise`, `admin@demo.school`) in `demo-provision.functions.ts`.
- Super-admin self-report synthetic orgs (Riverside / Northgate) — not this route.
- `?school=demo` would still resolve a tenant **if** such a school row exists (live row UNKNOWN).

---

## 10. Metric-correction evidence

### 10.1 Former fabricated values

Search of `frontend/` at inspection HEAD:

| Pattern | Matches in `frontend/` |
|---|---|
| `parentScore = 70` | none |
| `feeScore = 100` | none |
| `srate ?? 100` | none |
| `savg ?? 60` | none |

### 10.2 Honest composition (`honest-scores.ts`)

| Function | Empty/missing behavior | Lines |
|---|---|---|
| `attendanceRate` | `[]` / null / undefined → `null` (not 100) | 27–31 |
| `academicAverage` | empty → `null` (not 60) | 33–37 |
| `feeCollectionRate` | `totalBilled > 0` required; else `null` (not 100) | 39–42 |
| `parentEngagementRate` | `activeStudents > 0` required; else `null` | 49–52 |
| `composeWeightedScore` | all null → `overall: null` | 54–69 |
| `studentRiskFromAvailable` | no attendance and no grades → `risk: null`; fees not defaulted | 87–101 |

### 10.3 Production-reachable portal wiring

**`/admin/intelligence`** (`intelligence.tsx`):

- Feature lock: `canIntelligence` / `FeatureLockedCard`; query `enabled: !!schoolId && canIntelligence` (60–70).
- Attendance, grades, fees, teachers, students, staff logs, sports, burnout profiles: `.eq("school_id", schoolId)` (83–115).
- `attendanceScore = attendanceRate(attRows)` (120); `feeScore = feeCollectionRate(...)` (132); `parentScore = parentEngagementRate(activeStudents, uniqueReaders)` (146).
- UI: overall `null` → "Unavailable — not enough records"; component `null` → "Unavailable" (339–384).

**Caveat (not a silent 70, but provenance incomplete):** `news_reads` is selected **without** `.eq("school_id", schoolId)` (116). Unique-reader counts may not be tenant-isolated. Parent engagement on this page is **derived**, not hardcoded 70, but **UNVERIFIED as a tenant-accurate metric**.

**`/admin/health-certificate`** (`health-certificate.tsx`):

- Feature lock: `canHealth` / `FeatureLockedCard`; `enabled: !!schoolId && canHealth` (74–80).
- Same honest helpers; `const parentScore: number | null = null` (141–143) with note that a silent 70 is forbidden.
- Overall gauge hidden when `d.overall === null` (311–317).

**`/teacher/class-intelligence`** (`class-intelligence.tsx`):

- Classes: `.eq("school_id", schoolId!).eq("teacher_id", teacherId!)` (27–31); bulk attendance/grades/students filtered by those class IDs (43–57).
- `attendanceRate(sa)` and `studentRiskFromAvailable({ attendanceRate: srate, gradeAverage: savg })` (103–108).
- UI: `s.risk == null` → "Not enough data" (176–178); attendance/grades `null` → "—".

No new fabricated numeric placeholders were introduced as replacements. Opportunity copy on intelligence still contains unverified marketing claims (for example “23% better student outcomes” at 214) — not a school-health score; left in place; **not claimed as verified product truth**.

### 10.4 Tests

`honest-scores.test.ts` covers empty attendance, missing fees, missing inputs, populated rates, and student risk without feeScore 100. Structural tests assert the portal files no longer contain the old literals and still contain `school_id` filters and FeatureLocked gates.

---

## 11. Test commands, output, and actual results

### 11.1 Previously reported result (historical)

Recorded in the prior report revision and in `/opt/cursor/artifacts/sherivs-production-demo-ui-metric-correction-vitest.log` (mtime 2026-10-15 19:04): 10 files, 109 passed. Treated as historical until re-run.

### 11.2 Independently re-run during this verification

**Command:**

```
npx vitest run \
  tests/unit/demo-entry.test.ts \
  tests/unit/honest-scores.test.ts \
  tests/unit/sherivs-production-demo-ui-correction.test.ts \
  tests/unit/onboarding-credential-isolation.test.ts \
  tests/unit/scholar-invariant-environment-gated.test.ts \
  tests/unit/site-marketing.test.ts \
  tests/unit/foundation.test.ts \
  tests/unit/p08-enforcement-surface.test.ts \
  tests/unit/command-centre-functions-invariants.test.ts \
  tests/unit/command-centre-contract-governance.test.ts
```

**Exit status:** 0  
**Test files:** 10 passed (10), 0 failed  
**Tests:** 109 passed (109); 0 failed, 0 skipped, 0 todo (Vitest summary did not report skipped/todo)  
**Started:** 2026-10-15 19:14:41  
**Duration:** 5.16s  
**Log:** `/opt/cursor/artifacts/sherivs-production-demo-ui-metric-correction-verification-vitest.log`

### 11.3 What these tests establish

- Helper and route **source contracts** for default-hidden demo entry, explicit opt-in, leftover fabricated literals, honest empty scores, `school_id` string presence, FeatureLocked string presence, provisioner gate ordering, and `/command-centre` honest-substrate wiring.
- Local secrets scanner in `foundation.test.ts` (file scan, not a live secret store).

### 11.4 What they do not establish

- Live production or staging behavior.
- Browser UX, Playwright, or a running dev server.
- RLS correctness, grant correctness, or FORCE RLS.
- Tenant isolation of `news_reads`.
- Deployed `ALLOW_DEMO_PROVISIONING`.
- That `sherivs.com` serves this commit.

### 11.5 NOT EXECUTED

| Test | Why |
|---|---|
| Playwright / `tests/e2e` | Requires local/live server and Supabase credentials (`tests/e2e/helpers.ts`) |
| Browser walkthrough of `/` and `/auth` | Network and/or local app + backend |
| Production/staging HTTP | Network to live hosts forbidden |
| Database/RLS tests | Database access forbidden |
| `scripts/db-apply.mjs` / staging runner | Database and/or production-defaulting tooling |

---

## 12. Security-boundary audit

Compared `190955201514edc6932296b001f1f28729703aee` → inspection HEAD via `git diff --name-only` / `--stat` for the listed classes.

| Category | Result |
|---|---|
| Database schemas / migration files (`database/`) | **NOT CHANGED, VERIFIED FROM DIFF** (empty) |
| Supabase configuration (`database/supabase/config.toml`, client modules) | **NOT CHANGED, VERIFIED FROM DIFF** |
| Database execution scripts (`scripts/db-apply.mjs`, `scripts/staging/`, other `scripts/` in this range) | **NOT CHANGED, VERIFIED FROM DIFF** (empty name-only) |
| Environment-variable declarations (`.env.example`, `infrastructure/deploy/scholar.env.example`, `playwright.config.ts`) | **NOT CHANGED, VERIFIED FROM DIFF** |
| Secrets or credentials in the tree | **NOT CHANGED, VERIFIED FROM DIFF** (no secret files in the 12-path mission diff) |
| Vercel configuration | **UNKNOWN / NOT VERIFIED** for the live Vercel project. `vercel.json` is **absent** from the repository. Diff cannot prove console settings. |
| Domain routing in app (`tenant.ts`) | **NOT CHANGED, VERIFIED FROM DIFF** |
| DNS | **UNKNOWN / NOT VERIFIED** (not in git; this mission did not query DNS) |
| Authentication / authorization **policies** (RLS SQL, grants) | **NOT CHANGED, VERIFIED FROM DIFF** (no SQL). Application FeatureLocked / `school_id` filters on edited pages remain. |
| Deployment workflows (`.github/`) | **NOT CHANGED, VERIFIED FROM DIFF** (empty) |
| Production or staging **data** | **UNKNOWN / NOT VERIFIED** (no database access). Diff cannot prove data. |

`demo-provision.functions.ts` server gate: **NOT CHANGED, VERIFIED FROM DIFF** (0-byte diff).

### This reporting mission

- Did not connect to PostgreSQL or Supabase.
- Did not make application-host or cloud-control network requests.
- Re-ran local Vitest only.
- Did not deploy.

Limitation: this report cannot independently prove that **earlier** agent turns never contacted a network; it can prove **this verification pass** did not, and that the committed mission range contains no schema/env/workflow files.

---

## 13. Explicit list of unverified claims and limitations

1. Deployed production/staging `ALLOW_DEMO_PROVISIONING` — **UNKNOWN**.
2. Whether `demo-enterprise` / `admin@demo.school` rows exist — **UNKNOWN**.
3. Whether `sherivs.com` / `www` / `app` / `console` currently serve this commit — **UNKNOWN** (no deploy authorized).
4. Vercel project env groups, preview protection, host bindings — **UNKNOWN** (`vercel.json` absent).
5. DNS — **UNKNOWN**.
6. Parent engagement on `/admin/intelligence` as a **tenant-accurate** figure (`news_reads` unscoped) — **UNVERIFIED**.
7. Browser sign-in/sign-up/forgot — **NOT EXECUTED**.
8. Playwright e2e — **NOT EXECUTED**.
9. Live RLS / SHERIVS-001/002/003 exploit or catalog proof — **NOT EXECUTED** (forbidden).
10. That unmounted `command-centre.tsx` cannot be reached via an undiscovered dynamic import — **low residual uncertainty**; static import search found none.
11. Opportunity-copy percentages on intelligence — **not verified product metrics**.

---

## 14. Production and staging status

| Fact | Status |
|---|---|
| Application source on this branch | Corrected as described |
| Production deployment of this branch | **Not performed. Not claimed.** |
| Staging deployment | **Not performed. Not claimed.** |
| Production/staging databases | **Not contacted.** Current demo-row presence **UNKNOWN**. |
| GATE4 emptiness | Historical; not rechecked |
| Copy of demo data to staging | **No evidence in this mission; not claimed** |

---

## 15. Confirmation that SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain OPEN

This UI mission did not inspect live policies, did not modify SQL, and did not run exploit tests.

| ID | Severity | Finding (preserved) | Status |
|---|---|---|---|
| **SHERIVS-001** | CRITICAL | Identity self-update privilege escalation, including role/school assignment risks, authenticated column grants, membership synchronization, administrator insertion paths, and active-state enforcement. | **OPEN** |
| **SHERIVS-002** | HIGH | Broad tenant authorization policies, broad grants, and potential excessive privileges including previously identified TRUNCATE exposure. | **OPEN** |
| **SHERIVS-003** | HIGH | Sensitive HR, financial, NIN, banking, and biometric information potentially exposed through broad policies or shared table access. | **OPEN** |

This UI/metric correction **must not** be represented as resolving these findings.

---

## 16. Residual risks

| Risk | Severity | Notes |
|---|---|---|
| Live gate `"true"` plus `?demoEntry=true` still provisions | High if gate on | UI default hidden; server gate unchanged; live gate UNKNOWN |
| `news_reads` unscoped parent rate | Medium | Can mix tenants if RLS does not constrain the client query; RLS itself is SHERIVS-001/002 territory |
| Unmounted Command Centre file still in repo | Low | Not imported; could be remounted later |
| Host identity still Universal School OS | Medium | Intentional non-change; `console` still not reserved |
| Playwright defaults demo gate on locally | Low | Test config only; unchanged |
| Marketing opportunity copy | Low | Not school-health scores |
| SHERIVS-001/002/003 | Critical / High | Independent of this UI work |

---

## 17. Recommended next engineering mission

Do **not** combine these with an unauthorized deploy.

1. **Authorized read-only environment inspection** of production and staging: `ALLOW_DEMO_PROVISIONING` presence (not the secret values of other keys), whether demo fixture identifiers exist as rows, Vercel host→project bindings. No copy/delete.
2. **Application-security / RLS work** on SHERIVS-001, SHERIVS-002, SHERIVS-003 under their own authorization — not this UI branch.
3. Optional follow-on (separate mission): scope `news_reads` by `school_id` or drop parent engagement from `/admin/intelligence` until a tenant-scoped source exists; align `PLATFORM_HOSTS` to existing Sherivs hosts **without** DNS changes.
4. Deploy only after (1) and a human authorization record. This report is not that authorization.

---

## 18. Reproducibility (safe local commands)

Run from a clone of this branch. Do **not** export production `DATABASE_URL`. Do **not** run `scripts/db-apply.mjs` or the staging runner.

```bash
git branch --show-current
git rev-parse HEAD
git status --porcelain
git log --oneline 190955201514edc6932296b001f1f28729703aee..HEAD
git diff --name-status 190955201514edc6932296b001f1f28729703aee..HEAD

# Confirm fabricated literals are absent in application source
rg -n "parentScore\\s*=\\s*70|feeScore\\s*=\\s*100|srate \\?\\? 100|savg \\?\\? 60" frontend || true

# Confirm public / does not import the in-memory Command Centre
rg -n "command-centre/command-centre|<CommandCentre" frontend/src/routes/index.tsx frontend/src/components/public || true

# Confirm server gate unchanged vs inventory base (expect empty)
git diff 190955201514edc6932296b001f1f28729703aee HEAD -- \
  frontend/src/lib/runtime/scholar/demo-provision.functions.ts \
  .env.example playwright.config.ts frontend/src/lib/tenant.ts database scripts .github

npx vitest run \
  tests/unit/demo-entry.test.ts \
  tests/unit/honest-scores.test.ts \
  tests/unit/sherivs-production-demo-ui-correction.test.ts \
  tests/unit/onboarding-credential-isolation.test.ts \
  tests/unit/scholar-invariant-environment-gated.test.ts \
  tests/unit/site-marketing.test.ts \
  tests/unit/foundation.test.ts \
  tests/unit/p08-enforcement-surface.test.ts \
  tests/unit/command-centre-functions-invariants.test.ts \
  tests/unit/command-centre-contract-governance.test.ts
```

Do not point these commands at production or staging databases.

---

## Historical implementation notes (preserved)

Before / after behavior from the implementation record remains accurate at inspection HEAD:

### Public `/auth`

| | Before | After |
|---|---|---|
| Demo CTA | Always visible (“Enterprise demo”) | Hidden by default |
| Explicit demo UI | None | `?demoEntry=true` shows **Isolated demo mode** |
| Server provisioner | Refuses unless `ALLOW_DEMO_PROVISIONING === "true"` | Unchanged |
| Sign-in / sign-up / forgot | Present | Present |

### Public `/`

| | Before | After |
|---|---|---|
| No tenant, not signed in | In-memory Command Centre | `PublicPlatformHome` |
| Tenant resolved | `PublicSchoolSite` | Unchanged |
| Signed-in on platform host | Workspace redirect | Unchanged |

### Metrics

| Path | Before | After |
|---|---|---|
| `/admin/intelligence` | `parentScore = 70`; empty fees → 100% | Derived or unavailable; empty → unavailable |
| `/admin/health-certificate` | `parentScore = 70`; empty fees → 100% | Parent explicitly null; honest-scores |
| `/teacher/class-intelligence` | attendance `?? 100`; grades `?? 60`; `feeScore = 100` | Available attendance/grades only |

---

## Required closing statements

No database or network was contacted during this verification pass.  
No staging restoration occurred.  
No production resources were changed.  
No demo records were copied or deleted.  
No secrets were exposed.  
No deployment occurred.  
SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain OPEN.
