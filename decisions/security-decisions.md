# Security Decisions

## SEC-001 - Secrets must not be committed (2026-08-15)

**Context:** `.env` (with Supabase service-role and publishable keys) and
`.mcp.json` (GitHub token, Supabase service-role key) were tracked in git.

**Decision:** `.env` is untracked and ignored, and `.env.example` documents
required variables. `.mcp.json` remains tracked for IDE tooling but its
embedded secrets are flagged as a MUST-FIX: replace with environment-variable
references before this repository is shared or pushed.

**Consequences:** New commits stop leaking `.env`. Historical secrets remain
in git history; rotating the leaked credentials is a required follow-up.

## SEC-002 - Row-Level Security is the tenant isolation boundary (2026-08-15)

**Context:** The schema enforces `school_id` on tenant tables with RLS
policies and helper functions (`get_my_school_id`, `is_super_admin`,
`get_my_role`).

**Decision:** Preserve and enforce RLS as the authoritative isolation layer;
application checks (role guards, tenant resolver) are defense in depth, not
the boundary.

**Consequences:** Cross-tenant leakage is prevented at the database even if
application code regresses. `database/queries/rls-isolation-check.sql` is the
regression gate.

## SEC-003 - Applied migrations are immutable (2026-08-15)

**Context:** Migration headers still reference "Universal School OS" /
"Vibeora".

**Decision:** Applied migrations are not edited. Branding updates to schema
history are deferred to new forward migrations.

**Consequences:** Migration chain integrity is preserved; historical branding
is documented as intentional.

## SEC-004 - Authorization compatibility roadmap (2026-08-15)

**Context:** The platform needs enterprise authorization: RBAC, ABAC, ReBAC,
PBAC, RLS, and multi-tenant architecture.

**Decision:** The current role-based model (DB roles + dashboard routing +
RLS) is mapped as the foundation. RBAC/ABAC/ReBAC/PBAC models are recorded as
compatibility targets in `remaining-work.md` and will be introduced through
the Security Engine phase (`architecture/phase-07-security-engine.md`).

**Consequences:** No authorization rewrite during migration; enterprise
models are phased.

