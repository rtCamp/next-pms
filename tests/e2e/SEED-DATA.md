# Pre-existing data required before the E2E suite can run

On a fresh Next PMS / Frappe site, `globalSetup` seeds per-test-case data, but it
assumes a base set of records already exists. Create everything in Part 1 before
the first run. Part 2 lists what the suite creates itself — do **not** seed those.

Order matters: Frappe rejects a link field pointing at a record that does not exist
yet, so create groups in the order given.

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
