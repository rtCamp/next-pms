# next_pms — Working Notes

Working directory: `apps/next_pms`. Everything below assumes this path.

This file is committed and read by every contributor. Anything specific to one machine (bench path, site name, login user, local URLs) belongs in `CLAUDE.local.md` next to this file — gitignored, loaded automatically by Claude Code. Never put such details here.

## Task workflow

Two tracks, picked by the shape of the task:

| Track | Applies to | Steps |
|---|---|---|
| **Full** (mandatory) | Any task that adds or reworks UI: new page, new section, new component, design-driven change | 1 → 2 → 3 → 4 below, in order, with the plan-approval gate |
| **Light** | Bug fixes, backend-only changes, refactors, small UI tweaks with no new components | Plan in chat (no plan file, no approval gate unless the user asks), implement, run the checklist in §4, one browser check if UI changed |

> For the **Full** track:
>
> - **Do not** write, edit, or create any file until step 1 is complete AND the user has explicitly approved the plan in chat.
> - **Do not** mark a task complete until step 2's final browser check passes.
> - **Do not** re-implement any UI primitive until step 3's component lookup is done and recorded in the plan.
> - **Do not** hand off code that fails step 4's DRY/KISS/SOLID checklist.
>
> If any prerequisite is missing (Storybook unreachable, `chrome-devtools` MCP not connected, design reference missing, issue unclear), **STOP and ask the user** — do not proceed on assumptions.
>
> If unsure which track applies, say which one you picked and why before starting. If the user asks for a quick change that would skip a Full-track step, call it out and ask for explicit confirmation. A "just do it" in one message is not standing authorization for future tasks.

The goal: plan first, reuse the design system, verify in a real browser, keep the code tight.

### 1. Plan first — share with user, wait for approval

Before editing any file, produce a **detailed, drilled-down plan** and post it for manual review. Do not start coding until the user approves.

**Where the plan lives:** save the plan as `plan_issue_<issue_number>.md` at the repo root (e.g. `apps/next_pms/plan_issue_1194.md`) *in addition to* posting a summary in chat. One plan file per issue — no overwriting across tasks, since the filename is keyed on the issue number. For ad-hoc work without an issue number, use `plan_<short-slug>.md`. **Never commit plan files** — they are working docs for human review. `.gitignore` already covers `plan.md` and `plan_issue_*.md` / `plan_*.md`; verify `git status` does not list the plan file as staged before any commit. **Delete the plan file once its PR is merged**; if you notice stale plan files for merged PRs at the start of a task, remove them.

The plan must contain:

- **Issue summary** — 2–3 lines restating what's being built, with a link to the issue and its design screenshots.
- **Scope + out-of-scope** — explicit list of what this task will and will not change.
- **Section breakdown** — for any non-trivial page, split the page into sections (e.g. Header / Breadcrumb / View switcher / Toolbar / Table body / Row actions / Empty state / Loading state) and write a sub-plan for each. This is the implementation order for step 2.
- **Routes / nav / store changes** — new routes, sidebar entries, global-search entries, context/store slices being added.
- **Component inventory** — for each UI piece, list the Storybook component ID you intend to reuse (from `mcp__storybook__*`). Mark each as **REUSE** (found in Storybook/design-system/frappe-ui-react) or **NEW** (needs to be created).
- **New components requiring human review** — a clearly-flagged list. If a required component isn't in Storybook/design-system/frappe-ui-react, call it out here with a proposed API (props, variants, file location) and **wait for approval** before creating it.
- **Data/API dependencies** — which whitelisted endpoints or frappe-ui-react resources this page calls; flag any BE work that must land first.
- **Acceptance criteria mapping** — map each acceptance-criteria checkbox from the issue to the section(s) that satisfy it, so nothing is missed.
- **Test plan** — what will be verified in the browser (golden path + key edge cases), and whether Playwright/visual tests need updating.

Use the TaskCreate tool to mirror the plan as trackable subtasks once approved.

### 2. Implement section-by-section, verify once in the browser

After plan approval, implement the sections in plan order, reusing components per §3 and respecting §4. Keep the Vite dev server running (`npm run dev`, see `## Build & dev flow`) so changes are live; if verifying against the built site instead, run `cd frontend && npm run build:app` first.

When every section is implemented, **spawn one browser-check subagent** using the Agent tool (`subagent_type: general-purpose`) with the `chrome-devtools` MCP tools (`mcp__chrome-devtools__*`: navigate, snapshot, screenshot, console, network). Give it:

- The full acceptance criteria from the plan.
- The exact route(s) to navigate (e.g. `<site>/next-pms/project-list`, taking `<site>` from `CLAUDE.local.md`).
- The design screenshots from the issue to compare against.
- What to verify per section: layout matches the design, interactive states work, empty/loading states, no console errors, only the expected network calls.
- Instructions to return a structured report: what passed, what failed, screenshots, console errors, network errors.

Fix everything the subagent surfaces, then re-run the check until it reports green. The main agent keeps the feature context; the subagent only verifies. This keeps giant screenshots and DOM dumps out of the main context. Mark subtasks completed (TaskUpdate) as acceptance criteria are met.

### 3. Use Storybook MCP as the single source of truth for UI

Storybook lives in the `frappe-ui-react` submodule and ships the `@storybook/addon-mcp` endpoint at `http://localhost:6006/mcp` (tools: `mcp__storybook__*`). It is **not** running by default — the user starts it by hand:

```bash
cd frappe-ui-react && pnpm storybook      # serves http://localhost:6006 (+ /mcp)
```

If the `mcp__storybook__*` tools are missing or `http://localhost:6006` does not respond, **stop and ask the user to start it** before any UI work. The component libraries are the `frappe-ui-react` submodule (has stories) and `frontend/packages/design-system/` (shadcn-style primitives, **no stories** — read its source under `src/` directly). **Reuse, don't re-invent.**

Before writing any component-like JSX:

1. Call `mcp__storybook__list-all-documentation` once per task to see what exists, and `ls frontend/packages/design-system/src` for the app-local primitives.
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

Every change (Full or Light track) must hold up to this checklist before you call it done:

- **DRY** — no copy-pasted component logic. Shared styles → Tailwind tokens / `cn()`; shared behavior → hooks in `frontend/packages/hooks/`; shared UI → `design-system/` or `frappe-ui-react/`.
- **KISS** — the simplest thing that satisfies the acceptance criteria. No speculative abstractions, no "future-proof" layers, no flags for states that don't exist yet.
- **SOLID**:
  - *Single responsibility* — one component = one visual/behavioral concern. Extract when a component handles two.
  - *Open/closed* — expose props/slots for variation instead of forking components.
  - *Liskov* — subcomponents honor the parent's contract (don't change prop meaning).
  - *Interface segregation* — tight, purpose-specific props; no catch-all `config` bag.
  - *Dependency inversion* — pages depend on hooks/interfaces, not on concrete API client internals; inject via props/context where it matters.
- **No silly mistakes** — before handing off:
  - FE: run the type check / build (`cd frontend && npm run build:app`) — must pass. BE: run the touched module's tests (see *Build & dev flow*).
  - Open the browser (via the subagent on the Full track, directly with `chrome-devtools` on the Light track) — no red console errors, no 4xx/5xx network calls the page didn't expect.
  - Re-read the diff yourself; verify no `console.log`, no dead commented code, no TODOs left unannotated.
  - Check imports — nothing unused, nothing duplicated.
- **Comments** — follow the project default: don't write them unless the *why* is non-obvious. Named identifiers document the *what*.

Only report a task complete when every acceptance criterion is green **and** the final browser check passes.

### 5. Before creating a PR — base, branch naming, stacking

Hard rules. Never open a PR that violates any of these:

1. **Base branch is `develop` unless told otherwise.** `develop` is the integration branch; releases are synced `develop` → `version-16`; `version-16-hotfix` exists for release hotfixes. Target `version-16-hotfix` **only** when the issue or the user explicitly calls the work a hotfix. Never open a PR against `version-16` directly.
2. **Head branch is `claude/<type>/issue-<n>`** (e.g. `claude/feat/issue-1234`, `claude/fix/issue-1234`). For work without an issue use `claude/<type>/<short-slug>` (e.g. `claude/chore/bump-ui-react`). `<type>` is one of the Conventional Commits types (see *Commit message rules*). The `claude/` prefix marks branches Claude created; keep it. Cut the branch off the latest remote base (`git fetch origin && git switch -c claude/feat/issue-<n> origin/develop`).
3. **One PR per feature by default.** Plan sections (`plan_issue_<n>.md` S1, S2, …) are implementation ordering, not PR boundaries. A **large** feature may be split into sequential PRs when each part is reviewable on its own: keep a feature trunk branch, open each part as a PR stacked on the trunk (or on the previous part), and say so in every PR body. Never split so that an intermediate PR leaves `develop` broken.
4. **Do not add reviewers on `gh pr create`.** The maintainer assigns reviewers.
5. **If the base advances mid-flight, rebase — don't merge.** `git rebase origin/develop && git push --force-with-lease`. Never merge the base back into the PR branch; that pollutes the diff.
6. **Before running `gh pr create`**: confirm `git diff --stat origin/<base>..HEAD` shows only the files this PR is supposed to touch. If a stale base has padded the diff, rebase first.
7. **Stacking on another in-flight branch** is allowed when the work depends on a feature that has not merged yet: base the PR on that feature's branch so the diff stays scoped, document the stacking in the PR body, and **rebase onto `develop` the moment the parent merges** (`git rebase origin/develop && git push --force-with-lease`). Example: PRs #2228 and #2229 were stacked on `feat/issue-2155-clean`.

### 6. After creating a PR — wait for AI review + CI, then triage

GitHub Copilot code review plus GitHub Actions CI post results a few minutes after a PR opens. Whenever you run `gh pr create`, follow this protocol before declaring the PR "ready":

1. **Sleep ~10 minutes** after PR creation so Copilot and CI jobs finish. (Use a background Bash sleep or equivalent — do not poll in a tight loop.)
2. **Pull the full PR state**:
   - Reviews & summary comments: `gh pr view <pr> --json reviews,comments`
   - Inline file comments: `gh api repos/:owner/:repo/pulls/:num/comments`
   - CI checks: `gh pr checks <pr>` (or `gh pr view <pr> --json statusCheckRollup`)
3. **Triage every signal** — don't silently ignore anything:
   - **Copilot comment, valid** — fix locally, commit on the same branch, push. The thread usually resolves automatically once the offending code is gone.
   - **Copilot comment, not valid** — reply on the thread explaining why the current implementation is correct. Cite the acceptance criteria, the plan, the design screenshot, or the architectural reason. Never silently ignore an AI comment. Copilot review is advisory: it never blocks a PR by itself.
   - **Failing CI check caused by the PR's diff** — treat as a blocker. Read the failing job log (`gh run view <run-id> --log-failed`), reproduce locally if needed, fix, commit, push. Do not hand off until CI is green for changes the PR introduced. To decide whether a failure is PR-caused, compare the failing file paths / test names / line numbers against the PR's own diff — if the failure touches code this PR changed (or its direct dependents), it's PR-caused.
   - **Failing CI check unrelated to the PR's diff** (pre-existing breakage, infra flake, unrelated config, missing secret) — leave a comment on the PR explicitly noting the failure is pre-existing and not introduced by this PR, with a short reason / link to the failing job. Do not attempt to fix unrelated CI issues in the same PR.
4. **Only after every Copilot thread has been addressed or answered AND all PR-related CI failures are resolved** should you notify the human reviewer that the PR is ready.

**Blocking checks** — any red among these must be fixed (PR-caused) or explained in a PR comment (pre-existing) before handoff:

| Workflow file | Display name | What it runs |
|---|---|---|
| `pr-test-build.yml` | **PR Frontend Build Test** | `vite` + `tsc` build of the SPA. No prettier, no eslint. |
| `build-test.yml` | **Bench Build Test** | Installs the app into a fresh bench. Catches broken `hooks.py`, migrations, Python deps. |
| `unit-tests.yml` | **Unit Tests** | Frappe unit tests (`bench run-tests`) against a bench with the sibling apps. |
| `linter.yml` | **Linters** / *Frappe Linter* | The full `.pre-commit-config.yaml`: ruff, prettier (**JS/TS Formatter**), **ESLint React**, **ESLint JS**, semgrep. Only the semgrep hook is ignorable — see below. |
| `semantic-commits.yml` | **Semantic Commits** | commitlint over every commit in the PR. A single non-conventional commit message fails it — see *Commit message rules*. |
| `gitleaks.yml` | **Gitleaks** | Secret scanning. Never commit tokens, even in tests or fixtures. |
| `vulnerable_dependency_check.yml` | **Vulnerable Dependency Check** | Dependency audit. |

**Ignorable checks** — do not try to fix their failures, do not block a PR on them; a one-liner in the PR pointing at this list is enough:

| Workflow file | Display name | Job(s) | Why ignored |
|---|---|---|---|
| `e2e-playwright-test.yml` | **Playwright Tests** | `get-branch`, `deploy`, `test` | End-to-end suite against a deployed preview site, triggered on `pull_request_review` / `schedule`. Its URL and data assumptions lag the codebase; owned separately. |
| `visual-test-playwright.yml` | **Visual Regression Tests** | `run-visual-tests` (*Run Visual Tests*) | Snapshot baselines are stale; every UI PR shows diffs until they are refreshed. |
| `linter.yml` | **Linters** — **semgrep findings ONLY** | `pre-commit` (*Frappe Linter*) | The `Sempgrep: frappe` hook reports ~70+ pre-existing findings in `next_pms/**/*.py` with their own hardening cleanup. **Everything else in this job is blocking.** |

> ⚠️ **Frappe Linter is only partially ignorable.** When it is red, open the log (`gh run view <run-id> --log-failed`) and split it: any ruff / `JS/TS Formatter` / `ESLint *` failure on a file **this PR changed** is PR-caused → fix and re-push; only the `Sempgrep: frappe` findings are out of scope. Do not blanket-dismiss the whole check.
>
> **Prevent it:** the same hooks run locally on every `git commit` via `pre-commit`. Never commit with `--no-verify`. If `git commit` does not run the hooks, the hook is missing — run `pre-commit install` from `apps/next_pms` and commit again. Prettier uses defaults (80-col); don't fight it.

### Project conventions — see the `next-pms-conventions` skill

Every code-level convention lives in `.claude/skills/next-pms-conventions/SKILL.md` (auto-loaded by description match for any code work in this repo). That skill is the single source of truth — do **not** maintain a parallel copy here. It contains:

- **Pre-implementation scan** (≈2 min, mandatory before writing any new component / cell / helper / styling override) — utilities check against `lib/utils.ts`, cva variants, design-system primitives, in-flight upstream PRs, one-component-per-file + `cells/` subfolder rule, file-extension rule, route completeness.
- **Comment discipline** — default to zero comments; rationale belongs in commit messages and PR bodies, not files.
- **Page file layout** — folder follows URL segment; per-folder `constants.ts` + `types.ts`; `index.tsx` for main component; per-cell files; camelCase file names, kebab-case folder names; `.ts` for no-JSX files.
- **UI details** — design-system Tailwind tokens (extend `global.css` `@theme` block when a stop is missing); cva co-located with its component; Tailwind v4 trailing `!` modifier; `text-base` + `truncate` on cell text; `@rtcamp/frappe-ui-react/icons` (`SolidDotLg`, `SolidStatus`) before hand-rolling SVGs; `<Button>` icon props take a `ComponentType`, not a rendered element.
- **Reading Figma** — historical (Figma MCP is no longer used); the drill-to-leaf advice still applies when a human shares a frame.
- **Formatting + utility reuse** — `date-fns` for dates; check `lib/utils.ts` first; no helper infra for fake/placeholder data.
- **Interaction patterns** — per-cell click handlers (not `onRowClick`); `Button variant="ghost"` for inside-SPA targets; `<base>/desk/user/<email>` for employee cells; complete the adjacent route in the same PR.
- **Workaround discipline** — ping the maintainer before a workaround grows defensive; check upstream PRs first.
- **Reading review comments** — path anchor wins over body text; reviewer fix commits trump earlier comments (always `git fetch` before a round of fixes).
- **Review-round retrospectives** for PR #1208, #1212, #1220.

The auto-memory index at `~/.claude/projects/<project-slug>/memory/MEMORY.md` mirrors the highest-leverage rules as standalone entries. The `<project-slug>` is the working-directory path with slashes turned into dashes — Claude Code resolves it automatically; no need to hardcode it.

### Project-local skills (in `.claude/skills/`)

- **`next-pms-conventions`** — **load FIRST for any coding task.** The full reference described above.
- **`react-agents-review`** — run before closing any FE task (step 4). Rules of Hooks, stale closures, missing deps, a11y, TypeScript safety.
- **`advanced-react-patterns`** — consult when a change adds `useMemo`/`useCallback`/`React.memo` or global state.
- **`webapp-testing`** — Playwright e2e suite in `tests/e2e/` (NOT the step-2 live browser check, which uses the `chrome-devtools` MCP).

The `next-pms-task`, `next-pms-slack-poll`, and `next-pms-pr-poll` skill folders are from a retired Slack-gated pipeline. Do not use them.

Provenance and refresh instructions: `.claude/skills/README.md`.

## Environment

`next_pms` is a Frappe app. It runs inside a bench, either a plain `bench` install or one managed by [Frappe Manager](https://github.com/rtCamp/Frappe-Manager) (`fm`, Docker-Compose based). Both are supported; the bench path, site name, and login user for **your** machine live in `CLAUDE.local.md`, not here.

- **Python**: `>=3.14,<3.15` (from `pyproject.toml`) · **Node**: `>=24` · `developer_mode = 1` on the dev site.
- Sibling apps a dev site needs (see `CONTRIBUTING.md`): `erpnext` and `hrms` on `version-16`, plus `frappe_gmail_thread`, `frappe_comment_xt`, `frappe_slack_connector` on `develop`.

### Plain bench

Run commands from the bench root (the directory containing `apps/` and `sites/`).

```bash
bench --site <site> migrate            # after touching Python / hooks / doctypes
bench --site <site> console            # IPython with frappe context
bench restart                          # or `bench start` in a dev Procfile setup
bench --site <site> clear-cache
```

### Frappe Manager (fm)

`fm` wraps a dockerised bench. Every bench/npm command below must run **inside the frappe container**; `gh` and other host tools stay on the host. Docs: https://opensource.rtcamp.com/Frappe-Manager/dev/

```bash
fm shell <bench>                                  # shell into the frappe container
fm shell <bench> -c "bench --version"             # one-shot command
fm shell <bench> -- bench --site <site> migrate   # passthrough args
fm shell <bench> <<'HEREDOC'                      # multi-line via heredoc
cd apps/next_pms && npm run build
HEREDOC
fm shell <bench> --bench-console --site <site>    # IPython with frappe context
fm logs <bench> -f                                # frappe logs; --service nginx for nginx
fm restart <bench>                                # web + workers via supervisor
fm restart <bench> --container                    # full container restart
fm list | fm info <bench> | fm start|stop <bench>
```

Inside the container the bench root is `/workspace/frappe-bench/`. After `fm` creates a bench you may need `fm restart` once to provision the worker queues.

## App layout

```
apps/next_pms/
├── next_pms/                  # Python / Frappe module
│   ├── hooks.py               # SPA route rules, doc_events, scheduler, fixtures
│   ├── api/                   # whitelisted endpoints: dashboard.py, audit.py, customer.py, generate_pm_report.py, ...
│   ├── timesheet/             # timesheet feature (api/, doctypes, employee.py incl. leave/time-off)
│   ├── resource_management/   # allocations: resource_allocation doctypes, api/, report/, tasks/
│   ├── next_projects/         # project extensions: project_phase, project_timeline_item(+category), project_contact
│   ├── project_currency/      # currency / exchange-rate handling
│   ├── tasks/                 # scheduled jobs (scheduled_audit.py)
│   ├── tests/                 # Frappe unit tests (test_*.py) — run by the Unit Tests CI job
│   ├── utils/
│   ├── public/                # built frontend assets served from here (frontend/ writes public/frontend/)
│   ├── www/                   # next-pms SPA entry page
│   └── patches.txt
├── frontend/                  # React SPA (npm workspaces, Vite 6, React 19, Tailwind 4)
│   ├── .env.sample            # copy to .env to point the Vite dev server at your site
│   ├── vite.config.ts         # dev server :5173 + proxy; build → next_pms/public/frontend
│   └── packages/
│       ├── app/src/           # @next-pms/app
│       │   ├── pages/         # one folder per route: dashboard/ (leadership, manager, widget), timesheet/ (personal, team, project),
│       │   │                  #   projects/ (list, kanban), project-details/ (about, tabs/), tasks/, allocations/ (team, project)
│       │   ├── layout/ providers/ components/ hooks/ lib/
│       ├── design-system/     # shared UI primitives (shadcn-style, cva); no Storybook stories — read src/
│       └── hooks/             # shared hooks
├── frappe-ui-react/           # git submodule — rtCamp UI kit (pnpm workspace) + Storybook; branch develop
├── tests/                     # Playwright e2e (tests/e2e) + visual (tests/visualAutomation)
├── .pre-commit-config.yaml    # ruff, prettier, ESLint, semgrep — same hooks CI runs
├── commitlint.config.cjs      # Conventional Commits enforcement (Semantic Commits CI)
├── package.json               # top-level scripts (build, e2e:tests, visual:test, allure:*)
└── pyproject.toml
```

**Feature areas to know (2026):**

- **Dashboard + leave approvals** — `pages/dashboard/` (manager / leadership views, widgets) backed by `next_pms/api/dashboard.py`; managers approve/reject leave applications from here (issue #1558).
- **Growth initiatives, risks, activity log** — project-detail tabs under `pages/project-details/tabs/` (`growth/`, `risks/`), with an activity component and update log; landing via the `feat/issue-2155*` branch stack (issues #2155, #2156).
- **AI resource planning** — AI-suggested allocations with approval/share flow in `pages/allocations/` plus a `gantt-view` primitive in `design-system/`; in flight on `feat/ai-resource-planning`.
- **PM report / audit** — `next_pms/api/generate_pm_report.py`, `api/audit.py`, `tasks/scheduled_audit.py`.

Before touching one of these, `git fetch origin` and check whether the relevant branch has merged; if not, decide with the user whether to stack on it (§5 rule 7).

## Build & dev flow

Run every command from `apps/next_pms` inside the bench (for `fm`, inside the frappe container via `fm shell`).

**Day-to-day frontend work uses the Vite dev server**, not rebuilds. It serves the SPA on port 5173 and proxies `/api`, `/app`, `/assets`, `/files`, `/private`, and `/socket.io` to the bench site.

```bash
# One-time: point the dev server at your site
cp frontend/.env.sample frontend/.env          # then set VITE_SITE_NAME / VITE_SITE_PORT / VITE_BASE_URL

# Dev server (hot reload) — open http://<site>:5173/next-pms/
npm run dev

# Production build of the SPA into next_pms/public/frontend/ (what the site serves)
cd frontend && npm run build:app

# Full chain: submodule init + frappe-ui-react (pnpm) + frontend install + build
npm run build

# After touching Python / hooks / doctypes
bench --site <site> migrate && bench restart

# Backend unit tests (what the Unit Tests CI job runs); needs allow_tests on the site
bench --site <site> set-config allow_tests true
bench --site <site> run-tests --app next_pms
bench --site <site> run-tests --app next_pms --module next_pms.tests.test_timesheet   # one module
```

Backend tests live in `next_pms/tests/test_*.py`. Adding tests for new backend logic is encouraged, not required; when you touch a module that already has a test file, run that file before pushing.

`frontend/` is an npm workspace (`@next-pms/app`, `design-system`, `hooks`). `frontend/package.json` `build` = `npm install` → `build:frappe-ui-react` (corepack + `pnpm install --frozen-lockfile && pnpm build` in the submodule) → `build:app`.

**When you bump the `frappe-ui-react` submodule SHA**, rebuild it before trusting `build:app`: `cd frontend && npm run build:frappe-ui-react` (or `npm run build` for the full chain). `build:app` consumes `frappe-ui-react/packages/frappe-ui-react/dist/` as-is — a stale local `dist/` lets the app build pass locally while CI (which rebuilds ui-react from source) fails. Symptom: CI errors like `"<Name>" is not exported by .../frappe-ui-react/dist/index.js` when the source clearly has the export. Fix: fresh submodule build, re-run the app build, push. (PR #1264 lesson: cost a bump → revert → re-bump cycle.)

## Design references

There is no Figma MCP. Designs arrive as screenshots or image attachments on the GitHub issue (and occasionally a Figma link for humans). Read the attached images with the Read tool, pin the plan and the browser check to them, and ask the user for a screenshot when an issue references a design without attaching one.

## Site access

- **Next PMS SPA mount**: `/next-pms/` (see `website_route_rules` in `next_pms/hooks.py`). Default landing: `/next-pms/timesheet`.
- Redirect: `/timesheet` → `/next-pms/timesheet` (`website_redirects`).
- Site URL, dev login user, and DB name are per-machine — see `CLAUDE.local.md`. Never store passwords in either file; ask the user each session.

## GitHub access

- Use the `gh` CLI for repo/PR/issue work on `rtCamp/next-pms` and `rtCamp/frappe-ui-react`.
- **If `gh auth status` reports not logged in**, ask the user to run `gh auth login` (or export `GH_TOKEN`) before attempting PR/issue operations.
- On `fm` setups `gh` is not installed inside the container — run it from the host.

## Git hygiene notes

- The app uses npm workspaces at the top level and pnpm inside the `frappe-ui-react` submodule. A stray `yarn.lock` at the repo root is not part of the build — don't commit one if it appears.
- Always `git status` at the start of a task and `git fetch origin` before cutting a new branch so it is off the latest `develop`.
- Remote naming varies per machine (`origin` vs `upstream`, or both pointing at `rtCamp/next-pms`); check `git remote -v` and use whichever tracks `rtCamp/next-pms`.

### Commit message rules (mandatory)

All commits must follow **Conventional Commits**. Format: `<type>[scope]: <description>` with an optional body and footers.

| Type | When |
|---|---|
| `feat` | new feature |
| `fix` | bug fix |
| `docs` | documentation only |
| `refactor` | restructuring without behaviour change |
| `style` | whitespace / formatting |
| `perf` | performance improvement |
| `test` | adding / updating tests |
| `build` | build system or dependency changes |
| `ci` | CI/CD config |
| `chore` | other maintenance |
| `revert` | reverts a previous commit |

- **Scope** (optional): noun in parentheses describing the affected area, e.g. `feat(projects):`.
- Enforced by `commitlint.config.cjs` via the **Semantic Commits** CI check on every commit in the PR: lower-case type from the table, non-empty subject. Fix a bad message with `git commit --amend` / interactive rebase before pushing.
- **Breaking change**: append `!` after type/scope and/or add a `BREAKING CHANGE:` footer.
- **Always sign commits**: `git commit -S` (GPG). Configure once with `git config commit.gpgsign true`.
