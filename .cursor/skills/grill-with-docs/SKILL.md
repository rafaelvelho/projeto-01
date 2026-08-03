---
name: grill-with-docs
description: A relentless interview to sharpen a plan or design, which also creates docs (ADRs and glossary) as we go. Use when the user says grillme, grill, grill-with-docs, or wants to pressure-test a plan before building.
disable-model-invocation: true
---

# Grill with Docs

Run a grilling session that also maintains the project's domain model.

## How to grill

1. **One question at a time.** Never batch questions. Wait for the human's answer before asking the next.
2. **Be relentless.** Challenge vague language, conflicting terms, and unstated assumptions. Prefer concrete scenarios over abstract debate.
3. **Do not answer for the human.** HITL only — if you invent the answers, the grill is broken.
4. **Stop when sharp.** End when the plan/design is precise enough to act on, or when the user says stop.

## Domain docs while grilling

Use the `domain-modeling` skill throughout:

- Challenge terms against `CONTEXT.md`
- Sharpen fuzzy language into canonical glossary entries
- Stress-test relationships with edge-case scenarios
- Cross-check claims against the code when relevant
- Update `CONTEXT.md` inline when a term is resolved (see `domain-modeling/CONTEXT-FORMAT.md`)
- Offer an ADR only when the decision is hard to reverse, surprising without context, and the result of a real trade-off (see `domain-modeling/ADR-FORMAT.md`)

## Cursor notes

- Prefer `AGENTS.md` over `CLAUDE.md` for repo agent instructions.
- Read `docs/agents/domain.md` when it exists.
