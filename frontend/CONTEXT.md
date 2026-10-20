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
navigation would drop an open, edited entry (`provideUnsavedChanges` in `composables/useUnsavedChanges.ts`).

## Planning

**Allocation** — a `Resource Allocation`: an employee booked on a project (or customer) for a date range, as hours
per day or total hours. It can be billable, tentative, and AI-created (`is_ai_created`).
_Avoid_: booking, assignment, schedule.

**Team / Project allocations** — the two allocation views: by employee (`/allocations/team`) and by project
(`/allocations/project`).

## Projects

**Project** — a Frappe `Project`, extended by next-pms with phases, budgets, contacts, timelines, status updates,
risks and growth initiatives.
_Avoid_: engagement, account (unless meaning the customer).

**Task** — a Frappe `Task` within a project; time entries are logged against tasks.
_Avoid_: ticket, issue, todo (a `ToDo` is a separate Frappe doctype).

**Task status** — a task's `status`: `Open`, `Working`, `Pending Review`, `Overdue`, `Template`, `Completed`,
`Cancelled`. In code: `TaskStatusValue` and `TASK_STATUSES` from `components/TaskStatus` (P16).

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

**Status update** — a written project update with a status, comments and pinning (`Project Status Update`).
_Avoid_: report (a `Project Report` is a separate doctype), note.

**Risk** — a project risk with category, level, status, owner and mitigation plan (`Risk`).

**Growth initiative** — an upsell or expansion idea on a project, tracked from ideation to close
(`PMS Growth Initiative`).
_Avoid_: opportunity, lead.

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
