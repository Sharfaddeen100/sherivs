CoreGrid-Scholar Engineering Constitution
1. Purpose
This repository is the foundation of an institutional-grade School Operating System evolving toward the CoreGrid-Scholar architecture.
The objective is to evolve the existing system into a modular, secure, observable, explainable, maintainable, AI-native education platform.
This project is an evolution of an existing working codebase.
It is NOT a greenfield rewrite.
Existing functionality, data, migrations, integrations, tests, and architectural knowledge must be preserved unless there is an explicit and justified reason to change them.

───

2. Existing-System-First Principle
The existing repository is the source of implementation reality.
Before creating, replacing, deleting, or restructuring anything, agents MUST inspect the existing implementation.
Agents MUST NOT assume that a requested feature does not already exist.
Agents MUST search the repository before implementing functionality.
Agents MUST prefer:
1. Reuse
2. Extension
3. Refactoring
4. Replacement only when justified
A rewrite is never the default solution.

───

3. No Destructive Changes Without Evidence
Agents MUST NOT:
• delete working modules merely to simplify architecture
• replace the application framework without explicit approval
• discard database migrations
• reset or recreate the database schema
• delete historical architectural decisions
• delete progress records
• remove existing integrations without investigation
• replace working authentication
• replace RLS policies without testing
• remove tests without replacement
• regenerate the project from a template
Any destructive change requires:
1. identification of the existing behavior
2. explanation of the reason for change
3. migration strategy
4. validation strategy
5. rollback strategy

───

4. Repository Knowledge Is Layered
The repository distinguishes between:
Constitution
Non-negotiable engineering principles.
Architecture
Current intended technical structure.
Decisions
Historical architectural decisions and their rationale.
Progress
Current implementation state and historical development progress.
Source Code
Actual executable system behavior.
When documents conflict, agents must determine which document is authoritative.
The constitution has highest priority.
Current architecture has priority over obsolete architecture.
Source code represents implementation reality until the architecture is intentionally migrated.
Historical documents must not silently override current architecture.

───

5. Audit Before Modification
Before substantial implementation work, agents MUST inspect:
• repository structure
• package.json
• package-lock.json
• bun.lock
• TypeScript configuration
• Vite configuration
• TanStack Start configuration
• routing
• server functions
• database migrations
• Supabase integration
• authentication
• RLS policies
• API routes
• AI gateway
• payment integration
• realtime channels
• storage
• tests
• scripts
• agent configuration
• environment-variable usage
Agents MUST identify what already exists before designing replacements.

───

6. Technology Preservation
The current technology stack is intentional unless explicitly changed through an architectural decision.
Current primary stack includes:
• TypeScript
• React
• TanStack Start
• TanStack Router
• TanStack React Query
• Vite
• Nitro
• Tailwind CSS
• shadcn/ui
• Radix UI
• Supabase
• PostgreSQL
• Supabase Auth
• Supabase Realtime
• Supabase Storage
• Zod
• React Hook Form
• Vercel AI SDK
• OpenAI-compatible AI gateway
• Vitest
• Playwright
• ESLint
• Prettier
• Paystack
• Twilio
• Web Push
Agents MUST NOT replace these technologies merely because another technology is personally preferred.
Technology changes require explicit architectural justification.

───

7. Database Is Sacred Infrastructure
The database is a first-class architectural boundary.
Agents MUST treat:
• migrations
• schemas
• indexes
• constraints
• generated columns
• RLS policies
• audit logs
• tenant isolation
as production-critical infrastructure.
Agents MUST NOT casually modify or remove migrations.
New schema changes must be introduced through migrations.
Database behavior must be tested.
Tenant isolation must be treated as a security invariant.

───

8. Multi-Tenancy
Tenant isolation is mandatory.
Every tenant-sensitive operation must have a clearly defined isolation boundary.
RLS is a primary security boundary.
Agents MUST assume that a missing tenant filter or incorrect RLS policy can cause catastrophic data leakage.
Security-sensitive database changes require regression testing.

───

9. Security by Default
Security is not an optional feature.
Agents MUST:
• validate server inputs
• use Zod at server boundaries where appropriate
• enforce authorization server-side
• protect secrets
• never expose service-role credentials to clients
• validate webhooks
• protect authentication flows
• preserve tenant isolation
• audit sensitive operations
• avoid trusting client-provided authorization claims
• minimize permissions
Secrets MUST never be committed to source control.

───

10. Server/Client Boundary
Server-only functionality must remain server-only.
Agents MUST carefully distinguish:
• browser code
• server functions
• API handlers
• privileged Supabase operations
• service-role operations
• secrets
• public configuration
Client code must never gain accidental access to server secrets.

───

11. AI Safety and Reliability
AI-generated output is untrusted until validated.
AI systems MUST NOT directly mutate critical production state without appropriate validation and authorization.
AI functionality must have:
• input validation
• output validation
• error handling
• observability
• auditability
• bounded permissions
• deterministic fallbacks where appropriate
AI agents must not silently change production architecture or production behavior.
AI-generated code must pass the same quality standards as human-written code.

───

12. Autonomous Agents
Agents such as Codex, Claude, or internal orchestration systems are engineering assistants.
They are not granted unrestricted authority merely because they can modify files.
Agents MUST:
• inspect before editing
• explain significant architectural changes
• preserve existing behavior
• keep changes scoped
• run appropriate validation
• report failures honestly
• avoid speculative rewrites
No agent may redefine the constitution implicitly.

───

13. Modularity
Modules should have clear responsibilities.
Avoid unnecessary coupling.
Prefer:
• explicit interfaces
• typed contracts
• dependency inversion
• stable boundaries
• replaceable implementations
A module should have one clear reason to change.

───

14. API Contracts
API and server-function boundaries must be explicit.
Inputs and outputs should be typed and validated.
Breaking API changes require:
• migration plan
• compatibility assessment
• tests
• documentation

───

15. Observability
Important operations should be observable.
The platform should progressively provide:
• structured logs
• audit trails
• metrics
• error reporting
• health checks
• tracing where justified
A failure that cannot be diagnosed is an operational defect.

───

16. Testing
Tests are part of the architecture.
Use the appropriate level:
Unit tests
For isolated logic.
Integration tests
For module boundaries and server/database interactions.
E2E tests
For critical user workflows.
Security regression tests
For authentication, authorization, tenant isolation, and RLS.
Agents MUST NOT delete tests merely because they fail.
A failing test must first be understood.

───

17. Change Discipline
Changes should be:
• small
• understandable
• reversible
• testable
• observable
Prefer incremental migrations over massive changes.
Avoid changing unrelated systems in the same task.

───

18. Dependency Discipline
Dependencies must have a reason to exist.
Agents MUST NOT add a dependency when existing project capabilities are sufficient.
Before adding a dependency, inspect:
• existing dependencies
• bundle/runtime implications
• maintenance status
• security implications
• licensing
• compatibility
Do not upgrade large groups of dependencies unnecessarily.

───

19. Configuration Discipline
Configuration must be centralized and explicit.
Environment variables must be documented.
Required configuration should have safe validation.
Never silently introduce a new environment variable without documenting its purpose.

───

20. Data Integrity
The platform must prefer correctness over convenience.
Do not silently:
• drop records
• mutate historical records
• fabricate missing data
• hide errors
• convert failures into false success
Financial, academic, operational, attendance, fee, communication, and audit data must be treated as potentially consequential data.

───

21. UX and Accessibility
User-facing functionality must prioritize:
• accessibility
• responsive behavior
• keyboard navigation
• semantic HTML
• understandable error states
• loading states
• empty states
• consistent interaction patterns
Existing shadcn/ui and Radix primitives should be reused where appropriate.

───

22. Design System
The application should maintain a coherent design system.
Tenant-specific branding must remain data-driven.
Do not introduce unnecessary hardcoded tenant branding.
Shared components should be preferred over duplicated UI implementations.

───

23. Performance
Performance must be considered at architectural boundaries.
Agents should avoid:
• unnecessary client-side fetching
• unnecessary re-renders
• oversized dependencies
• duplicate network calls
• inefficient database queries
• unbounded realtime subscriptions
Performance optimization must be evidence-driven.

───

24. Backward Compatibility
Existing functionality should remain operational during migration unless intentionally deprecated.
When behavior must change:
1. identify existing behavior
2. document the new behavior
3. provide migration where required
4. update tests
5. validate dependent systems

───

25. Documentation
Important architectural knowledge must live in the repository.
Decisions should be documented.
Architecture should be documented.
Operational procedures should be documented.
Agents should not rely on conversation history as the only source of truth.

───

26. Source of Truth
The repository must progressively become self-describing.
A future engineer or AI agent should be able to understand:
• what the system does
• why it exists
• how it is structured
• where data lives
• how authentication works
• how tenants are isolated
• how AI works
• how integrations work
• how to test it
• how to operate it
• what remains unfinished
without relying on private conversation history.

───

27. Migration Principle
Architecture evolves through controlled migrations.
Every major migration should include:
• current-state analysis
• target-state definition
• dependency mapping
• implementation plan
• incremental execution
• validation
• rollback strategy
• documentation update
Never perform a blind rewrite.

───

28. Completion Standard
A task is not complete merely because code was generated.
A task is complete when:
• implementation exists
• types are correct
• validation passes
• relevant tests pass
• security boundaries remain intact
• documentation is updated
• architecture remains coherent
• no unrelated regressions are introduced

───

29. Core Principle
When forced to choose between:
• speed and correctness
• novelty and stability
• abstraction and clarity
• automation and control
• convenience and security
the platform chooses:
correctness, stability, clarity, control, and security.

───

30. Final Rule
Do not rebuild what already works.
Understand it.
Preserve it.
Improve it.
Replace it only when there is a demonstrated reason.
Every architectural improvement must leave the system more understandable than it was before.