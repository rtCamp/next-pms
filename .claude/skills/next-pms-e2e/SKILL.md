---
name: next-pms-e2e
description: >
  Architecture map, conventions and failure playbook for the Playwright E2E suite
  at `tests/e2e/` in the next-pms repo. Load this before writing, fixing, running
  or triaging ANY test in that suite — including one-line selector fixes that look
  trivial — because the suite has non-obvious contracts that silently manufacture
  both phantom passes and phantom failures: test-ID-driven global seeding that
  ignores `--grep`, worker-scoped auth caching with no validity check, and
  `slowMo: 500` running against Playwright's default 30s timeout. Use it whenever
  the request mentions e2e or Playwright tests, a TC number (TC38, TC102, ...),
  files under `tests/e2e/**` (specs, pageObjects, helpers, utils/api, data),
  failing or flaky tests, selectors that broke after the UI redesign, test data
  seeding or auth state, `npm run e2e:tests`, `results.json`, or asks for a test
  change to be "consistent with the rest of the suite".
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

Four properties of this suite cause most wasted effort. Check them before forming
any theory about a failure.

**1. Seeding is global and ignores your filter.** `globalSetup` runs
`scripts/list-tests.js`, which AST-parses *every* spec file and extracts every
`TC<n>:` ID from test titles, then seeds data for all of them sequentially. This
happens on every run regardless of `--grep`, so a single-test run still costs
~5–7 minutes. Budget for it; don't assume you broke something because a run is slow.

**2. Auth state is cached with no validity check.** `playwright.fixture.cjs`
builds `auth/<role>-w<workerIndex>.json` only when the file is *absent*
(`fs.access` → catch). It never checks whether the session still works. Once those
sessions expire, every test silently lands on the login page and the whole suite
goes red for one reason that has nothing to do with any test. If failures are
broad and uniform, delete `tests/e2e/auth/*-w*.json` and re-run before debugging
anything else.

**3. `slowMo: 500` vs. a 30s default timeout.** `playwright.config.js` sets
`launchOptions.slowMo = 500` and does **not** override `timeout`, so every action
carries a half-second tax against a 30s per-test budget. A flow with ~20 actions
is already at 10s before any network. This is why adding `waitForTimeout` padding
to a page object can push a passing test over the edge — and why tests that pass
solo fail under parallel load. Prefer real waits (`waitFor`, `toBeVisible`) over
sleeps; they cost nothing when the app is fast.

**4. A green test is not proof.** Assertions here have historically passed for the
wrong reason. `isTimeEntryBillable()` checked `svg.count() >= 3` on cells that
contain zero svgs, so it always returned `false` — and four tests asserting
`false` were green while testing nothing. When you touch a helper that returns a
boolean, verify it returns `true` in the true case too.

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
| `helpers/*.js` | domain flows + all seeding logic |
| `utils/api/*.js` | API wrappers; `apiClient.js` holds shared auth + retry |
| `utils/{dateUtils,fileUtils,stringUtils}.js` | shared utilities |
| `data/<role>/<feature>.js` | test data, keyed by TC ID |
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
   merges in anything keyed `TC<n>` from the **four registered data modules**:

   ```
   data/employee/timesheet.js · data/manager/team.js
   data/manager/task.js       · data/manager/project.js
   ```

   A new data file is invisible until you add it to the `dataSources` map in
   `utils/fileUtils.js`. Keys from multiple modules deep-merge for the same TC.
3. Seeding then runs, in order, per TC: employees → time-entry updates → projects
   → tasks → allocations → time entries → hourly billing → leave → user groups.
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

Parse outcomes with the bundled script rather than eyeballing scrollback:

```bash
python3 .claude/skills/next-pms-e2e/scripts/results.py            # summary table
python3 .claude/skills/next-pms-e2e/scripts/results.py --errors   # + failure detail
```

## Probe the live app before changing a selector

This is the highest-leverage habit in this suite, because a full run costs ~5–7
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

Two rules when probing, because this is production-shaped staging data:

- Pass `--block-writes` unless you intend to create records. It aborts every
  POST/PUT/DELETE so you can click a submit button and observe validation without
  persisting anything.
- If you do create something, delete it and verify it's gone —
  `scripts/cleanup.mjs` handles the Frappe CSRF handshake that plain
  `DELETE /api/resource/...` fails on.

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
   was never called".

Read the failure mode, not just the message:

| Symptom | Usual cause |
|---|---|
| Broad, uniform failures across roles | stale `auth/*-w*.json` (see Orient #2) |
| `TimedOut` at exactly 30s, no location | a hung `waitFor`/`waitForResponse`, or `fill()` on a **disabled** field |
| `waitForResponse` never resolves | the request errored, or never fired; a `status() === 200` predicate ignores the 4xx/5xx that actually arrived |
| Element "not enabled" retried for 30s | the field is computed/disabled now — check before filling |
| 403 on an API call | often real app/env breakage, not test rot — verify the role's permissions before editing the test |

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

**Formatting.** Run prettier only on files you changed. It reformats whole files
and has twice buried a two-line fix in ~300 lines of noise.

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
  HTML tables, the query-builder filter, toasts, unnamed dialogs, and the
  allocation grid/dialog/calendar. Read before touching any selector.
- **`references/traps.md`** — numbered symptom → cause → fix list for the
  non-obvious failures, each one discovered the hard way.
- **`references/probing.md`** — worked probe snippets and the cleanup recipe.
- **`tests/e2e/README.md`** — the team's own framework doc: env setup, reporting,
  the test-case sheet, and the known-issues sheet. Authoritative for process;
  this skill covers the parts that only show up while debugging.
