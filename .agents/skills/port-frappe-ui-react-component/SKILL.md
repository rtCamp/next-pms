---
name: port-frappe-ui-react-component
description: Port a component from the old React frontend (the next-pms design-system or the frappe-ui-react kit) into the next-pms Vue app (frontend/src/components/) with Storybook stories and interaction tests. Use when asked to port, migrate or recreate a React component (MonthPicker, Filter, ColumnSelector, TaskStatus, ApprovalStatus, timesheet rows, CalendarTimeline, NotificationTray…) in Vue, or to fill a gap frappe-ui doesn't cover. Also use before copying any Tailwind class from React code into Vue, page code included (cells, cards, headers): frappe-ui 1.0 shifted the token scales.
---

# Port a React component to Vue

next-pms is moving from React (`frappe-ui-react` + the next-pms design-system) to Vue 3 + frappe-ui. frappe-ui
lacks some components the old frontend had; each gap is ported into `frontend/src/components/<Name>/` with stories
that double as tests. MonthPicker (`frontend/src/components/MonthPicker/`) is the worked example; read it before
starting.

Read `frontend/AGENTS.md`, `frontend/PHILOSOPHY.md` and the `frappe-ui` skill first. P1, P2, P4–P7, P15 and P16
decide most porting questions.

## 1. Read the React sources and the old app

There are two React sources, and a component can exist in both:

- **design-system**: `develop:frontend/packages/design-system/src/components/` (`@next-pms/design-system`). The
  newer one, and the one the old app used for most next-pms components. It has no stories.
- **frappe-ui-react**: the old UI kit (`@rtcamp/frappe-ui-react`). Its submodule is gone from disk, but its git data
  is still in the main repo:

  ```bash
  G="git --git-dir=.git/modules/frappe-ui-react --work-tree=/tmp"
  P=packages/frappe-ui-react/src/components
  $G ls-tree -r --name-only HEAD $P/<folder>      # list files
  $G show HEAD:$P/<folder>/<file>                 # read one
  ```

  `HEAD` is the SHA `develop` pinned (`dbf3369`). It has `*.stories.tsx` and `*.interactions.stories.tsx`.

Then:

1. **Look in both sources.** When the component exists in both, compare them and port the version the old app
   imported (`@next-pms/design-system` or `@rtcamp/frappe-ui-react`). List the differences in your report. Never
   answer "already ported" without this comparison: the Timesheet rows were first ported from the outdated
   frappe-ui-react copy and missed most of the design-system's features.
2. **Read how the old app used it.** The call sites are the API spec:
   `git grep -n "<Name" develop -- frontend/packages/app`. Read the wrappers and overrides the app put on top (a
   replaced header, extra buttons, a composed popover): they are part of the behaviour to port.
3. Read the component, its types, constants and stories. Note which sibling components and npm packages it imports.

## 2. Map it onto frappe-ui

- Every imported sibling has a frappe-ui counterpart: Button, Popover, Dialog, Dropdown, Combobox (was
  autoComplete), Select, MultiSelect, DatePicker, Tooltip, Avatar, Badge, Breadcrumbs, Checkbox, TextInput… Check
  props and slots in `.agents/skills/frappe-ui/CORE.md` or `frontend/node_modules/frappe-ui/src/components/<Name>/`.
  Customise them as P15 says: props, then slots, then `data-slot` / `data-state` selectors.
- **Dependencies.** frappe-ui ships `@vueuse/core`, `reka-ui`, `dayjs` (import `dayjs` from `frappe-ui`) and
  `@floating-ui/vue`; use them first. Add a new npm package when it is truly needed or clearly improves the code or
  the UX (for example `@dnd-kit/vue` for drag and drop with a floating row, `class-variance-authority` for variants).
  Install it with `npm install` in `frontend/` and give the reason in your report.
- Icons: `lucide-*` class names (`<span class="lucide-x size-4" aria-hidden="true" />`, or `icon="lucide-x"` on
  props). FeatherIcon / lucide-react / `../../icons` components all become class icons. Pick the closest lucide icon;
  if none fits, stop and report (custom icons go in `src/icons/`).
- Colours: semantic tokens only (`bg-surface-*`, `text-ink-*`, `border-outline-*`). React hex maps and raw palettes
  (`bg-blue-100`) become tokens or a frappe-ui `theme`.

### Translate the tokens

frappe-ui 1.0 renamed tokens, shifted the colour steps and font sizes, and replaced the radius scale. A token copied
as-is either generates no CSS or renders a different shade, and neither lint nor a visual test catches the shade:
`text-ink-red-3` is a valid class in both, and in Vue it renders a dark, muted red instead of React's bright one.
This applies to every class taken from React, wherever it lands: a page's cells and cards (the projects page's RAG
dot and phase icon shipped untranslated) as much as a component here. Translate with frappe-ui's codemod, on a copy
of the React files, never on Vue files:

```bash
T=$(mktemp -d)
git show develop:<path/to/component.tsx> > $T/component.tsx   # and its constants.ts, …
(cd frontend && npx tokens-v2 --force $T)
```

Port from the rewritten copy. `--force` skips the codemod's "already migrated" guess, which is wrong for untouched
React code. The colour renames shift numbers, so the codemod must run exactly once on a file: never run it on a
ported Vue file, or the colours shift twice.

What it changes, for reference when a class reaches you some other way:

| React | frappe-ui 1.0 |
|---|---|
| `surface-<colour>-5` / `-6` / `-7` | `-7` / `-8` / `-9` |
| `surface-gray-5` / `-6` / `-7` | `-8` / `-9` / `-10` |
| `ink-<colour>-2` / `-3` / `-4` | `-5` / `-6` / `-8` |
| `outline-gray-5` | `-7` |
| `outline-<colour>-2` / `-3` / `-4` | `-3` / `-4` / `-5` |
| `surface-white`, `ink-white`, `outline-white` | `surface-base`, `ink-base`, `outline-base` |
| `surface-cards`, `surface-modal`, `surface-selected`, `surface-menu-bar` | `surface-elevation-1`, `-2`, `-3`, `surface-sidebar` |
| `text-xl` (18px), `text-2xl` (20px), `text-3xl` (24px) | `text-2xl`, `text-3xl`, `text-4xl` |
| `text-base font-medium` | `text-base-medium` |

`<colour>` is red, blue, green, amber or violet. Full map:
`frontend/node_modules/frappe-ui/tailwind/migrate-tokens-v2.js`; valid colour names:
`frontend/node_modules/frappe-ui/tailwind/tokens/colors.js`. The default line height changed from 1.15 to 1.35;
use `leading-tighter` where React relied on 1.15.

The codemod only knows those five. frappe-ui-react added its own `ink-cyan-*` and `ink-pink-*` on the same steps
(`ink-cyan-3` and `ink-red-3` are both the `-500` shade), and the codemod leaves them alone. Shift them by hand like
the five: `ink-cyan-3` → `ink-cyan-6`.

The translation is done when every colour, font-size and radius class that came from React has gone through the
codemod or this section, checked by grepping the files you wrote:

```bash
grep -nE "(ink|surface|outline)-[a-z]+-[0-9]|text-(xl|2xl|3xl)\b|rounded" <files>
```

Each hit is either the codemod's output or a class you wrote yourself; anything copied straight from React gets
translated.

The design-system used Tailwind 4, which allows any spacing step. The frappe-ui preset allows half steps from 0.5 to
19.5 and whole steps from 1 to 128 (`h-4.5`, `w-18`, `min-w-100`). Quarter steps (`w-4.25`) and larger values become
the nearest valid step, or a `[...]` value when the exact size matters. `npm run lint` flags classes that generate no
CSS.

## 3. Translate the API (P7)

| React | Vue |
|---|---|
| `value` + `onChange(v)` | `v-model`: `modelValue` prop + `update:modelValue` emit |
| other `onX` callbacks | emits (`defineEmits`) |
| `className` | `class` falls through: `defineOptions({ inheritAttrs: false })` + `v-bind="$attrs"` on the right element when it isn't the root |
| `children` / render props / `ReactNode` props | slots (named slots for `actions`, `title`, …) |
| icon component props | `icon` string prop |
| `placement` (popper) | `side` + `align` (frappe-ui Popover) |
| `useState` / `useMemo` / `useCallback` | `ref` / `computed` / plain functions |
| injected `<style>` strings | Tailwind classes + tokens |
| status strings and maps | the shared type and component (`TaskStatusValue`, `ApprovalStatus`…), P16 |

Keep the behaviour and the feel of the React version: drag with a floating row, animations, hover cards, whole-row
click targets. When a port can't keep something, say what was lost in your report. Fix obvious bugs while porting
(wrong aria-labels, wrong highlight logic) and list each fix in your report.

## 4. Files

```
frontend/src/components/<Name>/
  <Name>.vue                        <script setup lang="ts">
  <Name>.stories.ts                 visual stories
  <Name>.interactions.stories.ts    stories with play functions
  <Name>.fixtures.ts                sample data both story files share (plain data only), when needed
  types.ts                          <Name>Props (+ shared types), with a one-line doc comment per prop
  index.ts                          export { default as <Name> } from "./<Name>.vue"; export type * from "./types";
```

A family (e.g. timesheet rows) gets one folder per component, or one folder with several `.vue` files and one
`index.ts`, whichever mirrors the source. Touch nothing outside your component folder(s), apart from the
`src/components/Components.md` catalogue row and any dependency you add.

## 5. Stories (P5, P6)

- `<Name>.stories.ts`: title `Components/<Name>`, `tags: ["autodocs"]`, one component instance per story, no `play`.
  Port every visual story from the React stories.
- `<Name>.interactions.stories.ts`: title `Components/<Name>/Interactions`, `tags: ["interaction"]`, one behaviour per
  `play` function (`expect`, `fn`, `screen`, `userEvent`, `waitFor`, `within` from `storybook/test`). Port every React
  interaction story; a component without them still gets interaction stories for its main behaviour.
- Use `fn()` spies for emits (`"onUpdate:modelValue": fn()`). For `v-model`, update the args, so the Controls panel
  and the tests both see the change:

  ```ts
  render: (args) => {
    const [, updateArgs] = useArgs(); // from "storybook/preview-api"
    return {
      components: { Name },
      setup: () => ({
        args,
        update: (modelValue: Value) => {
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, { modelValue });
          updateArgs({ modelValue });
        },
      }),
      template: `<Name v-bind="args" @update:model-value="update" />`,
    };
  },
  ```

- Use fixed dates in sample data. Wait with `waitFor`, never a timeout.
- Find elements by role and accessible name; assert ARIA state (`aria-pressed`, `aria-expanded`, `aria-checked`) and
  visible text, not classes, icon classes or test-only attributes. Popover and dialog content is portaled to
  `document.body`: query it with `screen`, not `within(canvas)`.
- **Gotcha:** frappe-ui `Button` sets `aria-label` from `label` and ignores a passed `aria-label`. When a button needs
  its own accessible name, put the text in the default slot and pass `aria-label`.

## 6. Verify

Run in `frontend/`:

1. `npm run type-check`: passes.
2. `npx eslint src/components/<Name>`: no errors. Fix warnings, or keep them with a one-line reason.
3. `npx vitest --project storybook --run src/components/<Name>`: all stories pass, including the accessibility
   check. This is the verification gate; the Storybook MCP is not required.
4. Visual check: with Storybook on http://localhost:6006 (start `npm run storybook` if it isn't running), open each
   story at `http://localhost:6006/iframe.html?id=components-<name>--<story>&viewMode=story&globals=theme:light`
   and again with `theme:dark` in your own browser tab; screenshot; no console errors. Compare with the React
   version where you can.
5. `npx prettier --write` on the files you created or changed.

Do not commit; the coordinator reviews and commits each component.

## 7. Report

End with:

- files created, and any dependency added with the reason
- which React source you ported, and how the design-system and frappe-ui-react versions differ
- the API (props, emits, slots) and how it maps from React and from the old app's call sites
- React stories ported and stories added; test result (`N/N passed`)
- bugs fixed or behaviour changed while porting
- React UX that the port lost, and why
- anything skipped and why; open questions
