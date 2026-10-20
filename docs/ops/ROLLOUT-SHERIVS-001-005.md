# Production rollout plan: SHERIVS-001 → 005 (security + NDPA release)

Status: **PLAN, awaiting Muhammad's approval.** Nothing in this document has been run against
production, staging or Vercel. Every rehearsal below ran on a local disposable Supabase stack.

Target: Supabase project **`nwrflbpbhyiqdptmlccm`** (production) and the Vercel project
`coregrid-scholar-migration` (production branch = the repo default branch
`coregrid-scholar-migration`, auto-deploys on push).

Contents:
0. One-page summary
1. Pre-flight (backup, PITR, current migration state)
2. Build blocker fixes
3. Merge strategy
4. Migration application
5. Smoke tests
6. Rollback
7. Maintenance window and comms
8. Secrets rotation and history purge
9. Go/no-go and decisions

---

## 0. One-page summary

| Phase | What | Who | Downtime |
|---|---|---|---|
| P0 | Backup + run `docs/ops/sql/preflight-readonly.sql`, send the CSV | Muhammad | none |
| P1 | Apply 9 DB migrations (`supabase db push`) | Muhammad, or Grok Bot after explicit OK | none expected (~1 s locally) |
| P1v | Run `post-deploy-verify.sql` (phase 1) and do a quick smoke test of the **old** app | Muhammad + Grok Bot | none |
| P2 | Merge `release/sherivs-v1-security` → `coregrid-scholar-migration`; Vercel deploys | Muhammad (merge button) | none (atomic swap) |
| P2v | Smoke checklist §5 on the new app | Muhammad + one test account per role | none |
| P3 | Apply migration 0120 (hides `schools.paystack_secret_key`) | Muhammad | none |
| P3v | `post-deploy-verify.sql` (phase 3), quick smoke | Muhammad | none |
| P4 (separate decision) | Identity freeze `20261015000010_….sql.proposed` | later | none |

**Why three phases:** the OLD production app reads `schools` with `select("*")` (in
`app-context.tsx`, on every logged-in page). Migration 0120 (formerly 0010) switches `schools`
to column-level grants, so the old app would break on every page. The NEW app needs tables and
functions from migrations 0040–0110. So the order is: DB phase 1 (old-app compatible) → new app →
DB phase 3. Phase 3 has been renumbered and ships as `.sql.phase2`, so `supabase db push` skips it
until it is renamed.

**Live exposures that this release closes** (if production matches the repo baseline; the
pre-flight query confirms this):
- `schools.paystack_secret_key` is readable with the public anon key (closed in P3).
- Any school member (parent or student) can mark fees paid, edit students, and read every
  student's data in their school (closed in P1).
- About 40 tables are writable by any school member, including `parent_student_map` (closed in P1).
- Admissions PII is readable by every school member (closed in P1).
- TRUNCATE is granted to anon and authenticated on every table (closed in P1).

**Still open after this release until the identity freeze (P4) is applied:** a user can update
their own `users` row (role or school) and so escalate to admin, and a deactivated admin keeps
admin rights in the database. These are **pre-existing**. The local rehearsal without the freeze
reproduces them (sweep: 5 actors can move themselves to another school). Strong recommendation:
schedule P4 within days of P2. The new app already uses the server-side role-change path that
the freeze requires, so the freeze can only go in **after** P2.

---

## 1. Pre-flight (P0), all read-only

### 1a. Backup and PITR check (dashboard clicks)
1. Open <https://supabase.com/dashboard/project/nwrflbpbhyiqdptmlccm>.
2. Left sidebar → **Database** → **Backups**.
   - **Scheduled backups** tab: confirm a daily backup from the last 24 h exists (Pro plan and up).
     Note its timestamp.
   - **Point in Time** tab: if PITR is enabled, note the earliest recovery point. If it shows
     "not enabled", PITR is an add-on (Project Settings → Add-ons → Point in Time Recovery).
     It costs money, so it is **your decision**. It is not required if you take the manual dump below.
3. Manual safety copy (free, recommended regardless): Project Settings → **Database** →
   copy the connection string (Session pooler), then on your own machine run
   `pg_dump "<connection string>" --format=custom --no-owner --file=coregrid-prod-YYYYMMDD.dump`.
   Keep the file offline. **Do not paste the connection string into chat or a ticket.**
   (If you prefer not to use a terminal: the daily backup in step 2 is the minimum. Record its time.)
4. Write down the time of the backup you will rely on. That is the restore point for §6.

### 1b. Current state of production
Dashboard → **SQL Editor** → New query → paste `docs/ops/sql/preflight-readonly.sql` → **Run**.
It only contains SELECTs. Use **Export → CSV** and send me the file. It shows:
- **A0 / A:** every applied migration version (to compare with the repo; the repo baseline has
  69 migrations ending at `20261003000041`).
- **B:** whether any release migration is already applied (expected: all "not applied").
- **C:** whether the new objects exist (expected: all "missing").
- **D:** the current policies on fees, students, users, admissions, schools and storage.
- **E:** tables without RLS. **F:** anon/authenticated write and TRUNCATE grants.
- **G:** whether `paystack_secret_key` is exposed. **H:** row counts. **I:** users by role.

**Gate:** if A shows migrations that are not in the repo, or B shows anything already applied,
**stop**. I reconcile first (with `supabase migration repair` only after your OK).
If `supabase_migrations.schema_migrations` does not exist, production was not managed by the
CLI. Tell me, because then P1 uses the SQL editor path (§4c).

Locally rehearsed: the query runs cleanly on the repo baseline and returned exactly the
expected starting state (69 migrations, 11 release versions "not applied", 8 objects missing,
the secret column exposed, 63 tables with anon TRUNCATE).

---

## 2. Build blocker fixes (done in this PR)

| Fix | File | Why |
|---|---|---|
| Missing comma in an import list | `frontend/src/routes/_authenticated/admin/health-certificate.tsx` | Syntax error. It broke `tsc` and the Vercel build (every preview showed FAILED). |
| Server-only audit writer pulled into the client bundle | `frontend/src/lib/runtime/scholar/staff-privilege.functions.ts` (from PR #51) | After the syntax fix, `vite build` failed with TanStack Start's `import-protection` error. It is now imported dynamically inside the server path. |

Results on this branch:
- `vite build` (production): **passes** (client and server bundles).
- Client bundle scanned for `service_role`, `SERVICE_ROLE_KEY`, `PAYSTACK_SECRET` and `sk_test_` / `sk_live_`: **none**.
- Unit suite: 9224 passed, 6 files failing. All 6 are pre-existing baseline failures
  (`domain-runtime-recertification`, `mh-15-launch-criteria`, and 4 `mobile-*` tests), unchanged
  since before SHERIVS-001.
- `tsc --noEmit`: with the syntax error gone, tsc now gets past parsing and reports **67
  pre-existing type errors** that the syntax error had been hiding (50 in
  `tests/unit/sherivs-staging-migration-runner.test.ts`; the rest in tests and a few app files).
  **Vercel does not run tsc** (the build script is `vite build`), so these do not block the
  deploy. They do keep the GitHub "Verify" check red, as it was before. Recommended follow-up
  ticket; not a release blocker.
- Other red CI checks, all pre-existing and unrelated to this release: Terraform format checks
  on untouched files, and the "Fabric source invariants" check.

---

## 3. Merge strategy: release branch, merged in order, then a single merge to the default branch

**Choice:** create `release/sherivs-v1-security` from the current default branch, merge
#51 → #53 → #54 → #55 → this PR (#56) into it **in order with merge commits**, then open one PR
`release/sherivs-v1-security → coregrid-scholar-migration` and merge it with a merge commit.

Why not squash everything into one commit:
- The PRs are already stacked linearly (#53 is built on #51, #54 on #53, and so on), so merging
  in order has **no conflicts**. Squashing gains nothing.
- One merge into the default branch means **one Vercel production deploy** and one clean "previous
  deployment" to roll back to. Merging the 4 PRs straight into the default branch would trigger 4
  production deploys, and the middle ones (e.g. #51 alone) are not compatible with the phase-1 schema.
- Keeping the individual commits keeps the audit trail (each SHERIVS step and its tests) for the
  NDPA record. `git revert -m 1 <merge>` undoes the whole release in one step if needed.
- The release branch gets its own Vercel **preview** deployment, so the exact code that will go
  live can be checked on a preview URL before P2 (§5a).

Schema/app compatibility (checked):
- **Old app + phase-1 schema: compatible.** The old app's parent and student screens already
  filter to their own children or themselves. Its direct client writes are made only by roles that
  keep write access (bursar → fees, teacher → attendance and lesson plans, admin → admin pages).
  Admissions anon insert is kept. Website images use signed URLs, so dropping the public
  school-media read does not affect them.
- **Old app + 0120: NOT compatible** (`schools.select("*")`). That is why 0120 runs in P3.
- **New app + old schema: NOT compatible** (it needs `consent_records`, `can_manage_admissions()`,
  `school_tenant_map`, and others). That is why P1 runs before P2.
- **New app + phase-1 and phase-3 schema: compatible.** It selects explicit `schools` columns
  (`school-columns.ts`). Local tests cover this.

---

## 4. Migration application

### 4a. Ordered list (production)
**Phase 1** (applied together by one `supabase db push`):
1. `20261020000020_sherivs_002_cg_idempotency_record_enable_rls.sql`
2. `20261020000030_sherivs_002_admission_insert_check.sql`
3. `20261020000040_sherivs_002_admissions_and_media_privacy.sql`
4. `20261020000050_sherivs_002_seed_staff_types_guard.sql`
5. `20261020000060_sherivs_003_ndpa_foundations.sql`
6. `20261020000070_sherivs_003b_ndpa_completion.sql`
7. `20261020000090_sherivs_004_in_school_role_rls.sql`
8. `20261020000100_sherivs_004_in_school_write_roles.sql`
9. `20261020000110_sherivs_004_privilege_hardening.sql`

**Phase 3:**
10. `20261020000120_sherivs_002_schools_secret_column_privilege.sql` (formerly 0010; it ships as
    `.sql.phase2` and is renamed to `.sql` at P3).

**Excluded:** `20261015000010_sherivs_identity_privilege_freeze.sql.proposed` (P4, a separate decision).

### 4b. How (recommended): Supabase CLI, run by Muhammad
From a checkout of the merged release branch, on Muhammad's machine:
```
supabase login                       # opens the browser; no token pasted anywhere
supabase link --project-ref nwrflbpbhyiqdptmlccm --workdir database/supabase
supabase db push --workdir database/supabase --dry-run   # MUST list exactly the 9 phase-1 files
supabase db push --workdir database/supabase             # P1
```
P3:
```
git mv database/supabase/migrations/20261020000120_sherivs_002_schools_secret_column_privilege.sql.phase2 \
       database/supabase/migrations/20261020000120_sherivs_002_schools_secret_column_privilege.sql
supabase db push --workdir database/supabase --dry-run   # MUST list exactly 0120
supabase db push --workdir database/supabase
```
Then commit the rename on the default branch.

- **If `--dry-run` lists anything else, stop.**
- If you would rather I run these, you must explicitly authorise me to `supabase link` the
  production project for this one session. That breaks today's standing rule, so it needs a
  separate, explicit approval.

### 4c. Alternative: SQL editor
Paste each file, in order, into the SQL editor and run it. After each one, record it:
`supabase migration repair --status applied <version>` from the CLI. Without that, a later `db push`
would try to re-apply it. The files are idempotent-safe to re-run, but it is better not to.
This path is slower and easier to get wrong, so use the CLI unless §1b shows the history table is missing.

### 4d. Duration, locks, dry run
- Local rehearsal (empty data): phase 1 took ~1.0 s total, phase 3 ~0.1 s.
- No migration rewrites or scans table data. They create tables, functions and policies, and change
  grants. The only `ALTER TABLE … ADD COLUMN` is a nullable FK column
  (`admission_applications.student_id`), which is metadata-only.
- Policy and grant DDL takes short `ACCESS EXCLUSIVE` locks on fees, students, users, admissions
  and ~40 other tables. Each statement waits for running queries on that table to finish, so the
  real duration depends on traffic. Expected: seconds in a quiet window. Every file runs in its own
  transaction, so a failure rolls that file back fully.
- Optional guard (recommended): before P1, run `ALTER ROLE postgres SET lock_timeout = '10s';` in
  the SQL editor, and `ALTER ROLE postgres RESET lock_timeout;` afterwards. A blocked migration
  then fails cleanly instead of queuing traffic behind it, and can simply be retried.
- **Dry run done locally:** fresh stack at the repo baseline (69 migrations = what production
  should have) → `supabase migration up` applied exactly the 9 phase-1 files → verify (phase 1):
  17/17 ok → renamed 0120 → applied → verify (phase 3): 17/17 ok → freeze applied → every test
  suite passes:
  - RLS role test: ALL PASS. NDPA, tenant/media and admission tests: ALL PASS.
  - Cross-tenant sweep: 5053 PASS, 0 LEAK, 83 public by design.
- **Dry run against a copy of production's real schema** (`supabase db dump --schema-only`):
  only possible if you provide read access later. I will then replay the same sequence locally
  before P1.

---

## 5. Smoke tests

### 5a. Before P2 (on the Vercel preview of the release branch)
The preview points at production data. Use test accounts only, and Paystack **test mode**.
Run the same checklist as 5b.

### 5b. After P2 (production URL), with one test account per role
- [ ] **Admin:** log in, dashboard loads, school name and logo shown (this proves explicit `schools` columns work).
- [ ] **Admin:** Admin → HR → change a test staff member's role and active flag. It succeeds and an audit row appears.
- [ ] **Admin:** Admissions page lists applications. Open one; documents open.
- [ ] **Registrar** (a teacher with an active registrar position): sees only "Admissions", can open it, and gets "denied" on other `/admin` pages.
- [ ] **Bursar:** Fee plans → create a fee for a test student. It succeeds.
- [ ] **Parent:** Fees shows only their own child's fees; the child profile opens; another child's URL shows nothing.
- [ ] **Parent:** Pay a fee in Paystack **test mode** with card 4084 0840 8408 4081. After the
      redirect the fee shows **paid**, and `webhook_logs` shows `settled`.
- [ ] **Parent:** pay again with the same reference (refresh the callback). The fee stays paid with no double credit (`duplicate`).
- [ ] **Student:** dashboard, own fees and timetable load.
- [ ] **Teacher:** take attendance for a class and save it; lesson plans save.
- [ ] **Public (logged out):** school website loads with images, and an admissions form submit succeeds.
- [ ] **Super admin:** dashboard and billing load.
- [ ] Vercel → Deployment → **Logs**: no spike of 401/403/500 in the first 15 minutes.

### 5c. SQL verification
Run `docs/ops/sql/post-deploy-verify.sql` after P1 with `phase = 1`, and after P3 with `phase = 3`.
Every row must show `ok = true`.

---

## 6. Rollback

### 6a. Triggers (any one of these means roll back)
- Any `ok = false` in the verification query that cannot be explained in 10 minutes.
- Login fails for any role, or a dashboard shows a blank page or error for a role that worked before.
- The Paystack test payment does not settle, or the settlement double-credits.
- More than 2% of requests returning 5xx in the Vercel logs over 10 minutes, compared with the day before.
- The public website or admissions form is broken.

### 6b. App rollback (fastest; do this first)
Vercel dashboard → project → **Deployments** → the deployment before the release (note its
URL **before** P2) → **⋯ → Instant Rollback**. It takes about 10 s and does not touch the database.
- After P1 only: the old app is compatible, so no DB rollback is needed for an app problem.
- After P3, rolling the app back **requires rolling back 0120 first**, because the old app needs `schools.*`.

### 6c. Database rollback (per migration, newest first)
Every release migration has a script in `database/supabase/rollbacks/`. All 10 were rehearsed
locally: applied in reverse, then re-applied, with the verification query back to 17/17 ok.

| Migration | Rollback | Note |
|---|---|---|
| 0120 | `20261020000120_…schools_secret_column_privilege.sql` | Re-exposes the secret column. Only if the old app must run. |
| 0110 | `20261020000110_…privilege_hardening.sql` | Restores default grants. |
| 0100 | `20261020000100_…in_school_write_roles.sql` | Drops the restrictive policies. |
| 0090 | `20261020000090_…in_school_role_rls.sql` | Restores the school-wide policies. |
| 0070 | `20261020000070_…ndpa_completion.sql` | Drops the tenant map and student column. |
| 0060 | `20261020000060_…ndpa_foundations.sql` | **Drops the consent/DSR/incident tables, so any consents recorded since the deploy are lost.** Export them first. |
| 0050 / 0040 / 0030 / 0020 | matching files | 0030 and 0020 re-open known holes. Emergency use only. |

How: SQL editor → paste the rollback file → Run. Then mark it reverted:
`supabase migration repair --status reverted <version>`.
- Prefer a **targeted** rollback of the one migration that caused the problem; they are independent.
- Last resort: restore the backup or PITR point from §1a (Database → Backups → Restore). This
  loses all writes made since the backup, so it is the owner's decision only.

---

## 7. Maintenance window and comms

**Recommended window:** **Saturday 24 Oct 2026, 05:00–07:00 WAT** (04:00–06:00 UTC).
- Weekday school hours (07:30–15:00 WAT) and evening parent traffic (18:00–22:00 WAT) are the
  peaks. Saturday early morning is the quietest.
- Avoid fee deadlines, exam weeks and result-release days. Check the school calendar before confirming.
- Fallback: any weeknight 23:00–01:00 WAT.
- Expected user-visible downtime: **none** (online DDL, atomic Vercel swap). The window is there
  to give time to verify and roll back calmly.

**Comms to schools (send 48 h before; WhatsApp or email to school admins):**
> Dear {School} team,
> CoreGrid Scholar will receive a security and data-protection update on **Saturday 24 October,
> 5:00–7:00 am**. You do not need to do anything, and we expect no interruption. After the update,
> parents and students will only see their own records, fee payments are verified more strictly,
> and new privacy tools (consent records and data requests) are available to school admins.
> If anything looks wrong afterwards, reply to this message or call {support number}.
> — Muhammad, CoreGrid

**Post-window message (after the go decision):** "The update is complete. Thank you." If rolled
back: "We postponed the update; nothing changed for you."

---

## 8. Secrets rotation (do BEFORE any history purge)

The leaked values are in git history only (commit `144e60c9`, 2026-08-15; `.env` was deleted in
`01dca86`). HEAD is clean and the repo is private. Values were never printed or tested during this
work. Rotate them anyway: anyone who has ever had clone access, or any integration with repo read
access, can read them.

| # | Secret | Where to rotate | Done |
|---|---|---|---|
| 1 | Supabase **service_role JWT** (also as `VITE_SUPABASE_SERVICE_ROLE_KEY`) and anon JWT for **old project `qimawwdlgjtudzufgeox`** | If the project is retired: Dashboard → that project → Settings → General → **Pause** or **Delete project** (simplest, and it kills the keys). If still in use: Settings → **JWT Keys** → rotate the legacy JWT secret, or **API Keys** → create new secret keys, then **disable legacy API keys**. Update every place that used them. | ☐ |
| 2 | GitHub PAT (`ghp_…`, in `.mcp.json`) | github.com → Settings → Developer settings → Personal access tokens → find tokens created around Aug 2026 → **Delete**. Also check Settings → Security log for unexpected use. | ☐ |
| 3 | NVIDIA API key (`.env`, line 9) | build.nvidia.com (or NGC) → API keys → revoke it and create a new one if needed. | ☐ |
| 4 | Publishable key `sb_p…` for the old project (`.mcp.json`) | Not secret by design. It dies with #1. | ☐ |
| 5 | Production project `nwrflbpbhyiqdptmlccm` | gitleaks found **no** keys for this project in history. No rotation needed for the leak. Rotating it after the release is optional good hygiene. | ☐ |
| — | Paystack test key | **Not touched**, per your instruction. | — |

**History purge plan (only after 1–3 are done):**
1. Tell everyone with a clone to stop pushing. Pause the Vercel and Cursor GitHub integrations' pushes, if any.
2. On a fresh mirror clone: `git clone --mirror git@github.com:vibeoraai-bit/coregrid-scholar-migration.git`.
3. `git filter-repo --invert-paths --path .env --path .mcp.json --path claude-flow.config.json --path claude-flow.config.export.json`,
   or `--replace-text` with a file listing the leaked strings, to keep the files and redact the values.
4. Run `gitleaks git --redact` on the result. It must report 0 real secrets (test fixtures excepted).
5. `git push --force --mirror`. This rewrites **every** commit SHA, closes the PR heads' history, and
   breaks existing clones. Every collaborator must re-clone.
6. Ask GitHub Support to purge cached views and PR refs of the old commits (required for a full purge).
7. Re-run the pre-flight and smoke checks, because the release branch SHAs will have changed.

Recommendation: do the purge **after** this release is live and stable. A force-push mid-rollout
would invalidate the release branch.

---

## 9. Go/no-go and decisions

### Go criteria (all must be true)
- [ ] §1a backup timestamp recorded (and PITR status known).
- [ ] §1b pre-flight CSV reviewed: history matches the repo baseline, release migrations not applied.
- [ ] Release branch preview build is green on Vercel, and §5a smoke on the preview passes.
- [ ] `supabase db push --dry-run` lists exactly the 9 phase-1 files.
- [ ] The previous production deployment URL is noted for Instant Rollback.
- [ ] Schools notified 48 h ahead.
- [ ] Muhammad (or a delegate) is available for the whole window.

### No-go (postpone)
Any go item false; an unexplained difference in migration history; an active fee deadline or
exam day; Supabase or Vercel status incidents.

### Decisions only Muhammad can make
1. **Approve this plan** and the window (Sat 24 Oct, 05:00–07:00 WAT), or pick another.
2. **Who runs `supabase db push`:** you (recommended), or me with a one-time explicit `supabase link` authorisation.
3. **Whether to enable PITR** (paid add-on) or rely on the daily backup plus a manual dump.
4. **Identity freeze (P4) date.** Recommended: within a week after P2. Until then, self-role
   escalation and "deactivated admin keeps rights" stay open.
5. **Old project `qimawwdlgjtudzufgeox`:** delete or pause it (recommended if retired), or rotate its keys.
6. **History purge:** yes/no, and when (after rotation and after the release is stable).
7. **Who gets the school comms**, and the support contact to put in them.
8. Whether to provide read-only access for a `db dump --schema-only` rehearsal against production's real schema (optional, stronger dry run).
