# Seeding

How a case gets its data, and the rules the seeders follow. Every rule here
cost at least one failed run on staging or CI. Read this before adding a seed
block or a new kind of seeded record.

## Contents

- [One fixture per group](#one-fixture-per-group)
- [Projects, sharing and tasks](#projects-sharing-and-tasks)
- [The week seeder](#the-week-seeder)
- [Throwaway employees](#throwaway-employees)
- [Holidays and working days](#holidays-and-working-days)
- [Backdate limits](#backdate-limits)
- [Leaves](#leaves)
- [Week statuses](#week-statuses)
- [Retry-safe writing cases](#retry-safe-writing-cases)
- [Billing, currency and Tech Stack](#billing-currency-and-tech-stack)
- [Tasks, ToDos and milestones](#tasks-todos-and-milestones)
- [Teardown: what blocks a delete](#teardown-what-blocks-a-delete)

## One fixture per group

A group's cases share one seeded set instead of seeding per case. The fixture
is the first TC of the group that needs the data; the other specs read its stub:

| Fixture | Data module | Read by |
|---|---|---|
| TC208 | `data/employee/timesheetWeeks.js` | Personal tab, TC209–TC221, TC228 |
| TC222 | `data/manager/projectTimesheet.js` | Project tab, TC223–TC227 |
| TC232 | `data/manager/teamTimesheet.js` | Team tab, TC229–TC264 |

```js
const FIXTURE = "TC232";
data = (await readJSONFile(path.join(jsonDir, `${FIXTURE}.json`)))[FIXTURE];
```

Add a block to the fixture rather than a new TC block, so the group's records
are created once and found the same way by every case.

## Projects, sharing and tasks

- `payloadCreateProject<postfix>` creates a project; see the key table in
  `SKILL.md`. Give each a name the group owns (`TM Alpha`, `TC220 Project`);
  project names are unique.
- An employee sees a project, its tasks and the Add time choices only once it is
  shared with them: `payloadShareProject<postfix>` (a list of DocShare grants,
  `user` = the employee's email). A missing share looks like a broken dropdown.
- The week seeder creates a task by subject on first use and reuses it after
  (`taskFinder`), so several `payloadCreateWeekTime` specs can name the same
  `subject`.

## The week seeder

`createWeekTimeForTestCases` (`helpers/weekTimeHelper.js`) runs late in global
setup and reads these keys from a TC block:

| Key | Shape | Effect |
|---|---|---|
| `payloadCreateWeekEmployees` | `{ <Name>: { managed, holidayList, weekendsOff } }` | creates `Playwright- <Name><random>` employees; ids land in `entry.employees` |
| `payloadWeekendsOff` | `["EMP", ...]` | gives a shared account weekend days off when the app counts none for it |
| `payloadCreateWeekTime` | `[{ employee, project, subject, weeksAgo, days, hours, comment, role }]` | one timesheet per day (default Mon–Fri); `project` is the postfix of a `payloadCreateProject`; `role: "admin"` books past a backdate limit |
| `payloadWeekLeave` | `[{ employee, weeksAgo, day, half, reason, leaveType }]` | a full or half-day leave, booked by admin |
| `payloadWeekStatus` | `[{ employee, weeksAgo, status, days, note }]` | submits the week, then approves or rejects all its days or only `days` |
| `payloadLikeTasks` | `[{ employee, project, subject }]` | the employee stars the task |

`employee` is a shared account (`EMP`, `EMP2`, `EMP3`, `MANAGER`) or a name from
`payloadCreateWeekEmployees`. `weeksAgo` is a number (1 = last week) or
`"pastBackdateLimit"` (see below). Days are `"Mon"`..`"Sun"`, turned into dates
with `dateInWeek(weeksAgo, day)`, so nothing depends on today's weekday.

## Throwaway employees

- Named `Playwright- <Name><5 random letters>`; `deleteEmployeeByName` (teardown
  and the next setup's sweep) removes every employee with that prefix, so never
  give a real record that prefix.
- They carry `ctc` and `salary_currency` because saving a timesheet runs a
  costing hook that needs them.
- `managed: false` leaves out the reporting manager. Do this whenever the
  manager's roster matters elsewhere: TC53 compares the manager's exact list of
  reports, and the Team tab shows 20 members per page. Find these employees by
  search (`?search=Playwright- Tm`) instead.
- Keep `managed` (the default) for an employee the manager must act on as their
  manager: a manager may create a leave only for a report ("You are not allowed
  to access this Leave Application record because it is linked to Employee").
- Every seeded employee gets the manager as `leave_approver`: staging makes it
  mandatory (CI's `ci/seed.py` turns that setting off).

## Holidays and working days

A week's status compares its decided days with the employee's **working days**:
7 minus holidays and leave days in that week (`update_weekly_status_of_timesheet`
in `next_pms/timesheet/api/utils.py`). A week reads Approved or Rejected only
when every working day is decided. With no weekend off, five approved days out
of seven read **Partially approved**.

Where the holidays come from differs by site:

- **HRMS v16 reads an employee's holiday list only from a submitted Holiday List
  Assignment** (for the employee, else for their company). The Employee's
  `holiday_list` field and the Company default are ignored where the
  assignment doctype exists.
- CI: `ci/seed.py` creates "E2E Holidays" (no holidays at all) and assigns it to
  the company, so every CI employee has a seven-day working week.
- Staging: the company's list ("2026-27") has Saturdays and Sundays off.

So a seeded employee whose week must read Approved needs weekends off on CI:

- `weekendsOff: true` on a `payloadCreateWeekEmployees` entry gives it
  "E2E Weekends Off" (every Saturday and Sunday, last year to next year);
  `holidayList: "<name>"` gives it an empty list of that name (e.g. "E2E No
  Weekly Off", so today is always a working day for a time-off case).
- `payloadWeekendsOff: ["EMP"]` does the same for a shared account, but only
  when the Team API shows no holidays for it last week, so staging's account
  is left alone.
- Both go through `assignHolidayList`: it submits a Holiday List Assignment
  (when the doctype exists) and **then** sets the Employee field. That order
  matters: next_pms caches `get_holidays` for an hour, and only a change to the
  Employee's `holiday_list` clears that cache; submitting an assignment does
  not.

## Backdate limits

- Timesheet Settings: staging allows 100 working days back for employees and
  managers; CI allows 30. Working days skip the employee's holidays and leaves,
  so with no weekends off CI's limit is just 30 calendar days and a week four
  back can fall outside it.
- Admin is exempt. That is why `payloadCreateWeekTime` takes `role: "admin"` for
  old weeks, and why `payloadWeekStatus` submits and decides as admin.
- `weeksAgo: "pastBackdateLimit"` resolves at seed time to the first week wholly
  before the manager's limit for that employee (read from
  `get_team_timesheet_data`'s `backdate_restricted_before`) and is stored in
  `entry.resolvedWeeks[<name>]` for the spec (about 22 weeks on staging, 7 on
  CI with weekends off).
- An employee cannot create a backdated leave ("Only users with the HR Manager
  role..."), so leaves are seeded by admin.

## Leaves

- `payloadWeekLeave` books as admin with the manager as approver; the default
  type is "Unpaid Time Off" (LWP; the Add Leave dialog lists LWP types only).
- `half: "First Half"` sets `custom_first_halfsecond_half`, a staging custom
  field. CI does not have it, so the app labels the day "· Half day off" instead
  of "· First half off". Assert either.
- A leave day counts as time-off in the grid (08:00 a day, 04:00 for a half).
- Saving any Leave Application clears the app's `get_employee_leaves` cache for
  every employee.

## Week statuses

- `payloadWeekStatus` submits the week for approval as admin, then, unless the
  status is `"pending"`, calls `approve_or_reject_timesheet` for the booked
  dates, or only those in `days`, with `note` as the reason.
- Approval and rejection are **queued**: the call returns "Timesheet approval or
  rejection has been queued for processing", rows read "Processing Timesheet",
  then the background job writes the result. `waitForStatus` polls for it;
  a spec polls with a reload (`expect.poll`), since the CI replay never gets the
  realtime event that refreshes an open page.
- The app refuses: a reviewer's own week ("You cannot approve or reject your own
  timesheets."), a week past the backdate limit (the message names the earliest
  allowed date), and a week already processing.

## Retry-safe writing cases

CI retries a failed test twice, and the second attempt finds whatever the first
one changed.

- Before acting, check the record is still as seeded and put it back if not:

  ```js
  const ensureWeek = async (who, weeksAgo, status) => {
    const statuses = await weekStatuses(data, who, weeksAgo);
    if (!statuses.length || statuses.some((s) => s !== status)) {
      await reseedWeek(data, FIXTURE, who, weeksAgo);
    }
  };
  ```

  `reseedWeek` deletes (cancelling first) the employee's timesheets in that
  week, books the fixture's time again and replays its statuses.
- Remove what the case adds in `finally` (`clearDay` for added time, deleting a
  created leave), so a failed attempt does not leave the next one a different
  page.
- Give each writing case its own seeded employee (TmApprove, TmQueued, TmLocked,
  ...) instead of sharing one, so cases running in parallel do not race.

## Billing, currency and Tech Stack

- **Total Sales Amount cannot be written**: Project.validate recomputes it from
  submitted Sales Orders. Seed money with `payloadCreateSalesOrder<postfix>:
  { amount }`; `cleanUpProjects` cancels and deletes the orders before the
  project.
- **A project's currency is its customer's.** Use `QA-INR` and `QA-USD`
  (`ci/seed.py`; `ensureUsdCustomer` creates the USD one on staging). Never rely
  on another customer's currency, which differs between sites.
- **Tech Stack**: newer builds refuse a billable project without `tech_stack`.
  `createProject` adds one row when the site has the **Technology** doctype
  (staging's Project meta stopped listing the field while still requiring it, so
  the doctype is the reliable check).
- A task in a billable project is forced billable on insert; switch a
  non-billable one off with a PUT afterwards.

## Tasks, ToDos and milestones

- Staging forces a new Task's status to "Working" even when "Open" is sent; a
  fresh site keeps "Open". Read the stored status instead of hard-coding one.
- Task `exp_end_date` is stored as `YYYY-MM-DD 00:00:00` on staging; match the
  date with `toContain` or a `^date` regex.
- Frappe reuses a deleted record's name when it was the latest in its naming
  series, so a parallel test can get it. Confirm a deletion by subject or title,
  never by name.
- A milestone dated in the past makes another app log a "Project RAG Trigger
  Log" that blocks deleting the project. Use future dates.
- Stock ToDo requires `description`; staging does not. Seed what CI needs in
  `ci/seed.py` rather than skipping on CI.

## Teardown: what blocks a delete

Frappe refuses to delete a record anything still links to, and a submitted
record must be cancelled first. The cleanup helpers clear the dependants in
order; extend them when you seed a new kind of linked record:

| Record | Blocked by | Cleared in |
|---|---|---|
| Project | submitted timesheets, Sales Orders, allocations | `cleanUpProjects` (cancels, then deletes) |
| Employee | timesheets, Leave Applications, Holiday List Assignments | `deleteEmployeeByName` |

Then register the data module in both places named in `SKILL.md` (seeding and
the orphan sweep), and after a full run confirm nothing is left: no
`Playwright-` employees (their assignments and leaves go with them) and no
`TC<n>` projects. A shared account's weekends-off assignment stays, on purpose.
