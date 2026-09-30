# Coverage — page / route / role inventory

Which pages the wiki covers, the SPA route for each, the login that captures it, and what is excluded. This is the scope map — consult it when deciding whether a requested page is in scope and which role/state to shoot. Labels are quoted as they appear in the live UI; re-verify against the running app at capture time (the SPA changes fast).

## Exclusions & holds (check before building any page)

- **RAG stats** — ❌ EXCLUDED (rtCamp-internal). No page, no screenshot, no sidebar entry, no cross-reference. Also suppress the RAG **risk-dot** call-outs elsewhere (project list, About sidebar) if RAG is internal end-to-end.
- **Reports** (PM report-generation, project `custom_enable_project_report_generation`) — ❌ EXCLUDED (rtCamp-internal). Do not document, screenshot, or link.
- **Feedback** and **Repository Connections** — ⏸ ON HOLD pending the maintainer's full exclusion list; may be rtCamp-specific. Do not document until confirmed. When cleared, Feedback is gated by boot `has_customer_feedback` and Repo Connections by `has_repository_connections` (both true on staging).
- Any excluded feature is skipped entirely — no page, no shot, no nav entry, no link. If a documented page would reference one, omit the reference.

## Roles in play

`Delivery Manager, Delivery User, Projects Manager, Projects User, Timesheet Manager, Timesheet User, System Manager`. The **PM** account sees the full sidebar (Dashboards Leadership + Manager, Timesheet Personal/Team/Projects, Projects, Tasks, Allocations). The **Employee** account sees the minimal set (Personal timesheet, Tasks, Allocations — no Dashboards/Projects/Notifications). Document the *intended* role model; the staging PM test account is over-provisioned with a Delivery role (see `references/capture.md` §9).

## Route / login matrix

| Wiki page / surface | Route | Gating (roles) | Capture login |
|---|---|---|---|
| Personal Timesheet | `/next-pms/timesheet` | none (all users) | **Both** — Employee for the minimal-nav view; PM for the "Personal" labelled view |
| Team Timesheet | `/next-pms/timesheet/team` | Timesheet Mgr/User, Projects Mgr | PM |
| Project Timesheet | `/next-pms/timesheet/project` | Timesheet Mgr/User | PM |
| Projects | `/next-pms/projects` | Projects Mgr/User, Timesheet Mgr | PM (shoot at 1600w — wide table) |
| Project Detail (+ tabs) | `/next-pms/projects/:id` | Projects Mgr/User | PM |
| Tasks | `/next-pms/tasks` | none (all users) | Both (Employee shows the employee-scoped list) |
| Team Allocations | `/next-pms/allocations/team` | none | PM (write) + Employee (read-only variant) |
| Project Allocations | `/next-pms/allocations/project` | none | PM |
| Leadership Dashboard | `/next-pms/dashboard/leadership` | Delivery Mgr/User | PM test account (capture only; document as Delivery-only) |
| Manager Dashboard | `/next-pms/dashboard/manager` | Projects Mgr/User | PM |
| No-Employee state | `/next-pms/no-employee` | user without linked Employee | needs a no-Employee test user — flag as a gap |
| Not-Found state | `/next-pms/not-found` | any | either |
| Employee minimal sidebar | — | base user | Employee (the role contrast on *Roles & Access*) |

## Information architecture (page tree)

These are the **17 content pages the wiki was built as** — GitHub-wiki filenames (title with spaces → hyphens) shown on the left. Project Detail is **one assembled page** (`Project-Detail.md`), tabs are sections within it, not separate pages. The grouping headings are the nav grouping in `_Sidebar.md`, not pages.

```
Home                              landing: what Next PMS is, quick links, screenshot tour
Getting Started
  Installation                    required apps, bench get-app/install, migrate (Desk/CLI — mostly text)
  First-Run-Setup                 Projects Settings (time-overlap), work-schedule fields, sharing (Desk)
  Roles-and-Access                the role model + what each role sees (the matrix above) + PM vs Employee sidebars
Concepts
  Navigation-and-Layout           sidebar, header menu, global search (Ctrl/Cmd+K), notifications, theme (the one dark example)
Timesheet
  Personal-Timesheet              week/project/task grouping, add time, add time-off, submit for approval
  Team-Timesheet                  reports-to view, add time/leave for reports, weekly approval
  Project-Timesheet               project-week roll-up view
Projects
  Projects                        list columns, filters, kanban, view switch, add project
  Project-Detail                  one assembled page; tabs = sections: Overview, Calendar, Tracking, Risks, Notes, Email, ToDos + About sidebar
       Overview tab               editable Details + key goals; Specifics / Communication / Marketing; Repo Connections*
       Calendar tab               Calendar / Gantt / List views; Milestones & Touchpoints tables + create/edit modals
       Tracking tab               knowledge points; Task completion, Hours usage, Invoice/Budget/Cost burn; Contracts + Project rates
       Reports tab                ❌ EXCLUDED (rtCamp-internal) — tab appears in the real tab bar but is NOT documented
       Risks tab                  risk register; Create/Edit risk, Add update, detail (create role-gated)
       Notes tab                  notes grid; rich editor, templates, comments
       Email tab                  read-only project emails (Gmail-thread integration)
       ToDos tab                  project to-do list; Create/Edit todo
       Feedback tab               ⏸ ON HOLD — not documented pending the exclusion list
       RAG stats tab              ❌ EXCLUDED (rtCamp-internal) — appears in the tab bar but is NOT documented
       About sidebar              Summary; Project details; Links; Budget burn; Progress/hours; Members; Customers
Tasks
  Tasks                           columns, filters, add task, add-time from task, like
Allocations
  Team-Allocations                bars view, add allocation, edit schedule, over-allocation warning
  Project-Allocations             project bars, add/edit (Project → Customer → Employee field order), recurring
Dashboards
  Manager-Dashboard               managed projects, timesheet summary, upcoming time-off, heatmap, notifications
  Leadership-Dashboard            KPI/stat cards, utilisation, heatmap, forecast, revenue/cost/margin (Delivery-only)
Reference
  Billing-Types                   Non-Billable / Fixed Cost / Retainer / Time and Material
  FAQ-and-Troubleshooting         empty states, "no employee" access, common gotchas
_Sidebar.md                       the nav tree as wiki links
_Footer.md                        version note + links to repo, CONTRIBUTING, SECURITY
```

`* = conditionally shown via a boot flag / project field.` A tab-bar screenshot legitimately shows the excluded/on-hold tabs (Reports, RAG stats, Feedback) because they exist in the live tab bar — that is fine to show; just do not AUTHOR a section for them. Legacy pre-redesign wiki files (`Dashboard.md`, `Project-Sidebar.md`, `Project-Tracking.md`, `Resource-Management.md`, `Setting-up-Projects.md`) are superseded by the names above — retire or redirect them at final assembly.

## Desk-vs-SPA path

The SPA is the **canonical, recommended** workflow for every documented flow. Where a flow still requires Frappe Desk (e.g. the full Project form / initial billing configuration the SPA doesn't fully cover), show the Desk step too — clearly marked as the fallback/where-required, with the SPA path first. Project creation is the prime "show both" case: SPA "Add project" as the primary, the Desk full-form as the deeper alternative.

## Per-page surfaces & legend targets (the ones already scoped)

Brief per-page capture notes; consult the running app for exact current labels. RAG stats and Reports are omitted here because they are excluded.

- **Roles & Access** — (1) PM full sidebar; (2) Employee minimal sidebar. Legend targets: each sidebar section label. Renders the matrix above as a table + the two annotated sidebars.
- **Navigation & Layout** — (1) full app shell (sidebar + header); (2) header menu open ("Apps", "Switch To Desk", "Toggle Theme", "Logout"); (3) Global Search palette (Ctrl/Cmd+K); (4) Notification tray; (5) one dark-theme example.
- **Personal Timesheet** — (1) week view with the "Week / Project / Task" grouping toggle, "Search tasks", "Approval status", "Filter"; (2) expanded week row (Mon–Sun, Total, "Import liked tasks to this week", per-row "Add time", "Time-off" row); (3) "Add time" modal ("Duration", "Save and add another", "Save and close" — the calendar import is config-gated text only, `is_calendar_setup` false); (4) "Add time off" modal; (5) submit-for-approval flow; (6) status states ("Not submitted", "Partially approved" → "Resubmit for approval"). Empty-week state for Behaviour.
- **Team Timesheet** — (1) team table ("Search members", reports-to filter, "Approval status", "Filter"); (2) a member's week expanded; (3) "Add time-off" + "Add time" for reports; (4) "Add employee time" modal; (5) "Add employee leave" modal; (6) Weekly approval popup ("Approve"/"Reject", "Weekly Rejection Reason:", "Edit time entry"). Seed a member with a submitted week awaiting approval.
- **Project Timesheet** — (1) project-week roll-up table ("Search project" + "Filter"); (2) a project's weekly breakdown expanded.
- **Projects** — (1) List view columns; (2) view-switch dropdown ("List view"/"Kanban view"); (3) Kanban board (phase columns) + a card; (4) filters row ("Search project", "RAG Status", "Currency", "Phases", "Status") + advanced Filter; (5) "Add project" modal ("Project", "Phase", "Company"). Shoot at 1600w; even 1600 can't fit all 14 columns (later ones at x≥1650) — box the in-frame columns, table the rest. Kanban is animated → inject no-animation CSS before capture (see `references/capture.md` §10). Filter fields verified live: Project / Project Manager / Business Unit / Project Type / Billing type / Industry / Customer / Engineering Manager / Account Manager / Host / Tags.
- **Project Detail — Overview** — (1) read mode; (2) Edit mode (Cancel/Save); sections "Details", "Key goals of the project", Specifics, Communication, Marketing, Repo Connections* (Add repo dialog — on hold).
- **Project Detail — Calendar** — Calendar/Gantt/List views; toolbar (month picker, "Today", "All"/"Milestones"/"Touchpoints"); tables + Create; "Create milestone" / "Create touchpoint" modals. Seed ≥1 milestone + touchpoint.
- **Project Detail — Tracking** — knowledge-point row; Task completion, Hours usage, Invoice/Budget/Cost burn cards; Contracts + "Add contract"; Project rates + "Add rate". Seed a Time-and-Material project with contracts, rates, logged hours.
- **Project Detail — Risks** — list + toolbar filters + columns; "Create risk" modal; risk detail + "Add update"; "Delete risk" confirm. Legend: `RISK_STATUSES`, `RISK_LEVELS`. Create is role-gated.
- **Project Detail — Notes** — grid + subHeader ("Create" menu, "Search title", "Select Author"); editor ("Save note"/"Save template"/"Publish"); Template dialog; note detail + comments.
- **Project Detail — Email** — email list; empty "No emails found." Requires synced Gmail-thread emails.
- **Project Detail — ToDos** — list ("ToDos" + "New ToDo"); "Create todo" modal; empty "No to-dos yet for this project."
- **Project Detail — About sidebar** — accordion ("About this project"); Project details (with "Open in Desk"); Links; Budget burn; Progress/hours; Members (+ "Add member"); Customers (+ "Add customer").
- **Tasks List** — columns; subHeader ("Search task", "Project", "Status", sort, advanced Filter); "Add Task" modal; the "Add time" cell (clock icon) → prefilled timesheet dialog; the like cell.
- **Team Allocations** — member table with bars; subHeader ("Search members", role-gated Designation/Duration/Allocation-type filters, prev/"Today"/next, Filter); "Add allocation" modal (+ "Edit Schedule"); "Edit schedule" modal; over-allocation warning.
- **Project Allocations** — project table + bars; subHeader; same Add/Edit modals.
- **Leadership Dashboard** — greeting; KPI cards ("Revenue"/"Cost"/"Profit margin"); "Heatmap"; LeadershipStatCards; Utilisation donut; "Forecast breakdown for the next month"; Calendar timeline; NotificationsCard. Delivery-only.
- **Manager Dashboard** — greeting; ManagerStatCards; "Managed projects"; "Timesheets" summary; "Upcoming time-offs"; Heatmap; Calendar timeline; NotificationsCard.
- **Billing Types** — Non-Billable / Fixed Cost / Retainer / Time and Material; how each drives cost/billing; the rate rows for Time & Material; the sharing requirement.
- **FAQ / Troubleshooting** — empty states, the "Access Restricted" (`/no-employee`) page, "not-found" redirect, common gotchas (time-overlap setting, sharing for time entry, config-gated tabs not appearing).
