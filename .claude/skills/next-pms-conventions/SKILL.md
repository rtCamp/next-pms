---
name: next-pms-conventions
description: >
  Project-specific conventions for the next-pms React/Tailwind/frappe-ui-react
  codebase. Load before writing or editing code in apps/next_pms/frontend/**.
  Covers a pre-implementation scan, comment discipline, file-layout rules,
  design-system primitive reuse, cva variant handling, design-reading rules,
  utility reuse, and interaction/navigation patterns. Run the
  "Pre-implementation scan" before writing any new component, cell, helper,
  utility, or styling override.
  Keywords: next-pms, Projects, Timesheet, redesign, list view, ListView,
  cell, cells, Tailwind token, ink-gray, ink-red, surface-green, surface-amber,
  cva, class-variance-authority, frappe-ui-react, Button, Avatar, Tooltip,
  design-system, Figma, icons, pre-implementation scan, comment discipline,
  lib/utils, date-fns, types file, constants file, component per file,
  ghost button, desk/user route, upstream PR, apps/next_pms.
license: internal
compatibility: "Designed for Claude Code. Next_pms monorepo (React 19 + Tailwind 4 + frappe-ui-react submodule + next_pms Frappe app)."
metadata:
  version: "2.0"
---

# next-pms-conventions

Ordered rules for writing code in the next-pms frontend. The pre-implementation scan is the highest-leverage section. Run it first.

## Critical warnings

**NEVER** start writing a cell, component, or helper before running the `Pre-implementation scan` below.

**NEVER** add a code comment unless it passes the test in `Comment discipline`. The default is no comment.

**NEVER** use a `Record<variant, className>` map, an enum-to-class lookup, or a switch for a component with variants. Use `class-variance-authority` (cva), **co-located with the component that consumes it**, never in `constants.ts`.

**NEVER** leave ~7 or more cell-like component files flat in a feature folder. Group them in a `cells/` subfolder with the dispatch as `cells/index.tsx`.

**NEVER** use `<a href>` + `onClick={preventDefault; navigate}` for an inside-SPA target. Use `<Button variant="ghost">` from `@rtcamp/frappe-ui-react`. Anchors are only for links that leave the SPA.

**NEVER** ship a navigation target that 404s. If the destination page isn't built, add a placeholder route (`<UnderConstruction />` under the sidebar layout) in the same PR.

**ALWAYS** check `frontend/packages/app/src/lib/utils.ts` before creating a feature-local `format.ts` / `helpers.ts`.

**ALWAYS** format changed JS/TS with the repo's prettier (`4.0.0-alpha.8`) before committing. `npm run build:app` does not run prettier or eslint, so a green build says nothing about formatting. See CLAUDE.md §6 for the lint checks CI enforces.

---

## Pre-implementation scan (≈ 2 minutes, always)

Run before writing code for any new component, cell, helper, or styling override.

1. **Utilities**: does the helper already exist?
   - Search `frontend/packages/app/src/lib/` and `frontend/packages/design-system/src/utils/`.
   - If it exists, import it.
   - If not and it is generally useful (date, currency, URL, string), add it to `lib/utils.ts`.
   - Feature-local helpers only for logic specific to one feature.

2. **Component variants via cva**: does the component have variants?
   - A variant is any prop that switches classNames (risk, phase, tier, size, theme, status, state, intent).
   - Define them with `cva` **in the component's own file**:
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
   - Match the layer. `design-system/src/components/<name>/constants.ts` exports variants because it is a library primitive meant for reuse. In `app/src/pages/<feature>/`, variants live with their single consumer.
   - `constants.ts` is only for pure data (e.g. `PHASE_LABELS: Record<Phase, string>`, `VIEWS` arrays, option lists).

3. **Design-system primitives over HTML elements**:
   - Inside-SPA buttons, chips, and link-like targets → `Button` from `@rtcamp/frappe-ui-react` with the right variant (`ghost | subtle | solid | outline`).
   - Badges → `Badge`. Text inputs → `TextInput`. Select → `Select`. Etc.
   - `<a href>` only for links that leave the SPA (`/desk/user/<email>`, `/api/*`, external URLs).
   - **Check library exports before writing any primitive** (`Avatar`, `HoverCard`, `Dialog`, `Popover`, `Progress`, `Tooltip`, `Card`, ...):
     1. Search `frontend/packages/design-system/src/components/index.ts` and the frappe-ui-react `dist/index.d.ts` for the name.
     2. If found, import it.
     3. For animation or open/close behavior, check whether the base-ui (or radix) primitive ships a class (e.g. `accordion-panel`) before hand-rolling `transition-*` utilities.
   - **No re-export wrappers.** A file whose only job is `export { X } from "library/x"` is dead indirection. Import from the library at the call site.

4. **Upstream / in-flight work**: is someone already building this?
   - Run `gh pr list -R rtCamp/frappe-ui-react --state open --search <keyword>` (and `--state merged` for recent additions).
   - If a close-to-merge upstream PR exists, ship a minimal interim with a `@todo` pointing at it:
     ```tsx
     // @todo: use <Name> from frappe-ui-react when <upstream PR URL> is merged
     ```

5. **One reusable component per file**:
   - File names are `camelCase` (`dot.tsx`, `projectNameCell.tsx`). Folder names are `kebab-case` (`cells/`, `list/`).
   - `.ts` when a file has no JSX (columns, constants, types, utilities). `.tsx` only when it has JSX.
   - Don't bag several components into one `cells.tsx`.
   - **Don't extract trivial single-use components.** A new file is justified when (a) it is used in more than one place, or (b) it is single-use but has real behavior (state, effects, formatting, conditional branches). Otherwise inline it. For a row repeated N× in one parent, a `grid-cols-[auto_1fr]` layout in the parent usually replaces the row component.
   - **File name is contextual to its folder.** Under `about/`, name it `section.tsx`, not `aboutSection.tsx`.
   - **Subfolder grouping**: at ~7 or more cell files, move them into `cells/`, with the dispatch (`switch(column.key)`) as `cells/index.tsx`:
     ```
     pages/projects/list/
     ├── index.tsx            (ListView wiring)
     ├── columns.ts           (no JSX → .ts)
     ├── constants.ts         (pure data only)
     ├── types.ts
     └── cells/
         ├── index.tsx        (dispatch)
         ├── dot.tsx
         ├── dateCell.tsx
         ├── projectNameCell.tsx
         ├── phaseCell.tsx
         ├── budgetProgressCell.tsx
         └── employeeCell.tsx
     ```

6. **Route completeness**:
   - If the change adds a navigation target (`href`, `navigate()`), land the destination route in the same PR. A placeholder `<UnderConstruction />` route under the sidebar layout is fine.
   - "The detail page is a separate issue" is not a reason to ship a dead link.

---

## Comment discipline

### The test

> *Could a reviewer get this from `git blame` (the commit message), the PR body, or the named identifiers alone?*

If yes, delete the comment.

### What survives

- **A one-line note on a load-bearing correctness constraint** that isn't obvious from the code. Example: `// base-ui Tooltip.Trigger requires a single child that forwards ref`.
- **A `@todo` pointing at tracked follow-up work** (issue, upstream PR). A `@todo` without a pointer is narration, delete it.

### What does not survive

- Rationale, tradeoffs, "I chose X over Y because..." → commit message.
- "This is a design override", "values came from review" → PR body or commit message.
- Explanations of why a token or scale was extended → commit message.
- Descriptions of what class names already say → delete.
- Open questions ("kept on X pending clarification") → ask in the review thread.

The fix is not shorter comments. It is no comments.

---

## Page file layout

- **File names are `camelCase`, folder names are `kebab-case`.** Applies to every file under `frontend/packages/**`. No kebab-case, PascalCase, or snake_case file names.
- **Folder name follows the URL segment.** `/projects` → `pages/projects/` (plural). Don't copy a neighbouring singular name.
- **Each `pages/<feature>/` has its own `constants.ts` + `types.ts`.** This recurses into sub-folders. `constants.ts` holds pure data only, never cva variants.
- **Main page component is `index.tsx`**, exporting a component named after the feature (`Projects`, `Timesheet`). `layout.tsx` is only for real React Router `<Outlet />` layouts (see `allocations/layout.tsx`). A query-param view switcher is not a layout.
- **Child views sit next to `index.tsx`** (`list/`, `kanban/`). No ad-hoc `components/` subdir unless a maintainer asks for one.
- **Per-cell rendering lives in its own file**, not a `switch(column.key)` inside `index.tsx`.

---

## UI details

- **Verify icon identifiers against the design system or design metadata, never by eye.** `AlignLeft`, `List`, and `TextAlignStart` look alike at thumbnail size. Even a reviewer's suggested name can be wrong.
- **Small indicators are often themed icons.** Something that looks like a solid dot in a screenshot may be an icon instance (e.g. the phase indicator is a status donut). Check before rendering a `div.rounded-full`.
- **Use design-system Tailwind tokens.** Scales: `ink-*` (gray, red, amber, green, cyan, blue, violet), `surface-*` (gray, red, green, amber, blue, cyan, violet). If a stop is missing, **extend the `@theme` block in `global.css`**. Never use arbitrary `bg-[#hex]` or inline `style={{ backgroundColor }}`.
- **Tailwind v4 important modifier goes at the END.** `bg-red-500!`, `hover:bg-red-500!`, `[&>div]:bg-red-500!`. Not v3's `!bg-red-500`.
- **Text scale is shifted down 2px from Tailwind's default** (see `themeV3.css` `--text-*-size`): `text-xs`=12px, `text-sm`=13px, `text-base`=14px, `text-lg`=16px, `text-xl`=18px, `text-2xl`=20px, `text-3xl`=24px. Map design px values through this table (18px is `text-xl`, not `text-lg`).
- **Cell text is `text-base` (14px) + `truncate`.** ListView columns are resizable, so unwrapped text breaks lines on narrow columns.
- **Check `@rtcamp/frappe-ui-react/icons` before hand-rolling an SVG.** `SolidDotLg` = 16px solid dot (risk indicator). `SolidStatus` = status donut (phase indicator). Full list: `frappe-ui-react/packages/frappe-ui-react/src/icons/solid/index.ts`.
- **Missing icons go in `@next-pms/design-system`**, not inline in a page. Add `frontend/packages/design-system/src/components/icons/<name>.tsx` (single component, `viewBox`, `fill="currentColor"`, spreads `SVGProps<SVGSVGElement>`), re-export from `components/icons/index.ts`, import via `@next-pms/design-system/components`. Open a frappe-ui-react PR to upstream it.
- **`<Button>` icon props take a `ComponentType`, not an element.** `iconLeft={Pencil}`, not `iconLeft={<Pencil className="size-4" />}`. A rendered element crashes with React #130. Same for `icon` and `iconRight`. Size and color come from the Button.
- **base-ui `Accordion.Root` needs `multiple`** to allow more than one open section. The default is single-open, and `defaultValue={[...]}` alone collapses the others on first click. The prop is `multiple`, not `openMultiple`.

---

## Reading designs

Designs arrive as screenshots, or occasionally a Figma link shared by a human.

- **Drill to the leaf.** Frame-level views give palette and structure. Component identity and per-element tokens live at the leaf (cell → inner group → instance or text node). Read the token of the specific element, not the frame's palette.
- **Icon-like elements** (dot, donut, pill, chevron, badge): find the component name behind the instance and render that component, not a custom shape.
- **Never commit exported asset URLs.** Figma image URLs expire. Use the upstream component, or a minimal inline equivalent with a `@todo` pointing at the upstream PR.
- **Designs are the visual spec, AC is the behavioral spec.** Hover popups, click handlers, modals, and toasts need an AC bullet or an explicit decision in the plan thread. If a design shows an interaction state that AC doesn't mention, raise it as a decision and wait for a yes. Don't infer "show details on hover" from an avatar + name row.

---

## Formatting helpers + utility reuse

- **`date-fns` for all date/time work.** No hand-rolled `Intl.DateTimeFormat` or raw `new Date()` arithmetic. `parse(isoString, "yyyy-MM-dd", new Date())` + `format(d, "MMM d")` anchors to local time correctly (`new Date(isoDate)` parses as UTC).
- **Check `lib/utils.ts` and `design-system/src/utils/` before creating a utility.** Generally useful helpers go in `lib/utils.ts`.

---

## Interaction patterns

- **Per-cell click handlers, not `onRowClick`**, when only some cells navigate. `onRowClick` conflates checkbox, name, and employee clicks.
- **`Button variant="ghost"` for inside-SPA click targets.**
- **Employee / user cells link to `<base>/desk/user/<user_email>`.** `EmployeeRef` / `UserRef` must carry `email`. This route leaves the SPA, so use `<a href>`.

---

## Recurring anti-patterns

The scan and comment rules above exist to prevent these:

1. **Over-narrative comments.** Rationale belongs in the commit message.
2. **Skipping a project convention you didn't search for** (cva, date-fns, per-folder `types.ts`, `surface-*` tokens, `lib/utils.ts`, library primitives).
3. **Aggregating components into one file**, and not asking the next question: should these files be in a subfolder?
4. **Shipping only your own scope** instead of the complete adjacent path (e.g. the destination route).
5. **Copying a pattern from the wrong layer.** A design-system library shape (variants exported from `constants.ts`) is not a feature-folder shape. When grepping for precedent, confirm the match is from the same layer you're writing in.

---

## Files to reference while coding

- Project guide: `apps/next_pms/CLAUDE.md`
- Design tokens: `frontend/packages/app/src/global.css` (`@theme`) + `frappe-ui-react/packages/frappe-ui-react/src/themeV3.css`
- Utilities (check first): `frontend/packages/app/src/lib/utils.ts`, `frontend/packages/design-system/src/utils/`
- Existing cva usage: `rg "cva\(" frontend`
- Route registry: `frontend/packages/app/src/route.tsx`
- Under-construction component: `frontend/packages/app/src/components/under-construction.tsx`
