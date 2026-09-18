# Post-redesign DOM contract

Every fact here was verified against the live staging app, not inferred. When the
app changes again, re-verify with `scripts/probe.mjs` and update this file — a
stale entry here is worse than no entry, because it invites confident guessing.

## Contents

- [The shape of the change](#the-shape-of-the-change)
- [Lists and grids](#lists-and-grids)
- [Filters: the query-builder](#filters-the-query-builder)
- [The allocations grids step by quarter](#the-allocations-grids-step-by-quarter)
- [Toasts](#toasts)
- [Dialogs](#dialogs)
- [The allocation grid](#the-allocation-grid)
- [The allocation dialog](#the-allocation-dialog)
- [The date-range calendar](#the-date-range-calendar)
- [Billable indicator](#billable-indicator)
- [Backend rules that surface as UI failures](#backend-rules-that-surface-as-ui-failures)

## The shape of the change

The redesign did not rename things. It replaced structures. Three consequences
that explain most broken selectors:

1. **HTML table semantics were removed** in several views. `getByRole("row")`,
   `getByRole("cell")`, `thead`, `tbody` and XPath like `//tr[1]//p` match nothing
   in the timesheet and team grids.
2. **`title` attributes are gone.** There are **zero** `[title]` elements on the
   allocations page. Any `getByTitle(...)` there can never match.
3. **Per-day columns became per-week columns inside a quarter view.** Selectors
   that addressed a specific date's cell have no target, and the cells are not
   interactive.

## Lists and grids

Project/task lists render as ARIA grids on divs, so role-based locators work but
DOM-shape locators don't:

```js
page.getByRole("table", { name: "Projects" })          // the grid
  .locator('a[href^="/next-pms/projects/"]')            // rows, scoped by href
```

Scope list-item locators by `href` prefix. A bare `getByRole("link")` inside a
project list also matches employee links (`/desk/user/*`) and inflates counts —
this returned 27 "projects" for a 20-project list.

The **timesheet and team grids have no roles at all**. Hierarchy is encoded only
in Tailwind left-padding:

| Class | Depth |
|---|---|
| `pl-3` | week |
| `pl-7.5` | member |
| `pl-13.5` | project |
| `pl-19.5` | task |

```js
this.latestTimesheetRows = div.locator("div.border-b.transition-colors");
this.latestTimesheetTaskRows = div.locator('div.border-b.transition-colors[class*="pl-13.5"]');
```

Row cells are direct children, so index them positionally:
`row.locator("> div").nth(colIndex)` — 10 children: label, Mon–Sun, Total, spacer.

## Filters: the query-builder

Per-field filter dropdowns were replaced by one query-builder reading
**Where / Field / Operator / Value**. Inputs are addressed by placeholder:

```js
page.getByPlaceholder("Field")
page.getByPlaceholder("Operator")
page.getByPlaceholder("Value")
```

- **AND only.** The conjunction is a static "And" label, not a control. There is
  no OR, so any test asserting OR semantics is testing a removed capability.
- **Operators vary by field type**: link fields offer `Equals` / `Not Equals`;
  select fields offer `is` / `is not`. The affirmative is always listed first.
- Field labels in the dropdown differ from the payload keys, so page objects keep
  an explicit map (`FILTER_FIELD_LABELS`, `RM_FILTER_FIELD_LABELS`). Add new
  fields there rather than passing raw label strings from specs.
- The **"Columns" button no longer exists** — code that clicked it to reveal a
  column must simply assert on the rendered header instead.

### The panel opens with a row already in it

Opening the panel seeds one condition row whose **Field is pre-filled** to the
first field the page offers (`Skill` on allocations/team, `Tag` on
allocations/project) and whose **Value is empty**. That row is meant to be
filled in, not skipped.

So the rule for "do I need a new row?" must read the **Value**, not the Field:

```js
const lastValue = await page.getByPlaceholder("Value").last().inputValue().catch(() => "");
if (lastValue !== "") await page.getByText("Add filter").click();
```

Keying it on the Field instead adds a row on top of the seeded one and leaves an
empty condition behind — which the `Filter N` badge still counts, so the badge
reads one higher than the number of filters the test applied.

### Not every field's Value is a dropdown

A field declared `type: "string"` renders a **plain free-text input with no
options at all**. Waiting for an option there hangs until the test times out.
`Skill` on allocations/team is the one that bites:

| Field | Type | Value control | Operators |
|---|---|---|---|
| Skill | `string` | free-text `<input>` | Equals, Not Equals, Like, Not Like |
| Tag / Business Unit / Reporting Manager | `link` | option list | Equals, Not Equals |

The typed text *is* the value — the grid refetches on a debounce, with no Enter
or Escape needed (`filters=[["skills","=","QA"]]`). Page objects carry
`FREE_TEXT_FILTER_FIELDS` to route these. The declarations live in
`frontend/packages/app/src/pages/allocations/team/constants.ts`; check there
before assuming a value is pickable.

### Clearing: one control works, the other does not

Both are icon-only and reachable by aria-label only:

```js
page.getByRole("button", { name: "Clear all filters" })  // panel header
page.getByRole("button", { name: "Remove filter" })      // one per condition row
```

- **`Remove filter` commits.** Badge drops, grid refetches without the filter.
- **`Clear all filters` does not.** It empties the condition rows from the
  builder, but the applied query is untouched: the badge keeps its count, no
  refetch fires, and the grid stays filtered *across a reload*. Reproduced on
  allocations/team with a single condition. TC59 is the repro.

`div#filters` (the old per-chip clear strip) no longer exists, so any locator
rooted there resolves 0 and clears nothing **without failing** — a silent no-op.

### Field inventory

| Page | Panel fields | Separate comboboxes |
|---|---|---|
| `/allocations/team` | Skill, Tag, Business Unit, Reporting Manager | Designation (`Toggle options`), Allocation Type (`Select options`) |
| `/allocations/project` | Tag, Customer, Billing Type, Project Type, Project Manager | — |

The `Filter N` badge counts **all** of them together, comboboxes included.

## The allocations grids step by quarter

Both `/allocations/team` and `/allocations/project` used to page a week at a
time. They now render a whole quarter of week columns and step by quarter:

```js
page.getByRole("button", { name: "Previous Quarter" })
page.getByRole("button", { name: "Next Quarter" })
```

`previous-week` / `next-week` are **gone**, so any assertion of the form
"the window shifted by exactly one week" no longer describes the control.

**"This quarter" is not a window marker.** It is the range picker's own label
and reads the same wherever the window sits, so it cannot be used to detect
that navigation happened (the old "This Week" text could). Read the header's
week ranges instead — they shift and restore exactly.

Unlike `/timesheet/team`, these two pages **do** have real table semantics
(`table`, `thead`, `th`), so header locators work here:

```js
// one week-range label per column, e.g. "Sep 7 - 13"
page.locator("thead th span.truncate")
// day numbers - one level deeper than they used to be, so match on content
page.locator("thead th span").filter({ hasText: /^\d+$/ })
```

Both live on `TimelinePage`, which `TeamPage` and `ProjectPage` extend — put
shared grid plumbing there rather than duplicating it per page.

## Toasts

```js
page.getByRole("region", { name: /notification/i }).getByText(message)
```

- Text is split across nested elements, so match on the message region, not the
  page.
- `getByText` is **case-sensitive** — a wrong case is a silent non-match.
- Reading `innerText` of the region also picks up injected CSS
  (`.toast-root-animatable { transition: ... }`). Take the first line that isn't
  `toast-root`/`transition` (see `getErrorFromAllocationModal`).

Known current strings — note the corrected spelling and casing:

| Action | String |
|---|---|
| allocation created | `Allocation created successfully` |
| allocation updated | `Allocation updated successfully` |
| allocation deleted | `The allocation has been deleted successfully` |
| time entry submitted | `Time Entry submitted successfully` |
| task created | `Task created successfully` |

## Dialogs

**Dialogs have no accessible name.** `getByRole("dialog", { name: ... })` can
never match. Identify a dialog by content instead:

```js
page.getByRole("dialog").filter({ has: page.getByRole("heading", { name: "Submit for approval" }) })
page.getByRole("dialog").filter({ hasText: taskName })
```

## The allocation grid

Route: `/next-pms/allocations/project` and `/next-pms/allocations/team`.
**`/next-pms/allocations/timeline` was removed and 404s.**

Structure, as measured:

- Quarter view with **week** columns. Each body `<td>` carries `colspan="7"`.
- Navigation is `Previous Quarter` / `Today` / `Next Quarter`, plus a period
  combobox reading `This quarter`. There is no per-week navigation.
- Body cells are **empty and inert** — clicking one opens nothing. The old
  "click the cell at (row, date)" entry point does not exist.
- Allocations render as absolutely-positioned chips overlaid on the grid:

```js
page.getByRole("button", { name: "Allocation summary" })   // chip, text like "32h / week"
```

- The chip popover exposes exactly three controls: `Edit allocation`,
  `Delete allocation`, `Add`. **There is no copy/duplicate control** — verified
  across hover, `mouse.move`, right-click (0 menus) and the open popover.
- Confirm-delete must be exact, or it also matches "Delete allocation":

```js
page.getByRole("button", { name: "Delete", exact: true })
```

- Project rows expand to member rows plus an **`Add member`** row, which opens the
  same Add-allocation dialog with nothing pre-filled.
- Entry points to create: the toolbar `Add allocation` button, or `Add member`
  inside an expanded project row.

## Resource-management toolbar comboboxes

`getByRole("combobox")` is **not unique** on these pages — it resolves to 3 on the
team tab and 2 on the project tab, so an unscoped locator throws a strict-mode
violation. Identify by the option list, since only one carries an `aria-label`:

| Page | Control | Options |
|---|---|---|
| team | `aria-label="Toggle options"` | designations (Software Engineer, …) |
| team + project | *(unlabelled, `aria-haspopup="listbox"`)* | `This week` / `This month` / `This quarter` |
| team | `aria-label="Select options"` | `Confirmed only` / `Tentative only` / `Billable only` / `Non-billable only` / `No allocation only` |

**The "sheet view" selector is gone.** Nothing on either tab offers
`Actual vs Planned` or `Planned vs Capacity`; the period combobox occupies that
slot now. Tests calling `selectView("Actual vs Planned")` are exercising a removed
feature and need a retire-or-repoint decision, not a new locator — verified by
enumerating every combobox's options on both tabs.

## The allocation dialog

The fields carry **stable ids** — the most durable locators in the app:

| Id | Notes |
|---|---|
| `#project` | choose **first**; customer derives from it |
| `#customer` | **`disabled`** until a project is chosen, then auto-filled — guard with `isEditable()` rather than trying to type into it |
| `#employee` | gated by DocShare — see below |
| `#date-range` | `readOnly`; opens a calendar |
| `#hours-per-day` | placeholder `00:00`; **clamps to the employee's daily capacity** — see below |
| `#total-hours` | **`disabled` — computed**, never fillable |
| `#allocation-note` | textarea, placeholder `Add a note` |

**`#hours-per-day` silently clamps, which fakes out assertions.** The field shows
whatever you type but submits a capped value, measured against a capacity of 8h:

| typed | submitted `hours_allocated_per_day` |
|---|---|
| `4` | 4 |
| `04:30` | 4.5 (the `HH:MM` mask works) |
| `10:00` | **8** |
| `25` / `25:00` | **8** |

So anything above the employee's daily capacity becomes the capacity, with no
message. Two consequences worth remembering:

- A test that sets a two-digit value and then asserts on it can pass without
  having changed anything — the clamp lands on 8, which is also the default.
- The schema rule `"Hour / Day should be less than 24"`
  (`frontend/packages/app/src/schema/resource.ts`) is **unreachable through the
  UI**, because the clamp happens before zod runs. Zod only runs on submit, so a
  test that sets a value and reads for a message without clicking Save sees
  nothing either way.

**The allocation dialog now has an accessible name** — `getByRole("dialog", { name: "Add allocation" })`
— unlike the task dialogs. Prefer the named form: error toasts also carry
`role="dialog"`, so a bare `getByRole("dialog")` resolves to 2 elements whenever a
toast is on screen and throws a strict-mode violation.

Checkboxes are unnamed inputs paired with a visible label, so use `getByLabel`:
`Mark as non-billable`, `Mark as tentative`, `Include weekends`. They are styled
out of view — drive them with `check()`/`uncheck({ force: true })`, not `click()`.

Submit is `Allocate` (add) or `Save Changes` (edit) — both need
`{ exact: true }` framing to avoid partial matches.

**Field order matters.** Project must be selected first; the remaining fields only
populate once a project is chosen.

**The employee dropdown is permission-gated.** An empty employee list showing
*"This project doesn't have any assigned team members"* is not a selector problem.
`useProjectEmployeeAccess` → `next_pms/timesheet/api/project.py:149`
`get_project_employee_access` resolves membership from **DocShare**. Fix it in the
seed data by adding `payloadShareProject` for the project:

```js
payloadShareProject: [
  { doctype: "Project", name: "filled-automatically-from-createProjects",
    user: process.env.EMP3_EMAIL, readValue: 1, writeValue: 0,
    submitValue: 0, shareValue: 0, notifyValue: 0 },
],
```

**In the edit dialog every field can be `disabled`** when the allocation carries
schedule changes ("Use Edit Schedule to modify them"). `fill()` on a disabled
input retries until the test times out, so gate writes:

```js
if (await field.isEditable().catch(() => false)) { await field.fill(value); }
```

## The date-range calendar

`#date-range` is read-only; `fill()` times out. Click it to open a one-month
calendar and pick days:

```js
page.getByRole("grid")                                              // the calendar
page.getByRole("grid").getByRole("gridcell", { name: "4", exact: true })
page.getByRole("button", { name: "Previous month" })                // / "Next month"
```

- Month caption is a span reading e.g. `Sep 2026`.
- Clicking the same day **twice** sets an identical start and end — the
  single-day allocation most tests want.
- **The calendar closes itself** once the range completes. **Never press Escape
  to dismiss it** — Escape propagates and closes the entire allocation dialog,
  after which the submit button has nothing to submit, `waitForResponse` hangs,
  and the test dies at 30s with no useful error. This exact mistake produced six
  simultaneous unexplained timeouts.
- The grid **spills adjacent months** (`30 31 1 2 … 29 30 1 2 3`), so days 1–3
  and 28–31 can appear twice. Disambiguate positionally rather than by the muted
  class (`text-ink-gray-3` vs `text-ink-gray-8`) — CSS-token coupling is what
  broke this suite in the first place:

  ```js
  return dayNumber <= 15 ? cells.first() : cells.last();
  ```

## Billable indicator

**Inverted from the obvious reading:** an amber dot marks **non**-billable.

```js
const nonBillableDot = cell.locator("span.bg-surface-amber-3");
return (await nonBillableDot.count()) === 0;   // billable
```

The previous implementation counted svgs (`>= 3`) in cells that contain none, so
it always returned `false` and four tests passed without testing anything.

## Backend rules that surface as UI failures

Validation moved server-side. The dialog's own `p[id*='form-item-message']` stays
**empty**; the error arrives as a toast and the request returns **417**. Read
errors from the toast region, and don't gate `waitForResponse` on
`status() === 200` — that predicate ignores the 417 that actually arrived and
hangs until the test times out.

Rules observed to reject a submit:

- **Overlapping allocations** for the same project+employee:
  *"… is already allocated to … between … Overlapping allocations for the same
  project are not allowed."*
- **Weekend-only ranges**: *"The selected date range contains no weekdays."*
  `getFormattedDateNDaysFromToday` already shifts weekends to Monday; a
  hand-rolled date can land on a Saturday and get rejected.
- **Hours per day** above the daily cap.

`utils/dateUtils.js` returns `"Sep 3"`-style strings with **no year**. Resolve the
year against the date nearest today rather than assuming the current one.
