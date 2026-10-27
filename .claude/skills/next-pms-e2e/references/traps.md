# Traps

Symptom → cause → fix. Each entry cost real debugging time at least once. They're
grouped by what you'd be doing when you hit them.

## Contents

- [Running tests](#running-tests)
- [Timeouts and hangs](#timeouts-and-hangs)
- [Selectors](#selectors)
- [Seed data](#seed-data)
- [Editing files](#editing-files)
- [Probing the live app](#probing-the-live-app)
- [Reporting results](#reporting-results)

## Running tests

**A run reports everything skipped and 0 tests executed.**
`npm run e2e:tests -- --grep "TC1:|TC2:"` — under zsh the quotes are lost through
`npm run --`, and the shell splits on `|`. The pattern becomes garbage and nothing
matches, but the run still exits 0, so it looks like a pass.
→ Call `npx playwright test --config=tests/e2e/playwright.config.js --grep 'TC1:|TC2:'`
directly, with single quotes.

**A single-test run still takes 10+ minutes.**
`globalSetup` AST-scans every spec and seeds every discovered TC ID regardless of
`--grep`. Working as designed.
→ Budget for it. When you only need to inspect the app, use `scripts/probe.mjs`
instead — it reuses a cached session and starts in about a second.

**Whole suite red, every role, failures look like login pages.**
`playwright.fixture.cjs` writes `auth/<role>-w<N>.json` only when the file is
missing and never validates it, so expired sessions are reused forever.
→ `rm -f tests/e2e/auth/*-w*.json` and re-run. This produced one entirely bogus
82-failure run. The fixture now re-logs in when `sid` has expired
(`hasUsableSession`), but still cannot see a session the server has dropped.

**Tests pass alone, fail together.**
The employee timesheet specs share a single employee and week, so parallel workers
race for the same records. Locally `workers` defaults to CPU count.
→ `--workers=1` for those, and don't treat an isolated pass as proof.

**`results.py` dies with `JSONDecodeError: Expecting value`.**
Two different ways to get there, both about where the JSON ends up:
- Redirecting the run (`... --reporter=json > tests/e2e/results.json`) writes
  `globalSetup`'s progress logs into the file ahead of the JSON.
- `PLAYWRIGHT_JSON_OUTPUT_NAME=tests/e2e/results.json` resolves **relative to the
  config directory**, so it lands at `tests/e2e/tests/e2e/results.json` and the
  stale file at the expected path gets parsed instead.
→ Do neither. The config already declares `["json", { outputFile: "results.json" }]`,
which writes `tests/e2e/results.json` on its own — just run the test command and
then `results.py` with no arguments.

**A CI run reports fewer failures than exist.**
`maxFailures: 5` on CI stops the run early.
→ Read CI counts as a floor, not a total.

**Passes on staging, fails on CI every time.**
Not flakiness: the two sites differ in holidays, required fields, custom fields,
backdate limits and data volume.
→ Find the row in `environments.md`, then read the trace's API responses from
the CI artifacts before changing the test.

**Setup stops with `Duplicate entry 'TC<n> Project'` right after `ECONNRESET`.**
A connection reset on a create that the server had already applied; the retry
created it again.
→ Not your change. Check `curl <base>/api/method/ping`, let the teardown run,
confirm nothing is left, rerun.

**Setup dies with `CSRFTokenError` on the manager's API session.** (Now self-healing, see the next entry; the leftover-project part still applies.)
Seen after an aborted run left dozens of `TC<n> Project` records, and when a
probe loaded the app on a role while a run was live.
→ Delete the leftover seed projects with the suite's own helpers, never probe
during a run, rerun.

## Timeouts and hangs

**`TimedOut` at exactly 30s with no error location.**
Something is waiting forever. Three usual candidates, in order of likelihood:

1. `fill()` on a **disabled** input. Playwright waits for "visible, enabled and
   editable" and retries silently for the full budget. `#total-hours` is computed
   and disabled; the whole edit dialog can be disabled.
   → Gate with `if (await field.isEditable().catch(() => false))`.
2. `waitForResponse(url && status() === 200)` when the request returned 417/4xx.
   The predicate never matches, so it hangs instead of failing.
   → Match on the URL alone and assert the status afterward, or add a timeout.
3. A locator waiting for something that no longer renders — an allocation chip
   that was never created, a dialog that was closed by a stray `Escape`.

→ The trace tells these apart definitively: `*.trace` shows whether the click
happened, `*.network` shows whether the request fired. See `probing.md`.

**Adding waits to a page object broke a previously passing test.**
`slowMo: 500` plus the default 30s timeout leaves less headroom than it looks.
Three combobox picks with `waitForTimeout(1000)` + `waitForTimeout(500)` each cost
~4.5s of pure sleep; measured, the same flow completes in ~4.7s total using real
waits, versus ~15s with padding.
→ Wait for the thing you actually need (`option.waitFor({ state: "visible" })`,
then `state: "hidden"` after clicking). Sleeps cost the same whether the app is
fast or slow, and they accumulate straight into the timeout budget.

**A test hovers near its budget and passes locally.**
It will flake under load.
→ Remove the padding before raising the timeout. A flow that genuinely needs
longer (seeding a week back, a second browser context) sets its own
`test.setTimeout(...)`.

**A click on a member's review button in an older Team-tab week hangs to the
test timeout, with no error location.**
The Team tab lists 12 weeks but opens only the first four on CI; an older week's
header is collapsed and its region (with the member rows) does not exist yet.
The snapshot shows the header without `[expanded]`.
→ Open the tab on that week alone with a Date range in the URL
(`onlyWeek(weeksAgo)` in the Team actions spec), which also survives reloads.

**A status poll after an approval never changes.**
Decisions are queued, and the CI replay never receives the realtime event that
refreshes an open page.
→ Reload inside the poll: `expect.poll(async () => { await page.reload(); ... })`.

## Selectors

**A locator matches far more than expected.**
`getByRole("button", { name: "Add time" })` matched 106 elements — one per grid
row. `getByRole("link")` in a project list matched employee links too.
→ Scope to a container (`page.getByRole("banner")`, the named grid) or filter by
`href` prefix. Check counts while probing before trusting a `.first()`.

**A regex locator matches the logo.**
`/next/i` matched the "Next PMS" brand button, which made 15 tests look like
simple renames when only 3 were.
→ Anchor regexes (`^...$`) and verify the match count, not just that something
matched. A confident triage built on an unverified locator wastes more time than
no triage.

**Non-exact names swallow sibling controls.**
`{ name: "Delete" }` also matches `"Delete allocation"`; `{ name: "Save" }` also
matches `"Save Changes"`.
→ Use `exact: true` whenever a shorter label is a prefix of a longer one nearby.

**A click times out on a control that is visible and enabled.**
Every row in the allocations grids (team *and* project) is covered by a
full-size transparent `button.absolute.inset-0.z-10` that opens a details
dialog. It swallows the pointer event, so clicking the row's own chevron or name
never reaches it — the action just times out with no useful message.
→ `await locator.dispatchEvent("click")`. Prefer it over `click({ force: true })`,
which fires the overlay's handler too and leaves a dialog over whatever you were
about to assert on. Confirm with
`el.evaluate(e => document.elementFromPoint(...).className)` while probing.

**A "clear" helper succeeds and clears nothing.**
`clearFilterIcons = page.locator("div#filters:nth-child(2) svg")` — `div#filters`
was removed in the redesign, so the locator resolves 0, the `while` loop never
runs, and the helper returns without error. Every test relying on it silently
kept its filters.
→ A helper that loops over a possibly-empty locator needs an assertion that it
did something, or it degrades into a no-op the day the DOM moves.

**`getByText` silently doesn't match.**
It's case-sensitive, and toast text is split across nested elements.
→ Match the toast region, then the text; check casing against the app.

**A row locator picks up a second seeded record.**
Seeded names share prefixes (`Playwright- TmApprove…` and `Playwright-
TmApproved…`).
→ Match the full generated name followed by a space (`^\S+ <name> ` for a member
row: avatar initial, name, then the status), never a prefix.

**A second filter replaces the first.**
The Filter panel opens on a row whose Field may be preset and whose Value is
empty; reusing "the last row" overwrote a filled condition.
→ Decide on the **Value** (`openEmptyFilterRow` in `timesheetTabPage.js`): click
"Add filter" only when the last Value is filled. See `selectors.md`.

**An empty week's header doesn't match the week locator.**
A week with no time has no status or total after its label, so the button's name
is just "Jul 13 - 19, 2026".
→ Match the label followed by a space or the end: `^<label>(?: |$)`.

## Seed data

**Editing a test's seed payload changes nothing.**
Its keys are `infoPayload*`, which fail the anchored
`/^payloadCreateProject(\w*)$/` and are never seeded. The test consumes another
TC's records.
→ Find the block that actually seeds what the test reads. Confirm by grepping the
spec for which key it reads from the stub.

**A new data file is ignored, or its leftovers are never swept.**
`populateJsonStubs` merges only from the modules in its `dataSources` map, and
the orphan sweep reads its own list.
→ Register it in the `dataSources` map in `utils/fileUtils.js` **and** in the
spread inside `readAndCleanAllOrphanData` in `helpers/timesheetHelper.js`.

**A whole week was approved but the member reads "Partially approved".**
The week status needs every *working* day decided, and working days are 7 minus
the employee's holidays and leaves. On CI the company's holiday list is empty,
so Mon–Fri is 5 of 7. The same cause makes an Approved week's cells stay
clickable, and makes CI's 30-working-day backdate limit 30 calendar days (a
week four back then refuses to submit, and a test waiting for its review button
hangs).
→ Give the employees weekends off (`weekendsOff: true`, `payloadWeekendsOff`;
`seeding.md`). Read the member's `holidays` in the trace's
`get_team_timesheet_data` response to confirm: `[]` means none.

**Setting `Employee.holiday_list` changes nothing on CI.**
HRMS v16 resolves holidays only from a submitted Holiday List Assignment.
→ Use `assignHolidayList`, which submits the assignment and then sets the field
(the field change is what clears next_pms's one-hour `get_holidays` cache).

**"Leave Approver is mandatory" when seeding an employee or a leave (staging).**
→ Seed `leave_approver` (the manager's email) on both.

**"You are not allowed to access this Leave Application record because it is
linked to Employee".**
A manager may book leave only for their own reports.
→ Keep `managed` (reports to the manager) on the employee a time-off case uses.

**Setup fails at a project with "Tech Stack is required for billable projects."**
→ `createProject` adds a Tech Stack when the site has the Technology doctype; a
new create path must go through it (`seeding.md`).

**A seeded Total Sales Amount reads 0.**
Project.validate recomputes it from submitted Sales Orders, overwriting a PUT.
→ `payloadCreateSalesOrder<postfix>: { amount }`.

**A test's data is missing entirely.**
The title doesn't match `/TC(\d+):/` — most often a missing colon.
→ `test("TC42: ...")`, not `test("TC42 ...")`.

**Employee dropdown empty; "no assigned team members".**
DocShare gating, not a selector. → `payloadShareProject` (see `selectors.md`).

**A 403 on an API call.**
Twice this was genuine app/env breakage rather than test rot: the manager lacked
read permission on `Customer` (granting it turned two tests green), and employees
get 403 on individual `Project` reads.
→ Check the role's permissions before editing the test. Don't work around a real
permissions bug silently; say it's an env issue.

**Projects and tasks survive a run even though teardown ran.**
Not a teardown ordering bug and not leakage in the usual sense. Frappe's
`delete_doc` opens with
`frappe.db.get_value(doctype, name, for_update=True, wait=False)` — a
`SELECT ... FOR UPDATE` **NOWAIT**. Teardown fires the instant the tests stop,
while the app is still committing its own post-write hooks (project totals
recalculated from task changes), so the rows are locked and every delete fails
at once with a 500 carrying `QueryTimeoutError` / `Lock wait timeout exceeded`.
`cleanUpProjects` catches each one, logs it, and moves on.

Measured on one run: **21 of 25 project deletes and 25 task deletes failed**,
all lock failures. The lock clears within seconds, which is why the *next*
run's setup sweep removes them — so leftovers look like exactly one run's worth
of data and older runs appear clean. That masks the problem: it reads as
"eventually consistent by design" when it is really a retry that never happens.

→ Deletes now go through `deleteWithLockRetry` (`utils/api/apiClient.js`),
which retries only on `isRowLockError` with exponential backoff and rethrows
anything else (`LinkExistsError`, permissions) straight away. `cleanUpProjects`
prints a tally at the end instead of letting failures scroll past.

→ Also: `taskRequests.js`'s own `apiRequest` used to throw without the response
body, so every task failure read as a bare `500 INTERNAL SERVER ERROR` with no
cause. Frappe puts the real reason in the body — always include it.

**The allocation dialog answers "No results found" for an employee that exists.**
The dialog's Employee and Project lists **scope each other**: choose a project
and the Employee list narrows to that project's assigned members (20 → 4);
choose an employee first and the Project list narrows to theirs. Members are
resolved from **DocShare**, so a freshly seeded project has none until
`payloadShareProject` runs.

The trap is a share that names a *different* employee than the one the test
allocates. TC103 shared with `EMP3_EMAIL` (Test Employee) while allocating
`EMP_NAME` (Renish Employee), and the dialog correctly refused — it looked like
selector rot and was a one-word data mismatch. Its five sibling tests
(TC104/107/109/110/111) all had both pointing at Test Employee, which is why
only TC103 failed.

→ When an allocation test can't select its employee, diff `employee` against
`payloadShareProject[].user` in `data/manager/team.js` before touching any
locator. Reordering the dialog fields does **not** help: it just moves the
scoping onto the other field.

## Editing files

**A scripted edit reports success but the file is unchanged.**
A python heredoc printed its success message while writing nothing — `git diff`
was clean and the mtime unchanged. A full verification cycle then tested nothing.
→ After any scripted edit, confirm with `git diff --stat <file>` and a `grep` for
the new content. Prefer the Edit tool for precise multi-line JS changes.

**A two-line fix shows up as a 300-line diff.**
Prettier reformatted the whole file.
→ Run prettier only on files you changed, and check `git diff --stat` before
handing off. Reverting needs `git checkout -- <file>`.

## Probing the live app

**A `page.route` pattern doesn't intercept.**
`**/handle_allocation*` does **not** match
`/api/method/next_pms.resource_management.api.allocation.handle_allocation` —
`**/` expects a path separator, and the final path segment merely *ends* with
`handle_allocation`.
→ Use a substring test on the URL in a predicate, or `**/*handle_allocation*`.
This mistake let a real write through during a "read-only" probe and produced a
stray record, and it also caused a wrong conclusion that the endpoint had been
renamed.

**`ERR_MODULE_NOT_FOUND: playwright` in a standalone script.**
A script outside the repo can't resolve `node_modules`.
→ Use `scripts/probe.mjs`, which resolves Playwright from the repo root.

**A probe created data on staging.**
→ Delete it and verify. `scripts/cleanup.mjs` posts to `frappe.client.delete` with
a CSRF token lifted from `/app`. Always confirm the record is gone rather than
assuming the delete worked. **But see the next entry before pointing it at a role
the suite is about to use.**

**`CSRFTokenError` on every POST and DELETE for one role.**
The `auth/<role>-API.json` states come from `/api/method/login` and carry no
`csrf_token`, and Frappe skips CSRF validation for exactly that case - which is
why the suite's own writes work while sending no token. Fetching `/app` on one of
those sessions (what `cleanup.mjs delete` does, and what any desk page visit does)
mints a token onto the session server-side. From that moment every CSRF-less POST
and DELETE on it fails, so the next run's *seeding* breaks, not just deletes.
→ Fixed in the suite: `fetchWithRetry` (`utils/api/apiClient.js`) reads the token from
`/app` after a `CSRFTokenError` and retries the write once with `X-Frappe-CSRF-Token`
(it logs one warning when it does). `probe.mjs` and `cleanup.mjs` prefer a browser state
(`<role>-w<N>.json`), skip expired ones, and use `<role>-API.json` only as a last resort
with a warning. Never load `/app` with an API session while a run is live. Symptom if it ever recurs:
`frappe.auth.get_logged_user` returns the right user but every write returns `CSRFTokenError`.

**A seeded employee cannot be deleted: `LinkExistsError` on their approved leave.**
Approving a leave makes an Attendance record that keeps pointing at it after the leave is
cancelled, so neither the leave nor the employee can go. `employeeHelper` now deletes a
leave's Attendance (cancelling it first) before the leave.

**A delete "succeeded" but the record is still there.**
Frappe refuses to delete a document anything still links to (`LinkExistsError`),
and refuses a submitted one outright (`ValidationError: Submitted Record cannot be
deleted`). Every delete helper used to throw on these and every caller caught and
logged, so seeded employees and projects accumulated for weeks with nothing to show
for it.
→ `deleteDocument()` in `utils/api/apiClient.js` returns `{ deleted, reason }`;
clear the dependants first (cancel a submitted timesheet with `cancelDocument()`,
then delete it, then the employee) and report what survived.

**Tests land on the Sign In page and time out after 30s.**
The stored `sid` in `auth/<role>-w<N>.json` carries an `expires` about 12 hours out.
Playwright *drops an expired cookie while restoring a storageState*, so the context
keeps the session cookies (`user_id`, `full_name`, `system_user`, `user_lang`) and
loses only `sid`. The first navigation goes out as Guest, the SPA redirects to
`/login`, and every locator then times out - which reads as a selector bug. The
tell is in the trace: the first request lists cookies *without* `sid`, later ones
have one (Frappe issued a fresh Guest sid), and a `GET /login?redirect-to=...`
follows. Low worker indices are hit first because they are assigned first, so the
failures cluster at the top of each spec file and look like contention.
→ `hasUsableSession()` in `playwright.fixture.cjs` now checks the `sid` expiry and
re-logs in; before that the fixture only checked the file existed.
→ **Do not verify these with curl by pasting cookies out of the JSON** - that
ignores `expires` and the server happily accepts a session the browser refuses to
send, so every file looks healthy. Check `expires` in the file itself.

**`SessionStopped` on every session, across every role.**
Looks exactly like expired auth state, and the remedy for that (delete
`auth/*-w*.json`) is wrong here. Frappe returns `SessionStopped` with HTTP 503 for
*every* session while the site is in maintenance mode - `GET /` then renders
"The system is being updated". A deploy mid-run turns the whole suite red, and the
route cache it leaves behind can 500 `/next-pms/timesheet` afterwards
(`get_dynamic_web_pages() -> None`).
→ Check `curl -o /dev/null -w '%{http_code}' <base>/api/method/ping` before
touching auth. 200 means the sessions are fine and the failure is elsewhere.

**A `creation` filter deletes far more than it should.**
Frappe stamps `creation` in the *server's* timezone. A cutoff built from
`new Date().toISOString()` is UTC, so against an IST server the window opens 5.5
hours early - a sweep meant to cover one run reached back across the whole morning.
→ Never build a cutoff from the runner's clock. `writeRunMarker()` in
`timesheetHelper.js` creates one throwaway document and reads its `creation` back,
which is the server's clock in the server's own format.

**A Playwright API request sends an empty body.**
`APIRequestContext.fetch` takes `data`, not `postData` - it ignores `postData`
silently. `apiRequest()` gets away with carrying both only because its `...options`
spread passes the caller's `data` through; the `postData` line beside it is dead.
→ Use `data`. Symptom: the server complains about missing required arguments for a
call whose payload looks correct at the call site.

## Reporting results

**A cumulative tally drifts from reality.**
Counting per-test passes across many filtered runs overstated the total by 3,
because contention and the 30s ceiling take some back in a full run.
→ Quote numbers from a single full-suite run, and say which run they came from.

**A green test that tests nothing.**
See `isTimeEntryBillable` in `selectors.md`.
→ When a helper returns a boolean, exercise both branches before trusting it.

**Skipped tests in a run's summary.**
`test.skip` cases with a comment above them saying why (TC94: the User group
filter was removed; TC114: saving filters to a view was removed; TC192, TC127:
waiting on app fixes). They are not failures.
→ Quote the reason from the comment. In the coverage sheet a skipped case is
Deferred and keeps its TC number.

**A failing test that isn't broken code.**
Roughly 24 currently-failing tests assert against features the redesign removed
(Columns picker, dropped project columns, Public/Private views, per-week
navigation, Combine Week Hours, absent filter fields).
→ These need a retire-or-repoint decision from the maintainer. Rewriting the
assertion to match the new behavior deletes the coverage the test existed for;
surface it instead.
