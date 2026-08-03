# Matt Pocock engineering skills (Cursor)

Installed from https://github.com/mattpocock/skills/tree/main/skills/engineering

## Adaptations for Cursor

- Skills live in `.cursor/skills/` (Cursor project skills), not Claude Code skill paths.
- `agents/openai.yaml` (Codex) was removed — not used by Cursor.
- Repo agent instructions use `AGENTS.md` (not `CLAUDE.md`).
- Slash-command references (`/grill`, `/research`, etc.) were rewritten to Cursor skill names.
- Research uses Cursor Task / background agents instead of Claude Code background agents.

## Skills

- grill-with-docs
- domain-modeling (required by grill-with-docs)
- wayfinder
- prototype
- research
- setup-matt-pocock-skills
