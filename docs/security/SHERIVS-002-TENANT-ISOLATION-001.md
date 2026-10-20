# SHERIVS-002 — Tenant isolation: model reconciliation and table inventory

Mission: SHERIVS-002 · Branch: `cursor/sherivs-002-tenant-isolation` · Version-target classification: **V1** (organizational envelope; no V2/V3 scope touched).
Evidence basis: static reading of `database/supabase/migrations/*.sql` (canonical) and `frontend/src`, plus the live **local** catalog inventory `/tmp/sv2-inventory.psv` (120 public tables). No database was queried while writing this document. Sections 3 and 4 are for the operator.

## 1. Two competing tenant models

### 1a. Scholar model (school-keyed)

| Element | Definition |
|---|---|
| Tenant root | `public.schools` (`id uuid`) — `20260620122048_50e590c2-5911-4c98-8931-fb46a4b509f3.sql:7` |
| Membership | `public.users.school_id` (NOT NULL FK) + `users.role` — same file `:75-81`; role set widened to include `driver`/`hq`/`alumni` at `20260626150625_35a08443-45fd-46ae-807b-3644b44efe26.sql:30-32` |
| Helpers (SECURITY DEFINER) | `is_super_admin()` `20260620122048…:112`, `get_my_school_id()` `:117`, `get_my_role()`, `is_school_admin()` `:127` (role in `admin`,`principal`); re-declared `20260620151525_b630392a-2197-480f-b1cb-99da6c869c81.sql:2,12`; `is_super_admin()` re-declared `20261003000020_coregrid_is_super_admin_definer.sql:40` |
| RLS | `school_id = get_my_school_id() OR is_super_admin()` on the generic tenant tables `20260620122048…:640-650`, CMS tables `:655-665`, `users` `:626-633`, `schools` `:611-617`; storage `school-media` folder prefix = `get_my_school_id()::text` `20260707223958_421f2364-7989-4069-b78c-fd119f19daeb.sql:4-19` |
| Column key | `school_id` (61 live tables) |
| App gate | `security-role-gate.ts:130` (`school_admin: { role: "is_school_admin", scope: "get_my_school_id" }`), `:450-451` (`STAFF_SCOPE_RPC`/`STAFF_ROLE_RPC`), `:467-471` (RPC calls), `:492` (`schoolId: gate.scope`); `runtime/scholar/scholar-role-assignments.functions.ts:86`; `scholar-feature-access.functions.ts:84` |

### 1b. Neutral CoreGrid model (`cg_*`)

| Element | Definition |
|---|---|
| Tenant entity | `public.cg_tenant` (`id uuid`, hierarchy via `parent_tenant_id`) — `20260904020000_coregrid_l2_identity_tenancy.sql:45`. Header `:12-14` states runtimes "map their tenant rows onto cg_tenant at runtime"; **no migration or code performs that mapping** |
| Membership | `cg_org_membership` (`tenant_id text`, `principal_ref`, `role_ref`, `state`) `20261001000000_coregrid_v1_org_model.sql:93`; `cg_role_assignment` (`tenant_ref text`, `identity_ref`, `role_id`, time-bounded) `20260907000800_coregrid_role_assignment_substrate.sql:28` |
| Helpers (SECURITY DEFINER) | `get_my_tenant_id()` `20261002000001_coregrid_v1_neutral_tenant_primitives.sql:102` (NULL if unbound, raises `AMBIGUOUS_TENANCY` if bound to >1 tenant), `holds_tenant_role()` `:157`, `is_tenant_admin(p_tenant text)` `:200` (= `holds_tenant_role(p, 'role:administrator')`) |
| RLS | `tenant_ref/tenant_id = get_my_tenant_id()` for SELECT, `is_tenant_admin(...)` for INSERT/UPDATE: `20261002000013_coregrid_v1_neutral_membership_policies.sql:138-189`, `20261002000015_coregrid_v1_substrate_policies.sql:219-267`, `20261003000016_coregrid_v1_file_substrate.sql:264-267`. All other `cg_*` kernel tables: RLS on, **zero policies** (deny to clients, service role only) |
| Column keys | `tenant_id` (45 live tables), `tenant_ref` (`cg_role_assignment`, `cg_role_grant`, `cg_workforce_position`) — **text**, whereas `cg_tenant.id` and the RPC parameter `p_tenant` are **uuid** |
| TS | `frontend/src/lib/tenant-registry*.ts` (writes `cg_tenant` with the service role: `tenant-registry.functions.ts:88,103`), `identity-registry*.ts`, `rbac/neutral-roles.ts` (neutral role set), `rbac/role-gate.ts` (`requiresScope`, `tenantUnresolvedReason`), `tenancy/tenant-resolution.ts` (explicit per-request tenant declaration with membership proof) |

### 1c. Which model is authoritative for data isolation today

**The Scholar model.** Every live Scholar data table (all 61 `school_id` tables plus `schools`, `users`, storage `school-media`) is isolated by `school_id = get_my_school_id()` policies. The neutral model governs only the `cg_*` substrate: 7 `tenant_id` tables + `cg_role_assignment`/`cg_role_grant` have neutral policies; 38 `cg_*` tenant-keyed tables are deny-all. No Scholar business table consults `get_my_tenant_id()` / `is_tenant_admin()`, and `get_my_school_id()` never reads `cg_org_membership` / `cg_role_assignment`. A principal's identity is therefore resolved **twice, from two unrelated sources**.

### 1d. Concrete conflicts

1. **No school ↔ `cg_tenant` mapping.** `schools.id` and `cg_tenant.id` are independent uuids; `cg_tenant` rows are minted by `registerTenant` with a random id and slug (`tenant-registry.functions.ts:80-103`) and nothing links them. Code instead *assumes* `schools.id::text = tenant_ref/tenant_id`: `identity-registry.functions.ts:60-93` writes `cg_identity.tenant_id = schoolId` and reads it back with `.eq("tenant_id", schoolId)` `:134`; `scholar-role-assignments.functions.ts:86-101` passes `get_my_school_id()` as `tenant_ref`. `cg_tenant` is thus a registry that no isolation decision reads.
2. **Key-type mismatch.** Neutral tables key by `text` (`cg_org_membership.tenant_id` `20261001000000…:95`, `cg_role_assignment.tenant_ref` `20260907000800…:30`); `cg_tenant.id`, `cg_workforce_position`-style RPC params (`p_tenant uuid`, `20261002000001…:237,419`) are uuid and are cast `::text` at every gate (acknowledged as unresolved COND-003, `20261002000001…:60-72`).
3. **Gate predicate flipped under the same RPC names.** `list_role_assignments`/`assign_role` were gated on `is_school_admin() AND get_my_school_id() = p_tenant` (`20260907000800…:100-132`) and were later replaced by `is_tenant_admin(p_tenant::text)` (`20261002000001…:419-476`). A school `admin`/`principal` (Scholar role) now passes these RPCs **only if** a `role:administrator` row exists in `cg_role_assignment`/`cg_org_membership` for the school id; nothing provisions it. Conversely the app-side callers still obtain the tenant from `get_my_school_id()` (`scholar-role-assignments.functions.ts:86`). Result: Scholar-admin → neutral-RPC lockout, or (if someone seeds `role:administrator` rows) privilege that `users.role` does not grant.
4. **Role vocabularies disagree.** Scholar: `users.role ∈ {admin, principal, teacher, parent, student, bursar, hq, alumni, driver}`, administrator = `admin|principal` (`is_school_admin`). Neutral: `role:administrator` ref (`is_tenant_admin`) and TS `org_owner/org_admin/member` (`rbac/neutral-roles.ts:31-33`). The domain→neutral mapping lives in TS (`rbac/domain-contribution.ts`), not in SQL, so RLS cannot honour it.
5. **Cardinality disagrees.** `get_my_school_id()` returns exactly one school per user (`users.id` PK). `get_my_tenant_id()` raises `AMBIGUOUS_TENANCY` for multi-tenant principals (`20261002000001…:122-130`), making every `tenant = get_my_tenant_id()` policy deny-by-error for them; TS `tenancy/tenant-resolution.ts` models explicit per-request declaration that no SQL policy implements.
6. **App gate trusts one model, RLS the other.** `security-role-gate.ts:130,450-492` and `identity-registry.functions.ts:60` resolve scope from the Scholar helpers, then write to `cg_*` tables via the **service role** (`identity-registry.functions.ts:78-83`, `tenant-registry.functions.ts:88`), bypassing the neutral RLS entirely. For these writes the only tenant enforcement is the app-supplied `schoolId`; the neutral policies never run.
7. **Super-admin bypass asymmetry.** Scholar policies OR in `is_super_admin()`; neutral policies and RPCs deliberately do not (`20261002000001…:79-80`).
8. **`cg_idempotency_record` migration defect (live RLS off).** `20261003000017_coregrid_v1_idempotency_substrate.sql:242` issues only `FORCE ROW LEVEL SECURITY`; I found no `ENABLE ROW LEVEL SECURITY` for the table. `FORCE` without `ENABLE` is a no-op, and `authenticated` holds `SELECT, INSERT, UPDATE` (`:252`). The live inventory confirms `rls_enabled=f` with 3 inert policies → any authenticated user can read/modify every tenant's idempotency records. See §2 and §4.
9. **Intentional-public reads that cross tenants.** `public_read_*` CMS policies (`20260620122048…:663`, `is_published = true`), `schools` "Anyone can read active schools" (`:611`), and the anon `school-media` read (`20261003000040…` header) deliberately expose cross-tenant rows; `admission_applications` INSERT is `WITH CHECK (true)` for anon (`20260626133221_e95464b7-e864-413c-a934-7428cb26da47.sql:78-81`) so a client can post an application with **any** `school_id`.
10. **Self-update of identity fields.** `"User updates self"` (`20260620122048…:629-630`, `WITH CHECK id = auth.uid()`) lets a user rewrite their own `school_id`/`role`; the local identity freeze (`20261015000010_sherivs_identity_privilege_freeze.sql.proposed`, applied locally) closes this, but canonical migrations do not carry it. The sweep script re-tests it (`users` `UPDATE_MOVE`).

## 2. Live table inventory (from `/tmp/sv2-inventory.psv`, 120 tables)

### 2a. Counts

| Category | Count |
|---|---|
| Tables in inventory | 120 |
| RLS **off** | **1** |
| RLS on, **zero policies** (deny-all to clients) | **46** (38 tenant-keyed `cg_*`, 8 without tenant column) |
| Policies containing `USING/WITH CHECK true` | **1** |
| No tenant column (`tenant_columns = -`) | **14** |
| Tenant tables by `school_id` | 61 |
| Tenant tables by `tenant_id` | 45 (38 zero-policy + 7 with policies) |
| Tenant tables by `tenant_ref` (not detected by the psv; static read) | 3 (`cg_role_assignment`, `cg_role_grant`, `cg_workforce_position`) |
| Tables with `anon` SELECT grant | 64 (60 of them `school_id` tables) |
| Tables where `authenticated` has any DML | 74 |

### 2b. Named lists

**RLS off (1):** `cg_idempotency_record` (3 policies present but inert; `authenticated` has DML; tenant column `tenant_id`).

**RLS on, zero policies (46):**
- Tenant-keyed (`tenant_id`, 38): `cg_delivery_evidence`, `cg_entity`, `cg_event`, `cg_event_route_cursor`, `cg_event_route_outcome`, `cg_event_route_queue`, `cg_event_security`, `cg_event_security_denial`, `cg_event_security_redaction`, `cg_evidence_lifecycle_act`, `cg_execution_record`, `cg_foundation_evidence`, `cg_hermes_observation`, `cg_identity`, `cg_knowledge_downgrade`, `cg_knowledge_freshness_contract`, `cg_knowledge_invalidation`, `cg_knowledge_source`, `cg_memory_access_log`, `cg_memory_record`, `cg_memory_scope`, `cg_mission_intent`, `cg_mission_lease`, `cg_observation`, `cg_org_unit`, `cg_reasoning_provenance_snapshot`, `cg_reconciliation_verdict`, `cg_relationship`, `cg_tool_runtime_invocation`, `cg_tool_runtime_tool`, `cg_usage_attribution_rollup`, `cg_worker_capability`, `cg_worker_definition`, `cg_worker_delegation`, `cg_worker_delegation_grant`, `cg_worker_quarantine`, `cg_workspace`, `cg_workspace_member`.
- No tenant column (8): `cg_conformance_assessment`, `cg_domain_runtime`, `cg_execution_history`, `cg_org_profile`, `cg_tenant`, `cg_verification_result`, `cg_workforce_kind`, `cg_workforce_position` (the last keys by `tenant_ref`, so it is tenant-scoped in practice).

All 46 have `anon_select=f` and `authenticated_has_any_dml=f`: access only via the service role or SECURITY DEFINER RPCs. They are safe by default but their tenant filtering depends entirely on the (service-role) callers.

**USING/WITH CHECK `true` (1):** `admission_applications` (3 policies) — the anon/authenticated INSERT `WITH CHECK (true)`; `anon_select=t` (grant; the SELECT policy is `authenticated`-scoped).

**No tenant column (14):** `cg_conformance_assessment`, `cg_domain_runtime`, `cg_execution_history`, `cg_org_profile`, `cg_role_assignment` (`tenant_ref`), `cg_role_grant` (`tenant_ref`), `cg_tenant`, `cg_verification_result`, `cg_workforce_kind`, `cg_workforce_position` (`tenant_ref`), `platform_config`, `schools` (is the tenant root), `super_admin_logs`, `super_admins`. Platform/global tables (`platform_config`, `super_admin_logs`, `super_admins`) carry `anon` SELECT grants and DML for `authenticated` — verify that their policies restrict to `is_super_admin()`.

**Tenant tables — `school_id` (61):** `academic_programs`, `admission_applications`, `ai_conversations`, `ai_interaction_log`, `attendance`, `attendance_logs`, `attendance_verification_log`, `audit_logs`, `blog_posts`, `classes`, `clinic_visits`, `digital_twin_calls`, `digital_twin_config`, `discipline_records`, `events`, `faqs`, `fees`, `fraud_attempts`, `grades`, `hostel_allocations`, `hostel_attendance`, `hostel_rooms`, `lesson_plans`, `library_books`, `library_borrowings`, `messages`, `news`, `news_reads`, `notification_preferences`, `notifications`, `parent_student_map`, `platform_complaints`, `qr_tokens`, `school_ad_campaigns`, `school_api_keys`, `school_calendar`, `school_expense_budgets`, `school_expenses`, `school_facilities`, `school_gallery`, `school_geofence`, `school_meals`, `school_sports`, `school_staff`, `school_staff_types`, `school_transport`, `staff_leave`, `staff_payroll`, `student_platform_fee_ledger`, `students`, `study_sessions`, `subscriptions`, `teacher_biometrics`, `teacher_performance_profiles`, `testimonials`, `timetable_slots`, `timetables`, `transport_buses`, `users`, `webhook_logs`, `why_us_items`.

**Tenant tables — `tenant_id` with policies (7):** `cg_event_route_subscription` (2), `cg_evidence_record` (2), `cg_file_object` (3), `cg_idempotency_record` (3, RLS off), `cg_org_membership` (3), `cg_reconciliation_input` (2), `cg_usage_attribution_bucket` (2). Plus `tenant_ref` tables with 3 policies each: `cg_role_assignment`, `cg_role_grant`.

**Observations for triage**
- 64 tables carry an `anon` SELECT grant; every one relies on RLS to return nothing sensitive to anon. The sweep script exercises anon against all of them.
- Scholar tables with exactly 1 policy (e.g. `students`, `grades` has 7) rely on a single `tenant_all_*`-style policy: confirm `WITH CHECK` is present (the sweep's `INSERT` / `UPDATE_MOVE` ops test this).
- Scholar tables with the generic `school_id = get_my_school_id()` policy let **every** role in a school (including `student`, `parent`) read and write all rows of that school; intra-tenant role isolation is outside this mission's cross-tenant scope but worth a follow-up mission.

## Cross-tenant test results

**Run 1** (`tests/integration/sherivs-002-cross-tenant.local.sql`, local disposable stack, 8 actors = 7 school-A roles + anon): PASS 4054, LEAK 82, INFO 132, SKIPPED 11.

| Classification | Tables / ops | Verdict |
|---|---|---|
| **Real leak** | `schools.paystack_secret_key` readable by anon + authenticated through "Anyone can read active schools" | fixed (below) |
| **Real leak** | `cg_idempotency_record` RLS disabled (policies inert; masked in run 1 because the table was SKIPPED) | fixed (below) |
| By design | `academic_programs`, `events`, `faqs`, `school_facilities`, `school_gallery`, `school_staff`, `testimonials`, `why_us_items` (SELECT `is_published = true`), `school_sports` (anon, `is_active = true`), `schools` active row | `PUBLIC_BY_DESIGN` |
| By design | `admission_applications` INSERT by anon/authenticated (public application form) | `PUBLIC_BY_DESIGN` |
| By design (residual) | `storage.objects[school-media]` anon SELECT ("school-media public read") | `PUBLIC_BY_DESIGN`, see residual risks |
| Harness gap | 11 `cg_*` tables SKIPPED (digest / envelope / id / bitemporal / enum CHECKs) | seeder overrides added (see Harness) |

The 82 LEAK rows are triaged per the table above. `cg_idempotency_record` was SKIPPED in run 1, so its RLS-off state was found by catalog inspection.

**Final run** (after all three fixes, on a freshly reset disposable stack: `supabase db reset --local` replaying 69 canonical migrations plus the 3 new SHERIVS-002 migrations, with the identity freeze `.sql.proposed` applied with `psql`): harness exit 0, **PASS 4597, LEAK 0, SKIPPED 0, PUBLIC_BY_DESIGN 82, INFO 1046**, `NO LEAKS`. Coverage: 459 probes for each of 8 actors (7 school-A roles plus anon). Tenant mapping was checked through `get_my_tenant_id()`.

Intermediate runs: run 2 had 21 SKIPPED (a text-to-array concatenation bug in the seeder flag override) and run 3 had published-row probes misclassified as LEAK. Both were harness bugs, fixed by the operator. Run 4 surfaced `admission_applications` INSERT, fixed in fix 3.

PostgREST spot checks (anon, loopback): `schools?select=id,name,slug` returned 200. `select=paystack_secret_key` and `select=*` both returned 401 `permission denied for table schools`. Selecting the full `SCHOOL_CLIENT_COLUMNS` list returned 200.

`tests/integration/sherivs-002-admission-insert.local.sql`: ALL PASS.
- A pending application to an active school is allowed.
- Pre-set `status='accepted'` is denied.
- A reviewer-owned field is denied.
- An application to an inactive school is denied.

Unit tests: the same 6 failing files as on the parent branch (`domain-runtime-recertification`, `mh-15-launch-criteria`, 4 `mobile-*` tsconfig transform errors). Everything else passes, 9007 tests in total. `tsc`: 1 error, which was already there before this change.

## Fixes

1. **`20261020000010_sherivs_002_schools_secret_column_privilege.sql`** — `REVOKE SELECT ON public.schools FROM anon, authenticated`, then a column-level `GRANT SELECT (every column except paystack_secret_key)`, generated in a `DO` block from `information_schema.columns`. Why: the earlier `20260819000000` issued `REVOKE SELECT (paystack_secret_key)`, which is a no-op while a table-level SELECT grant exists. RLS policies and UPDATE grants are unchanged. Not applied outside the local disposable stack. **New `schools` columns must be granted explicitly** (and appended to `frontend/src/lib/school-columns.ts`).
   - Client impact: with column grants `select("*")` on `schools` fails with `42501` for browser clients. Audit of `frontend/src` and `mobile/src` (every `from("schools")` call):
     - `select("*")` by a browser client — **changed to the explicit `SCHOOL_CLIENT_COLUMNS` list** (`frontend/src/lib/school-columns.ts`): `contexts/app-context.tsx` (own-school and public slug lookups) and `routes/_authenticated/admin/settings.tsx` (initial load and post-save reload).
     - Explicit column lists (unaffected): `admin/hr.tsx`, `super-admin/schools.tsx`, `billing.tsx`, `dashboard.tsx`, `admissions.tsx`, `sitemap[.]xml.ts`, `manifest[.]webmanifest.ts`, `mobile/src/api/auth.client.ts`.
     - Writes without `RETURNING` (unaffected): `admin/features.tsx`, `super-admin/billing.tsx`, `school-settings.functions.ts`.
     - `supabaseAdmin` (service role, unaffected): `provisioning.functions.ts`, `demo-provision.functions.ts`.
     - Embeds `schools:school_id(name)` (support/dashboard) select a granted column.
     - No client code reads `paystack_secret_key`; `api-keys.tsx` uses `school_api_keys.paystack_secret_key_encrypted` (a different table).
2. **`20261020000020_sherivs_002_cg_idempotency_record_enable_rls.sql`** — `ALTER TABLE public.cg_idempotency_record ENABLE ROW LEVEL SECURITY`. `20261003000017` set `FORCE` and created three tenant policies but never `ENABLE`d RLS, so `authenticated` (SELECT/INSERT/UPDATE) bypassed them. Dependency check: `cg_prune_expired_idempotency_records` is `SECURITY DEFINER`, owned by the migration owner `postgres` (BYPASSRLS), executable by `service_role` only; neither depends on RLS being off. `frontend/src/lib/command/idempotency-store.db.ts` goes through the policy-gated path.

3. **`20261020000030_sherivs_002_admission_insert_check.sql`** replaces the `WITH CHECK (true)` public INSERT policy on `admission_applications`. Anyone can still apply to any **active** school, but only as `status = 'pending'`, with the interview, decision and AI-review fields NULL. Why: `true` let a client create pre-accepted applications or applications for inactive schools. The public form (`routes/admissions.tsx`) sends none of those fields, so it is unaffected.

## Harness changes (run 2)

- Victim (B) rows seed every `is_published` / `is_active` / `published` / `is_public` flag FALSE; a second B row with the flag TRUE is seeded for the by-design public tables and recorded as `PUBLIC_BY_DESIGN`. `schools` stays active for B; `schools` SELECT, `admission_applications` INSERT and `school-media` anon SELECT are classified `PUBLIC_BY_DESIGN`.
- **Column-secret check**: text/bytea/json columns matching `secret|password|private_key|api_key|service_key|token` that anon/authenticated can SELECT, while a B row was visible to that role, are LEAK `secret column readable cross-tenant`; own-tenant readability by authenticated is INFO. Allowlist: `paystack_public_key` (public key) and `push_token` (per-device handle; cross-user visibility is already caught by the table sweep). QR/credential tokens are deliberately **not** allowlisted (bearer credentials; they fail only if a B row is visible cross-tenant). Numeric columns such as `tokens_in` are ignored by type.
- **SKIPPED cg_ tables (11)**: per-table overrides from the migrations' CHECKs — hex-64 `event_digest`/`digest`/`payload_digest`; `sha256:`+64 hex `snapshot_id` = `id` (deterministic from tenant) and `output_digest`; CoreObject envelope (`schema_version 1.0`, `status active`, pinned `object_type`, atomic fields, `declared_origin` causation root); `valid_from` for known bitemporal validity; `id = tool_id`; `content_ref = <tenant>/document/sv2.txt`; status/external_effect/outcome enums and the reconciliation outcome law. `cg_idempotency_record` is covered with a live B row plus an **expired** B row (weakest case for the replace-expired UPDATE policy). Target 0 SKIPPED; the script prints the SKIPPED count and any remaining reason. This was authored without executing it (no DB access); confirm 0 on re-run.
- Anon sweep + all 7 roles must run (run fails on `COVERAGE` otherwise). `cg_` tenant mapping is verified: each seeded user must resolve to its school id via `get_my_tenant_id()` (`cg_role_assignment.tenant_ref`), anon to NULL, and `cg_tenant` must hold both schools; otherwise the run fails as inconclusive.

## By-design public exposure (not fixed)

Published public-website content is intentionally readable by anyone: the eight `is_published = true` tables, `school_sports` (anon, `is_active = true`), the active `schools` row (minus secret columns after fix 1), public `admission_applications` INSERT (anon applies to any school), and the `school-media` bucket public read for website media. Unpublished/inactive rows are verified hidden by the harness's flag-FALSE victim rows.

## Residual risks

- **`school-media` public read**: the bucket-wide anon SELECT exposes every object in every tenant's folder to anyone who can guess or enumerate a path (not only published website media). Not changed; follow-up: path/`is_published`-scoped policy or signed URLs.
- **`admission_applications` intra-tenant exposure (not cross-tenant; out of scope, not fixed)**: the SELECT and UPDATE policies "school admins read/update applications" check only `school_id = get_my_school_id()` and do **not** call `is_school_admin()`. Any authenticated member of a school, including students and parents, can therefore read every applicant's child PII for that school and change application status. Follow-up: add `AND is_school_admin()` (SHERIVS-003 candidate). Public INSERT also has no rate limiting.
- **Security-definer RPCs**: 23 SECURITY DEFINER functions were inventoried. Zero-argument and single-uuid functions were called as school-A users with school-B ids, and none returned B data. Multi-argument RPCs (`assign_role`, `upsert_org_profile` and similar) were inventoried but not fuzzed. `public_teachers(_slug)` and `public_school_stats(_slug)` are anon-executable by design.
- **Two tenant models (section 1)** are not reconciled. That is a design task, not a leak fix.
- **46 RLS-on-zero-policy tables** are deny-all to client roles; only service-role/definer paths work. Safe by default; any future client feature needs an explicit policy.
- Column-level SELECT grants on `schools` shift maintenance: new columns are invisible to clients until granted.

## SHERIVS-002 step 2 — admissions PII and school-media privacy

Version-target classification: **V1** (organizational capability envelope). Verified only on a local disposable loopback stack (`supabase db reset --local` replaying 74 migrations, plus the identity freeze `.sql.proposed`).

**Migration** `20261020000040_sherivs_002_admissions_and_media_privacy.sql` (rollback in `database/supabase/rollbacks/`):

1. `public.can_manage_admissions()` — `SECURITY DEFINER STABLE`, `search_path=public`, executable by `authenticated` only. True iff the caller's `users` row is active and (role `admin`/`principal`, or an active, not-ended `cg_workforce_position` with `runtime_ref='runtime:scholar'`, `kind_code='registrar'`, `tenant_ref = school_id::text`, `identity_ref = auth.uid()::text`).
2. `admission_applications` SELECT/UPDATE policies now require `(school_id = get_my_school_id() AND can_manage_admissions()) OR is_super_admin()`. The public pending-only INSERT (`20261020000030`) is unchanged; there is no DELETE policy or grant.
3. Storage: `"school-media public read"` (anon) dropped; own-school read/insert/update/delete kept. `"admins read student documents"` now needs `is_super_admin()` or (school folder match AND `can_manage_admissions()`).

**Website images**: `ImageUploadField` (`frontend/src/components/admin/crud-list.tsx`) stores 10-year signed URLs, which are validated by the storage API token and not by RLS, so existing images keep rendering. No frontend/mobile code uses `getPublicUrl` or `storage/v1/object/public` for `school-media`, so no public bucket was created and no code path changed.

**Frontend**: `/admin/*` is wrapped in `RoleGuard allow={["admin","principal"]}`; `admin/admissions.tsx` reads/updates through the browser client, so RLS is the enforcement. No server function reads `admission_applications` (only `demo-provision.functions.ts` uses `supabaseAdmin`, and it does not touch that table). A registrar (non-admin role) is permitted by RLS but has no UI route; exposing one is a follow-up, not V1 scope here.

**Harness additions** (`tests/integration/sherivs-002-cross-tenant.local.sql`, final `NO LEAKS`/`LEAKS FOUND` contract kept):
- Intra-school admissions: teacher/parent/student/driver/bursar plus ended, expired and foreign-tenant registrar positions must see 0 rows and update 0 (else LEAK `intra-school admissions`); admin, principal and an active registrar must see ≥1 and update (else ERROR `admissions admin broken`); none may touch school B.
- Storage: anon read of a `school-media` A object must be 0 (LEAK otherwise; no longer PUBLIC_BY_DESIGN); own-school members still read it; `student-documents` is readable only by A admin/principal/registrar.
- Multi-arg SECURITY DEFINER fuzz: every public definer function with a uuid/text arg named like `p_tenant`/`_school_id`/`p_identity`/`p_assignment_id`/`p_grant_id`/`p_position_id`/`_slug` is called as each A actor with B's ids; exception = PASS, rows/`true`/B-state change (digest of every tenant-keyed table, rolled back in a subtransaction) = LEAK. `public_teachers`/`public_school_stats` are PUBLIC_BY_DESIGN; `seed_default_staff_types(B)` is expected to LEAK (no caller check, `GRANT EXECUTE ... authenticated`) until fixed in a follow-up.

**Results:** sweep exit 0, `NO LEAKS`.
- Counts: PASS 4789, LEAK 0, ERROR 0, SKIPPED 0, PUBLIC_BY_DESIGN 83, INFO 1048.
- Coverage: 15 multi-argument SECURITY DEFINER functions fuzzed as each school-A role and the registrar. The admissions, registrar and storage sections all ran.
- `sherivs-002-admission-insert.local.sql`: ALL PASS.

**Fix 5: `20261020000050_sherivs_002_seed_staff_types_guard.sql`.** The fuzz found a real leak. `seed_default_staff_types(_school_id)` had no caller check, and EXECUTE was granted to anon and authenticated, so anyone could write the 38 default staff types into any school. As a school-A teacher, it wrote 38 rows into school B. Now only `service_role`, a super admin, or an active admin or principal of that same school may call it (others get 42501), and anon EXECUTE is revoked. The negative control is that run 8, made before this migration, reported LEAK for 8 actors.

**Harness fix:** the first fuzz version scored SQL syntax errors (42601) as PASS and skipped 6 functions. The fuzz now builds typed arguments, only counts authorization errors as PASS, counts any other exception as ERROR, and requires at least 14 functions fuzzed.

**PostgREST checks on the local stack:**
- Admissions: anon submission returned 201. The admin read 1 application and could change its status. A teacher and a parent read 0 and changed 0 rows; the status stayed `pending`.
- `school-media`: anon with a signed URL got 200. Anon without a token was rejected (400). A parent of the same school got 200.

The earlier "school-media public read" and "admission_applications intra-tenant exposure" residual risks above are resolved by this step.
