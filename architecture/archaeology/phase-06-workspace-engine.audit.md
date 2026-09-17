# Phase 06 — Workspace Engine · Archaeology Record

> **Wave:** AUDIT-P06 (intake, document completion and closure).
> **Sources:** `architecture/phase-06-workspace-engine.md` (2,213 lines + addendum IE),
> `frontend/src/lib/kernel/phase-contracts/phase-06-workspace-engine.ts`,
> `architecture/registry.json` row 06, the workspace modules.
> **Machine evidence:** `architecture/proofs/phase-06-acceptance.proof.json`,
> `architecture/phase-acceptance/phase-06-workspace-engine.json`.

## 1. Four-way verification

| Dimension | Verdict |
| --- | --- |
| Document | **WAS INCOMPLETE — NOW COMPLETED.** 18/20 mandatory engineering sections; the **memory** and **knowledge** sections were absent. Addendum **IE. WORKSPACE MEMORY AND KNOWLEDGE** was authored in the document's own lettered style → **20/20**: what a workspace remembers (session state, context history, preferences, saved/shared views, recent activity, snapshots) and what it knows (navigation catalog, module registry, composition contracts, component registry, capability contract, status/dependency health), with the two rules that keep it safe — memory is authorization-bound and never a source of truth; knowledge is projected from its owners, never copied. |
| Contract | `phase-06-workspace-engine.ts` — composition and interaction layer; the document's own lock stands: the engine composes, it never absorbs other phases' responsibilities |
| Registry | `IMPLEMENTING`, levels `[L1 ✓, L2 ✗, L3 ✗, L4 ✗, L5 ✗]`, `tests: null`. The audit derives **L1 ✓ L2 ✓ L3 ✓ L5 ✓** with **28 counted tests**. The row now records 28 tests, the four modules and the new `workspace-projection` module. |
| Code | 4 modules resolve (`workspace-core`, `workspace-composition`, `workspace-membership`, `workspace-governance`) plus `workspace-engine/{navigation,nav-catalog,views}`; 4 suites (28 tests) |

## 2. Acceptance probe

`npm run audit:phase -- --phase=06` → **18 areas: ENFORCED 16 · DECLARED 2 ·
UNWIRED 0 · MISSING 0**, `ok: true`.

| Group | Areas |
| --- | --- |
| Model | workspace concept/types/identity/hierarchy; lifecycle states |
| Access | membership states and ranked workspace roles |
| Composition | navigation (capability-gated), modules and status, pages/dashboards/cards/widget contracts, saved/shared views and filters |
| Governance | context and configuration snapshots/versioning, template inheritance, policy validation and the audit boundary |
| Boundaries | authorization from 08/09 (RBAC/ReBAC/classification/sandboxing), accessibility, i18n, theming, residency and currency |
| Role-optimised UX | each role's workspace, with an unauthorized workspace resolving to **empty** rather than a default page |
| **DECLARED (2)** | **workspace events** — the vocabulary exists in `workspace-core`, nothing emits it; **provisioning / export / cloning / reset / snapshot restore** — only snapshotting exists; a workspace persistence substrate is deliberately not phase 06's to own |
| Projection | `/super-admin/workspace-projection` (L4) |
| Documentation | 20/20, machine-counted |

## 7. Neutrality and role-list correction (2026-09-14)

Three defects found in this wave's own work and fixed, then locked by
`tests/unit/platform-neutrality.test.ts`:

1. **A neutral module imported a runtime.** `workspace-projection.ts` (Phase 06's
   engine) imported the Scholar catalog (`scholarCapabilitiesForRole`,
   `scholarWorkspaceLabelForRole`) — a vertical leak into a platform module. It is now
   an **input-driven neutral engine** (`composeWorkspace({ key, label, capabilities,
   contributions })`) with no runtime import at all, and the Scholar binding lives in
   the runtime layer (`frontend/src/lib/runtime/scholar-workspace-projection.ts`). A
   second vertical can now be added without touching the engine.
2. **A surface declared a hand-written role list.** The projection page carried
   `ROLES = ["super_admin","hq","admin","teacher","student","parent"]` — six roles on a
   platform where the Scholar registry holds **hundreds** and grows. It now derives
   *every* workspace kind from the catalog's label map and counts the **full reality
   role registry** (`EDUCATION_REALITY_ROLES`), with unassigned roles and the role
   workspace engine's audit findings surfaced instead of hidden.
3. **Page-level role guards were used as gates.** `identities`, `education-reality`
   and `tenants` declared `RoleGuard allow={[...]}` lists — stale by construction and
   not a security boundary (authorization is server-side + RLS). The guards are gone:
   the portal layouts guard access, and the canonical Phase 08 gate guards the data.
   `tenants` additionally **moved out of the Scholar portal into the platform control
   plane** (`/super-admin/tenants`), because tenancy is platform infrastructure, not a
   school-admin capability — and it had been gated on `hq`, which is not the platform
   super-admin role.

**The lock:** the guard test asserts (a) nine neutral platform modules import no
vertical, (b) five platform surfaces declare no role list, (c) the projection surface
derives its content from the adapter rather than naming roles, and (d) the adapter
enumerates kinds with `Object.keys(SCHOLAR_WORKSPACE_LABELS)` — so a new kind or role
appears automatically and a hand-written list cannot re-enter.

## 3. Five-level vector

| Level | State | Evidence |
| --- | --- | --- |
| L1 conceptual | ✅ | 2,213-line architecture (A…ID) + IE addendum + contract |
| L2 data model | ✅ | workspace/tenant-scoped model types and the contract's substrate declaration |
| L3 backend | ✅ | 28 counted tests across four workspace suites |
| L4 frontend/workspace | ✅ | **CLOSED 2026-09-14:** `workspace-projection.ts` + `/super-admin/workspace-projection` |
| L5 operational | ✅ | verifiers, CI and contracts name the engine |

**Phase 06 derived COMPLETE on 2026-09-14** (`audit:phases`): all five levels
evidenced, `sections 20/20`.

## 4. The projection, and why it is worth having

"The workspace is a projection of authority" is the phase's own principle, so the
surface proves it: for each platform role the page resolves that role's capabilities
from the catalog and composes its navigation with the **real engine**
(`resolveWorkspaceNav`), then shows sections, items, home, quick nav and which roles
resolve to an empty workspace.

The tests assert the property rather than a snapshot: **every item a role receives is
one its capabilities allow**, no item is duplicated across sections, an empty
workspace stays empty with no home, and quick-nav entries always exist in the
composed sections. A regression that leaked an unauthorized navigation item would
fail those tests, not merely change a number.

## 5. Ownership findings

The engine consumes and never re-owns: identity (02), tenancy (03), reality (04),
execution (05), authorization (08/09), agents (07/26) and analytics (18) keep their
authority; navigation is withheld by capability rather than by role name, which is
why it composes rather than checks. The absent pieces are structural, not sloppy: the
engine has **no persistence substrate of its own**, which is exactly why provisioning,
export, cloning and restore are recorded as reserved rather than claimed.

## 6. Work items

| ID | Item | Kind | Status |
| --- | --- | --- | --- |
| P06-1 | Document lacked the memory and knowledge sections | documentation | **CLOSED** — addendum IE, 20/20 |
| P06-2 | No workspace projection (L4) | L4 projection | **CLOSED** — `/super-admin/workspace-projection` |
| P06-3 | Registry understated three levels and hid 28 tests | registry accuracy | **CLOSED** |
| P06-4 | Workspace lifecycle events are declared, never emitted | missing capability | **OPEN** (DECLARED) |
| P06-5 | No workspace provisioning/export/clone/reset/restore | missing capability | **RESERVED** — needs a workspace persistence substrate (owner decision, not silently dropped) |
| U-06 | Workspace configuration is not persisted today, so snapshots are in-memory structures; live validation is DB-gated (CF-7) | unknown (DB-gated) | open |
