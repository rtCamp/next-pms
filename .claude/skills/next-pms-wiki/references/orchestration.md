# Orchestration — monitor + subagent model

How to build many pages without blowing the main thread's context or corrupting shared files. Read this before running more than one page at a time. For a single page you can do the whole loop inline; the model below matters once you fan out.

## The monitor model

The main thread is the **monitor**: it owns the trackers and the shared state, and it delegates each page build to a subagent so its own context stays lean (no giant screenshots or DOM dumps accumulating). The split:

- **Main thread owns:** PROGRESS (which pages are done / in-flight / blocked), LEARNINGS (gotchas folded in from subagent reports), the IA / `_Sidebar.md` / `_Footer.md`, and any decision that spans pages. Subagents report findings back in **text only**; the main thread integrates them.
- **A subagent owns one page build** end to end: capture → annotate → author → self-check, then a text report. It never writes to PROGRESS or LEARNINGS (that is a write-race; see below) and never pastes screenshots or DOM into its report.

Confirmed: subagents CAN drive the chrome-devtools MCP — a general-purpose subagent that ToolSearch-loads the `mcp__plugin_chrome-devtools-mcp_chrome-devtools__*` tools captures fine, with boxes from live `getBoundingClientRect()`. If the MCP is unavailable to the subagent, it reports `MCP UNAVAILABLE` and the main thread captures for it.

A single page build (≈2 surfaces + author) took **~9 minutes** as one subagent — use that to size a run.

## What makes parallel builds safe (the write-race rules)

Parallelism is safe only because every write target is per-page:

- **Per-slug JSON configs** — `annotate/configs/<slug>.json`, one file per page. `python3 annotate.py <slug>` renders only that slug, reading only that slug's JSON. Never hand-edit `annotate.py` itself or another page's JSON.
- **Per-page markdown** — each page is its own `<Title>.md`.
- **Per-file screenshot `cp`** — each surface's clean PNG has a unique `<slug>-<variant>.png` name.

Because none of those are shared, parallel subagents never collide on a write. The shared files (PROGRESS, LEARNINGS, `_Sidebar.md`, `annotate.py`) are all main-thread-only, so there is nothing for two subagents to race on.

**Cross-links between parallel lanes: DICTATE the exact anchor heading text.** One-owner-per-file removes write races, but when page A (owned by one lane) links into page B (owned by another) via a `#anchor`, the link silently breaks if B's owner renames or rewords the heading. The main thread must decide the **canonical anchor heading text** for any cross-referenced section up front and hand the exact string to BOTH lanes — the lane that links to it and the lane that owns it — so the anchor resolves without a later reconciliation pass. Treat shared anchors as a contract the orchestrator sets, not something each lane invents.

## Concurrency: serial browser, wide-parallel everything else

Split work by whether it drives the browser:

- **RAM-heavy browser work (seed + capture) runs on a SINGLE shared session — keep it serial.** The chrome-devtools MCP has one cookie jar, so it is logged in as exactly one identity at a time — **you cannot be two users at once**, and capture is therefore serial per login. Two subagents *can* each open their own page/tab on that one session, and the write-race rules make it safe, but the shared headless Chrome is the throughput limit: at 3-way, `take_screenshot` frequently returns `Page.captureScreenshot timed out`; even 2-up slows a build markedly. The reliable default is **serial capture** — one browser worker at a time — with two capture defenses from `references/capture.md` §10: `select_page(<its-page-id>, bringToFront: true)` immediately before every `take_screenshot` (Chrome rasterizes only the foregrounded tab), and grabbing all rects up front via `evaluate_script` (which stays reliable while screenshots stall).
- **Text / authoring / QA are NOT RAM-heavy → fan out wide (up to ~20 lanes).** Per-page authoring, prose fixes, doc-QA, annotation-QA, and privacy-QA touch only per-page files, so many run in parallel with no browser and no write race. Do the non-screenshot work wide while the browser work proceeds serially.

**The browser session persists across subagents — hand off the open session, one driver at a time.** A `new_page` in the shared Chrome inherits the current login, so a later subagent picks up right where an earlier one left off (a logged-in Administrator seeding session, say). But **NEVER let two subagents drive the same session concurrently.** A maintenance-interrupted seeder that "resumed" while its replacement was already running collided with it and created duplicate records that had to be deleted. Ensure exactly one browser worker is active at any moment; when one is interrupted (e.g. by a site 503), confirm it has fully stopped before starting a replacement.

## The one serialization rule that always holds: role switching

A fresh `new_page` in the shared headless Chrome inherits the **PM** login (the isolated profile persists cookies across tabs), so PM-role subagents rarely need to log in and can run concurrently. But an **Employee-role** capture requires a logout/login that mutates the *shared* session — that would yank the login out from under any concurrent PM subagent. So:

- Run all PM captures first (they share the PM session safely).
- Schedule Employee-role captures **separately**, never concurrent with PM captures.
- If both roles are needed for one page (e.g. Personal Timesheet, Tasks), capture the PM variant in the PM phase and the Employee variant in the Employee phase, then the page author stitches both.

## Multi-tab pages: fragment assembly (Project Detail)

A page with many independent tabs (Project Detail: Overview, Calendar, Tracking, Risks, Notes, Email, ToDos + About) is too big for one subagent and would race if several subagents appended to one `.md`. Split it by tab, then let the **main thread assemble**:

- Each tab is its own subagent with its own config slug — `project-detail-<tab>` (e.g. `project-detail-tracking.json`) — and writes its authored section to its **own fragment file** `wiki/frags/project-detail-<tab>.md`, never to the final page. All tab subagents reuse the one shared demo project (`PROJ-0200`, Acme Corporation — data-rich: customer, 5 members, PM + Lead, populated budget/hours) so their shots are consistent.
- When every tab fragment is in, the **main thread concatenates them into the single `Project-Detail.md`** (one assembled page, tabs = sections — not one wiki page per tab). Concatenation on the main thread avoids the append race entirely. Keep `frags/` as a backup until final sign-off.

This is the general recipe for any oversized multi-section page: per-section slug + per-section fragment + main-thread concat, mirroring the per-slug/per-page/per-file rule above.

## Delegating a page build (the subagent brief)

Give each page-build subagent exactly what it needs and nothing that would leak the main thread's context. The `SUBAGENT-RECIPE` this skill is built from is the canonical brief; a delegation includes:

- The **route** to navigate (e.g. `https://erp-stage.rt.gw/next-pms/timesheet/team`) and the **login** (PM or Employee).
- The **surfaces** to capture (overview + each modal/expanded state) and the **legend targets** (verbatim controls to box) — pull these from `references/coverage.md`.
- The **acceptance criteria** for the page and the state to seed (and to revert).
- The instruction to write its box config to its **own** `configs/<slug>.json`, render only its slug, author its page markdown, and **report back in text** (page path, each surface + its box count, verbatim labels used, any gotcha, anything blocked) — and to NOT touch PROGRESS/LEARNINGS.

The main thread then ticks PROGRESS, folds gotchas into LEARNINGS, and (separately) runs the ≥2 independent QA rounds with fresh blind reviewers before the page is called done.
