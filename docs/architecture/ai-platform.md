# AI Platform

> Status: Canonical (current features); Planned (platform agents).

## Current AI capabilities

| Feature | Module |
| --- | --- |
| Lesson-plan drafting | `lib/lesson-plan-ai.functions.ts` |
| Timetable generation | `lib/timetable.functions.ts` |
| Expense insights | `lib/expense-insights.functions.ts` |
| Digital twin summaries | `lib/digital-twin.functions.ts` |
| Portal assistants | `components/ai/**` (admin, teacher, student, parent) |

## Architecture

- Vercel AI SDK (`ai`) with `@ai-sdk/openai-compatible`.
- Gateway: `lib/ai-gateway.server.ts` -> `AI_GATEWAY_URL` / `AI_API_KEY`
  (server-side; keys never reach the client).
- Server functions scope the data an AI feature can access; AI never
  receives unrestricted database access.
- Outputs are validated before display/persistence.

## Governance

- `constitution/ai-agent-policy.md` (placeholder pending ratification).
- Human oversight required for high-impact AI actions.
- Platform agents (Planning, Academic, Operations, Finance, Communication,
  Analytics, Safety, Compliance, Research) are Planned under
  `architecture/phase-07-ai-agent-system.md` and
  `architecture/phase-26-ai-intelligence-layer.md`; none are implemented
  today.

