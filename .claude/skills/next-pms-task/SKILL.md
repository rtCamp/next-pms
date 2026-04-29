---
name: next-pms-task
description: Use this skill whenever the user invokes /next-pms-task with a GitHub issue or task URL (e.g. /next-pms-task https://github.com/rtCamp/next-pms/issues/1023). The skill drives the full next-pms task pipeline — fetch the issue, write the plan, post it as a Slack thread in #bots-ai-workflow-next-pms (channel C0AUXBY5WMB), poll the thread for the maintainer's decisions and the RESOLVED gating keyword, execute the implementation section-by-section gated on RESOLVED, then open the PR with the project's stacked-PR + reviewer rules. Trigger phrases: /next-pms-task, "run next-pms-task on", "kick off the task workflow for". This skill is project-scoped to apps/next_pms — do not use for other repos.
---

# next-pms-task

End-to-end automation for next-pms task tickets. Wraps the existing `apps/next_pms/CLAUDE.md` workflow (§1 plan → §2 section-by-section → §5 PR → §6 triage) and adds a Slack-thread feedback loop so the maintainer can steer the work asynchronously.

## Slash invocation

```
/next-pms-task <github-issue-url>
```

The argument must be a valid GitHub issue/task URL. Extract `<owner>`, `<repo>`, and `<n>` (issue number). If anything else is passed, ask the user for the URL once and stop. Do not guess.

## Preconditions to verify before starting

1. **Working directory** is `apps/next_pms` (or a child) — abort and tell the user otherwise.
2. **gh CLI authenticated** for `rtCamp/next-pms` — `gh auth status`. If not, ask the user to run `gh auth login`.
3. **Slack MCP available** — at minimum `mcp__claude_ai_Slack__slack_send_message` and `mcp__claude_ai_Slack__slack_read_thread`. Load via ToolSearch if deferred.
4. **Browser MCP available** — at minimum `mcp__claude-in-chrome__tabs_context_mcp`, `..._navigate`, `..._read_page`, `..._read_console_messages`, `..._javascript_tool`. The maintainer's tab on `https://pms-temp.frappe.rt.gw/next-pms/...` should be reachable; if not, ask the maintainer to authenticate manually. Never attempt to enter credentials.

If any precondition fails, stop and surface the gap. Do **not** silently proceed.

## End-to-end workflow

### 1. Recon (no Slack yet)

- `gh issue view <n> --repo <owner>/<repo> --json title,body,labels,assignees,state` to capture the ticket.
- Pre-implementation scan per `CLAUDE.md` "Pre-implementation scan" subsection (utilities, cva, design-system primitives, upstream PRs in flight, component granularity, file extensions, route completeness). Use `mcp__storybook__list-all-documentation` + `mcp__storybook__get-documentation` for component inventory and `mcp__figma__get_design_context` (always with `fileKey=h1EnhdK8swe6FCyxUW1XHx`, never the file root `0:1`) for the Figma frames the issue links.
- For Figma recon across more than 2-3 frames, spawn a `general-purpose` subagent with a tight brief asking for a structured summary — keeps screenshot dumps out of the main context.

### 2. Plan (filesystem)

- Save the plan as `apps/next_pms/plan_issue_<n>.md` (already gitignored — never commit). The plan must contain everything CLAUDE.md §1 requires: issue summary, scope/out-of-scope, section breakdown (S1…Sn), routes/nav/store changes, component inventory (REUSE / NEW), data/API dependencies, AC mapping, test plan, and an explicit numbered list of **open decisions** with `[default: ...]` annotations for each so execution can proceed even without answers.

### 3. Slack thread

Channel: **`C0AUXBY5WMB`** (`#bots-ai-workflow-next-pms`).

**Top-level message** — one liner that names the keyword convention. Use exactly this template, substituting `<n>` and `<title>`:

```
📋 Plan for issue #<n> — <title> — below in this thread.

Keywords (reply in-thread, plain text, case-insensitive):
• `RESOLVED` — gate has passed; I move on. I require this on the plan itself, after each decision-answer round, and after each implementation section.
• `BLOCK` — pause; I will stop and wait for your next message.
• Numbered decision answers (e.g. `2: Button iconLeft, 3: TextEditor editable=false`) — locked in.

I poll this thread every 15 min and only act on replies from non-bot users. Defaults are listed in square brackets; if you reply only `RESOLVED`, I take the defaults and proceed.
```

**Thread replies** — split the plan across multiple messages (Slack truncates above ~5 KB per message). Use the breakdown from existing precedent (issue summary + scope; figma recon; component inventory + file structure; section breakdown; open decisions; final next-steps note). Keep each message under ~3 KB. Always prefix with `<i>/<total>` so the maintainer can scroll.

Save the top-level message's `message_ts` and the channel ID — every poll/reply uses these.

### 4. Plan-approval gate

Poll the thread every **15 minutes** using `slack_read_thread`. Extraction logic:

- Skip messages where `username == "Claude"` or where the body ends with `*Sent using* @Claude` (those are mine).
- Look for the latest non-bot reply with the literal token `RESOLVED` (word-boundary match, case-insensitive). `BLOCK` overrides — if the latest non-bot reply contains `BLOCK`, stop and surface to the user.
- Parse decision-answer messages (e.g. `2: ...`, `3: ...`) and merge into a `locked_decisions` map.

When `RESOLVED` is detected at the plan-approval gate, ack in-thread (`Acknowledged. Locked-in decisions: ... Starting S1.`) and proceed to step 5.

If 4 polls (1 hour) pass with no human reply, post a single nudge in the thread (`Still waiting on the plan-approval gate — defaults will be used if you reply RESOLVED only.`). Do not nudge more than once per gate.

### 5. Section-by-section execution

For each section S1…Sn from the plan:

1. **Implement** — write code per the plan + locked decisions. Reuse design-system / frappe-ui-react components; respect the project conventions skill (`next-pms-conventions`).
2. **Rebuild** — `fm shell pms-temp.frappe.rt.gw <<'EOF'` / `cd apps/next_pms/frontend && npm run build:app` / `EOF`. If the submodule SHA changed, run `pnpm --filter @rtcamp/frappe-ui-react build` first.
3. **Browser quality-gate** — navigate the existing authenticated tab to the relevant route, reload, run a JS assertion script that captures structural + style facts (heading text, classNames, computed sizes, presence of expected SVGs/icons), and read console messages with `onlyErrors=true`. Heavier or multi-route checks: spawn a `general-purpose` subagent.
4. **Post status to thread** — short reply with: section name, what changed (1–2 lines per file), build result, browser-gate result, and the verbatim line: `Reply RESOLVED to proceed to S<i+1>.` (or `… to open the PR.` for the last section).
5. **Wait for RESOLVED on this section** — poll every 15 min, same extraction logic as step 4. `BLOCK` pauses; new feedback (e.g. "fix X first") is treated as scope; address it, post an updated status, then re-wait. Do **not** advance to the next section without an explicit `RESOLVED` from a non-bot user. The 1-hour single-nudge rule applies per gate.

### 6. PR + post-PR triage

Once the last section is `RESOLVED`:

1. Stage and commit per CLAUDE.md (one logical commit, or 2-3 if there's a clean separation). Use `git mv` for renames.
2. Push to `claude/feat/<trunk>` (regular push if first push; force-with-lease only if you rebased history).
3. **Base** per CLAUDE.md §5: default `feat/redesign`. If the issue genuinely depends on another in-flight PR's branch, base on that branch and add a "Stacking note" paragraph to the PR body (rule #7).
4. `gh pr create --reviewer ayushnirwal` with the body template from existing precedent (Summary / Stacking note if applicable / Verification / Test plan).
5. Sleep 10 min; pull `gh pr view <pr> --json reviews,comments,statusCheckRollup`, `gh api repos/.../pulls/<pr>/comments`, `gh pr checks <pr>`. Triage per CLAUDE.md §6.
6. Post in the same Slack thread: `PR up: <url>. CI: <green|red+notes>. AI review: <state>.`
7. Final maintainer DM to Ayush (`U026K7B5VAA`, channel `D026S1T8ML2`) with a short summary + the PR link.

### 7. Cleanup

- Mark all tasks completed (TaskUpdate).
- Do not commit `plan_issue_<n>.md` (gitignore covers it; verify with `git status` before any commit).
- Leave the Slack thread open — thread resolution is the maintainer's call (do not auto-react with ✅).

## RESOLVED detection — exact algorithm

```
Read thread → filter out bot messages (those whose author is U0AGR5HU010 / "Claude"
              or U8N2T92TE / the current logged-in bot user, or whose text ends with
              "*Sent using* @Claude").
For each remaining message, newest-first:
  if regex \bBLOCK\b matches (case-insensitive) → return "BLOCK"
  if regex \bRESOLVED\b matches (case-insensitive) → return "RESOLVED"
  if regex matches a numbered-decision pattern (e.g. ^\d+:) → merge into locked_decisions
fall through → return "WAITING"
```

Only `RESOLVED` advances. `BLOCK` halts. Decision answers update state but do not advance.

## Constraints + non-goals

- **Do not** auto-resolve threads on GitHub or auto-react with ✅ in Slack — the maintainer signals progress via the keyword in text.
- **Do not** loop more than 8 polls (≈ 2 hours) silently without surfacing to the user. After 4 polls without any reply, post the one-time nudge; if 4 more pass, stop and ask the user for guidance.
- **Do not** invoke this skill in a non-`apps/next_pms` working directory.
- **Do not** skip the plan file or the Slack thread, even for "small" changes.
- **Do not** force-push or destructive-git unless rebasing onto an advanced base.
- The skill assumes the `next-pms-conventions` skill is loaded; it does not duplicate those rules.

## Companion skills + memory

- `next-pms-conventions` — project conventions (camelCase files, cva co-location, Tailwind v4 `!`, etc.). Loaded automatically.
- `react-agents-review` — checklist for closing FE sections.
- `advanced-react-patterns` — composition-over-memoization, etc.
- Auto-memory at `/home/frappe/.claude/projects/-home-frappe-frappe-sites-pms-temp-frappe-rt-gw-workspace-frappe-bench-apps-next-pms/memory/MEMORY.md` is read on every task — apply user/feedback/project entries before drafting the plan.

## Worked example (abbreviated)

User: `/next-pms-task https://github.com/rtCamp/next-pms/issues/1023`

1. `gh issue view 1023 --repo rtCamp/next-pms --json title,body,...` → "Static text based sections" + 7 Figma frame links.
2. Subagent runs Figma recon on the 7 nodes.
3. Plan written to `plan_issue_1023.md` with S1…S8 + 12 numbered decisions (each `[default: …]`).
4. Slack top-level posted in `C0AUXBY5WMB` with the keyword block; 7 thread messages with the plan body.
5. 15-min poll → maintainer reply: `2: iconLeft, 3: TextEditor editable=false, 7: plain field, 9: lucide, 10: 24px. RESOLVED`. → locked-in + ack + start S1.
6. After S1: rebuild, browser-check on `/next-pms/projects/<slug>`, post status, wait. Maintainer replies `RESOLVED` → S2. … repeat through S8.
7. After S8 RESOLVED: open PR (base `claude/feat/<parent-trunk>` if stacking, else `feat/redesign`), reviewer = `ayushnirwal`. 10-min triage. Reply with PR link in thread + DM Ayush.

## Tuning

- Poll interval is 15 min. If the maintainer signals they want faster turnarounds, drop to 5 min for that task only — do not change the default in this file.
- If a `BLOCK` arrives, surface it to the user immediately and stop the loop.
- If the issue's Figma frames cannot be resolved against `h1EnhdK8swe6FCyxUW1XHx`, ask the maintainer for the right node IDs in the Slack thread before writing the plan — do not infer.
