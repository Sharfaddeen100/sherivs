# Infrastructure

Home of deployment, container, and cloud configuration for CoreGrid Scholar.

**Current state:** No Docker, CI/CD, or cloud configuration exists in the
repository yet. Deployment is currently the hosted Supabase project plus the
web app build output (`npm run build` -> `dist/`).

Infrastructure work belongs to `architecture/phase-01-foundation.md` and
`phase-23-enterprise-scale.md`. Environment requirements are documented in
`.env.example`.

