# Agent guide — next-pms frontend

The next-pms frontend is a Vue 3 + frappe-ui single-page app for timesheets, projects and resource management,
served by the Frappe app at `/next-pms`. This file is the index for any coding agent working in `frontend/`.

## Read order

1. This file.
2. [`CONTEXT.md`](CONTEXT.md) — what domain and app terms mean, and the names to avoid.
3. [`PHILOSOPHY.md`](PHILOSOPHY.md) — numbered rules (P1, P2, …). Cite them by ID in PRs and reviews.
4. [`src/components/Components.md`](src/components/Components.md) — before adding or changing a component.

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
| `npm run lint` / `lint:fix` | ESLint (Vue, TypeScript and Storybook rules) over `.vue`, `.ts` and stories; formatting is Prettier's |
| `npm run storybook` | Storybook on port 6006 (also serves the Storybook MCP at `/mcp`) |
| `npm run test-storybook` | Runs every story as a test in headless Chromium (Vitest) |
| `npm run build-storybook` | Static Storybook in `storybook-static/` |

## Layout

```
src/
  main.ts          app entry: boot data, frappe-ui config, socket, router
  boot.ts          login check and boot data (fetched from the server on the dev server)
  socket.ts        realtime socket; use useSocket() in components
  router.ts        routes, based at /next-pms, and the navigation guards (employee and role checks)
  router-meta.d.ts route meta: title, roles, standalone
  session/         useSession(): the signed-in user, roles and employee record; ROLE_ACCESS, hasAnyRole
  layout/          AppSidebar (frappe-ui Sidebar) and StatusMessage for the status pages
  pages/           route components; WorkInProgress stands in for pages not rebuilt yet
  components/      components frappe-ui lacks, one folder each; see components/Components.md
  utils/           helpers shared by components and pages (date.ts, text.ts); add one only when something needs it
```

`icons/` (next to `src/`) holds custom icons lucide lacks, as Vue SFCs exported from `icons/index.ts`. Everything
else uses `lucide-*` class icons (P4).

**Routes.** Give each route a `meta.title` (the tab title), and `meta.roles` from `ROLE_ACCESS` when only some
roles may open it. The `beforeEach` guard in `router.ts` sends users without an Employee record to `/no-employee`
and users without a role to `/no-access`. `meta.standalone` marks a status page: no sidebar, no guard checks.

Never edit the build output in `../next_pms/public/frontend` by hand.

## Tools

- **Skills** in `.agents/skills/` (symlinked into `.claude/skills/`): `frappe-ui` for any UI or data code;
  `vue-best-practices`, `vue-router-best-practices`, `vue-testing-best-practices`, `vue-debug-guides`,
  `create-adaptable-composable` for Vue questions; `frappe-app-dev` for backend Frappe work. Versions are pinned in `skills-lock.json`; update with
  `npx skills update`.
- **Storybook MCP** at `http://localhost:6006/mcp` (needs `npm run storybook` running): `docs-list` / `docs-show`
  to look up our components, `test-run` to run story tests, `stories-preview` for links to share.
- **Vue DevTools** on the dev server (`vite-plugin-vue-devtools`): Alt+Shift+D in the page, or
  `/__devtools__/`. It shows components, router and timeline. frappe-ui has no DevTools panel of its own; a
  `useCall`/`useList`/`useDoc` result is a reactive object, so read its `data`, `loading` and `error` in the
  component's setup state (`useList` also takes `debug: true`). The `vue-debug-guides` skill covers reactivity and
  async debugging.
- **Browser checks** run against the Vite URL. If the page redirects to the Frappe login, ask the human to log in;
  never fill in the login form yourself.

## Working rules

- Build from frappe-ui first; add a component under `src/components/` only for a real gap (P1).
- Every component ships stories, and its behaviour is covered by interaction stories (P5).
- Before handing off: `npm run lint`, `npm run type-check`, `npm run test-storybook -- --run`, and Prettier on changed `.ts`/`.js`
  files, as CI runs it (P10).
- Don't change routes or backend endpoints as part of frontend work; that needs its own task.

## Do not

- Add React or another UI kit alongside frappe-ui.
- Call the server with `fetch` or axios; use the frappe-ui composables (P3).
- Add Pinia or another store library; shared state goes in a composable over frappe-ui calls, like `useSession()`.
- Restyle frappe-ui's `Sidebar` parts; compose them as they are.
- Hard-code colours or reach for raw Tailwind palettes; use the semantic tokens (P4).
- Add an icon library; use `lucide-*` icons, and ask before adding one to `icons/` (P4).
- Make broad refactors, rename public APIs or change backend code unless asked.
