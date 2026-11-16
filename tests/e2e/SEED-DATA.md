# Data required before running the E2E suite on a fresh site

Create all of the below on a newly installed Next PMS site before the first run.
Order matters — Frappe rejects a link field pointing at a record that does not
exist yet.

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
| 14 | Employee | 5 records, linked to the users via `user_id` | One per user from row 12 |
| 15 | Employee → fields | `company`, `date_of_joining`, `designation`, `holiday_list`, `status: Active`, `ctc: 100000`, `salary_currency: USD` | `ctc` + `salary_currency` are **mandatory** — the timesheet costing hook fails without them |
| 16 | Employee → reporting | `reports_to = REP_MAN_ID` on all 3 employees, plus `custom_reporting_manager` and `leave_approver` | Without this the manager's Team view is empty |
| 17 | `.env` file | All keys below, with employee IDs matching row 14 | `*_NAME` must match the name exactly as the UI renders it |

## `.env` keys

```
BASE_URL

ADMIN_ID       ADMIN_EMAIL       ADMIN_PASS       ADMIN_NAME
REP_MAN_ID     REP_MAN_EMAIL     REP_MAN_PASS     REP_MAN_NAME
EMP_ID         EMP_EMAIL         EMP_PASS         EMP_NAME
EMP2_ID        EMP2_EMAIL        EMP2_PASS        EMP2_NAME
EMP3_ID        EMP3_EMAIL        EMP3_PASS        EMP3_NAME
```

## Do not pre-create these

`globalSetup` seeds them per test case: Project, Task, Timesheet,
Timesheet Detail, Leave Application, Resource Allocation, User Group,
PMS View Setting, extra Employees (Active / Inactive / Left / Suspended +
reviewees), ToDo.

Creating them by hand produces duplicates the teardown will not clean up.
