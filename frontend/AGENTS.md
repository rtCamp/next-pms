# Agent guide — next-pms frontend

The next-pms frontend is a Vue 3 + frappe-ui single-page app for timesheets, projects and resource management,
served by the Frappe app at `/next-pms`. This file is the index for any coding agent working in `frontend/`.

## Read order

1. This file.
2. [`CONTEXT.md`](CONTEXT.md) — what domain and app terms mean, and the names to avoid.
3. [`PHILOSOPHY.md`](PHILOSOPHY.md) — numbered rules (P1, P2, …). Cite them by ID in PRs and reviews.
4. [`src/components/Components.md`](src/components/Components.md) — before adding or changing a component.

When sources disagree:

- **Implementation:** PHILOSOPHY > CONTEXT > existing code > frappe-ui source
  (`node_modules/frappe-ui/src/`) > the `frappe-ui` skill > other skills > other Frappe apps (CRM, Helpdesk,
  Gameplan). Take patterns from those apps, never their dependency choices: they still use vuedraggable, Pinia and
  `createResource`.
- **Behaviour:** the React app on the `develop` branch is the spec.

Code is evidence, not authority. If a rule gives a clearly wrong answer, propose an edit to the rule instead of
carving a quiet exception.

## Stack

Vue 3 (`<script setup lang="ts">`), frappe-ui 1.0, Vue Router 4, Tailwind 3.4 with the frappe-ui preset, Vite 7,
Storybook 10 (Vue 3 + Vite) with the MCP, Docs, Vitest, A11y and Themes addons, class-variance-authority and `cn`
(P17). Node 22 or newer.

## Commands (run in `frontend/`)

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on port 5173, proxying API calls to the Frappe site |
| `npm run build` | Production build into `../next_pms/public/frontend` and `../next_pms/www/next-pms/index.html` |
| `npm run type-check` | `vue-tsc --noEmit` |
| `npm run lint` / `lint:fix` | ESLint over `.vue`, `.ts` and stories: Vue, TypeScript, Storybook, Tailwind class, accessibility and composable rules; formatting is Prettier's |
| `npm run storybook` | Storybook on port 6006 (also serves the Storybook MCP at `/mcp`) |
| `npm run test-storybook` | Runs every story as a test in headless Chromium (Vitest), including an accessibility check |
| `npm run test-unit` | Runs the `*.test.ts` unit tests under `src/` (helpers, composables, page logic, `GanttGrid`'s geometry) in headless Chromium (Vitest) |
| `npm run build-storybook` | Static Storybook in `storybook-static/` |

## Layout

```
src/
  main.ts          app entry: boot data, frappe-ui config, theme seeding, socket, router
  App.vue          the shell: loading screen, session error page, sidebar, and each page in an ErrorFallback;
                   provides the app's notifications (provideNotifications)
  boot.ts          login check and boot data (fetched from the server on the dev server)
  socket.ts        realtime socket; use useSocket() in components
  versionUpdate.ts the "New version available" toast on the realtime version-update event
  router.ts        routes, based at /next-pms, and the navigation guards (employee and role checks)
  router-meta.d.ts route meta: title, roles, standalone
  session/         useSession(): the signed-in user, roles and employee record; ROLE_ACCESS, hasAnyRole
  layout/          AppSidebar (frappe-ui Sidebar) with the search palette (GlobalSearch, Mod+K), the notification
                   tray and the Settings dialog; AppSidebarSection, the nav links and search pages
                   (sidebarSections.ts), the Apps menu (apps.ts), usePreloadRoute (loads a page's code on hovering
                   its link), StatusMessage for the status pages and SessionError; settings/ holds the Settings
                   dialog's panels and the Timesheet Settings form helpers (systemSettings.ts, with unit tests)
  pages/           route components; WorkInProgress stands in for pages not rebuilt yet. A rebuilt page gets a
                   folder (pages/tasks/, pages/projects/): the route component, its parts and dialogs, cells/, and
                   page-only use* composables (provide/inject state, filters and columns kept in the URL);
                   pages/projects/ also has kanban/ and views/ (saved views)
                   Views that share a shell keep the shared parts at the folder root and one subfolder per view
                   (pages/timesheet/: layout, filters, dialogs; personal/, team/, project/). pages/allocations/
                   puts them in shared/ (layout, URL state, paged loading with the realtime refresh, the Add / Edit,
                   Edit schedule and delete dialogs, and pure .ts modules with unit tests) beside team/ and project/;
                   its dialogs have no stories
                   A page with tabs keeps the shell at the folder root and one subfolder per tab
                   (pages/project-details/: the shell, useProjectDetails, the shared RichTextEditor,
                   useProjectComments, LoadError and createOwnWrites (skips a write's own realtime echo);
                   about/ for the About sidebar; calendar/ (provideTimeline, the month grid, TimelineGantt,
                   the tables, the one TimelineItemDialog and the pure calendar.ts with unit tests); email/,
                   feedback/, growth/ (provideGrowth, the group list's cells, the ?growth= detail with its
                   action items and activity, the Create / Edit initiative and update dialogs, and the pure
                   growth.ts with unit tests), notes/ (provideNotes, the cards, the ?note= detail with its
                   read-only task toggles, NoteEditor for the editor child routes, the template picker and
                   save-template dialogs, and the pure notes.ts with unit tests), overview/, rag-stats/,
                   reports/, risks/
                   (provideRisks, the group list's cells, the ?risk= detail, the Create / Edit risk and update
                   dialogs, and the pure risks.ts with unit tests), shared/ (what Risks and Growth share:
                   owner-gated permissions, the update log helpers, follow, followers, attachments and upload,
                   the linked-ToDo delete check, the group list, the update entry, the activity section and the
                   pills, with unit tests for the pure .ts), to-do/
                   (also the ToDo linking the other tabs reuse: LinkedTodos, LinkedChip), tracking/, …)
  components/      components frappe-ui lacks, one folder each; see components/Components.md
  composables/     shared use* composables: lookups, the like toggle, URL query updates, editor attributes,
                   values saved in localStorage (useSavedState), notifications (useNotifications reads the shell's),
                   the user's PMS settings (usePmsSettings), infinite scroll, project phases,
                   the unsaved changes guard, realtime updates (useDocUpdates for one document,
                   useDoctypeListUpdates for a doctype's list)
  icons/           custom icons lucide lacks, as Vue SFCs exported from icons/index.ts; everything else uses lucide-* (P4)
  utils/           helpers shared by components and pages (date.ts, text.ts, cn.ts); add one only when something needs it
```

**Imports.** `@/` is `src/` (set in `vite.config.ts` and `tsconfig.json`). Import from another folder with `@/`, e.g.
`import { useSession } from "@/session"`; keep `./` for files in the same folder, and never climb with `../`.

**Routes.** Give each route a `meta.title` (the tab title), and `meta.roles` from `ROLE_ACCESS` when only some
roles may open it. The `beforeEach` guard in `router.ts` sends users without an Employee record to `/no-employee`
and users without a role to `/no-access`; when the session lookups fail, `App.vue` shows SessionError (Retry,
Log out) instead of the page. `meta.standalone` marks a status page: no sidebar, no guard checks.
`meta.scroll: false` hands scrolling to the page (DesktopShell stops scrolling it), for pages whose header or toolbar
stays put while a pane scrolls, like the task list's rows. The note editor routes are children of `project-details`:
the page shows them in place of its tabs, and `App.vue` keys the route view by project (`project:<id>`) rather than
by path, so opening the editor doesn't remount the page while another project still does.

Never edit the build output in `../next_pms/public/frontend` by hand.

## Tools

- **Skills** in `.agents/skills/` (symlinked into `.claude/skills/`): `frappe-ui` for any UI or data code;
  `vue-best-practices`, `vue-router-best-practices`, `vue-debug-guides`, `create-adaptable-composable` for Vue
  questions; `port-frappe-ui-react-component` (ours) for porting React components, and its "Translate the tokens"
  section before copying any class from React code (pages too). Vendored versions are pinned in
  `skills-lock.json`; update with `npx skills update`, which overwrites local edits, so corrections go in
  [Skill overrides](#skill-overrides) below.
- **Storybook MCP** at `http://localhost:6006/mcp` (needs `npm run storybook` running): `docs-list` / `docs-show`
  to look up our components, `test-run` to run story tests, `stories-preview` for links to share.
- **Vue DevTools** on the dev server (`vite-plugin-vue-devtools`): Alt+Shift+D in the page, or
  `/__devtools__/`. It shows components, router and timeline. frappe-ui has no DevTools panel of its own; a
  `useCall`/`useList`/`useDoc` result is a reactive object, so read its `data`, `loading` and `error` in the
  component's setup state (`useList` also takes `debug: true`). The `vue-debug-guides` skill covers reactivity and
  async debugging.
- **Page checks** are Playwright e2e tests in `../tests/e2e/` (`npm run e2e:tests` from the repo root), not manual
  browser checks. Never fill in the Frappe login form yourself.

## Skill overrides

These win over the vendored skills.

- **vue-testing-best-practices** doesn't apply here. Components are tested with Storybook stories with `play`
  functions (P5, P6), not Vue Test Utils. The shared helpers in `src/utils/` get a sibling `*.test.ts`, run by
  browser Vitest (`npm run test-unit`), not node Vitest. A component's own `utils.ts` is covered by its stories,
  unless its logic is big enough to need tests of its own, like `GanttGrid`'s date and bar geometry.
- **vue-best-practices**: read its reference files only when a task needs one, not all of them up front. Components
  follow the folder layout in [`src/components/Components.md`](src/components/Components.md), not its feature
  folders.
- **frappe-ui composables**: never create a `useCall` inside an event handler. Create it in `setup` with
  `immediate: false` and call `submit()` from the handler.
- **frappe-app-dev** is for backend work only. Its frontend references (`fetch`, yarn, Desk's `frappe.call`) don't
  apply to `frontend/`.
- **frappe-ui skill errors**:
  - `CORE.md` says `Dialog` has no `theme` prop. It has one in 1.0 (`Dialog/types.ts`).
  - `DATA.md` says `submit()` returns before the request when `refetch: true`. It awaits the request in both modes
    (`useCall.ts`).
- **frappe-ui skill mapping**: use our `MonthPicker` for picking a month, not `Select` as the skill suggests.
- **Accordions with header actions**: frappe-ui's experimental `Accordion` renders `item-suffix` inside the trigger
  button, so an action there nests a button in a button. The About sidebar builds its sections from reka-ui's
  Accordion parts instead, with the actions beside the trigger (`pages/project-details/about/SidebarSection.vue`).

## Working rules

- Build from frappe-ui first; add a component under `src/components/` only for a real gap (P1).
- Every component ships stories, and its behaviour is covered by interaction stories (P5).
- Add an npm dependency when it is truly needed or clearly improves the code or the UX, and say why in the PR or
  report.
- Every helper in `src/utils/` has unit tests in a sibling `*.test.ts`.
- Before handing off: `npm run lint`, `npm run type-check`, `npm run test-unit -- --run`,
  `npm run test-storybook -- --run`, and Prettier on changed files (P10).
- Don't change routes or backend endpoints as part of frontend work; that needs its own task.

## Do not

- Add React or another UI kit alongside frappe-ui.
- Call the server with `fetch` or axios; use the frappe-ui composables (P3).
- Add Pinia or another store library; shared state goes in a composable over frappe-ui calls, like `useSession()`.
- Restyle frappe-ui's `Sidebar` parts beyond matching the React sidebar's layout. `AppSidebarSection` draws its own
  section heading and indents its items to match React; everything else composes frappe-ui's parts as they are.
- Hard-code colours or reach for raw Tailwind palettes; use the semantic tokens (P4).
- Add an icon library; use `lucide-*` icons, and ask before adding one to `src/icons/` (P4).
- Make broad refactors, rename public APIs or change backend code unless asked.
