# projeto 01

React + TypeScript + Vite app. Backend data lives in Supabase.

## Agent skills

### Issue tracker

GitHub Issues on `rafaelvelho/projeto-01` via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

### Installed engineering skills (Cursor)

Project skills live in `.cursor/skills/` (Cursor Agent Skills). Claude/Codex `agents/` config was intentionally omitted.

| Skill | When to use |
|-------|-------------|
| `grill-with-docs` | Pressure-test a plan/design; build glossary + ADRs as you go ("grillme") |
| `domain-modeling` | Maintain `CONTEXT.md` / ADRs while designing |
| `wayfinder` | Plan work too big for one session as a map of decision tickets |
| `prototype` | Throwaway UI or logic prototype to answer a design question |
| `research` | Investigate primary sources; write a cited note in the repo |
| `setup-matt-pocock-skills` | Re-run repo wiring (tracker / domain docs) |

Invoke by name in chat, e.g. "use grill-with-docs" or "run wayfinder on this idea".
