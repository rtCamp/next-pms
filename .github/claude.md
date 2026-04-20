# next_pms — Working Notes

Working directory: `apps/next_pms`. Everything below assumes this path.
Current branch: `claude/redesign`. Active work: **next-pms module redesign**.

## Task workflow — **MANDATORY, NO-GO COMPULSORY FLOW**

> **This is a blocking workflow. Every task — FE, BE, or mixed — must follow steps 1 → 2 → 3 → 4 in order. No shortcuts, no exceptions.**
>
> - **Do not** write, edit, or create any file until step 1 is complete AND the user has explicitly approved the plan in chat.
> - **Do not** mark a task complete until step 2's browser-check subagent reports green for every section AND the full-page final check passes.
> - **Do not** re-implement any UI primitive until step 3's Storybook lookup is done and recorded in the plan.
> - **Do not** merge / hand off code that fails step 4's DRY/KISS/SOLID checklist.
>
> If any prerequisite is missing (Storybook unreachable, browser MCP not connected, Figma frame inaccessible, issue unclear), **STOP and ask the user** — do not proceed on assumptions.
>
> If the user requests a quick change that would skip any step, call it out and ask for explicit confirmation to deviate. A user saying "just do it" in a single message is **not** standing authorization to bypass this flow for future tasks.

The goal: plan first, build section-by-section with live browser feedback, reuse the design system, keep the code tight.

### 1. Plan first — share with user, wait for approval

Before editing any file, produce a **detailed, drilled-down plan** and post it for manual review. Do not start coding until the user approves.

**Where the plan lives:** always save the plan as `plan.md` at the repo root (`apps/next_pms/plan.md`) *in addition to* posting a summary in chat. Overwrite the previous `plan.md` at the start of each new task — there is only ever one active plan on disk. Do not commit `plan.md`; it's a working doc for human review (add to `.gitignore` if it surfaces in diffs).

The plan must contain:

- **Issue summary** — 2–3 lines restating what's being built, with a link to the issue/Figma.
- **Scope + out-of-scope** — explicit list of what this task will and will not change.
- **Section breakdown** — for any non-trivial page, split the page into sections (e.g. Header / Breadcrumb / View switcher / Toolbar / Table body / Row actions / Empty state / Loading state) and write a sub-plan for each. This lets us iterate section-by-section in step 2.
- **Routes / nav / store changes** — new routes, sidebar entries, global-search entries, context/store slices being added.
- **Component inventory** — for each UI piece, list the Storybook component ID you intend to reuse (from `mcp__storybook__*`). Mark each as **REUSE** (found in Storybook/design-system/frappe-ui-react) or **NEW** (needs to be created).
- **New components requiring human review** — a clearly-flagged list. If a required component isn't in Storybook/design-system/frappe-ui-react, call it out here with a proposed API (props, variants, file location) and **wait for approval** before creating it.
- **Data/API dependencies** — which whitelisted endpoints or frappe-ui-react resources this page calls; flag any BE work that must land first.
- **Acceptance criteria mapping** — map each acceptance-criteria checkbox from the issue to the section(s) that satisfy it, so nothing is missed.
- **Test plan** — what will be verified in the browser (golden path + key edge cases), and whether Playwright/visual tests need updating.

Use the TaskCreate tool to mirror the plan as trackable subtasks once approved.

### 2. Iterate section-by-section with a browser-check subagent

After plan approval, implement **one section at a time**. For each section:

1. **Main agent** writes the code for that section (FE or BE), reusing components per §3, respecting principles in §4.
2. **Rebuild** the frontend (see `## Build & dev flow`) — typically `cd apps/next_pms/frontend && npm run build:app` inside `fm shell`.
3. **Spawn a browser-check subagent** using the Agent tool (`subagent_type: general-purpose`) with the Claude-in-Chrome MCP tools available. Give it:
      - The section's acceptance criteria.
      - The exact route to navigate (e.g. `https://pms-temp.frappe.rt.gw/next-pms/project-list`).
      - The Figma frame/screenshot reference to compare against.
      - A short list of things to verify (layout matches Figma, interactive states work, no console errors, correct network calls fired).
      - Instructions to return a structured report: what passed, what failed, screenshots, console errors, network errors.
4. **Act on feedback** — fix issues the subagent surfaces before moving to the next section. The main agent keeps the feature context; the subagent only verifies.
5. **Mark the subtask completed** (TaskUpdate) when the subagent reports green and acceptance criteria are met for that section.

This split keeps the main agent's context clean (no giant screenshots / DOM dumps) and forces every section to be visually verified, not just type-checked.

### 3. Use Storybook MCP as the single source of truth for UI

The `storybook` MCP is connected at `http://localhost:6006/mcp` (tools: `mcp__storybook__*`). The `frappe-ui-react` submodule + `frontend/packages/design-system/` are the component libraries. **Reuse, don't re-invent.**

Before writing any component-like JSX:

1. Call `mcp__storybook__list-all-documentation` once per task to see what exists.
2. Call `mcp__storybook__get-documentation` for each component you plan to use — read props, variants, examples.
3. If a story exists for the exact pattern you need, use `mcp__storybook__get-documentation-for-story` to see the variant.
4. Import and compose — **do not re-implement a component that already exists**.
5. After FE changes, call `mcp__storybook__preview-stories` and include every returned preview URL in your update to the user.
6. Run `mcp__storybook__run-story-tests` after changes; fix failures before reporting success.

**If and only if** a needed component is genuinely absent from Storybook / `frappe-ui-react` / `design-system`:

- **Do not silently create it.** Add it to the plan's "New components requiring human review" list with:
  - Proposed name, file location (`frontend/packages/design-system/src/...` or `frappe-ui-react/packages/frappe-ui-react/src/...`), props, variants, and why none of the existing components fit.
- Wait for user approval, then build it with a matching story under Storybook so it's discoverable next time.
- Prefer adding to `design-system/` for next-pms-specific primitives; add to `frappe-ui-react/` only if it's genuinely reusable across rtCamp apps (changes to that submodule need cross-repo coordination).

### 4. Code quality bar — DRY, KISS, SOLID

Every change must hold up to this checklist before you call a section done:

- **DRY** — no copy-pasted component logic. Shared styles → Tailwind tokens / `cn()`; shared behavior → hooks in `frontend/packages/hooks/`; shared UI → `design-system/` or `frappe-ui-react/`.
- **KISS** — the simplest thing that satisfies the acceptance criteria. No speculative abstractions, no "future-proof" layers, no flags for states that don't exist yet.
- **SOLID**:
  - *Single responsibility* — one component = one visual/behavioral concern. Extract when a component handles two.
  - *Open/closed* — expose props/slots for variation instead of forking components.
  - *Liskov* — subcomponents honor the parent's contract (don't change prop meaning).
  - *Interface segregation* — tight, purpose-specific props; no catch-all `config` bag.
  - *Dependency inversion* — pages depend on hooks/interfaces, not on concrete API client internals; inject via props/context where it matters.
- **No silly mistakes** — before handing off a section:
  - Run the type check / build (`npm run build:app`) — must pass.
  - Open the browser via the subagent — no red console errors, no 4xx/5xx network calls the page didn't expect.
  - Re-read the diff yourself; verify no `console.log`, no dead commented code, no TODOs left unannotated.
  - Check imports — nothing unused, nothing duplicated.
- **Comments** — follow the project default: don't write them unless the *why* is non-obvious. Named identifiers document the *what*.

Only report a task complete when every section's acceptance criteria are green **and** the subagent's final full-page check passes.

### Project-local skills (in `.claude/skills/`)

These are loaded automatically. Invoke them at the listed workflow points:

- **`react-agents-review`** — run before closing any FE section (step 4). Structured pass for Rules of Hooks, stale closures, missing deps, a11y, TypeScript safety. Its output feeds the "is this section done?" gate.
- **`advanced-react-patterns`** — consult whenever a section adds `useMemo`/`useCallback`/`React.memo` or introduces global state. Enforces composition-over-memoization, moving state down, and measuring before optimizing (step 4).
- **`webapp-testing`** — **scoped to our Playwright e2e suite in `tests/e2e/`**, not the live step-2 browser-check (which uses Claude-in-Chrome MCP). Use it when writing/updating Playwright scripts or running deterministic headless regressions.

Provenance and refresh instructions: `.claude/skills/README.md`.

## Environment: Frappe Manager (fm)

This bench is managed by Frappe Manager (`fm`), a Docker-Compose based CLI. Docs: https://opensource.rtcamp.com/Frappe-Manager/dev/ (Cloudflare-gated).

- **Bench name**: `pms-temp.frappe.rt.gw` (also the site name)
- **Bench root on host**: `/home/frappe/frappe/sites/pms-temp.frappe.rt.gw/`
- **Inside containers**, bench root is mounted at `/workspace/frappe-bench/`.
- **Python**: `>=3.14,<3.15` · **Node**: `>=24` · `use_uv = true` · `developer_mode = true`.
- **fm version**: 0.19.0.

### Container layout

| Service       | Container name                                    | Purpose                    |
|---------------|---------------------------------------------------|----------------------------|
| `frappe`      | `fm__pms-temp_frappe_rt_gw__frappe`               | Main backend (bench, gunicorn) |
| `nginx`       | `fm__pms-temp_frappe_rt_gw__nginx`                | Web entrypoint             |
| `socketio`    | `fm__pms-temp_frappe_rt_gw__socketio`             | Realtime                   |
| `schedule`    | `fm__pms-temp_frappe_rt_gw__schedule`             | Scheduler + workers        |
| `redis-cache` | `fm__pms-temp_frappe_rt_gw__redis-cache`          | Cache                      |
| `redis-queue` | `fm__pms-temp_frappe_rt_gw__redis-queue`          | Queue                      |

### Useful fm commands
- `fm shell pms-temp.frappe.rt.gw` — shell into frappe container as frappe user
- `fm shell pms-temp.frappe.rt.gw -c "bench --version"` — one-shot command
- `fm shell pms-temp.frappe.rt.gw -- bench --site pms-temp.frappe.rt.gw migrate` — passthrough args
- `fm shell pms-temp.frappe.rt.gw <<'EOF' ... EOF` — multi-line via heredoc
- `fm shell pms-temp.frappe.rt.gw --user root` / `--service nginx --user nginx` — alt user/service
- `fm shell pms-temp.frappe.rt.gw --bench-console --site pms-temp.frappe.rt.gw` — IPython with frappe context
- `fm logs pms-temp.frappe.rt.gw -f` / `--service nginx -f` — follow logs
- `fm restart pms-temp.frappe.rt.gw` — web + workers via supervisor
- `fm restart --web --no-workers` / `--nginx` / `--container` / `--supervisor` — scoped restarts
- `fm list` / `fm info pms-temp.frappe.rt.gw` / `fm start|stop` — other ops

## App layout
apps/next_pms/
├── next_pms/              # Python / Frappe module (hooks.py, doctypes, api, www, ...)
│   ├── hooks.py, api/, timesheet/, resource_management/, project_currency/
│   ├── public/            # built frontend assets served from here
│   ├── www/, patches.txt
├── frontend/              # React app (npm workspaces, Vite 6, React 19, Tailwind 4)
│   ├── package.json       # workspace root: name "next-pms"
│   ├── vite.config.ts
│   └── packages/
│       ├── app/           # @next-pms/app — main SPA
│       ├── design-system/ # shared UI primitives (shadcn-style)
│       └── hooks/         # shared hooks
├── frappe-ui-react/       # git submodule — shared rtCamp UI kit (pnpm workspace)
├── tests/                 # Playwright e2e + visual tests
├── package.json, pyproject.toml, .gitmodules

## Build & dev flow

Always run these **inside the frappe container** via `fm shell` (host may not have matching Node/pnpm/uv).

# Dev (Vite dev server on the app package)
fm shell pms-temp.frappe.rt.gw <<'EOF'
cd apps/next_pms && npm run dev
EOF

# Full build (submodule update + frappe-ui-react + frontend)
fm shell pms-temp.frappe.rt.gw <<'EOF'
cd apps/next_pms && npm run build
EOF

# Frontend-only rebuild (skip submodule/ui-react if unchanged)
fm shell pms-temp.frappe.rt.gw <<'EOF'
cd apps/next_pms/frontend && npm install && npm run build:app
EOF

# After touching Python / hooks / doctypes
fm shell pms-temp.frappe.rt.gw -- bench --site pms-temp.frappe.rt.gw migrate
fm restart pms-temp.frappe.rt.gw

Top-level `package.json` `build` script = `git submodule update --init --recursive && pnpm (frappe-ui-react) install + build && npm (frontend) install + build`. Per README: "If using frappe-manager, you might require `fm restart` to provision the worker queues."

## Site access

- Site URL: https://pms-temp.frappe.rt.gw
- **Next PMS SPA mount**: `/next-pms/` (see `website_route_rules` in `next_pms/hooks.py`). Default landing: `/next-pms/timesheet`.
- Left-nav sections in the SPA: Home, Tasks, Projects, **Timesheet** (Personal / Team / Projects), Allocations, Roadmap, Reports.
- Redirect: `/timesheet` → `/next-pms/timesheet` (`website_redirects`).
- Dev login (username only — ask the user for the password each session; never store secrets here): `ayush.nirwal@rtcamp.com`.
- DB name: `fm_pms_temp_frappe_rt_gw_563af3bec9cff2dd` (in `bench_config.toml`)
- Site config: `workspace/frappe-bench/sites/pms-temp.frappe.rt.gw/site_config.json`
- Admin tools creds are in `bench_config.toml` (admin_tools_username/password).

## GitHub access

- `gh` CLI is installed on the host at `/usr/bin/gh`. Use it for repo/PR/issue work on `rtCamp/next-pms`, `rtCamp/frappe-ui-react`, and `rtCamp/Frappe-Manager`.
- **If `gh auth status` reports not logged in**, ask the user to run `gh auth login` (or export `GH_TOKEN`) before attempting PR/issue operations.
- `gh` is NOT installed inside the frappe container — run gh from the host.

## Current git state (snapshot — verify with `git status`)

- Branch: `claude/redesign`
- Modified: `frappe-ui-react` submodule (new commits), `frontend/package-lock.json`
- Untracked: `yarn.lock` (note: app uses npm workspaces top-level and pnpm for frappe-ui-react — a stray yarn.lock likely shouldn't be committed)