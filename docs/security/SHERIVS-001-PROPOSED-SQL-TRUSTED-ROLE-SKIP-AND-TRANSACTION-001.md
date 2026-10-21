# SHERIVS-001-PROPOSED-SQL-TRUSTED-ROLE-SKIP-AND-TRANSACTION-001

**Mission ID:** SHERIVS-001-PROPOSED-SQL-TRUSTED-ROLE-SKIP-AND-TRANSACTION-001  
**Mission type:** Focused SQL proposal correction + offline static verification + adversarial testing + governance reporting  
**Classification:** PostgreSQL / Supabase RLS / identity privilege governance  
**Version-target classification:** ACTIVE-V1 identity / Scholar RLS helpers. No V2/V3 work. No apply.  
**Correction date:** 2026-10-15  
**Final verdict:** **PASS WITH CONDITIONS**

This mission corrects the two apply-blocking findings from `docs/security/SHERIVS-001-PROPOSED-SQL-INDEPENDENT-REVIEW-001.md`. It does **not** authorize staging or production application. SHERIVS-001, SHERIVS-002, SHERIVS-003, and the `news_reads` tenant-scoping concern remain **OPEN**.

No live database or external service was contacted.

---

## 1. Mission identity

SHERIVS-001-PROPOSED-SQL-TRUSTED-ROLE-SKIP-AND-TRANSACTION-001.

Independent review verdict on the previous proposal was **PASS WITH CONDITIONS** with two apply blockers:

- **B-1.** `IF auth.uid() IS NULL THEN RETURN NEW` treated an absent identity as trusted execution context.
- **B-2.** The forward proposed migration had no explicit transaction, so helper replacement could persist if trigger installation failed.

This mission rewrites the proposed SQL. It does not modify application code, canonical historical migrations, the 71-file pin, production or staging configuration, or secrets.

---

## 2. Baseline branch and HEAD

| Item | Value |
|---|---|
| Inspection started on | `cursor/sherivs-001-proposed-sql-independent-review-d80b` |
| Inspection HEAD | `e511b0b6bee0f4b05a8212c3e6be4b1475f36c70` |
| Inspection tree | `adcd86f1a0fb192d8e2c9ca5cda46caf321312d5` |
| Working tree at inspection | clean |
| Previous independent review | `docs/security/SHERIVS-001-PROPOSED-SQL-INDEPENDENT-REVIEW-001.md` |
| Previously reviewed proposal SHA-256 | `51456750803734d5cd73e0f52d64d969e756f20118fe5d9bb92d5818f6b94d2b` |
| Previously reviewed rollback SHA-256 | `75b462ce5ab022d103de767b466accc4ce6c26e766aa330038a6ecdbd728cb2d` |

`git status` at start: on `cursor/sherivs-001-proposed-sql-independent-review-d80b`, up to date with origin, nothing to commit.

No `git reset`, `git clean`, or discard was performed. Unrelated work was not overwritten.

---

## 3. Final branch and HEAD

| Item | Value |
|---|---|
| Correction branch | `cursor/sherivs-001-proposed-sql-trusted-role-txn-d80b` |
| Implementation commit | `7c3010db13b74bea2ac0e9e99b1d8ff491075d72` |
| Test-fix commit | `e07bdfee47e0e85695447a801e93b4d5c2a4ee94` |
| Comment-stripper test commit | `504d57da8a139af915f2cf864f9ecfabee82e202` |
| Report commit | `ba2c8b9229b1e4c72806b645a14cba19ad449bd5` |
| Report SHA pin | `6720c8fc3a216084b7de0d2bf7cfc26d5eaa41a2` |
| Final HEAD | comment-stripper follow-up report commit on this branch |
| Pull request | https://github.com/vibeoraai-bit/coregrid-scholar-migration/pull/41 (draft, stacked on the independent-review branch) |

---

## 4. Initial and final Git status

**Initial:** clean on `e511b0b6bee0f4b05a8212c3e6be4b1475f36c70`.

**Final (before this report commit):** clean on `e07bdfee47e0e85695447a801e93b4d5c2a4ee94` except this document. After the report commit, only this file (and a SHA pin, if any) should appear.

---

## 5. Proposal hashes

| File | Previous SHA-256 | New SHA-256 |
|---|---|---|
| `database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` | `51456750803734d5cd73e0f52d64d969e756f20118fe5d9bb92d5818f6b94d2b` (154 lines) | `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` (215 lines) |
| `database/supabase/rollbacks/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` | `75b462ce5ab022d103de767b466accc4ce6c26e766aa330038a6ecdbd728cb2d` (43 lines) | `6a9363db98dd3c82036b315e67d38559a0db00583b8ea7de541375a334bfb7e4` (49 lines) |

Both blockers were still present in `e511b0b` (trigger lines 120–122; no forward `BEGIN`/`COMMIT`). They are no longer present in the rewritten proposal.

---

## 6. Exact files changed

- `database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` (SQL correction; hash unchanged by the comment-stripper follow-up)
- `database/supabase/rollbacks/20261015000010_sherivs_identity_privilege_freeze.sql.proposed`
- `tests/unit/sherivs-001-identity-privilege.test.ts`
- `tests/unit/sherivs-sql-comment-strip.ts` (offline scanner; not a PostgreSQL parser)
- `tests/unit/sherivs-sql-comment-strip.test.ts`
- `docs/security/SHERIVS-001-PROPOSED-SQL-TRUSTED-ROLE-SKIP-AND-TRANSACTION-001.md` (this file)

Not changed: application code, canonical `.sql` history, pin (`PINNED_MIGRATION_COUNT = 71`, `PINNED_SOURCE_COMMIT = d195ba861f80379b79533126653b9cee82a8e872`), environment configuration, secrets.

---

## 7. B-1 analysis and resolution

### Reconfirmation

The reviewed proposal still contained:

```
IF auth.uid() IS NULL THEN
  RETURN NEW;
END IF;
```

That branch returned NEW for every UPDATE, including privilege-column changes, whenever `auth.uid()` was null. Absence of a JWT subject is not proof of `service_role`, owner, or any other authorized provisioner.

### Call-path analysis (source, not live PostgreSQL)

| Signal | What it represents in this architecture | Used as trust? |
|---|---|---|
| `auth.uid()` | JWT `sub` (or null). Null means unidentified, not “service”. | No. Null + privilege change **raises**. |
| `current_user` | PostgreSQL role after authenticator `SET ROLE`. User JWTs become `authenticated` / `anon`. The service-role key path is intended to become `service_role`. | **Yes, exact equality to `service_role` only.** |
| `session_user` | Login role. Under PostgREST this is typically `authenticator` for both user and service JWTs. | **No.** Not a discriminator. |
| `current_setting('request.jwt.claim.role')` / `auth.role()` | JWT claim GUC. Caller-influenced if a session can set GUCs or present a crafted claim. | **No.** |
| `postgres` / table owner | Typical `SECURITY DEFINER` owner. A DEFINER `UPDATE` would present this as `current_user` to an INVOKER trigger. | **No.** Intentionally not allowlisted. |
| `SUPABASE_SERVICE_ROLE_KEY` in `frontend/src/integrations/supabase/client.server.ts` | Documented server-only provisioner (`staff-accounts` upsert, `inviteTeacher` insert, `demo-provision` upsert). | This is the workflow the `service_role` check is meant to preserve. |

Canonical grants (`20260620122048`): `GRANT ALL ON public.users TO service_role`. Canonical policies do not name `service_role`; BYPASSRLS / table `ALL` is the documented service-role reachability, not the null-uid skip.

### Corrected rule

1. Identity-key change (`NEW.id` distinct from `OLD.id`) raises for every caller, including `service_role`.
2. If `current_user = 'service_role'`, privilege-column UPDATE is permitted (documented `supabaseAdmin` path).
3. If privilege columns are unchanged, RETURN NEW (ordinary profile fields).
4. If privilege columns changed and `auth.uid()` is NULL, RAISE (untrusted / unidentified).
5. If privilege columns changed and `NEW.id = auth.uid()`, RAISE (self-freeze).
6. Otherwise RETURN NEW (identified other-user UPDATE; RLS still applies).

The previous null-uid skip is gone from the function body.

### Why this is the narrowest defensible rule

- Ordinary JWT self-updates of `role` / `school_id` / `is_active` are denied.
- Legitimate school-admin JWT updates of **other** users remain trigger-permitted (PostgreSQL has no school-admin database role; column REVOKE would block them).
- Legitimate service-role provisioning is permitted only when the session actually is the `service_role` database role.
- Unknown context fails closed.
- A `SECURITY DEFINER` function owned by `postgres` does **not** inherit a provisioner skip. Self-writes still freeze. Other-row writes remain trigger-permitted and must be authorized by that function and by RLS; canonical SQL contains no `UPDATE public.users`.

### Architectural dependencies (not invented, not live-proven)

- Live PostgREST sessions using `SUPABASE_SERVICE_ROLE_KEY` are **assumed** to present `current_user = 'service_role'`. This matches the documented authenticator `SET ROLE` model and the canonical `GRANT ALL … TO service_role`. It was **not** observed on a database.
- `frontend/src/integrations/supabase/client.server.ts` also accepts opaque `sb_secret_` keys. If a future gateway mapped those keys to a database role other than `service_role`, privilege writes would **fail closed**. That is preferred to a guessed extra allowlist.
- `service_role` is **not** assumed to have `auth.uid()` NULL. The trusted branch is `current_user`, so a service-role session that also has a subject is still permitted.
- DBA / owner repair via `postgres` is not a silent skip. Repair requires `SET ROLE service_role` (if granted) or `DISABLE TRIGGER` (owner-class). `REVOKE TRIGGER … ON public.users FROM anon, authenticated` (`20260904010000`) remains the ordinary-caller control.

---

## 8. B-2 analysis and resolution

### Reconfirmation

The reviewed forward file had no `BEGIN`/`COMMIT`. Helpers could be replaced without the trigger if `CREATE TRIGGER` failed.

### Correction

The forward file now wraps helper replacement, comments, trigger drop, and trigger create in one explicit `BEGIN;` … `COMMIT;`.

Every statement is transactional: `CREATE OR REPLACE FUNCTION`, `COMMENT ON FUNCTION`, `DROP TRIGGER`, `CREATE TRIGGER`. There is no `CREATE INDEX CONCURRENTLY`, `VACUUM`, `REINDEX`, or other non-transactional operation. There is no `EXCEPTION WHEN OTHERS` handler. Errors propagate.

### Execution contract

**Honored by:** a PostgreSQL client that submits the whole file as one script and respects `BEGIN`/`COMMIT` (`psql -f` / `-1`; node-pg `client.query` of the full string with no pre-existing transaction). That is the contract of `scripts/db-apply.mjs` and `scripts/db-apply-one.mjs` (`client.query(sql)` with no inner wrap).

**Not compatible with:** a tool that already wraps the file in `BEGIN`/`COMMIT`, including `scripts/staging/sherivs-restore/runner.mjs` (outer `BEGIN`, `query(sql)`, ledger `INSERT`, `COMMIT`). An inner `COMMIT` would close that outer transaction before the ledger write. This file remains `*.sql.proposed` and is excluded from that runner (`inspectWorkingTree` and `verifyLoadedFiles`). Promoting it to canonical `.sql` requires either stripping `BEGIN`/`COMMIT` so the runner wrap is the sole boundary, or changing the runner so it does not wrap files that already contain `COMMIT`. Do not promote without that change.

Placing `BEGIN`/`COMMIT` in the file does **not** make every deployment tool honor those boundaries. The contract above is the definition of “transactional” for this proposal.

---

## 9. Trusted execution-context model

```
Privilege-column UPDATE on public.users
        │
        ├─ NEW.id distinct from OLD.id        → RAISE (all callers)
        ├─ current_user = 'service_role'      → ALLOW (provisioner)
        ├─ role, school_id, is_active unchanged → ALLOW
        ├─ auth.uid() IS NULL                 → RAISE (untrusted)
        ├─ NEW.id = auth.uid()                → RAISE (self-freeze)
        └─ identified other-row               → ALLOW at trigger; RLS decides
```

Caller authority (`auth.uid()`) and execution authority (`current_user`) are distinct. The provisioner skip uses execution authority. The self-freeze uses caller authority. Neither is inferred from the other.

---

## 10. Privilege-mutation matrix

PostgreSQL behavior below is **not executed**. Evidence is source SQL, static inspection, or the simulated control-flow test in `tests/unit/sherivs-001-identity-privilege.test.ts`.

| Case | Expected | Corrected proposal | Evidence class | PG executed? |
|---|---|---|---|---|
| 1. Authenticated ordinary profile field | Allow if `"User updates self"` matches | Trigger does not inspect non-privileged columns | Static SQL + simulated CASE 1 | No |
| 2. Authenticated self `role` | Reject | Self-freeze RAISE | Static SQL + simulated CASE 2 | No |
| 3. Authenticated self `school_id` | Reject | Self-freeze RAISE | Static SQL + simulated CASE 3 | No |
| 4. Authenticated self `is_active` | Reject | Self-freeze RAISE | Static SQL + simulated CASE 4 | No |
| 5. Privilege update with `auth.uid()` NULL | Reject unless specifically authorized | RAISE unless `current_user = 'service_role'` | Static SQL + simulated CASE 5 / 7 | No |
| 6. Authorized admin modifies another user | Preserve existing RLS | Trigger allows other-row; `"School admin manages users"` still required | Static SQL + canonical policy + simulated CASE 6 | No |
| 7. Trusted service-role provisioning | Preserve documented workflow | `current_user = 'service_role'` allows, with or without uid | Static SQL + `client.server.ts` + simulated CASE 7 | No |
| 8. DEFINER function, different DB role | Distinguish caller vs execution | Skip is `current_user`, not original uid. `postgres` is not trusted | Static SQL + simulated CASE 8 | No |
| 9. Ordinary caller invokes DEFINER that writes privilege columns | Reject unless that function authorizes | Self-row RAISE. Other-row is trigger-permitted; no canonical `UPDATE public.users` exists. DEFINER must authorize independently | Static SQL + simulated CASE 9 | No |
| 10. Unclassifiable context | Fail closed | Non-`service_role` + null uid + privilege change RAISE | Static SQL + simulated CASE 10 | No |

INSERT is still not covered by the trigger. Ordinary INSERT remains RLS-denied unless `"School admin manages users"` matches.

---

## 11. Helper-function analysis

Proposed bodies (SECURITY DEFINER, `SET search_path = public`, no arguments), otherwise matching `20260620151525`:

| Function | Predicate | Inactive / NULL `is_active` |
|---|---|---|
| `get_my_school_id()` | `id = auth.uid() AND is_active = true` | Returns NULL |
| `get_my_role()` | same | Returns NULL |
| `is_school_admin()` | `role IN ('admin','principal') AND is_active = true` | FALSE (`EXISTS`) |

NULL `is_active` does not equal `true`; the row is excluded (fail closed).

Administrator recovery: an inactive admin cannot satisfy `is_school_admin()` or `get_my_school_id()`, so they cannot use `"School admin manages users"` to reactivate themselves. Self-`is_active` is also trigger-blocked. Recovery requires another active school admin, a super-admin, or a `service_role` write. Last remaining admin who is deactivated cannot recover via JWT. That is fail-closed, not a lockout bug in the identity model.

Grants: the proposal does not `GRANT`/`REVOKE EXECUTE`. Default PUBLIC EXECUTE may remain (SHERIVS-002-adjacent). Search path is pinned to `public`. No unrelated helpers (`is_tenant_admin`, `is_super_admin`, `assign_role`) are modified. Neutral `is_tenant_admin` still does not read `users.is_active`; that split is unchanged and not claimed solved.

---

## 12. Grants and RLS analysis

The proposed SQL contains **no** statement-leading `GRANT`, `REVOKE`, `CREATE POLICY`, or `DROP POLICY`.

Canonical facts that remain:

- `authenticated` still has table `SELECT, INSERT, UPDATE, DELETE` on `users` (`20260620122048`).
- `service_role` still has `ALL`.
- `"User updates self"` remains id-only WITH CHECK.
- `"School admin manages users"` still allows other-user privilege writes inside `get_my_school_id()`.
- `users` is ENABLE RLS, not FORCE RLS, in inspected migrations.
- `REVOKE TRIGGER, TRUNCATE, REFERENCES ON public.users FROM anon, authenticated` (`20260904010000`) remains.

**What the trigger enforces:** write-time comparison of `NEW` vs `OLD` for `role`, `school_id`, `is_active`, plus the trusted-role / fail-closed branches above. It fires `BEFORE UPDATE FOR EACH ROW` with no `WHEN` clause.

**What remains grant/RLS-dependent:** table privilege (UPDATE still granted to `authenticated`), row visibility, other-user admin writes, INSERT, DELETE, BYPASSRLS sessions, replica-role sessions, and any catalog where the trigger is absent or disabled.

A trigger is not grant narrowing. SHERIVS-002 remains OPEN. This mission does not rewrite grants.

---

## 13. Rollback review

Rollback `6a9363db98dd3c82036b315e67d38559a0db00583b8ea7de541375a334bfb7e4`:

1. `BEGIN`
2. `DROP TRIGGER IF EXISTS trg_users_forbid_self_privilege_mutation`
3. `DROP FUNCTION IF EXISTS public.forbid_self_privilege_mutation()`
4. Restore `get_my_school_id` / `get_my_role` / `is_school_admin` to the `20260620151525` bodies (no `is_active` filter)
5. `COMMIT`

Dependency order is correct (trigger, then function, then helpers). Transaction boundaries match the forward file. Comments document the same runner-wrap incompatibility. COMMENT ON FUNCTION text is not restored (cosmetic; canonical `20260620151525` had none).

**Static inspection only.** The rollback was not executed. Rolling it back removes the freeze: PATH A (self-update of privilege columns) and PATH E (inactive helpers) return on any catalog that had applied the forward file.

---

## 14. Offline test commands and results

Command (no database env; no SQL execution; local vitest only):

```
npx vitest run \
  tests/unit/sherivs-sql-comment-strip.test.ts \
  tests/unit/sherivs-001-identity-privilege.test.ts \
  tests/unit/sherivs-db-target.test.ts \
  tests/unit/sherivs-staging-migration-runner.test.ts \
  tests/unit/security-role-gate.test.ts
```

First run after the SQL rewrite: 2 failed / 210 passed. Failures were static assertions matching **comments** that document the `session_user` and `CREATE INDEX CONCURRENTLY` prohibitions. A follow-up (`e07bdfe`) used a naive `--[^\n]*` replacement, which can misread `--` inside strings or dollar-quoted bodies. That approach is replaced by `tests/unit/sherivs-sql-comment-strip.ts`, a character scanner that respects PostgreSQL quoting.

Comment-stripper follow-up (this revision):

| File | Passed | Failed |
|---|---|---|
| `tests/unit/sherivs-sql-comment-strip.test.ts` | 10 | 0 |
| `tests/unit/sherivs-001-identity-privilege.test.ts` | 54 | 0 |
| `tests/unit/sherivs-db-target.test.ts` | 23 | 0 |
| `tests/unit/sherivs-staging-migration-runner.test.ts` | 108 | 0 |
| `tests/unit/security-role-gate.test.ts` | 27 | 0 |
| **Total** | **222** | **0** |

`VITEST_EXIT:0`. Log: `/opt/cursor/artifacts/sherivs-001-comment-strip-tests.log`.

These tests prove **source strings, application parsers, a simulated trigger matrix, and that B-1/B-2 assertions inspect comment-stripped / code-only SQL**. They do **not** prove the trigger runs in PostgreSQL. There is no offline PostgreSQL harness for this proposal. The proposed SQL and rollback were **not** executed. Supabase CLI was **not** used. Proposal SHA-256 remains `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416`.

---

## 14a. Comment-stripping method and limitations

Scanner: `tests/unit/sherivs-sql-comment-strip.ts`. It is **not** a PostgreSQL parser.

Classification:

- **code** — SQL/plpgsql tokens
- **comment** — `--` to end of line; nested `/* */` (PostgreSQL nesting)
- **literal** — `'...'` (`''` escapes), `"..."` (`""` escapes), `E'...'` / `e'...'` (backslash + `''`), dollar quotes `$tag$...$tag$`

Two views used by assertions:

- `stripSqlComments` — comments become spaces; literals kept. Used for positive matches that include string literals (`current_user = 'service_role'`, `RAISE EXCEPTION '...'`).
- `executableSqlCode` — comments **and** literals become spaces. Used for negative statement matches (`session_user`, `CREATE INDEX CONCURRENTLY`) so documentation strings cannot satisfy or poison the check.

SQL-level vs plpgsql-level: `--` inside `AS $$ ... $$` is **not** a SQL comment; it is function source. B-1 inspects the extracted trigger body with the same scanner as plpgsql.

Representative cases in `tests/unit/sherivs-sql-comment-strip.test.ts` prove: line comments, real CONCURRENTLY statements, `--` inside strings, `--` inside dollar quotes, nested block comments, `/*` inside strings, COMMENT ON `$comment$` prose, `''` escapes, E-string escapes, and that an `IF auth.uid() IS NULL THEN RETURN NEW` bypass is still detected when it is executable.

Limitations: unterminated quotes consume through EOF; dollar tags are ASCII; `U&`/`B`/`X`/`N` prefixes are not special-cased (the following quote is still a string); `standard_conforming_strings = off` is not modeled for non-E strings; psql meta-commands are not modeled. No PostgreSQL lexing was executed.

Assertions were **not** weakened: B-1 now requires the null-uid branch to `RAISE EXCEPTION` (not `RETURN NEW`); B-2 scans SQL-level executable tokens for CONCURRENTLY/VACUUM/REINDEX and plpgsql bodies for `EXCEPTION WHEN OTHERS`.

---

## 14b. Independent B-1 and B-2 recheck (this follow-up)

**B-1.** Executable plpgsql of `public.forbid_self_privilege_mutation` (dollar-quoted body, comments stripped):

1. No `IF auth.uid() IS NULL THEN`. Null identity does not grant a skip.
2. After privilege columns change and `current_user` is not `service_role`, `v_uid := auth.uid()` then `IF v_uid IS NULL THEN RAISE EXCEPTION 'Forbidden: untrusted execution context...'`.
3. The only `RETURN NEW` before the uid check is `current_user = 'service_role'` or unchanged privilege columns.
4. `session_user`, `current_setting(`, `request.jwt`, `auth.role(`, and `postgres` do not appear in executable plpgsql tokens.

Trusted exception justification from **source**, not live PostgreSQL: `frontend/src/integrations/supabase/client.server.ts` uses `SUPABASE_SERVICE_ROLE_KEY`; canonical `GRANT ALL ON public.users TO service_role`; PostgREST authenticator `SET ROLE` is the documented mapping onto `current_user`. That mapping is **not** catalog-proven. It is a blocking architectural dependency **for apply**. It is not a reason to treat `auth.uid() IS NULL` as trusted.

**B-2.** SQL-level executable tokens (comments and literals blanked) contain `BEGIN;` then the four `CREATE OR REPLACE FUNCTION` statements, `DROP TRIGGER`, `CREATE TRIGGER`, then `COMMIT;`. No later DDL. No `CREATE INDEX CONCURRENTLY`, `REINDEX`, or `VACUUM` as migration statements. Function bodies have no `EXCEPTION WHEN OTHERS`. All listed statements are transactional. Failure of a later statement cannot commit earlier DDL on a client that honors this file’s `BEGIN`/`COMMIT`. `scripts/db-apply.mjs` / `db-apply-one.mjs` submit the whole string without a pre-wrap. `scripts/staging/sherivs-restore/runner.mjs` still pre-wraps `BEGIN`/`query(sql)`/`COMMIT`; an inner `COMMIT` would close that outer transaction before the ledger insert. The file remains `*.sql.proposed`.

Git diff for this follow-up is test helper, stripper tests, identity-test assertion wiring, and this report. Proposed SQL hash unchanged. No GRANT/REVOKE/policy weakening.

## 15. PostgreSQL behavior not verified

- Live `current_user` / `session_user` / `auth.uid()` / `auth.role()` under user JWT, anon, service-role JWT, and opaque `sb_secret_` keys.
- Authenticator `SET ROLE` mapping on the actual platform.
- BEFORE UPDATE vs RLS USING/WITH CHECK ordering.
- `IS DISTINCT FROM` / uuid equality on the live types.
- Whether `users` RLS is enabled / forced / extra policies exist live.
- Trigger disable, `session_replication_role`, and owner bypass.
- Whether an inner `COMMIT` inside `runner.mjs` would in fact close the outer transaction (reasoned from the runner source; not executed).
- Any catalog drift from Git.

---

## 16. Remaining architectural dependencies

1. Live confirmation that the documented `supabaseAdmin` path presents `current_user = 'service_role'`.
2. Opaque `sb_secret_` key → database role mapping (fail closed if not `service_role`).
3. No canonical SQL `UPDATE public.users`; DEFINER other-row writes remain a residual that those functions must authorize themselves.
4. Broad `UPDATE` grant and non-FORCE RLS (SHERIVS-002).
5. Sensitive columns (SHERIVS-003).
6. `news_reads` tenant scoping.
7. Promotion to the canonical pin cannot keep file-level `COMMIT` while the staging runner pre-wraps transactions.

---

## 17. SHERIVS status

| Item | Status |
|---|---|
| SHERIVS-001 | **OPEN.** Proposed SQL corrected, not applied, not live-proven. |
| SHERIVS-002 | **OPEN.** Grants / FORCE RLS unchanged. |
| SHERIVS-003 | **OPEN.** Sensitive columns unchanged. |
| `news_reads` | **OPEN.** Unchanged. |

Passing this mission does not authorize database access or migration application.

---

## 18. Conditions before a staging apply can be separately considered

1. This corrected proposal (`62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416`), not the previous `51456750…` text.
2. Authorized **read-only** catalog on a named non-production `SHERIVS_DATABASE_TARGET`: helper `prosrc`, `users` policies/grants, `auth.uid()` signature, live `current_user` under user JWT and service-role, RLS/FORCE flags.
3. Confirm `current_user = 'service_role'` on the actual provisioner path, or stop and revise the allowlist with evidence (fail closed in the meantime).
4. Apply only via a client that honors this file’s `BEGIN`/`COMMIT` (not `runner.mjs` as currently written).
5. Live proof of matrix cases 1–8 and 13 from the independent review, plus unidentified null-uid privilege writes raising.
6. Do not set `securityProof` or `schemaEquivalence` from this mission.
7. Keep the file `*.sql.proposed` until a separate pin-change mission.

---

## 19. Confirmation of prohibited operations

No production connection. No staging connection. No database connection. No SQL execution. No apply of the proposed migration or rollback. No `db push` / `db reset` / restore. No application-code change. No environment, secret, DNS, Vercel, or project-configuration change. No deploy. No canonical pin change. SHERIVS-001 / 002 / 003 and `news_reads` were not closed. GitHub was used only to push this branch and open the draft PR for the correction; no live database or Supabase project was contacted.

---

## 20. Verdict statement

**PASS WITH CONDITIONS.**

B-1 is corrected: unidentified privilege-column writes fail closed; the only trusted provisioner named in executable SQL is `current_user = 'service_role'`; `auth.uid() IS NULL` is no longer a bypass. Independent recheck of comment-stripped trigger plpgsql: there is no `IF auth.uid() IS NULL THEN`; `v_uid IS NULL` raises; `current_user = 'service_role'` remains the only named skip. Live `current_user` under the service-role key is still unmeasured — a **blocking architectural dependency for apply**, not a reason to restore the null-uid skip.

B-2 is corrected: the forward file is a single explicit transaction under the documented execution contract, with the runner-wrap incompatibility stated rather than papered over. Independent recheck of SQL-level executable tokens: one `BEGIN;`, helper replacements, trigger drop/create, one `COMMIT;`, no CONCURRENTLY/VACUUM/REINDEX, no `EXCEPTION WHEN OTHERS` in function bodies. A statement failure aborts that transaction on a client that honors the file. `runner.mjs` pre-wrap remains incompatible.

Helper `is_active = true` gates, rollback inverse, pin exclusion, and offline tests remain consistent. Offline checks after the comment-stripper follow-up: 222 passed, exit 0. Proposed SQL bytes were not changed by this follow-up.

Conditions:

- PostgreSQL execution was not tested.
- `current_user = 'service_role'` is reasoned from the documented authenticator / `supabaseAdmin` / `GRANT ALL TO service_role` model, not measured on a live session.
- Opaque `sb_secret_` role mapping is unproven (fail closed).
- The UPDATE grant remains; a trigger is not grant narrowing.
- The proposal is unapplied; live PATH A remains until a separately authorized apply.
- SHERIVS-001 stays OPEN.

This is **not** PASS (apply-ready). It is **not** FAIL (both blockers are corrected at source and the trusted-role rule is the narrowest defensible construction from this repository). It means: the proposal may proceed to a separately authorized staging catalog/apply review; this mission does not itself authorize that review to execute SQL.
