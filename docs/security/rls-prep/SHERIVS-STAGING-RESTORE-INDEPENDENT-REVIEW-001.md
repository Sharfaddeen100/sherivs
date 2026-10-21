# SHERIVS-STAGING-RESTORE-INDEPENDENT-REVIEW-001

**Mission ID:** SHERIVS-STAGING-RESTORE-INDEPENDENT-REVIEW-001
**Mission class:** INDEPENDENT REVIEW — NO DATABASE CHANGES
**Version target:** ACTIVE-V1 ONLY
**Timestamp (UTC):** 2026-10-14T19:57:51Z
**Role:** Independent Principal Database Security Architect / Production Change-Control Reviewer

**Final status:** **B. PASS WITH CONDITIONS — NAMED BLOCKERS REMAIN**

This review assesses whether the finalized Sherivs staging schema
restoration **plan** is sufficiently safe and complete to support a later,
explicitly authorized staging-only migration application.

This document **does not authorize execution**. It does **not** restore
staging. It does **not** apply migrations. It does **not** close
SHERIVS-001, SHERIVS-002, or SHERIVS-003. A later PASS from this review
would still not be permission to mutate any database.

---

## 0. Reviewer independence and non-contact

This review was performed on a fresh inspection of Git objects and of the
three named plan documents. It does **not** reuse those documents as proof
of live database state. Claims are labeled:

| Label | Meaning |
|-------|---------|
| **Repository evidence** | Re-measured in this mission from Git objects, file bytes, or script source |
| **Prior-report claim** | Taken from PREP / TRANSPORT / FINALIZE / GATE4 / environment-separation artifacts; not re-proven here |
| **Inference** | Reviewer conclusion from repository evidence |
| **Recommendation** | Required later work; not an authorization |

- **No database was opened.** No Postgres session, pooler session, or
  Supabase Management API query ran.
- **No SQL or migration was executed** against any server. File-pinning
  unit tests (below) read repository files only.
- **Production (`nwrflbpbhyiqdptmlccm`) was not used** as a target,
  fallback, or credential source.
- **Staging (`dvxszhracsjwdancijdc`) was unchanged.**
- **No `.sql.proposed` file was copied or applied.**
- **No migration file and no application code was modified.**
- **No environment variable or secret was changed.** Values were not
  printed.
- **No deploy, merge, or restore publish occurred.**
- **This review does not authorize a later apply.**

The only intended working-tree change in this mission is this file.

File-pinning tests executed (no database contact):

```
npx vitest run tests/unit/td-041-transport-bus-reads.test.ts \
  tests/unit/mh-03-transport-rls.test.ts \
  tests/unit/mh-06-apply-marshal.test.ts
→ 3 files, 61 tests, all passed.
```

---

## 1. Inputs inspected

### 1.1 Authoritative application source (Git)

| Item | Independently measured value |
|------|------------------------------|
| Authoritative commit | `d195ba861f80379b79533126653b9cee82a8e872` |
| `origin/master` at inspection | **equal** to `d195ba8` |
| Subject | `Merge pull request #9 from vibeoraai-bit/cursor/v1-production-host-routing-5cb8` |
| Canonical directory | `database/supabase/migrations/` |
| Full tree hash | `bbd828951e166662bbe831fd74972e1a15488468` |
| File count | **71** `.sql` files |
| Timestamp-prefix collisions | **none** (71 unique `YYYYMMDDHHMMSS` tokens) |
| Other `**/migrations/` paths at `d195ba8` | **none** |
| Rollback companions | `database/supabase/rollbacks/` — **31** files (not an apply path) |
| CLI `project_id` | `database/supabase/config.toml` = `nwrflbpbhyiqdptmlccm` (**production**) |

Default branch `coregrid-scholar-migration` HEAD during this review:
`857d4fee1ccc9d11b3c4a34f1142ff6a0da1f7fe`. Its migration tree is
`a104d5e34f0f4020ffe0d6e36b97cc444459c3f2` (**69** files). It is **not**
the restore source.

Files in the 71-file tree and absent from the 69-file default branch
(repository evidence):

- `20261008000050_coregrid_organization_memberships.sql`
- `20261008000060_organization_onboarding.sql`

No files exist on the default branch that are absent from the 71-file tree.

### 1.2 Plan documents (Git artifacts; not modified)

These files are **not** on `origin/master`. They were read from draft
report branches. They are **security-preparation artifacts**, not a second
application source.

| Report | Git location | Role |
|--------|--------------|------|
| Restore prep | `origin/cursor/sherivs-staging-schema-restore-prep-caab` commit `615fe53f871809c69f89d60ee337dc860b1613b2` — `docs/security/rls-prep/SHERIVS-STAGING-SCHEMA-RESTORE-PREP-001.md` (PR #18) | Prior plan; status **B** pending transport pair |
| Transport review | `origin/cursor/sherivs-transport-migration-review-1f50` commit `3907f43421fd79991ea0e9718401b6345346bb83` — `docs/security/rls-prep/SHERIVS-TRANSPORT-MIGRATION-REVIEW-001.md` (PR #19) | OPTION A recommendation |
| Finalize | `origin/cursor/sherivs-staging-schema-restore-finalize-517e` commit `0986eea240c9cfe331b69bf873260d2b9d56ad15` — `docs/security/rls-prep/SHERIVS-STAGING-SCHEMA-RESTORE-FINALIZE-001.md` (PR #20) | Finalized 71-file plan + OPTION A accepted |
| Catalog baseline | `origin/cursor/sherivs-rls-gate4-catalog-baseline-caab` commit `83ae504ab51c5e0781baf33efee42fdee033bf66` — `docs/security/rls-prep/GATE4-CATALOG-BASELINE-001.md` (PR #16) | **Historical** empty-staging catalog (2026-10-14T18:34:55Z) — **not rechecked** |

Migration tree at `d195ba8`, at `83ae504`, and at PREP commit `615fe53` is
the same object `bbd828951e166662bbe831fd74972e1a15488468`. The TRANSPORT
and FINALIZE report commits sit on the default-branch 69-file tree
`a104d5e…`; that does **not** change the restore source. Transport-pair
blobs are identical on both trees (see §4).

---

## 2. A — Source integrity

**Classification:** **PASS**

The finalized plan identifies the exact authoritative commit, the exact
full migration tree hash, all 71 files in lexicographic order, the two
transport migrations in the correct order, and the two files missing from
the default 69-file working tree.

### 2.1 Independently re-measured (repository evidence)

`git rev-parse d195ba861f80379b79533126653b9cee82a8e872:database/supabase/migrations/`
= `bbd828951e166662bbe831fd74972e1a15488468`.

FINALIZE §4 lists 71 filenames numbered 1–71. That list **matches**
`git ls-tree --name-only` at `d195ba8` **1:1** in lexicographic order.

Transport pair (bytes at `d195ba8`):

| Seq | Filename | sha256 | git blob |
|----:|----------|--------|----------|
| 59 | `20261002000014_coregrid_v2_transport_buses_rls.sql` | `a1e3bcc3b0f1436de6c49d4ccd601cd894fdd10bdae5f25d692b02f37be83517` | `74e4a1860f1b78403f57f8e3650109dd0086abd6` |
| 69 | `20261003000041_coregrid_transport_bus_reads.sql` | `9a1e0194dcfebde50e031c63fd3701b9b6c7cbed712f9968c646bd83976ab3cf` | `ebf648c583843e3172e8c99f0a94150035f0d599` |

These match FINALIZE §3.1 and TRANSPORT §2.

### 2.2 Full 71-file content-hash manifest (repository evidence)

Measured in this mission from
`git show d195ba8:database/supabase/migrations/<file> | sha256sum`.
The complete 71-row table is **Appendix A**. A later runner **must**
refuse to start unless all 71 hashes match that appendix. The Git tree
object `bbd828951e166662bbe831fd74972e1a15488468` is the directory-level
equivalent; per-file sha256s are required when files are copied out of
Git.

### 2.3 Claims taken from prior reports (not re-proven as live facts)

- Staging emptiness, PostgreSQL 17.11, absent `supabase_migrations`,
  vendor default ACLs, `ensure_rls` event trigger, and IPv6/pooler
  reachability: **GATE4-CATALOG-BASELINE-001**, timestamp
  2026-10-14T18:34:55Z. **NOT VERIFIED** live in this mission.
- Historical operator-VM `DATABASE_URL` pointing at production:
  environment-separation audit (PR #17). Script source proves the
  **hazard** (unprefixed URL, no validation). Whether a given operator
  environment currently holds a production URL was **not** inspected
  (secrets not read).

### 2.4 Source-safety conclusion

**Inference:** there is no source conflict between `origin/master` @
`d195ba8` and the plan documents’ cited tree. Status is not **C** on
source grounds. Do **not** treat draft report branches, or the default
69-file branch, as the application source.

---

## 3. B — Migration safety

**Classification:** **PASS WITH CONDITIONS**

The finalized plan’s static inventory is adequate as a **plan**. Several
effects cannot be established without a live staging catalog. Those gaps
are execution blockers, not a reason to reject OPTION A or the 71-file
membership.

### 3.1 Independently confirmed from SQL text at `d195ba8`

| Topic | Repository evidence |
|-------|---------------------|
| `CREATE EXTENSION` | **none** in the 71 files |
| Statement-start `DROP TABLE` / `TRUNCATE` / `DROP SCHEMA` / `DROP DATABASE` | **none** |
| `ALTER DEFAULT PRIVILEGES` as SQL | **none** (comment only in `#63`) |
| Production ref `nwrflbpbhyiqdptmlccm` after `--` / `/* */` strip | **none** (9 files, comments/headers only) |
| Unique `CREATE TABLE` names | **121** (matches FINALIZE) |
| Unique table names created without `IF NOT EXISTS` | **33** — not re-runnable |
| `DROP POLICY` | all observed uses have `IF EXISTS` |
| `CREATE POLICY` | **130** occurrences; **`IF NOT EXISTS` = 0** — none of these policies are re-runnable |
| `FORCE ROW LEVEL SECURITY` files | `#58`, `#60`, `#61`, `#62`, `#69`, `#70` (matches FINALIZE) |
| Session-level GUC | **one**: `#23` `SET statement_timeout = '0';` with **no RESET**. Other `^SET search_path = public` hits are `CREATE FUNCTION … SET search_path` attributes, not session GUCs |
| Line-start `BEGIN;` / `COMMIT;` / `ROLLBACK;` | **none** |
| `ALTER ROLE` / `CREATE ROLE` / granting `BYPASSRLS` | **none** as SQL (BYPASSRLS appears in comments only) |
| Apply-time catalog DML | present (`platform_config`, workforce kinds, `storage.buckets`, empty-table backfills) — not customer PII if staging is empty |

### 3.2 Plan coverage versus remaining gaps

| Required topic | Plan coverage | This review |
|----------------|---------------|-------------|
| Dependencies / filename order | FINALIZE §3.2, §4, §6; TRANSPORT §5 | **PASS.** `#18` → `#32` → `#59` → `#69`. `#70`/`#71` independent of transport. `#31` before envelope `#45`. `#41`/`#44`/`#46` before `#58`. `#62` before `#63`. Vendor: `pgcrypto` / `uuid-ossp` / `auth` / `storage` / `supabase_realtime` |
| Destructive operations | No DROP TABLE; DROP POLICY IF EXISTS; `#59` authorization-destructive | **PASS.** Companion `#59` rollback restores J-005-banned helper policies — must **not** be used as casual undo |
| Data backfills | Empty staging ⇒ 0 people/payment rows; `#23` still changes `schools.subscription_tier` DEFAULT | **PASS WITH CONDITIONS.** Live emptiness **NOT VERIFIED** |
| Session-level settings | FINALIZE flags `#23` leak on a long-lived `db-apply` client | **PASS WITH CONDITIONS.** Plan tells a future runner to **log** the leak. Mission C requires **avoiding** leakage between migrations. See §4.2 item 11 |
| Grants and RLS | Canonical restore reintroduces SHERIVS-001/002/003 | **PASS** as honesty. **Not** a secure application state |
| Extensions / prerequisites | No CREATE EXTENSION; fail if missing | **PASS** as plan. Live presence **NOT VERIFIED** |
| Partially applied migrations | Recreate staging; do not continue the list | **PASS WITH CONDITIONS.** History/resume algorithm is not designed (BLOCKER-3) |
| Idempotency | Foundation and `#69` called out | **PASS WITH CONDITIONS.** Stronger Git fact: **zero** `CREATE POLICY IF NOT EXISTS` in 130 policies; 33 tables lack `IF NOT EXISTS`. Blind rerun of a prefix **will fail** |
| Migration-history recording | Required, not designed | **BLOCKER-3** |
| Recovery after failure | Recreate project; 31 later rollbacks only; no 71-file transaction | **PASS** as honesty. Recreate operational details **NOT VERIFIED** |

### 3.3 Header hazards (repository evidence)

These comments are **not** an apply path. Operators must follow the restore
plan, not migration headers:

- `#59` header recommends `supabase db push --workdir database/supabase`.
  `config.toml` `project_id` is production. **Refuse.**
- `#69` header recommends `scripts/apply-canonical-hardening.mjs`.
  That marshal **unconditionally SKIP**s `#59` when `declared.supersededBy`
  is set (`scripts/apply-canonical-hardening.mjs` lines 279–297, 860–872),
  then would apply `#69`. On a greenfield database that still has `#32`
  policies, `#69`’s `DO` guard is expected to **fail**. **Refuse** that
  script as the empty-staging runner.

### 3.4 Missing evidence (must exist before apply)

1. Fresh read-only staging identity + emptiness catalog (GATE4 is stale).
2. Proof `pgcrypto`, `uuid-ossp`, and publication `supabase_realtime` exist
   on the actual target.
3. Proof the apply process has no unprefixed `DATABASE_URL` / `SUPABASE_URL`.
4. A staging-only runner meeting §4.2, including a designed history store.
5. Written human authorization naming the Git pin, OPTION A, and staging
   project ref.

---

## 4. C — Execution mechanism

**Classification:** **BLOCKER** (no safe runner exists today)

The plan correctly **refuses** every current apply path. That refusal is
**PASS**. Execution remains **blocked** until a dedicated staging-only
runner is built, reviewed, and authorized separately. This mission does
**not** implement that runner.

### 4.1 Current scripts — independently confirmed unsafe

`scripts/db-apply.mjs`, `scripts/apply-canonical-hardening.mjs`, and
`scripts/lib/pg-ssl.mjs` at HEAD are **byte-identical** to `d195ba8`.

| Mechanism | Repository evidence | Verdict |
|-----------|---------------------|---------|
| `scripts/db-apply.mjs` | Reads **only** `process.env.DATABASE_URL`. No staging pin, no production refusal, no harness. One long-lived `pg.Client`. One `client.query(sql)` per file. Stops on first error. **Does not** write `supabase_migrations`. Abort log uses `${files.length}` (list length), not succeeded count. Applies whatever `*.sql` is in the **working tree** (69-file trap on the default branch) | **Refuse** |
| `scripts/db-apply-one.mjs` | Same unprefixed URL | **Refuse** |
| `scripts/db-apply-mgmt.mjs` | `projectRef = argv[2] ?? "nwrflbpbhyiqdptmlccm"` | **Refuse** |
| `scripts/apply-canonical-hardening.mjs` | Production argv default; **SKIP `#59`** if `supersededBy` set; not a 71-file greenfield runner | **Refuse** |
| `scripts/apply-foundation-from-env-local.mjs` | Hard-coded production ref; can `POST /v1/projects/{prod}/restore` | **Forbidden** |
| Other `apply-*.mjs` / `db-run*.mjs` | Production defaults or arbitrary SQL | **Refuse** |
| `supabase db push --workdir database/supabase` | `config.toml` production `project_id` | **Refuse** unless CLI is proven linked to staging **and** `config.toml` cannot silently retarget production |
| `supabase db reset` | Destructive | **Forbidden** |
| `assert-not-production.mjs` | Blob `af6cadbfe4bb8f49ac60d77375f4281a27383057` on the Gate 4/PREP chain. **Absent from `d195ba8`**. Never connects. Fail-closes on production ref/host markers. Does **not** require `dvxszhracsjwdancijdc`. Does **not** refuse a set unprefixed `DATABASE_URL`. `PRODUCTION_HOST_MARKERS` includes `sherivs.com` (could false-positive a future staging custom domain) | **Necessary, not sufficient** |
| `catalog-verify.sql` | Header: Gate 5 proofs **after** proposed change sets B–G. Expects freeze helpers and absence of FOR ALL on payroll/biometrics | **Wrong tool** for post-restore of the canonical baseline |

`pgSslConfig`: default `{ rejectUnauthorized: true }`; `SHERIVS_DB_CA_CERT`
pins CA; `SHERIVS_DB_INSECURE_TLS=1` disables verification; `sslmode=disable`
disables TLS. A staging runner must refuse both escape hatches.

### 4.2 Minimum requirements for a future staging-only runner

Do **not** implement in this mission. A later engineering mission must
satisfy **all** of the following. Items 1–12 match FINALIZE §7.3 with
hardening required by this review.

1. **Pin** commit `d195ba861f80379b79533126653b9cee82a8e872` and tree
   `bbd828951e166662bbe831fd74972e1a15488468`. Verify **file count = 71**
   and **every sha256 in Appendix A**. Refuse a 69-file working tree.
2. Read connection material **only** from staging-prefixed names
   (`STAGING_DATABASE_URL` and/or `SHERIVS_RLS_STAGING_URL`).
3. **Reject** production project ref `nwrflbpbhyiqdptmlccm` in any target
   string, hostname, username, or header.
4. **Positively require** project ref `dvxszhracsjwdancijdc` in hostname
   and, if pooled, in username (`postgres.dvxszhracsjwdancijdc`).
5. Enforce strict TLS: `rejectUnauthorized: true` **and** pinned CA.
   Refuse `SHERIVS_DB_INSECURE_TLS=1` and refuse `sslmode=disable` /
   `ssl=false`.
6. **Fail closed** on missing, conflicting, or ambiguous configuration
   (no staging URL; disagreeing staging URLs; third project ref; missing
   Git pin; missing CA when required).
7. **Never** fall back to `DATABASE_URL` or `SUPABASE_URL`.
   **Refuse to start** if either is set in the apply process.
8. **Never** print credentials, tokens, or full connection strings.
   Redact passwords in evidence. Treat PostgreSQL error text as sensitive.
9. Apply migrations in **canonical filename order** (Appendix A). Include
   both transport files. Do **not** use hardening-marshal skip logic.
10. **Avoid session-setting leakage between migrations:** use a **new
    connection per file**, or `RESET ALL` (or at least `RESET
    statement_timeout`) after each file. Do not rely on logging `#23` as
    sufficient isolation.
11. **Stop on the first failure.** Do not continue the list.
12. Record **exact identities** of every successful and failed migration:
    sequence number, filename, sha256, start/end UTC, outcome. The abort
    summary must use **succeeded count**, not list length (do not repeat
    the `db-apply.mjs` bug).
13. Maintain a **designed** staging-only history mechanism (table or
    equivalent) that records those identities **after** a file succeeds
    and **before** the next file starts. Do not claim
    `supabase_migrations` exists unless the runner wrote it. CLI history
    is acceptable only after the CLI is proven linked to staging and
    cannot use production `config.toml`.
14. **Do not blindly rerun** a partial prefix. If Scholar objects exist
    and history is missing, incomplete, or hash-mismatched, **abort**.
    Recovery is recreate-staging (or a verified snapshot), then a new
    authorized run — not “retry from file N” unless history proves files
    1..N-1 with matching hashes **and** a human re-authorizes resume
    (resume is a new change-control event; default is recreate).
15. Do not apply `*.sql.proposed`. Do not apply
    `database/supabase/rollbacks/`. Do not call
    `create_organization_with_founder`. Do not copy production data.
16. Preserve evidence for post-restore review: Git pin, tree hash, per-file
    identities, redacted target identity, harness results, TLS posture,
    stop reason if any.
17. Human written authorization artifact must be present **before** the
    first mutating connection.

Until that runner exists and is itself independently reviewed, restore
execution stays blocked even though the **plan membership** is acceptable.

---

## 5. D — Transport pair

**Classification:** **PASS**

Both migrations remain included in the approved plan, in canonical
filename order, and neither is omitted.

| Seq | Filename | Plan status |
|----:|----------|-------------|
| 59 | `20261002000014_coregrid_v2_transport_buses_rls.sql` | **INCLUDED** (OPTION A first half) |
| 69 | `20261003000041_coregrid_transport_bus_reads.sql` | **INCLUDED** (OPTION A second half) |

**Repository evidence that skip-one is invalid:**

- `#69` `GRANT SELECT` does not revoke leftover INSERT/UPDATE/DELETE.
  Only `#59` `REVOKE ALL` produces the SELECT-only grant set `#69`’s
  `DO` guard requires.
- `#69` `CREATE POLICY` has no `IF NOT EXISTS`. `#69` guard requires
  exactly one named SELECT policy. After `#32`, four policies remain
  unless `#59` dropped them.
- Marshal `supersededBy` is a **re-apply** skip, not a greenfield skip.

**No new contradictory repository evidence** was found that would reopen
OPTION A. This review **does not** change that plan decision.

V2 in the `#59` filename is a Git naming artifact on V1 Scholar table
`public.transport_buses`. Including the file is **not** an un-freeze of
V2 device/IoT (AGENTS.md §45).

After OPTION A, parent tracking, admin fleet DML, and driver GPS/status
**writes** remain denied. That is T-D remaining work, not a restore defect
relative to `d195ba8`.

---

## 6. E — Security boundaries

**Classification:** **PASS**

| Boundary | Evidence |
|----------|----------|
| Proposed remediation SQL excluded | FINALIZE §9.1 lists nine `*.sql.proposed` files as **NO**. `d195ba8` migrations directory contains **zero** `proposed` names. `db-apply.mjs` globs only `database/supabase/migrations/*.sql` |
| SHERIVS-001 **OPEN** | FINALIZE §9.2; foundation `#1` still authors `users` self-update / admin FOR ALL identity writability. This review does **not** declare it resolved |
| SHERIVS-002 **OPEN** | Broad authenticated DML and remaining `tenant_all_*` / FOR ALL remain in canonical SQL |
| SHERIVS-003 **OPEN** | Sensitive `users` columns, `staff_payroll`, `teacher_biometrics` remain in canonical SQL |
| Restore ≠ secure application state | FINALIZE §0, §9.2, §14. Canonical restore **reintroduces** the insecure Scholar defaults. Remediation is a later, separately authorized staging mission after post-restore catalog |

`catalog-verify.sql` expecting freeze helpers / no `tenant_all_%` would
**fail** a correct canonical restore. Using it as a restore pass/fail
would pressure operators to apply proposed SQL early. **Forbidden.**

---

## 7. F — Change control

**Classification:** **PASS WITH CONDITIONS**

### 7.1 Still requiring human approval (not granted by this review)

1. Target = staging project `dvxszhracsjwdancijdc` only.
2. Git pin = `d195ba8` / tree `bbd82895…` / Appendix A hashes.
3. OPTION A: both transport files; omit neither.
4. Acceptance that SHERIVS-001 / 002 / 003 defaults will exist on staging
   until a later remediation mission.
5. Acceptance that parent/admin/driver-**write** bus surfaces will deny
   after `#69`.
6. Use of a **new** staging-only runner meeting §4.2 — not `db-apply.mjs`,
   not mgmt/hardening/foundation scripts, not CLI with production
   `config.toml`.
7. Fresh preflight passed (identity, TLS, emptiness or an explicit
   documented drift decision).
8. Recovery = recreate staging (or a later verified snapshot). No claimed
   71-file transactional rollback.
9. No production data copy. No `.sql.proposed` in the same mission.
10. Independent post-restore catalog mission scheduled; restore is not
    self-certifying.
11. Independent review of the **runner implementation** (this document
    reviews the plan only).

Draft PRs #18 / #19 / #20 are **not** an approval record. They are
unmerged documentation.

### 7.2 Evidence that must be captured **before** applying migrations

Record without secrets:

- Written authorization artifact (who, when, scope).
- Git commit + full tree hash + Appendix A verification result.
- Runner identity (path, version/commit).
- Staging project ref, hostname with password stripped, pooler vs direct.
- `sb-project-ref` header if Auth health is used.
- Harness exit code **and** positive staging-ref check result.
- TLS: `rejectUnauthorized` true; CA present yes/no (not the PEM).
- Confirmation unprefixed `DATABASE_URL` / `SUPABASE_URL` were unset or
  the process refused to start.
- Read-only emptiness / extension / `supabase_realtime` catalog summary.
- Decision if staging was **not** empty (must be abort unless a new
  human decision exists).

### 7.3 Conditions that must abort the restore

Stop and do not continue if any of:

- Preflight / harness ≠ success, or staging ref not positively proven.
- Production ref present in any target.
- Unprefixed `DATABASE_URL` / `SUPABASE_URL` would be used or is set.
- Git tree ≠ `bbd828951e166662bbe831fd74972e1a15488468`, or any Appendix A
  hash mismatches, or count ≠ 71, or `#70`/`#71` or the transport pair
  would be omitted.
- Unexpected Scholar objects (unless a separate resume authorization
  exists — default is abort).
- Missing `pgcrypto` / `uuid-ossp` / `supabase_realtime`.
- Any file FAILs.
- Operator abort.
- Any path would open production.
- Attempt to include `*.sql.proposed` or rollbacks, or to call the
  founder RPC, or to use `apply-canonical-hardening.mjs` as the 71-file
  runner, or to `supabase db reset`, or to unpause/restore production via
  Management API.
- Insecure TLS flags present.

### 7.4 Partial failure handling

**Required:** stop; do not continue; do not apply proposed SQL; do not
run rollback SQL as an improvisation (`#59` rollback is a security
regression). Preserve the apply log with exact identities.

**Default recovery:** recreate the staging project after a new
authorization and a new preflight. Do **not** dump production into the
new project.

**Resume from file N** is **not** the default. It would require (a)
history proving 1..N-1 with matching hashes, (b) catalog consistent with
that prefix, (c) a new human authorization. Otherwise recreate.

### 7.5 Catalog evidence required **after** restoration

Separately authorized staging-only **read-only** catalog. Do **not** use
`catalog-verify.sql` as the baseline pass/fail.

Must include:

1. Re-prove staging identity (ref, hostname, TLS).
2. Count `public` tables/views/indexes versus Git-created names (~121
   tables).
3. `to_regclass` for `users`, `schools`, `organization_memberships`,
   `students`, `fees`, `staff_payroll`, `teacher_biometrics`,
   `transport_buses`, and a `cg_*` sample.
4. `pg_policy` on `users`, `fees`, `staff_payroll`,
   `teacher_biometrics`, `transport_buses`, `organization_memberships`.
5. Transport **must** match OPTION A: FORCE on; exactly one policy
   `transport_buses_select_driver_assigned`; authenticated SELECT-only;
   no `#32` four-policy set.
6. Helpers: `is_super_admin` SECURITY DEFINER (`#65`);
   `create_organization_with_founder` present and **uncalled**.
7. `storage.buckets` contains `school-media`; do not dump
   `storage.objects`.
8. `platform_config` keys `subscription_tiers_pricing`,
   `per_student_fees`.
9. Document that authenticated DML on foundation tables **is present**
   (do not “fix”).
10. History table contents **or** documented absence if the runner did
    not write CLI history.
11. No PII payload SELECTs (`users.nin`, salary, face templates).
12. Do **not** claim production parity. Do **not** claim SHERIVS-001/002/003
    closed.

### 7.6 What must be independently reviewed before RLS remediation

- Post-restore catalog evidence (§7.5).
- That proposed SQL remains outside `database/supabase/migrations/`.
- Gate 3 eligibility (proposed `00070` still blocked until Paystack
  companion; proposed `00090` ineligible until founder+DEFINER staging
  exists **after** restore) — **prior-report claim**, not re-adjudicated
  here.
- A staging-only remediation runner with the same isolation rules as
  §4.2.
- Explicit human authorization distinct from schema-restore
  authorization.

---

## 8. Issue classification summary

| ID | Issue | Classification | Evidence class |
|----|-------|----------------|----------------|
| A1 | Authoritative commit `d195ba8` identified | **PASS** | Repository |
| A2 | Full tree hash `bbd82895…` identified | **PASS** | Repository |
| A3 | All 71 files listed; order matches Git | **PASS** | Repository |
| A4 | Transport pair in order `#59` then `#69` | **PASS** | Repository |
| A5 | Memberships `#70` and onboarding `#71` identified as default-branch omissions | **PASS** | Repository |
| B1 | Dependencies / destructive SQL / no DROP TABLE | **PASS** | Repository |
| B2 | Data backfills on empty staging | **PASS WITH CONDITIONS** | Inference; emptiness prior-report |
| B3 | Session GUC `#23` | **PASS WITH CONDITIONS** | Repository; runner must isolate |
| B4 | Grants/RLS honesty (findings remain OPEN) | **PASS** | Repository |
| B5 | Extensions / vendor publication | **PASS WITH CONDITIONS** | Plan OK; live **NOT VERIFIED** |
| B6 | Partial-apply / idempotency / history | **BLOCKER** (execution) | Repository: no history writer; 0/130 policies idempotent |
| B7 | Recovery = recreate | **PASS WITH CONDITIONS** | Plan honesty; ops **NOT VERIFIED** |
| C1 | Current runners unsafe | **PASS** (plan refuses them) | Repository |
| C2 | Dedicated staging-only runner | **BLOCKER** | Repository: does not exist |
| C3 | Plan’s runner requirements vs mission C | **PASS WITH CONDITIONS** | Plan omits per-file new-session/RESET and a designed history schema; this review supplies the minimum in §4.2 |
| D1 | OPTION A retained | **PASS** | Repository; no contradictory evidence |
| E1 | Proposed SQL excluded | **PASS** | Repository |
| E2 | SHERIVS-001/002/003 remain OPEN | **PASS** | Plan + canonical SQL |
| E3 | Restore ≠ secure state | **PASS** | Plan + canonical SQL |
| F1 | Human approval still required | **PASS** | Change control |
| F2 | Fresh staging catalog | **NOT VERIFIED** / **BLOCKER** (execution) | Prior-report only |
| F3 | Operator env currently holding production `DATABASE_URL` | **NOT VERIFIED** | Secrets not read; script hazard is proven |

Live staging catalog, live production applied-subset, IPv6/pooler
reachability, vendor `ensure_rls` runtime, and default-ACL residue after
each file are **NOT VERIFIED** in this mission (by design: no database
contact).

---

## 9. Named blockers (execution)

These keep **restore execution** blocked. They do **not** reopen OPTION A
or the 71-file membership.

1. **BLOCKER-1 — No staging-only 71-file runner.** Existing `db-apply.mjs`
   uses unprefixed `DATABASE_URL`, does not validate staging vs
   production, does not record history, keeps one session ( `#23`
   `statement_timeout=0` leaks), and mis-reports abort count. Hardening
   marshal skips `#59` and would fail `#69` on empty staging. Management
   API / foundation scripts default to production. CLI `config.toml` is
   production.
2. **BLOCKER-2 — Fresh staging preflight has not been performed.** GATE4
   emptiness is historical (2026-10-14T18:34:55Z). This review did not
   open staging. Apply without a new identity + emptiness catalog is
   unsafe.
3. **BLOCKER-3 — Migration-history mechanism is required but not
   designed.** Partial failure has no reliable resume. Blind rerun will
   fail on non-idempotent `CREATE TABLE` / `CREATE POLICY`. Default
   recovery (recreate) is acceptable only if the runner **refuses**
   resume without matching history.
4. **BLOCKER-4 — Session isolation between migrations is not specified
   strongly enough in FINALIZE §7.3.11.** Logging `#23` is insufficient.
   The runner must use a new connection per file or `RESET` session GUCs.
5. **BLOCKER-5 — No written human authorization** naming target, Git pin,
   OPTION A, runner, and acceptance of OPEN findings.
6. **BLOCKER-6 — Production-refusal harness is necessary but not
   sufficient**, and is **absent from `d195ba8`**. It does not positively
   pin `dvxszhracsjwdancijdc` and does not refuse a set unprefixed
   `DATABASE_URL`.

None of these is resolved by this review.

---

## 10. Version-target classification

**ACTIVE-V1 ONLY.**

This review inspects V1 Scholar schema and V1 `cg_*` substrate files that
already sit on `origin/master`. It does **not** implement V2 device/IoT or
V3 Reality Intelligence. Including the V2-**named** transport file is
authorization-posture restore of a V1 Scholar table already present on
`origin/master`. Including `cg_hermes_observation` is inclusion of a V1
tree file, not a V3 un-freeze.

---

## 11. Explicit confirmation

- Authoritative source `origin/master` @ `d195ba861f80379b79533126653b9cee82a8e872` re-verified.
- Full migration tree hash `bbd828951e166662bbe831fd74972e1a15488468` re-verified.
- Exact migration count **71** re-verified; FINALIZE sequence matches Git; no timestamp collisions.
- OPTION A retained: `20261002000014` (#59) and `20261003000041` (#69) both included in filename order; neither omitted.
- Default branch remains a **69-file** trap (`#70` / `#71` missing).
- No database was opened.
- No SQL was executed against any server.
- No migration was applied.
- Production and staging were unchanged.
- Canonical migration files were not modified.
- Application code was not modified.
- Proposed SQL was not applied.
- SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain **OPEN**.
- Staging schema has **not** been restored.
- This review is **not** permission to execute.
- Only a later explicit authorization may permit database changes, and
  only after BLOCKER-1 through BLOCKER-6 are closed.

---

## 12. Agent report

**Implemented:** independent readiness review of the finalized staging
schema restoration plan (document only).

**Files changed:** `docs/security/rls-prep/SHERIVS-STAGING-RESTORE-INDEPENDENT-REVIEW-001.md`

**Architecture impact:** none to running systems. Documents that the
71-file `d195ba8` plan with OPTION A is source-complete, that current
apply scripts are unsafe, and that canonical restore reintroduces OPEN
RLS findings.

**Tests:** Git tree/hash/count/order re-measure; sha256 of all 71 files;
offline statement scans; script source review; 61 file-pinning unit tests
passed. No database tests. No apply. No mutation scripts executed.

**Security validation:** production and staging non-contact; proposed SQL
excluded; findings left OPEN; no credentials printed; no automatic
authorization.

**Known risks:** stale staging catalog; no safe runner; session GUC leak
on current `db-apply.mjs`; 69-file working-tree trap; Git apply-status
comments unverified live; `#59` rollback is a security regression if
misused.

**Remaining work:** staging-only runner meeting §4.2; independent review
of that runner; fresh staging preflight; written apply authorization;
then a **separate** mutating restore mission; then post-restore catalog;
then (later) eligible proposed SQL.

**Final status:** **B. PASS WITH CONDITIONS — NAMED BLOCKERS REMAIN**

---

## Appendix A — Canonical 71-file sha256 manifest

Source: `git show d195ba861f80379b79533126653b9cee82a8e872:database/supabase/migrations/<file> | sha256sum`
Order: lexicographic filename order (same as `scripts/db-apply.mjs` `.sort()`).

| # | sha256 | Filename |
|--:|--------|----------|
| 1 | `87ce504f1566732100d8ddcc4f70165dc5576003d955c1000246c692a6115c54` | `20260620122048_50e590c2-5911-4c98-8931-fb46a4b509f3.sql` |
| 2 | `d9f944b2f903ab2c3802ecbfa1bacf0380daa015945caeceb9ef62501952525e` | `20260620122110_178748dc-376f-4c78-911d-ec879dfffce1.sql` |
| 3 | `e8bb72f882c2cf1b43a59dd06df423d11466e20a334093a7e7c3f3f6b151a6c0` | `20260620123741_7e8b6a59-b1d0-4885-bcfb-ae0dd2dac64e.sql` |
| 4 | `6c5394b82bc3f5ae56b7694f4362d1c09eaeace619564799f25dbe762dc03f24` | `20260620131046_25e754bd-c51f-409e-90f1-74b622794197.sql` |
| 5 | `9b30b91e3f76b6fd448c950de70d7ac5e35251eb4fa7bad766dcbc2979074022` | `20260620150249_aeff3a12-2619-4cc9-aa0f-a7f5a844e8f3.sql` |
| 6 | `1f2ef5bb30c946e5d106eb6726e1b9592b07ae490665b3cb6445672a703d65b7` | `20260620151525_b630392a-2197-480f-b1cb-99da6c869c81.sql` |
| 7 | `c17c05f75e15b0c2940521a8509e16936d1a52d5368d5c83b81bbbcea1abecce` | `20260620163221_afd596f8-c5bc-4f1d-8bf0-fd8a2a409d14.sql` |
| 8 | `46e44756b593cc8756e1f6de747789e26be687bbb54ab7c1faaa50977b1c820b` | `20260622044140_557cda0e-ae5c-4abc-b1ef-51ea89d09ff5.sql` |
| 9 | `d77adfc8e9dcece4e8b0bcd34c299a3cab64bdf88cac6d21970a1eb5e84816c7` | `20260623054451_c6c2ad41-5c74-4c10-9920-f6ef5546d4e6.sql` |
| 10 | `0352e3a3efa15781d0b109e996d1ade0ba1927fca40b70e7c8e827a41442630c` | `20260623054511_8244a074-f5e6-41b8-8d3e-44bd6d2c7e12.sql` |
| 11 | `578d06e8bd4dafe83b6f993d7ffc016fa7349f4a7d55dabb347f83e06112f507` | `20260624115701_d5ee45b9-21af-42a5-b99b-4ae1a1eb7a46.sql` |
| 12 | `7e7e134a524557d189f9f928d004224a2055109d3557591a5faf079af377ec31` | `20260626111823_66d215f2-2628-4490-93eb-0379825258b9.sql` |
| 13 | `0dec5e7687f703960dc1fd19a5b0e8f6de167f70a80a7af250c69d3d85613bd5` | `20260626130344_f04aa837-2b27-4111-8b1d-0c46287a1bb3.sql` |
| 14 | `2e3e8b296ce4e93e263b076d419195f8b62919a737929ef9dada350cf829e601` | `20260626131711_e05e2ec4-e2d0-4a0e-a905-fe22ea9a3401.sql` |
| 15 | `e4970688a24f6d2f70d72890ef1785bea6b3e996e2c17cedd74709f943b672a6` | `20260626133221_e95464b7-e864-413c-a934-7428cb26da47.sql` |
| 16 | `0e5ce23ab2d4a17c8bcbec15cc7926d0cfb9137bf44dd771fbe119a7cdcc6de9` | `20260626133249_c712dcde-8e28-4f72-968d-a101b1bd5f7e.sql` |
| 17 | `3e27eee9e70423e9bc9a3691be9614915c16b12d388391b61790bd6f219b14ee` | `20260626143528_139a8242-aefe-4b45-bd91-9b17351263bc.sql` |
| 18 | `71f8650a71519573cfcfb51b64135cd7d12669c1a8e98e40611e237a389f2649` | `20260626150625_35a08443-45fd-46ae-807b-3644b44efe26.sql` |
| 19 | `9c0d372bd753fdce2bb3ef9d1404f4532f15bda2b99daf2bcc2802b1c58f2a54` | `20260626172336_78ce7dbb-cbb0-4186-b95c-cd8caea6cd95.sql` |
| 20 | `f389db9376b7fcd08a34ed083ea5c6e87eb9ffa17c78ad42de6224a73ef3dc0d` | `20260627090513_8cdbda3b-4bd0-4ac0-a4b5-0adfdc813790.sql` |
| 21 | `3d066928e52bae6057f933a5c243a36ff4ed42ab6e3672341093cc503274c52e` | `20260705002543_e6b3e3bb-6d5e-4783-97cd-39e875bece40.sql` |
| 22 | `db8d1b56b6a861fdad9c69915175ddb2da5f22218d758a0764d69f0f96f7e656` | `20260707223958_421f2364-7989-4069-b78c-fd119f19daeb.sql` |
| 23 | `b33c6529e36ba9cf7f857a18688768735d1c6a4acea28937b90bd955083f22ae` | `20260707225659_58faa06f-1875-4a2b-8365-88a8473383f2.sql` |
| 24 | `f956290d51d4be129350b6bedfc80947a61692663829fc2af154dbb5070fecc4` | `20260725063636_d379b679-904b-4d2a-b9ed-11b463817fda.sql` |
| 25 | `01c41a0504ce523600a439ffbcec131d23c2240794947987c34ae685a3686e6f` | `20260725064521_96522167-55e3-4281-ae25-6180fe57369f.sql` |
| 26 | `f65ab9254635eb5977ebf696eafca2bb0b16355a7371d1971cfa371b0136fa96` | `20260725065302_ddd47f8e-25ed-4581-84e8-658d1e38ecdb.sql` |
| 27 | `aab29e723d490c8fc5b2be9a4acb9733f8ba97364ced6b6a5aeda49f665b3fd7` | `20260726085612_c410e01a-1b96-4b65-b539-0eb71556bb31.sql` |
| 28 | `a7404082f4a3956d7f4ed25bb31e612eda7e4bc05dd2f3f1a1a1b3130b94c8a6` | `20260729052237_75252732-97d3-448f-b082-93517558a096.sql` |
| 29 | `050ed51a25e8362ec16535f46cd701a843ae39719ab1b2b64ac272869705cad4` | `20260729054314_21b2720c-0c44-46ce-8404-e256ce7cf4ee.sql` |
| 30 | `030a3c41acc3fdbaea964b9d9410c307a0d3edcd78fd120e8d4e2323fbd70f8a` | `20260819000000_coregrid_harden_schools_and_realtime.sql` |
| 31 | `1c6ea1a9271c53ea29329208f10e8ed1cb035c6b5e59cf8e530f02c985e80eca` | `20260903000000_coregrid_universal_kernel_substrate.sql` |
| 32 | `3fdef310f87da63e2c4f0110f36d0cddb9c4575bff0af802414aaf846781da5e` | `20260904010000_coregrid_rls_transport_and_grants.sql` |
| 33 | `0850b249ddd023dc345b805de974ec9b22a4d35ccc5bef85b4293c56a6b4f528` | `20260904020000_coregrid_l2_identity_tenancy.sql` |
| 34 | `824f8ff999de541c0fb69c87dc42aa9167231811901e8889496a5292e7e53183` | `20260907000000_coregrid_workforce_kind_substrate.sql` |
| 35 | `4612aed4c0f63d949512e6804a9a823074d2cd2c52b29b06f3cdc268456968b0` | `20260907000100_runtime_scholar_workforce_catalog.sql` |
| 36 | `3ceb09bec89448d52ae89545215287c448bf9fea5f4810a821647e9a903fa154` | `20260907000300_coregrid_workforce_position_rpc.sql` |
| 37 | `9edba0b523607a598f25827ffe3821bf5b6aa688ff94bb76da2f266f86a2886d` | `20260907000400_coregrid_self_primary_position_rpc.sql` |
| 38 | `1951a520776f859c8c2fbcf35d8a782bb99daae964dbac2184072bed64a5658b` | `20260907000500_coregrid_end_position_promotion.sql` |
| 39 | `9efa8868da0eaa7d6ad913c3adf080174e0e0b7f3c5cf352e1b399158d6a1246` | `20260907000600_runtime_scholar_workforce_ecosystem_extension.sql` |
| 40 | `1e2798a92fc35fb3158aec4fbea0282908198134b1bc969b998fa7ddf1109a42` | `20260907000700_coregrid_org_profile_substrate.sql` |
| 41 | `d76a8df9a7d26b953dca5fccf1a8ded78b37a0356b337b936e3047ca3a2721ff` | `20260907000800_coregrid_role_assignment_substrate.sql` |
| 42 | `8ec43cd8af0dfcc657ae47241038bf08c208a632fd0fa82d87f564a8fd9b4024` | `20260929000000_coregrid_foundation_mission_001.sql` |
| 43 | `82e338038b8ad5d0e9b98b6690bc6db4cf6c00d4271897176240e8375a5e8495` | `20260930000000_coregrid_v1_workspace_persistence.sql` |
| 44 | `4c1d53d6dc9ee4ce4c396be795f418a96ea9b2d5a30c76daffcdb35806f62049` | `20261001000000_coregrid_v1_org_model.sql` |
| 45 | `68051c768f473151de22a9d6a200d442690717de837608fe553e3dd5519c4b29` | `20261002000000_coregrid_v1_kernel_envelope.sql` |
| 46 | `119545b64357355f28d92291fa46f0b08c71aedf741e2349c7589bbc02dacf6b` | `20261002000001_coregrid_v1_neutral_tenant_primitives.sql` |
| 47 | `26f03c1c39b790bfed386bc1af3bd85ecf930f44df44960d3da492668baaf0f1` | `20261002000002_coregrid_v1_worker_definitions.sql` |
| 48 | `03fd14058d5260f13fe23a50f5957eede1b821a70db3d991f3750a28578a5451` | `20261002000003_coregrid_v1_kernel_bitemporal.sql` |
| 49 | `12f0fce43bf1a7d63ca1f775bebe4c3e430697f104ae551dd3f76c9b9b8a23b4` | `20261002000004_coregrid_v1_memory_tier.sql` |
| 50 | `5f9796d54b1b34606a6e96fc683156c671d5f055254e95264ac5442ce0f80ba1` | `20261002000005_coregrid_v1_reconciliation.sql` |
| 51 | `29c8263377bd34eafe47a7df72189977b6c49e3d3cb6838e6cb4e913e45a8f15` | `20261002000006_coregrid_v1_event_security.sql` |
| 52 | `dabdd5414b1da28288df441322da0d378610d4959d3c097a1a8dc2785175ea76` | `20261002000007_coregrid_v1_event_routing.sql` |
| 53 | `fb0a77987cee5d554a0a05bac56d8247574dacc743628d281a42677fb4d4a26b` | `20261002000008_coregrid_v1_evidence_lifecycle.sql` |
| 54 | `7391ef7e739634d351e4f079c82097f5186e4ee7b30186d4dda87c65ed5b31f0` | `20261002000009_coregrid_v1_reasoning_provenance.sql` |
| 55 | `c5c7dabca7236513ec1c37d520b55945585b1bb845934b3771e7a1ff9fdf51dd` | `20261002000010_coregrid_v1_cost_attribution.sql` |
| 56 | `e7d8b6e0eebd77a5979c4a59bd9f27cf293d2fbf967bd8597677ac2af30f39f4` | `20261002000011_coregrid_v1_knowledge_currency.sql` |
| 57 | `fd829fc13d06771a637fa1fb941494a48e9ece6fcb7d925b390bd6877cb20168` | `20261002000012_coregrid_v1_tool_runtime.sql` |
| 58 | `d633d725a8fe5120525d8adacea9b4197d8eb71ea8913ade6a9a7179ec3389bc` | `20261002000013_coregrid_v1_neutral_membership_policies.sql` |
| 59 | `a1e3bcc3b0f1436de6c49d4ccd601cd894fdd10bdae5f25d692b02f37be83517` | `20261002000014_coregrid_v2_transport_buses_rls.sql` |
| 60 | `e38c8e100c3c39ad745d01d8751ae838b55f2a64c06b7fabec38e70680d298d5` | `20261002000015_coregrid_v1_substrate_policies.sql` |
| 61 | `60d515a6610cf1d4bfbd1365c06c98211a434bbc547b0fa9f2f863f97bae92a4` | `20261003000016_coregrid_v1_file_substrate.sql` |
| 62 | `1165260c38c88f4726fc56a824ad5b6097001daabbe261bdc0b80b31035cb328` | `20261003000017_coregrid_v1_idempotency_substrate.sql` |
| 63 | `242630a6c791eb423758161fadce185d9b9c3434f2fcfd1966bd4dbc9d3edecc` | `20261003000018_coregrid_v1_idempotency_privilege_revoke.sql` |
| 64 | `77f16b824d21934af045647da5d05806f2291fcd4d75a278316fc8fd05616831` | `20261003000019_coregrid_v1_mission_lease.sql` |
| 65 | `6f8fb46367691f11b57eaa4642a94c2b68a0aa6a7201f0eb02c80b3c3856baa4` | `20261003000020_coregrid_is_super_admin_definer.sql` |
| 66 | `de1578478b5d1bd6312d720d91d78db73003a0edc229d5fdca594d0c62033e38` | `20261003000030_coregrid_hermes_observation_substrate.sql` |
| 67 | `24fc4eb2215fd08cfe2ae45febcf3614415d31603bae984e9931d56b2fe33e5b` | `20261003000031_coregrid_delivery_evidence.sql` |
| 68 | `e2a97176d54a75feacc72c7ba5dd3770dae91ccfd56d61681966f0527176cce7` | `20261003000040_coregrid_school_media_bucket.sql` |
| 69 | `9a1e0194dcfebde50e031c63fd3701b9b6c7cbed712f9968c646bd83976ab3cf` | `20261003000041_coregrid_transport_bus_reads.sql` |
| 70 | `22699f85a2c8f0b12a626e3d33ece2b0a0610836a56144f93bf007b953e48561` | `20261008000050_coregrid_organization_memberships.sql` |
| 71 | `8c7f582dc5c35fb869c625be5b40f83b9611791746fccbcb355cfc37a1347ac3` | `20261008000060_organization_onboarding.sql` |
