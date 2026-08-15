# Codex Engineering Instructions

Codex working in this repository must follow this order:

1. **Read architecture first.** Start with `architecture/README.md` and the
   phase file relevant to the task.
2. **Read constitution.** `constitution/README.md` and the policy documents.
3. **Read decisions.** `decisions/` to understand why the system is shaped
   the way it is.
4. **Read progress.** `progress/` for current state, blockers, and next tasks.
5. **Never create features outside architecture.** A feature that is not part
   of an approved phase must not be built.
6. **Always test before completion.** Run the relevant unit and e2e tests;
   a change is not done until it is verified.
7. **Always update documentation.** Docs, decisions, and progress must reflect
   every change.
8. **Work through pull requests.** Do not push directly to protected branches.

These rules are expanded in `engineering-loop.md`, `testing-policy.md`,
`security-policy.md`, and `pull-request-policy.md`.

