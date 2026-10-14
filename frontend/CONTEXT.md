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

**Project phase** — a named, coloured stage a project moves through (`Project Phase`).
_Avoid_: stage, status (status is a separate field).

**Project budget** — purchased, consumed and remaining hours for a project over a period (`Project Budget`).

**Status update** — a written project update with a status, comments and pinning (`Project Status Update`).
_Avoid_: report (a `Project Report` is a separate doctype), note.

**Risk** — a project risk with category, level, status, owner and mitigation plan (`Risk`).

**Growth initiative** — an upsell or expansion idea on a project, tracked from ideation to close
(`PMS Growth Initiative`).
_Avoid_: opportunity, lead.

## App

**Boot data** — the session data the server puts on `window.boot` (user, site name, timezones, feature flags).
In development `src/boot.ts` fetches it before the app mounts.

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
