# Blocked

- **Secrets rotation:** credentials historically committed in `.env` and
  `.mcp.json` must be rotated by an administrator (external action).
- **Platform domain cutover:** `PLATFORM_HOSTS` in `tenant.ts` still lists the
  legacy domains until CoreGrid Scholar DNS is configured.
- **Supabase CLI workdir:** local CLI workflows now require
  `--workdir database/supabase` (documented in `database/README.md`).

