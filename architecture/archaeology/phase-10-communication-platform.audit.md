# Phase 10 — Communication Platform · Archaeology Record

> **Wave:** AUDIT-P10 (owner-requested upgrade: per-organization Communication Steward, telephony provider independence, human-role replacement, document completion, L4 closure).
> **Sources:** `architecture/phase-10-communication-platform.md` (A…EK plus addenda EL…ER),
> `frontend/src/lib/kernel/phase-contracts/phase-10-communication.ts`,
> `architecture/registry.json` row 10, the four pre-existing `communication-*` modules plus
> `communication-providers.ts`, `communication-steward.ts` and `communication-steward-report.ts`.
> **Machine evidence:** `architecture/proofs/phase-10-acceptance.proof.json`,
> `architecture/phase-acceptance/phase-10-communication-platform.json`,
> `architecture/phase-completion-status.md` (row 10).

## 1. Four-way verification

| Dimension | Verdict |
| --- | --- |
| Document | **WAS INCOMPLETE AND MIS-ATTRIBUTED — NOW CORRECTED.** It stated **18/20** mandatory engineering sections: the **dependency** register and the **data model** were absent. It also named a runtime as the owner of the platform ("CoreGrid Scholar's unified institutional communication infrastructure"). Addenda **EL. Dependency Register**, **EM. Steward Mandate Data Model**, **EN. Organization Subscription to Platform Communication**, **EO. The Communication Steward**, **EP. Autonomous Call Rules**, **EQ. The Human Role the Steward Replaces** and **ER. Steward Acceptance Criteria** were authored in the document's own lettered style, stating behaviour the modules implement plus the limits they do not reach → **20/20**. Two deliberate runtime mentions remain, both stating that a runtime *consumes* the platform. |
| Scope framing | **CORRECTED.** Five statements framed the platform as one application's subsystem. Owner decision 2026-09-16 and the owner's ruling this wave: CoreGrid is the platform; CoreGrid Scholar is runtime-001, a **consumer**. The kernel modules name no runtime at all (the neutrality guard now covers them), and the consumer statement lives in the document and in this record. |
| Contract | `phase-10-communication.ts` — the governing rule is sound (*"Communication owns how messages are composed and delivered, never the domain reason for them"*). It cited four suites; the three new suites are cited now, and it declares the three new capability ids (`communication:steward-decide`, `communication:route-provider`, `communication:provision-subscription`). Counted tests **59 → 168**. |
| Registry | Was `IMPLEMENTING`, levels `[L1 ✓ only]`, `tests: 59`, four modules. Every level was derived by the audit before the row was changed: L1 doc+contract, L2 data vocabulary + substrates, L3 modules resolve + suites, L4 the steward surface imports a phase module, L5 operational naming. Row corrected to **COMPLETE**, `[✓ ✓ ✓ ✓ ✓]`, `tests: 168`, modules + `communication-providers`, `communication-steward`, `communication-steward-report`. Registry drift for phase 10 disappeared from `audit:phases`. |
| Code | `communication-core`, `communication-conversation`, `communication-channels`, `communication-templates`, `communication-providers`, `communication-steward`, `communication-steward-report` resolve; 7 suites, 168 tests. |

## 2. Acceptance probe

`node scripts/audit-phase-acceptance.mjs --phase=10` → **34 areas: ENFORCED 27 · DECLARED 7 · IMPLEMENTED_UNWIRED 0 · MISSING 0**, every required area evidenced.

| Group | Areas | Classification |
| --- | --- | --- |
| Subscription | provisioning (refused without tenant or organization), inert OBSERVE mandate, plan seats | ENFORCED |
| Autonomy | ladder monotone, OBSERVE refuses, DRAFT drafts, APPROVAL_REQUIRED asks, AUTONOMOUS acts, calls need AUTONOMOUS | ENFORCED |
| Bounded authority | channel, audience, external reach, jurisdiction (unknown refused), language escalation, do-not-contact, consent, emergency authority, prohibited topics, knowledge scope | ENFORCED |
| Protection outranking autonomy | mass approval at every level, confidential/restricted approval, highly-restricted refusal, hard limits, quiet hours, recording permission, disclosure duty, audit obligation | ENFORCED |
| Calls and escalation | nine-state call machine with terminal states, escalation thresholds, escalation always available, mandate lifecycle | ENFORCED |
| Providers | catalogue integrity, credential references, capability matrix derived from the registry, routing refusal, failover ladder, provider lifecycle | ENFORCED |
| **DECLARED** — specified, not executable | mandate persistence (no migration), live external delivery (every adapter DISCOVERED), telephony binding (no provider call, no webhook surface), steward generation (no model, no pack store), recording and transcript storage, subscription metering, automated handover | 7 |


## 3. Defects found and corrected in this wave

Five real defects were found by writing the executable probes first, then fixed at the source rather than at the assertion:

1. **`ProviderAdapter` was truncated and its closing members were orphaned at the end of the file.** `communication-providers.ts` opened the interface, lost `requiresDataProcessingAgreement`, `emergencyCapable`, `notes` and its closing brace, and re-declared them 540 lines later after `auditProviderCatalogue`. The module could not compile. Repaired by restoring the members at the interface and deleting the orphan block.
2. **`isUsableProviderHealth` was called but never defined.** `selectProvider` referenced it, so every routing call threw `isUsableProviderHealth is not defined`. Ten provider tests failed on the reference error before the function was written and exported. This is the class of defect that only an executed probe finds.
3. **The autonomy map let a DRAFT steward send real messages.** `ACTION_MINIMUM_AUTONOMY.send_message` (and WhatsApp, email, status, meeting, document) was `"DRAFT"`, and the gate treats autonomy at or above the minimum as permitted — so a steward with DRAFT authority could send an outbound SMS to a guardian unsupervised. Corrected: every person-facing action now needs at least `APPROVAL_REQUIRED`, and new rule 12b makes autonomy `APPROVAL_REQUIRED` mean exactly that — the steward may act, a human approves each action that reaches a person. `PERSON_FACING_ACTION_KINDS` is exported so the two views cannot drift, and a test asserts the two agree.
4. **Two adapter notes were stubs** ("iOS and macOS push."), thinner than every other entry. Raised to the same standard as their peers rather than relaxing the threshold.
5. **Routing refusals did not say why.** "No adapter supports sms in europe" was returned both when no adapter declares a channel and when adapters exist but none satisfies the required capability. The refusal now distinguishes the two, because a refusal that misnames its cause sends the operator to the wrong place.

A sixth finding is a **sequencing truth rather than a bug**: a brand-new mandate refuses on its empty channel list *before* it refuses on autonomy. The report check was rewritten to exercise both refusals separately, so the observation now matches the gate.

## 4. Owner decisions ratified this wave

1. **CoreGrid is the platform.** CoreGrid Scholar is `runtime-001`, a **consumer** of the kernel, never its boundary. The kernel modules added this wave name no runtime; the neutrality guard was extended to cover them.
2. **Every organization that subscribes to CoreGrid communication receives an autonomous Communication Steward** that handles voice, WhatsApp, email, social, status, meetings and presence under a **mandate** — autonomy, channels, audiences, jurisdictions, languages, quiet hours, volume and spend limits, prohibited topics, disclosure duties, recording rules, knowledge scope and escalation policy.
3. **Telephony is provider-independent by construction.** Twilio, Africa's Talking, Vonage, Telnyx, Plivo, MessageBird, Exotel, Meta WhatsApp Business, SMTP relay, SendGrid, Postmark, Amazon SES, FCM, APNS, Web Push, Google Meet, Zoom, Meta social, X, LinkedIn and the platform's own presence are declared as data behind one adapter shape; credentials are references; no live external path exists yet.
4. **The steward is designed to replace the support-and-communications role, not the human judgement around it.** The mandate holds the authority; the platform records the decisions; the staffing decision remains the organization's, and nothing performs a handover automatically.

## 5. Gaps declared (never hidden)

| Gap | Consequence | Owner |
| --- | --- | --- |
| No live external provider (all DISCOVERED) | No SMS, call, WhatsApp message, email or push can leave the platform | Control Plane credential provisioning (deployment) |
| No persistence for mandates, consent, do-not-contact, calls | A mandate lives only as long as the process that built it | Phase 10 schema work with Phase 03 RLS |
| No telephony binding (no provider client, no webhook surface) | Failover, retry and receipts are declared, not observed | Phase 10 integration work |
| No steward model or knowledge-pack store | The steward decides whether it may speak, not what to say | Phase 07 generation, Phase 10 pack store |
| No recording or transcript storage | Recording cannot lawfully be switched on | Phase 10 storage, Phase 09 retention |
| No metering or invoicing | Plans and seats are descriptive | Control Plane billing |
| Handover is an organizational decision | The platform states the capability; the organization decides | Tenant governance |

## 6. Verification performed, and its limits

* `node scripts/audit-phase-acceptance.mjs --phase=10` → 34 areas, 0 MISSING, `ok: true`.
* `node scripts/audit-phase-completion.mjs` → row 10 `20/20 · 7 modules · 168 tests · L1–L5 all yes · COMPLETE`, and phase 10 is **no longer** listed under registry drift.
* `node scripts/verification/registry-validate.mjs` → passed.
* `vitest run` over `platform-neutrality`, `phase-acceptance-probes`, `communication-steward`, `communication-providers`, `communication-steward-report` → **146 passed**.
* `vite build` → built successfully (2m29s) and regenerated `frontend/src/routeTree.gen.ts`, which now registers `/super-admin/communication-steward`.

**Honest limits.** The full unit suite was run to completion after the final edits: **183 files, 2,858 tests, all passed** (`vitest run`, EXIT 0), and `tsc --noEmit` exited 0 with no diagnostics. The full verification wave in order: acceptance probe → completion audit → registry validator → targeted suites → typecheck → full suite → production build. One sequencing caveat is disclosed rather than smoothed over: the **production build ran before the final contract and document edits** (the contract's `sections` keys were corrected afterwards — a change `tsc --noEmit` proves is type-safe, but which the bundler has not re-run over). The steward's checks are deterministic policy, so "the steward passes" means the gate behaves as specified — it does not mean a provider delivered anything, and the report says so in the open.
