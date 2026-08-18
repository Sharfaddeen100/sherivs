# Observability

> Status: Current (foundations); planned (production monitoring).

## What exists

- SSR error capture: `lib/error-capture.ts` (captures errors out-of-band)
  + `lib/error-page.ts` + `server.ts` wrapper (normalizes catastrophic SSR
  responses).
- Platform error reporter: `lib/platform-error-reporting.ts` via
  `window.__platformEvents`.
- Audit trail: `audit_logs` table + `lib/audit.ts`.
- Server-side console logging on failures.

## What is planned

- Structured logging, tracing, and metrics (phase 01 Foundation).
- Error reporting service integration (the platform reporter contract
  exists; a backend sink is not configured).
- CI reporting of verification results.

