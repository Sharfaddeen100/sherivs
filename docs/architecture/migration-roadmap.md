# Migration Roadmap

> Status: Current. Roadmap from the current School OS-derived system to
> CoreGrid-Scholar. This is the plan; work follows `architecture/` phases
> and `PROGRESS.md`.

## Current state

Post-migration Sherivs Scholar: web platform in `frontend/`, Supabase data
layer in `database/`, 32-phase architecture roadmap, control plane in
place, build + unit tests verified.

## Target state

A governed, modular, multi-tenant education platform with engines for
identity, academics, finance, communication, AI, analytics, mobile, and
government cloud - per the 32 phases.

## Gap analysis (top items)

| Gap | Phase |
| --- | --- |
| CI/CD + deployment config | 01 Foundation |
| Identity/SSO model | 02 Identity |
| Tenant hierarchy + provisioning | 03 Multi-Tenancy |
| Backend extraction | 01/05 (Core Application Runtime) |
| AI agent platform | 07 AI Agent System |
| Authorization policy engine | 08 Security Engine |
| Mobile | 22 Mobile Platform |
| Marketplace/developer platform | 27/28 |
| Education cloud | 20 Government Education Cloud |

## Roadmap stages

1. **Stabilization** - CI, verification script, secrets rotation, lint
   baseline. (In progress)
2. **Governance** - control plane, ratified constitution, filled phase
   docs. (Control plane done; ratification pending)
3. **Domain boundaries** - strengthen modular monolith, extract `backend/`
   where justified.
4. **Platform services** - identity, multi-tenancy, financial system, data
   platform.
5. **AI/agent architecture** - AI Agent System + Intelligence Layer.
6. **CoreGrid-Scholar expansion** - mobile, marketplace, developer platform,
   integrations.
7. **Production hardening** - enterprise scale, global cloud fabric,
   observability, compliance.

## Principles

- One verified step at a time; the repository stays buildable.
- Never rewrite working features without a demonstrated benefit.
- Each phase is documented before implementation.

