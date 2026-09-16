# Phase 02 — Identity · Archaeology Record

> **Wave:** AUDIT-P02 (phase intake). **Mode:** reconnaissance — nothing implemented.
> **Sources:** pasted Phase 02 document, `architecture/phase-02-identity.md`
> (2,477 lines), `frontend/src/lib/kernel/phase-contracts/phase-02-identity.ts`,
> `architecture/registry.json` row 02.
> **Machine evidence:** `architecture/proofs/phase-02-acceptance.proof.json`,
> `architecture/phase-acceptance/phase-02-identity.json`.

## 1. Four-way verification

| Dimension | Verdict |
| --- | --- |
| Document | **PASS WITH FINDING** — the pasted text is structurally degraded: A5/A6, C5/C6, E3, the F2 operation I/O tables, H2–H17 field lists, I8, J16, K2/K7/K8, M2, the Definition-of-Done table and the invariant bodies arrived **empty**. The repository document is complete and authoritative; the paste cannot be used verbatim as an acceptance source. |
| Contract | `phase-02-identity.ts` — owns `universal-identity`, `dependsOn: ["01"]`, consumers `03, 05, 06, 08, 22, 25, 50`, consumes the foundation verify-chain |
| Registry | `IMPLEMENTED`, levels `L1+L3`, 5 modules, notes record the live-validated `cg_identity` migration (8/8 checks) and typed consumption contracts |
| Code | identity, identity-actor, identity-credentials, identity-lifecycle, identity-registry (+`.functions`), identity-relationships, roles; suites `identity`, `identity-registry`, `identity-actor`, `auth-helpers`, `security-session`, `security-agent-controls`; migration `20260904020000` (RLS enabled) |

## 2. Acceptance probe

`npm run audit:phase -- --phase=02` → **12 areas: ENFORCED 10 · DECLARED 1 ·
UNWIRED 1 · MISSING 0**, `ok: true`.

| Classification | Areas |
| --- | --- |
| **ENFORCED (10)** | identity registry (C2, with `cg_identity` + RLS), identity lifecycle (C1), credentials (C3), authentication (C4/F3), sessions (C8/F4, owner 08), authorization foundation consumed not re-created (C5, invariant 02), relationships/ReBAC (C6/F7), agent identity (F9), device identity (F11), the 15 invariants |
| **DECLARED (1)** | **identity event contract (F13)** — declared by the contract, implemented nowhere: no `IdentityCreated`/`CredentialChanged` event is emitted anywhere in the tree |
| **UNWIRED (1)** | **workspace projection** — `registerIdentity` exists and is gate-classified, but no route or component calls it or imports any identity module |

## 3. Five-level vector

| Level | State | Evidence |
| --- | --- | --- |
| L1 conceptual | ✅ | document + 20-section contract |
| L2 data model | ✅ | `cg_identity` migration, live-validated 8/8 per registry notes |
| L3 backend | ✅ | 7 identity-family suites + server functions with the canonical gate |
| L4 frontend/workspace | ✅ | **CLOSED 2026-09-14 (P02-2):** `/admin/identities` reads real state through `listIdentities` (tenant boundary resolved from the actor's own session) and registers through `registerIdentity` |
| L5 operational | ✅ | verifiers, CI and migrations name it |

**Phase 02 derived COMPLETE on 2026-09-14** (`audit:phases`): `L1 ✓ · L2 ✓ · L3 ✓ ·
L4 ✓ · L5 ✓`, with the acceptance probe at **11 ENFORCED · 1 DECLARED · 0 UNWIRED**.
The flip is earned by code: the surface calls the gated server functions, and the
read path is filtered by the tenant id the gate resolved — never a client value.

## 4. Ownership findings

The document's boundary claims hold in code: authentication lives in `auth-helpers`,
sessions and authorization in phase 08, trust in phase 09, devices in 15/22 and agent
runtime in 07. **Phase 02 re-creates nothing it does not own**, and invariant 02
(no authorization from a role alone) is machine-checked by the P08 enforcement
surface guard (22 families adopted).

## 5. Work items

| ID | Item | Kind | Status |
| --- | --- | --- | --- |
| P02-1 | Identity event contract (F13) is declared and unimplemented — emit and version the seven lifecycle events | missing capability | **OPEN** (the only area still DECLARED) |
| P02-2 | Identity had **no workspace projection** | L4 projection | **CLOSED** — `/admin/identities` |
| P02-3 | Federation (F12: OAuth/OIDC/SAML/SCIM) has **no module at all**; the paste's own F12 detail arrived empty | missing capability | **RESERVED** — needs identity providers and credentials; not fakeable, registered not dropped |
| P02-4 | Registry row omitted the `identity-registry` module | registry accuracy | **CLOSED** |
| U-01 | Whether the live `cg_identity` RLS policies behave as the migration claims still requires a database (CF-7) | unknown (DB-gated) | open |
