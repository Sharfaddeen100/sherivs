# CoreGrid Scholar — Educational Reality Role Engine (WAVE-R30)

Status: landed 2026-09-07. Code: `frontend/src/lib/scholar/roles/*`.
Tests: `tests/unit/scholar-role-engine.test.ts`, `tests/unit/scholar-role-catalog.test.ts`.

## 1. Why this exists

Scholar previously knew a handful of generic school roles. A real educational
ecosystem contains thousands of organizational roles across ministries,
regulatory bodies, examination councils, public/private/religious/vocational/
technical/agricultural institutions, boarding and community learning, and the
CoreGrid platform organization itself. Hardcoding a role list — or branching on
`if (role === "teacher")` / `schoolType === "secondary"` — is architecturally
incorrect.

The engine turns reality into roles as DATA:

```
Institution reality (feature keys + templates + levels + jurisdictions)
        ↓
Role registry (groups → role definitions, merged + linked)
        ↓
Template / borrowing / inheritance engines
        ↓
Permission + workspace + context engines
        ↓
Dynamic experience (workspaces, landing, chrome)
```

## 2. The reality model

- **24 role categories** (`role-categories.ts`): GOVERNMENT, REGULATORY,
  INSTITUTIONAL_LEADERSHIP, ACADEMIC, TEACHING, STUDENT_SUPPORT, FINANCE,
  OPERATIONS, HEALTH, SAFETY, TECHNOLOGY, FACILITIES, TRANSPORT, BOARDING,
  COMMUNITY, VOCATIONAL, TECHNICAL, AGRICULTURAL, RELIGIOUS, TRADITIONAL,
  RESEARCH, EXAMINATION, QUALITY_ASSURANCE, COREGRID_INTERNAL.
- **Reality vocabulary is NOT re-invented**: roles are scoped by the EXISTING
  institution vocabulary (`runtime/scholar-school-templates.ts` feature keys and
  template ids) plus education levels and jurisdictions. A new institution type
  or curriculum is a data change, never an engine change.
- **Staffing links instead of duplicating**: a reality role that IS an existing
  post maps to its P25 workforce kind (`workforce-kinds.ts` +
  `runtime/scholar-workforce.ts`) through `ROLE_STAFFING_ALIASES`; roles with no
  kind yet stay unstaffed and are listed in `ROLE_PENDING_WORKFORCE_POSTS`.
- **Catalog size (2026-09-07)**: 56 groups → 532 role names → **524 unique role
  definitions** (8 multi-reality merges, recorded in `MULTI_REALITY_ROLE_IDS`).

## 3. Engines

| Engine | Responsibility |
| --- | --- |
| `role-definition.ts` | The role entity + structural validation against the kernel capability graph, institution vocabulary and workforce kinds |
| `role-registry.ts` | Groups → roles, merge-by-identity, workforce linkage, selectors |
| `role-catalog-audit.ts` | Machine audit: coverage, duplicates, grants, linkage, pending posts |
| `role-template-engine.ts` | Reality → suggested roles with PRIMARY/SECONDARY/OPTIONAL priorities, rationale and naming alternatives (Islamic/Christian/secular/alternative) |
| `role-borrowing-engine.ts` | Borrow a framework's roles into another with provenance (from → into → reason) |
| `role-inheritance-engine.ts` | Hierarchy validation (cycles rejected) + effective permissions that can never escalate |
| `role-permission-engine.ts` | Role → Policy → Permission → Resource → Action, fail-closed, most-restrictive-wins |
| `role-workspace-engine.ts` | Roles → workspaces, each traced to the roles that unlocked it; best-supported landing |
| `role-context-engine.ts` | Identity + tenant + assignments + time → effective context (tenant-isolated, fail-closed) |

## 4. Laws (machine-checked)

1. **No hardcoded branches** — the engine sources are scanned for
   `if (role === …)`, `schoolType === …`, `institutionType === …` (comments
   excluded): none may exist.
2. **No invented capability** — every declared permission must reference a
   kernel capability; the engine cannot create an ability the platform lacks.
3. **No role duplication** — a staffed role must resolve to a workforce kind, or
   it declares itself unstaffed and appears in the pending list.
4. **Least privilege by construction** — no catalog role grants anything; grants
   are installed per tenant and evaluated fail-closed.
5. **Reality decides** — a role whose feature scope is not part of the
   institution's reality is never suggested (a day school never receives boarding
   roles; a TVET reality receives workshop roles).
6. **Tenant isolation** — the context engine ignores assignments from other
   tenants and refuses to resolve without identity or tenant.

## 5. Boundaries

- Roles are reality CONFIGURATION. Authorization stays with Phase 08/09 +
  RLS (`security-role-gate.ts`); the permission engine only evaluates and
  explains, so a surface or operator can answer "what would this role set be
  allowed to do, and why".
- The engine contains no UI, no routes and no persistence.

## 6. Wave plan (directive, sequenced)

| Wave | Scope |
| --- | --- |
| ✅ R30 | Educational Reality Role Engine (this document) |
| ✅ R31 | Experience & website generation engine — catalog + engine core |
| ✅ R32 | CoreGrid internal operating workspace (6 departments generated from COREGRID_INTERNAL roles) |
| ✅ R33 | Per-feature capability codes (27) + fail-closed feature gate + gated server functions |
| ✅ R34 | Data-driven dashboard grids (26 contributions bound to feature codes) |
| ✅ R35 | PWA manifest generation + iOS/Android/desktop shell adapters |
| ✅ R36 | Generated experiences rendered on the operator surface (organization-class presets) |
| ✅ R37 | Persistence: `cg_role_assignment` + `cg_role_grant` substrate, RPCs, typed store, gated server functions |
| ✅ R38 | Marketplace publishing from reality + entitlement-gated installs + consent-bound experience memory |
| R39 | Apply the R37 migration on the project and record the live proof (script + PROGRESS row) |
| R40 | Wire the generated surfaces for real: public-site renderer, workspace composition, dashboard grid UI |
| R41 | Marketplace experience UI (discover/install/entitlement) and CoreGrid internal workspace surface |

Each wave: architecture → data → engine → tests → ledger, with the verification
chain (vitest, tsc, eslint, registry-validate, build) green before it lands.
