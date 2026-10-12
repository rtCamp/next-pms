# Philosophy — next-pms frontend

Rules for anyone changing `frontend/`: contributors, AI agents and reviewers. Each rule has a number. Cite it in PRs
and reviews ("this breaks P3"). When a rule is wrong for a real case, change the rule in this file; don't add a
quiet exception in code.

Precedence: this file > [`CONTEXT.md`](CONTEXT.md) > existing code.

---

## P1 — frappe-ui first

**Rule.** Build UI from frappe-ui components. Add a component to `src/components/` only when frappe-ui has nothing
that fits, and give it its own folder: `Name/{Name.vue, Name.stories.ts, types.ts, index.ts}`.

**Why.** One component library keeps the app consistent with other Frappe products, and every custom component is
code we maintain.

**Bad**

```vue
<button class="rounded bg-gray-900 px-3 py-1 text-white" @click="save">Save</button>
```

**Good**

```vue
<Button variant="solid" label="Save" @click="save" />
```

## P2 — Two-way state is `v-model`

**Rule.** Inputs take `v-model`; overlays take `v-model:open`. A custom component exposes `modelValue` +
`update:modelValue` rather than a `value` prop and a `change` callback.

**Why.** It matches frappe-ui's contract, so our components compose with theirs without adapters.

**Bad** `<MonthPicker :value="month" @change="month = $event" />`

**Good** `<MonthPicker v-model="month" />`

## P3 — Server data goes through frappe-ui composables

**Rule.** Fetch and write data with frappe-ui's `useCall`, `useList`, `useDoc`, `useDoctype` and `useNewDoc`. Never
call `fetch` or axios directly.

**Why.** The composables handle CSRF, Frappe's response format, server messages and errors in one place.

**Bad** `const res = await fetch("/api/method/next_pms.timesheet.api.task.get_liked_tasks")`

**Good** `const likedTasks = useCall({ url: "/api/v2/method/next_pms.timesheet.api.task.get_liked_tasks" })`

## P4 — Semantic colour tokens and class icons

**Rule.** Colours come from the semantic scales: `bg-surface-*`, `text-ink-*`, `border-outline-*`. Icons are
`lucide-*` CSS classes, or the icon name string on props such as `icon`. There is no custom icon set; an icon lucide
lacks goes in `frontend/icons/` as a Vue SFC with an inline SVG that uses `currentColor`, passed to frappe-ui's `icon`
props as a component (ask before adding one).

**Why.** Semantic tokens switch with light and dark mode; raw palette classes and hex values don't.

**Bad** `<div class="bg-white text-gray-700">` · `<ChevronLeft />`

**Good** `<div class="bg-surface-base text-ink-gray-7">` · `<Button icon="lucide-chevron-left" />`

## P5 — Components ship with stories, and behaviour with interaction stories

**Rule.** Every component in `src/components/` has a `Name.stories.ts` with its visual states. Behaviour (opening,
selecting, navigating) is covered by stories with a `play` function, and `npm run test-storybook` passes.

**Why.** Stories are the component's documentation for people and for agents (through the Storybook MCP), and the
`play` stories are its tests.

## P6 — Accessibility is part of done

**Rule.** Interactive elements have accessible names, and state is exposed through ARIA (`aria-pressed`,
`aria-expanded`, …). Tests find elements by role and name, and assert ARIA state rather than CSS classes.

**Why.** Tests written this way survive restyling, and the app works with a keyboard and screen reader.

Gotcha: frappe-ui's `Button` uses its `label` as the `aria-label` and ignores one passed in. When a button needs a
different accessible name, put the text in the default slot and pass `aria-label`.

**Bad** `expect(marchButton).toHaveClass("bg-surface-gray-10")`

**Good** `expect(marchButton).toHaveAttribute("aria-pressed", "true")`

## P7 — Port behaviour, not the React API

**Rule.** When porting from the React app or `frappe-ui-react`, keep the behaviour and translate the API to Vue and
frappe-ui conventions:

| React | Vue |
|---|---|
| `value` + `onChange` | `v-model` |
| icon passed as a component | icon name string, e.g. `"lucide-calendar"` |
| `className` | `class`, falling through to the root or trigger element |
| `placement` (popper) | `side` + `align` |

**Why.** A literal port drags React idioms into the Vue code and makes it fight frappe-ui.

## P8 — Routes and endpoints stay the same during the rewrite

**Rule.** Keep the React app's URLs (under `/next-pms`) and call the same whitelisted backend methods. Backend
changes need their own, explicit task.

**Why.** Bookmarks, the e2e suite and the backend keep working while pages move over one at a time.

## P9 — Comments explain why, not what

**Rule.** Don't write comments that restate the code. Write one only when the reason behind the code isn't obvious
(a workaround, an upstream bug, a surprising constraint).

**Why.** Names already say what the code does; stale comments mislead.

## P10 — Formatting and commits follow the tooling

**Rule.** Format changed `.ts`/`.js` files with Prettier the way CI does
(`npx --yes prettier@4.0.0-alpha.8 --write <files>`). Commit messages follow Conventional Commits
(`feat(components): add MonthPicker`).

**Why.** CI rejects anything else; matching it locally avoids a second round.
