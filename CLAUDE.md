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

### 5. Before creating a PR — base, feature trunk, reviewers

Hard rules. Never open a PR that violates any of these:

1. **Base branch is always `feat/redesign`.** Never open PRs against `main` for this work. The redesign lands on `main` in larger drops; individual task PRs go to `feat/redesign`.
2. **Head branch is a feature trunk named `claude/feat/<trunk-name>`.** One trunk per feature/task (e.g. `claude/feat/projects-page`, `claude/feat/timesheet-filters`). Cut the trunk off the latest `upstream/feat/redesign`. Do not pile unrelated work onto a catch-all branch like `claude/redesign`.
3. **One PR per feature — do not split into stacked/sequential PRs.** Deliver the complete feature in a single PR on its trunk branch. Plan phases (`plan_issue_<n>.md` sections S1, S2, …) are for implementation ordering and section-by-section browser checks, **not** for PR boundaries. If work remains after an initial push, add commits to the same branch and the same PR — update the PR title/description if the scope shifts.
4. **Always add `ayushnirwal` as a reviewer** on `gh pr create` (`--reviewer ayushnirwal`).
5. **If the base advances mid-flight, rebase — don't merge.** Run `git rebase upstream/feat/redesign` and `git push --force-with-lease`. Never merge `feat/redesign` back into the PR branch; that pollutes the diff.
6. **Before running `gh pr create`**: confirm `git diff --stat upstream/feat/redesign..HEAD` shows only the files this PR is supposed to touch. If a stale base has padded the diff, rebase first.
7. **Stacked PRs are allowed when a new feature depends on another feature's in-flight branch** — and **only** in that case. Rule #3 still holds (don't split one feature across stacked PRs). If feature A needs a placeholder/component that lives on feature B's not-yet-merged branch, base A on `claude/feat/<B-trunk>` instead of `feat/redesign` so A's diff stays scoped to its own files. Document the stacking in the PR body, and **rebase A onto `feat/redesign` the moment B merges** (`git rebase upstream/feat/redesign && git push --force-with-lease`). Example: PR #1264 (project-detail-skeleton) was stacked on `claude/feat/projects-list` (PR #1220) so the detail-page diff didn't include PR #1220's list files.

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

Apply these pre-emptively rather than re-learning them in review. Each rule here comes from an actual correction a maintainer made on a past PR. The first two subsections (Pre-implementation scan, Comment discipline) matter most — skipping them has produced every round of review feedback so far.

**Pre-implementation scan (≈ 2 minutes before writing any code)**

Run this *every* time you're about to write a new component, cell, helper, or utility. Each step maps to a review comment that has already been made — running the scan up-front is the cheapest way to avoid another round.

1. **Utilities**: before creating `format.ts` / `helpers.ts` / similar, scan `frontend/packages/app/src/lib/utils.ts` (and the design-system utils at `frontend/packages/design-system/src/utils/`). If the helper exists, reuse it. If it's generally useful and missing, add it to `lib/utils.ts`, not a feature-local file. Feature-local helpers only if the logic is truly feature-specific. (PR #1220 round-3 miss: I created `list/format.ts` for `formatProjectDate` without checking `lib/utils.ts`.)
2. **Component variants**: if the component you're about to write has variants (risk, phase, tier, size, theme, status, state, etc.), search `rg "cva\("` first. Use `class-variance-authority` (`cva`) to expose the variant as a typed prop on the component. **Do not** build a `Record<variant, className>` map, an enum-to-class lookup, or a switch. **Co-locate the `cva()` call in the component's own file — never in a shared `constants.ts`.** `constants.ts` is for pure data (labels, option arrays); variants are behavior and pair with their single consumer. When grepping patterns, note the layer: `design-system/src/components/<name>/constants.ts` exports variants for library reuse (fine); `app/src/pages/<feature>/` co-locates (the rule here). (PR #1220 round-3 miss: variants were maps; round-4 miss: migrated to cva but put them in `list/constants.ts`.)
3. **Design-system primitives**: for any interactive element (link, button, chip, badge), reach for `frappe-ui-react` first — `Button variant="ghost" | "subtle" | "solid" | "outline"`, `Badge`, `Link`, etc. — before writing `<a href>` or `<button>` with hand-rolled styling. Anchors are for genuine outside-SPA links (e.g. `/desk/<user>`); inside-SPA interactions use the design-system primitive. (PR #1220 round-3 miss: `ProjectNameCell` used `<a onClick={preventDefault; navigate}>` when `<Button variant="ghost">` was the expected pattern.)
4. **Upstream work in flight**: before inlining a workaround (custom SVG, reimplemented primitive, copied helper), run `gh pr list -R rtCamp/frappe-ui-react --state open --search <keyword>` and glance at recent commits on the submodule. If an upstream PR is close, leave a `@todo` pointing at it (e.g. `// TODO: use Stages icon from frappe-ui-react when PR #248 lands`) and use a minimal interim. (PR #1220 round-3 miss: the `icon/solid/stages` component had an open upstream PR `frappe-ui-react#248` that I didn't check before writing a custom SVG.)
5. **One reusable component per file + group into subfolders when the count grows**: each reusable component goes in its own file named after the component. **File names are `camelCase` (e.g. `dot.tsx`, `stagesIcon.tsx`, `projectNameCell.tsx`, `budgetProgressCell.tsx`). Folder names stay `kebab-case`.** Don't aggregate several components in one `cells.tsx`. A tiny helper used only inside its parent may stay inline — the moment it's extracted or reused, split it out. **Once a feature folder has ~7 or more cell-like components, group them under a `cells/` subfolder**; the dispatch `switch(column.key)` component becomes `cells/index.tsx`, individual cell components are siblings inside. Keeps the feature-folder top level readable. (PR #1220 round-3 miss: `Dot` and `StagesIcon` were left inside `cells.tsx`; round-4 miss: 8 cell files left flat in `list/` instead of grouped into `list/cells/`; round-5 miss: cell files were kebab-case instead of camelCase.)
6. **File extensions track content, not folder sibling pattern**: a file with no JSX — pure data, types, utility functions — uses `.ts`. A file with JSX (or exporting a React component) uses `.tsx`. `columns.ts` (column definitions), `constants.ts`, `types.ts`, `fake-data.ts` are `.ts`; `index.tsx`, per-cell component files are `.tsx`. (PR #1220 round-5 miss: `columns.tsx` had no JSX.)
7. **Route completeness**: if your change adds a navigation target (a new `href` / `navigate` call), plan to land the destination route in the same PR. A placeholder route (e.g. `<UnderConstruction />`) rendered under the app's sidebar layout is fine. Don't ship a link that 404s. (PR #1220 round-3 miss: `ProjectNameCell` pointed at `/next-pms/projects/<id>` with no matching route; the plan's "detail page is a separate issue" rationale wasn't the bar.)

**Comment discipline**

Default: **zero comments**. Before adding one, run the test:

> *Could a reviewer get this from `git blame` (the commit message), the PR body, or the named identifiers in the code alone?*

If the answer is yes — even once — delete the comment. Rationale about tradeoffs, "I chose X over Y because...", "this is a Figma override because...", "the token scale is inconsistent...", "this wrapper is flex not inline-flex because..." — all of that belongs in the commit message or PR body, **not the file**. Git history carries rationale; file comments rot.

Only two kinds of comment survive the test:

- A one-line note documenting a **load-bearing constraint** that's non-obvious and would cause a correctness bug if ignored (e.g. `// base-ui requires a single child that forwards ref`).
- A `@todo` pointing at tracked follow-up work (a GH issue, upstream PR, memory entry). `@todo` without a target isn't a follow-up, it's narration — still delete.

This rule has been corrected by the maintainer three review rounds in a row. The fix is not "write shorter comments", it's *"don't write comments"*. Default to deleting.

**Page file layout**
- **Folder name follows the URL segment, not the repo's singular default.** If the route is `/projects`, the directory is `pages/projects/` (plural). Don't default to singular just because sibling folders happen to be (`task/`, `report/`, etc.) — look at the route. (PR #1208 correction: `pages/project/` → `pages/projects/`.)
- **Each `pages/<feature>/` has a dedicated `constants.ts` and a dedicated `types.ts`.** `constants.ts` holds feature data constants (labels, option arrays, enum-derived arrays); `types.ts` holds shared types. **`constants.ts` is NOT for cva variants** — variants are component behavior and co-locate with the component that consumes them (PR #1220 round-4 correction). Don't co-locate types with data constants in a single file, and don't inline either in the component. The constants/types rule recurses into sub-folders: `pages/<feature>/<sub>/` also gets its own `constants.ts` + `types.ts`.
- **Main page component is `index.tsx`, exporting a component named after the feature.** E.g. `pages/projects/index.tsx` exporting `Projects`. Only call a file `layout.tsx` when it is an actual React-Router route layout wrapping `<Outlet />` children (the `allocations/layout.tsx` pattern). A route that conditionally renders children based on a query param is **not** a layout — don't mechanically mirror the Allocations file structure if the routing shape is different.
- **Placeholder/child view components stay next to `index.tsx`** (e.g. `list.tsx`, `kanban.tsx` alongside `index.tsx`) unless a maintainer explicitly asks for a `components/` subdirectory. Review feedback sometimes mentions a `components/` directory in passing — only create it if the reviewer's *fix commit* actually uses it.
- **Per-cell rendering lives in its own file**, not a giant `switch(column.key)` block inside `index.tsx`. Individual visual components → **one per file** (`dot.tsx`, `stagesIcon.tsx`, `dateCell.tsx`, `projectNameCell.tsx`, etc.) — don't aggregate into a single `cells.tsx`. **File names are `camelCase`; folder names are `kebab-case`.** **When the count reaches ~7+, group them under a `cells/` subfolder** with the dispatch as `cells/index.tsx`. Example final layout: `pages/projects/list/{index.tsx, columns.ts, constants.ts, types.ts, fake-data.ts, cells/{index.tsx, dot.tsx, stagesIcon.tsx, dateCell.tsx, projectNameCell.tsx, phaseCell.tsx, budgetProgressCell.tsx, employeeCell.tsx}}`. (PR #1220 round-3 correction: split out of `cells.tsx`; round-4 correction: group into `cells/` folder; round-5 correction: rename cell files to camelCase and `columns.tsx` → `columns.ts` since it has no JSX.)

**UI details**
- **Icon identifiers must be verified against Figma metadata or a design-system story — never inferred by eyeballing a thumbnail.** `AlignLeft` vs `List` vs `TextAlignStart` look similar enough to confuse, and even a reviewer's suggested name can be wrong. When the exact lucide icon isn't obvious from Figma, ask the maintainer instead of guessing. (PR #1208 correction: `List` → `AlignLeft`.)
- **Phase indicators in this codebase are donut SVGs (Figma component `icon/solid/stages`), not solid dots.** More generally: a small visual that *looks* like a dot in a low-resolution screenshot is often a themed icon instance. Before rendering a `<div className="rounded-full">`, drill into the Figma node for the phase/status cell and check whether it's a shape fill or an `<instance>` reference to a component. (PR #1220 correction: solid dots → `icon/solid/stages` donut.)
- **Prefer design-system Tailwind tokens over inline `style={{ backgroundColor }}` or arbitrary `bg-[#hex]`.** The `ink/*` scale (`ink-red-3`, `ink-amber-3`, `ink-green-3`, `ink-cyan-3`, `ink-blue-3`, `ink-violet-3`, `ink-gray-4/5/7/8`) and most of `surface/*` are exposed as Tailwind classes. Where a scale stop is missing (e.g. `surface-green-5`, `surface-amber-5`), **extend `global.css`'s `@theme` block to add the token** — don't sidestep with arbitrary values or hex literals. (PR #1220 correction: `!bg-[#c3f9d3]` → extend `surface-green-5`.)
- **Variants use `class-variance-authority` (`cva`), not `Record<variant, className>` maps. The `cva()` definition lives in the component's own file, not in `constants.ts`.** For any component that switches classNames by a prop (risk, phase, tier, size, theme, state), `rg "cva\(" frontend/packages/` for the project's existing patterns and expose the variant as a typed prop via cva — in the same file as the component that consumes it. (PR #1220 round-3 correction: migrated maps to cva; round-4 correction: moved cva definitions out of `list/constants.ts` into the respective component files.)
- **Tailwind v4 important modifier goes at the end of the class.** In v3 you wrote `!bg-red-500`; in v4 it's `bg-red-500!`. Variants still prefix the class, so `hover:bg-red-500!` (not `!hover:bg-red-500`) and `[&>div]:bg-red-500!` (not `[&>div]:!bg-red-500`). Ref: https://tailwindcss.com/docs/upgrade-guide#the-important-modifier. (PR #1220 round-5 correction.)
- **Cell/value text is 14px → use `text-base`.** The `frappe-ui-react` theme maps `--text-base-size: 14px`. For every text-bearing cell element — primary value, labels rendered beside icons, span siblings of avatars — apply `text-base`. (PR #1220 round-5 correction.)
- **Every cell text span gets `truncate`.** ListView columns are resizable, so text without `truncate` wraps onto a second line when the column narrows. `truncate` is Tailwind's shorthand for `overflow-hidden text-ellipsis whitespace-nowrap`. (PR #1220 round-5 correction.)
- **Use icons from `@rtcamp/frappe-ui-react/icons` before hand-rolling SVGs.** `SolidDotLg` (the 16px solid dot used for risk indicators) and `SolidStatus` (the status "donut" used for project phase) are available as of `frappe-ui-react#248`. Check `frappe-ui-react/packages/frappe-ui-react/src/icons/solid/index.ts` for the full list before writing a custom SVG. (PR #1220 round-5 correction.)
- **`frappe-ui-react` `<Button>` icon props take a `ComponentType`, not a rendered element.** `icon` / `iconLeft` / `iconRight` are typed `string | React.ComponentType<unknown>`. Pass `iconLeft={Pencil}` (the import itself), **not** `iconLeft={<Pencil className="size-4" />}`. Sizing + color propagate from the Button's theme/size tokens — you don't get to pass a `className` on the icon this way. A rendered element here surfaces as React error #130 (`element type invalid, got: object`). (PR #1265 discovery.)

**Reading Figma — drill to the leaf node**

The `mcp__figma__*` tools return different data depending on which node you call them on. Frame-level calls give you the palette and top-level structure; sub-node and leaf-node calls give you the actual component instances and the specific tokens applied to each element.

- **Always drill into the node for the specific element you're rendering**, not just the containing frame. Chain: frame → row/cell → inner group → `<instance>` or text node. Stop at the leaf that represents the visual primitive you'll render.
- For an **icon-like element** (dot, donut, pill, chevron, badge): call `mcp__figma__get_metadata` on the parent cell, follow the `<instance>` to the component name, then `mcp__figma__get_design_context` on that component to see the SVG / variants. If a component name like `icon/solid/stages` surfaces, render that SVG — don't substitute a `div.rounded-full` based on how it looks in a screenshot of the outer frame.
- For a **color decision** (status dot, phase, tier): call `mcp__figma__get_variable_defs` on the specific cell/node that uses the color, not the frame. Frame-level returns every token referenced *anywhere* in the frame, which over-indexes on colors that don't apply to your element.
- For **typography** (font size, weight, leading, tracking): read the specific text node's token, not the frame's palette.
- The rule is recursive with the existing "verify before inferring" rule — that rule says look up canonical identifiers in metadata; this one adds that metadata calls are *themselves* scoped to the node you pass, so you have to pass the right one.

**Formatting helpers + utility reuse**
- **Use `date-fns`** for all date/time management. Don't hand-roll `Intl.DateTimeFormat` formatters or parsers. (PR #1220 correction.)
- **Check `frontend/packages/app/src/lib/utils.ts` (and `design-system/src/utils/`) before creating a feature-local helper.** If the helper is generally useful, add it to `lib/utils.ts` — not a feature-local `format.ts`. Feature-local only for feature-specific business logic. (PR #1220 round-3 correction: `list/format.ts` should have lived in `lib/utils.ts`.)
- **Don't build formatter infrastructure for fake/placeholder data.** Currency in fake data renders as inline `` `$${amount.toLocaleString("en-US")}` `` at the call site — no helper function, no `Intl.NumberFormat`. Percent → `` `${n}%` ``. Real currency wiring (locale + fraction digits + global default) is BE-integration work that lives in a separate issue.

**Interaction patterns**
- **Per-cell click handlers, not `onRowClick`** when only some cells should navigate. A ListView `onRowClick` conflates row-select, name-click, and employee-click into one target; attach the `onClick` to the specific cell component (e.g. `ProjectNameCell`, `EmployeeCell`) so each column controls its own behavior.
- **Use `Button variant="ghost"` from `@rtcamp/frappe-ui-react` for inside-SPA click targets**, not `<a href>` with `onClick preventDefault + navigate`. Anchors are for genuine outside-SPA links only (e.g. `/desk/user/<email>`). (PR #1220 round-3 correction: `ProjectNameCell` anchor → ghost Button.)
- **Employee/user cells navigate to `<base>/desk/user/<user_email>`.** Any cell that represents a person needs the email in its data contract (not just name + initials) so the click target resolves.
- **Complete the adjacent path.** If your change adds a navigation target, land the destination route in the same PR. A placeholder route (`<UnderConstruction />` under the sidebar layout) is the minimum — don't ship a link that 404s. (PR #1220 round-3 correction: `/projects/<id>` had no destination.)

**Workaround discipline**
- **If a workaround for a library gap starts feeling load-bearing, ping the maintainer before committing cycles to it.** Signs a workaround is getting expensive: defensive selector specificity, mirroring library internals, a growing code comment explaining *why* the workaround exists, or multiple iterations patching side-effects of the workaround. Ask whether the AC might flex — cheaper than a rollback later. (PR #1220 lesson: the sticky-column `overflow-y-*` override saga went through two iterations of overflow-neutralising before Ayush dropped the sticky requirement from the AC entirely.)
- **Check for in-flight upstream PRs before inlining a workaround.** Run `gh pr list -R rtCamp/frappe-ui-react --state open --search <keyword>` before reimplementing a primitive (custom SVG, hand-rolled component, copied helper). If an upstream PR is close, use a minimal interim + leave a `@todo` pointing at the PR. (PR #1220 round-3 lesson: I wrote an inline `StagesIcon` without checking for `frappe-ui-react#248` which was already in flight.)

### Reading review comments
- **Path anchor vs body text** — GitHub shows each inline comment against a file path. When the anchor says `pages/projects/index.tsx` but the body text mentions `pages/project/...`, the anchor is the intent; treat the body path as a typo.
- **Fix commits trump earlier comments.** If a reviewer's comment says "do X" but their own follow-up commit on the branch doesn't include X, the commit wins — pull their actual changes rather than retrofitting the comment literally. Always `git fetch` before starting a round of fixes, and check whether the reviewer already pushed commits addressing their own feedback.

### Project-local skills (in `.claude/skills/`)

These are loaded automatically. Invoke them at the listed workflow points:

- **`next-pms-task`** — invoked via `/next-pms-task <github-issue-url>`. End-to-end task pipeline: fetch the issue, write the plan, post it as a Slack thread in `#bots-ai-workflow-next-pms` (channel `C0AUXBY5WMB`), poll for the maintainer's `RESOLVED` keyword between sections, then open the PR with the project's stacked-PR + reviewer rules. **Loads and consults `next-pms-conventions` before implementation starts** — you do not need to invoke it separately. Wraps everything in §1–§6 above and adds the async Slack-thread feedback loop. **Start here whenever the user shares a task link — don't hand-roll the workflow.**
- **`next-pms-conventions`** — **load FIRST at the start of any manual coding task in this repo** (i.e. tasks not entered via `/next-pms-task`, which handles this automatically). Project-tailored reference built from three rounds of maintainer review on PR #1208 / #1212 / #1220. Contains the full Pre-implementation scan, comment discipline, cva/lib-utils/design-system-primitive rules, Figma drilling, review-round retrospectives, and anti-patterns to avoid. The summary in §"Project conventions learned from reviews" above is the quick version — the skill is the deep reference.
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

**When you bump the `frappe-ui-react` submodule SHA**, also run `pnpm --filter @rtcamp/frappe-ui-react build` (or `cd apps/next_pms && npm run build` for the full chain) before trusting `npm run build:app`. `build:app` consumes `frappe-ui-react/packages/frappe-ui-react/dist/` as-is — if your local `dist/` is stale from a previous bump, the app build can pass locally while CI (which rebuilds ui-react from source) fails. Symptom: CI errors like `"<Name>" is not exported by .../frappe-ui-react/dist/index.js` when the source clearly has the export. Fix: fresh `pnpm build` in the submodule package, then re-run the app build, then push. (PR #1264 lesson: cost a bump → revert → re-bump cycle.)

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
