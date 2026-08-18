# PRINCIPLES

> Status: Canonical. The constitution states what must not be violated;
> these principles state how engineers and agents should think when making
> decisions. They are guidance, not law.

## Preserve before replacing

Existing code, data, and documentation carry institutional knowledge.
Before replacing anything, understand why it exists. Replace only when the
evidence shows the replacement is safer, simpler, or necessary.

## Evidence before assumption

Check the actual code, schema, tests, and git history before claiming how a
system works. A document that disagrees with the code is a problem to
investigate, not a reason to trust the document.

## Simple before distributed

The default is a modular monolith. Distribution adds failure modes; adopt it
only for a concrete operational reason.

## Modular before microservice

Strong internal boundaries come first. Services are an extraction, not a
starting point.

## Explicit boundaries

Every boundary (UI -> application -> domain -> data access -> database) has
an owner, a call contract, and tests. Implicit reach-through is debt.

## API-first where justified

Server functions are the API of the application layer. Expose HTTP APIs when
an external consumer exists or is imminent; otherwise keep the surface
internal.

## Strong typing

TypeScript strict + generated database types catch errors before runtime.
Use them.

## Security by default

Secure by default: deny first, least privilege, validate input, never trust
client-supplied tenant identity.

## Tenant isolation

Isolation is a database guarantee (RLS), not a UI convention.

## Least privilege

Give code, agents, and roles the minimum access they need. Service-role
access is server-only and scoped.

## Observable systems

If it fails, it must be findable: errors captured, actions audited, state
documented.

## Auditable decisions

Record decisions with context, alternatives, and consequences. Never
rewrite history to look prescient.

## Tests as contracts

A test is a contract between the author and the future. When behavior
changes, the contract changes deliberately.

## Backward compatibility

Prefer compatible evolution (new migration, new field, deprecation window)
over breaking changes.

## Incremental migration

Large changes arrive in small, verified steps. Each step leaves the
repository buildable and testable.

## Vendor abstraction where valuable

Wrap integrations where the coupling is risky or the swap is plausible.
Abstraction for decoration is waste.

## Automation with verification

Automate what repeats, and verify what automation does. Markdown documents
commands; scripts execute them.

## Documentation follows reality

Documentation must describe what exists. Planned functionality is labeled
planned, never presented as implemented.

## Human oversight for high-impact operations

Auth, payments, RLS, schema, secrets, and deployment changes are reviewed by
a human before landing.

