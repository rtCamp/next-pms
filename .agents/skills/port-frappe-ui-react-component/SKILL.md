---
name: port-frappe-ui-react-component
description: Port a component from the old React kit frappe-ui-react into the next-pms Vue app (frontend/src/components/) with Storybook stories and interaction tests. Use when asked to port, migrate or recreate a frappe-ui-react component (MonthPicker, Filter, ColumnSelector, Card, CircularProgressBar, TaskStatus, timesheet rows…) in Vue, or to fill a gap frappe-ui doesn't cover.
---

# Port a frappe-ui-react component to Vue

next-pms is moving from React + `frappe-ui-react` to Vue 3 + frappe-ui. frappe-ui lacks some components the old kit
had; each gap is ported into `frontend/src/components/<Name>/` with stories that double as tests. MonthPicker
(`frontend/src/components/MonthPicker/`) is the finished worked example — read it before starting.

Read `frontend/AGENTS.md`, `frontend/PHILOSOPHY.md` (rules P1–P10) and the `frappe-ui` skill first. P1, P2, P4, P5,
P6 and P7 decide most porting questions.

## 1. Read the React source

The submodule is gone from disk, but its git data is still in the main repo. From the repo root:

```bash
G="git --git-dir=.git/modules/frappe-ui-react --work-tree=/tmp"
P=packages/frappe-ui-react/src/components
$G ls-tree -r --name-only HEAD $P/<folder>      # list files
$G show HEAD:$P/<folder>/<file>                 # read one
```

`HEAD` is the SHA `develop` pinned (`dbf3369`). Read the component, its `types.ts`, and every `*.stories.tsx`
including `*.interactions.stories.tsx`. Note which sibling components it imports (`../button`, `../popover`…) and
which npm packages.

To see how the old next-pms app called it: `git grep -n "<Name" develop -- frontend/packages`.

## 2. Map it onto frappe-ui

- Every imported sibling has a frappe-ui counterpart: Button, Popover, Dialog, Dropdown, Combobox (was
  autoComplete), Select, MultiSelect, DatePicker, Tooltip, Avatar, Badge, Breadcrumbs, Checkbox, TextInput… Check
  props and slots in `.agents/skills/frappe-ui/CORE.md` or `frontend/node_modules/frappe-ui/src/components/<Name>/`.
- **No new npm dependencies.** frappe-ui ships `@vueuse/core`, `reka-ui`, `dayjs` (import `dayjs` from
  `frappe-ui`), `@floating-ui/vue`. Replace React-only packages with these or plain Vue (native HTML5 drag events
  instead of `@dnd-kit`, frappe-ui Combobox instead of `@headlessui`). If a dependency is truly unavoidable, stop and
  report instead of editing `package.json`.
- Icons: `lucide-*` class names (`<span class="lucide-x size-4" aria-hidden="true" />`, or `icon="lucide-x"` on
  props). FeatherIcon / lucide-react / `../../icons` components all become class icons. Don't port the custom icon set;
  pick the closest lucide icon, and if none fits, stop and report (custom icons go in `src/icons/`).
- Colours: semantic tokens only (`bg-surface-*`, `text-ink-*`, `border-outline-*`). React hex maps and raw palettes
  (`bg-blue-100`) become tokens or a frappe-ui `theme`.
- Use frappe-ui **1.0 (v2) token names**. The React kit used v1 names that no longer exist, and Tailwind silently
  generates nothing for them: `surface-white` → `surface-base`, `surface-cards` / `surface-card` →
  `surface-elevation-1`, `surface-modal` → `surface-elevation-2`, `surface-selected` → `surface-elevation-3`,
  `surface-menu-bar` → `surface-sidebar`, `ink-white` → `ink-base`, `outline-white` → `outline-base`. Full map:
  `frontend/node_modules/frappe-ui/tailwind/migrate-tokens-v2.js`; valid names:
  `frontend/node_modules/frappe-ui/tailwind/tokens/colors.js`. Grep every class you use against that file.

## 3. Translate the API (P7)

| React | Vue |
|---|---|
| `value` + `onChange(v)` | `v-model` — `modelValue` prop + `update:modelValue` emit |
| other `onX` callbacks | emits (`defineEmits`) |
| `className` | `class` falls through: `defineOptions({ inheritAttrs: false })` + `v-bind="$attrs"` on the right element when it isn't the root |
| `children` / render props / `ReactNode` props | slots (named slots for `actions`, `title`, …) |
| icon component props | `icon` string prop |
| `placement` (popper) | `side` + `align` (frappe-ui Popover) |
| `useState` / `useMemo` / `useCallback` | `ref` / `computed` / plain functions |
| injected `<style>` strings | Tailwind classes + tokens; scoped `<style>` only if Tailwind can't express it |

Keep behaviour 1:1. Fix obvious bugs while porting (wrong aria-labels, wrong highlight logic) and list each fix in
your report.

## 4. Files

```
frontend/src/components/<Name>/
  <Name>.vue           <script setup lang="ts">
  <Name>.stories.ts    visual stories + interaction stories
  types.ts             <Name>Props (+ shared types), with a one-line doc comment per prop
  index.ts             export { default as <Name> } from "./<Name>.vue"; export type * from "./types";
```

A family (e.g. timesheet rows) gets one folder per component, or one folder with several `.vue` files and one
`index.ts`, whichever mirrors the source. Touch nothing outside your component folder(s).

## 5. Stories (P5, P6)

- Title `Components/<Name>`, `tags: ["autodocs"]`, a meta-level `render` that binds `v-model` to a local `ref`,
  `fn()` spies for emits (e.g. `"onUpdate:modelValue": fn()`).
- Port every visual story from `<name>.stories.tsx`, and every story from `<name>.interactions.stories.tsx` as a
  story with `tags: ["interaction"]` and a `play` function (`expect`, `fn`, `screen`, `userEvent`, `waitFor`,
  `within` from `storybook/test`). Components without React interaction stories still get interaction stories for
  their main behaviour.
- Find elements by role and accessible name; assert ARIA state (`aria-pressed`, `aria-expanded`, `aria-checked`), not
  CSS classes. Popover/dialog content is portaled to `document.body`: query it with `screen`, not `within(canvas)`.
- **Gotcha:** frappe-ui `Button` sets `aria-label` from `label` and ignores a passed `aria-label`. When a button needs
  its own accessible name, put the text in the default slot and pass `aria-label`.

## 6. Verify

Run in `frontend/`:

1. `npm run type-check` — passes.
2. `npx vitest --project storybook --run src/components/<Name>` — all stories pass. This is the verification gate;
   the Storybook MCP is not required.
3. Visual check: with Storybook on http://localhost:6006 (start `npm run storybook` if it isn't running), open each
   story at `http://localhost:6006/iframe.html?id=components-<name>--<story>&viewMode=story&globals=theme:light`
   and again with `theme:dark` in your own browser tab; screenshot; no console errors.
4. `npx --yes prettier@4.0.0-alpha.8 --write` on the new `.ts` files.

Do not commit, and do not touch shared files (`package.json`, lockfile, `.storybook/`, other components); the
coordinator reviews and commits each component.

## 7. Report

End with: files created; the API (props, emits, slots) and how it maps from React; React stories ported and stories
added; test result (`N/N passed`); bugs fixed or behaviour changed while porting; anything skipped and why; open
questions.
