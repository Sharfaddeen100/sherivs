# Erasure policy (data subject erasure requests)

Source of truth: `ERASURE_POLICY` in `frontend/src/lib/compliance/dsr.ts` (unit-tested in `tests/unit/ndpa-dsr.test.ts`). Executed by `performErasure` in `dsr.functions.ts`, school-scoped, only for a **verified** request, by a school admin of the same school. Principles follow ADR-005 (immutable audit retained) and ADR-008 (backups expire, they are not rewritten). **LEGAL REVIEW REQUIRED** for every retain decision and for the anonymization field lists.

Actions: **delete** (row removed) · **anonymize** (row kept, personal fields overwritten) · **retain** (untouched).

## Student subject (`subject_student_id`)

| Table | Action | What happens |
|---|---|---|
| `students` | anonymize | DOB, gender, medical, address, parent name/phone/email, `user_id`, `parent_id`, etc. cleared; admission number replaced; `is_active=false` |
| `parent_student_map` | delete | Guardian links for the student |
| `grades` | anonymize | `grade_remark` cleared; scores kept but no longer linkable |
| `attendance` | anonymize | `note` cleared |
| `fees` | anonymize | `paystack_reference`, `paystack_access_code` cleared; **amounts/status kept** (RP-FINAN-EDU) |
| `student_platform_fee_ledger` | anonymize | `payment_reference` cleared; amounts kept |
| `digital_twin_calls` | anonymize | recipient name/phone, transcript, summary, recording URL cleared |
| `consent_records`, `consent_events` | retain | Proof of consent and withdrawal |

If the student has a linked `student` user account in the same school, the user rules below also apply to that account.

## User subject (`subject_user_id`)

| Table | Action | What happens |
|---|---|---|
| `users` | anonymize | name, email, phone, avatar, address, NIN, DOB, emergency contact, bank details cleared; account deactivated |
| `messages` | anonymize (content deleted) | `subject` cleared, `body` replaced with a placeholder (column is NOT NULL); metadata kept |
| `notifications` | delete | |
| `parent_student_map` | delete | Links where the user is the guardian |
| `staff_payroll` | anonymize | `user_id` severed; amounts kept |
| `audit_logs` | retain | Immutable (ADR-005); tombstoning embedded values needs a separate ruling |
| `subscriptions` | retain | School-level; no subject identifier |
| `data_subject_requests` (+events) | retain | Evidence of SLA compliance |

## Guarantees

- Every statement filters by the subject id **and** the request's `school_id`; other students and other schools are untouched (tested with fakes and, locally, in `tests/e2e-local/sherivs-003-dsr.local.test.ts`).
- Completion writes `data_subject_request_events` and an `audit_logs` row (`dsr.erasure`); the request stores only per-table counts.
- Tables not listed (e.g. `admission_applications`, `medical`/`health` tables, hostel, library, transport) are **not** covered yet — extend `ERASURE_POLICY` before claiming full erasure. Backups age out per ADR-008.
