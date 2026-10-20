# NDPA 2023 compliance overview (CoreGrid Scholar)

Status: **foundations implemented (SHERIVS-003), V1 scope**. Everything marked **LEGAL REVIEW REQUIRED** is an engineering default, not legal advice; a Nigerian data-protection lawyer / the appointed DPO must confirm it before reliance.

## Roles

| Role | Who |
|---|---|
| Data controller | Each school (tenant) for its pupils, guardians and staff |
| Data processor | CoreGrid platform operator (Control Plane) on behalf of schools — **LEGAL REVIEW REQUIRED**: data processing agreement per school |
| DPO contact | `<DPO NAME / EMAIL / PHONE — PLACEHOLDER, to be appointed>` |
| Regulator | Nigeria Data Protection Commission (NDPC) |

## Lawful bases per processing activity (provisional)

| Activity | Lawful basis | Consent purpose | Notes |
|---|---|---|---|
| Enrolment, attendance, grades, timetables | Contract / public-task (core education) | `core_education` (default allowed unless withdrawn) | LEGAL REVIEW REQUIRED |
| Fees, payments, payroll | Legal obligation (records) | — | Retained per RP-FINAN-EDU; anonymized on erasure |
| In-app messages / notifications | Legitimate interests (school operations) | — | RP-COMMS-EDU 365d |
| SMS / WhatsApp / voice calls to guardians about a pupil | Consent | `messaging_sms_whatsapp` | Default DENY |
| Pupil photos / media | Consent | `photos_media` | Default DENY |
| AI processing of identifiable pupil data | Consent | `ai_processing` | Default DENY |
| Security audit log | Legitimate interests / legal obligation | — | Immutable, ADR-005 |

## Children's data and parental consent

Pupils are children; the guardian linked in `parent_student_map` (or a school admin recording paper/verbal consent) grants and withdraws consent. Optional purposes are **default deny** and only count when granted under the current `CURRENT_CONSENT_POLICY_VERSION` (`frontend/src/lib/compliance/consent.ts`). Withdrawal is as easy as granting (`withdrawConsent`). Every change is stored in the append-only `consent_events` table plus an audit record. LEGAL REVIEW REQUIRED: age thresholds, whether `core_education` needs explicit consent.

Enforcement points ("gates"): see *Consent gates* below.

## Consent gates implemented

| Gate | Where | Purpose | Behaviour when denied |
|---|---|---|---|
| Outbound call about a student | `placeTwinCall` in `lib/runtime/scholar/digital-twin.functions.ts` (when `student_id` is supplied) | `messaging_sms_whatsapp` | Refuses with a clear error; nothing dialed or logged |

Judged **not student-specific** (no gate): `draftLessonPlan` (subject/topic only), `expense-insights` (school expenses), `timetable` AI (classes/teachers), `broadcastMessage` and `notifications-fanout` (in-app rows only; no SMS/WhatsApp channel is wired — the Twilio/Vapi adapters in `lib/communications/` have no callers yet).

**Gaps (follow-up):** student media upload is a direct client-side storage upload (`components/admin/crud-list.tsx`, `routes/_authenticated/messages.tsx`, `routes/admissions.tsx`); there is no server path to attach a `photos_media` check to. When SMS/WhatsApp fan-out or a server media path is wired, use `hasConsent` / `filterConsentedStudents` from `consent.functions.ts` (skip denied students for messaging, refuse for AI/media).

## AI features: DPIA checklist (complete before enabling any AI that sees personal data)

- [ ] Purpose and lawful basis documented; `ai_processing` consent gate in place per data subject
- [ ] Data minimised and redacted before the AI gateway (AGENTS §19); no direct provider calls outside the central AI gateway (`lib/ai-gateway/`)
- [ ] Provider, region and sub-processors recorded; retention/training opt-out confirmed with provider
- [ ] Cross-border transfer assessed (below)
- [ ] Output treated as untrusted; human approval for decisions with legal/significant effect (AGENTS §21)
- [ ] Risks to children assessed; mitigations and residual risk signed off by DPO
- [ ] Logging excludes prompts containing personal data or secrets
- [ ] AI snapshot retention ≤ RP-AISNAP-EDU (180d)

## Cross-border transfers (AI providers outside Nigeria)

Sending personal data to AI/telephony providers hosted outside Nigeria is a cross-border transfer under the NDPA. Before enabling: confirm adequacy or put appropriate safeguards (contractual clauses, binding rules) in place, record the transfer in the provider register, and give notice in the privacy policy (`routes/privacy.tsx`). **LEGAL REVIEW REQUIRED.** Egress is allow-listed in `lib/ai-gateway/egress-allowlist.ts`.

## Data subject rights and the 30-day SLA

Access/export and erasure requests are filed through `submitDataSubjectRequest` (guardian for a child, or the user for themself) into `data_subject_requests` with `due_at = received_at + 30 days`. A school admin verifies identity, then runs `executeExport` or `executeErasure`; statuses follow `received → verified → completed | rejected`. Every step appends `data_subject_request_events` and an audit record. Erasure rules: [erasure-policy.md](./erasure-policy.md). LEGAL REVIEW REQUIRED: the 30-day period and verification standard. Other rights (rectification, restriction, objection, portability) are handled manually by the school until a workflow exists.

## Related documents

- [breach-response.md](./breach-response.md) — 72h NDPC notification and `security_incidents`
- [retention-schedule.md](./retention-schedule.md) — retention periods and dry run
- [erasure-policy.md](./erasure-policy.md) — per-table erase / anonymize / retain
- ADR-005 `architecture/coregrid-mvp-architecture/ADR-005_RETENTION_VS_IMMUTABLE_AUDIT.md`, ADR-008 `…/ADR-008_CROSS_TENANT_ERASURE_AND_BACKUP_EXPIRY.md`
- Code: `frontend/src/lib/compliance/`, migration `20261020000060_sherivs_003_ndpa_foundations.sql`

## Not yet in scope

Data Protection Compliance Organisation (DPCO) annual audit filing, records of processing activities register export, and V2/V3 (device, reality-intelligence) data are frozen under AGENTS §45.
