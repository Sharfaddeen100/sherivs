# SHERIVS-001-PROPOSED-SQL-INDEPENDENT-REVIEW-001

**Mission ID:** SHERIVS-001-PROPOSED-SQL-INDEPENDENT-REVIEW-001  
**Mission type:** Read-only source review + offline static analysis + existing test review  
**Classification:** PostgreSQL / Supabase RLS / identity privilege governance  
**Version-target classification:** ACTIVE-V1 review only. No V2/V3 work. No apply.  
**Review date:** 2026-10-15  
**Final verdict:** **PASS WITH CONDITIONS**

This review evaluates the proposed SHERIVS-001 freeze independently. It does not defend the implementation author. It does **not** authorize staging or production application. SHERIVS-001, SHERIVS-002, SHERIVS-003, and the `news_reads` tenant-scoping concern remain **OPEN**.

---

## 1. Baseline branch and HEAD

| Item | Value |
|---|---|
| Review started on | `cursor/sherivs-001-identity-privilege-hardening-d80b` |
| Review branch | `cursor/sherivs-001-proposed-sql-independent-review-d80b` |
| Review report commit | `84b65b88aded88d18e212dc2e70f5856eb82a405` |
| Reviewed HEAD (implementation) | `d9d23e79eebbfb7538f6f7e3fff54c55e537e768` |
| Reviewed tree | `1f4fb10ca6d9be0fe7440342079d155d73a7113e` |
| Working tree at inspection | clean |
| Implementation commit | `e44f58fa0560cf61edb1d924ca8844de27b05b52` |
| Implementation report | `docs/security/SHERIVS-001-IDENTITY-AND-PRIVILEGE-ESCALATION-HARDENING-001.md` @ `7ebf82356cbb0fa2debfa4b14a4106336d3c77e8` |

No `git reset`, `git clean`, or discard was performed. Proposed SQL and application files were not modified.

---

## 2. Working-tree status

At review start: clean. After this report is committed, only this document (and its SHA pin, if any) should appear. Application code, tests, and both `.sql.proposed` files were left byte-identical to `d9d23e7`.

---

## 3. Files reviewed

**Required set (all present):**

- `database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed`  
  SHA-256 `51456750803734d5cd73e0f52d64d969e756f20118fe5d9bb92d5818f6b94d2b` (154 lines)
- `database/supabase/rollbacks/20261015000010_sherivs_identity_privilege_freeze.sql.proposed`  
  SHA-256 `75b462ce5ab022d103de767b466accc4ce6c26e766aa330038a6ecdbd728cb2d` (43 lines)
- `frontend/src/lib/identity-privilege.ts`
- `frontend/src/lib/profile.functions.ts`
- `frontend/src/routes/_authenticated/admin/hr.tsx`
- `frontend/src/lib/runtime/scholar/teachers.functions.ts`
- `tests/unit/sherivs-001-identity-privilege.test.ts`
- `docs/security/SHERIVS-001-IDENTITY-AND-PRIVILEGE-ESCALATION-HARDENING-001.md`

**Canonical history consulted (not modified):**

- `20260620122048_50e590c2-5911-4c98-8931-fb46a4b509f3.sql` — `users` table, bulk grants, `"User updates self"`, `"School admin manages users"`
- `20260620122110_178748dc-376f-4c78-911d-ec879dfffce1.sql` — INVOKER helper interlude
- `20260620151525_b630392a-2197-480f-b1cb-99da6c869c81.sql` — last Scholar DEFINER helper bodies
- `20260904010000_coregrid_rls_transport_and_grants.sql` — `REVOKE TRIGGER` on `users`
- `20261002000001_coregrid_v1_neutral_tenant_primitives.sql` — `is_tenant_admin` / `assign_role`
- `20261002000013_coregrid_v1_neutral_membership_policies.sql` — cg_* policies
- `20261003000020_coregrid_is_super_admin_definer.sql`

**Fact:** the proposed file is `*.sql.proposed`. It is not in the canonical 71-file pin. Its presence in Git is not apply proof.

---

## 4. Attack-path analysis

Confirmed historical path (canonical source, not live catalog):

1. `GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated` (`20260620122048` bulk DO).
2. Policy `"User updates self"`: `USING (id = auth.uid()) WITH CHECK (id = auth.uid())` — no freeze of `NEW.role` / `NEW.school_id` / `NEW.is_active`.
3. PostgREST `PATCH` as the row owner can write those columns.
4. `is_school_admin()` / `get_my_school_id()` / `get_my_role()` (`20260620151525`) read `public.users` without `is_active`.
5. Phase 08 `resolveRoleGate("school_admin")` and Scholar tenant RLS consume those helpers.
6. After self-elevation, `createStaffAccount` / `inviteTeacher` / `requireSchoolAdminScope` become reachable and use `supabaseAdmin`.

**Frontend allowlists do not close this path.** `parseSelfProfilePatch` and `parseHrStaffPatch` bind only the server functions and HR mutation that call them. A browser JWT client can still `supabase.from("users").update({ role: "admin" })`.

**What the proposed trigger would do, if applied and if it fires:** a `BEFORE UPDATE` row trigger compares `NEW` to `OLD` when `NEW.id = auth.uid()`. Self-writes of `role`, `school_id`, and `is_active` raise. That is the correct *class* of control for PostgREST UPDATE: it is not RLS WITH CHECK (which cannot see OLD) and not a column REVOKE (which would also block other-user admin updates).

**Residual after proposed SQL (source reasoning):**

- Table-level `UPDATE` grant remains. A disabled trigger, replica-role session, or BYPASSRLS session still has the privilege.
- `INSERT` is not covered by the trigger. Ordinary INSERT remains RLS-denied unless `"School admin manages users"` matches; that path is not PATH A unless the caller is already admin/super-admin.
- Neutral `cg_*` membership is independent and still requires `is_tenant_admin`.
- Application allowlists remain a second layer only.

---

## 5. Trigger correctness

Proposed object: `public.forbid_self_privilege_mutation()` + `trg_users_forbid_self_privilege_mutation`.

| Question | Finding |
|---|---|
| Correct table? | Yes. `BEFORE UPDATE ON public.users`. |
| Fires on every relevant UPDATE? | `FOR EACH ROW` with no `WHEN` and no column list. Any UPDATE of a visible row invokes it. INSERT/DELETE do not. |
| Column comparisons? | `IS DISTINCT FROM` on `role`, `school_id`, `is_active` is the correct NULL-safe inequality. Unchanged values, including NULL `is_active`, do not raise. |
| Blocks unauthorized self-mutation? | **When `auth.uid()` is the row id:** yes, those three columns cannot change. |
| Blocks legitimate other-user admin updates? | No. `NEW.id = auth.uid()` is false for another user’s row. School-admin JWT updates of others remain trigger-permitted. |
| Blocks legitimate self profile edits? | No. Non-privileged columns are not tested. |
| Can an ordinary user disable it? | Canonical `REVOKE TRIGGER … ON public.users FROM anon, authenticated` (`20260904010000`). `ALTER TABLE … DISABLE TRIGGER` is owner-class. Ordinary PostgREST callers cannot drop the trigger. **Reasoned, not catalog-proven.** |
| Compatible with service-role provisioning? | Only because of the `auth.uid() IS NULL THEN RETURN NEW` skip (section 6). |
| Assumed objects? | `public.users` with `id uuid`, `role`, `school_id`, `is_active`; `auth.uid()`; `EXECUTE FUNCTION` trigger syntax already used by `trg_users_updated` in `20260620122048`. If a live catalog lacks those columns or uses an older `EXECUTE PROCEDURE`-only engine, apply would fail. Live catalog is unknown. |

`users.id` is `uuid PRIMARY KEY`. `users.school_id` is `NOT NULL`. `users.role` is `NOT NULL`. `users.is_active` is `boolean DEFAULT true` **without NOT NULL**, so NULL is representable.

`NEW.id = auth.uid()` uses `=`, not `IS NOT DISTINCT FROM`. After the NULL-uid early return, `auth.uid()` is non-null. If `auth.uid()` is uuid (Supabase convention, not defined in this repo), the comparison is well-typed. **Not verified against a live `auth.uid()` signature.**

---

## 6. `auth.uid() IS NULL` exception analysis

The trigger’s first branch is:

```
IF auth.uid() IS NULL THEN
  RETURN NEW;
END IF;
```

The comments treat this as “the service-role / owner provisioning path.”

**Null identity is not a proof of trusted authority.** Absence of `request.jwt.claim.sub` is not the same as `service_role`, `postgres`, or a BYPASSRLS owner.

### Combined-system reachability (source reasoning)

Canonical UPDATE policies on `users` are only:

- `"User updates self"` — `id = auth.uid()`
- `"School admin manages users"` — `(school_id = get_my_school_id() AND is_school_admin()) OR is_super_admin()`

If `auth.uid()` is NULL:

- `id = NULL` is not TRUE.
- Proposed `get_my_school_id()` returns NULL; `is_school_admin()` is FALSE; `is_super_admin()` is FALSE for `id = NULL`.

Therefore an `authenticated` session **without** a subject should fail RLS USING and never reach the trigger. `anon` has no UPDATE grant in canonical source.

The NULL skip is reachable when RLS is **bypassed or disabled**: typical `service_role` / `postgres` / table-owner sessions. Those principals already hold `ALL` on `users` in canonical grants. The skip does not grant them a new table privilege they lack; it only declines to freeze privilege columns for them.

### Verdict on the exception

| Claim | Assessment |
|---|---|
| Ordinary JWT `authenticated` user can skip the freeze by omitting `sub` | **Not supported** by canonical RLS predicates (reasoned). |
| The SQL itself distinguishes trusted vs untrusted callers | **No.** It distinguishes “has uid” vs “no uid.” |
| Safe enough as a trust predicate | **No.** Mission rule: do not treat null identity as trusted authority. |
| Opens PATH A for a normal Scholar JWT user | **No**, under documented grants + RLS. |

**Classification:** not a remaining JWT PATH A; **BLOCKING for staging apply** until the skip is an explicit role allowlist (`current_user` / `auth.role()` in a named trusted set) and unidentified privilege-column changes fail closed.

Safer shape (recommendation only; not implemented in this review):

1. Allow privilege-column changes only when `current_user` / JWT role is a named trusted role (`service_role`, `postgres`, or the platform owner role actually present on the target).
2. When `auth.uid()` is not null and equals `NEW.id`, keep the current freeze.
3. When `auth.uid()` is null and the caller is **not** in the trusted set, refuse privilege-column changes.

Do not apply the current text to staging solely because comments say “service-role.”

---

## 7. Inactive-account helper analysis

Proposed bodies (SECURITY DEFINER, `SET search_path = public`, no arguments):

- `get_my_school_id()`: `WHERE id = auth.uid() AND is_active = true` → uuid or NULL
- `get_my_role()`: same filter → text or NULL
- `is_school_admin()`: `EXISTS (… role IN ('admin','principal') AND is_active = true)` → boolean, never NULL

| Question | Finding |
|---|---|
| `is_active = true` correct? | Yes for SQL boolean. NULL `is_active` does not equal true; the row is excluded (fail closed). |
| Inactive users rejected on Scholar helpers? | Yes, if these replacements are the live bodies. |
| Other helpers still unsafe? | `is_super_admin()` already filters `super_admins.is_active` (`20261003000020`). Neutral `holds_tenant_role` / `is_tenant_admin` do **not** read `users.is_active`; they use cg_ state. Scholar RLS that still calls `is_school_admin` / `get_my_school_id` is the intended surface. |
| Privileges / search_path? | DEFINER + `search_path = public` matches `20260620151525`. Proposed file does not REVOKE/GRANT EXECUTE. Default PUBLIC EXECUTE may remain (SHERIVS-002-adjacent). |
| Administrator recovery? | An inactive admin cannot satisfy `is_school_admin()` or `get_my_school_id()`. They cannot use `"School admin manages users"` to reactivate themselves. Self-`is_active` change is also trigger-blocked. Recovery requires another active school admin, a super-admin, or a BYPASSRLS/service-role write. That is fail-closed, not a lockout bug in the identity model; the last remaining admin who is deactivated cannot recover via JWT. |

---

## 8. Grants and RLS analysis

The proposed SQL contains **no** `GRANT`, `REVOKE`, `CREATE POLICY`, or `DROP POLICY` statements (statement-leading scan of the file).

Canonical facts that remain:

- `authenticated` still has table `UPDATE` (and INSERT/DELETE/SELECT) on `users`.
- `"User updates self"` remains id-only WITH CHECK.
- `"School admin manages users"` still allows other-user privilege writes inside `get_my_school_id()`.
- `users` is **not** `FORCE ROW LEVEL SECURITY` in inspected migrations (FORCE appears on cg_* and `transport_buses`, not `users`).

A trigger is **not** equivalent to narrowing grants. The grant remains the table privilege; the trigger is a write-time constraint. If the trigger is absent (unapplied, dropped, replica session), PATH A is unchanged.

**Does the proposal close PATH A?**  
For a JWT `authenticated` caller updating their own row: **yes, if the trigger is applied and fires** — reasoned PostgreSQL BEFORE UPDATE semantics, not measured.

**Residual direct database path:** BYPASSRLS/service-role (intentional), unapplied SQL (current live risk), INSERT (not PATH A for ordinary users), grant still broad (SHERIVS-002).

---

## 9. Rollback review

Rollback file wraps `BEGIN`/`COMMIT`. It:

1. Drops `trg_users_forbid_self_privilege_mutation`.
2. Drops `public.forbid_self_privilege_mutation()`.
3. Restores the three helper bodies to the `20260620151525` text (no `is_active` filter).

That is an accurate inverse of the **protections**. It does not restore COMMENT ON FUNCTION text. That is cosmetic.

The **forward** proposed migration is **not** transactional. If `CREATE TRIGGER` failed after `CREATE OR REPLACE FUNCTION` of the helpers, a target could run new helpers without the freeze. Retry is possible (`CREATE OR REPLACE` / `DROP TRIGGER IF EXISTS`), but partial apply is a real operational defect.

Idempotency of a full successful apply: acceptable. Naming `*.sql.proposed` is compatible with the pin (`PINNED_MIGRATION_COUNT = 71`, `inspectWorkingTree` excludes `*.sql.proposed`). Historical canonical files are not rewritten.

---

## 10. Adversarial case results

PostgreSQL behavior below is **reasoned from SQL text**, not executed. Offline tests only prove parsers and source strings.

| # | Case | Expected | Source/SQL result | Evidence | PG tested? | Blocking uncertainty |
|---|---|---|---|---|---|---|
| 1 | Ordinary user changes own `role` | Refuse | Trigger raises when `NEW.id = auth.uid()` and role differs | Proposed trigger lines 128–133 | No | Unapplied SQL |
| 2 | Ordinary user changes own `school_id` | Refuse | Same trigger | Same | No | Unapplied SQL |
| 3 | Ordinary user changes own `is_active` | Refuse | Same trigger | Same | No | Unapplied SQL; also blocks self-reactivation |
| 4 | Ordinary user updates name/phone/push_token | Allow | Trigger does not inspect those columns; `"User updates self"` still matches | Trigger + canonical policy | No | None material |
| 5 | Authorized admin changes another user’s `role` | Allow (same school) | `NEW.id <> auth.uid()`; RLS `"School admin manages users"` | Trigger + canonical FOR ALL policy | No | Live policy set unknown |
| 6 | Authorized admin changes another user’s school to **another** institution | Refuse | Trigger allows the column write; WITH CHECK requires `school_id = get_my_school_id()` | Canonical WITH CHECK | No | Live policies unknown |
| 7 | Authorized admin reactivates **another** account | Allow | Trigger allows; helpers then see `is_active = true` | Trigger + `setTeacherActive` / HR | No | Last-admin self-recovery impossible by design |
| 8 | Service-role provisioning create/update | Allow | INSERT not triggered; UPDATE skipped if `auth.uid()` is NULL | Trigger early return; staff-accounts `supabaseAdmin` | No | Depends on live `auth.uid()` under service_role |
| 9 | Operation with `auth.uid()` NULL | Must not be treated as trusted | Trigger **returns NEW** (skip). RLS should deny `authenticated` without uid | Trigger + policies | No | **BLOCKING for apply:** skip is not a role check |
| 10 | Ordinary user RPC changing privileged **users** fields | Refuse unless already admin | `assign_role` writes `cg_role_assignment`, not `users.role`. Staff create uses service-role after `is_school_admin` | `20261002000001`, `staff-accounts.functions.ts` | No | None for cg_*; users path depends on helper freeze |
| 11 | SECURITY DEFINER helper / trigger | Helpers DEFINER; trigger INVOKER | Helpers take no client args and read `auth.uid()`. Session JWT subject is unchanged by DEFINER. Trigger does not read tables | Proposed SQL | No | Live `prosrc` unknown |
| 12 | Conflicting users vs cg_ membership | Must not grant Scholar admin from cg_ alone or vice versa | Dual authority remains. Freezing `users.*` does not write cg_*; cg_* still needs `is_tenant_admin` | Neutral primitives + users helpers | No | Architectural split remains |
| 13 | Inactive user calls protected helper | Deny Scholar admin/tenant predicates | Proposed helpers exclude `is_active IS NOT TRUE` | Proposed function bodies | No | Unapplied SQL |
| 14 | Exploit of policies that trust `users.role` / `school_id` | After freeze, self cannot change those inputs | Policies still **trust** the stored columns; they just become non-self-writable | Canonical tenant policies | No | Other-admin or service-role can still change them |

---

## 11. Application-layer observations (not corrected here)

Reviewed only. Defects documented, not fixed.

1. Allowlists do not bind PostgREST. Correctly treated as non-sufficient by the implementation report.
2. `parseHrStaffPatch` uses `currentRole: current?.role ?? rest.role`. If `staffMap` misses the row, the “changed role” throw can be neutralized; the function still **strips** `role` / `is_active` on self. Residual is diagnostic, not a privilege grant.
3. `setTeacherActive` refuses self, then updates via user JWT with `.eq("role", "teacher")`. After helpers require `is_active`, an inactive admin cannot call this path. Another active admin still can.

---

## 12. Offline test results

Command (no database env required):

```
npx vitest run \
  tests/unit/sherivs-001-identity-privilege.test.ts \
  tests/unit/sherivs-db-target.test.ts \
  tests/unit/sherivs-staging-migration-runner.test.ts \
  tests/unit/security-role-gate.test.ts
```

| File | Passed | Failed |
|---|---|---|
| `tests/unit/sherivs-001-identity-privilege.test.ts` | 39 | 0 |
| `tests/unit/sherivs-db-target.test.ts` | 23 | 0 |
| `tests/unit/sherivs-staging-migration-runner.test.ts` | 108 | 0 |
| `tests/unit/security-role-gate.test.ts` | 27 | 0 |
| **Total** | **197** | **0** |

`VITEST_EXIT:0`. Log: `/opt/cursor/artifacts/sherivs-001-independent-review-tests.log`.

These tests prove **source strings and application parsers**. They do **not** prove the trigger runs in PostgreSQL. There is no offline PostgreSQL harness in this repository for this proposal. The proposed SQL and rollback were **not** executed. Supabase CLI was **not** used.

---

## 13. PostgreSQL behavior not verified

- Live `auth.uid()` / `auth.role()` / `current_user` under user JWT, anon, and service_role.
- BEFORE UPDATE vs RLS USING/WITH CHECK ordering on the actual engine.
- `IS DISTINCT FROM` / uuid equality on the live types.
- Whether service_role sessions actually have NULL `auth.uid()`.
- Whether `users` RLS is enabled / forced / extra policies exist live.
- Trigger disable, `session_replication_role`, and owner bypass.
- Partial-apply behavior of the non-transactional forward file.
- Any catalog drift from Git.

---

## 14. Blocking defects

No remaining **JWT PATH A** was found in the proposed trigger text **if applied and fired**. The following are **BLOCKING for staging application** (do not apply the current file as-is):

**B-1 — Null-identity skip is not a trust check.**  
`IF auth.uid() IS NULL THEN RETURN NEW` treats missing subject as trusted. Combined with RLS this is probably unreachable for `authenticated`, but the SQL does not name a trusted role. Required: explicit allowlist of trusted database/JWT roles; fail closed for unidentified privilege-column writes.

**B-2 — Forward migration is not transactional.**  
Helpers can be replaced without the trigger if `CREATE TRIGGER` fails. Required: `BEGIN`/`COMMIT` around the forward file, matching the rollback.

These are apply-blocking, not “PATH A remains open in the proposed trigger for a normal logged-in user.”

---

## 15. Required changes before staging application

1. Rewrite the trigger skip to an explicit trusted-role allowlist; fail closed otherwise (B-1).
2. Wrap the forward proposed SQL in a single transaction (B-2).
3. Keep the file `*.sql.proposed` (or run a separate pin-change mission if promoting to `.sql`).
4. Authorized **read-only** catalog on a named non-production `SHERIVS_DATABASE_TARGET`: helper `prosrc`, `users` policies/grants, `auth.uid()` signature, RLS/FORCE flags.
5. Authorized apply of the **revised** SQL only, then live proof cases 1–8 and 13.
6. Do not set `securityProof` or `schemaEquivalence` from this review.

Do **not** apply `51456750803734d5cd73e0f52d64d969e756f20118fe5d9bb92d5818f6b94d2b` to staging until B-1 and B-2 are addressed.

---

## 16. Recommended next mission

**SHERIVS-001-PROPOSED-SQL-TRUSTED-ROLE-SKIP-AND-TRANSACTION-001** (implementation, still no live apply unless separately authorized):

- Replace the null-uid skip.
- Add `BEGIN`/`COMMIT` to the forward file.
- Keep application allowlists as-is unless that mission is scoped to them.
- Re-run this independent-review checklist.

Then, under explicit human authorization: **SHERIVS-001-STAGING-CATALOG-AND-APPLY-001** on `SHERIVS_DATABASE_TARGET=staging` only.

Keep SHERIVS-002 (grants), SHERIVS-003 (sensitive columns), and `news_reads` **OPEN**.

---

## 17. Confirmation of prohibited operations

No production or staging connection. No live catalog. No SQL execution. No apply of the proposed migration or rollback. No application-code change. No environment, secret, DNS, Vercel, or project-configuration change. No deploy. No canonical pin change. SHERIVS-001 / 002 / 003 and `news_reads` were not closed.

---

## 18. Verdict statement

**PASS WITH CONDITIONS.**

The proposed BEFORE UPDATE freeze is the right mechanism for the confirmed self-UPDATE path, and the helper `is_active = true` predicates are internally consistent. Under the documented grant + RLS model, a JWT `authenticated` user should not be able to self-elevate `role` / `school_id` / `is_active` once the trigger exists.

Conditions:

- PostgreSQL execution was not tested.
- The null-uid skip is not a trust predicate (B-1) — **do not apply to staging until revised**.
- The forward file is not transactional (B-2).
- The UPDATE grant remains; a trigger is not grant narrowing.
- The proposal is unapplied; live PATH A remains until a revised apply.
- SHERIVS-001 stays OPEN.

This is **not** PASS (apply-ready). It is **not** FAIL (the identified JWT self-escalation path is addressed in the trigger text). It means: revise B-1/B-2, then a separately authorized staging catalog/apply mission may proceed.
