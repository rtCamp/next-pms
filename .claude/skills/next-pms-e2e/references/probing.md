# Probing the live app

A full run costs ~5–7 minutes of seeding to tell you one selector was wrong.
Probing costs about a second, and it answers questions a test run cannot: what
the DOM actually contains, whether a field is disabled, whether a click produced
a request.

Run everything from the **repo root** — the scripts resolve Playwright and the
auth states relative to it.

## The loop

1. Write a snippet to the scratchpad (not the repo).
2. Run it with a cached session.
3. Read real values instead of guessing at selectors.

```bash
node .claude/skills/next-pms-e2e/scripts/probe.mjs /tmp/.../snippet.mjs \
  --role manager --url /next-pms/allocations/project --block-writes
```

Pass `--block-writes` unless you intend to create records. It aborts every
POST/PUT/DELETE and records them, so you can click a submit button and see
validation without persisting anything. This is shared staging data; a probe
that "just looks around" and leaves a record behind pollutes other tests.

## Snippet contract

Default-export an async function. Available in the argument object:

| Name | Purpose |
|---|---|
| `page`, `context` | the logged-in Playwright objects |
| `log` | console output |
| `dumpControls(scope, label)` | buttons / options / aria-labels in a scope |
| `dumpInputs(scope, label)` | every input with `disabled` + `readOnly` flags |
| `dumpMatching(pattern, label)` | anything whose label/title/text matches |
| `readToast()` | first non-CSS line of the toast region |
| `writes` | blocked write requests, with bodies |
| `baseURL` | resolved from `tests/e2e/.env` |

## Worked examples

### Is this field fillable?

The most valuable single question, because `fill()` on a disabled input retries
until the test times out with no useful error.

```js
export default async ({ page, dumpInputs }) => {
  await page.getByRole("button", { name: "Add allocation" }).first().click();
  await page.getByRole("dialog").waitFor({ state: "visible" });
  await dumpInputs(page.getByRole("dialog"), "add dialog");
};
```

Output shows `#total-hours` as `DISABLED` — so it is computed, and any code
filling it will hang.

### What can I actually click here?

```js
export default async ({ page, dumpControls }) => {
  await page.getByRole("button", { name: "Allocation summary" }).first().click();
  await page.waitForTimeout(1200);
  await dumpControls(page.locator("[data-radix-popper-content-wrapper]"), "chip popover");
};
```

### Does this affordance still exist?

Before declaring a feature removed, check hover and right-click too — a control
may only appear on interaction. Negative results are only trustworthy if you
looked in every plausible place.

```js
export default async ({ page, dumpMatching }) => {
  const chip = page.getByRole("button", { name: "Allocation summary" }).first();
  await chip.scrollIntoViewIfNeeded();
  await dumpMatching(/copy|duplicat|clipboard/i, "baseline");
  await chip.hover();
  await page.waitForTimeout(1200);
  await dumpMatching(/copy|duplicat|clipboard/i, "after hover");
  await chip.click({ button: "right" });
  await page.waitForTimeout(1200);
  await dumpMatching(/copy|duplicat|clipboard/i, "after right-click");
};
```

### Did the click actually submit, and what did the server say?

`--block-writes` captures the payload without persisting, which tells you whether
the form was valid and what it would have sent:

```js
export default async ({ page, log, writes, readToast }) => {
  // ... fill the dialog ...
  await page.getByRole("button", { name: "Allocate", exact: true }).click();
  await page.waitForTimeout(3000);
  log("attempted writes:", writes.length);
  log("toast:", await readToast());
};
```

An empty `writes` array means the form never submitted — look for a validation
message or a control left in an invalid state, not a broken endpoint.

To see the real server response (status + body), drop `--block-writes` and listen
instead. A rejected request (417) persists nothing, so this is safe when you
expect a rejection:

```js
export default async ({ page, log }) => {
  page.on("response", async (r) => {
    if (r.url().includes("handle_allocation")) {
      log(`STATUS ${r.status()} :: ${(await r.text().catch(() => "")).slice(0, 300)}`);
    }
  });
  // ... trigger the submit ...
};
```

### Timing a flow against the 30s ceiling

```js
export default async ({ page, log }) => {
  let t = Date.now();
  const lap = (label) => { log(`  ${String(Date.now() - t).padStart(6)}ms  ${label}`); t = Date.now(); };
  // ... steps, calling lap() after each ...
};
```

Use this before adding or removing waits. It is how the combobox padding was
shown to cost ~10s of the 30s budget for no benefit.

## A route-pattern trap worth repeating

`**/handle_allocation*` does **not** match
`/api/method/next_pms.resource_management.api.allocation.handle_allocation`.
`**/` expects a path separator, and the final segment only *ends* with the name.
A silently non-matching route let a real write through during a supposedly
read-only probe, and produced a wrong conclusion that the endpoint had been
renamed. Match with a predicate on the URL substring, or `**/*handle_allocation*`.

## Cleaning up

If a probe creates something, remove it and confirm removal.

```bash
node .claude/skills/next-pms-e2e/scripts/cleanup.mjs list \
  --doctype "Resource Allocation" \
  --filters '[["project","=","PROJ-7544"],["allocation_start_date","=","2026-09-07"]]'

node .claude/skills/next-pms-e2e/scripts/cleanup.mjs delete \
  --doctype "Resource Allocation" --name RA-EMP-00911-2026-0076
```

`list` first, always — filters are easy to get wrong, and there is no undo.
`delete` requires an explicit `--name` and verifies the record is gone. Frappe
enforces link constraints, so delete children first:
**time entry → task → project**, or it raises `LinkExistsError`.
