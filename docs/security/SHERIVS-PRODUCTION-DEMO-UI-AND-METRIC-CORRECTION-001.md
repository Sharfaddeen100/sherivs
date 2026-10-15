# SHERIVS-PRODUCTION-DEMO-UI-AND-METRIC-CORRECTION-001

**Mission ID:** SHERIVS-PRODUCTION-DEMO-UI-AND-METRIC-CORRECTION-001  
**Mission type:** Application-code-only correction  
**Version-target classification:** ACTIVE-V1 application UI/metric honesty. No V2/V3 implementation.  
**Source audit:** `docs/security/SHERIVS-ENVIRONMENT-SEPARATION-AND-DEMO-CONTAMINATION-AUDIT-001.md`  
**Date (authoring):** 2026-10-15  
**Verdict:** **PASS WITH CONDITIONS**

This mission corrects confirmed production-reachable demo UI and misleading hard-coded metrics in source. It does not deploy. It does not claim the live production site has changed.

---

## 1. Exact commit and working-tree status

Recorded from local git only.

| Item | Value |
|---|---|
| Branch | `cursor/sherivs-production-demo-ui-metric-correction-5537` |
| Implementation commit | `45def42ecafd53613809046f012352756379ff21` |
| Test-fix commit | `7404298d5f1f8dd546cd33ec6e27f10448eca1d5` |
| Base at branch start | `190955201514edc6932296b001f1f28729703aee` (environment-separation inventory) |
| Working tree at report authoring | this report uncommitted |
| PR | https://github.com/vibeoraai-bit/coregrid-scholar-migration/pull/37 |

No `.env`, Vercel, DNS, migration runner, or SQL files were modified.

---

## 2. Files changed

| File | Change |
|---|---|
| `frontend/src/lib/runtime/scholar/demo-entry.ts` | **Added.** Explicit `?demoEntry=true` opt-in helper. Default hidden. Does not read `NODE_ENV`. |
| `frontend/src/lib/runtime/scholar/honest-scores.ts` | **Added.** Attendance/fees/parent/staff/academic composition. Empty inputs are `null`, never 100 or 70. |
| `frontend/src/components/public/platform-home.tsx` | **Added.** Public `/` landing using `/icons/icon-192.png`, `PLATFORM_NAME`, real `/auth` and `/coregrid` links. |
| `frontend/src/routes/auth.tsx` | Demo CTA rendered only when `shouldShowPublicDemoEntry` is true; labelled isolated demo mode. Sign-in/sign-up/forgot unchanged. |
| `frontend/src/routes/index.tsx` | Unauthenticated no-tenant `/` renders `PublicPlatformHome` instead of `CommandCentre`. Tenant `PublicSchoolSite` and signed-in workspace redirect preserved. Canonical host string unchanged. |
| `frontend/src/routes/_authenticated/admin/intelligence.tsx` | Uses honest-scores; parent engagement from existing news-read/student counts; empty fees/attendance unavailable. |
| `frontend/src/routes/_authenticated/admin/health-certificate.tsx` | Same composition; parent engagement unavailable (no new unscoped query). Empty states for missing components. |
| `frontend/src/routes/_authenticated/teacher/class-intelligence.tsx` | Risk from available attendance/grades only. No `feeScore = 100`, no empty attendance as 100, no grade default 60. |
| `tests/unit/demo-entry.test.ts` | **Added.** |
| `tests/unit/honest-scores.test.ts` | **Added.** |
| `tests/unit/sherivs-production-demo-ui-correction.test.ts` | **Added.** Structural wiring tests. |

Unchanged on purpose: `demo-provision.functions.ts` server gate, `.env.example`, `playwright.config.ts`, `frontend/src/lib/tenant.ts`, migration runner, canonical SQL, Vercel/DNS.

---

## 3. Before / after behavior

### 3.1 Public `/auth`

| | Before | After |
|---|---|---|
| Demo CTA | Always visible (“Enterprise demo”) | Hidden by default |
| Explicit demo UI | None | `?demoEntry=true` shows a panel labelled **Isolated demo mode** |
| Server provisioner | Refuses unless `ALLOW_DEMO_PROVISIONING === "true"` | **Unchanged** |
| Sign-in / sign-up / forgot | Present | Present |

`NODE_ENV` is not used as production identity. The UI opt-in is not an environment-variable change and does not enable provisioning.

This mission does **not** infer the deployed production value of `ALLOW_DEMO_PROVISIONING`. If that flag is `"true"` in a live process, an operator who also adds `?demoEntry=true` can still call the provisioner. The production-facing default page does not show the button.

### 3.2 Public `/`

| | Before | After |
|---|---|---|
| No tenant, not signed in | In-memory Command Centre (`tenant:coregrid-demo`, `user:demo-administrator`) | `PublicPlatformHome` with existing icon `/icons/icon-192.png`, platform name/tagline, Sign in, Platform overview |
| Tenant resolved | `PublicSchoolSite` | Unchanged |
| Signed-in on platform host | Redirect to workspace | Unchanged |
| Fictional operational metrics on `/` | Command Centre phase counts and in-memory orgs | None. No live metrics are claimed. |

The Command Centre component file remains in the repository for existing contract tests. It is not mounted on `/`.

No dedicated file named “Sherivs logo” exists in the tree. The supplied public icon `public/icons/icon-192.png` is used. Domain routing (`PLATFORM_HOSTS`, reserved subs, canonical `universalschoolos.com` href) was not changed.

### 3.3 Parent and teacher metrics

| Path | Before | After |
|---|---|---|
| `/admin/intelligence` | `parentScore = 70`; empty fees → 100% | Parent rate from existing news-read / active-student counts, or unavailable. Empty fees/attendance/staff/grades → unavailable, omitted from the weighted overall. |
| `/admin/health-certificate` | `parentScore = 70`; empty fees → 100%; empty attendance → 0% (still a number) | Parent score unavailable (no extra unscoped query). Other components use honest-scores. Overall gauge hidden when nothing is measurable. |
| `/teacher/class-intelligence` | `attScore = srate ?? 100`; `grScore = savg ?? 60`; `feeScore = 100` | Risk only from available attendance and grades. Missing inputs → “Not enough data”. Fees omitted (this page does not load fee rows). |

Authorization: admin pages still require the existing feature flags and `school_id` filters. Teacher queries still filter `school_id` and `teacher_id`. No schema change. No new database tooling.

---

## 4. Tests added and exact results

Offline `npx vitest run` only. No Playwright against a live server. No Supabase. No PostgreSQL.

Command:

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
  tests/unit/command-centre-functions-invariants.test.ts
```

**Result: Test Files 9 passed (9). Tests 97 passed (97).**

Log: `/opt/cursor/artifacts/sherivs-production-demo-ui-metric-correction-vitest.log`

Covered:

- Demo entry default hidden; `?demoEntry=true` shown; loose values (`1`, `TRUE`, `NODE_ENV`) rejected.
- `/auth` still contains sign-in, sign-up, forgot-password.
- Server gate `ALLOW_DEMO_PROVISIONING !== "true"` still throws before service-role import.
- Empty attendance is not 100%.
- Missing fees are not 100% collection.
- Missing score inputs do not produce an overall or student risk number.
- Valid populated attendance/grades/fees compute real rates.
- `/` does not import or render `CommandCentre`.
- `school_id` filters remain on the corrected portal queries.

Vitest did not open a database socket. `foundation.test.ts` ran the local secrets scanner only.

---

## 5. Evidence that no network or database was contacted

- No `DATABASE_URL`, `STAGING_DATABASE_URL`, or Supabase client was used by this mission’s tests.
- No `scripts/db-apply.mjs`, staging runner, or management-API script was executed.
- Vitest files are unit/structural. Honest-scores tests pass in-memory fixtures only.
- This process did not call production or staging hosts.

---

## 6. Confirmation: no deployment or production-resource change

- No Vercel deploy.
- No env var mutation.
- No DNS change.
- No production or staging database row created, copied, or deleted.
- Demo provisioning was not enabled.
- Live `ALLOW_DEMO_PROVISIONING` was not read and is not inferred.

Git push of this branch is source control only.

---

## 7. Remaining hard-coded or demo-content findings

Still present after this mission (from the source audit; not in scope here):

- `PLATFORM_HOSTS` still lists `universalschoolos.com`, not Sherivs hosts. `console` is not reserved.
- Canonical/og URL on `/` still names `https://universalschoolos.com/`.
- `frontend/src/components/command-centre/command-centre.tsx` still contains `tenant:coregrid-demo` (unmounted from `/`).
- Super-admin self-reports still use synthetic “Riverside Institute” / “Northgate Clinic”.
- Playwright local webServer still defaults `ALLOW_DEMO_PROVISIONING` to `"true"` (test config; unchanged).
- Unscoped `DATABASE_URL` apply scripts and production-defaulting management scripts remain.
- Intelligence opportunity copy still includes unverified marketing claims (for example “23% better student outcomes”) — not a numeric school-health placeholder, left in place.
- `news_reads` on admin intelligence remains unscoped by `school_id` (pre-existing; this mission did not replicate that query onto the health certificate).

---

## 8. Findings that require separate environment authorization

- Live production and staging values of `ALLOW_DEMO_PROVISIONING`.
- Whether `demo-enterprise` / `admin@demo.school` rows exist in either database.
- Vercel host → project bindings and preview protection.
- Whether `/` on `sherivs.com` currently serves this commit (it does not until a separately authorized deploy).
- Fresh staging/production catalogs. GATE4 remains historical.

Do not copy or delete demo records without that inventory.

---

## 9. SHERIVS-001 / 002 / 003

SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain **OPEN**.

This mission did not modify the migration runner, did not connect to a database, and does not close application RLS findings.

---

## 10. Conditions on the verdict

1. Code on this branch implements the scoped UI/metric corrections. The deployed production experience is unchanged until a later authorized deploy.
2. Explicit `?demoEntry=true` can still reveal the labelled CTA; provisioning still requires the server gate. Live gate state is UNKNOWN.
3. Host-identity (`PLATFORM_HOSTS`, Sherivs canonical URLs) was intentionally not changed.
4. Remaining audit items in section 7 are open.

**PASS WITH CONDITIONS** for implementation of the scoped application corrections.

---

## Required closing statements

No database or network was contacted.  
No staging restoration occurred.  
No production resources were changed.  
No demo records were copied or deleted.  
No secrets were exposed.  
No deployment occurred.  
SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain OPEN.
