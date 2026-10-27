---
name: next-pms-e2e
description: >
  Architecture map, conventions and failure playbook for the Playwright E2E suite
  at `tests/e2e/` in the next-pms repo. Load this before writing, fixing, running
  or triaging ANY test in that suite — including one-line selector fixes that look
  trivial — because the suite has non-obvious contracts that silently manufacture
  both phantom passes and phantom failures: test-ID-driven global seeding that
  ignores `--grep`, worker-scoped auth caching, `slowMo: 500` against a scaled
  timeout, and a staging site and a CI site that differ in data, HR setup and UI
  build. Use it whenever the request mentions e2e or Playwright tests, a TC number
  (TC38, TC102, ...), implementing new test cases or a group from the coverage
  sheet, files under `tests/e2e/**` (specs, pageObjects, helpers, utils/api, data),
  failing or flaky tests (on staging, in CI or in the `.local-ci` replay),
  selectors that broke after the UI redesign, test data seeding or auth state,
  `npm run e2e:tests`, `results.json`, or asks for a test change to be
  "consistent with the rest of the suite".
---

# next-pms E2E suite

The suite lives at `tests/e2e/` in the repo root. It is a Playwright + Page Object
suite covering Next PMS across five seeded roles, driven against a **shared staging
site** — not a local build, not a disposable fixture database.

That last fact drives most of what follows. Tests read and write real records that
other tests and other people also touch, so "did my change work?" and "is the app
broken?" and "is the data wrong?" are three different questions that produce
identical-looking red output.

## Orient before you edit

Five properties of this suite cause most wasted effort. Check them before forming
any theory about a failure.

**1. Seeding is global and ignores your filter.** `globalSetup` runs
`scripts/list-tests.js`, which AST-parses *every* spec file and extracts every
`TC<n>:` ID from test titles, then seeds data for all of them sequentially. This
happens on every run regardless of `--grep`, so a single-test run still costs
~10 minutes against staging with ~250 TCs, plus teardown (a two-test run took
~20 minutes end to end in October 2026). Budget for it; don't assume you broke
something because a run is slow.

**2. Auth state is cached.** `playwright.fixture.cjs` builds
`auth/<role>-w<workerIndex>.json` when the file is absent or its `sid` has
expired (`hasUsableSession`), but it cannot tell a session the server has since
rejected. If failures are broad and uniform (every role lands on the login page),
delete `tests/e2e/auth/*-w*.json` and re-run before debugging anything else, after
checking the site itself is up (`traps.md`, `SessionStopped`).

**3. `slowMo: 500` vs. a scaled timeout.** `playwright.config.js` sets
`launchOptions.slowMo = 500` and multiplies the 30s test and 5s expect budgets by
`TEST_TIMEOUT_FACTOR` (2 locally, 3 on CI). Every action still carries a
half-second tax, so a flow with ~20 actions is at 10s before any network. Adding
`waitForTimeout` padding to a page object can push a passing test over the edge,
and tests that pass solo fail under parallel load. Prefer real waits (`waitFor`,
`toBeVisible`); an explicit `waitFor({ timeout })` goes through `scaleTimeout()`
(`utils/timeouts.js`) so it scales with the config. A long flow sets its own
`test.setTimeout(...)` rather than raising the global one.

**4. A green test is not proof.** Assertions here have historically passed for the
wrong reason. `isTimeEntryBillable()` checked `svg.count() >= 3` on cells that
contain zero svgs, so it always returned `false` — and four tests asserting
`false` were green while testing nothing. When you touch a helper that returns a
boolean, verify it returns `true` in the true case too.

**5. Staging and CI are two different sites.** Tests are written and run against
staging (`erp-stage.rt.gw`), but the gate is the **E2E Tests** workflow
(`.github/workflows/e2e-tests.yml`), which builds a fresh site from the branch:
the branch's own React frontend, a near-empty database seeded by `ci/seed.py`,
HRMS v16.16.0, retries 2. The two differ in ways that turn a staging pass into a
CI failure: holidays (CI's "E2E Holidays" list has no weekend offs), required
fields (leave approver, Tech Stack), custom fields, backdate limits (100 working
days on staging, 30 on CI) and sometimes the UI build itself. Write for the
React UI the branch ships, and check `references/environments.md` before
trusting a staging-only pass.

## Architecture

Four layers, and code belongs in exactly one of them:

```
specs/          assertions + orchestration only. No selectors.
pageObjects/    locators (constructor) + interactions (methods). No assertions
                about business outcomes; `expect` only for self-checks.
helpers/        multi-step domain flows and seeding logic
utils/api/      HTTP wrappers around Frappe/ERPNext endpoints
```

A selector appearing in a spec, or an `expect` on business data inside a page
object, is a smell — it puts knowledge in a layer that can't be reused.

### Where things live

| Path | Contents |
|---|---|
| `specs/<role>/<feature>.spec.js` | tests; role dirs map to config projects |
| `pageObjects/*.js`, `pageObjects/resourceManagement/*.js` | page objects |
| `helpers/*.js` | domain flows + all seeding logic; week-based timesheet seeding is `weekTimeHelper.js` |
| `utils/api/*.js` | API wrappers; `apiClient.js` holds shared auth + retry |
| `utils/{dateUtils,fileUtils,stringUtils,timeouts}.js` | shared utilities (`weekLabel`, `dateInWeek`, `scaleTimeout`, `escapeRegExp`) |
| `data/<role>/<feature>.js` | test data, keyed by TC ID |
| `ci/seed.py` | the CI site's base data (users, employees, customers, holiday list, settings) |
| `data/json-files/TC<n>.json` | **generated** per-run stubs — never hand-edit |
| `globals/globalSetup.js` / `globalTeardown.js` | seed / clean |
| `auth/<role>-{API,w<N>}.json` | **generated** sessions — safe to delete |
| `results.json`, `test-results/`, `playwright-report/` | **generated** output |

Roles are Playwright projects, each with `metadata.TEST_ROLE`:
`employee`, `employee2`, `employee3`, `manager` (+ `admin` for API-only seeding).
The role determines which `auth/` state a test runs under, so a test's directory
is not cosmetic — moving a spec between role folders changes who runs it.

## The test-ID contract

Everything hangs off the `TC<n>:` prefix in the test title. Get this wrong and a
test runs against unseeded data.

1. The title **must** match `/TC(\d+):/` — the colon is part of the pattern.
   `test("TC42: ...")` seeds; `test("TC42 ...")` does not.
2. `globalSetup` writes `data/json-files/TC<n>.json`, then `populateJsonStubs`
   merges in anything keyed `TC<n>` from the **registered data modules** (twelve
   as of October 2026, one per feature: `data/employee/timesheet.js`,
   `data/manager/team.js`, `.../teamTimesheet.js`, ...). Keys from multiple
   modules deep-merge for the same TC. A new data file must be registered in
   **two** places, or it is half-wired:
   - the `dataSources` map in `utils/fileUtils.js` (seeding), and
   - the spread in `readAndCleanAllOrphanData` in `helpers/timesheetHelper.js`
     (the sweep that removes what an aborted run left behind).
3. Seeding then runs, in order, per TC: employees → time-entry updates →
   reviewees → projects → views → tasks → seeded-employee time → allocations →
   time entries → billing (Sales Orders, rates) → week time
   (`createWeekTimeForTestCases`) → leave → user groups.
4. The spec reads its own stub:

   ```js
   const data = await readJSONFile(path.join(jsonDir, "TC39.json"));
   const TC39data = data.TC39;
   ```

### Payload key naming is load-bearing

The seeder selects project keys with an **anchored** regex,
`/^payloadCreateProject(\w*)$/`, then derives siblings by substituting the prefix
and reusing the postfix:

| Key | Effect |
|---|---|
| `payloadCreateProject` | seeded; postfix `""` |
| `payloadCreateProject2` | seeded separately; postfix `"2"` |
| `payloadShareProject<postfix>` | DocShare grants for that project |
| `payloadDeleteProject<postfix>` | teardown; `projectId` back-filled |
| `payloadCreateTask<postfix>` | task on that project |
| `infoPayloadCreateProject` | **never seeded** — fails the `^` anchor |

`infoPayload*` is therefore inert data the spec reads for values (names, dates)
while creating the record itself through the UI. That is a deliberate pattern, not
a bug — but it means a test using `infoPayload*` prefixes consumes *another* TC's
seeded records. Before "fixing" seed data for such a test, find which block
actually seeds what it consumes. (TC78 cost a wasted cycle here: its edits landed
on an `infoPayload*` block and changed nothing.)

## Implementing new test cases

New cases come from the coverage sheet ("Next-PMS 2.0 e2e automation coverage
and gaps", tab **Gap Test Cases**), one group at a time (Timesheet TS-, Team
Timesheet TM-, ToDo TD-, ...). The groups that landed cleanly in one pass
(Timesheet TC208–TC228, Team Timesheet TC229–TC264) followed this order:

1. **Crawl before planning.** Open the page in each role with `probe.mjs`
   (GET only, `--block-writes`) and record the real labels, URL params, empty
   states and server messages. Read the backend endpoint for the rules
   (`next_pms/**/api/*.py`), and check whether a backend test already covers a
   case.
2. **Check coverage first.** Read the other groups' rows and the existing specs
   for the same behaviour; add only what nothing covers.
3. **Write a plan file** at the repo root (`plan_e2e-<group>.md`, gitignored):
   each sheet ID → TC number (next free numbers, in sheet order), the spec it
   lives in, what it asserts, what it seeds. Decide every expected value up
   front from the crawl, not while debugging.
4. **Pre-seed, then verify through the UI.** Everything a case needs exists
   before the test starts (global setup). The test drives and asserts through
   the UI; only a case that is about the API (a 403, a refusal) calls the API.
   One fixture TC per group seeds a shared set of records the other cases read
   (TC208 for the Personal tab, TC222 for the Project tab, TC232 for the Team
   tab): add a block to it instead of seeding per case. See
   `references/seeding.md`.
5. **Throwaway records, found by a unique prefix.** Seeded employees are named
   `Playwright- <Name><random>` (the teardown sweep deletes by that prefix) and
   projects `TC<n> ...`. Tests find them by search, not by reporting line, so
   roster tests (TC53 compares the manager's exact reports) stay unchanged.
6. **Make writing cases retry-safe.** CI retries twice. A case that changes its
   record first checks it is still in the seeded state and restores it if not
   (`ensureWeek` → `reseedWeek` in the Team actions spec), and removes what it
   adds in `finally`. Files whose tests share one account's records run
   `test.describe.configure({ mode: "serial" })` (`fullyParallel` is on).
7. **Wait for queued work by reloading.** Approvals, rejections and leave run as
   background jobs, and the CI replay never receives the realtime socket event
   that refreshes the grid. Poll with `expect.poll(async () => { reload; read })`
   rather than waiting on the open page.
8. **Never depend on today's weekday.** Use `dateInWeek(weeksAgo, "Mon")` and
   `weekLabel(weeksAgo)`; act on past weeks 1–4 back, and give seeded employees
   a holiday list you control. Four weeks back stays inside CI's 30-working-day
   backdate limit only when weekends are days off (`references/seeding.md`).
9. **Run it twice: staging, then CI.** A full staging run of the group with the
   real setup and teardown, then the `.local-ci` replay (or the PR's CI). Quote
   the numbers from one run. Confirm teardown left nothing (`Playwright-`
   employees, `TC<n>` projects).
10. **Close out.** Set the sheet rows to Automated with the TC number (a
    `test.skip` case is Deferred and keeps its TC number), format with CI's
    prettier, lint, and commit as `test(e2e): ...` (Conventional Commits).

## Running tests

```bash
npm run e2e:tests
```

For one or a few tests, call `npx` directly and single-quote the pattern — under
zsh, `npm run e2e:tests -- --grep "A|B"` loses the quotes and the shell splits on
`|`, which silently runs **zero** tests and reports everything skipped:

```bash
npx playwright test --config=tests/e2e/playwright.config.js --workers=1 --grep 'TC102:'
```

Use `--workers=1` when tests contend for shared records. The employee timesheet
specs share one employee and one week, so TC12/TC96 pass serially and race in
parallel. Locally `workers` defaults to CPU count; CI uses 7 with `maxFailures: 5`,
so a CI run can stop early and under-report.

Before reporting a group done, also run it the way CI does. Some machines keep a
local replay of the E2E workflow in `.local-ci/` (excluded from git; see its
README): it builds the same fresh site in Docker, uses the working tree's tests
and the last **commit**'s app code, and writes `results.json`, `test-results/`,
`run.log` and the server's `worker-*.log` to `.local-ci/out/`. Start it from a
fresh database each time (`docker compose down -v`).

Parse outcomes with the bundled script rather than eyeballing scrollback:

```bash
python3 .claude/skills/next-pms-e2e/scripts/results.py            # summary table
python3 .claude/skills/next-pms-e2e/scripts/results.py --errors   # + failure detail
```

## Probe the live app before changing a selector

This is the highest-leverage habit in this suite, because a full run costs ~10
minutes of seeding to tell you one selector was wrong, and the redesign changed
DOM structure — not just names, so guessing is usually wrong.

Instead, drive the real app with a cached session and inspect it directly:

```bash
node .claude/skills/next-pms-e2e/scripts/probe.mjs <snippet.mjs> \
  --role manager --url /next-pms/allocations/project [--block-writes]
```

The snippet gets a logged-in `page` plus dump helpers. Write the snippet to the
scratchpad, not the repo. See `scripts/probe.mjs` for the helper list and
`references/probing.md` for worked examples.

Rules when probing, because this is production-shaped staging data:

- Pass `--block-writes` unless you intend to create records. It aborts every
  POST/PUT/DELETE so you can click a submit button and observe validation without
  persisting anything.
- If you do create something, delete it and verify it's gone —
  `scripts/cleanup.mjs` handles the Frappe CSRF handshake that plain
  `DELETE /api/resource/...` fails on.
- **Never probe while a run is live**, yours or anyone's. The probe picks the
  newest cached state for the role, which can be a running worker's, and loading
  the app on an API session mints a CSRF token (the suite now recovers from it, and
  `probe.mjs` / `cleanup.mjs` use browser states only, but your own scripts must not).
  Check right before every probe batch, not once:
  `ps -axo pid,command | grep "playwright test --config" | grep -v -E "grep|/bin/zsh -c|test-server"`.
- To check a seeding helper without the full global setup, run a scratch
  Playwright config (`globalSetup`/`globalTeardown` unset, `testDir` in the
  scratchpad) whose one test imports the helper by absolute path (import
  `@playwright/test` from the repo's `node_modules` too) and calls it on a tiny
  stub, then cleans up what it made.

## Diagnosing a failure

Work up this ladder; each rung is more informative than the one above, and the
error text is usually the *least* useful signal.

1. **`results.py --errors`** — the assertion or locator that failed, and where.
2. **`test-results/<slug>/error-context.md`** — an accessibility-tree snapshot of
   the page at failure. Grep it for the control you expected. If it isn't there,
   the selector is wrong; if the whole page is wrong, navigation or auth failed.
3. **`test-results/<slug>/test-failed-1.png`** — the screenshot.
4. **`test-results/<slug>/trace.zip`** — the full action list. `unzip -o` it and
   read `*.trace` for the ordered actions and `*.network` for requests. This is
   how you tell "the click never happened" from "the click happened and the API
   was never called". Each `*.network` line is JSON; its
   `snapshot.response.content._sha1` (and `snapshot.request.postData._sha1`)
   names a file under `resources/` holding the body. Reading the API response
   the page rendered from (the member's `status`, `holidays`,
   `backdate_restricted_before`, a 500's traceback) usually settles "test, data
   or app?" in one step.

Read the failure mode, not just the message:

| Symptom | Usual cause |
|---|---|
| Broad, uniform failures across roles | stale `auth/*-w*.json` (see Orient #2) |
| `TimedOut` at exactly 30s, no location | a hung `waitFor`/`waitForResponse`, or `fill()` on a **disabled** field |
| `waitForResponse` never resolves | the request errored, or never fired; a `status() === 200` predicate ignores the 4xx/5xx that actually arrived |
| Element "not enabled" retried for 30s | the field is computed/disabled now — check before filling |
| 403 on an API call | often real app/env breakage, not test rot — verify the role's permissions before editing the test |
| Passes on staging, fails on CI only | a site difference, not flakiness — `references/environments.md` |
| "Partially approved" where a whole week was approved | the employee has no weekend days off, so the week counts 7 working days (`references/seeding.md`) |
| A click inside an older Team-tab week hangs to the test timeout | that week is collapsed (only the first four open) — open it with a Date range filter |
| Setup dies with `Duplicate entry 'TC<n> Project'` after `ECONNRESET` | a network reset on a POST the server had already applied; the retry duplicated it. Rerun |
| Setup dies with `CSRFTokenError` | a probe ran during a run, or an aborted run left seed data (`traps.md`) |
| App shows "Something went wrong — 'NoneType' object is not iterable" | intermittent Frappe v16 `redis_cache` race in `get_data`; backend, not the test (`environments.md`) |

## Conventions when writing or editing

**Specs.** Import the fixture, not Playwright:

```js
const { test, expect } = require("../../playwright.fixture.cjs");
```

`@playwright/test` bypasses the `authState`/`jsonDir` fixtures and the test will
run unauthenticated. Then: module-scope `/** @type {X} */ let page;` declarations,
env names read at module scope, `test.describe("<Role>: <Tab>")`, page objects
constructed in `beforeEach` followed by `goto()`, and `allure.story("<Tab>")` as
the first line of each test.

**Page objects.** Locators in the constructor, methods below, grouped by area with
a short comment banner. Prefer, in order: stable `id`, role + accessible name,
`getByLabel`, placeholder, then structural CSS as a last resort. Record *why* a
non-obvious locator is shaped that way — a bare `.first()` or a class selector
reads as arbitrary six months later, and the redesign will happen again.

**Data.** Add the TC block to the appropriate registered module. Convert relative
dates via `utils/dateUtils.js` rather than hardcoding.

**Shared page objects.** Pages that share a layout share a base class: the three
Timesheet tabs extend `pageObjects/timesheetTabPage.js` (weeks, cells, filters,
calendar, toasts, the Add time and Add time-off dialogs). Put a helper in the
base when a second tab needs it, rather than copying it into the tab's page
object.

**Comments.** Short: one line, a few per file at most, saying why, not what.
The reasoning belongs in the commit message.

**Formatting and lint.** The **Linters** workflow runs prettier and ESLint on
the files a PR changes, and `git commit` here runs no pre-commit hook, so run
them yourself on exactly the files you changed (prettier reformats whole files
and has twice buried a two-line fix in ~300 lines of noise):

```bash
npx --yes prettier@4.0.0-alpha.8 --write <changed files>
npx eslint --config eslint.config.js <changed files>
```

Under zsh, pass a list through an array (`F=(a.js b.js); npx eslint "${F[@]}"`):
an unquoted `$F` is one argument and the tool reports "no files matching".

## Verify before you report

The suite makes it easy to believe work landed when it didn't.

- **Confirm every write.** A scripted edit that prints success can leave the file
  untouched. `git diff --stat <file>` is the authority; a heredoc edit that
  reported success but never wrote cost a full verification cycle in one session.
- **Don't extrapolate from isolated passes.** Tests verified one at a time drift
  from a full-suite result — contention and the 30s ceiling take some back. A
  cumulative tally was 3 tests optimistic when finally measured. If you quote a
  number, say which run produced it.
- **Separate "test is wrong" from "app changed" from "data is missing".** Only the
  first is yours to fix by editing a test. When a test asserts against a feature
  the redesign removed, say so and ask whether to retire or repoint it —
  quietly rewriting the assertion to match new behavior destroys the coverage the
  test existed for. ~24 currently-failing tests are in this category.

## Reference files

Read these when the task touches them; they're too long and too volatile for the
main body.

- **`references/selectors.md`** — the post-redesign DOM contract: what replaced
  HTML tables, the query-builder filter, toasts, unnamed dialogs, the
  allocation grid/dialog/calendar and the Timesheet tabs (weeks, member rows,
  approval drawer). Read before touching any selector.
- **`references/seeding.md`** — fixture TCs, the week seeder's keys
  (`payloadCreateWeekEmployees`, `payloadWeekStatus`, ...), holiday lists and
  assignments, leaves, retry-safe writing cases, billing and task seeding rules,
  and what teardown must remove. Read before adding seed data.
- **`references/environments.md`** — staging vs CI vs the `.local-ci` replay:
  every difference that has turned a pass into a failure, and the backend
  defects that look like test failures.
- **`references/traps.md`** — numbered symptom → cause → fix list for the
  non-obvious failures, each one discovered the hard way.
- **`references/probing.md`** — worked probe snippets and the cleanup recipe.
- **`tests/e2e/README.md`** — the team's own framework doc: env setup, reporting,
  the test-case sheet, and the known-issues sheet. Authoritative for process;
  this skill covers the parts that only show up while debugging.
