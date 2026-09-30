# Data-scoping recon — the MANDATORY first step

Before seeding or capturing anything on a live-data site, map how each documented view isolates data. This decides the capture strategy per view: log in as a fictional user, add a User Permission, apply a UI filter, or defer the view to a clean instance. Skipping recon means you discover mid-capture that a "scoped" view actually leaks the whole site — after the shot is already taken.

Do the recon by **reading the app's API / query code** (the whitelisted endpoints and the frappe query builders behind each view), not by trial and error in the UI. The UI hides which filters are server-enforced versus cosmetic.

## The four isolation classes

Classify every view into exactly one:

- **USER-SCOPED** — the query is bound to the logged-in user (own timesheet, own settings, own dashboard). Capture while logged in as a fictional user; only that user's family data is in scope. Safest class.
- **USER-PERMISSION** — the view respects a User Permission on a link field (e.g. Customer, Project). Add the permission for the fictional login and capture as that user. Read the caveats below — a User Permission is leakier than it looks.
- **UI-FILTER** — the view shows everything by default, but a filter in the view narrows it (customer, project, reporting-manager). Apply the filter to the demo family before capturing. The filter is presentation-only, so the data is technically still fetched — fine for a screenshot as long as the rendered rows are all family.
- **LEAKS-ALL** — a site-wide aggregate with no isolation lever (dashboard counts, utilisation heatmaps, leadership revenue/cost/margin). No login or filter scopes it. Either shoot it on a clean/empty instance, or defer the view and document it in prose. Do not try to "mostly scrub" a LEAKS-ALL aggregate.

## Traps discovered — encode these as warnings

- **Frappe has NO company-based data scoping.** Creating a separate Company does not isolate anything — records across companies are still readable. Do not reach for "make a demo Company" as an isolation lever; it only pulls in accounting setup.
- **A User Permission on Customer does NOT exclude records whose link is BLANK.** Frappe's default behaviour bypasses the permission for records where the linked field is empty, so real records with a blank customer still leak into a view you thought was scoped. **Strict User Permissions** (System Settings) closes this bypass — but it is a **SITE-WIDE** setting change, risky on a shared site (it retroactively tightens every user's access). Weigh that before toggling it; often the safer move is a UI filter or a deferral.
- **Tasks are bounded by readable Projects, not by Customer.** A Customer User Permission alone will not scope the Tasks view — tasks are gated by which projects the user can read. Scoping Tasks needs Strict UP *and* a limit on readable projects (or a project/UI filter), not just a Customer permission.
- **Timesheet Manager / Timesheet User roles read timesheets with `ignore_permissions`.** The Team Timesheet and Project Timesheet views therefore show ALL timesheets regardless of any User Permission. Do not rely on a User Permission to scope these — use the view's own UI filter (reports-to / project) to narrow to the demo family instead.
- **Dashboard aggregate widgets have no lever.** At-risk project counts, members-without-allocation, the utilisation heatmap, and all Leadership KPIs aggregate the whole site. They are LEAKS-ALL by construction → they need a clean/empty instance, or defer them.

## The practical rule on a shared site

You will not get every view private on a shared production site. The workable strategy:

1. Apply UI filters (customer / project / reporting-manager) to scope list and team views to the demo family, and capture those.
2. Log in as fictional users for USER-SCOPED views.
3. Add User Permissions where a view honours them — but verify against the blank-link caveat before trusting them.
4. **Defer** views whose leak cannot be filtered (LEAKS-ALL aggregates) — document them in prose now, and re-shoot them later on a clean/empty instance. A deferred view with a prose description is a correct, honest deliverable; a leaked aggregate is not.

## Recon output feeds seeding and capture

The recon produces three things the rest of the pipeline needs:

- The **per-view isolation verdict** (which class, which lever) → drives capture order and login per view.
- The **doctype + field map** for the family (which fields exist, which are required, which are links) → drives the seed (see `references/seeding.md`).
- The **minimum roles required to create** each seed record → tells you which admin/HR/accounts roles the seeding login needs.
