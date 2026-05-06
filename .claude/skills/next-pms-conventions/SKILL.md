---
name: next-pms-conventions
description: >
  Project-specific conventions for the next-pms React/Tailwind/frappe-ui-react
  codebase. Load before writing or editing code in apps/next_pms/frontend/**.
  Distills three rounds of review feedback from the repo maintainer (ayushnirwal)
  on PR #1208, PR #1212, and PR #1220 into a pre-implementation scan,
  comment-discipline rule, file-layout conventions, design-system-primitive
  rules, cva variant handling, Figma drill-to-leaf rule, utility-reuse rule,
  interaction/navigation patterns, and workaround discipline. Run the
  "Pre-implementation scan" section before writing any new component, cell,
  helper, utility, or styling override — every step in the scan traces back
  to a review comment that has already been made on a past PR.
  Keywords: next-pms, Projects, Timesheet, redesign, list view, ListView,
  cell, cells, Tailwind token, ink-gray, ink-red, surface-green, surface-amber,
  cva, class-variance-authority, frappe-ui-react, Button, Avatar, Tooltip,
  design-system, Figma, icon/solid/stages, AlignLeft, ayushnirwal, Ayush,
  review feedback, pre-implementation scan, comment discipline, lib/utils,
  date-fns, types file, constants file, component per file, ghost button,
  desk/user route, sticky column, workaround discipline, upstream PR,
  apps/next_pms.
license: internal
compatibility: "Designed for Claude Code. Next_pms monorepo (React 19 + Tailwind 4 + frappe-ui-react submodule + next_pms Frappe app)."
metadata:
  author: Claude Code session (Riddhesh + Ayush retrospectives)
  version: "1.0"
  origin: distilled from PR #1220 review rounds on rtCamp/next-pms (feat/redesign)
---

# next-pms-conventions

Consolidated, ordered rules for writing code in the next-pms frontend. Each rule has a **source** (which review round surfaced it) and a concrete **failure mode** so you can recognise the same shape in new work. Run the checklists in order — the pre-implementation scan at the top is the highest-leverage section.

## Critical warnings

**NEVER** start writing code for a cell / component / helper before running the `Pre-implementation scan` below. Every step in the scan maps to a review comment that has already been made — skipping costs a review round.

**NEVER** add a code comment without running the "could git blame / PR body / named identifiers tell a reviewer this?" test. If any answer is yes, delete. Three review rounds have flagged over-narrative comments.

**NEVER** use a `Record<variant, className>` map, an enum-to-class lookup, or a switch in a cell component that has variants. The project convention is `class-variance-authority` (cva), **co-located with the component that consumes it** — not in a shared `constants.ts`. Grep `rg "cva\("` first.

**NEVER** put cva variants in `constants.ts`. `constants.ts` is for pure-data constants (labels, option arrays, enum-derived arrays). Variants are component behavior and live in the component's file.

**NEVER** leave more than ~6 cell-like component files flat in a feature folder. Once the count accumulates, group them into a subdirectory (e.g. `pages/<feature>/cells/` with the dispatch as `cells/index.tsx`).

**NEVER** use `<a href>` + `onClick={preventDefault; navigate}` for an inside-SPA click target when `<Button variant="ghost">` from `@rtcamp/frappe-ui-react` is the project convention. Anchors are for genuine outside-SPA links only.

**NEVER** ship a navigation target that 404s. If `<ProjectNameCell>` navigates to `/projects/<id>` and the detail page isn't built, add a placeholder route (`<UnderConstruction />` under the app's sidebar layout) in the same PR.

**ALWAYS** check `frontend/packages/app/src/lib/utils.ts` before creating a `format.ts` / `helpers.ts` in a feature folder. Generally-useful helpers (date, currency, URL, string) live in `lib/utils.ts`, not feature-local.

**ALWAYS** run `gh pr list -R rtCamp/frappe-ui-react --state open --search <keyword>` before inlining a workaround for a missing upstream primitive. The `icon/solid/stages` SVG had an open upstream PR (`frappe-ui-react#248`) that would have saved an inline-SVG fallback.

---

## Pre-implementation scan (≈ 2 minutes, always)

Run before writing code for any new component, cell, helper, or styling override.

1. **Utilities**: does the helper already exist?
   - Run `rg "<functionName>"` in `frontend/packages/app/src/lib/` and `frontend/packages/design-system/src/utils/`.
   - If yes → import, don't re-create.
   - If no AND the helper is generally useful → add to `lib/utils.ts` (not a feature-local `format.ts`).
   - Feature-local helpers only when the logic is truly feature-specific (e.g. business rule for a single page).
   - **Failure mode (PR #1220 round 3, `format.ts:1`)**: I created `list/format.ts` for `formatProjectDate` without checking `lib/utils.ts`. Ayush: *"When adding a utility, check `app/lib/utils.ts` file to verify if a utility is already available."*

2. **Component variants via cva**: does the component have variants?
   - Variants = any prop that switches classNames (risk, phase, tier, size, theme, status, state, intent).
   - Run `rg "cva\(" frontend/packages/` for patterns. Note the context: patterns in `design-system/src/components/<name>/constants.ts` export variants for library reuse — that's a **library** shape. At the **app/feature** level (`app/src/pages/<feature>/`), variants co-locate with their component.
   - Use `class-variance-authority` to expose variants as a typed prop, **defined in the component's own file** (NOT in `constants.ts`):
     ```tsx
     // dot.tsx
     import { cva, type VariantProps } from "class-variance-authority";

     const dotVariants = cva("size-2 shrink-0", {
       variants: {
         risk: {
           "at-risk": "text-ink-red-3",
           caution: "text-ink-amber-3",
           "on-track": "text-ink-green-3",
         },
       },
     });

     type DotProps = VariantProps<typeof dotVariants>;
     export function Dot({ risk }: DotProps) {
       return <svg aria-hidden className={dotVariants({ risk })} viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="4" /></svg>;
     }
     ```
   - `constants.ts` stays for pure-data constants (e.g. `PHASE_LABELS: Record<Phase, string>`, `VIEWS` arrays, option lists).
   - **Failure mode (PR #1220 round 3, `cells.tsx:1`)**: `RISK_DOT_CLASS`, `PHASE_INDICATOR_CLASS`, `BUDGET_TIER_CLASSES` were all `Record<variant, string>` maps. Ayush: *"For any cells which have variants or there internal have variant use Cva to expose those variants."*
   - **Failure mode (PR #1220 round 4, `constants.ts:51` + `budget-progress-cell.tsx:14`)**: After migrating to cva in round 3, I put all three `cva()` definitions into a shared `constants.ts` based on the design-system library pattern. Ayush: *"Variants are exempt from the rule of constants being in the constant file. Variants should be in the same file as components."* The design-system's `task-status/constants.ts` exports `statusIconVariants` because it's a library primitive; at the feature level I should have co-located.

3. **Design-system primitives over HTML elements**: what's the interactive target?
   - Buttons / chips / link-like targets inside the SPA → `Button` from `@rtcamp/frappe-ui-react` with the appropriate variant (`variant="ghost" | "subtle" | "solid" | "outline"`).
   - Badges → `Badge`. Text inputs → `TextInput`. Select → `Select`. Etc.
   - Anchors (`<a href>`) only for genuine outside-SPA links (e.g. `/desk/user/<email>`, `/api/*`, external URLs).
   - **Failure mode (PR #1220 round 3, `cells.tsx:84`)**: `ProjectNameCell` used `<a href onClick={preventDefault + navigate}>` inside the SPA. Ayush: *"A ghost button would be better here."*

4. **Upstream / in-flight work**: is someone already building this?
   - Run `gh pr list -R rtCamp/frappe-ui-react --state open --search <keyword>` (and `--state merged` for recent wins).
   - Glance at recent commits on the submodule if it's a design-system concern: `git log --oneline -20 frappe-ui-react/` (or on the remote).
   - If a close-to-merge upstream PR exists, use a minimal interim + leave a `@todo` pointing at it:
     ```tsx
     // @todo: use Stages icon from frappe-ui-react when
     //        https://github.com/rtCamp/frappe-ui-react/pull/248 is merged
     ```
   - **Failure mode (PR #1220 round 3, `cells.tsx:59`)**: I wrote a custom `StagesIcon` SVG without checking for an upstream icon PR. Ayush pointed at `frappe-ui-react#248`.

5. **One reusable component per file + subfolder grouping**:
   - Each reusable React component gets its own file, named after the component. **File names are `camelCase` (e.g. `dot.tsx`, `stagesIcon.tsx`, `projectNameCell.tsx`, `budgetProgressCell.tsx`). Folder names stay `kebab-case` (e.g. `cells/`, `list/`).**
   - Extension tracks content: `.ts` when there's no JSX (column definitions, constants, types, utilities), `.tsx` only for files with JSX/React components.
   - Do not bag several components into one `cells.tsx`.
   - Exception: a tiny helper component used only inside its parent and not extracted/reused can stay inline. The moment it's extracted, split it out.
   - **Subfolder grouping**: once a feature folder accumulates ~7 or more cell-like component files, group them into a `cells/` subdirectory. The dispatch component (the `switch(column.key)` that picks which cell renders) moves into the folder as `cells/index.tsx`, individual cell components are siblings inside. Keeps the feature-folder top level readable.
     ```
     pages/projects/list/
     ├── index.tsx            (ListView wiring)
     ├── columns.ts           (no JSX → .ts)
     ├── constants.ts         (PHASE_LABELS — pure data only)
     ├── types.ts
     ├── fake-data.ts
     └── cells/
         ├── index.tsx        (ProjectListCell dispatch)
         ├── dot.tsx
         ├── stagesIcon.tsx
         ├── dateCell.tsx
         ├── projectNameCell.tsx
         ├── phaseCell.tsx
         ├── budgetProgressCell.tsx
         └── employeeCell.tsx
     ```
   - **Failure mode (PR #1220 round 3, `cells.tsx:37` and `cells.tsx:59`)**: `Dot` and `StagesIcon` were left inside `cells.tsx` alongside `ProjectNameCell`, `PhaseCell`, etc. Ayush: *"Add this in a component file."*
   - **Failure mode (PR #1220 round 4, `cell.tsx:1`)**: Even after splitting to one-file-per-component, I left 8 cell files flat in `list/`. Ayush: *"Make a folder for all cells. This file will be the index file for the cells dir."*
   - **Failure mode (PR #1220 round 5)**: cell files were kebab-case (`date-cell.tsx`, `project-name-cell.tsx`) and `columns.tsx` was `.tsx` despite having no JSX. Ayush: *"file names should be always camelCase only folder names should be kebab-case"* and *"files that do not contain any React-related code... should use the .ts file extension."*

6. **Route completeness**:
   - Does your change introduce a navigation target (a new `href`, a new `navigate()` call)?
   - If yes, plan to land the destination route in the same PR. A placeholder route with `<UnderConstruction />` under the app's sidebar layout is fine.
   - Do not ship a link that 404s. The plan's "detail page is a separate issue" rationale is not the bar.
   - **Failure mode (PR #1220 round 3, `cells.tsx:71`)**: `ProjectNameCell` navigated to `/projects/<id>` with no matching route. Ayush: *"Project details page is not yet implemented. Add a new route to `projects/<project-name>`, show the under construction component on the route, Use the layout with sidebar."*

---

## Comment discipline

### The test

Before adding any comment, ask:

> *Could a reviewer get this from `git blame` (the commit message), the PR body, or the named identifiers in the code alone?*

If the answer is **yes even once**, delete the comment.

### What survives the test (basically only these)

- **A one-line note documenting a load-bearing correctness constraint** that is not obvious from the named identifiers or adjacent code. Example: `// base-ui Tooltip.Trigger requires a single child that forwards ref`.
- **A `@todo` pointing at tracked follow-up work** (GH issue, upstream PR, memory entry). A `@todo` without a pointer is narration — still delete.

### What does NOT survive

- *Rationale / tradeoff / "I chose X over Y because..."* → commit message.
- *"This is a Figma override"* / *"values come from review on date..."* → PR body or commit message.
- *"The surface-green scale isn't exposed so we extend..."* → commit message.
- *"The outer wrapper is flex (block) not inline-flex so..."* → delete, the class names are the documentation.
- *"Kept on ink-blue-3 pending clarification"* → ask in the review thread, don't leave dangling questions in the code.

### Pattern evidence

Three review rounds have flagged over-narrative comments:

- Round 1 (PR #1208 predecessor) — implicit: project conventions established.
- Round 2 (PR #1220 first pass, `cells.tsx:66`): *"Remove this comment."* (flex-block-level explanation)
- Round 2 (PR #1220 first pass, `cells.tsx:129`): *"False alarm"* (Avatar note)
- Round 3 (PR #1220 third pass, `cells.tsx:43`): *"Remove this comment."* (StagesIcon Figma note)
- Round 3 (PR #1220 third pass, `constants.ts:15`): *"Remove comment"* (phase-map override note)
- Round 3 (PR #1220 third pass, `global.css:158`): *"Remove comment"* (surface-token extension note)

Same anti-pattern six times across two rounds. The fix is not "write shorter comments" — it's **don't write comments**.

---

## Page file layout

- **Folder name follows the URL segment.** `/projects` → `pages/projects/` (plural). Don't mirror a neighbouring singular default. (PR #1208 correction: `pages/project/` → `pages/projects/`.)
- **Each `pages/<feature>/` has its own `constants.ts` + `types.ts`**, separately. The rule recurses into sub-folders: `pages/<feature>/<sub>/` also gets its own `constants.ts` + `types.ts`. **`constants.ts` is for pure-data constants** (labels, option arrays, enum-derived arrays) — **never for cva variants**. Variants are component behavior and co-locate with the component that consumes them.
- **Main page component is `index.tsx`**, exporting a component named after the feature (`Projects`, `Timesheet`). `layout.tsx` only for actual React-Router `<Outlet />` layouts (see `allocations/layout.tsx`); a route with a query-param switcher is NOT a layout.
- **Placeholder / child-view components sit next to `index.tsx`** (`list/`, `kanban/` — folders or files depending on scale). No ad-hoc `components/` subdir unless a maintainer explicitly asks.
- **Per-cell rendering lives in its own file**, not a `switch(column.key)` inside `index.tsx`. Dispatch component + individual visual components split per file.
- **Group cell files under a `cells/` subfolder** once the feature folder accumulates ~7 or more. The dispatch `switch` becomes `cells/index.tsx`; individual components are siblings inside. (PR #1220 round 4 correction.)

---

## UI details

- **Icon identifiers verified against Figma metadata or a design-system story, never eyeballed from a thumbnail.** `AlignLeft` vs `List` vs `TextAlignStart` look similar at thumbnail size. Even a reviewer's suggested name can be wrong — verify against the fix commit / component name. (PR #1208 correction: `List` → `AlignLeft`.)
- **Phase indicators are donut SVGs, not solid dots.** Figma component: `icon/solid/stages`. More generally, a small visual that *looks* like a solid dot in a low-resolution frame screenshot is often a themed icon instance — drill into the Figma leaf node's `<instance>` reference before rendering a `div.rounded-full`. (PR #1220 round 2 correction: dot → donut; round 3: use upstream `frappe-ui-react#248` icon when available.)
- **Prefer design-system Tailwind tokens.** Scales exposed: `ink-*` (gray-4/5/7/8, red-3, amber-3, green-3, cyan-3, blue-3, violet-3), `surface-*` (gray-2/7, red-1..7, green-1..3+5, amber-1..3+5, blue-1..3, cyan-1..2, violet-1..2, etc.). Where a scale stop is missing (e.g. `surface-green-5`, `surface-amber-5` until PR #1220), **extend `global.css`'s `@theme` block** — don't sidestep with arbitrary `bg-[#hex]` or inline `style={{ backgroundColor: ... }}`.
- **Variants via `cva`, co-located with the component (not in `constants.ts`).** See Pre-implementation scan step 2.
- **Tailwind v4 important modifier goes at the END of the class.** v3: `!bg-red-500` / `hover:!bg-red-500` / `[&>div]:!bg-red-500`. v4: `bg-red-500!` / `hover:bg-red-500!` / `[&>div]:bg-red-500!`. Variants still prefix. Ref: https://tailwindcss.com/docs/upgrade-guide#the-important-modifier. (PR #1220 round 5 correction.)
- **Cell/value text is 14px → `text-base`.** The frappe-ui-react theme maps `--text-base-size: 14px`. Every text-bearing cell element (primary value, labels beside icons, spans next to avatars) applies `text-base`. (PR #1220 round 5 correction.)
- **The whole text-size scale is shifted down 2px from Tailwind's default** in this theme: `text-xs`=12px, `text-sm`=13px, `text-base`=14px, `text-lg`=16px, `text-xl`=18px, `text-2xl`=20px, `text-3xl`=24px (see `frappe-ui-react/src/themeV3.css` `--text-*-size` vars). Map a Figma px value to its Tailwind token via this table — using `text-lg` for an 18px Figma value lands at 16px and is wrong; the 18px token is `text-xl`. (PR #1289 self-catch on the Tracking-tab `KnowledgePoint` value text.)
- **`truncate` on every cell text span.** ListView columns are resizable — unwrapped text line-breaks on narrow columns. `truncate` = `overflow-hidden text-ellipsis whitespace-nowrap`. (PR #1220 round 5 correction.)
- **Check `@rtcamp/frappe-ui-react/icons` before hand-rolling an SVG.** `SolidDotLg` = 16px solid dot (risk indicator); `SolidStatus` = status donut (project phase indicator). Both landed via `frappe-ui-react#248`. The full list is in `frappe-ui-react/packages/frappe-ui-react/src/icons/solid/index.ts`. (PR #1220 round 5 correction.)
- **`frappe-ui-react` `<Button>` icon props take a `ComponentType`, not a rendered element.** Typed `string | React.ComponentType<unknown>` — pass the import (`iconLeft={Pencil}`), not `iconLeft={<Pencil className="size-4" />}`. Sizing + color propagate from the Button's theme/size. A rendered element crashes with React #130 (*element type invalid, got: object*). Same rule for `icon` and `iconRight`. (PR #1265 discovery while implementing the Overview sub-header.)

---

## Reading Figma — drill to the leaf node

`mcp__figma__*` tools are scoped to the node you pass. Frame-level returns palette + structure; component-instance identity and per-element tokens live at the leaf.

- Chain: frame → row / cell → inner group → `<instance>` or text node. Stop at the leaf that represents the primitive you'll render.
- **Icon-like elements** (dot, donut, pill, chevron, badge): `get_metadata` on the parent cell → follow the `<instance>` to the component name → `get_design_context` on that component to see the SVG / variants. If a component name surfaces (e.g. `icon/solid/stages`), render that — not a custom shape.
- **Colors**: `get_variable_defs` on the specific element, not the frame. Frame-level over-indexes on tokens that don't apply.
- **Typography**: read the specific text node's token, not the frame's palette.

Ephemeral-asset caveat: Figma MCP serves images as 7-day-expiring PNG URLs. Don't commit the URL. Either pull the SVG via the component's `get_design_context`, use the upstream component (if in-flight), or render a minimal inline equivalent with a `@todo` pointing at the upstream PR.

File access note: rtBot has access to the **Copy** file (`h1EnhdK8swe6FCyxUW1XHx`, "Frappe-PMS--Copy-"). Issue bodies sometimes link the original `HGoZEoIH64xUwnqO5Y3zqx` — substitute the fileKey. Node IDs typically resolve across both files. Never call `get_metadata` / `get_design_context` on the file root `0:1` — returns ~5.8 MB.

---

## Formatting helpers + utility reuse

- **`date-fns` for all date/time work.** Don't hand-roll `Intl.DateTimeFormat` or use raw `new Date()` arithmetic. `parse(isoString, "yyyy-MM-dd", new Date())` + `format(d, "MMM d")` handles local-timezone anchoring correctly.
- **Check `lib/utils.ts` before creating a new utility.** Path: `frontend/packages/app/src/lib/utils.ts`. Also check `frontend/packages/design-system/src/utils/`.
- **Generally-useful helpers go in `lib/utils.ts`**, not a feature-local `format.ts` / `helpers.ts`. Feature-local utils only for feature-specific business logic.
- **Don't build formatter infrastructure for fake / placeholder data.** Currency → `` `$${amount.toLocaleString("en-US")}` `` inline; percent → `` `${n}%` `` inline. No helper function. Real currency wiring (locale + fraction digits + global default) is BE-integration work.

---

## Interaction patterns

- **Per-cell click handlers, not `onRowClick`** when only some cells should navigate. Attach `onClick` / wrap in `<Button>` on the specific cell component. `onRowClick` conflates checkbox-click, name-click, employee-click.
- **`Button variant="ghost"` for inside-SPA click targets**, not `<a>` + `onClick preventDefault + navigate`.
- **Employee / user cells navigate to `<base>/desk/user/<user_email>`**. Data contract: `EmployeeRef` / `UserRef` types require `email`, not just `name + initials`. The route exits the SPA mount — use `<a href>` for this one (genuinely outside-SPA).
- **Route completeness**: if a click handler points at a route that doesn't exist, add the placeholder route in the same PR (see Pre-implementation scan step 6).

---

## Workaround discipline

- **When a workaround grows defensive specificity or mirrors library internals, ping the maintainer before committing more cycles.** Signs the workaround is getting expensive:
  - Defensive selector specificity (chained `[&_.class]:` overrides, `!important`)
  - Mirroring library internal class names you don't control
  - A code comment that spans more than two lines explaining *why* the workaround exists
  - Multiple iterations patching side-effects of the workaround itself
  - Copilot / CodeRabbit flagging brittleness
- **Ask whether the AC might flex** — often cheaper than a rollback. (PR #1220 example: sticky-column `overflow-y-*` override saga went through two iterations before Ayush dropped the AC entirely.)
- **Check upstream PRs first.** `gh pr list -R rtCamp/frappe-ui-react --state open` — if the primitive is being added upstream, use a minimal interim + `@todo` pointing at the PR.

---

## Reading review comments

- **Path anchor vs body text**: when GitHub's inline-comment anchor says `pages/projects/index.tsx` but the body mentions `pages/project/...`, the anchor is the intent; treat the body path as a typo.
- **Fix commits trump earlier comments**: if a reviewer's comment says "do X" but their own follow-up commit doesn't include X, the commit wins. `git fetch` before starting a round of fixes; check for reviewer-pushed commits.
- **Carry review-round retrospectives**: each round of feedback follows a pattern. Before diving in to fix, scan the new comments for the *same anti-pattern* repeating (over-narrative comments, re-inventing a primitive, skipping a convention) — the meta-pattern is the thing to fix, not just the local bug.

---

## Review-round retrospectives

### PR #1208 (Projects Page Shell & View Switcher — merged 2026-04-19)

Corrections:
- Folder name plural (`project/` → `projects/`).
- `AlignLeft` not `List` for the list-view icon.
- Move query-param switcher out of `layout.tsx` into `index.tsx` (a query-switch route isn't a `<Outlet />` layout).

Lesson: verify canonical identifiers against design metadata; match folder name to URL, not repo defaults.

### PR #1212 (CLAUDE.md + vendored skills — merged 2026-04-20)

Mostly a doc PR. Established:
- Single PR per feature (no stacked sub-PRs).
- `plan_issue_<n>.md` naming convention, gitignored.
- Figma "Copy" file access rule.

### PR #1220 (Projects List View — in review)

**Round 1 (Copilot, 2026-04-20):** timezone bug in `new Date(isoDate)` (parses as UTC, formats in local). Fixed by splitting y/m/d.

**Round 2 (Copilot + Ayush, 2026-04-20):** 15 inline corrections —
- Use `ink-*-3` Tailwind tokens instead of hex for risk dots; same for phase dots (new map: delivery-prep=gray-4, development=cyan-3, launch=cyan-3, close-out=violet-3).
- Create `constants.ts` in the `list/` sub-folder.
- Phase indicator is a donut SVG (`icon/solid/stages`), not a solid dot.
- Extend `global.css` for missing `surface-green-5` / `surface-amber-5` tokens, don't use arbitrary hex.
- Use `date-fns`, not `Intl.DateTimeFormat`.
- Inline currency + percent at call sites, drop `formatCurrency` / `formatPercent` helpers.
- Move `ListViewColumn` type into `types.ts`.
- Separate `ProjectListCell` into `cell.tsx`.
- Per-cell navigation: `ProjectNameCell` navigates, `EmployeeCell` navigates to `/desk/user/<email>`, no `onRowClick`.
- Sticky column — dropped from AC entirely (workaround saga).
- Remove over-narrative comments.

**Round 3 (Ayush, 2026-04-21):** 9 more inline corrections —
- `Dot` in its own component file (not inline in `cells.tsx`).
- `StagesIcon` in its own file + `@todo` pointing at `frappe-ui-react#248`.
- Remove the StagesIcon explanatory comment.
- Add a placeholder route for `/projects/<project-name>` with `<UnderConstruction />` under the sidebar layout — don't ship a dangling link.
- Use `Button variant="ghost"` instead of `<a href onClick>`.
- Use `cva` for variant cells, not `Record<variant, className>` maps.
- Remove the phase-map override comment from `constants.ts`.
- Check `app/lib/utils.ts` before creating `format.ts`.
- Remove the `surface-*-5` explanation comment from `global.css`.

**Round 4 (Ayush, 2026-04-21 — 4 hours after round 3):** 3 more corrections —
- Variants (cva) co-locate with their component; don't put them in a shared `constants.ts`. (Design-system library pattern ≠ app feature-folder pattern.)
- Once a feature folder has ~7+ cell files, group them under a `cells/` subfolder; the dispatch becomes `cells/index.tsx`.
- Meta: even the first version of *this* skill had the wrong rule ("variants live in constants.ts") — I had used the design-system's `task-status/constants.ts` as the template. That pattern holds for library primitives exported for reuse, not for app-level feature components.

**Recurring anti-patterns across rounds:**
1. Over-narrative comments (flagged 6 times across rounds 2–3).
2. Not adopting a project convention I hadn't searched for (cva, date-fns, types-file-per-folder, `surface-*` scale, `lib/utils.ts`).
3. Aggregating components into a single file when the convention is one-per-file — *and* not stepping up a level to "and should these be in a subfolder?" (round 4).
4. Shipping "it works in my scope" instead of the adjacent complete path (missing destination route).
5. **Applying a pattern from the adjacent layer without checking it's the right layer**: `design-system/src/components/<name>/constants.ts` is a library shape (variants exported for reuse); `app/src/pages/<feature>/` is a feature shape (variants co-located with their single consumer). When grepping for a pattern, verify the match comes from the same layer as the code I'm writing. (Rounds 3 + 4.)

The Pre-implementation scan + Comment discipline sections above are written specifically to short-circuit these five.

---

## Files to reference while coding

- Project guide: `apps/next_pms/CLAUDE.md`
- This skill: `apps/next_pms/.claude/skills/next-pms-conventions/SKILL.md`
- Auto-memory index: `~/.claude/projects/<project-slug>/memory/MEMORY.md` (Claude Code resolves the slug from the working directory)
- Design tokens: `apps/next_pms/frontend/packages/app/src/global.css` (`@theme` block) + `apps/next_pms/frappe-ui-react/packages/frappe-ui-react/src/themeV3.css`
- Utilities (check first!): `apps/next_pms/frontend/packages/app/src/lib/utils.ts`, `apps/next_pms/frontend/packages/design-system/src/utils/`
- Existing cva usage: `rg "cva\(" apps/next_pms/frontend`
- Route registry: `apps/next_pms/frontend/packages/app/src/route.tsx`
- Under-construction component: `apps/next_pms/frontend/packages/app/src/components/under-construction.tsx`
