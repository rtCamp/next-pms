# next_pms — Working Notes

Working directory: `apps/next_pms`. Everything below assumes this path.
Active work: **next-pms module redesign** (runs on the `feat/redesign` integration branch — see §5 for branching rules).

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

**Where the plan lives:** save the plan as `plan_issue_<issue_number>.md` at the repo root (e.g. `apps/next_pms/plan_issue_1194.md`) *in addition to* posting a summary in chat. One plan file per issue — no overwriting across tasks, since the filename is keyed on the issue number. For ad-hoc work without an issue number, use `plan_<short-slug>.md`. **Never commit plan files** — they are working docs for human review. `.gitignore` already covers `plan.md` and `plan_issue_*.md` / `plan_*.md`; verify `git status` does not list the plan file as staged before any commit.

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

### 5. Before creating a PR — base, feature trunk, size, reviewers

Hard rules. Never open a PR that violates any of these:

1. **Base branch is always `feat/redesign`.** Never open PRs against `main` for this work. The redesign lands on `main` in larger drops; individual task PRs go to `feat/redesign`.
2. **Head branch is a feature trunk named `claude/feat/<trunk-name>`.** One trunk per feature/task (e.g. `claude/feat/projects-page`, `claude/feat/timesheet-filters`). Cut the trunk off the latest `upstream/feat/redesign`. Do not pile unrelated work onto a catch-all branch like `claude/redesign`. Reuse the same trunk for follow-up sequential PRs within the same feature.
3. **Size cap: ≤ 15 files AND ≤ 1000 LOC changed per PR.** If the planned diff will exceed either threshold, split into **sequential stacked PRs** before implementing:
   - Phase the work in the plan file (`plan_issue_<n>.md`) so each phase is its own independently-reviewable PR with a clear boundary (e.g. "Phase 1: routing + placeholders", "Phase 2: list table", "Phase 3: kanban board").
   - PR #1 bases on `feat/redesign`. PR #2 bases on the head of PR #1 (stacked). Each PR in the chain targets `feat/redesign` as its merge target but may be chained off the previous PR's branch so the diff stays minimal.
   - Do not open a single monster PR and "promise to split later" — split first.
4. **Always add `ayushnirwal` as a reviewer** on `gh pr create` (`--reviewer ayushnirwal`).
5. **If the base advances mid-flight, rebase — don't merge.** Run `git rebase upstream/feat/redesign` and `git push --force-with-lease`. Never merge `feat/redesign` back into the PR branch; that pollutes the diff.
6. **Before running `gh pr create`**: confirm `git diff --stat upstream/feat/redesign..HEAD` shows only the files this PR is supposed to touch and the file/line counts fall under the size cap. If a stale base has padded the diff, rebase first.

### 6. After creating a PR — wait for AI review + CI, then triage

The repo has AI review bots (e.g. CodeRabbit) plus GitHub Actions CI. Both post results a few minutes after a PR opens. Whenever you run `gh pr create`, follow this protocol before declaring the PR "ready":

1. **Sleep ~10 minutes** after PR creation so the AI bots and CI jobs finish. (Use a background Bash sleep or equivalent — do not poll in a tight loop.)
2. **Pull the full PR state**:
   - Reviews & summary comments: `gh pr view <pr> --json reviews,comments`
   - Inline file comments: `gh api repos/:owner/:repo/pulls/:num/comments`
   - CI checks: `gh pr checks <pr>` (or `gh pr view <pr> --json statusCheckRollup`)
3. **Triage every signal** — don't silently ignore anything:
   - **AI review comment, valid** — fix locally, commit on the same branch, push. The bot usually resolves the thread automatically once the offending code is gone.
   - **AI review comment, not valid** — reply on the thread explaining why the current implementation is correct. Cite the acceptance criteria, the plan, the Figma frame, or the architectural reason. Never silently ignore an AI comment.
   - **Failing CI check caused by the PR's diff** — treat as a blocker. Read the failing job log (`gh run view <run-id> --log-failed`), reproduce locally if needed, fix, commit, push. Do not merge or hand off until CI is green for changes the PR introduced. To decide whether a failure is PR-caused, compare the failing file paths / test names / line numbers against the PR's own diff — if the failure touches code this PR changed (or its direct dependents), it's PR-caused.
   - **Failing CI check unrelated to the PR's diff** (pre-existing breakage, infra flake, unrelated config, missing secret) — leave a comment on the PR explicitly noting the failure is pre-existing and not introduced by this PR, with a short reason / link to the failing job. This tells the human reviewer it's safe to ignore. Do not attempt to fix unrelated CI issues in the same PR.
4. **Only after every AI thread has been addressed or answered AND all PR-related CI failures are resolved** should you notify the human reviewer that the PR is ready.

**CI checks to ignore for now** — the following workflows/jobs are explicitly out-of-scope for the redesign work. Do not try to fix their failures, do not block a PR on them, and do not leave long-winded "pre-existing" comments about them — a one-liner pointing at this list is enough:

| Workflow file | Display name | Job(s) | Why ignored |
|---|---|---|---|
| `.github/workflows/e2e-playwright-test.yml` | **Playwright Tests** | `get-branch`, `deploy`, `test` | End-to-end Playwright suite against a deployed preview site. Triggered on `pull_request_review` / `schedule`. Not part of the redesign scope; URL / data assumptions in the tests often lag the redesign branch. |
| `.github/workflows/visual-test-playwright.yml` | **Visual Regression Tests** | `run-visual-tests` (*Run Visual Tests*) | Playwright-based visual snapshot regression. Baselines are captured against pre-redesign UI, so every redesign PR is expected to show diffs until the baselines are refreshed post-redesign. |
| `.github/workflows/linter.yml` | **Linters** | `pre-commit` (*Frappe Linter*) | Pre-commit runs `semgrep` security rules over the whole repo (~70+ findings live on `feat/redesign` in `next_pms/**/*.py`). Findings are pre-existing backend security items unrelated to the frontend redesign and have their own dedicated hardening cleanup. The JS/TS parts of this workflow (JS/TS Formatter, ESLint React, ESLint JS) are already gated by `Frontend Build Test`, so a red Frappe Linter does not mean frontend lint regressed. |

Everything outside that table still goes through the normal PR-caused-vs-pre-existing triage in step 3 (e.g. Frontend Build Test, Bench-Build-Test, CodeQL, Vulnerable Dependency Check, WIP).

### Project conventions learned from reviews

Apply these pre-emptively rather than re-learning them in review. Each rule here comes from an actual correction a maintainer made on a past PR.

**Page file layout**
- **Folder name follows the URL segment, not the repo's singular default.** If the route is `/projects`, the directory is `pages/projects/` (plural). Don't default to singular just because sibling folders happen to be (`task/`, `report/`, etc.) — look at the route. (PR #1208 correction: `pages/project/` → `pages/projects/`.)
- **Each `pages/<feature>/` has a dedicated `constants.ts` and a dedicated `types.ts`.** `constants.ts` holds feature data constants (e.g. a `VIEWS` array); `types.ts` holds shared types derived from or referenced alongside them (e.g. `ViewKey`). Don't co-locate types with constants in a single file, and don't inline either in the component.
- **Main page component is `index.tsx`, exporting a component named after the feature.** E.g. `pages/projects/index.tsx` exporting `Projects`. Only call a file `layout.tsx` when it is an actual React-Router route layout wrapping `<Outlet />` children (the `allocations/layout.tsx` pattern). A route that conditionally renders children based on a query param is **not** a layout — don't mechanically mirror the Allocations file structure if the routing shape is different.
- **Placeholder/child view components stay next to `index.tsx`** (e.g. `list.tsx`, `kanban.tsx` alongside `index.tsx`) unless a maintainer explicitly asks for a `components/` subdirectory. Review feedback sometimes mentions a `components/` directory in passing — only create it if the reviewer's *fix commit* actually uses it.

**UI details**
- **Icon identifiers must be verified against Figma metadata or a design-system story — never inferred by eyeballing a thumbnail.** `AlignLeft` vs `List` vs `TextAlignStart` look similar enough to confuse, and even a reviewer's suggested name can be wrong. When the exact lucide icon isn't obvious from Figma, ask the maintainer instead of guessing. (PR #1208 correction: `List` → `AlignLeft`.)

### Reading review comments
- **Path anchor vs body text** — GitHub shows each inline comment against a file path. When the anchor says `pages/projects/index.tsx` but the body text mentions `pages/project/...`, the anchor is the intent; treat the body path as a typo.
- **Fix commits trump earlier comments.** If a reviewer's comment says "do X" but their own follow-up commit on the branch doesn't include X, the commit wins — pull their actual changes rather than retrofitting the comment literally. Always `git fetch` before starting a round of fixes, and check whether the reviewer already pushed commits addressing their own feedback.

### Project-local skills (in `.claude/skills/`)

These are loaded automatically. Invoke them at the listed workflow points:

- **`react-agents-review`** — run before closing any FE section (step 4). Structured pass for Rules of Hooks, stale closures, missing deps, a11y, TypeScript safety. Its output feeds the "is this section done?" gate.
- **`advanced-react-patterns`** — consult whenever a section adds `useMemo`/`useCallback`/`React.memo` or introduces global state. Enforces composition-over-memoization, moving state down, and measuring before optimizing (step 4).
- **`webapp-testing`** — **scoped to our Playwright e2e suite in `tests/e2e/`**, not the live step-2 browser-check (which uses Claude-in-Chrome MCP). Use it when writing/updating Playwright scripts or running deterministic headless regressions.

Provenance and refresh instructions: `.claude/skills/README.md`.

## Environment: Frappe Manager (fm)

This bench is managed by [Frappe Manager](https://github.com/rtCamp/Frappe-Manager) (`fm`), a Docker-Compose based CLI.
Docs: https://opensource.rtcamp.com/Frappe-Manager/dev/ (Cloudflare-gated — open in browser).

- **Bench name**: `pms-temp.frappe.rt.gw` (also the site name)
- **Bench root on host**: `/home/frappe/frappe/sites/pms-temp.frappe.rt.gw/`
- **Inside containers**, the bench root is mounted at `/workspace/frappe-bench/` (the host's `./workspace` → container `/workspace`).
- **Python**: `>=3.14,<3.15` · **Node**: `>=24` · `use_uv = true` · `developer_mode = true` (from `bench_config.toml`).
- **fm version**: 0.19.0.

### Container layout (from `docker-compose.yml`)

| Service       | Container name                                    | Purpose                    |
|---------------|---------------------------------------------------|----------------------------|
| `frappe`      | `fm__pms-temp_frappe_rt_gw__frappe`               | Main backend (bench, gunicorn) |
| `nginx`       | `fm__pms-temp_frappe_rt_gw__nginx`                | Web entrypoint             |
| `socketio`    | `fm__pms-temp_frappe_rt_gw__socketio`             | Realtime                   |
| `schedule`    | `fm__pms-temp_frappe_rt_gw__schedule`             | Scheduler + workers        |
| `redis-cache` | `fm__pms-temp_frappe_rt_gw__redis-cache`          | Cache                      |
| `redis-queue` | `fm__pms-temp_frappe_rt_gw__redis-queue`          | Queue                      |

### Useful fm commands (run from host)

```bash
# Shell into the frappe container as the frappe user (default service = frappe)
fm shell pms-temp.frappe.rt.gw

# Run a one-shot command inside the frappe container
fm shell pms-temp.frappe.rt.gw -c "bench --version"
fm shell pms-temp.frappe.rt.gw -- bench --site pms-temp.frappe.rt.gw migrate

# Run multi-line commands via heredoc
fm shell pms-temp.frappe.rt.gw <<'EOF'
cd apps/next_pms
npm run build
EOF

# Shell as root, or into a different service
fm shell pms-temp.frappe.rt.gw --user root
fm shell pms-temp.frappe.rt.gw --service nginx --user nginx

# IPython console with frappe context for this site
fm shell pms-temp.frappe.rt.gw --bench-console --site pms-temp.frappe.rt.gw

# Logs (default service = frappe); -f to follow
fm logs pms-temp.frappe.rt.gw -f
fm logs pms-temp.frappe.rt.gw --service nginx -f

# Restart services (default: web + workers via supervisor, no container restart)
fm restart pms-temp.frappe.rt.gw                  # web + workers
fm restart pms-temp.frappe.rt.gw --web --no-workers
fm restart pms-temp.frappe.rt.gw --nginx
fm restart pms-temp.frappe.rt.gw --container      # full container restart
fm restart pms-temp.frappe.rt.gw --supervisor     # faster, processes only

# Other
fm list                               # list benches
fm info pms-temp.frappe.rt.gw         # bench details
fm start|stop pms-temp.frappe.rt.gw
```

Passthrough `--` runs args inside the container as given; `-c` takes a single string; stdin works for scripts (incl. Python via `--bench-console`).

## App layout

```
apps/next_pms/
├── next_pms/              # Python / Frappe module (hooks.py, doctypes, api, www, ...)
│   ├── hooks.py
│   ├── api/
│   ├── timesheet/         # timesheet feature
│   ├── resource_management/
│   ├── project_currency/
│   ├── public/            # built frontend assets are served from here
│   ├── www/
│   └── patches.txt
├── frontend/              # React app (npm workspaces, Vite 6, React 19, Tailwind 4)
│   ├── package.json       # workspace root: name "next-pms"
│   ├── vite.config.ts
│   └── packages/
│       ├── app/           # @next-pms/app — main SPA (src/, index.html)
│       ├── design-system/ # shared UI primitives (shadcn-style)
│       └── hooks/         # shared hooks
├── frappe-ui-react/       # git submodule — shared rtCamp UI kit (pnpm workspace)
│   │                       # submodule URL: rtCamp/frappe-ui-react, branch feat/timesheet
│   └── packages/frappe-ui-react/
├── tests/                 # Playwright e2e + visual tests
├── package.json           # top-level scripts (build runs submodule + frontend)
├── pyproject.toml
└── .gitmodules
```

## Build & dev flow

Always run these **inside the frappe container** via `fm shell` (host may not have matching Node/pnpm/uv).

```bash
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
```

Top-level `package.json` `build` script = `git submodule update --init --recursive && pnpm (frappe-ui-react) install + build && npm (frontend) install + build`. Per README: "If using frappe-manager, you might require `fm restart` to provision the worker queues."

## Figma design source

- **Canonical file** (`rtBot` has access): `h1EnhdK8swe6FCyxUW1XHx` — "Frappe-PMS--Copy-"
  URL: https://www.figma.com/design/h1EnhdK8swe6FCyxUW1XHx/Frappe-PMS--Copy-?t=GcilHC5EC5w1H0xO-0
- **Issue bodies sometimes link to the original file `HGoZEoIH64xUwnqO5Y3zqx` ("Frappe-PMS"), which `rtBot` does not have access to.** When drafting a `plan_issue_*.md` or calling `mcp__figma__*`, **always substitute the fileKey to `h1EnhdK8swe6FCyxUW1XHx`** — node IDs typically resolve across both files (verified for `3518:444604` on Issue #1194). If a node ID doesn't resolve in the Copy file, ask the maintainer before proceeding.
- **Never call `get_metadata` / `get_design_context` on the file root (`0:1`)** — it returns ~5.8MB of metadata and blows context. Always scope to a specific frame/node ID from the issue's Figma link.

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

## Git hygiene notes

- The app uses npm workspaces at the top level and pnpm inside the `frappe-ui-react` submodule. A stray `yarn.lock` at the repo root is not part of the build — don't commit one if it appears.
- Always `git status` at the start of a task and run `git fetch upstream` before cutting a new feature trunk so the branch is off the latest `feat/redesign`.
