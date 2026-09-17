# Phase 07 — AI Agent System · Archaeology Record

> **Wave:** AUDIT-P07 (intake, document completion and closure).
> **Sources:** `architecture/phase-07-ai-agent-system.md` (2,352 lines + addendum KH),
> `frontend/src/lib/kernel/phase-contracts/phase-07-ai-agent-system.ts`,
> `architecture/registry.json` row 07, the agent modules.
> **Machine evidence:** `architecture/proofs/phase-07-acceptance.proof.json`,
> `architecture/phase-acceptance/phase-07-ai-agent-system.json`.

## 1. Four-way verification

| Dimension | Verdict |
| --- | --- |
| Document | **WAS INCOMPLETE — NOW COMPLETED.** 19/20 mandatory engineering sections; the **knowledge** section was absent. Addendum **KH. AGENT KNOWLEDGE** was authored in the document's own lettered style (JV…KG): what an agent knows (its identity and limits, its plan and progress, its task state, its memory, its observations, its context package) and the four rules that govern it — knowledge is granted never assumed, only system input is instruction, knowledge is bounded, and knowledge never becomes domain truth → **20/20**. |
| Contract | `phase-07-ai-agent-system.ts` — the phase's governing rule stands: *agents are execution entities; domain phases remain owners of domain truth* |
| Registry | `IMPLEMENTING`, levels `[L1 ✓, L2 ✗, L3 ✗, L4 ✗, L5 ✗]`. The audit derives **L1 ✓ L2 ✓ L3 ✓ L5 ✓** with **62 counted tests** — the row's vector understated it (it recorded `tests: 62` already, which is why only levels needed correcting). |
| Code | 4 modules resolve (`agent-core`, `agent-memory`, `agent-tasks`, `agent-plans`) + 5 suites (62 tests) |

## 2. Acceptance probe

`npm run audit:phase -- --phase=07` → **14 areas: ENFORCED 14 · DECLARED 0 ·
UNWIRED 0 · MISSING 0**, `ok: true`. **This is the first phase with no gaps at all.**

| Group | Areas |
| --- | --- |
| Identity and execution | agent identity/versions/definitions; executions and sessions with correlation |
| Memory | category + data-classification gating; instruction trust (prompt injection is a *property*, not an add-on); context packages built from authorized sources |
| Tasks | declared transition state machine; checkpoints, resume and cancellation |
| Plans | validation against allowed/delegable tools; loop safety and plan budgets |
| Controls | least privilege, no self-escalation, human approval for designated high-risk actions |
| Boundaries | tenant-scoped memory/tools/executions; models and providers belong to Phase 26 |
| Projection | `/super-admin/agent-governance` (L4) |
| Documentation | addendum KH, 20/20 |

## 3. Five-level vector

| Level | State | Evidence |
| --- | --- | --- |
| L1 conceptual | ✅ | 2,352-line architecture (A…KG) + KH addendum + contract |
| L2 data model | ✅ | agent identity/memory/task/plan models on the kernel substrate |
| L3 backend | ✅ | 62 counted tests across five agent suites |
| L4 frontend/workspace | ✅ | **CLOSED 2026-09-14:** `agent-governance-report.ts` + `/super-admin/agent-governance` |
| L5 operational | ✅ | verifiers, CI and contracts name the agent system |

**Phase 07 derived COMPLETE on 2026-09-14** (`audit:phases`): all five levels
evidenced, `sections 20/20`.

## 4. The projection, and what it proves

`/super-admin/agent-governance` states each rule the agent system enforces **with the
module that enforces it and the suite that proves it**, and then exercises the two
state machines that can be driven deterministically:

- a **declared** task transition is permitted and an **undeclared** pair is refused —
  the check finds both cases by scanning the real transition table, so it cannot
  drift when the machine changes;
- reasoning **stops at the declared step ceiling** and continues below it.

A failure is displayed and named. The rules table is deliberately not a summary: each
row points at the implementation and its proof, so a reader can verify the claim
instead of trusting the page.

## 5. Ownership findings

The boundary holds in code: agents receive authority from Phase 02/08 and never grant
it themselves (`security-agent-controls`), memory and executions are tenant-scoped
(Phase 03), execution rides the Phase 05 fabric, and models, providers and budgets
belong to Phase 26 (`ai-governance.consumeAiBudget`). Agent memory is gated by
category **and** a classification ceiling, and external content is data rather than
instruction — the two properties that make prompt injection a boundary problem rather
than a prompt problem.

## 6. Work items

| ID | Item | Kind | Status |
| --- | --- | --- | --- |
| P07-1 | Document lacked the knowledge section | documentation | **CLOSED** — addendum KH, 20/20 |
| P07-2 | No workspace projection (L4) | L4 projection | **CLOSED** — `/super-admin/agent-governance` |
| P07-3 | Registry level vector understated three levels | registry accuracy | **CLOSED** |
| — | No open acceptance gaps: every area is ENFORCED | — | — |
| U-07 | The agent runtime is not yet wired to a live governed tool registry (carried from PROGRESS §17.3: "P07/P26 not wired to a governed tool registry") | unknown → debt (owner 07/26) | open, cross-phase |
