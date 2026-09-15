# Phase 03 — Multi-Tenancy · Archaeology Record

> **Wave:** AUDIT-P03 (phase intake). **Mode:** reconnaissance — nothing implemented.
> **Sources:** pasted Phase 03 document, `architecture/phase-03-multi-tenancy.md`,
> `frontend/src/lib/kernel/phase-contracts/phase-03-multi-tenancy.ts`,
> `architecture/registry.json` row 03.
> **Machine evidence:** `architecture/proofs/phase-03-acceptance.proof.json`,
> `architecture/phase-acceptance/phase-03-multi-tenancy.json`.

## 1. Four-way verification

| Dimension | Verdict |
| --- | --- |
| Document | **PASS** — the pasted Phase 03 is complete and internally consistent (A–Z, 20 invariants, W acceptance list, X Definition of Done, Y invariants, Z boundary). No empty sections. |
| Contract | `phase-03-multi-tenancy.ts` — owns the tenancy capability, `dependsOn` 01/02, consumed by later phases |
| Registry | `IMPLEMENTED`, levels `L1+L3`, 6 modules (`tenant`, `tenant-core`, `tenant-isolation`, `tenant-lifecycle`, `tenant-quota`, `tenant-topology`), notes record the live-validated `cg_tenant` model 8/8 |
| Code | the six modules above + `tenant-registry(.functions)`; suites `tenant`, `tenant-registry`; migration `20260904020000` (`cg_tenant`, **H2 status enum verbatim**, `parent_tenant_id` FK, **RLS enabled**, region column); `infrastructure/terraform/regions.tf` for residency |

## 2. Acceptance probe

`npm run audit:phase -- --phase=03` → **19 areas: ENFORCED 15 · DECLARED 2 ·
UNWIRED 2 · MISSING 0**, `ok: true`.

| Classification | Areas |
| --- | --- |
| **ENFORCED (15)** | tenant registry (C1/H1/H2), lifecycle (C2), context+resolution (C3/F1/F2, wired in server functions), isolation (C4/J1) with `verify-tenant-isolation.mjs`, RLS on `cg_tenant`, quotas (C8/P1–P5 incl. soft/hard/burst/fairness), entitlements (C9/O), feature flags (C10, owner 05), provisioning (C13, approval-gated via the P08 gate), cross-tenant contract (F7/J5), tenant events (F8), topology (C6/H8/R1), residency (H7/H13/M4), noisy-neighbour fairness (P5/K12/K13), the 20 invariants |
| **DECLARED (2)** | **async boundaries** (invariants 05/06, J6–J8) — the event outbox carries no `tenantId` and no queue/cache module exists; **deprovisioning/offboarding** (C14/U1–U7/H24) — termination exists as a lifecycle *state* only, with no credential revocation or deletion evidence |
| **UNWIRED (2)** | **tenant observability** (K7–K10/V1–V3) — the logger carries `tenantId` and is tested, but no runtime path emits it; **workspace projection** — no route or component imports a tenant module |

## 3. Five-level vector

| Level | State | Evidence |
| --- | --- | --- |
| L1 conceptual | ✅ | 26-section document + contract + 20 invariants |
| L2 data model | ✅ | `cg_tenant` (H2 enum verbatim, hierarchy FK, region, RLS) live-validated 8/8 |
| L3 backend | ✅ | tenant suites + the isolation verifier + gated provisioning |
| L4 frontend/workspace | ⛔ | **hand-verified:** zero surface imports of any tenant module |
| L5 operational | ✅ | migrations, verifiers and CI name tenancy |

## 4. Ownership findings — the boundaries hold

The document's D-boundary claims are accurate in code: identity belongs to 02
(`tenant-registry.functions.ts` attaches tenant context but never authenticates),
authorization to 08 (the canonical gate), trust to 09, financial truth to 13, data
infrastructure to 14 (`tenant-quota` defines ownership semantics, not storage) and
residency placement to 21 (`regions.tf`). **Phase 03 re-creates nothing it does not
own**, and its fairness rule (`assertQuotaFairness`, `maxShareFraction`) is the
enforceable half of the noisy-neighbour objective.

## 5. Work items

| ID | Item | Kind |
| --- | --- | --- |
| P03-1 | Tenant context does not survive asynchrony: the outbox has no `tenantId`, and no queue or cache module exists (invariants 05/06 hard requirement) | missing capability |
| P03-2 | Deprovisioning/offboarding (C14, U1–U7) has no engine: no credential revocation, integration removal or deletion evidence | missing capability |
| P03-3 | Tenant observability is unwired: no runtime path emits tenant-attributable signals, so K8/V1 are unfulfilled in production | wiring |
| P03-4 | Tenancy has no workspace projection (the System-Truth "Command Centre provisions schools" flow is a server function with no surface) | L4 projection |
| P03-5 | Tenant migration (C12/F14/K3/K4/M12) has no engine; only database migration discipline exists, which is a different concern | missing capability |
| U-02 | Live RLS isolation proof for `cg_tenant` remains DB-gated (CF-7) | unknown (DB-gated) |
| U-03 | Whether 10,000+ logical tenants hold without redesign (B4/L12) is unproven; only architectural claims exist | unknown (needs load evidence) |
