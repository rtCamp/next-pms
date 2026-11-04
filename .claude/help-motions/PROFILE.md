# Next PMS motion profile

Project knowledge for the `help-motions` skill. The skill's rules apply unless this file overrides them.

Motions play in the Help panel (`frontend/packages/app/src/assets/motions/<name>/`, played by `motion-player/`). They are written directly in the repo in the repo shape (see "Rules and corrections").

Measure on your own local site only (its URL lives in `config.local.json`, see the skill's Setup). Claude runs `login.mjs` and the user signs in in its window. Never ask for or write a password.

## Look

| Token | Value |
| --- | --- |
| Desk | #F4F4F5 |
| Window | 1440×900 at stage (240, 90), white, radius 12, shadow `0 1px 2px rgba(0,0,0,.06), 0 12px 40px rgba(0,0,0,.08)` |
| Ghost | #E8E8E8 |
| Landmark text | #7C7C7C, 16 px / 500 in the breadcrumb |
| Ring | 3 px #3B82F6 (`--accent`), 5 px outside, radius + 3, 0.25 s fades |
| Dialog | frappe-ui: radius 16, shadow `0 0 0 1px …, 0 1px 2px …, 0 6px 15px …` (measure), top-anchored at window y 120, centred |
| Dialog backdrop | `rgba(0,0,0,.27)` plus `backdrop-filter: blur(12px)` |
| Font | Inter (the app uses weights 420 and 450 too) |
| Text colours | #171717 main, #383838 / #525252 secondary, #7C7C7C muted, #999999 placeholder |
| Status colours | green #137949 on #E4FAEB, red #B52A2A on #FFE7E7, amber #B35309 on #FFF7D3; grid text uses `text-ink-green-4`, `text-ink-red-4`, `text-ink-amber-4` |

`base.css` classes are prefixed `pms-` (`.pms-cam`, `.pms-win`, `.pms-side`, `.pms-bar`, `.pms-btn`, `.pms-btn-solid`, `.pms-btn-soft`, `.pms-row`, `.pms-cell`, `.pms-input`, `.pms-dialog`, `.pms-menu`, `.pms-opt`, `.pms-pill`, `.pms-ring`, `.pms-pop`). The team-timesheet motions use a second family (`.win`, `.gh`, `.lm`, `.hair`, `.badge`, `.btn`, `.ic`); keep each page's family. Known gap: `.pms-dialog` still has radius 12 and an old height. New dialogs set radius 16 inline.

## Shared shell

The canonical block is `.claude/help-motions/shell.js` (**v1**). Paste it verbatim between the markers in every scene. `check.mjs` compares each scene against it. Its header comments carry the measurements.

| Page key | Where | Sidebar state |
| --- | --- | --- |
| `personal` | Timesheets › Personal | Timesheet group open, Personal active |
| `team` | Timesheets › Team | Timesheet group open, Team active |
| `project-timesheet` | Timesheets › Project | Timesheet group open, Projects active; one search filter |
| `alloc-team` | Allocations › Team | Allocations group open, Team active |
| `alloc-project` | Allocations › Projects | Allocations group open, Projects active |
| `projects-kanban` | Projects, Kanban view | Projects active (top-level) |
| `projects-list` | Projects, List view | Projects active; Create view and its divider are in a hidden `.pms-sh-changed` group that a scene reveals when the list has unsaved changes |
| `tasks` | Tasks | Tasks active; one-word breadcrumb, no slash |
| `dashboard-manager` | Dashboards › Manager | Dashboards group open, Manager active; no filter row |
| `project-detail` | Projects › a project | Nothing active, every group closed; no top-bar buttons or filter row; the scene draws the tab strip |

Measure at 1440×900, the motion window's size. Motions show the idea of a task, not a pixel copy: keep every toolbar on one line and every table inside the window, even where the app wraps a toolbar (Projects List with Create view) or runs a table past the edge (Tasks) at 1440. Narrow the Ghost widths to make it fit. Focus elements and dialogs keep their measured sizes.

## Cast

- **People:** use only these names, the same person in the same role in every motion.
  - Julian Andrews: the employee. Team motions review Julian's timesheet. In Personal motions Julian is the signed-in viewer, so the name never shows.
  - Christina Chang: Julian's reporting manager, shown in "Send to". Christina is the viewer in Team motions.
  - Ananya Bharadwaj, Frank Martinez, Henry Johnson, Shanthi Priya: other team members when a list needs more people.
- **Projects:** Atlas UI Stabilization, Nimbus Analytics Enhancement, Orion Release Readiness, Website Redesign, Mobile App Development.
- **Customers:** Grant Plastics Ltd., Lakeside Clinics, Kestrel Logistics, Bluebell Studio. Keep each project's customer the same across motions.
- **Dates:** the week of Mon Oct 12 – Sun Oct 18, 2026, with 8 h days and a 40 h week.
- **Viewer:** the signed-in viewer's own name never appears. An update the viewer posts shows a Ghost author.

## Dev data

Add test data only after the user says yes (see "Missing states" in the skill's `observing.md`).

- **Where:** ask whether the bench runs in Frappe Manager, and for the bench and site names. With Frappe Manager, `fm shell <bench> --bench-console --site <site>`. Without it, `bench --site <site> console` from the bench folder. Ask whether the user runs it or Claude does.
- **Read the model first:**
  - `meta = frappe.get_meta("<DocType>")`, then `[(f.fieldname, f.fieldtype, f.options, f.reqd) for f in meta.fields]` lists every field, custom fields included.
  - The doctype's JSON and controller show naming, validation and status rules. Next PMS doctypes are in `next_pms/<module>/doctype/<name>/`. Project, ToDo, Leave Application and the like come from the frappe, erpnext and hrms apps beside it.
  - `frappe.get_last_doc("<DocType>")` shows real values for links and child tables.
- **Create:** `frappe.get_doc({...}).insert()` so validation runs. Reach a status the way the app does (`submit()`, the doc's own methods or workflow action), never with raw SQL or `db_set`. End with `frappe.db.commit()`.
- **Clean up:** note each created record's name. When the motion is done, ask whether to delete them.

## Pages

### Personal timesheet (reference: `add-time`; also `log-time-inline`, `import-liked-tasks`, `resubmit-rejected-week`, `submit-week`)

- **Week rows:**
  - Chevron at x 272, label 14/500 at x 296.
  - The status badge (20 high, pill, 12 px) sits 8 px after the label.
  - The status button (28×28) sits at the row's end. In motions it is at x 1396, so it doesn't overlap Total.
- **Day-cell colours on task rows follow the entry status:** Approved green, Rejected red, Approval Pending amber. Project and total rows stay neutral.
- **Total column colours** (`totalHoursThemeMap`, `projectRow.tsx`, design-system `taskRow.tsx`):
  - The week row and the "Projects / Tasks" totals row: red under the weekly hours (40:00), green at them, amber over.
  - A project row: always green, whatever the hours.
  - A task row: always `ink-gray-6`.
- **Week status button** (design-system `rows/constants.ts`): Not submitted is a solid gray-7 button with the white Send icon and the gray "Not submitted" badge. Rejected and Partially rejected show a red cross, Partially approved a green check, and all three resubmit. Approval pending shows the amber hourglass.
- **Inline popover (hover a day cell):**
  - 272 wide, radius 12, padding 8, opens 8 px under the cell, right edges aligned.
  - Entries show as badges with their comments.
  - "Add time" opens the form: Duration bar, Comment, Save entry.
  - After the first edit the popover stays open and closes on an outside click, Escape or the trigger.
- **Rejected entries:**
  - The hours move to `rejected_hours`, are read-only (no edit button), show in red with a "Rejection reason" alert, and don't count toward totals.
  - The fix is a **new** entry for that day, then resubmitting.
  - A rejected day's cell shows the red hours only while nothing else is logged that day.
- **Week status rollup** (`next_pms/timesheet/api/utils.py`):
  - "Rejected" only when every working day is Rejected.
  - Some Rejected plus others → "Partially Rejected".
  - Approved plus pending, with nothing rejected → "Partially Approved".
  - All pending → "Approval Pending".
  - Resubmitting sets every draft timesheet (including the corrected day) to Approval Pending.
  - Pick a scenario whose end badge doesn't mislead: in the resubmit story the reviewer rejected one day and left the others pending, so the week ends as "Approval pending".
- **Submit and resubmit:** both use the same "Submit for approval" dialog (512 wide, radius 16, window (464, 120)) with a week summary, Note, Send to (prefilled with the reporting manager) and Submit.
- **Row kinds:** the "Projects / Tasks" row under the week is the **totals row**. A **project row** has a chevron and a folder icon; task rows sit under it. Every level's empty day cell is a 56×28 button whose hover is #F3F3F3 (radius 8, 0.15 s fade), with a 16 px + replacing the "-". A project-row cell opens Add time with the date and project filled in; a totals-row cell fills in only the date.
- **Task rows** show a small amber dot under each logged value; project and totals rows don't.
- **Editing an entry:** in the inline popover the pencil appears on entry hover **instantly** (no opacity fade; only its hover background fades over 0.15 s). It swaps the entry for the edit form (Edit time with "<n>h left", Duration bar, Edit date, Comment, Save entry, Delete entry in #FFE7E7/#B52A2A). Delete entry is only reachable through the pencil and deletes with no confirmation.
- **Add calendar events** (Add time): disabled with an "Enable" link when the calendar isn't set up. When ticked, the list shows "Select all" with "n of m", then one row per event (subject, a date chip and a time-range chip); all-day events are left out. Each picked event adds its length to Duration and a comment bullet "<subject> | 30m" (or 1hr, 1hr 30m). The dev site's calendar fails to load events, so this list is built from code.
- **Known offset:** the day columns in the existing personal-timesheet motions sit about 30 px off the app. Stay consistent with them until all are fixed together.
- **Add time dialog:** the geometry in `add-time` and `add-time-from-task` is older than the app (the real one is 504.5 tall, radius 16, top 120). Fix both together when asked.

### Team timesheet (reference: `approve-week`; also `approve-part-of-week`, `reject-week`)

- **Weekly approval:** select the member's status icon, untick the days to leave out, then Approve, or Reject with a reason.
- **Open questions:**
  - The app shows a "Processing timesheet" state that the existing motions skip.
  - Their rings sit 7 px outside instead of 5.

### Project timesheet (references: `approve-project-time`, `reject-project-time`)

- **Rows:** week (chevron x 272), then project rows (chevron x 290, folder icon, name, always-green total, no button), then each member indented under its project (chevron x 314, avatar x 338, name x 362). The member's status button and badge work as on the Team page.
- **Scope:** the review panel and the reject dialog show the project name on a second line under the member, and only that project's entries and hours. The week row has no "pending approval" count.

### Allocations (references: `add-allocation` for the team grid; also `drag-to-allocate`, `resize-allocation`, `edit-schedule`. Project page: `drag-to-allocate-project`, `resize-allocation-project`, `edit-schedule-project`)

- Say "allocation" and "allocate" in names, descs and visible text, never "book" or "booking".
- A bar's card opens after hovering about 0.5 s; a click does nothing. The card holds Edit, Delete and Add.
- Drag across empty days to draft an allocation. Releasing opens Add allocation, prefilled.
- Recurring, zero-hour and AI allocations can't be resized. Edit allocation and its outline appear when the drag is released, not during it.
- Project page (`alloc-project`): project rows (chevron, folder, blue "Nh / week" summary bars) with member rows under them (avatar x 272, name x 296, no chevron), then an "Add member" row 40 high. Every grid row is 60 high plus a 1px border. Add allocation from a member row on a project fills in Project, Customer and Employee, in that order.
- The Add/Edit allocation dialog top: `edit-schedule` uses 120 (from `pt-30`, `my-0` in the code), the others keep the measured 88. The team accepted this as close enough. Don't spend time aligning it.
- **Hours / day** in Add allocation and Edit schedule is the outline `DurationInput`: white track, 1 px `outline-gray-2` ring, `surface-gray-3` fill. Add time uses the subtle one, so don't copy it from there. Add allocation is size md (h-8, 14 px), Edit schedule size sm.
- **Repeat for N** means the picked dates plus N more weeks (`copies = repeatFor + 1`). Repeat for 2 allocates three weeks, and the total and the over-allocation count cover all three.
- **Gantt header:** the week label row is white. Weekend shading (`surface-gray-3` at 30%, top corners rounded 8) starts at the day row, not the label row. Days are 38 px wide. When a week doesn't fit, slide the timeline inside a clip at the name column (x 480) instead of narrowing days. `add-allocation` does this.

### Projects (references: `change-phase` for Kanban, `pin-column` for List; also `reorder-columns`, `add-column`, `remove-column`, `sort-list`, `save-view`, `switch-view`)

- **Opening Projects from the sidebar** applies Status = Open. The List toolbar is one row: Create view (only while there are unsaved changes) · divider · Columns · Sort · Filter.
- **Column header chevron:** its menu has only Pin/Unpin. Sorting is a click on the column name or the Sort button; moving a column is a drag.
- **Columns panel:** "Reset to Default" shows after any change.
- **Saved views:** filters first, then Create view, a name typed on a normal keyboard, and Save.
- **Kanban:** cards drag with a grab/grabbing hand, drawn in the scene.

### Tasks (reference: `open-task-log` for 1440 measurements; also `add-time-from-task`, `star-task`)

- **Table:** body rows from y 158.1 at a 41 px pitch. The app's table runs past a 1440 window, so the motions narrow the Ghost columns to fit: Subject 276, Project 556, Status 764, Expected time 922, Priority 1030, Due date 1128, then the clock, star and Task actions icons.
- **Subject:** a pointer cursor, with no hover underline or colour change. Selecting it opens the task log.
- **Task log:** managers (Projects Manager or Timesheet Manager) get the team log: it opens at y 48 (`pt-12`) and shows "Time entries", member cards and entries with avatars. Everyone else gets the personal log: it opens at y 120 (`pt-30`) and shows their own total, with no avatars. `open-task-log` draws the team version, measured live, and its tip is shown only to those two roles. Both open with frappe-ui's `dialog-content-in` (100 ms, opacity 0.5 to 1, scale 0.98 to 1) and show a spinner while loading. The spinner state was built from code.

- **Row hover:** the hover reveals three icons: Add time (clock), Star, and Task actions. The Star icon is 16×16.
- **Star:**
  - Unstarred: grey outline, #999999. Starred: solid amber, #E79913. The swap is instant, there's no toast, and the starred star stays visible.
  - Already-starred rows elsewhere in the list are drawn as Ghost.
- **Tooltips:** the app shows "Star task" and "Add time" tooltips; motions leave them out.

### Manager dashboard (references: `approve-leave`, `reject-leave`)

- **Where leave approval lives:** the "Upcoming time-offs" card. The ✓/✕ buttons show only to the leave approver and open a confirmation; Approve keeps the row, now Approved.
- **Reject:** "Reject leave request" with a required Rejection reason. Reject leave stays disabled until the reason has text. Afterwards the row leaves the list (the API returns only Open and Approved leave), the pending badge goes and the toast reads "Leave application rejected".
- **Calendar date range:** a ghost trigger above the two-week grid opens a 242 px date picker, Sunday first, instantly with no animation. Picking a day shows the two weeks from that Monday. Measured live. The team judged a motion for it unnecessary.
- **Unverified:** the dev site had no pending leave, so the open row, both dialogs and the results were built from code.

### Project detail (reference: `hide-restore-tracking-cards`; also `change-risk-status`, `change-growth-status`, `note-from-template`, `link-todo`, `calendar-todo`)

- **Layout:**
  - `w-3/4` main beside a `w-1/4` "About this project" panel, which scales with the window: main x 240–1140 (border-right at 1139, content 260–1119), panel 1140–1440.
  - Tab strip y 57–97 with a hairline at 96. Tabs are 14/420 text, 24 px apart from x 260; the active tab has a 1 px #383838 underline at y 95.
  - The `TABS`, `ghostTabs()` and `ghostPanel()` helpers live in the tracking scene; copy them.
- **Tracking:**
  - Edit → × on a card → "Remove widget" confirm. This **saves at the confirm**.
  - Add widgets → Add → Save (this one saves in the dialog) → Done.
  - The change affects everyone on the project.
- **Risks:**
  - The row ⋯ menu is 160×70, radius 12, with Edit and Delete (#E03636).
  - Edit risk locks Status and Risk level, which show as disabled fields with a violet note: "To change status or risk level, add a new risk update instead." The motion shows this trap first.
  - The real path: open the risk → + next to Updates → Add update dialog (440 wide, radius 16) → Status menu (opens over the select, instantly) → Note → Add update.
  - Status dots: To-do #999999, In Progress #E79913, Escalated #0289F7, Blocked #E03636, Mitigated #46B37E.
- **Growth:** the same Updates flow as Risks. Edit growth initiative locks Priority for Client, Status and Billable outcome with a violet note, so `change-growth-status` shows that trap first. Status options: Closed, Ideation, In Progress, On Hold.
- **Notes:** Create (solid) opens a menu right-aligned 4 px below it: New from template, New blank note, Create template. The template dialog is titled "Add Template" (448 wide, top 120), and Use template stays disabled until a row is picked.
- **ToDos:** New ToDo opens "Add ToDo" (512 wide, radius 16, centred vertically). On this site Title, Start and End are required, and the save button is **Create**. Assignee is prefilled with the viewer, so draw it as Ghost. Link to groups Milestones, Touchpoints and Growth initiatives. New ToDos go to the top of the list. The End picker opens above its button.
- **Calendar tab:** toolbar, calendar grid, then Milestones / Touchpoints TabButtons with Create and the table. An empty ToDos cell has a + that opens Add ToDo already linked to that row. After saving it becomes a count button.
- **Tab strip:** Reports shows only when reports are enabled, Feedback and RAG stats only when the site has them. The dev site shows 10 tabs. `link-todo` and `calendar-todo` draw the measured 10, the older Project detail motions draw 11. The tabs are Ghost, so only the underline shifts.
- **Tips:** Project detail tips are keyed by tab (`PROJECT_DETAIL_TIPS` in `pages/project-details/help.ts`). Each tab has a "What the <Tab> tab shows" tip after its motion tips.

## Rules and corrections from the team

Newest first.

- **Help panel order:** on every page, tips with a motion come first and text-only tips after them.

- **Colours are theme tokens only**, so motions follow dark mode. Write `var(--color-…)` from frappe-ui-react's `theme.css` by role: backgrounds `surface-*` (dialogs, popovers and menus `surface-modal`, the sidebar `surface-menu-bar`), text `ink-*`, borders and lines `outline-*`. Only the `--accent` ring colour (#3B82F6) and rgba shadows stay literal. The hex values in the Look table are what the tokens resolve to in light mode. A colour that blends between two states uses `color-mix(in srgb, var(--color-a), var(--color-b) p%)`, never RGB numbers lerped in JS.
- **Rings inside a bordered box** (`.pms-pop` has a 1 px border): its children sit 1 px inside, so measure the ring from the child's real box, not the popover's outer edge. A 1 px miss shows as a visible slide at 2× zoom.
- **One task per motion.** Send a week and resubmit a rejected week are two motions and two tips, not one joined motion.
- **Repo shape:** the scene id equals the folder name (`<name>/scene-<name>.js`). The scene's first line is `const { seg, lerp, eo, ei, eio } = kit;`. Comments are one line and only where the code can't explain itself (no spec block, changelog, measurement or colour notes). `scenes.json` holds only `width`, `height`, `background`, `fonts.sans.family` and the scene's `id`, `name`, `dur`, `desc`.
- Story data must explain the action: a day was rejected because only 6 h were logged; the fix logs 8 h.
- Don't end on a status that looks as if a rejected entry got approved; choose the scenario whose end badge reads correctly.
- When the obvious path is blocked (a locked Edit form), show the user trying it and the app's message first.
- No hover tooltips (unless the tooltip is the lesson).
- The zoomed camera never shows the desk beside the window.
- Typing only uses characters on a normal keyboard: no "·".
- Measure at 1440×900, the size the motion draws. Compare a still with a real screenshot.
- Close panels the app leaves open before showing the result. Start from the state a user reaches from the sidebar.
- Hover states follow the cursor path. Copy the app's transitions. Each menu keeps its own placement and opening.
- Pace for first-time users: ring about 0.4 s before the action, cursor travel 0.6–0.8 s, about 18 cps typing, result held about 2–3 s.

## States built from code (unverified in the live app)

| Motion | State | Source |
| --- | --- | --- |
| `resubmit-rejected-week` | The rejected week and entry, Partially rejected → Approval pending, toast | `inline-time-entry/index.tsx`, `row/taskRow.tsx`, `timesheet/api/utils.py` |
| `change-risk-status` | Everything after Add update (loading, refreshed badge, new update) | `tabs/risks/add-update`, `detail/*` |
| `hide-restore-tracking-cards` | After the Remove confirm, the Add widgets result | `tabs/tracking/index.tsx` |
| `approve-leave` | The pending row, the dialog, the result | `widget/upcoming-time-off/approveLeaveDialog.tsx` |
| `reject-leave` | The pending row, the dialog, the row leaving, the toast | `widget/upcoming-time-off/rejectLeaveDialog.tsx`, `provider.tsx` |
| `change-growth-status` | Everything after Add update, the Edit dialog's loading state | `tabs/growth/add-update`, `create-growth/index.tsx` |
| `note-from-template` | The editor after Use template, its spinner | `tabs/notes/editor/index.tsx` |
| `link-todo` | The Create spinner and the new row | `tabs/to-do/todoRow.tsx`, `linkedChip.tsx` |
| `calendar-todo` | The + in an empty ToDos cell, Add ToDo opened from it, the count after Create | `tabs/calendar/table/cells/todosCell.tsx` |
