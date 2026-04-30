---
name: next-pms-task
description: >
  Use this skill whenever the user invokes /next-pms-task with a GitHub issue
  or task URL (e.g. /next-pms-task https://github.com/rtCamp/next-pms/issues/1023).
  The skill drives the full next-pms task pipeline — fetch the issue, write the
  plan, post it as a Slack thread in #bots-ai-workflow-next-pms (channel
  C0AUXBY5WMB) using a webhook so messages appear under the
  Next-PMS-Task-AI-Bot identity (and notify the human reviewer), poll the thread
  via Slack MCP for the maintainer's decisions and the RESOLVED gating keyword,
  execute the implementation section-by-section gated on RESOLVED, open the PR
  with the project's stacked-PR + reviewer rules, then extract durable learnings
  from maintainer feedback to continuously improve project conventions. Loads
  and consults next-pms-conventions as part of its workflow. Trigger phrases:
  /next-pms-task, "run next-pms-task on", "kick off the task workflow for". This
  skill is project-scoped to apps/next_pms — do not use for other repos.
---

# next-pms-task

End-to-end automation for next-pms task tickets. Wraps the existing `apps/next_pms/CLAUDE.md` workflow (§1 plan → §2 section-by-section → §5 PR → §6 triage) and adds a Slack-thread feedback loop so the maintainer can steer the work asynchronously. After PR triage, automatically harvests durable conventions from maintainer replies and propagates them into CLAUDE.md, `next-pms-conventions`, and memory — creating a self-improving loop that reduces review corrections over time.

## Slash invocation

```
/next-pms-task <github-issue-url>
```

The argument must be a valid GitHub issue/task URL. Extract `<owner>`, `<repo>`, and `<n>` (issue number). If anything else is passed, ask the user for the URL once and stop. Do not guess.

## Preconditions to verify before starting

1. **Working directory** is `apps/next_pms` (or a child) — abort and tell the user otherwise.
2. **gh CLI authenticated** for `rtCamp/next-pms` — `gh auth status`. If not, ask the user to run `gh auth login`.
3. **`SLACK_WEBHOOK_URL` env var present** — webhook drives all outbound posts so they appear under the `Next-PMS-Task-AI-Bot` identity (separate from the user the MCP is signed into, which is the human reviewer). Verify: `bash -ic '[ -n "$SLACK_WEBHOOK_URL" ] && echo OK'`. The variable lives in `~/.bashrc`; never echo, log, or commit its value. If unset, ask the user to export it and stop.
4. **Slack MCP available** — at minimum `mcp__claude_ai_Slack__slack_read_thread` (polling) and `mcp__claude_ai_Slack__slack_read_channel` (grabbing parent ts after a webhook post). Sends do NOT go through MCP; if `slack_send_message` is loaded, ignore it. Load via ToolSearch if deferred.
5. **Browser MCP available** — at minimum `mcp__claude-in-chrome__tabs_context_mcp`, `..._navigate`, `..._read_page`, `..._read_console_messages`, `..._javascript_tool`. The maintainer's tab on `https://pms-temp.frappe.rt.gw/next-pms/...` should be reachable; if not, ask the maintainer to authenticate manually. Never attempt to enter credentials.

If any precondition fails, stop and surface the gap. Do **not** silently proceed.

## Slack delivery: webhook for sends, MCP for reads

Architecture: outbound posts go through `$SLACK_WEBHOOK_URL` so they land under a bot identity (`Next-PMS-Task-AI-Bot` with `:robot_face:`), which generates a Slack notification for the human reviewer (whose own user account is what the MCP is signed into — self-posts via MCP wouldn't notify them). Inbound polling stays on MCP because webhooks are send-only.

**Outbound — always use the helper script `scripts/slack_post.py`** in this skill folder. It hard-codes channel, username, and icon, takes care of JSON escaping, and fails loudly if `SLACK_WEBHOOK_URL` is not exported. Do **not** hand-roll a curl `--data` payload — the script exists to prevent forgetting `"channel": "#bots-ai-workflow-next-pms"`, which would silently route posts to the webhook's default `#test` channel.

```bash
# Top-level post (creates a new thread)
bash -ic 'export SLACK_WEBHOOK_URL && .claude/skills/next-pms-task/scripts/slack_post.py --text "📋 Plan for issue #<n> — <title> — replies in this thread."'

# Thread reply (most common — every plan chunk + status update goes here)
bash -ic 'export SLACK_WEBHOOK_URL && .claude/skills/next-pms-task/scripts/slack_post.py --thread-ts <parent_ts> --text "<message body>"'

# Long body via stdin (avoids shell-quoting the body)
bash -ic 'export SLACK_WEBHOOK_URL && .claude/skills/next-pms-task/scripts/slack_post.py --thread-ts <parent_ts>' <<'EOF'
1/7 — Issue summary

...
EOF
```

Notes:
- **Always wrap calls in `bash -ic 'export SLACK_WEBHOOK_URL && ...'`.** `~/.bashrc` defines `SLACK_WEBHOOK_URL` as a shell variable (no `export`), so a child Python process otherwise sees no env var. The `export` makes it inheritable.
- Script exit codes: `0` success (Slack returned `ok`), `1` Slack-side failure, `2` bad input or missing env. Treat non-zero as a halt — surface the stderr to the user.
- Webhook returns body `ok` on success — no `ts` returned. Capturing the parent ts uses MCP, see "Acquiring parent_ts" below.
- Never embed `$SLACK_WEBHOOK_URL`'s literal value in committed code, comments, or message content. The script reads from env at call time and never logs the URL.

**Inbound — polling only:**

```python
slack_read_thread(channel_id="C0AUXBY5WMB", message_ts=parent_ts)  # every 15 min
slack_read_channel(channel_id="C0AUXBY5WMB", limit=5)              # to find parent_ts after a fresh webhook post
```

Bot-identity for posts is `Next-PMS-Task-AI-Bot` (`bot_id=BF6973Y7N`). The "RESOLVED detection" bot-filter in this skill catches it via the generic `bot_id` rule, so no algorithm change is needed.

### Acquiring `parent_ts` — always start a fresh top-level thread

**Always post a fresh top-level message for the task. Do not reuse a maintainer-started thread, even if one already exists for the same issue.** The maintainer prefers one bot-led thread per task — it keeps the keyword-convention block, plan chunks, section-status updates, and final PR ping in a clean linear conversation that's easy to scroll. Reusing an older thread (e.g. one Ayush started to assign the workload) buries the structured plan under unrelated chatter and confuses the cadence.

Step-by-step:

```bash
# 1) Top-level webhook post (no --thread-ts) — keyword-convention block + "Plan in N messages below ⤵"
bash -ic 'export SLACK_WEBHOOK_URL && .claude/skills/next-pms-task/scripts/slack_post.py --text "📋 Plan for issue #<n> — <title> — replies in this thread."'

# 2) read_channel, capture the latest message authored by Next-PMS-Task-AI-Bot (the just-posted one is newest)
slack_read_channel(channel_id="C0AUXBY5WMB", limit=5)
```

Persist that `Message TS` as `parent_ts` for the rest of the workflow. If a maintainer-started thread for the same issue already exists, optionally post a one-liner there pointing at the new top-level (`↪︎ Moving the plan to a fresh thread — continuing there.`) so the maintainer knows where to look.

### Cron-driven gate polling — the `/next-pms-slack-poll` companion

Once `parent_ts` is captured (and at the start of every later approval gate), set up a recurring cron that fires `/next-pms-slack-poll <parent_ts> C0AUXBY5WMB` so the gate-poll cadence runs without re-entering this skill. The polling skill (project-scoped, lives at `.claude/skills/next-pms-slack-poll/SKILL.md`) is read-only — it reports gate state and self-cancels its cron on RESOLVED / BLOCK.

```python
CronCreate(
    cron="*/15 * * * *",
    prompt=f"/next-pms-slack-poll {parent_ts} C0AUXBY5WMB",
    recurring=True,
)
```

**Never wire the cron to fire `/next-pms-task <url>` itself.** That re-runs recon → plan → Slack on every tick, replans `plan_issue_<n>.md`, and dumps duplicate plan chunks into the thread. The polling skill exists specifically to avoid that footgun.

When the maintainer replies `RESOLVED`, the polling skill cancels its own cron and returns the locked decisions in its report. Resume from the current section directly — no re-entry of the parent skill is required (the conversation context already has the plan loaded).

### Batch mode is the default — per-section gates are opt-in

**After the plan-approval gate clears, default to batch mode.** Run S1..Sn sequentially (implement → rebuild → browser-check → next section) without re-arming the polling cron between sections, and post a single consolidated status to the thread once the PR is up and post-PR triage is done. Maintainer prefers this — fewer round-trips, less Slack noise, faster wall-clock.

Per-section RESOLVED gating is opt-in: if the maintainer's plan-approval reply explicitly asks for it (e.g. `RESOLVED. gate every section`, or any phrasing that signals they want to review each section), follow §5 step 5 verbatim instead. When in doubt, ask once in-thread before flipping modes.

When entering batch mode (the default), acknowledge in-thread once at the start: `Acknowledged ✅ — running S1..Sn in batch mode (default). Will ping here once the full feature is green and the PR is up.` That single ack tells the maintainer the gate cleared and what cadence to expect.

## End-to-end workflow

### 1. Recon (no Slack yet)

- `gh issue view <n> --repo <owner>/<repo> --json title,body,labels,assignees,state` to capture the ticket.
- Pre-implementation scan per `CLAUDE.md` "Pre-implementation scan" subsection (utilities, cva, design-system primitives, upstream PRs in flight, component granularity, file extensions, route completeness). Use `mcp__storybook__list-all-documentation` + `mcp__storybook__get-documentation` for component inventory and `mcp__figma__get_design_context` (always with `fileKey=h1EnhdK8swe6FCyxUW1XHx`, never the file root `0:1`) for the Figma frames the issue links.
- For Figma recon across more than 2-3 frames, spawn a `general-purpose` subagent with a tight brief asking for a structured summary — keeps screenshot dumps out of the main context.

### 2. Plan (filesystem)

- Save the plan as `plan_issue_<n>.md` in the working directory (`apps/next_pms/`) — already gitignored, never commit. The plan must contain everything CLAUDE.md §1 requires: issue summary, scope/out-of-scope, section breakdown (S1…Sn), routes/nav/store changes, component inventory (REUSE / NEW), data/API dependencies, AC mapping, test plan, and an explicit numbered list of **open decisions** with `[default: ...]` annotations for each so execution can proceed even without answers.

### 3. Slack thread

Channel: **`C0AUXBY5WMB`** (`#bots-ai-workflow-next-pms`). All posts via the webhook template in "Slack delivery" above.

**Resolve `parent_ts` first** — always post a fresh top-level message for the task per "Acquiring `parent_ts`" above (do not reuse a maintainer-started thread). Capture its ts via `slack_read_channel`. Then arm the polling cron per "Cron-driven gate polling" so the plan-approval gate runs without re-entering this skill.

**Top-level message** — one liner that names the keyword convention. Use exactly this template, substituting `<n>` and `<title>`:

```
📋 Plan for issue #<n> — <title> — replies in this thread.

Keywords (reply in-thread, plain text, case-insensitive):
• `RESOLVED` — gate has passed; I move on. I require this on the plan itself, after each decision-answer round, and after each implementation section.
• `BLOCK` — pause; I will stop and wait for your next message.
• Numbered decision answers (e.g. `2: Button iconLeft, 3: TextEditor editable=false`) — locked in.

I poll this thread every 15 min and only act on replies from non-bot users. Defaults are listed in square brackets; if you reply only `RESOLVED`, I take the defaults and proceed.
```

**Thread replies** — split the plan across multiple messages (Slack truncates above ~5 KB per message). Use the breakdown from existing precedent (issue summary + scope; figma recon; component inventory + file structure; section breakdown; open decisions; final next-steps note). Keep each message under ~3 KB. Always prefix with `<i>/<total>` so the maintainer can scroll. Each reply is a webhook POST with `thread_ts: <parent_ts>`.

Persist `parent_ts` and `channel_id="C0AUXBY5WMB"` in your working memory — every subsequent webhook POST, every MCP poll, and the cron prompt all reuse them.

### 4. Plan-approval gate

Poll the thread every **15 minutes** using `slack_read_thread`. Apply the canonical bot-filter and RESOLVED/BLOCK/decision-answer extraction defined in the "RESOLVED detection — exact algorithm" section below. Do not re-implement a separate filter here.

When `RESOLVED` is detected at the plan-approval gate, ack in-thread (`Acknowledged. Locked-in decisions: ... Starting S1.`) and proceed to step 5.

If 4 polls (1 hour) pass with no human reply, post a single nudge in the thread (`Still waiting on the plan-approval gate — defaults will be used if you reply RESOLVED only.`). Do not nudge more than once per gate.

### 5. Section-by-section execution

For each section S1…Sn from the plan:

1. **Implement** — write code per the plan + locked decisions. Reuse design-system / frappe-ui-react components; respect the project conventions skill (`next-pms-conventions`).
2. **Rebuild** — `fm shell pms-temp.frappe.rt.gw <<'EOF'` / `cd apps/next_pms/frontend && npm run build:app` / `EOF`. If the submodule SHA changed, run `pnpm --filter @rtcamp/frappe-ui-react build` first.
3. **Browser quality-gate** — navigate the existing authenticated tab to the relevant route, reload, run a JS assertion script that captures structural + style facts (heading text, classNames, computed sizes, presence of expected SVGs/icons), and read console messages with `onlyErrors=true`. Heavier or multi-route checks: spawn a `general-purpose` subagent.
4. **Post status to thread** — short reply with: section name, what changed (1–2 lines per file), build result, browser-gate result, and the verbatim line: `Reply RESOLVED to proceed to S<i+1>.` (or `… to open the PR.` for the last section).
5. **Wait for RESOLVED on this section** — *only when the maintainer has explicitly opted into per-section gating* at the plan-approval gate (see "Batch mode is the default" above). In that case re-arm the polling cron (`CronCreate(*/15 * * * *, /next-pms-slack-poll <parent_ts> C0AUXBY5WMB)`); the polling skill applies the canonical RESOLVED-detection algorithm and self-cancels its own cron on terminal state. `BLOCK` pauses; new feedback (e.g. "fix X first") is treated as scope; address it, post an updated status, re-arm the cron, then re-wait. Do **not** advance to the next section without an explicit `RESOLVED` from a non-bot user. The 1-hour single-nudge rule applies per gate. **In the default batch mode, skip steps 4–5 between sections entirely** — proceed straight from one section's browser-gate to the next section's implementation, and only post once at the end (consolidated status + PR link).

### 6. PR + post-PR triage

Once the last section is `RESOLVED`:

1. Stage and commit per CLAUDE.md (one logical commit, or 2-3 if there's a clean separation). Use `git mv` for renames.
2. Push to `claude/feat/<trunk>` (regular push if first push; force-with-lease only if you rebased history).
3. **Base** per CLAUDE.md §5: default `feat/redesign`. If the issue genuinely depends on another in-flight PR's branch, base on that branch and add a "Stacking note" paragraph to the PR body (rule #7).
4. `gh pr create --reviewer ayushnirwal` with the body template from existing precedent (Summary / Stacking note if applicable / Verification / Test plan).
5. Sleep 10 min; pull `gh pr view <pr> --json reviews,comments,statusCheckRollup`, `gh api repos/.../pulls/<pr>/comments`, `gh pr checks <pr>`. Triage per CLAUDE.md §6.
6. Post in the same Slack thread: `PR up: <url>. CI: <green|red+notes>. AI review: <state>.`
7. Final maintainer DM to Ayush (`U026K7B5VAA`, channel `D026S1T8ML2`) with a short summary + the PR link.

### 7. Continuous learning from thread feedback

Run this step after PR triage is complete (step 6 fully done — AI comments addressed, CI green). Goal: harvest durable project conventions from maintainer replies so future tasks need fewer correction rounds.

**7a. Re-read the full thread**

`slack_read_thread(channel=C0AUXBY5WMB, thread_ts=<saved_ts>)` — read all messages and apply the canonical bot-filter from the "RESOLVED detection — exact algorithm" section. Work only with the remaining human messages.

**7b. Scan for durable-rule signals**

For each non-bot reply, identify sentences that match these patterns — these are candidates for rules, not task decisions:

| Signal pattern | Examples |
|---|---|
| Correction / preference | "use X not Y", "should be X", "prefer X over Y", "always X", "never X" |
| Structural directive | "put X in ...", "rename to ...", "extract to ...", "files should ..." |
| Import / API fix | "import from X not Y", "component takes X not Y" |
| Implicit override | maintainer pushed a fix commit contradicting my implementation choice |
| Repeated `BLOCK` + explanation | reason reveals a convention gap |

**Skip task-specific decisions** — numbered answers like `2: iconLeft` or "use blue for this section" are scoped to this issue only.

**7c. Classify and deduplicate**

For each candidate rule, determine:

1. **Is it durable?** Would it apply to any future task in this repo? If yes, keep. If it only makes sense for this particular issue's data/design, skip.
2. **Is it already documented?** Grep `next-pms-conventions` SKILL.md for key phrases and check MEMORY.md index. If already captured, skip — do not add duplicates. CLAUDE.md no longer carries conventions inline (it points at this skill), so don't grep it for convention text.
3. **Best target:**
   - Concrete code convention (style, file structure, component API, import path) → `next-pms-conventions` SKILL.md (single source of truth)
   - Behavioral / workflow feedback about how I should approach work → `feedback_<topic>.md` memory entry
   - Project state that shapes future planning → `project_<topic>.md` memory entry

**7d. Apply additions**

Edit each target file with the Edit tool. Guidelines:

- **next-pms-conventions SKILL.md**: add to the most relevant section. One bullet per rule, max 2 sentences. No commentary about which issue it came from — file rationale belongs in the git commit message, not the file. This file is the canonical home for code conventions; do not also edit CLAUDE.md (CLAUDE.md is a pointer to this skill, not a parallel copy).
- **Memory file**: create `feedback_<topic>.md` (or `project_<topic>.md`) with the standard frontmatter + rule body (`**Why:**` + `**How to apply:**` lines). Add a pointer to MEMORY.md.
- **CLAUDE.md's pointer index**: only update CLAUDE.md if the new rule introduces an entirely new top-level *category* not yet listed in the bullet index under "Project conventions — see the `next-pms-conventions` skill". Adding a rule inside an existing category (Pre-implementation scan, Comment discipline, UI details, etc.) does **not** require a CLAUDE.md edit.

Do not add more than 5 new rules per task — if more candidates exist, pick the top 5 by impact (most likely to prevent a future correction round).

**7e. Commit doc updates**

Stage only doc/memory files (CLAUDE.md is rarely touched here — see 7d):

```bash
git add .claude/skills/next-pms-conventions/SKILL.md \
        .claude/skills/next-pms-task/SKILL.md
# Add CLAUDE.md only if 7d required a new top-level category in its pointer index.
git commit -m "doc(next-pms): record learnings from issue #<n>"
```

Memory files live outside the repo at `~/.claude/projects/<project-slug>/memory/` (Claude Code resolves the slug from the working directory) — they are saved via the Write tool and do not need to be staged.

Push the doc commit to the same feature branch so the maintainer can review the extracted rules alongside the implementation changes.

**7f. Report in thread**

Reply in the Slack thread (not a new top-level message):

```
🧠 Learnings extracted from this thread: <N> new rules added.
Updated: <list of files or "none — all rules already documented">.
These will reduce feedback on future tasks.
```

If zero durable rules were found, still post the reply with `N=0` — it confirms the step ran.

### 8. Cleanup

- Mark all tasks completed (TaskUpdate).
- Do not commit `plan_issue_<n>.md` (gitignore covers it; verify with `git status` before any commit).
- Leave the Slack thread open — thread resolution is the maintainer's call (do not auto-react with ✅).

## RESOLVED detection — exact algorithm

```
Step 1 — filter bot messages.
  A message is bot-authored if ANY of these are true:
    • message.subtype == "bot_message"
    • message.bot_id is present and non-empty
    • message.bot_profile is present
    • message.text ends with "*Sent using* @Claude"
  Discard all bot-authored messages. Work only with the remaining human messages.

Step 2 — accumulate decision answers (all human messages, newest-first).
  For each human message:
    if regex matches a numbered-decision pattern (^\d+:) → merge into locked_decisions

Step 3 — find the gate signal from the LATEST human message only.
  Take the single most-recent human message.
  if regex \bBLOCK\b matches (case-insensitive) → return "BLOCK"
  if regex \bRESOLVED\b matches (case-insensitive) → return "RESOLVED"
  fall through → return "WAITING"
```

Key invariants:
- `RESOLVED` must appear in the **latest** human message. An older `RESOLVED` buried under a newer decision answer does not advance the gate — the maintainer must re-send `RESOLVED` after answering decisions.
- Decision answers are accumulated from all human messages (not just the latest), so the maintainer can spread answers across multiple replies.
- `BLOCK` anywhere in the latest human message halts, even if it also contains `RESOLVED`.

Only `RESOLVED` in the latest human message advances. `BLOCK` in the latest human message halts. Decision answers update state but do not advance.

## Constraints + non-goals

- **Do not** auto-resolve threads on GitHub or auto-react with ✅ in Slack — the maintainer signals progress via the keyword in text.
- **Do not** loop more than 8 polls (≈ 2 hours) silently without surfacing to the user. After 4 polls without any reply, post the one-time nudge; if 4 more pass, stop and ask the user for guidance.
- **Do not** invoke this skill in a non-`apps/next_pms` working directory.
- **Do not** skip the plan file or the Slack thread, even for "small" changes.
- **Do not** force-push or destructive-git unless rebasing onto an advanced base.
- **Do not** post via Slack MCP `slack_send_message` — outbound goes through the webhook so messages appear under the bot identity (notifies the human reviewer). MCP is read-only for this skill.
- **Do not** omit `"channel": "#bots-ai-workflow-next-pms"` from the webhook payload — the webhook's default channel is `#test`, so a missing channel field silently sends posts to the wrong place.
- **Do not** echo or commit `$SLACK_WEBHOOK_URL`'s value (don't print it in shell debug, don't paste it in messages, don't write it to the skill / CLAUDE.md / memory). Always reference it as `$SLACK_WEBHOOK_URL` and source via `bash -ic` so `~/.bashrc` is loaded.
- The skill assumes the `next-pms-conventions` skill is loaded; it does not duplicate those rules.
- **Do not** add more than 5 rules per learning extraction pass — prioritize by impact (most likely to prevent future correction rounds). Quantity of rule additions is not a quality signal.
- **Do not** add rules that are already documented (even paraphrased). Deduplication is mandatory — grep before adding.
- **Do not** treat task-specific decisions (numbered answers, one-off design choices) as durable rules. If unsure, default to skipping.

## Companion skills + memory

- `next-pms-conventions` — project conventions (camelCase files, cva co-location, Tailwind v4 `!`, etc.). Loaded automatically.
- `react-agents-review` — checklist for closing FE sections.
- `advanced-react-patterns` — composition-over-memoization, etc.
- Auto-memory at `~/.claude/projects/<project-slug>/memory/MEMORY.md` (Claude Code resolves the slug from the working directory) is read on every task — apply user/feedback/project entries before drafting the plan.

## Worked example (abbreviated)

User: `/next-pms-task https://github.com/rtCamp/next-pms/issues/1023`

1. `gh issue view 1023 --repo rtCamp/next-pms --json title,body,...` → "Static text based sections" + 7 Figma frame links.
2. Subagent runs Figma recon on the 7 nodes.
3. Plan written to `plan_issue_1023.md` with S1…S8 + 12 numbered decisions (each `[default: …]`).
4. **Resolve `parent_ts`.** `slack_read_channel(C0AUXBY5WMB, limit=20)` → find Ayush's "New workload -> #1023" top-level message → reuse its ts as `parent_ts` (no fresh top-level post needed). Post the keyword-convention block as the first thread reply, then post 7 plan-body chunks as further thread replies. Every post goes through `bash -ic 'export SLACK_WEBHOOK_URL && .claude/skills/next-pms-task/scripts/slack_post.py --thread-ts <parent_ts> ...'`; do not hand-roll a curl payload.
5. 15-min poll via `slack_read_thread` → maintainer reply: `2: iconLeft, 3: TextEditor editable=false, 7: plain field, 9: lucide, 10: 24px. RESOLVED`. → locked-in + ack via `slack_post.py --thread-ts <parent_ts>` + start S1.
6. After S1: rebuild, browser-check on `/next-pms/projects/<slug>`, post status via `slack_post.py --thread-ts <parent_ts>`, wait. Maintainer replies `RESOLVED` → S2. … repeat through S8.
7. After S8 RESOLVED: open PR (base `claude/feat/<parent-trunk>` if stacking, else `feat/redesign`), reviewer = `ayushnirwal`. 10-min triage. Post a final status (PR link, CI summary) into the thread via `slack_post.py --thread-ts <parent_ts>` + DM Ayush.
8. Re-read thread. Extract 3 durable rules (e.g. "always truncate cell text", "cva in component file not constants.ts", "import icons from /icons subpath"). Add to CLAUDE.md + conventions skill + memory. Commit as `doc(next-pms): record learnings from issue #1023`. Post a `🧠 3 learnings extracted` reply via `slack_post.py --thread-ts <parent_ts>`.

## Tuning

- Poll interval is 15 min. If the maintainer signals they want faster turnarounds, drop to 5 min for that task only — do not change the default in this file.
- If a `BLOCK` arrives, surface it to the user immediately and stop the loop.
- If the issue's Figma frames cannot be resolved against `h1EnhdK8swe6FCyxUW1XHx`, ask the maintainer for the right node IDs in the Slack thread before writing the plan — do not infer.
