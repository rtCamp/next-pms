# Agent guide — next-pms frontend

The next-pms UI is being rewritten from React to **Vue 3 + frappe-ui**. This file is the index for any coding agent
working in `frontend/`. Read it first, then the documents it points to.

## Read order

1. This file.
2. [`PHILOSOPHY.md`](PHILOSOPHY.md) — numbered rules (P1, P2, …). Cite them by ID in PRs and reviews.
3. [`CONTEXT.md`](CONTEXT.md) — what domain and app terms mean, and the names to avoid.
4. The `frappe-ui` skill (`.agents/skills/frappe-ui/`) before writing any markup or data code.

When sources disagree: **PHILOSOPHY > CONTEXT > existing code**. Code is evidence, not authority. If a rule gives a
clearly wrong answer, propose an edit to the rule instead of carving a quiet exception.

## Stack

Vue 3 (`<script setup lang="ts">`), frappe-ui 1.0, Vue Router 4, Tailwind 3.4 with the frappe-ui preset, Vite 7,
Storybook 10 (Vue 3 + Vite) with the MCP, Docs and Vitest addons.

## Commands (run in `frontend/`)

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on port 5173, proxying API calls to the Frappe site |
| `npm run build` | Production build into `../next_pms/public/frontend` and `../next_pms/www/next-pms/index.html` |
| `npm run type-check` | `vue-tsc --noEmit` |
| `npm run storybook` | Storybook on port 6006 (also serves the Storybook MCP at `/mcp`) |
| `npm run test-storybook` | Runs every story as a test in headless Chromium (Vitest) |
| `npm run build-storybook` | Static Storybook in `storybook-static/` |

## Layout

```
src/
  main.ts          app entry: boot data, frappe-ui config, socket, router
  boot.ts          login check and boot data (fetched from the server on the dev server)
  socket.ts        realtime socket; use useSocket() in components
  router.ts        routes, based at /next-pms
  pages/           one folder per URL segment
  components/      components frappe-ui lacks, one folder each:
    MonthPicker/   MonthPicker.vue, MonthPicker.stories.ts, types.ts, index.ts
    Card/  CircularProgressBar/  ColumnSelector/  Filter/  TaskStatus/
    Timesheet/     timesheet rows (HeaderRow, WeekRow, MemberRow, ProjectRow, TaskRow, TimeOffRow, TotalRow)
```

`icons/` (next to `src/`) is for custom icons lucide lacks. It's empty: use `lucide-*` class icons (P4).

Never edit the build output in `../next_pms/public/frontend` by hand.

## Tools

- **Skills** in `.agents/skills/` (symlinked into `.claude/skills/`): `frappe-ui` for any UI or data code;
  `vue-best-practices`, `vue-router-best-practices`, `vue-testing-best-practices`, `vue-debug-guides`,
  `create-adaptable-composable` for Vue questions. Versions are pinned in `skills-lock.json`; update with
  `npx skills update`.
- **Storybook MCP** at `http://localhost:6006/mcp` (needs `npm run storybook` running): `docs-list` / `docs-show`
  to look up our components, `test-run` to run story tests, `stories-preview` for links to share.
- **Browser checks** run against the Vite URL. If the page redirects to the Frappe login, ask the human to log in;
  never fill in the login form yourself.

## Working rules

- Build from frappe-ui first; add a component under `src/components/` only for a real gap (P1).
- Every component ships stories, and its behaviour is covered by interaction stories (P5).
- Before handing off: `npm run type-check`, `npm run test-storybook -- --run`, and Prettier on changed `.ts`/`.js`
  files, as CI runs it (P10).
- Keep routes and backend endpoints unchanged while the rewrite is in progress (P8).

## Do not

- Add React, `frappe-ui-react` or another UI kit.
- Call the server with `fetch` or axios; use the frappe-ui composables (P3).
- Hard-code colours or reach for raw Tailwind palettes; use the semantic tokens (P4).
- Port the frappe-ui-react custom icon set or add an icon library; use `lucide-*` icons, and ask before adding one
  to `icons/` (P4).
- Make broad refactors, rename public APIs or change backend code unless asked.
