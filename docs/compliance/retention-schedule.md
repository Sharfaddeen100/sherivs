# Retention schedule

The authoritative, machine-readable schedule is `architecture/coregrid-mvp-architecture/RETENTION_POLICY_SCHEDULE.json` (human form: `RETENTION_POLICY_SCHEDULE.md`), typed in `frontend/src/lib/governance/retention-policy-schedule.ts` and validated by `node scripts/verify-retention-schedule.mjs`. Mechanism: ADR-005 (immutable records are tombstoned, never deleted). This document does not redefine it.

**All durations are provisional defaults — LEGAL REVIEW REQUIRED** before any automated deletion exists. No automated deletion is implemented; SHERIVS-003 adds a read-only report.

## Mapping to Scholar tables (education-institution tenants)

| Category (recordFamily) | Policy | Retention | Scholar table(s) in dry run |
|---|---|---|---|
| attendance-activity | RP-ATTND-EDU | 730 d | `attendance` (by `date`) |
| communication | RP-COMMS-EDU | 365 d | `messages` |
| financial | RP-FINAN-EDU | 2555 d | `fees`, `student_platform_fee_ledger`, `staff_payroll` |
| audit | RP-AUDIT-EDU | 2555 d, tombstone only | `audit_logs` |

Not yet mapped to tables (event-triggered or no Scholar table): identity-profile (subject-relationship-end), workforce-employment (employment-end), biometric-reference (consent withdrawal or enrolment end), memory, evidence, kernel-object, event, ai-snapshot (180 d). `grades` has no policy entry of its own: **LEGAL REVIEW REQUIRED** (education-record retention).

## Dry run

`public.retention_dry_run()` returns `(category, table_name, record_count, oldest, retention)` — one row per mapped table, with `record_count` = rows older than the window across all tenants. It is `SECURITY DEFINER`, callable only by `service_role` or a platform super admin (anything else raises `42501`), and **never deletes**.

```sql
-- as service_role (local stack or an approved operator session)
SELECT * FROM public.retention_dry_run();
```

Verified by `tests/integration/sherivs-003-ndpa.local.sql` (counts unchanged after the call; authenticated callers denied).

## Related

[ndpa-overview.md](./ndpa-overview.md) · [erasure-policy.md](./erasure-policy.md) · ADR-005, ADR-008 (cross-tenant erasure and backup expiry: backups are not edited; they age out per ADR-008)
