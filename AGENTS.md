# Agent guide — next-pms

next-pms is a Frappe app (projects, timesheets, allocations, reports) with a Vue 3 + frappe-ui frontend. The
frontend is being rewritten from React; see [`frontend/AGENTS.md`](frontend/AGENTS.md) for everything about it.

## Layout

| Path | What |
|---|---|
| `next_pms/` | Frappe app (Python): doctypes, whitelisted APIs in `*/api/`, `hooks.py`, `patches.txt` |
| `next_pms/www/next-pms/` | Page that serves the SPA at `/next-pms` and passes boot data |
| `frontend/` | Vue app — start at [`frontend/AGENTS.md`](frontend/AGENTS.md) |
| `tests/` | Playwright e2e and visual tests |
| `.agents/skills/` | Agent skills (also linked from `.claude/skills/`), pinned in `skills-lock.json` |

## Backend commands (from the bench root)

- After changing doctypes, hooks or patches: `bench --site <site> migrate`, then restart the bench.
- Python is formatted and linted by the pre-commit hooks (ruff); run them before committing.

## Conventions

- Conventional Commits (`feat(scope): …`, `fix: …`), checked by commitlint.
- Don't change backend APIs as part of frontend work; it needs its own task.
- Don't commit plan files, scratch notes or `CLAUDE.local.md`.
