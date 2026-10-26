# Context — next-pms vocabulary

What the terms used in this codebase mean, and the names to avoid for them. Use these names in code, UI copy, PRs
and reviews. When a name causes confusion, add an entry here.

Precedence: [`PHILOSOPHY.md`](PHILOSOPHY.md) > this file > existing code.

## People and access

**Employee** — an ERPNext/HRMS `Employee` record linked to a user. All pages need one; a user without an employee
record is sent to `/no-employee`.
_Avoid_: member, resource (as a noun for a person), staff.

**Role** — a Frappe role that gates pages and actions, e.g. `Projects Manager`, `Timesheet Manager`,
`Delivery Manager`. Pages check roles in the router; the backend enforces permissions again.
_Avoid_: permission (for a role), group.

**Session** — the signed-in user as the app sees them: user id and name, roles and employee record, from
`useSession()`.
_Avoid_: user store, auth, current user (for the whole object).

**Reporting manager** — the employee a person reports to; the default reviewer of their timesheets.
_Avoid_: boss, approver (unless the field is literally named so).

## Time

**Timesheet** — a Frappe `Timesheet` for one employee and one day, holding that day's time entries. The UI shows
them a week at a time, and a week is submitted and approved together.
_Avoid_: time log (for the whole sheet), worklog.

**Time entry** — one row in a timesheet: task, date, hours, description (`Timesheet Detail` in the backend).
_Avoid_: log, record.

**Personal / Team / Project timesheet** — the three timesheet views: your own week (`/timesheet`), your reports'
weeks (`/timesheet/team`), and all time logged against projects (`/timesheet/project`).

**Approval status** — a timesheet's review state: `Not Submitted`, `Approval Pending`, `Approved`, `Rejected`,
`Partially Approved` and `Partially Rejected` for a week with mixed results, and `Processing Timesheet`
(`custom_approval_status`, `custom_weekly_approval_status`).
In code: `ApprovalStatusValue` and `APPROVAL_STATUSES` from `components/ApprovalStatus`, holding the backend values
(P16).
_Avoid_: state, review status, kebab-case copies like `not-submitted`.

**Time off** — leave (`Leave Application`) and holidays (`Holiday List`) shown alongside time entries.
_Avoid_: vacation, PTO, absence.

**Weekly approval** — a reviewer's decision on one employee's week, optionally limited to one project: approve or
reject the checked days (a rejection needs a reason). The backend marks the week `Processing Timesheet` and finishes
on the `long` queue; the result arrives over realtime.
_Avoid_: sign-off, review (for the action).

**Backdate limit** — the date before which an employee may no longer add or change time entries
(`backdate_restricted_before`); days before it are locked in the grid.
_Avoid_: freeze, cutoff.

**Imported task** — a liked (starred) task added to a week of the personal timesheet so it shows a row before any
time is logged on it. Kept per week in `localStorage` under `next-pms:importedTasks`.
_Avoid_: pinned task, favourite.

**Unsaved changes guard** — the page-level check that asks Save / Discard / Keep Editing before an action or
navigation would drop an open, edited entry (`provideUnsavedChanges` in `composables/useUnsavedChanges.ts`). The
Timesheet pages and the Project details page (the Overview tab's edits and the note editor) provide one.

## Planning

**Allocation** — a `Resource Allocation`: an employee booked on a project (or customer) for a date range, as hours
per day or total hours. It can be billable, tentative, and AI-created (`is_ai_created`).
_Avoid_: booking, assignment, schedule.

**Team / Project allocations** — the two allocation views: by employee (`/allocations/team`) and by project
(`/allocations/project`). Both show each employee's time off on their rows; the Project view reads it per day
(`employee_leaves`), so a half day there doesn't say which half.

**Allocation segment** — the part of an allocation drawn as one bar: the whole allocation, or a run of days between
per-day overrides that change its hours. A segment reduced to zero hours stays as an empty placeholder bar
(`fullyReduced`). In code: `Allocation` in `components/GanttGrid`.
_Avoid_: block, slot.

**Summary row** — the top row of an employee (Team allocations) or a project (Project allocations) in `GanttGrid`,
drawn from the allocations of the rows under it. An employee's summary merges consecutive days with the same booked
hours into one bar; a project's totals its employees' hours per run of weekdays.

**Capacity status** — how an employee's booked hours on a day compare with their capacity (8h a day when unset):
`Full`, `Nh free` (under) or `Nh over`; it colours the employee's summary bars green, amber or violet. Weekdays with
nothing booked show as grey free-capacity bars. In code: `capacityStatus` in `GanttGrid/summary.ts`.
_Avoid_: utilisation, load.

**Draft allocation** — the bar drawn by dragging from a free day's "+" in `GanttGrid`, before the Add allocation
dialog saves it.
_Avoid_: placeholder (that's the zero-hour segment), ghost.

**Recurring allocation** — one of the weekly copies an Add allocation with "Recurring" creates; the copies share a
`recurrence_id` and form a series. Its employee, project and customer can't change, it is edited through Edit
schedule ("This allocation" or "This and future"), and a delete asks which copies to remove (`only_this`,
`this_and_future`, `all_in_series`).
_Avoid_: repeating allocation, occurrence (for the whole series).

**Day override** — a row of an allocation's `override` table that changes one day's hours or cancels the day. Its
`source` is `Leave` when the leave sync derived it from leave or a holiday (rewritten on every save, so not edited
day by day) or `Manual` when a person set it. Any override locks the Add / Edit form of a non-AI allocation; Edit
schedule changes them.
_Avoid_: exception, adjustment.

**Edit schedule** — the dialog that changes an allocation's hours on picked days, saved as day overrides, or across
its whole range, saved as new hours per day. In code: `EditScheduleDialog` and `buildSchedulePayload` in
`pages/allocations/shared/`.

**Allocation type** — the allocations pages' filter on status (Confirmed, Tentative), billable or not, AI-created,
and (Team) employees with no allocation; kept in the `allocationType` query param. In code: `AllocationTypeValue`
and the params builders in `pages/allocations/shared/filterParams.ts`.
_Avoid_: allocation status (that's only the Confirmed / Tentative axis).

**Allocation window** — the weeks an allocations page shows from its `date`: this week, this month or this quarter
(1, 4 or 13 weeks, the `duration` param). Previous and Next move the date by the window's length.
_Avoid_: range, period.

## Projects

**Project** — a Frappe `Project`, extended by next-pms with phases, budgets, contacts, timelines, status updates,
risks and growth initiatives.
_Avoid_: engagement, account (unless meaning the customer).

**Task** — a Frappe `Task` within a project; time entries are logged against tasks.
_Avoid_: ticket, issue, todo (a `ToDo` is a separate Frappe doctype).

**Task status** — a task's `status`: `Open`, `Working`, `Pending Review`, `Overdue`, `Template`, `Completed`,
`Cancelled`. In code: `TaskStatusValue` and `TASK_STATUSES` from `components/TaskStatus` (P16).

**ToDo** — a Frappe `ToDo`: a dated action assigned to one user. The Project details page's ToDos tab lists the
ToDos that reference the project (`reference_type` Project) and creates them there. Title, start and end are rtcamp
custom fields (`custom_title`, `custom_from_time`, `custom_to_time`), shown and required only when the boot data says
they exist (`has_todo_custom_fields`). Start and end are stored in system time and shown in the user's time zone. Its
statuses are the ToDo doctype's options (`todo_status_options` in the boot data, e.g. Backlog and In Progress besides
Open, Closed and Cancelled); one the app has no icon for shows as Open. In code: `provideTodos()` / `useTodos()` in
`pages/project-details/to-do/`.
_Avoid_: task (a `Task` is a separate doctype), action item.

**Linked ToDo** — a project ToDo tied to one milestone, touchpoint or growth initiative through that record's
`linked_todos` rows (`PMS Linked ToDo`). A ToDo has at most one such record and always still references the Project;
unlinking keeps the ToDo, and deleting the record keeps its ToDos. The ToDo dialog's "Linked to" field, the linked
chip on a ToDos tab row and the Calendar's ToDos cell show it. In code: `LinkedRecord`, `useTodos().linkedTo()` and
`LinkedTodos.vue` in `pages/project-details/to-do/`.
_Avoid_: action item (Growth's label for them), sub-task, attached ToDo.

**Milestone** — a dated goal on a project's timeline, from a start to a planned end, completed on an actual end date
(a `Project Timeline Item` of type Milestone). It has an owner, a category (its "Type", e.g. Delivery or Invoice),
watchers (users following it) and may be marked internal. The Calendar tab shows milestones in the month grid, the
Gantt and their table.
_Avoid_: deliverable, phase (a project phase is a separate thing), event.

**Touchpoint** — a dated contact with the client or the team on one scheduled day, e.g. a check-in or a meeting (a
`Project Timeline Item` of type Touchpoint, whose start is its scheduled date). Otherwise as a milestone.
_Avoid_: meeting (one category of touchpoint), event.

**Timeline item** — a milestone or touchpoint, the `Project Timeline Item` doctype; its category is a `Project
Timeline Item Category` for that type, `Other - <type>` when none is picked. In code: `TimelineItem` and
`provideTimeline()` / `useTimeline()` in `pages/project-details/calendar/`.
_Avoid_: calendar event, timeline entry.

**Project phase** — a named, coloured stage a project moves through (`Project Phase`). The kanban has a column per
phase, ordered by `position`. In code: `useProjectPhases()` and `PhaseIcon`.
_Avoid_: stage, status (status is a separate field).

**RAG status** — a project's red / amber / green health (`custom_project_rag_status`), shown as a coloured dot.
_Avoid_: risk (a `Risk` is a separate doctype), health.

**Project budget** — purchased, consumed and remaining hours for a project over a period (`Project Budget`, the
project's `custom_project_budget_hours` rows). The Tracking tab lists them as **contracts**, each optionally tied to a
sales order and invoice.

**Project rate** — a member's hourly billing rate on a project from a valid-from date (`Project Billing Team`, the
project's `custom_project_billing_team` rows), shown under the project's flat rate on the Tracking tab.
_Avoid_: billing team (for a single rate).

**About sidebar** — the "About this project" column beside the Project details tabs: summary, details, links,
budget burn, hours progress, members (project manager, lead engineer and the users the project is shared with) and
customer contacts. Adding a member shares the Project with their user.
_Avoid_: info panel, project sidebar (the app's navigation sidebar is a different thing).

**Tracking layout** — the order and visibility of the Tracking tab's widgets, shared by everyone on the project: one
public `PMS View Setting` row of type `Tracking`. Only Projects Managers change it, and only the task completion,
budget burn and cost burn widgets can be hidden.

**Optional project field** — a Project field the page shows that another app adds (Sourcing's source, territory
and previous CMS; the NDA, case study and testimonial Checks). The boot data says which exist
(`optional_project_fields`); read it with `hasProjectField()` and leave a missing field out of the UI and the save.

**Repository connection** — a GitHub repository linked to a project (`custom_project_repository_connections` rows
pointing at `GitHub Repository`, a doctype from another app). Listed on the Overview tab when the doctype exists
(`has_repository_connections`); adding or unlinking one saves at once, outside the tab's edit mode.
_Avoid_: repo link, integration.

**Customer feedback** — a submitted `Customer Feedback` (rtcamp app) a customer contact gives for one period:
**client feedback** rates the project (`evaluation_type` Project), **team feedback** rates one employee
(Engineer, Project Manager, Project Coordinator, Quality Engineer). Ratings are stored as 0–1 and shown as stars on
the API's `star_max` scale (4). The Feedback tab shows the client feedback by month and lists the team feedback of
the project's customer, picked with `?view=client|team` (client is the default and stays out of the URL).
_Avoid_: review, survey, rating (for the whole record).

**Feedback schedule** — a `Customer Feedback Schedule`: a request for feedback over a period, sent to a customer
contact, for projects or for employees. The Feedback tab's month timeline is built from a project's schedules, so a
month whose schedule has no feedback yet shows "-".
_Avoid_: feedback request (for the record), survey.

**Project comments** — a comment thread on something shown on the Project details page (RAG stats, a customer
feedback, a note), wired to `<Comments>` by `useProjectComments` with the thread's own list, add, update and delete
endpoints.

**Note** — a written project update on the Project details page's Notes tab: a title and a rich-text body whose
task lists can be ticked in place, with comments and a pin (`Project Status Update`). The tab lists the project's
published notes, pinned first, and `?note=` opens one. The app saves every note as published (`status` Publish),
which notifies the project's subscribers and its account manager. Notes are written on the note editor routes
(`/projects/:projectId/notes/new` and `…/notes/:noteId/edit`), shown in place of the tabs beside the About sidebar.
In code: `provideNotes()` / `useNotes()` and `NoteEditor` in `pages/project-details/notes/`.
_Avoid_: status update (the doctype's name, not the UI's), report (a `Project Report` is a separate doctype), post.

**Note template** — a title and body a note can start from (`Project Status Update Template`), named by its
`template_name`, with an optional template category and a short description of up to 140 characters. Picked in the
template picker, which opens the new-note route with `?template=`; written on the note editor with `?mode=template`
or on `…/notes/templates/:templateId/edit`, and renamed when its title changes.
_Avoid_: preset, draft.

**Template category** — a named group of note templates (`Project Status Update Template Category`). Typing a new
one in the save-template dialog creates it.
_Avoid_: tag, type.

**Note subscription** — a user's opt-in to be notified of every note published on a project
(`PMS Project Update Subscription`), set with the Notes tab's Subscribe button. A project's account manager
(`custom_account_manager_`, a site field that may not exist) is always notified and can't unsubscribe.
_Avoid_: follow (that's Frappe's document follow), watch.

**Risk** — something that may hurt a project, with a category, a level (Low, Medium, High), a status (To-do, In
Progress, Escalated, Blocked, Mitigated), a summary and a mitigation plan (`Risk`). Its **risk owner** is the user
responsible for it, the project manager unless picked; its creator shows as "Owner". A risk changes level and status
only through risk updates. The Risks tab lists the project's risks in an open and a mitigated group, and `?risk=`
opens one. In code: `provideRisks()` / `useRisks()` and `useRiskDetail()` in `pages/project-details/risks/`.
_Avoid_: issue, RAG status (that's the project's health).

**Risk update** — a row of a risk's update log (`Risk Update`): a status, a level and a note, posted by its author.
_Avoid_: comment, status update (that's a note).

**Update log** — a record's table of updates (a risk's `risk_update_log`, a growth initiative's `update_log`, whose
rows also carry the closed status, priority and billable outcome). The
server takes the last row as the record's current state, stamps each new row's author (`updated_by`) and lets only
the author or a System Manager change or delete a row. A save writes the whole table back, so the app sends the rows
in their stored order with their `updated_by` (`toUpdateLogRows` in `pages/project-details/shared/`) and shows them
newest first.
_Avoid_: history, activity (that's the record's Version log).

**Owner-gated permission** — the access rule of risks and growth initiatives: System Manager, Projects Manager,
Delivery Manager, Delivery User and Timesheet Manager edit and delete any; a Projects User edits only the ones they
own (the risk owner, the activity owner) and deletes none. The backend enforces it in `has_permission`; the page
hides the actions with `useOwnerGatedPermissions()`.
_Avoid_: owner permission, record permission.

**Follower** — a user following a document through Frappe's document follow (`Document Follow`), notified of its
changes; shown as "watchers" on a risk or growth initiative. Following needs the user's "Send notifications for
documents followed by me" setting, else the server ignores it. In code: `useFollow()` and `useFollowers()` in
`pages/project-details/shared/`.
_Avoid_: subscriber (that's a note subscription), watcher (in code).

**Growth initiative** — an upsell or expansion idea on a project, tracked from ideation to close
(`PMS Growth Initiative`): an activity (its title), a category, a priority for the client, a status, a billable
outcome, a description and a desired outcome. Its **activity owner** carries it (and gates it, see owner-gated
permission) and its **ideation owner** proposed it. A status (`PMS Growth Initiative Status` of type Status) may close
it (`is_closed`), and then it needs a **closed status** (Won, Lost, Not Pursued). Status, priority and billable
outcome change only through its update log's updates. Its linked ToDos show as "Action items". The Growth tab lists
the project's initiatives in an open and a closed group, and `?growth=` opens one. In code: `provideGrowth()` /
`useGrowth()` and `useGrowthDetail()` in `pages/project-details/growth/`.
_Avoid_: opportunity, lead, deal.

**Record activity** — a document's history as the Growth detail shows it: who created it, who last edited it, and
each tracked change (from its Versions) as "changed the value of X from a to b", or rows added, removed and changed
in a table (`get_activity`). In code: `ActivitySection` in `pages/project-details/shared/`.
_Avoid_: timeline (that's the Calendar's), audit log, update log (that's the updates).

## Dashboards

**Leadership / Manager dashboard** — the two overview pages (`/dashboard/leadership`, `/dashboard/manager`),
each a grid of widgets. The manager dashboard's breadcrumb reads "Management".

**Widget** — one card on a dashboard (KPI card, stat card, heatmap, calendar timeline…). Its filter is saved in
`localStorage` under the React app's key.
_Avoid_: tile, panel, card (for the whole widget; `WidgetCard` is only its frame).

**Notification** — a `NextPMS Notifications` record for the signed-in user, read in the dashboard widget and the
notification tray (`useNotifications`).

## App

**Boot data** — the session data the server puts on `window.boot` (user, site name, timezones, feature flags).
In development `src/boot.ts` fetches it before the app mounts.

**View** — a named set of filters, sort and column layout for a list page, saved as a `PMS View Setting` row (a
tracking layout is a different kind of row and never shows as a view). The
projects page has two built-in views (List, Kanban) and the user's own and public saved views, picked with the
`view` query param.
_Avoid_: filter preset, layout (the column layout is one part of a view).

**Composable** — a `use*` function. frappe-ui's data composables (`useCall`, `useList`, `useDoc`, `useDoctype`,
`useNewDoc`) are how pages talk to the server.
_Avoid_: hook, service.

**Resource** — frappe-ui's older data API (`createResource`, `createListResource`). Still supported; new code uses
the composables.

**Story** — a Storybook entry rendering one state of a component. An **interaction story** has a `play` function
that drives the component and asserts on it; `npm run test-storybook` runs it as a test.
_Avoid_: example, demo, fixture.

**Port** — moving a page or component from the React app (or `frappe-ui-react`) to Vue, keeping its behaviour
(see P7).
_Avoid_: migrate (for a single component), rewrite (that's the whole project).
