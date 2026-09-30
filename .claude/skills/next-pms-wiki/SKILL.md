---
name: next-pms-wiki
description: "Privacy-safe Frappe documentation pipeline — build or refresh a role-aware, screenshot-driven user wiki for the Next PMS React SPA (mounted at /next-pms/), end to end and without leaking real data. Covers the full pipeline: recon each view's data-isolation class, seed a coherent fake-data 'family' so screenshots show no real client/staff/financial data, verify isolation by logging in as each fictional user, capture authenticated screenshots via the chrome-devtools MCP at 1440x900 dpr=1, annotate every control with numbered legends, author each page from a fixed six-section template, QA across independent rounds (a privacy scan is a blocking gate), and package a private preview. Use whenever documenting or refreshing the Next PMS wiki or a single SPA feature page, seeding fake demo data for privacy-safe Frappe screenshots, or scrubbing real client/staff/financial data out of Frappe documentation. Trigger on 'document/refresh the ... page for the next-pms wiki', 'add a wiki page for ...', 'seed fake data for screenshots', 'privacy-safe Frappe screenshots', 'scrub real data from the wiki', 'annotate the ... screen', or 'the Projects / Timesheet / Allocations / Dashboard page changed, update its wiki page' — even when the skill is not named. Next PMS wiki work only: not app code, not the WordPress fse-* skills, not general-purpose screenshotting."
allowed-tools: "Bash, Read, Write, Edit, Glob, Grep"
---

# Next PMS Wiki — a privacy-safe Frappe documentation pipeline

Build (or refresh) the [rtCamp/next-pms wiki](https://github.com/rtCamp/next-pms/wiki) — the user- and admin-facing manual for **v2 Next PMS**, the React SPA mounted at `/next-pms/`. Each page documents one feature area with annotated screenshots, captured live under a Project Manager and (where the view differs) an Employee login. The reader is an end user (an employee logging time, a PM running projects) or an admin configuring the app — never a developer, so no API / doctype / store internals ever land on a page.

This skill owns the whole loop for a page — and, when the capture site holds real data, the loop that makes those screenshots safe to publish. It is the Next PMS analogue of the two WordPress `fse-*` skills folded into one: red highlight boxes, numbered corner circles, legends that share one numbering with the boxes, ≥2 independent QA rounds, a repo-external clean-source archive. What it adds beyond the WordPress skills is a **privacy-safe pipeline in front of capture**: on a shared/production Frappe instance you cannot shoot a view until it shows only fake data, so recon → seed → verify-isolation come *before* capture, and a privacy scan gates publish.

The method and every decision behind it are proven — this skill packages a build that already ran end to end (a full wiki refresh plus a fake-data seed). Follow it; the WHYs are the reasons each step exists, so adapt intelligently when a page doesn't fit the mold rather than treating any line as a ritual.

## The pipeline at a glance

1. **Preflight** — verify the capture host before opening a browser. A missing prereq HALTS.
2. **Recon** — read the app's API/query code to classify each view's data-isolation class (USER-SCOPED / USER-PERMISSION / UI-FILTER / LEAKS-ALL) and choose a capture strategy per view. MANDATORY before touching a real-data site.
3. **Seed** — if the site holds real data, seed a coherent fictional "family" (people → customers → projects → tasks → timesheets → allocations → billing) that every documented view can render, logging every record for teardown.
4. **Verify isolation** — log in as each fictional user and confirm each view shows only family data, before any capture.
5. **Capture** clean, un-annotated source PNGs at **1440×900, dpr=1**, grabbing each control's `getBoundingClientRect()` off the live DOM.
6. **Annotate** each clean source from a **per-slug JSON** config with `scripts/annotate.py` — boxes + numbered circles.
7. **Author** each page from the fixed **six-section template**, legends sharing one numbering with the boxes.
8. **QA** across **≥2 independent blind rounds** — doc-QA, annotation-QA, and a **blocking privacy scan** — until zero substantive defects.
9. **Assemble & preview** — stitch the IA (`_Sidebar.md` / `_Footer.md`), then package a **private preview**. The public push is separate and sign-off-gated.

Stages 2–4 are skippable ONLY when the capture site is already a clean/empty instance with no real data. On a shared or production Frappe site they are mandatory — see the privacy principle next. Reference docs, loaded as needed:

- `references/privacy.md` — the privacy-first rule, the scrub list, and the blocking privacy scan. **Read before capturing on any real-data site.**
- `references/data-scoping.md` — the four isolation classes, the recon method, and the Frappe scoping traps. **Read before choosing a capture strategy.**
- `references/seeding.md` — seed a coherent fake-data family via the browser same-origin path, with the deployment-gotcha checklist and teardown manifest. **Read before seeding.**
- `references/capture.md` — the authenticated Frappe/SPA capture recipe and every gotcha. **Read before your first capture.**
- `references/page-template.md` — the six-section feature-page template + legend rules. **Read before authoring.**
- `references/coverage.md` — the page / route / role inventory, exclusions, and boot-flag gating.
- `references/orchestration.md` — the monitor + subagent model and the concurrency/parallel-safety rules. **Read before running more than one lane at a time.**
- `references/preview-publish.md` — private-preview packaging, the wiki-vs-repo link rewrite, and the public-push gate. **Read before packaging a preview.**

## Privacy-first — the principle that reshapes everything (read `references/privacy.md`)

**Never capture screenshots on a live-data site until the view is proven to show only fake data.** A screenshot is a permanent, publishable copy of whatever was on screen, so a real name, email, money figure, or record ID on screen is a leak the moment the page is shared. This is why the pipeline front-loads recon + seed + verify-isolation.

- A pre-publication review must **scrub** real client/company names, staff emails, real money/utilisation figures, invoice/SO/quotation IDs, employee rosters, and client briefs — from every image AND every caption.
- The one allowed exception pattern: a **verified support/security contact** (meant to be public). Verify it is genuine before keeping it.
- The fix for a leaked screenshot is **RE-CAPTURE on fake data — not blur or crop.** Blur/crop is unreliable and desynced from the annotation.

## Preflight — verify the host before any capture (a miss is a HALT)

These four exist because a mid-run failure wastes a login and a capture; catch them up front. A missing prereq is a STOP, not something to work around — emit the reason and halt.

1. **chrome-devtools MCP launches correctly.** It must run `--headless --isolated --chromeArg=--no-sandbox` (this is a root container with no DISPLAY). The argless default is headed + sandboxed and dies with `Target closed`. The fix lives in the plugin's `.claude-plugin/plugin.json`, then reload. Confirm by ToolSearch-loading the `mcp__plugin_chrome-devtools-mcp_chrome-devtools__*` tools and calling `list_pages` — if it errors, halt.
2. **Pillow importable** — `python3 -c "import PIL"`. If it fails, install with `apt-get install -y python3-pil` (root). Note: this host's `python3` has **no pip**, so `python3 -m pip install Pillow` fails — use apt.
3. **A bold TTF for the number glyphs.** `annotate.py`'s default `Ubuntu-B.ttf` is absent here; use `export ANNOTATE_FONT=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf`. Verify the file exists.
4. **Logins valid and the site reachable** — the capture site (e.g. `https://erp-stage.rt.gw`) up, `cred.txt` present with the needed logins. Seeding additionally needs an Administrator / System-Manager session (see Recon & Seed).

## Recon — classify each view's isolation before choosing a capture strategy (read `references/data-scoping.md`)

**Mandatory first step on any real-data site.** Read the app's API/query code (not the UI) to map each documented view into one isolation class, which decides how you capture it:

- **USER-SCOPED** — bound to the logged-in user → capture as a fictional user.
- **USER-PERMISSION** — honours a User Permission on a link field → add the permission, then verify (heed the blank-link bypass below).
- **UI-FILTER** — a filter in the view narrows it → apply the family filter before capturing.
- **LEAKS-ALL** — a site-wide aggregate with no lever → shoot on a clean instance or defer and document in prose.

Traps to encode as warnings (details in `references/data-scoping.md`): Frappe has **no company-based scoping** (a separate Company isolates nothing); a **User Permission on Customer does NOT hide blank-customer records** (Strict User Permissions closes this but is a risky site-wide change); **Tasks are bounded by readable Projects, not Customer**; **Timesheet Manager/User read timesheets with `ignore_permissions`** so Team/Project Timesheet see all timesheets regardless of permission (scope them with the UI filter); **dashboard aggregate widgets** (at-risk counts, members-without-allocation, utilisation heatmap, all Leadership KPIs) aggregate the whole site → need a clean instance. Practical shared-site rule: apply UI filters to scope list/team views to the demo family, and defer views whose leak can't be filtered.

## Seed — a coherent fake-data family (read `references/seeding.md`)

When the site holds real data, seed one fictional "family" that every view can render, then capture only that family.

- **Method:** seed via the **chrome-devtools MCP browser** using `evaluate_script` + `frappe.client.insert` while logged in as **Administrator**. Scripted curl/REST to a live PII site is blocked by the harness safety classifier; the browser's same-origin XHR path is the sanctioned route. **Do not attempt to bypass the classifier.**
- **ALWAYS live-meta-check each doctype** (`frappe.get_meta('<DT>').fields`) before seeding — the deployed schema lags the repo (fields present in code can be absent on the live site).
- **Roles to seed:** System Manager + HR Manager (+ Accounts for invoices). A plain Projects Manager cannot create Users/Employees/Customers/Sales Invoices.
- **Coherence:** seed people in a `reports_to` hierarchy → customers → projects → tasks → timesheets → allocations → billing, with numbers that add up; keep the deliberate edge cases (e.g. one unsubmitted timesheet); mark every record so it is greppable/filterable; log every created record to a teardown manifest (`DocType<TAB>name`) in reverse-dependency order.
- **Deployment gotchas** (full checklist in `references/seeding.md`): Customer needs `default_currency`; Employee needs `salary_currency` + CTC before any Timesheet inserts; Project `custom_currency` is `fetch_from` company currency (can't be overridden without switching company); a Timesheet may be single-project and capped at 24h/day (model a week as several single-day sheets, `to_time` same day); Timesheet Detail `description` is required; Activity Type names vary (verify one exists); a Sales Invoice needs a party account whose currency equals the invoice currency; project RAG status is set manually, not derived from Risks.
- **Isolation:** add User Permissions per (login-user × demo customer) — but heed the blank-customer caveat; then verify.

## Verify isolation — log in as each fictional user before capturing

For every view you plan to shoot, log in as the fictional user (or apply the family filter) and confirm on screen that only family data appears — including dropdowns, search, and recent lists, not just the main grid. Do this BEFORE capture. A view that still shows real data after seeding is either scoped wrong (revisit its isolation class) or LEAKS-ALL (defer it). Trusting the permission model on paper is how leaks reach the shot.

## Auth — Frappe browser login (not WordPress)

There is no wp-cli here. Authenticate by driving the login form: `new_page` at `/login?redirect-to=<target>`, fill the **Email** and **Password** textboxes (read the password from `cred.txt` at capture time — never persist it), click **Continue**. The session persists across navigations in the MCP's isolated profile, so a fresh `new_page` in the shared headless Chrome usually inherits the login without re-typing anything.

Roles get captured under different logins: a **PM/manager** (full sidebar) and an **Employee** (minimal sidebar), plus **Administrator** for seeding. Switching roles is a logout/login that changes the *shared* session, so schedule captures under one login separately from another — never concurrently. Full recipe (form fields, role switching, the "if you land on /login" fallback, logging out via the header menu) in `references/capture.md`.

## Capture — clean sources at 1:1 pixels (read `references/capture.md`)

The whole trick is a fixed viewport: `resize_page` to **1440×900**, where `devicePixelRatio == 1`, so the PNG is exactly 1440×900 and **CSS pixels equal PNG pixels**. That 1:1 mapping is what lets box coordinates come straight off the DOM instead of being eyeballed in an image editor.

For each surface (page overview, each modal or expanded state): trigger the state if needed (`.click()` via `evaluate_script`, or MCP `click` with a uid from `take_snapshot`), let it settle, then `take_screenshot`. In **one** `evaluate_script` per surface, return the rounded `getBoundingClientRect()` `[left, top, right, bottom]` for every control you will number — those integers ARE the annotate box coords, verbatim.

Constraints and defenses, all in `references/capture.md`:

- **`take_screenshot` can only write under the OS temp dir** (an MCP "roots" restriction). Capture into a scratch dir under `/tmp/...`, then `cp` the PNG into the durable build tree with Bash.
- **Suppress animations + blur the active element** before shooting animated/caret views, and `select_page(<id>, bringToFront: true)` before each shot — Chrome only rasterizes the foregrounded tab.
- **The live site can go into maintenance (HTTP 503) mid-run** — poll for recovery and resume rather than burning retries.
- **Re-capturing on NEW data shifts layouts** — re-grab rects and re-tune box coords per re-shot surface; do not reuse the old shot's coords.
- **The left gutter is free on full-viewport shots** — the app sidebar fills x≈0–240, so content never sits flush at x=0. Element/modal crops still need the gutter checked.

## Annotate — per-slug JSON + `scripts/annotate.py`

`scripts/annotate.py` (bundled, copy it verbatim — read its top docstring) draws highlight-red `#E00000` boxes with a numbered white-on-red corner circle, always regenerating from the pristine source so re-tuning coords never stacks boxes. **Box configs live in per-slug JSON files** under `annotate/configs/<slug>.json` — one file per page — which is what makes parallel builds safe: many subagents building different pages never touch a shared file, and `python3 annotate.py <slug>` renders only that slug. Never hand-edit `annotate.py` or another page's JSON.

Config shape (keyed by variant/surface):

```json
{
  "overview": {"stroke": 3, "radius": 8, "cr": 15, "font_size": 22,
    "boxes": [{"n": 1, "xy": [x0, y0, x1, y1], "corner": "tr"},
              {"n": 2, "xy": [x0, y0, x1, y1], "corner": "tl", "cr": 10}]}
}
```

`stroke=3, radius=8, cr=15, font_size=22` reads well for the SPA's ~28px-tall controls. **Thin strips** (tab/toggle rows ~18px tall) need `"cr": 10` on that box so the badge fits. Pick each box's `corner` (tl/tr/bl/br) to keep its circle off neighbours and the image edge; the script auto-clamps circles inside the border. The engine insets every box outward by `ANNOTATE_PAD` (default 6px, per-box `pad`-overridable) so a border never clips the control's own text — give it the TIGHT `getBoundingClientRect` bounds and do not pre-pad. Run:

```bash
cd <build-root>/annotate
export ANNOTATE_SHOTS=<build-root>/clean-sources        # <slug>-<variant>.png
export ANNOTATE_OUT=<build-root>/wiki/public            # -> <slug>/<slug>-<variant>.png
export ANNOTATE_FONT=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf
python3 annotate.py <slug>-<variant>
```

Because coords come from live rects at 1:1, boxes land pixel-perfect on the first render (verified 7/7 on the first surface). Read back ONE rendered PNG to spot-check placement; don't re-read them all — that's the annotation-QA round's job (see below), and re-reading every PNG bloats context over a long run.

## Author — the six-section template (read `references/page-template.md`)

Write `<build-root>/wiki/<Page-Title-With-Hyphens>.md` (GitHub-wiki filename = title with spaces → hyphens). Every page uses the same six sections in this fixed order — full template, table shapes, and rules in `references/page-template.md`:

```
# <Feature name>
## Introduction          — what it is, who uses it, when
## What you can do        — one ### per panel/section/modal; | Control | Description | tables; verbatim UI labels
## How to use             — numbered steps; final step is the primary action (Save / Submit / Publish)
## Behaviour & states     — empty states, loading, permission-gated variants, toasts
## Roles & permissions    — which roles see this; per-role differences (cite the role model)
## Screenshots            — one ### per surface: the image embed + a numbered legend
```

Non-negotiables, because they are what a reader relies on: **UI labels quoted verbatim from the live screen** (if a label differs from a source constant, the screen wins); legend item format `N. **<verbatim label>** — <description>.` where **every box number appears once in the legend and every legend number is drawn**; prose in **English**, no hard-wrapping (one physical line per paragraph/bullet); **no AI/tooling attribution anywhere**; no developer/API detail; the fictional demo family is the single source of truth for every example (see `references/seeding.md`).

## QA — ≥2 independent blind rounds + a blocking privacy scan (zero substantive defects)

An annotated shot is a factual claim: "box N encloses the control legend item N names." A wrong box teaches the wrong control, so the bar is zero defects. Run **at least two independent rounds** — a fresh reviewer each round who re-verifies from the clean source and the legend without seeing the prior round's notes or your config coords. The builder's own self-check does not count as a round. Three lenses, all against the live app + source constants:

- **Doc-QA** — every control/behaviour covered, every legend label verbatim, role notes correct, no dev/API leakage, page title matches the sidebar entry.
- **Annotation-QA** — each box tightly encloses exactly its named control, number↔legend holds both ways, no flush-left edge, no border clipping a glyph, badges legible. Judge by measuring against the clean source, not eyeballing.
- **Privacy-QA (BLOCKING gate)** — every image and every caption is free of real client names, staff emails, real money/utilisation figures, invoice/SO/quotation IDs, employee rosters, and client briefs (the one exception: a verified support/security contact). A single confirmed hit blocks the whole publish and triggers a **re-shoot** of that surface — never a blur or crop. See `references/privacy.md`.

Surface every finding with a severity (blocker / major / minor) rather than pre-filtering. Fix by re-tuning JSON coords and re-running `annotate.py` (regenerates from clean pixels), then re-verify until an independent pass finds nothing. Re-navigate the route and confirm the shot still matches current UI before shipping — the SPA changes fast.

## Assemble & preview — private preview, sign-off-gated publish (read `references/preview-publish.md`)

When every page passes QA: the main thread assembles the IA (`_Sidebar.md` / `_Footer.md`, retiring superseded legacy pages), then packages a **private preview** for review.

- A GitHub **wiki** uses **extensionless** intra-wiki links; a normal-repo **preview** needs those rewritten to add `.md` (preview-only) so they resolve in a file view — the `make_preview_pr.sh` packaging pattern in `references/preview-publish.md` does this deterministically.
- Review on a **private** preview repo. **Never push real-data screenshots to the public wiki** — they may go to the private preview for layout/annotation review only, flagged as pending re-capture, and must be re-shot on the fake-data family before any public publish.
- The public push is a separate, explicitly sign-off-gated step; never force-push a wiki. This skill's default deliverable is the built pages + private preview + clean-source archive, not a public push.

## Orchestration (when running more than one lane)

The **main thread owns the trackers** (PROGRESS / LEARNINGS) and the shared IA files, and delegates deliverable work to subagents, keeping its own context lean — subagents report back in text (never paste screenshots/DOM), main integrates. Per-slug JSON + per-page markdown + per-file screenshot `cp` means no shared-file writes. Two concurrency rules dominate (full model in `references/orchestration.md`):

- **Serial browser, wide-parallel everything else.** Seed + capture run on a **single shared session** (one cookie jar = one identity — you cannot be two users at once), so keep them **serial per login**; the session persists across subagents, but NEVER let two subagents drive it concurrently (a maintenance-interrupted seeder that resumed collided with its replacement and created duplicates). Text/authoring/QA are not RAM-heavy → fan out wide (up to ~20 lanes).
- **Cross-links between lanes need a dictated anchor.** When one page links into another via `#anchor`, the orchestrator fixes the canonical heading text up front and hands the exact string to both lanes so the link resolves.

An oversized multi-tab page (e.g. Project Detail) is split into per-tab fragments the main thread concatenates. Employee-role captures need a logout/login that mutates the shared session, so never run them concurrently with a PM/Administrator phase.

## Scope & exclusions

The full page / route / role inventory is in `references/coverage.md`. Two things that must hold on every page:

- **rtCamp-internal features are excluded from the public wiki.** **RAG stats** and **Reports** are confirmed out — no page, no screenshot, no sidebar entry, and suppress any cross-reference elsewhere. **Feedback** and **Repository Connections** are on hold pending the maintainer's full exclusion list; confirm before documenting. A tab-bar screenshot legitimately showing an excluded/held tab is fine — just don't AUTHOR a section for it.
- **The publish is sign-off-gated AND privacy-gated.** Prepare pages, screenshots, and Conventional-Commits commits; package a private preview; but push to the public wiki only on explicit sign-off AND after the privacy scan is green. Never force-push.

## Bundled files

- `scripts/annotate.py` — the Pillow annotation engine (copy of the build's, verbatim). Read its top docstring to configure a page; run it as in **Annotate** above.
- `references/privacy.md` — the privacy-first rule, scrub list, and blocking privacy scan. Read before capturing on any real-data site.
- `references/data-scoping.md` — the four isolation classes, the recon method, and the Frappe scoping traps. Read before choosing a capture strategy.
- `references/seeding.md` — seed a coherent fake-data family via the browser same-origin path; deployment-gotcha checklist + teardown manifest. Read before seeding.
- `references/capture.md` — the authenticated Frappe/SPA capture recipe + all gotchas. Read before your first capture.
- `references/page-template.md` — the six-section template + numbered-legend format. Read before authoring.
- `references/coverage.md` — the page/route/role inventory, exclusions, and boot-flag gating.
- `references/orchestration.md` — the monitor + subagent model and concurrency/parallel-safety rules. Read before a multi-lane run.
- `references/preview-publish.md` — private-preview packaging, the wiki-vs-repo link rewrite, and the public-push gate. Read before packaging a preview.
- `evals/evals.json` — realistic trigger prompts for testing the skill (assertions deferred).
```
