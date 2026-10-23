# Environments: staging, CI and the local replay

The same spec meets three sites. A pass on one is not a pass on the others, and
most "flaky in CI" reports so far were a difference listed here. When a test
passes on staging and fails in CI, find the row before touching the test.

## Contents

- [The three sites](#the-three-sites)
- [Differences that have failed tests](#differences-that-have-failed-tests)
- [Which UI to write for](#which-ui-to-write-for)
- [Backend defects that look like test failures](#backend-defects-that-look-like-test-failures)
- [Network and clock](#network-and-clock)

## The three sites

| | Staging (run from your machine) | CI (E2E Tests workflow) | `.local-ci` replay |
|---|---|---|---|
| URL | `https://erp-stage.rt.gw` | `http://localhost:8000`, `test_site` | same as CI, in Docker |
| App code | whatever was deployed | the PR's commit | the last **commit** (uncommitted app changes are not used) |
| Tests | your working tree | the PR's commit | your working tree |
| Data | years of shared, real-shaped data | empty, then `ci/seed.py` | same as CI |
| HRMS | deployed version | v16.16.0 | same as CI |
| Retries / workers | 0 / CPU count | 2 / 7, `maxFailures: 5` | as CI, unless `E2E_ARGS` passes `--workers` |
| Timeout factor | 2 | 3 | 3 |

The replay is local-only (`.local-ci/` is excluded from git). Run it from a
fresh database: `cd .local-ci && docker compose down -v`, then
`E2E_ARGS="-g 'TC263:' --workers=1" docker compose run --rm runner`. Output
lands in `.local-ci/out/` (`results.json`, `test-results/`, `run.log`, the
server's `worker-*.log`).

## Differences that have failed tests

| Area | Staging | CI | What it breaks / what to do |
|---|---|---|---|
| Holidays | company list "2026-27": Sat and Sun off | company assignment to "E2E Holidays": **no** holidays | a whole Mon–Fri week approved reads "Partially approved"; backdate limits count calendar days. Seed weekends off (`seeding.md`) |
| How holidays resolve | Employee field or assignment | **Holiday List Assignment only** (HRMS v16) | setting `Employee.holiday_list` alone does nothing on CI |
| Backdate limit | 100 working days | 30 working days | a week four back can be out of range on CI without weekend offs |
| Leave approver | mandatory | not mandatory | seed every employee and leave with the manager as approver |
| First/Second half leave field | `custom_first_halfsecond_half` exists | absent | drawer label "· First half off" vs "· Half day off" |
| Tech Stack | required on billable projects | no Technology doctype | `createProject` adds one only when the doctype exists |
| Customers | many; "Acme Corporation" is USD | "Acme Corporation" is INR | pick `QA-INR` / `QA-USD` by currency |
| New Task status | forced to "Working" | stays "Open" | read the stored status |
| Older data | plenty, for every shared account | none beyond the run's own seed | `has_more_weeks` is false on CI unless something is seeded 12+ weeks back; on staging assert on seeded rows only |
| Realtime updates | arrive | never arrive in the replay | an open grid does not refresh after a save or a queued decision: reload before reading |
| Team tab weeks | TC263 reached a week four back as rendered | only the first four weeks open; older ones stay collapsed with no rows | a case acting on an older week opens it with a Date range filter (`compositeFilters` in the URL) |

## Which UI to write for

Write page objects for the **React frontend this branch ships**, because that is
what CI builds and what gates the PR. Staging sometimes runs another build: in
October 2026 it served the Vue rewrite of the Timesheet pages
(`feat/vue-rewrite-timesheets`) for a while, with different week headers,
dialogs and a broken Filter panel. When a failure comes only from markup the
branch does not render (`git grep` the branch's `frontend/` to check), report it
as a staging difference and leave the code alone: no Vue locators, no
dual-build switches, no skips. A Vue port and a dual-build version were both
tried and reverted.

## Backend defects that look like test failures

- **"Something went wrong — 'NoneType' object is not iterable" on page load.**
  `next_pms.timesheet.api.app.get_data` returned 500 from
  `_compute_backdate_boundaries`, iterating the result of the Redis-cached
  `get_employee_leaves`. Frappe v16's `redis_cache` wrapper returns `None` when
  another request fills the same key between its read and its `exists` check,
  which happens when several pages of one user load at once on a cold cache
  (the start of a run, right after leaves are seeded). Intermittent; the next
  request works. Fixed on Frappe `develop` in f4667abc5d ("fix: redis_cache
  returns None when a parallel worker caches the result"), not yet on
  `version-16`. Not a test bug: report it, do not work around it in the spec.
- **A 403 for a role** is often a real permission gap on the site, not test rot
  (see `traps.md`).

## Network and clock

- **Connection resets against staging.** `fetchWithRetry` retries a request
  that got no response, including a POST the server had already applied. A
  retried create then fails with "<Name> must be unique" / `Duplicate entry
  'TC<n> Project'` and setup stops. The teardown that follows cleans up; check
  `curl <base>/api/method/ping` and rerun.
- **Midnight.** Week maths (`weekLabel`, `dateInWeek`) uses the runner's clock,
  and CI runs in `Asia/Kolkata` (`TZ` in the workflow, the site's time zone in `ci/seed.py`). A run that seeds on Sunday night and tests
  after midnight sees "Last week" move under it. Rare; rerun rather than
  chase it.
