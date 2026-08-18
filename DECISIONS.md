# DECISIONS

> Status: Canonical (index). Decision index for CoreGrid Scholar. Full ADRs
> live in `decisions/` (and may move to `docs/decisions/ADR-XXXX` in the
> future); this file is the index and status ledger.

## Active decisions

| ID | Decision | Status | Date | Area | Location |
| --- | --- | --- | --- | --- | --- |
| ADR-001 | Platform root structure (architecture/constitution/decisions/progress/...) | Accepted | 2026-08-15 | Architecture | `decisions/architecture-decisions.md` |
| ADR-002 | Web app source lives in `frontend/` (BFF co-located) | Accepted | 2026-08-15 | Architecture | `decisions/architecture-decisions.md` |
| ADR-003 | Database assets relocated under `database/` | Accepted | 2026-08-15 | Architecture | `decisions/architecture-decisions.md` |
| ADR-004 | Production build repaired, not redesigned | Accepted | 2026-08-15 | Architecture | `decisions/architecture-decisions.md` |
| ADR-005 | Top-level control-plane documents established | Accepted | 2026-08-18 | Architecture | `decisions/architecture-decisions.md` |
| TEC-001 | Keep the TanStack Start monolith for phase 01 | Accepted | 2026-08-15 | Technology | `decisions/technology-decisions.md` |
| TEC-002 | No dependency upgrades during migration | Accepted | 2026-08-15 | Technology | `decisions/technology-decisions.md` |
| TEC-003 | Tailwind v4 plugin part of canonical build config | Accepted | 2026-08-15 | Technology | `decisions/technology-decisions.md` |
| TEC-004 | Remove the Lovable platform toolchain | Accepted | 2026-08-18 | Technology | `decisions/technology-decisions.md` |
| SEC-001 | Secrets must not be committed | Accepted | 2026-08-15 | Security | `decisions/security-decisions.md` |
| SEC-002 | RLS is the tenant isolation boundary | Accepted | 2026-08-15 | Security | `decisions/security-decisions.md` |
| SEC-003 | Applied migrations are immutable | Accepted | 2026-08-15 | Security | `decisions/security-decisions.md` |
| SEC-004 | Authorization compatibility roadmap (RBAC/ABAC/ReBAC/PBAC) | Accepted | 2026-08-15 | Security | `decisions/security-decisions.md` |

## Decision template

New decisions use this shape (full template in `decisions/README.md`):

```markdown
# Decision
## Status
## Context
## Decision
## Alternatives Considered
## Consequences
## Migration / Implementation Notes
```

## Rules

- Never rewrite a historical decision to look like it was made today.
- Superseded decisions are marked `Status: Superseded` with
  `Superseded by: <ID>`; the historical record is preserved.
- Every material decision gets an ID and an index row here.

