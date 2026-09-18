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

**A single-test run still takes 5–7 minutes.**
`globalSetup` AST-scans every spec and seeds every discovered TC ID regardless of
`--grep`. Working as designed.
→ Budget for it. When you only need to inspect the app, use `scripts/probe.mjs`
instead — it reuses a cached session and starts in about a second.

**Whole suite red, every role, failures look like login pages.**
`playwright.fixture.cjs` writes `auth/<role>-w<N>.json` only when the file is
missing and never validates it, so expired sessions are reused forever.
→ `rm -f tests/e2e/auth/*-w*.json` and re-run. This produced one entirely bogus
82-failure run. The underlying fixture still has no validity check.

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

**A test hovers at 24–28s and passes locally.**
It will flake under load.
→ Treat anything above ~20s as needing the padding removed, not the timeout
raised.

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

## Seed data

**Editing a test's seed payload changes nothing.**
Its keys are `infoPayload*`, which fail the anchored
`/^payloadCreateProject(\w*)$/` and are never seeded. The test consumes another
TC's records.
→ Find the block that actually seeds what the test reads. Confirm by grepping the
spec for which key it reads from the stub.

**A new data file is ignored.**
`populateJsonStubs` merges only from four hardcoded modules.
→ Register it in the `dataSources` map in `utils/fileUtils.js`.

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
→ Prefer `--role manager` for ad-hoc cleanup, or delete `auth/<role>-API.json`
afterwards so the fixture logs in fresh. Symptom to recognise: `frappe.auth.get_logged_user`
returns the right user (session valid) but every write returns `CSRFTokenError`.

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

**A failing test that isn't broken code.**
Roughly 24 currently-failing tests assert against features the redesign removed
(Columns picker, dropped project columns, Public/Private views, per-week
navigation, Combine Week Hours, absent filter fields).
→ These need a retire-or-repoint decision from the maintainer. Rewriting the
assertion to match the new behavior deletes the coverage the test existed for;
surface it instead.
