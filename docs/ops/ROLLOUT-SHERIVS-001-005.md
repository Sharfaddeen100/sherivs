# Production rollout plan: SHERIVS-001 → 005 (security + NDPA release)

Status: **PLAN ONLY.** Nothing in this document has been run against production. Every
production step below needs Muhammad's explicit go.

Production facts (read-only preflight, 2026-10-20):
- Prod has **no migration ledger** (`supabase_migrations` schema absent).
- `schools.paystack_secret_key` is **readable by anon and authenticated** (live exposure).
- Prod has out-of-band tables and objects that were not in the repo: `cg_api_key`,
  `cg_org_communication_sender`, `organization_memberships`, membership-aware
  `get_my_school_id`/`get_my_role`, the `ensure_rls` event trigger and widened status
  constraints. They are now captured in `20261003000042_platform_capture_out_of_band_tables.sql`.
  A local replay of 69 pre-SHERIVS migrations + 0042 matches prod's `public` schema dump exactly (0 diff lines).

## 0. New order at a glance

| Step | What | Who / where | Undo |
|---|---|---|---|
| 0a | Ship app with explicit `schools` column reads (hotfix PR #57) | Merge #57 → Vercel prod | Vercel "Promote previous" |
| 0b | Ledger repair: record the 72 existing versions (70 through `20261003000042` + `20261008000050`, `20261008000060`) | Dashboard SQL editor: `docs/ops/sql/ledger-repair.sql` | `DROP SCHEMA supabase_migrations CASCADE` |
| 0c | `supabase db push`: applies **only** `20261015000005` (Paystack column revoke) | Laptop CLI | `rollbacks/20261015000005_*.sql` + `migration repair --status reverted 20261015000005` |
| 0d | Verify step 0: `post-deploy-verify.sql` with `step = 0` → **19/19 true** | SQL editor | n/a |
| 0e | Rotate Paystack keys (they were readable) | Paystack dashboard → update the stored values | n/a |
| 1a | Merge the release (#51→#56) to default → Vercel prod | GitHub | Vercel "Promote previous" |
| 1b | `supabase db push`: the 11 SHERIVS migrations `20261020000020…0140` (0140 may already be applied via `lock-super-admin-bootstrap.sql`; then 10, and use `--include-all`) | Laptop CLI | rollbacks newest-first (6c) |
| 1c | Verify step 1: `post-deploy-verify.sql` with `step = 1` → **19/19 true** | SQL editor | n/a |
| F | Identity freeze (`20261015000010…sql.proposed`): **separate decision, see §9** | n/a | its rollback |

Steps 0a–0e are the **early window** (small, independent of the release, can go before Saturday).
Step 1 is the main release window.

## 1. Pre-flight (read-only, before each window)

1. Supabase dashboard → Database → Backups: confirm last daily backup < 24 h and PITR state.
   A verified encrypted logical dump also exists on the server (`~/backups/sherivs-prod-20261020T161018Z.dump.gpg`).
2. SQL editor → paste `docs/ops/sql/preflight-readonly.sql` → Run.
   It starts with `SET default_transaction_read_only = on` and works with or without a ledger.
   Expected before 0b: ledger `ABSENT`, release migrations not present, 3 captured tables present.

## 2. Step 0: Paystack fix (early window, ~15 min)

**Phone-friendly steps (Muhammad):**
1. GitHub app → PR #57 → mark "Ready for review" → Merge.
2. Vercel app → Deployments → wait until production is **Ready**. Open the site and log in as an admin
   once (dashboard + Settings page load = OK).
3. Laptop: Supabase dashboard → SQL editor → new query → paste `docs/ops/sql/ledger-repair.sql` → Run.
   Expect one result row: `72 | 20261008000060`. If it says STOP, **stop** and send me the message.
4. Laptop terminal (repo on the default branch):
   `supabase db push --db-url "$PROD_DB_URL" --dry-run`. It must list **exactly one** file:
   `20261015000005_sherivs_002_secret_column_privilege.sql`. Anything else = stop.
   Then run the same command without `--dry-run`.
5. SQL editor → paste `docs/ops/sql/post-deploy-verify.sql` (step stays `0`) → Run → all 19 rows `t`.
6. Re-check the site (public website pages + admin dashboard + Settings).
7. Rotate the Paystack secret key (Paystack dashboard), then save the new key in the app.

CLI alternative to step 3 (same effect):
`supabase migration repair --db-url "$PROD_DB_URL" --status applied <72 versions>`
(the exact list is in the header of `ledger-repair.sql`). Prefer the SQL file because it has guards.

**Go for step 0** (all true): #57 checks green; Vercel prod Ready and admin login works;
preflight shows ledger ABSENT and no SHERIVS objects; dry-run lists exactly one file.
**No-go:** any STOP from the repair script, dry-run lists anything else, or the site errors after 0a.

**Why this order:** the old app uses `select("*")` on `schools`. After the revoke, that returns
401 for anon (rehearsed). So the app must ship first. The new app's explicit reads work on both the old and the new schema.

## 3. Step 1: SHERIVS release (main window)

1. Merge the release PRs as described in §5 (release branch, merge commits, in order #51→#53→#54→#55→#56),
   then one PR to the default branch. Wait for Vercel prod Ready.
2. `supabase db push --db-url "$PROD_DB_URL" --dry-run` must list exactly these 11:
   `20261020000020, 0030, 0040, 0050, 0060, 0070, 0090, 0100, 0110, 0130, 0140`.
   If `docs/ops/sql/lock-super-admin-bootstrap.sql` was already pasted on prod, 0140 is in the ledger:
   the dry-run lists the other 10 and the CLI needs `--include-all` (they are older than 0140). Then push without `--dry-run`.
3. SQL editor → `post-deploy-verify.sql` with `SELECT 1 AS step` → all 19 `t`.
4. Smoke tests (§4).

**Go for step 1:** step 0 verified (19/19) and stable ≥ 1 day or same-day with no errors; release CI green;
dry-run lists exactly the 11 (or 10 + `--include-all` if 0140 was pre-applied); Muhammad decided on the freeze (§9).
**No-go:** any of those false; any unexpected file in the dry-run.

## 4. Smoke tests (after each step, one account per role)

- Public website: home, school page by slug, admission form submits.
- Admin: dashboard, Settings (school details load and save), fees list, students list.
- Teacher/bursar/parent/student: own dashboard loads; cannot see another school's data.
- Step 1 only: NDPA pages (consent, data-subject request) load.

## 5. Merge strategy

Unchanged: create `release/sherivs-001-005` from the default branch, merge #51 → #53 → #54 → #55 → #56
into it **in order with merge commits**, run CI, then open one PR to the default branch. Because #57 ships first,
merge the default branch into the release branch after #57 is merged. The files are identical, so expect no conflicts.

## 6. Rollback

### 6a. Triggers
Login or dashboard errors for any role, verify script shows `f`, website/admissions broken, or Supabase error rate spike.

### 6b. App (fastest, do first)
Vercel → Deployments → previous production deployment → "Promote to Production".

### 6c. Database
- Step 1: run `database/supabase/rollbacks/2026102000*.sql` **newest first** (0140 → 0020), each followed by
  `supabase migration repair --db-url "$PROD_DB_URL" --status reverted <version>`.
  The 0020 rollback is intentionally a no-op, because prod already had RLS on `cg_idempotency_record`.
- Step 0: run `rollbacks/20261015000005_sherivs_002_secret_column_privilege.sql`, then
  `migration repair --status reverted 20261015000005`. Only do this if absolutely needed: it re-exposes the secret.
- Ledger: it does not change app behaviour, so leave it in place.

## 7. Rehearsal record (local, disposable stack, prod-like start)

Start: 69 pre-SHERIVS + 0042, ledger dropped (matches prod), demo school seeded.

| Check | Result |
|---|---|
| Before: anon `select=*` / secret / new-app columns | 200 / 200 / 200 (exposure reproduced) |
| 0b ledger repair (as `postgres`) | 72 rows; idempotent re-run OK |
| 0c dry-run | exactly 1 file (0005); push OK |
| Verify step 0 | 19/19 |
| After: old-app `select=*` / secret / new-app columns / website by slug | 401 / 401 / 200 / 200 |
| Step 1 dry-run | exactly 10 (incl. 0130); push OK |
| Verify step 1 | 19/19 |
| Rollback step 1 (newest first) → verify step 0 | 19/19 |
| Rollback 0005 → old-app `select=*` | 200 |
| Re-apply (dry-run 11: 0005 + the 10) → verify step 1 | 19/19 |
| SQL suites on prod-like + step 1 (no freeze) | admission ✔, NDPA ✔, 003b ✘, cross-tenant ✘ (5 leaks); see §9 |
| Same + freeze applied | all 4 ✔ |
| Unit tests (vitest) / typecheck / neutrality guard | 9257 passed, 18 skipped / OK / PASS |

Fixes found by rehearsal: the ledger must be owned by `postgres` (the repair script now enforces this), and
the 0020 rollback must not disable RLS that prod already had.

## 8. Secrets rotation

Rotate the Paystack secret key right after step 0 (it was readable by anyone with the anon key).
Rotate any other keys per the existing SHERIVS-001 list before any git-history purge.

## 9. Decisions only Muhammad can make

1. **Early window for step 0** (PR #57): when?
2. **Rotate Paystack keys** after step 0 (recommended: yes).
3. **Identity freeze.** Prod's out-of-band `get_my_school_id`/`get_my_role` read `organization_memberships`.
   On that prod-like state, the rehearsal found two problems. First, non-admin users can move their own
   `users.school_id` to another school (5 leaks). Second, a deactivated admin keeps tenant-admin through an active membership.
   These are **live on prod today** and the release migrations through 0110 do not fix them; 0130 (membership-aware freeze, option b) does. The proposed freeze fixes both
   (all suites pass), but it replaces the two functions with users-only versions, which drops membership awareness.
   Options: (a) ship the freeze in step 1; (b) a membership-aware freeze (new work); (c) defer and accept the risk.
4. **Accept the captured drift** (`ensure_rls` event trigger, the widened status constraints marked HUMAN AUTHORIZED) as the new baseline.
5. **How to repair the ledger:** SQL file in the dashboard (recommended, guarded) or CLI `migration repair`.
