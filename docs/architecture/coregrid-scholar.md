# CoreGrid-Scholar Target Architecture

> Status: Current (target). CoreGrid-Scholar is the evolutionary target of
> the School OS codebase. This document describes the target, not claims of
> today's implementation.

## Direction

CoreGrid-Scholar is a governed education operating system: multi-tenant at
scale (school -> district -> state), modular by domain, AI-assisted with
human oversight, and runnable as a platform ecosystem (marketplace,
developer platform, integrations).

## Target principles

1. **Modular monolith first.** Strong internal domain boundaries; services
   only when independently justified (scaling, security isolation,
   deployment, runtime incompatibility, ownership).
2. **Database-enforced isolation.** RLS remains the tenant boundary at every
   scale.
3. **AI as governed agents.** Features evolve into agents with scopes,
   permissions, audit trails, and human confirmation for high-impact
   actions.
4. **Composable platform.** Web (current), mobile, marketplace, developer
   platform, and education cloud share the same core domains.

## 32-phase roadmap (summary)

Phases 01-23 build the platform foundations and engines; phases 24-32 add
experience, workforce identity, intelligence, marketplace, developer
platform, integration, globalization, enterprise scale, and future
evolution. Full list: `architecture/README.md`.

## Migration posture

- Preserve working behavior; replace ambiguity, not the codebase.
- Each phase is documented before implementation.
- Backward compatibility: data identifiers (`vibeora_*`) and public
  behavior remain stable until forward migrations are safe.

## Relationship to current system

See `architecture-map.md` for the current-system-to-target mapping.

