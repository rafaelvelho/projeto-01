---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---

# Research

Investigate a question against **primary sources** and capture findings in the repo.

## Prefer a background agent in Cursor

When the research is substantial, launch a Cursor **Task** / background agent so the main chat can keep moving. Pass a self-contained brief: the question, where to save the note, and the citation rules below.

If a background agent is unavailable or the research is tiny, do it in the current session.

## Job

1. Investigate against **primary sources** — official docs, source code, specs, first-party APIs — not secondary write-ups. Follow every claim back to the source that owns it.
2. Write findings to a **single Markdown file**, citing each claim's source (URL or file path).
3. Save where the repo already keeps such notes; if there is no convention, use `docs/research/<slug>.md` and say where you put it.

## Output shape

```markdown
# <Question>

## Summary
<2-5 sentences>

## Findings
- <claim> — <source>

## Open questions
- <anything still unresolved>
```

## Rules

- Prefer primary sources over blogs, Stack Overflow, or AI summaries.
- If sources conflict, report both and say which is authoritative.
- Do not invent APIs, flags, or behaviors you did not verify.
