# Next Tasks

1. Rotate leaked secrets (`.env`, `.mcp.json`) and switch `.mcp.json` to
   environment-variable references.
2. Review and ratify the constitution documents (currently placeholders).
3. Fill architecture phase files, starting with
   `phase-01-foundation.md` and `phase-02-identity.md`.
4. Ratify the constitution policy placeholders in `constitution/`.
5. Fix the pre-existing typecheck debt (7 x TS2322 in admin route
   `PageHeader` `actions`) and the Prettier/CRLF lint debt.
6. Introduce CI (build + unit + e2e + secret scan + RLS check).
7. Plan the backend extraction (BFF -> `backend/` services) per
   `remaining-work.md`.
