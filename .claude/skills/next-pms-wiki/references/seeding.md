# Seeding a fake-data "family"

When the capture site holds real data (a shared staging/production instance), the only privacy-safe path is to seed a coherent fictional dataset — a "family" — that every documented view can render, then capture only that family. This is the biggest new capability the pipeline adds. Read `references/data-scoping.md` first: the recon tells you which views the family can isolate and which must be deferred.

## Seed method — the browser same-origin path (the sanctioned route)

Seed programmatically through the **chrome-devtools MCP browser**, using `evaluate_script` to call `frappe.client.insert` (and `frappe.client.set_value`, `frappe.db.get_list`, etc.) while logged in as **Administrator**:

```js
// inside evaluate_script, on a page already logged in as Administrator
await frappe.call({ method: "frappe.client.insert", args: { doc: {
  doctype: "Customer", customer_name: "Meridian Retail",
  customer_group: "Commercial", territory: "India", default_currency: "INR"
}}}).then(r => r.message.name)
```

- **Scripted curl / REST to a live PII site is blocked by the harness safety classifier.** The browser's same-origin XHR path (the app's own `frappe.call`, running in an authenticated tab) is the sanctioned route — it reuses the session cookie and CSRF token the page already holds. **Do not attempt to bypass the classifier** (no out-of-band curl, no token exfiltration); use the browser path.
- Every insert returns the created record's `name` — capture it straight into the teardown manifest (below).
- Use the MCP browser for bulk creation as well as for the few UI-only states (e.g. leaving a timesheet unsubmitted, which a direct insert can't reproduce faithfully).

## ALWAYS live-meta-check each doctype before seeding

The **deployed schema lags the repo.** A field that exists in the source code may be absent on the live site (observed: Employee `custom_working_hours` / `custom_work_schedule` existed in code but were ABSENT on the deployed instance). Before seeding any doctype, read its live fields and seed only fields that actually exist:

```js
// inside evaluate_script
frappe.get_meta("Employee").fields.map(f => [f.fieldname, f.fieldtype, f.reqd])
```

Check field presence, type, whether it is required (`reqd`), and for Selects the allowed options and for Links the target doctype. Seed against the live meta, never against the repo's assumed schema.

## Roles the seeding login needs

A plain Projects Manager **cannot** create Users / Employees / Customers / Sales Invoices. The seeding account needs:

- **System Manager** — Users, most masters.
- **HR Manager** — Employees (and Employee is a prerequisite for Timesheets).
- **Accounts Manager / User** — Sales Invoices and receivable accounts.

Confirm the login holds these before Phase "seed"; if `cred.txt` only has app-level logins (PM / Employee), you need an Administrator or System-Manager session first. Some roles get auto-added (a `reports_to` manager may auto-receive Leave Approver; login users may receive a site-default role) — note them in the manifest so teardown is complete.

## Seed a COHERENT family (numbers that add up)

The family is one fictional agency whose records all hang together, seeded in dependency order:

**people (in a `reports_to` hierarchy) → customers → projects → tasks → timesheets → allocations → billing (Sales Orders / Invoices)**

Rules for coherence:

- People form a real reporting chain: a delivery manager → a projects manager → a team lead → individual contributors, so Team Timesheet, Manager Dashboard, and reports-to filters all render populated.
- Give each role its login: a Delivery Manager (Leadership views), a Projects Manager (Projects), a Timesheet Manager (Team/Project Timesheet), a plain Employee (Personal Timesheet + employee-role contrast).
- Numbers must be internally consistent: per-project value / billed / cost / hours must sum to the leadership totals and margins you show. Pick partial vs full days so the utilisation heatmap shows a realistic mix, not empty or uniformly saturated.
- No orphans, no contradictions — a figure in one view must not disagree with the same figure in another.
- Keep at least one deliberate edge-case record where a view needs it (e.g. ONE unsubmitted timesheet to power the "not submitted" example).
- Mark every record so it is greppable and filterable: a dedicated department, a project-name prefix, the fixed set of fictional customers. This is what makes UI-filter isolation and teardown possible.

## Deployment gotchas — a pre-flight checklist

Encode these as a checklist; each one blocked a seed until handled:

- **Customer requires `default_currency`** (its billing currency) — set it or the insert fails.
- **Employee requires `salary_currency` + CTC** before any Timesheet will insert against that employee.
- **Project `custom_currency` is `fetch_from` `company.default_currency`** and cannot be overridden without switching the project's company — every save re-derives it. If you need a different display currency, you must change the project's company (which conflicts with same-company invoices/employees); usually simpler to accept the company currency.
- **A Timesheet on some deployments is single-project and capped at 24h/day.** The 24h cap fires on the timesheet TOTAL, not per-line. Model a work week as several **single-day, single-project** timesheets (~6–8h each) rather than one multi-day sheet; pass `to_time` on the same day as `from_time`.
- **Timesheet Detail `description` is REQUIRED** — every time log line needs one.
- **Activity Type names vary per site** — verify at least one exists (via meta or `frappe.db.get_list`) and use a real one; don't assume a fixed name.
- **A Sales Invoice needs a party (receivable) account whose currency equals the invoice currency.** A USD invoice against an INR default receivable is rejected ("Party Account currency and document currency should be same") — pick or create a matching-currency debtors account.
- **The project RAG status field is set MANUALLY**, not derived from Risks — set it directly to the value the doc should show.
- Confirm the required **Project Phase** (often a required Link) and any required masters (customer group, territory, department parent, holiday list) exist before inserting dependents.

## Isolation — add per-user User Permissions, then verify

For USER-PERMISSION views, add a User Permission per (login-user × demo customer):

```js
// allow=Customer, apply_to_all_doctypes=1, for each login user × each demo customer
{ doctype: "User Permission", user: "marcus.reed@lumina-demo.test",
  allow: "Customer", for_value: "Meridian Retail", apply_to_all_doctypes: 1 }
```

- Heed the **blank-customer bypass** (see `references/data-scoping.md`): a User Permission on Customer does not hide records with a blank customer link. If the view still leaks blank-linked real records, the lever is Strict User Permissions (site-wide, risky) or a UI filter or a deferral — not more permissions.
- **Verify isolation empirically:** log in as EACH fictional user and open each view they will be captured in, confirming only family data appears, BEFORE capturing. Do not trust the permission model on paper.

## Teardown manifest — log every record as you create it

Append every created record to a teardown manifest as it is inserted (the insert's returned `name` goes straight in):

```
<DocType><TAB><name>
```

- Include User Permissions (record their generated ids) and any auto-added roles.
- **Delete in reverse-dependency order** after all captures and QA are signed off: timesheet details/logs → Timesheets → Resource/Project Allocations → Tasks → Sales Invoices/Orders → Projects → Customers → Employees → Users → Department/Team (→ Company only if one was created).
- Keep the manifest until teardown is explicitly signed off — you may need to re-shoot without re-seeding.

## One family, one source of truth

Maintain a single spec file (people, customers, projects, the locked financial model, the real→fictional replacement map) that every caption, prose example, and seeded record draws from. If the project already has a fictional roster (in a README or existing docs), that set wins — reconcile the spec to it rather than inventing parallel names. A single source of truth is what keeps 80+ screenshots and their captions mutually consistent.
