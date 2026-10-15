# SHERIVS-001-IDENTITY-AND-PRIVILEGE-ESCALATION-HARDENING-001

**Mission ID:** SHERIVS-001-IDENTITY-AND-PRIVILEGE-ESCALATION-HARDENING-001  
**Mission type:** Source audit + threat model + focused implementation + offline adversarial testing + governance report  
**Classification:** Identity Security / Multi-Tenant Authorization / PostgreSQL Privilege Governance / Supabase RLS / Application Security  
**Version-target classification:** ACTIVE-V1 Scholar identity and authorization. No V2/V3 implementation.  
**Verification date:** 2026-10-15  
**Final verdict:** **PASS WITH CONDITIONS**

This mission identifies and remediates confirmed SHERIVS-001 privilege-escalation paths in repository source. It is not a live catalog inspection, not a migration apply, not a restore, and not a claim that production or staging is secure.

---

## 1. Mission identity

SHERIVS-001-IDENTITY-AND-PRIVILEGE-ESCALATION-HARDENING-001.

Historical finding SHERIVS-001 (identity self-update / role / school privilege escalation) was re-inspected against current source. Confirmed defects were remediated at the smallest defensible scope: application allowlists plus a **proposed, not executed** SQL freeze.

---

## 2. Executive summary

Source inspection **confirmed** two in-scope privilege-escalation defects:

1. **PATH A — self-update.** Canonical policy `"User updates self"` on `public.users` is `USING (id = auth.uid()) WITH CHECK (id = auth.uid())`. Combined with `GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated`, any authenticated principal can PATCH `role`, `school_id`, and `is_active` through PostgREST. `profile.functions.ts` Zod filtering is not a database boundary.

2. **PATH E — inactive accounts.** Last Scholar DEFINER bodies of `is_school_admin()`, `get_my_school_id()`, and `get_my_role()` (`20260620151525`) do not require `users.is_active = true`. Inactive administrators still satisfy Scholar RLS and Phase 08 RPCs.

PATH A chains into PATH D (staff provisioning via `decideAccountAdministration` → `is_school_admin` RPC → service-role upsert) and PATH G (`assign_role` after `requireSchoolAdminScope`). Neutral `cg_*` membership still requires `is_tenant_admin()` and is **not** automatically granted by `users.role` self-elevation.

**Implemented (source):**

- Application fail-closed allowlists in `frontend/src/lib/identity-privilege.ts`, wired into profile self-update, HR staff updates, and teacher active-state changes.
- Proposed SQL `database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed`: active-account helper gates + `BEFORE UPDATE` trigger `trg_users_forbid_self_privilege_mutation` that refuses self-mutation of `role`, `school_id`, and `is_active`. Service-role / owner path (`auth.uid()` IS NULL) is unchanged.

**Not implemented / not claimed:**

- The proposed SQL has **not** been applied. Direct PostgREST self-update remains open on any live database that still matches canonical policies.
- Canonical historical migrations were not rewritten.
- The staging-runner pin remains 71 files at commit `d195ba861f80379b79533126653b9cee82a8e872`.
- SHERIVS-002 and SHERIVS-003 remain **OPEN**.
- Parent-engagement `news_reads` tenant-scoping remains **OPEN**.

**Verdict:** PASS WITH CONDITIONS. Principal source corrections exist and offline tests pass. PostgreSQL enforcement is unverified because this mission was forbidden from contacting a database or applying SQL.

---

## 3. Initial Git state

Observed at mission start, before implementation:

| Item | Value |
|---|---|
| Branch | `cursor/sherivs-001-identity-privilege-hardening-d80b` created from `cursor/sherivs-environment-target-db-hardening-d80b` |
| Baseline HEAD | `35787b3b805db26365ba59ef07d24122754536a3` |
| Baseline tree | `771209b8d6dc70f236f43dabfac50221bd842c7e` |
| Working tree | clean |
| Unrelated work | none discarded; environment-target hardening retained |

No `git reset`, `git clean`, or discard was performed.

---

## 4. Baseline commit SHA

`35787b3b805db26365ba59ef07d24122754536a3` — `docs: record report commit SHA for environment-target hardening`.

---

## 5. Final commit SHA

Recorded after the report commit in section 5a below. Implementation and test-fix SHAs:

| Commit | SHA | Purpose |
|---|---|---|
| Implementation | `e44f58fa0560cf61edb1d924ca8844de27b05b52` | Privilege freeze helper, proposed SQL, call-site wiring, initial tests |
| Test fix | `5428481736d654306fb350531edd2a7ed255b3c2` | GRANT/REVOKE assertions match SQL statements, not comments |
| Report | this document's commit | Governance record |

---

## 6. Working-tree status

After implementation and tests: only this report (and the subsequent SHA pin if any) remained to commit. Unrelated files were not modified.

---

## 7. Scope and explicit exclusions

**In scope:**

- Identity and membership trust model from repository source.
- Privilege-escalation paths A–H against actual schema, grants, policies, helpers, triggers, RPCs, and application callers.
- Smallest corrections for confirmed SHERIVS-001 defects.
- Offline adversarial tests TEST 1–18 as source/unit properties.
- Governance report.

**Excluded / not executed:**

- Any PostgreSQL, Supabase, Vercel, GitHub write, or other live network operation.
- Migration apply, `db push`, `db reset`, `db restore`, live SQL.
- Production or staging access, restore, or deployment.
- Secret, DNS, or cloud-configuration changes.
- Canonical pin change; adding a 72nd canonical `.sql` file.
- Broad grant rewrite (SHERIVS-002).
- Sensitive-column rewrite (SHERIVS-003).
- Application filter on `/admin/intelligence` `news_reads` (separate OPEN item).
- Inventing a new role model.

---

## 8. Identity and membership trust model

Answers from source evidence. Assumptions are marked.

| # | Question | Source answer |
|---|---|---|
| 1 | How is a user authenticated? | Supabase Auth (`signInWithPassword` / session JWT). Browser client: `frontend/src/integrations/supabase/client.ts` (publishable key only). |
| 2 | What uniquely identifies the principal? | `auth.uid()` = `auth.users.id` = `public.users.id` when a tenant profile exists. Super-admins are `public.super_admins.id` and typically have no `users` row (`app-context.tsx`). |
| 3 | Where is institutional membership stored? | Dual: (a) Scholar `public.users.school_id`; (b) neutral `cg_org_membership.tenant_id` + `cg_role_assignment.tenant_ref`. |
| 4 | Where are roles stored? | Dual: (a) `public.users.role` CHECK (`admin\|principal\|teacher\|parent\|student\|bursar\|hq\|alumni\|driver`); (b) neutral `cg_role_assignment.role_id` / `cg_org_membership.role_ref` (`role:administrator`, …). |
| 5 | Multiple memberships? | Neutral substrate allows multiple tenants; `get_my_tenant_id()` raises `AMBIGUOUS_TENANCY` if more than one active binding. Scholar `users` is one `school_id` per row. |
| 6 | Where is `school_id`? | Profile column `users.school_id`. Not observed as a JWT authorization claim for Phase 08. UI `app-context` reads the `users` row. |
| 7 | Which representation is authoritative? | Scholar domain RLS and Phase 08 RPCs `is_school_admin` / `get_my_school_id` / `get_my_role` use **`public.users`**. Neutral cg_ RPCs use **`cg_org_membership` / `cg_role_assignment`**. They are independent. |
| 8 | How are membership changes propagated? | No privilege-sync trigger on `users` besides `trg_users_updated` → `touch_updated_at`. Neutral membership is written by tenant-admin policies or SECURITY DEFINER RPCs. Provisioning uses service-role upsert (`staff-accounts.functions.ts`, `teachers.functions.ts`). |
| 9 | Account activation / suspension? | Scholar: `users.is_active boolean DEFAULT true`. Super-admins: `super_admins.is_active`. Neutral: `cg_org_membership.state`, `cg_role_assignment.status` + date bounds. Phase 08 lifecycle signals are optional and JWT has no lifecycle claim (`staff-accounts.functions.ts` comments `lifecycle: null`). |
| 10 | How do authorization helpers get inputs? | SECURITY DEFINER SQL reads `auth.uid()` then `users` or `super_admins` or cg_ tables. Application `resolveRoleGate` calls those RPCs. `RoleGuard` is UI-only from `app-context` profile. |
| 11 | Invoker vs definer? | `20260620122110` set helpers INVOKER (recursion). `20260620151525` restored DEFINER for the three `users` helpers. `20261003000020` restored DEFINER for `is_super_admin`. Neutral helpers in `20261002000001` are DEFINER. Proposed freeze keeps DEFINER for Scholar helpers; the new trigger function is INVOKER. |
| 12 | Who can insert/modify membership? | `users`: policy `"School admin manages users"` FOR ALL (school admin same school or super-admin) plus service-role (bypasses RLS). Neutral cg_*: INSERT/UPDATE require `is_tenant_admin(row.tenant)`; DELETE has no policy. |
| 13 | Who can change account status? | Same `"School admin manages users"` / service-role for `users.is_active`. `setTeacherActive` is a school-admin server function (now refuses self). Super-admin `is_active` is a separate table. |
| 14 | How are administrator accounts created? | `createStaffAccount` after `decideAccountAdministration` (platform super-admin OR school-admin RPC), then `supabaseAdmin` auth create + `users` upsert including `role: admin`. Demo provision also uses service-role. No `handle_new_user` trigger on `auth.users` was found. Signup creates auth users only. |
| 15 | Service-role legitimacy? | Auth admin APIs, privileged upserts, kernel identity draft, password reset, demo provision. Browser client must not receive the key (`public-config.ts`). |
| 16 | Can profile updates trigger privileged changes? | Canonical: yes, because self-UPDATE can set `role`/`school_id`/`is_active` and no sync trigger is required — the columns **are** the Scholar authorization inputs. Proposed trigger refuses those column changes on self. `trg_users_updated` only sets `updated_at`. |
| 17 | Stale JWT? | Phase 08 does not trust JWT `role`. It re-queries RPCs. UI `RoleGuard` can be stale until profile reload / realtime. Realtime handler signs out on `is_active === false`. |
| 18 | Profile vs membership vs token disagreement? | Scholar RLS follows `users` via helpers. Neutral RLS follows cg_ bindings. JWT is authentication, not Scholar role. UI may disagree with RPCs; RPCs fail closed when `roleGranted` is not true. |

**Unresolved design ambiguity (documented, not guessed):** which of Scholar `users.role` vs neutral `role:administrator` is the long-term platform authority. This mission does not merge them. Scholar RLS still uses `users`; that is why freezing `users.role` / `users.school_id` is required for SHERIVS-001.

---

## 9. Relevant schema and migration sources

Canonical (historical; presence in Git is not live apply proof):

- `database/supabase/migrations/20260620122048_50e590c2-5911-4c98-8931-fb46a4b509f3.sql` — `users` table, bulk grants, `"User updates self"`, `"School admin manages users"`, helper v1, `trg_users_updated`.
- `database/supabase/migrations/20260620122110_178748dc-376f-4c78-911d-ec879dfffce1.sql` — INVOKER helpers (superseded for the `users` trio).
- `database/supabase/migrations/20260620151525_b630392a-2197-480f-b1cb-99da6c869c81.sql` — last Scholar DEFINER bodies of `get_my_school_id` / `get_my_role` / `is_school_admin` (no `is_active`).
- `database/supabase/migrations/20260626150625_35a08443-45fd-46ae-807b-3644b44efe26.sql` — `users_role_check` includes `driver`.
- `database/supabase/migrations/20260904010000_coregrid_rls_transport_and_grants.sql` — `REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.users FROM anon, authenticated`; comment “users: NO policy change”.
- `database/supabase/migrations/20260907000800_coregrid_role_assignment_substrate.sql` — original `assign_role` gated by `is_school_admin()`.
- `database/supabase/migrations/20261002000001_coregrid_v1_neutral_tenant_primitives.sql` — `get_my_tenant_id` / `holds_tenant_role` / `is_tenant_admin`; RPCs re-pointed.
- `database/supabase/migrations/20261002000013_coregrid_v1_neutral_membership_policies.sql` — cg_* grants + tenant-admin policies.
- `database/supabase/migrations/20261003000020_coregrid_is_super_admin_definer.sql` — `is_super_admin` DEFINER + `super_admins.is_active`.
- `database/supabase/migrations/20260626111823_66d215f2-2628-4490-93eb-0379825258b9.sql` — `news_reads` table and `news_reads_school` policy.

Proposed (this mission, **not applied**):

- `database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed`
- `database/supabase/rollbacks/20261015000010_sherivs_identity_privilege_freeze.sql.proposed`

Generated TypeScript types (`packages/contracts/src/database.ts`) are **not** treated as effective grants.

---

## 10. Threat model

Attacker: authenticated ordinary user (teacher/parent/student/bursar/driver) with a valid JWT and PostgREST access as role `authenticated`.

Assets: Scholar tenant data, administrative RPCs, account provisioning, other tenants' `school_id` scope.

Trust boundaries: browser vs server (`client.ts` vs `client.server.ts`); JWT authentication vs authorization helpers; `users` vs cg_ membership; UI `RoleGuard` vs RLS.

---

## 11. Confirmed vulnerabilities

### V-001 PATH A — self-update of privilege columns

| Item | Detail |
|---|---|
| Resource | `public.users` columns `role`, `school_id`, `is_active` |
| Operation | `UPDATE` via PostgREST / user-JWT Supabase client |
| Principal | Any authenticated user matching `"User updates self"` |
| Boundary bypassed | INVARIANT 1, 2, 3, 8 — profile editing becomes privilege management |
| Source | `20260620122048` grants + policy; `hr.tsx` previously forwarded `rest` including `role`; Zod in `profile.functions.ts` does not bind PostgREST |
| Impact | Self-promotion to `admin`/`principal` makes `is_school_admin()` true; setting `school_id` retargets `get_my_school_id()` and all Scholar tenant policies using it |
| Correction | Proposed BEFORE UPDATE trigger; application allowlists |
| Evidence | Source policy text; offline parser tests. **Not** live PostgreSQL |

### V-002 PATH E — inactive helpers

| Item | Detail |
|---|---|
| Resource | Scholar RLS predicates and Phase 08 RPCs |
| Operation | Any policy/RPC calling `is_school_admin` / `get_my_school_id` / `get_my_role` |
| Principal | Authenticated user with `users.is_active = false` |
| Boundary bypassed | INVARIANT 5 |
| Source | `20260620151525` function bodies |
| Impact | Disabled administrators retain admin RLS and can call school-admin server functions if they still authenticate |
| Correction | Proposed helper bodies add `AND is_active = true` |
| Evidence | Source SQL. **Not** live catalog |

### V-003 PATH A → D/G chain

After V-001, `createStaffAccount` and `requireSchoolAdminScope` succeed because they trust `is_school_admin` RPC. Service-role then inserts/upserts other users. Closing V-001/V-002 at the database is required; application allowlists do not stop raw PostgREST.

---

## 12. Findings investigated but not confirmed

| Path | Result |
|---|---|
| PATH C trigger sync | `trg_users_updated` only `touch_updated_at`. No membership-sync trigger on `users` found. |
| PATH B cg_* self-insert | Policies require `is_tenant_admin`. `users.role` self-elevation does **not** make `is_tenant_admin` true. Chicken-egg bootstrap is service-role / already-admin. Not a confirmed self-escalation from an ordinary Scholar user. Grants remain a SHERIVS-002 topic. |
| PATH D unauthorized bootstrap | Application path is gated. Unauthorized success depends on V-001. Direct service-role in the browser was **not** found. |
| Super-admin self-insert | `"Super admin manages super_admins"` requires `is_super_admin()`. Ordinary users cannot insert. |
| JWT `user_metadata.role` | Teacher invite writes metadata; no application authorization consumer of `user_metadata.role` found. |
| `handle_new_user` | Not present. Signup does not insert `public.users`. |
| Column-level UPDATE grants | None found. Table-level UPDATE for `authenticated` applies to all columns. |
| WITH CHECK freeze without trigger | WITH CHECK cannot see OLD; subquery on `users` would observe NEW. Not used as the freeze. |

---

## 13. Attack-path analysis

**PATH A.** `authenticated` UPDATE + id-only policy → PATCH `{role:'admin'}` or `{school_id:<other>}` or `{is_active:true}`.

**PATH B.** Direct INSERT into `cg_org_membership` requires `is_tenant_admin(tenant_id)`. Ordinary user: denied by policy (source). After PATH A, still denied unless a neutral administrator binding already exists.

**PATH C.** Low-privilege write does not elevate via `touch_updated_at`. Proposed trigger **reduces** caller authority on self-writes; it does not expand it. `auth.uid()` NULL skips the freeze (service-role).

**PATH D.** `createStaffAccount` / `inviteTeacher` use `supabaseAdmin` after Phase 08. Reachable to an ordinary user only after PATH A.

**PATH E.** Inactive row still matches `is_school_admin()` in canonical helpers.

**PATH F.** UI RoleGuard trusts `users` row. Phase 08 trusts RPCs. Client-supplied role in `evaluateRoleGate` is unused; `roleGranted` comes from RPC. Conflicting UI vs RPC: RPC fail-closed. Stale JWT role claim: not used for Scholar admin RPC.

**PATH G.** `assign_role` is SECURITY DEFINER, `GRANT EXECUTE TO authenticated`, body `IF NOT is_tenant_admin(...)`. Scholar `requireSchoolAdminScope` still uses `is_school_admin`. Two gates; PATH A opens the Scholar one.

**PATH H.** Additional writers: `profile.functions.ts` (now allowlisted), `hr.tsx` (now allowlisted), `setTeacherActive` (now refuses self), `push-client.ts` (`push_token` only), service-role provisioning, e2e helpers. Direct PostgREST remains until SQL is applied.

---

## 14. Grants and RLS analysis (`public.users`)

| Mechanism | Canonical source fact |
|---|---|
| Columns (privilege-bearing) | `id`, `school_id`, `role`, `is_active` (plus profile/HR/sensitive columns out of SHERIVS-001 mutation freeze) |
| Table GRANT | `SELECT, INSERT, UPDATE, DELETE` to `authenticated`; `ALL` to `service_role` (`20260620122048` bulk DO block) |
| Extra REVOKE | `TRUNCATE, TRIGGER, REFERENCES` from `anon, authenticated` (`20260904010000`) |
| Column GRANT | none declared |
| INSERT policy | none dedicated; `"School admin manages users"` FOR ALL covers INSERT |
| SELECT | `"User reads self"`; `"Same school users can see each other"` (`school_id = get_my_school_id()` OR super-admin) |
| UPDATE USING | `"User updates self"`: `id = auth.uid()`. `"School admin manages users"`: same-school admin or super-admin |
| UPDATE WITH CHECK | same as USING for both policies — **no freeze of NEW.role / NEW.school_id / NEW.is_active** on self |
| DELETE | only via FOR ALL school-admin/super-admin policy |
| FORCE RLS | not set on `users` in inspected migrations |
| This mission | no GRANT/REVOKE/POLICY change in proposed SQL |

Neutral cg_* tables: authenticated DML + tenant-admin policies + FORCE RLS (`20261002000013`). Unchanged.

---

## 15. Trigger and function analysis

| Object | Execution | Notes |
|---|---|---|
| `touch_updated_at` / `trg_users_updated` | INVOKER trigger | `updated_at` only |
| `is_school_admin` / `get_my_*` | DEFINER, `search_path=public`, no args | Canonical: no `is_active`. Proposed: `is_active = true` |
| `is_super_admin` | DEFINER (`20261003000020`) | Already filters `super_admins.is_active` |
| `forbid_self_privilege_mutation` | INVOKER trigger (proposed) | OLD vs NEW freeze when `NEW.id = auth.uid()` |
| `assign_role` et al. | DEFINER | `is_tenant_admin` gate; EXECUTE to `authenticated` |
| `get_my_tenant_id` | DEFINER | cg_ only; AMBIGUOUS_TENANCY fail-closed |

SECURITY DEFINER helpers take no client parameters and answer only about `auth.uid()`. They remain an input to RLS, not a universal bypass. Proposed SQL does not GRANT extra EXECUTE.

---

## 16. Account-status enforcement analysis

| Layer | Canonical | After this mission (source) |
|---|---|---|
| `users.is_active` | Column exists; helpers ignore it | Proposed helpers require it |
| `super_admins.is_active` | Already in `is_super_admin` | Unchanged |
| Phase 08 lifecycle | Optional; JWT has no claim; `lifecycle: null` marks unverified | Unchanged (additive) |
| UI realtime | Sign-out on `is_active === false` | Unchanged; not a security boundary |
| Self-reactivation | Allowed by `"User updates self"` | Proposed trigger refuses `is_active` self-change |

Until the proposed SQL is applied, inactive-account enforcement at PostgreSQL remains the canonical gap (V-002).

---

## 17. Changes implemented

1. `frontend/src/lib/identity-privilege.ts` — privileged column set; `parseSelfProfilePatch`; `parseHrStaffPatch`; `assertNotSelfAccountStatusChange`. Fail closed on missing actor/target. `school_id` never allowed in HR patches. Self role/active changes refused; unchanged self role is stripped.
2. `frontend/src/lib/profile.functions.ts` — validator uses `parseSelfProfilePatch` (strict; privileged keys throw before Zod strip).
3. `frontend/src/routes/_authenticated/admin/hr.tsx` — allowlisted patch; actor `profile?.id ?? authUser?.id` (super-admin has no `users` row).
4. `frontend/src/lib/runtime/scholar/teachers.functions.ts` — `setTeacherActive` refuses self.
5. Proposed SQL + rollback as `.sql.proposed` so the runner pin stays 71.
6. Offline tests `tests/unit/sherivs-001-identity-privilege.test.ts`.

Legitimate profile fields, other-user HR role/employment updates, school-admin teacher disable, and service-role provisioning are preserved in source.

---

## 18. Files changed and reasons

| File | Reason |
|---|---|
| `frontend/src/lib/identity-privilege.ts` | Shared fail-closed privilege boundary |
| `frontend/src/lib/profile.functions.ts` | Self-service profile is not privilege management |
| `frontend/src/routes/_authenticated/admin/hr.tsx` | Stop client JWT from sending `school_id` or self-role changes |
| `frontend/src/lib/runtime/scholar/teachers.functions.ts` | Stop self active-state toggle |
| `database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` | DB freeze + active helpers (not applied) |
| `database/supabase/rollbacks/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` | Inverse of the proposed SQL |
| `tests/unit/sherivs-001-identity-privilege.test.ts` | TEST 1–18 source properties |
| `docs/security/SHERIVS-001-IDENTITY-AND-PRIVILEGE-ESCALATION-HARDENING-001.md` | This report |

---

## 19. Proposed migrations

**File:** `20261015000010_sherivs_identity_privilege_freeze.sql.proposed`  
**Status:** AUTHORED, NOT APPLIED. Not in the canonical 71-file pin. Runner excludes `*.sql.proposed`.

**Intent:** redefine three Scholar helpers with `is_active = true`; add BEFORE UPDATE self-privilege freeze.

**Dependencies:** existing `public.users` (`role`, `school_id`, `is_active`), `auth.uid()`, helper names already EXECUTE-able.

**Rollback:** restore `20260620151525` bodies; drop trigger/function.

**What cannot be proven offline:** that PostgreSQL will compile, that live objects match these names, that no extra policies were added live, that FORCE RLS / column grants differ from Git.

Do not set `securityProof` or `schemaEquivalence` true from this file.

---

## 20. Tests executed

Offline Vitest only. Command (from `/workspace`):

```
npx vitest run \
  tests/unit/sherivs-001-identity-privilege.test.ts \
  tests/unit/sherivs-db-target.test.ts \
  tests/unit/sherivs-staging-migration-runner.test.ts \
  tests/unit/security-role-gate.test.ts \
  tests/unit/identity-lifecycle-enforcement.test.ts \
  tests/unit/env.test.ts
```

Log: `/opt/cursor/artifacts/sherivs-001-offline-tests-summary.log`.

---

## 21. Exact commands and exit codes

| Command | Exit |
|---|---|
| `npx vitest run` (six files above, `pipefail`) | **0** |
| Per-file JSON recount of the same six files | **0** |
| `npx tsc --noEmit --pretty false` | **2** (pre-existing parse error in `frontend/src/routes/_authenticated/admin/health-certificate.tsx` line 19 — **not** introduced by this mission) |

Vitest summary: `Test Files  6 passed (6)` / `Tests  288 passed (288)` / `VITEST_EXIT:0`.

---

## 22. Test counts and failures

| File | Passed | Failed |
|---|---|---|
| `tests/unit/sherivs-001-identity-privilege.test.ts` | 39 | 0 |
| `tests/unit/sherivs-db-target.test.ts` | 23 | 0 |
| `tests/unit/sherivs-staging-migration-runner.test.ts` | 108 | 0 |
| `tests/unit/security-role-gate.test.ts` | 27 | 0 |
| `tests/unit/identity-lifecycle-enforcement.test.ts` | 74 | 0 |
| `tests/unit/env.test.ts` | 17 | 0 |
| **Total** | **288** | **0** |

First run of the new suite had 1 failure (`GRANT /` matched comment text). Assertion tightened; recount 39/39.

---

## 23. What the tests prove

- Application parsers refuse self-role, self-school, self-active, unknown fields, and unresolved actor/target.
- Legitimate profile and other-user HR patches remain representable.
- Proposed SQL contains DEFINER helpers with `is_active = true`, INVOKER freeze trigger, no GRANT/REVOKE/POLICY statements.
- Canonical `"User updates self"` remains id-only (defect still in historical SQL until proposed is applied).
- Neutral membership policies still require `is_tenant_admin`.
- Browser public config still rejects service-role keys.
- `evaluateRoleGate` does not honor a client-claimed admin role without `roleGranted`.
- Runner pin is still 71 / `d195ba8`; proposed filenames are excluded (`PROPOSED_SQL_EXCLUDED`).
- Environment-target helper still fail-closes (`TARGET_MISSING`, `SHERIVS_DATABASE_TARGET`).
- Refusal strings do not embed connection strings or tokens.

They do **not** prove PostgreSQL executes the trigger or that any database has the proposed functions.

---

## 24. What remains unverified

- Live catalog of production (`nwrflbpbhyiqdptmlccm`) and staging (`dvxszhracsjwdancijdc`).
- Whether canonical migrations were applied; whether extra live policies exist.
- PostgreSQL OLD/NEW trigger behavior, RLS combination, and service-role `auth.uid()` nullity on the actual platform.
- Direct PostgREST exploit against a live project.
- Effectiveness of `news_reads_school` RLS on live data.
- Full-repo `tsc` (blocked by an unrelated existing syntax error).
- E2E / mobile / browser UI of HR and settings (would need live Supabase).

---

## 25. Relationship to SHERIVS-002 and SHERIVS-003

| Finding | Status | Relationship |
|---|---|---|
| SHERIVS-002 | **OPEN** | `users` still has table-level INSERT/UPDATE/DELETE for `authenticated`. TRUNCATE REVOKE unchanged. This mission did not narrow grants (column REVOKE would break other-user HR). Neutral cg_* DML grants unchanged. Do not treat helper/trigger work as grant hygiene. |
| SHERIVS-003 | **OPEN** | HR still updates `salary` and selects employment fields via user JWT. Sensitive HR/NIN/biometric columns were not added to the self-freeze set beyond identity privileges. No claim of sensitive-data resolution. |

Dependencies: PATH A uses the SHERIVS-002 UPDATE grant as the table privilege; RLS/trigger must constrain it. SHERIVS-003 data remains readable under existing SELECT policies (`Same school users can see each other`).

---

## 26. Parent-engagement tenant-scoping status

**OPEN.** `frontend/src/routes/_authenticated/admin/intelligence.tsx` still selects `news_reads` with `.select("user_id").gte("read_at", monthStart)` and **no** `.eq("school_id", schoolId)`.

Source policy `news_reads_school` (`20260626111823`) is `USING (school_id = public.get_my_school_id())`. If that policy is live and `get_my_school_id()` is correct, SELECT would still be school-scoped. That is **not** proven. PATH A school reassignment would retarget `get_my_school_id()` and therefore this policy — a SHERIVS-001 dependency. The proposed freeze, **once applied**, would close that identity path. The missing application filter remains a separate investigation.

No customer records were read. The query was not modified.

---

## 27. Migration-runner safety status

Preserved.

- Pin: commit `d195ba861f80379b79533126653b9cee82a8e872`, tree `bbd828951e166662bbe831fd74972e1a15488468`, `PINNED_MIGRATION_COUNT = 71`.
- `inspectWorkingTree` ignores `*.sql.proposed`.
- `verifyLoadedFiles` refuses proposed filenames (`PROPOSED_SQL_EXCLUDED`).
- Live execute still unauthorized (`LIVE_EXECUTE_NOT_ENABLED` in runner tests).
- Runner tests: 108/108 passed.

---

## 28. Environment-target safety status

Preserved. `scripts/lib/sherivs-db-target.mjs` still requires `SHERIVS_DATABASE_TARGET`. Tests: 23/23 passed. No protected script was pointed at a live database in this mission.

---

## 29. Production and staging status

**Not authorized. Not contacted. Not restored. Not migrated. Not deployed.**

No claim that live production or staging is secure. A proposed file in Git is not live state.

---

## 30. Remaining risks

1. **Critical until apply:** live databases matching canonical `"User updates self"` still allow PostgREST self-elevation. Application allowlists do not bind PostgREST.
2. Dual authority (`users.role` vs `is_tenant_admin`) can diverge after legitimate admin workflows.
3. Phase 08 `lifecycle: null` still flags unverified identity lifecycle on staff provisioning.
4. `"Same school users can see each other"` remains a broad SELECT (SHERIVS-002/003).
5. `users` FORCE RLS is not set in source.
6. Unrelated `tsc` failure in `health-certificate.tsx` is pre-existing.

---

## 31. Recommended next mission

**SHERIVS-001-PROPOSED-SQL-AUTHORIZED-APPLY-AND-CATALOG-PROOF-001** (separate human authorization):

1. Read-only catalog of `users` policies, grants, helper `prosrc`, and triggers on the intended **non-production** target using `SHERIVS_DATABASE_TARGET` (do not silently target production).
2. Apply only `20261015000010_sherivs_identity_privilege_freeze.sql.proposed` after pin-governance review (promote to canonical `.sql` only with an explicit pin-change mission).
3. Offline-to-live proof: authenticated self-UPDATE of `role`/`school_id`/`is_active` fails; other-user school-admin UPDATE succeeds; inactive admin RPCs return false/NULL; service-role provisioning still works.
4. Keep SHERIVS-002 / SHERIVS-003 / `news_reads` OPEN unless that mission is explicitly scoped to them.

Then **SHERIVS-002** grant/TRUNCATE review remains the next identity-adjacent finding.

---

## 32. Reproducible offline verification instructions

From a clone of this branch, with no database env vars required:

```
npx vitest run tests/unit/sherivs-001-identity-privilege.test.ts \
  tests/unit/sherivs-db-target.test.ts \
  tests/unit/sherivs-staging-migration-runner.test.ts
```

Expect exit 0. Do not set `DATABASE_URL` / `STAGING_DATABASE_URL` / `PRODUCTION_DATABASE_URL`. Do not run `supabase db push`. Do not execute the `.sql.proposed` file.

---

## Verdict statement

**PASS WITH CONDITIONS.**

Conditions:

- Proposed SQL is source-only and unapplied.
- PostgreSQL authorization semantics are untested on a real engine.
- Direct PostgREST PATH A remains a live risk until apply.
- SHERIVS-002, SHERIVS-003, and parent-engagement `news_reads` remain OPEN.
- `tsc` was not green (unrelated existing error).

A passing unit suite is not by itself PASS for this mission class; the conditions above are why the verdict is not PASS.
