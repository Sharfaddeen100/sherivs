# CoreGrid Scholar — Dynamic Experience & Website Generation Engine (WAVE-R31)

Status: engine + catalog landed 2026-09-07. Code: `frontend/src/lib/scholar/experience/*`.
Tests: `tests/unit/scholar-experience-engine.test.ts` (19 tests).

## 1. Principle

Organizations do not buy software modules; they declare their REALITY and
CoreGrid generates their digital environment:

```
Organization reality (feature keys, templates, levels, jurisdictions)
        ↓
Section + component catalog (data)
        ↓
Generated public presence  +  Generated internal application
        ↓
Personalized surfaces per audience (from authorized roles)
        ↓
Governed publication (tenant, exposure, human approval)
```

There is no static application architecture: no `SchoolDashboard.tsx`,
`TeacherPortal.tsx`, `ParentPortal.tsx` or `AdminPortal.tsx` decides anything.

## 2. What is generated

- **Public presence**: sections (home, about, leadership, admissions,
  programmes, curriculum, departments, campus, facilities, student life,
  boarding life, faith & values, skills training, agriculture, news, events,
  gallery, contact, parent portal, student portal), each bundling registered
  components (hero, programme display, staff directory, admission form, event
  calendar, news feed, gallery, facilities display, curriculum display, AI
  assistant, contact system, application portal).
- **Section existence is reality-driven**: a boarding school gets a boarding-life
  section because `schedule.boarding` / `boarding_school` is in its reality; a
  day school never does. A TVET institute gets skills training; a school farm
  gets an agriculture section.
- **Internal application**: workspaces are the ROLE ENGINE's workspaces for the
  roles the reality implies (leadership, academic, teaching, boarding, welfare,
  finance, …), each traced to the roles that unlocked it, with a best-supported
  landing workspace.
- **Brand identity**: logo, colours, fonts, tone, language and domain are data
  (`experience-brand.ts`) — no organization needs custom frontend development.
- **Personalization**: public visitor → marketing presence; parent/learner
  (relationship audiences) → portal; role holders → the workspaces their roles
  unlock. Audiences are derived from authorized roles, never from role names.

## 3. Governance laws (machine-checked)

1. **Tenant isolation** — an experience is never generated or governed without a
   tenant context.
2. **Exposure** — an audience is served only the sections its templates expose;
   requesting a private surface for the wrong audience is a violation.
3. **No silent publishing** — sections flagged `requiresApproval` need an
   approved content item, and AI proposals require a human approver.
4. **No static architecture** — engine sources are scanned for
   `schoolType === …`, `institutionType === …`, `if (role === …)` and fixed
   portal/dashboard components: none may exist.
5. **Library layer only** — the engine imports no UI, routes or framework code.

## 4. Remaining directive scope (next waves)

- ✅ R32: CoreGrid internal operating workspace (platform org roles → generated
  engineering/AI/product/customer/education/executive departments).
- ✅ R33/R34/R35: per-feature capability codes + fail-closed gates, data-driven
  dashboard grids, PWA manifest + native shell adapters.
- ✅ R36: generated experiences rendered on the operator surface (the Command
  Centre card generates from the selected organization class).
- ✅ R37: persistence substrate (`cg_role_assignment`, `cg_role_grant`) with
  scoped RPCs, typed store and gated server functions — AUTHORED, not yet applied.
- ✅ R38: marketplace listings published from reality + entitlement-gated installs;
  consent-bound, retention-bounded experience memory (§23).
- R39: apply the R37 migration and record live proof; R40: render the generated
  public site + workspace composition + grid UI; R41: marketplace experience UI.
- Marketplace/experience-memory UI and AI website-generation UX remain unscoped.
