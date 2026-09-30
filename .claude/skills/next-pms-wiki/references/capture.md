# Authenticated capture recipe (Frappe SPA)

The full recipe for capturing clean, un-annotated source PNGs of the Next PMS SPA, plus every gotcha learned building the wiki. Read this before your first capture. The capture driver is the **Chrome DevTools MCP** (plugin namespace `mcp__plugin_chrome-devtools-mcp_chrome-devtools__*`), driven from a subagent or the main thread.

## Table of contents

1. Verify browser access (hard gate)
2. Preflight (host prerequisites)
3. Session & authentication (Frappe login)
4. Capture technique — 1:1 pixels
5. Getting box coordinates off the live DOM
6. Where files can be written (the MCP temp-dir restriction)
7. Framing, gutters, crops, theme
8. State & data seeding
9. Roles & boot-flag gating
10. Flaky captures — timeouts, foregrounding & stuck states
11. Per-surface structure gotchas (scroll containers, rects, deep-links)

## 1. Verify browser access (hard gate)

The screenshot tools are deferred — load their schemas with ToolSearch before using them, e.g.:

```
ToolSearch("select:mcp__plugin_chrome-devtools-mcp_chrome-devtools__new_page,mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page,mcp__plugin_chrome-devtools-mcp_chrome-devtools__take_screenshot,mcp__plugin_chrome-devtools-mcp_chrome-devtools__take_snapshot,mcp__plugin_chrome-devtools-mcp_chrome-devtools__evaluate_script,mcp__plugin_chrome-devtools-mcp_chrome-devtools__resize_page,mcp__plugin_chrome-devtools-mcp_chrome-devtools__click,mcp__plugin_chrome-devtools-mcp_chrome-devtools__list_pages")
```

Then call `list_pages`. If the tools are unavailable or `list_pages` errors, STOP and report `MCP UNAVAILABLE` plus the error — do not fabricate captures. When a subagent hits this, it reports back and the main thread captures instead.

## 2. Preflight (host prerequisites)

All four must pass before opening a browser — a miss is a HALT, not a workaround:

- **chrome-devtools MCP flags** — it must launch with `--headless --isolated --chromeArg=--no-sandbox`. This is a root container with no DISPLAY; the argless default is headed + sandboxed and dies with `Target closed`. The fix is in the plugin's `.claude-plugin/plugin.json`, then reload the plugin.
- **Pillow** — `python3 -c "import PIL"`. This host's `python3` has **no pip** (`python3 -m pip` reports "No module named pip"), so install with `apt-get install -y python3-pil` as root. Verified Pillow 12.1.1.
- **Bold TTF** — `annotate.py`'s default `Ubuntu-B.ttf` is absent; `export ANNOTATE_FONT=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf`.
- **Logins + site** — `https://erp-stage.rt.gw` reachable; `cred.txt` present with PM and Employee credentials.

## 3. Session & authentication (Frappe login)

There is no wp-cli — authenticate by driving the login form, not by minting cookies:

1. `new_page` at `https://erp-stage.rt.gw/login?redirect-to=<target-route>` (e.g. `.../login?redirect-to=/next-pms/timesheet/team`).
2. If you land on the app already (the isolated profile persists cookies across tabs), you are authenticated — skip to capture. A fresh `new_page` in the shared headless Chrome usually inherits the PM login, so subagents rarely need to log in.
3. If you land on `/login`: it is the standard Frappe form — an **Email** textbox, a **Password** textbox, a **Continue** button (plus Google / Office 365 / email-link options — ignore them). Fill Email + Password from `cred.txt`, click **Continue**.
4. Use **your** page's id for every call. Don't touch other pages. **Don't log out** during a PM capture phase — it breaks the shared session for every other page (the sole exception is a deliberate role switch, below).

`navigate_page` takes `{type: 'url', url: '...'}`.

**Two roles, and how to switch.** The **PM** account (its login is in `cred.txt`; for privacy-safe captures use the seeded fictional PM instead) sees the full sidebar and can capture almost everything. The **Employee** account (also in `cred.txt`, or a seeded fictional employee) sees the minimal sidebar — capture it for the role-contrast views (Personal Timesheet minimal nav, Tasks employee-scoped list, read-only Allocations). Switching to Employee is a logout/login that changes the shared session, so do PM captures first, then re-login as Employee for the minimal-role variants — never interleave the two. Run the Employee pass **solo** (no concurrent PM subagents), then restore the PM session at the end. Employee minimal sidebar = Search · Timesheet (a single link, no Personal/Team/Projects split) · Tasks · Allocations (Team / Projects) · Collapse — no Notifications, Projects, Dashboards, or Team/Project timesheet. The Employee account has a linked Employee record (so no Access-Restricted page).

**How to log out** (for a role switch, the only time you log out): use the **account / header menu → Logout**. Do **not** hit `/api/method/logout` directly — it is CSRF-blocked and does **not** clear the session, so the next login silently reuses the old role. Within a PM capture phase, never log out — it breaks the shared session for every other page.

Never type or store the password anywhere persisted; read it from `cred.txt` at capture time only.

## 4. Capture technique — 1:1 pixels (VALIDATED)

- **Set a fixed viewport once:** `resize_page` to **1440×900**. Reported `devicePixelRatio == 1`, so the PNG is exactly 1440×900 and **CSS pixels == PNG pixels (1:1)**. This is the whole trick — it is what makes DOM rects usable as box coords directly.
- For each surface (page overview, each modal / expanded state): trigger the state first if needed (`.click()` a button by its text via `evaluate_script`, or MCP `click` with a uid from `take_snapshot`), let it settle, then `take_screenshot`.
- Capture the state the legend describes. A collapsed accordion or an un-opened modal cannot show a control that only exists when open — expand/open first, for every such surface, not only the first.
- **Wide tables:** shoot list/table pages that overflow 1440 at **1600×900** (still dpr=1, still 1:1). But **even 1600 does not fit everything** — the Projects list has 14 columns whose later ones sit at x≥1650, and the Tasks per-row 3-dot "Task actions" menu lands at x≈1468 (scrollWidth 1440, no reflow). Box the in-frame columns/controls and describe the off-screen ones in the "What you can do" table; going wider makes the PNG unwieldy.
- **`resize_page` sets the CSS viewport but the screenshot RASTER is capped at the physical window:** requesting 1440×**1450** yielded a **1600×900** PNG, not a tall image. So capture at 1440×900 (or 1600×900 for wide) and reach tall content by scrolling + capturing frames (variants) — never request a giant window.

## 5. Getting box coordinates off the live DOM

Box coordinates come from the live DOM, never from eyeballing. In **one** `evaluate_script` per surface, return the rounded `getBoundingClientRect()` as `[left, top, right, bottom]` for each control you will box. Because dpr=1 at 1440×900, those integers are the `annotate.py` box coords verbatim — pixel-perfect, no measuring in an image editor. Grab all of a surface's rects in one evaluate call so they are internally consistent.

Gotchas from real surfaces:

- **Side-by-side modal fields** (e.g. `Date | Duration`, `From | To`) need **column boxes**, not one full-width band — box each field's own rect.
- **Thin toggle/tab strips** (~18px tall) need a small circle: set `"cr": 10` on that box so the numbered badge fits inside.

## 6. Where files can be written (the MCP temp-dir restriction)

`take_screenshot` can **only write under the OS temp dir** — an MCP "roots" restriction; stderr says so. So:

1. Capture into a scratch dir under `/tmp/...` (the session scratchpad works).
2. `cp` each temp PNG into the durable build tree (`<build-root>/clean-sources/`) with **Bash** — Bash and python can write anywhere; only the MCP is restricted.

(An alternative is relaunching the MCP with `--allow-unrestricted-paths`, but that means editing `plugin.json` + a reload — gated and not worth it. Use the `cp`.)

## 7. Framing, gutters, crops, theme

- **Left gutter is free on full-viewport shots:** the app sidebar occupies x≈0–240, so content starts ~250 and nothing sits flush at x=0. Element/modal crops still need the gutter checked — nothing (glyph, control, or box border) should touch x=0, since a flush-left edge reads as clipped and is a QA fail.
- **Crop conventions:** full page = full 1440×900 viewport (sidebar + content, shows context); content-only = crop out the sidebar when the nav isn't the subject; widget/card and modal = element-crop to the wrapper/dialog; thin strip (tab bar, breadcrumb) = keep the strip, shrink the badge (`cr`/`font_size`). Keep a feature's related shots at one consistent size.
- **Theme: light only, with exactly one dark-mode example** on the *Navigation & Layout* page next to the "Toggle Theme" control. Every other page is light.

## 8. State & data seeding

**Privacy gate first.** If the capture site holds real data, you may NOT shoot a view until it shows only fake data — either a clean instance or a seeded fake-data family verified as isolated. Do the data-scoping recon and seed BEFORE capture: `references/privacy.md` (the rule + scrub list), `references/data-scoping.md` (per-view isolation class), `references/seeding.md` (seed a coherent family + teardown). Capture assumes that gate has passed.

Per page decide the state and, where needed, seed then restore:

- **Populated** states for list/table/dashboard pages.
- **Empty** states for the "Behaviour & states" section (a fresh week, an empty tab).
- **Flow** states: approval (Not submitted → Submitted → Partially approved → Resubmit), over-allocation warning, add-modal open.
- Seeds that mutate shared data (creating a risk, submitting a timesheet) must be **reverted after capture** and the change confirmed undone — the wiki must not leave test artifacts behind. Every seeded record is logged to a teardown manifest as it is created (see `references/seeding.md`).
- **Re-capturing on NEW data shifts layouts** — different row counts, longer names, and new records move controls, so a box config tuned against the old shot will be off. Re-grab `getBoundingClientRect()` and re-tune the box coordinates per re-shot surface; do not reuse the prior shot's coords blind.

## 9. Roles & boot-flag gating

Beyond route-role gating, two layers affect what a screenshot can even show:

- **In-page write-action gating.** A page may be viewable by all but its write actions role-gated: Allocations "Add allocation" / "Edit" need Projects Manager or Projects User; the extra Team-allocation filters (Designation / Duration / Allocation type) show only for those roles; Risks "Create" needs Projects/Delivery Manager or Delivery User. Capture both the read-only and the write-enabled variant where they differ.
- **Boot-flag / project-field gating.** Feedback, RAG stats, Reports, Repository Connections, Business Unit / Industry filters, calendar-event import, weekend entries, and Add-time-off only appear when the corresponding `window.frappe.boot` flag / project field / permission is on.

**Live staging flags (read 2026-09-08, PM session):** `has_customer_feedback`, `show_rag_trigger_page`, `has_repository_connections`, `has_todo_custom_fields`, `has_business_unit`, `has_industry`, `allow_weekend_entries` = **true**; **`is_calendar_setup` = false**. So the Add-time "Add calendar events" import cannot be captured on this site — document it as config-gated text (requires Google Calendar setup), not a screenshot. All other config-gated surfaces are live and capturable.

**Staging PM roles (read live):** the PM test account holds `Delivery Manager, Projects Manager, Timesheet Manager, Projects User, Employee` — **over-provisioned vs. a real PM**, who does NOT hold a Delivery role. Consequence: capture of the Leadership dashboard is unblocked (the account can reach it), but the *Roles & Access* and Leadership pages must document Leadership as **Delivery Manager/User only, not visible to a plain PM** — document the intended role model, not this account's inflated roles. Employee-login shots give the true minimal-role view.

## 10. Flaky captures — timeouts, foregrounding & stuck states

`take_screenshot` on this headless Chrome intermittently returns `Page.captureScreenshot timed out`. The fixes, in the order to reach for them:

- **Foreground your page first — the single best fix for concurrent captures.** `select_page(<your-page-id>, bringToFront: true)` immediately before every `take_screenshot`. Chrome only rasterizes the foregrounded tab reliably, so when a sibling subagent holds the foreground your capture stalls. Bringing your own page to front first clears the concurrent-foreground timeout.
- **Kill animation for animated / caret / drag-drop views.** Views whose compositor never idles (the Projects **Kanban** board, a modal with a blinking text caret) time out indefinitely. `evaluate_script`-inject `* { animation: none !important; transition: none !important; }`, and if it still stalls also blur the focused input: `document.activeElement && document.activeElement.blur()` (a blinking caret keeps the compositor busy). For an animated route, reload it first, then inject, then capture — reliable. (The Project-Allocations Add-allocation modal needed both the CSS and the blur.)
- **Plain retry.** A stalled `take_screenshot` usually succeeds on a simple re-issue; pace concurrent browser subagents ~45s apart.
- **Reset a stuck popover/overlay by re-navigating the route** — one that won't dismiss via synthetic events clears with a fresh `navigate_page` (optionally with a query param, e.g. `?approval=approval-pending`, `?tab=risks`). Setting state via URL query reaches a state deterministically without fighting the UI.
- **`evaluate_script` stays reliable even while screenshots stall** — so grab every rect up front in one call, then capture; a screenshot retry never invalidates the rects.
- **The live site can go into maintenance (HTTP 503) mid-run.** A shared staging/production site is redeployed without warning; navigations then return a 503 maintenance page and every capture fails. Don't burn retries against it — poll for recovery and resume: a background poll (e.g. a `Monitor` until-loop, or a background Bash `curl` loop that re-invokes when the site returns 200) that wakes the run when the site is back. Confirm a real page loads (not the maintenance page) before resuming captures.

Concurrency note: capture runs on a **single shared browser session** (one cookie jar = one logged-in identity), so it is effectively **serial per login** — you cannot be two users at once. See `references/orchestration.md` for the full concurrency model.

## 11. Per-surface structure gotchas (scroll containers, rects, deep-links)

The SPA's DOM has traps that break the naive "grab a rect, scroll the window, box it" flow. Learned per-surface:

- **The scroll container VARIES per page — find the real one.** These pages do NOT scroll the document; they scroll an inner container, so `window.scroll` does nothing. Manager dashboard scrolls inside `section.grid.grid-cols-12`; Leadership dashboard scrolls inside `div.flex-1.min-h-0.overflow-y-auto` (its `section.grid` has `scrollHeight == clientHeight`); Project-Detail content scrolls inside `.px-5.py-4.overflow-auto`, and its About rail inside `.overflow-scroll`. Locate the actual overflow element by testing `scrollHeight > clientHeight`, then set `el.scrollTop` to reach lower widgets — don't assume. The greeting ("Hey, {name}") sits above the grid and stays fixed while the grid scrolls.
- **A `getBoundingClientRect` can exceed the VISIBLE clip.** A `flex gap-4` field pair inside a modal, or a rail item, can report a rect past its card's visible edge (Calendar Create: the Completion-date field's rect read x=1052 but was visually clipped at ~916). **Box the visible extent, not the raw DOM rect**, whenever a container overflows its card.
- **Give tight control bounds — the engine pads outward.** `annotate.py` insets every box outward by `ANNOTATE_PAD` (default 6px, env- or per-box `pad`-overridable) so a border never clips the control's own text. Do NOT pre-pad coords yourself. This matters most for boxes that wrap a *label + field* group: on the raw bounds the top border clipped the label; the outward pad fixes it. If a border still touches a glyph, raise that box's `pad`; if two tightly-stacked padded boxes overlap, lower the tighter box's `pad` (e.g. `pad: 2`). Check this on every annotated image — a border sitting on a glyph is a defect, like a flush-left edge.
- **Snapshot uids renumber when a dropdown / modal opens.** A uid from `take_snapshot` taken before opening a menu is stale after it opens. Read control rects via `document.querySelectorAll` in `evaluate_script`, not via cached snapshot uids.
- **The global-search listbox reads empty in `take_snapshot`** right after opening, but it renders default quick-nav items on screen — grab those option rects via `evaluate_script`, not the snapshot.
- **Project-Detail tabs deep-link via `?tab=…`** (`?tab=tracking`, `?tab=notes`, `?tab=to-do`, `?tab=risks`, …) — navigate directly instead of clicking the tab (deterministic). The `tab`/`risk` query params **persist** across tab clicks, so reset with a clean `?tab=<x>` navigation between captures. The **blank-note editor is a full-page route** (`/projects/PROJ-0200/notes/new`), not a modal, and it hides the About rail. Risk detail is likewise an inline view (`?tab=risks&risk=<id>`), not a modal.
- **The "About this project" right rail persists on EVERY Project-Detail tab** (x≈1139–1440); the active tab's content occupies **x≈260–1119**. Box the content column, not the rail (document the rail once, on the About surface). Far-right row-action kebabs can be clipped past the panel edge — cover those in prose.
- **Icon-only controls** ("Mark as closed", "Unpin note", "Mark all as read") have no text — find them by `aria-label` and give the box a small `cr` badge so it fits.
- **Quote labels per context.** The same control can differ between a table header ("Expected time" / "Due date") and its modal ("Expected Time" / "Due Date") — quote each exactly as it appears where it appears.
