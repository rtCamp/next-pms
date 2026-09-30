# Pre-existing data required before the E2E suite can run

On a fresh Next PMS / Frappe site, `globalSetup` seeds per-test-case data, but it
assumes a base set of records already exists. Create everything in Part 1 before
the first run. Part 2 lists what the suite creates itself — do **not** seed those.

Order matters: Frappe rejects a link field pointing at a record that does not exist
yet, so create groups in the order given.

---

## Quick reference

Everything to create, in order. Each row is expanded in Part 1 below.

| # | Doctype | Values / Records to create | Notes |
|---|---|---|---|
| 1 | Projects Settings | Ignore User Time Overlap, Ignore Employee Time Overlap | **Enable both.** Time entry seeding fails outright without them |
| 2 | HR Settings | Work Schedule `Per Day`, Working Hours `8` | Drives capacity/utilisation; blank breaks the resource grid |
| 3 | Company | `rtCamp Solutions Pvt. Ltd.` | Everything links to it |
| 4 | Currency | `INR`, `USD`, `EUR` | Enable all three + exchange rates |
| 5 | Customer | `Acme Corporation`, `Google`, `rtCamp`, `QA-INR`, `QA: EUR` | `QA: EUR` has a colon + space, `QA-INR` a hyphen |
| 6 | Project Type | `Fixed Cost`, `Retainer`, `TnM`, `Non Billable` | `Non Billable` — no hyphen |
| 7 | Billing Type (select field options) | `Fixed Cost`, `Retainer`, `Time and Material`, `Non-Billable` | `Non-Billable` — with hyphen |
| 8 | Business Unit | `Jupiter`, `Polaris` | |
| 9 | Designation | `L1 - Software Engineer` | |
| 10 | Leave Type | `Unpaid Time Off` | |
| 11 | Holiday List | One list, assigned to company/employees | Needed for leave + allocation date maths |
| 12 | User (login) | 5 accounts: admin, manager, employee, employee2, employee3 | **Suite never creates these.** Enabled, with known passwords |
| 13 | Has Role | `Employee` on all 4 non-admin users; manager also needs Team/approval role | Employees must **not** get manager roles — TC52 checks the Team tab is absent |
| 14 | Employee | 5 records, linked to the users via `user_id` | See required fields below |
| 15 | Employee → fields | `company`, `date_of_joining`, `designation`, `holiday_list`, `status: Active`, `ctc: 100000`, `salary_currency: USD` | `ctc` + `salary_currency` are **mandatory** — the timesheet costing hook fails without them |
| 16 | Employee → reporting | `reports_to = REP_MAN_ID` on all 3 employees, plus `custom_reporting_manager` and `leave_approver` | Without this the manager's Team view is empty |
| 17 | `.env` file | All keys from `.env.example`, with employee IDs matching row 14 | `*_NAME` must match the name exactly as the UI renders it |

**Do NOT pre-create these — `globalSetup` seeds them:** Project, Task, Timesheet,
Timesheet Detail, Leave Application, Resource Allocation, User Group,
PMS View Setting, extra Employees (Active / Inactive / Left / Suspended +
reviewees), ToDo. Seeding them by hand creates duplicates the teardown will not
clean up.

**Two code fixes are still needed** for a fresh site, whatever the script does:
`specs/manager/team.spec.js:182` hardcodes `EMP-00519`, and `data/manager/team.js`
TC53 hardcodes five real colleague names that will not exist on a new site.

---

## Part 1 — must exist before the first run

### 1. Site settings — do these first

Per the [First Run Setup](https://github.com/rtCamp/next-pms-ai-wiki/blob/preview/First-Run-Setup.md)
doc. The suite does **not** configure any of these, and seeding time entries
fails outright without the first one.

| Doctype | Field | Value |
|---|---|---|
| Projects Settings | Ignore User Time Overlap | enabled |
| Projects Settings | Ignore Employee Time Overlap | enabled |
| HR Settings | Work Schedule | `Per Day` |
| HR Settings | Working Hours | `8` |

**Time overlap** — Next PMS records time by date, not by datetime. Frappe's
built-in overlap check rejects valid same-day entries, so every timesheet the
seeder writes fails until both flags are on.

**Working hours** — drives expected capacity and utilisation. Leave it blank and
the resource-management grid has nothing to compute against. `8` matches the
current staging baseline, which renders as `8h free` per day in the team view.

**Project sharing** — the third item in that doc is already handled by the suite:
`payloadShareProject*` blocks create the DocShare grants per test case. Your
script does not need to do this.

### 2. Masters (no dependencies — create first)

| Doctype | Values needed |
|---|---|
| Company | `rtCamp Solutions Pvt. Ltd.` |
| Currency (enabled) | `INR`, `USD`, `EUR` |
| Customer | `Acme Corporation`, `Google`, `rtCamp`, `QA-INR`, `QA: EUR` |
| Project Type | `Fixed Cost`, `Retainer`, `TnM`, `Non Billable` |
| Business Unit | `Jupiter`, `Polaris` |
| Designation | `L1 - Software Engineer` |
| Leave Type | `Unpaid Time Off` |
| Holiday List | one list, assigned to the company / employees |

Billing type is a select/custom field, not a doctype. Its options must include:
`Fixed Cost`, `Retainer`, `Time and Material`, `Non-Billable`.

Note the inconsistent spellings — they are used verbatim by the payloads:
project type is `Non Billable` (no hyphen), billing type is `Non-Billable`
(hyphen). Customer `QA: EUR` has a colon and a space; `QA-INR` has a hyphen.

Currency exchange rates for INR/USD/EUR are needed if project-currency tests run.

### 3. Login users (5) — the suite never creates these

One User per role, **enabled, with a known password**. These are the accounts
`storageStateHelper` logs in as; there is no fallback if they are missing.

| .env key | Role in suite |
|---|---|
| `ADMIN_EMAIL` / `ADMIN_PASS` | administrator — API seeding only |
| `REP_MAN_EMAIL` / `REP_MAN_PASS` | reporting manager |
| `EMP_EMAIL` / `EMP_PASS` | employee |
| `EMP2_EMAIL` / `EMP2_PASS` | employee2 |
| `EMP3_EMAIL` / `EMP3_PASS` | employee3 |

Roles to grant: `Employee` on all four non-admin users; the manager additionally
needs whatever role exposes the Team tab and timesheet approval (Projects
Manager / Timesheet Manager, depending on your role setup).

The employee accounts must **not** have manager roles — `TC52` asserts the Team
tab is absent for an employee.

### 4. Employee records (5) — one per user

Linked to the users above via `user_id`. Fields the suite depends on:

```
company           : rtCamp Solutions Pvt. Ltd.
date_of_joining   : any past date
designation       : L1 - Software Engineer
holiday_list      : the list from step 1
ctc               : 100000
salary_currency   : USD
status            : Active
```

`ctc` and `salary_currency` are **not optional**. Saving a timesheet runs the
costing hook, which throws *"Please set salary currency for the employee."*
without them.

### 5. Reporting structure

The three employees must report to the manager:

```
EMP_ID.reports_to   = REP_MAN_ID
EMP2_ID.reports_to  = REP_MAN_ID
EMP3_ID.reports_to  = REP_MAN_ID
```

Also set `custom_reporting_manager` (the manager's name) and `leave_approver`
(the manager's email) on each. Without this the manager's Team view is empty and
every team-tab test fails.

### 6. `.env` file

Copy `.env.example` and fill every key. The employee IDs must match the records
created in step 3:

```
BASE_URL=https://<your-site>
ADMIN_ID / ADMIN_EMAIL / ADMIN_PASS / ADMIN_NAME
REP_MAN_ID / REP_MAN_EMAIL / REP_MAN_PASS / REP_MAN_NAME
EMP_ID / EMP_EMAIL / EMP_PASS / EMP_NAME
EMP2_ID / EMP2_EMAIL / EMP2_PASS / EMP2_NAME
EMP3_ID / EMP3_EMAIL / EMP3_PASS / EMP3_NAME
```

`*_NAME` must be the employee's full name exactly as the UI renders it — the
team-tab tests match on the displayed name.

---

## Part 2 — created by `globalSetup`, do NOT seed

| Doctype | Created for |
|---|---|
| Project | per TC, from `payloadCreateProject*` |
| Task | per TC, from `payloadCreateTask*` |
| Timesheet / Timesheet Detail | time entries per TC |
| Leave Application | leave tests |
| Resource Allocation | allocation tests |
| User Group | team-tab grouping tests |
| PMS View Setting | saved-view tests |
| Employee (extra) | Active / Inactive / Left / Suspended variants + reviewees |
| ToDo | run marker used to scope teardown |

Seeding these by hand creates duplicates the teardown will not clean up.

---

## Known hardcoded values to fix or parameterise

Two values are hardcoded in the suite and will not match a fresh site:

1. `specs/manager/team.spec.js` — `process.env.REP_MAN_ID !== "EMP-00519"`
   picks between the QE and staging expected rosters. On a new site this
   comparison is meaningless; move it to an env var.

2. `data/manager/team.js` — the `TC53` expected roster lists real colleague
   names as literals (`Aishwarrya Pande`, `Juhi Saxena`, `Pavan Patil`,
   `Renish Vimalbhai Surani`, `Shraddha Gore`). On a fresh site these people do
   not exist, so `TC53` will fail until the list is replaced with the employees
   your script actually creates.

---

## Verifying the seed worked

Before the first full run:

```bash
# 1. each account can log in and the auth state is built
rm -f tests/e2e/auth/*.json
npx playwright test --config=tests/e2e/playwright.config.js --list

# 2. one cheap test end to end
npx playwright test --config=tests/e2e/playwright.config.js --workers=1 --grep 'TC52:'
```

`TC52` is a good smoke test: it only checks that the employee has no Team tab, so
it passes only if the user, the employee record, the roles and the login all work.
