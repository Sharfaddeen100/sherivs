# CoreGrid Scholar

CoreGrid Scholar is the first production runtime of the CoreGrid platform
ecosystem: a multi-tenant education operating system for schools, districts,
and government education clouds. It was migrated from the Remix School OS
codebase without losing functionality.

## Platform structure

```
architecture/    phase map for the 24 platform engines
constitution/    binding policy layer (placeholders pending ratification)
decisions/       recorded architecture, technology, and security decisions
progress/        current state, blockers, and next tasks
frontend/        web platform (TanStack Start full-stack app)
backend/         future standalone services (extraction tracked)
mobile/          future mobile platform
agents/          future AI agent systems
database/        Supabase project, migrations, and SQL checks
infrastructure/  future deployment and cloud configuration
tests/           unit (Vitest) and e2e (Playwright) suites
docs/            audit, product spec, and platform documentation
scripts/         automation scripts
.codex/          engineering memory for Codex and other agents
```

## Quickstart

```sh
npm i
npm run dev
```

Environment variables are documented in `.env.example`. Copy it to `.env`
and fill in Supabase project credentials.

## Verify

```sh
npm run build        # production build (client + server)
npx vitest run       # unit tests
npm run test:e2e     # e2e tests (requires dev server)
```

## Read first

Agents and new engineers: read `architecture/README.md`,
`constitution/README.md`, `decisions/README.md`, and
`progress/README.md` before changing anything.

## Migration deliverables

- `docs/migration-audit.md` - pre-migration audit
- `migration-report.md` - what changed
- `architecture-map.md` - current system to CoreGrid Scholar mapping
- `remaining-work.md` - future roadmap

