---
name: next-pms-slack-poll
description: >
  Lightweight, read-only Slack-thread polling for an in-flight next-pms-task
  approval gate. Reads the thread via slack_read_thread, applies the canonical
  bot-filter and RESOLVED / BLOCK / numbered-decision detection from
  next-pms-task, and reports the current gate state — without replanning,
  without rewriting plan_issue_<n>.md, and without re-entering /next-pms-task.
  Designed to be the target of a recurring cron set up by /next-pms-task so the
  parent skill can wait on maintainer signals at zero replan cost. On terminal
  states (RESOLVED or BLOCK) it cancels its own cron and surfaces the result so
  the next /next-pms-task invocation can resume from the current section.
  Trigger phrases: /next-pms-slack-poll <thread_ts>, "poll the slack thread for
  issue #N", "check the next-pms approval gate". Project-scoped to
  apps/next_pms — do not use for other repos.
---

# next-pms-slack-poll

Read-only polling step extracted from `/next-pms-task` §4 (plan-approval) and §5 step 5 (per-section approval). Built so a recurring cron can drive the gate-poll cadence without re-running the full task pipeline. Re-running the full pipeline replans, re-writes `plan_issue_<n>.md`, and re-posts plan chunks to Slack — wasteful and noisy. This skill exists to remove that footgun.

## Slash invocation

```
/next-pms-slack-poll <thread_ts> [channel_id]
```

- `<thread_ts>` — parent message ts of the approval thread (e.g. `1777459176.259489`). Required.
- `[channel_id]` — defaults to `C0AUXBY5WMB` (`#bots-ai-workflow-next-pms`). Override only for a different next-pms task channel.

If `<thread_ts>` is missing or doesn't look like a Slack ts (`^\d+\.\d+$`), ask the user once for the correct value and stop. Do not guess.

## Preconditions

1. **Working directory** is `apps/next_pms` (or a child) — abort and tell the user otherwise.
2. **`mcp__claude_ai_Slack__slack_read_thread`** available. Load via ToolSearch if deferred. (Reads only — sends are out of scope.)
3. **`CronList` + `CronDelete`** available if you intend the cron self-cancellation step (default behavior on RESOLVED/BLOCK). Load via ToolSearch if deferred.

If a precondition fails, stop and surface the gap. Do **not** silently proceed.

## Step-by-step

1. **Read the thread.**
   ```python
   slack_read_thread(channel_id=channel_id, message_ts=thread_ts)
   ```

2. **Find the gate boundary — the most recent bot post.**
   - Scan all messages in the thread (parent + replies) for the latest one whose author is bot-authored (`bot_id` non-empty, or `subtype == "bot_message"`, or `bot_profile` present, or text ends with `*Sent using* @Claude`).
   - Call its `ts` `gate_boundary_ts`. This is the most recent moment a gate was "armed" — the bot's last status / waiting / acknowledgment post.
   - If no bot post is found at all (e.g. a brand-new thread with only the human parent), set `gate_boundary_ts = "0"` so every human message counts.

   *Why this matters:* `/next-pms-task` runs through multiple gates per task (plan-approval, optional per-section, final review). A `RESOLVED` from an earlier gate is stale once a later gate is armed — a fresh status post by the bot. Without this boundary, the algorithm would re-trigger `RESOLVED` from yesterday's plan-approval message every time the final-gate cron fires.

3. **Apply the canonical bot-filter** (verbatim from the `/next-pms-task` SKILL.md "RESOLVED detection — exact algorithm" section):
   - A message is bot-authored if ANY of these are true:
     - `message.subtype == "bot_message"`
     - `message.bot_id` is present and non-empty
     - `message.bot_profile` is present
     - `message.text` ends with `*Sent using* @Claude`
   - Discard all bot-authored messages. Work only with the remaining human messages.

4. **Scope by gate boundary.** Drop every human message whose `ts <= gate_boundary_ts`. Keep only human messages strictly newer than the boundary — those are replies to the *current* gate.

5. **Accumulate decision answers** across the in-scope human messages, newest-first:
   - For each in-scope human message, regex-match `^\d+:` at line starts; merge matched lines into `locked_decisions` (later-message keys overwrite earlier-message keys for the same number).

6. **Determine the gate signal** from the LATEST in-scope human message only:
   - `\bBLOCK\b` (case-insensitive) → return `BLOCK`.
   - `\bRESOLVED\b` (case-insensitive) → return `RESOLVED`.
   - Otherwise → return `WAITING`.

   If there are no in-scope human messages at all (the maintainer hasn't replied since the last bot post), return `WAITING`.

7. **Report.** Output a tight summary in this exact shape so the parent task's main agent (or the user) can act on it:

   ```
   Gate: WAITING | RESOLVED | BLOCK
   Latest human reply: <one of two literal forms — see below>
   Locked decisions: 1: ..., 2: ..., ...   (or the literal token "(none)")
   Bot replies in thread: <count>
   Human replies in thread: <count>
   ```

   The `Latest human reply` line takes one of exactly two forms — the parent's parser only needs to handle these two:
   - When ≥1 human reply is found: `Latest human reply: <author> @ <hh:mm IST> — "<first 160 chars of latest human message text>"`
   - When 0 human replies are found: `Latest human reply: (none)` (the entire value is the literal `(none)` — no `<author>` placeholder, no `—`, no quotes).

8. **On terminal state** (`RESOLVED` or `BLOCK`), cancel the cron(s) driving this poll loop:
   - `CronList()` → match every job whose `prompt` field, after stripping leading whitespace, **starts with** the literal string `/next-pms-slack-poll <thread_ts>` (prefix match — the optional `[channel_id]` arg may follow). Substring matching is *not* used; if a future caller embeds the thread_ts elsewhere in a different prompt, it should not be cancelled.
   - For each matching job, call `CronDelete(<id>)`.
   - Append one line per cancelled job to the report: `Cron cancelled: <id>` (one line per id, in the order returned by CronList).
   - If no jobs matched, append exactly one line: `Cron cancellation skipped: no matching job` (the user may have used a different cadence mechanism — that's fine).

9. **On `WAITING`**, do nothing else. The cron will fire this skill again at its next tick.

## Output discipline

- **Read-only.** Do **not** post via webhook (`scripts/slack_post.py`). Do **not** call `slack_send_message` or any other outbound MCP tool.
- **No plan re-write.** Do **not** open or edit `plan_issue_<n>.md`. Do **not** read it either — the gate state lives in Slack, not on disk.
- **No `/next-pms-task` re-entry.** Do **not** invoke the parent skill. Surface the gate result in your response and stop.
- **No file writes** at all (other than the cron-side effect of step 6).
- **No browser activity.** The browser quality-gate belongs to `/next-pms-task` step 5.3.

## Constraints + non-goals

- Polling cadence is whatever cron the parent set up. Do not create a new cron from inside this skill.
- Do not negotiate with the maintainer — if the latest human message contains free-form content that isn't `RESOLVED`, `BLOCK`, or a numbered decision, treat it as new feedback and pass it through verbatim in the report. Acting on it is the parent skill's job.
- Do not deduplicate decision answers across runs — each invocation re-reads the thread fresh.
- Do not retry on Slack-MCP failures. Surface the error and let the cron fire again at the next tick.
- The `*Sent using* @Claude` filter rule is preserved for back-compat with older bot posts; current outbound is via webhook (`Next-PMS-Task-AI-Bot`, `bot_id=BF6973Y7N`), which the generic `bot_id` rule already catches. Do not delete the trailing-text rule.

## How `/next-pms-task` should use this

`/next-pms-task` should set up the cron at the start of each gate (plan-approval and after each section status post) like:

```python
CronCreate(
    cron="*/15 * * * *",
    prompt=f"/next-pms-slack-poll {parent_ts} C0AUXBY5WMB",
    recurring=True,
)
```

The cron auto-cancels itself (step 6) when the gate clears, so the parent task only needs to set it up once per gate. On the next interactive `/next-pms-task` invocation after `RESOLVED`, the parent task's idempotency check (see `/next-pms-task` SKILL.md "Re-entry detection") reads the Slack thread, finds the locked-in decisions, and resumes from the current section without replanning.

## Worked example

User (or cron) invokes:
```
/next-pms-slack-poll 1777459176.259489
```

Skill output (WAITING case):
```
Gate: WAITING
Latest human reply: (none)
Locked decisions: (none)
Bot replies in thread: 6
Human replies in thread: 0
```

Skill output (RESOLVED case):
```
Gate: RESOLVED
Latest human reply: Ayush Nirwal @ 16:47 IST — "1: design-system, 5: Globe-FolderAlt-Github-People-ExternalLink. RESOLVED"
Locked decisions: 1: design-system, 5: Globe-FolderAlt-Github-People-ExternalLink
Bot replies in thread: 6
Human replies in thread: 1
Cron cancelled: 254d4fdc
```

Skill output (BLOCK case):
```
Gate: BLOCK
Latest human reply: Ayush Nirwal @ 17:02 IST — "Wait — I want to discuss decision 6 before we touch budget burn. BLOCK"
Locked decisions: (none)
Bot replies in thread: 6
Human replies in thread: 1
Cron cancelled: 254d4fdc
```

## Companion files

Paths are repo-relative (the `apps/next_pms` working directory the skill runs from is the repo root for these paths):

- Parent skill: `.claude/skills/next-pms-task/SKILL.md` — the canonical RESOLVED-detection algorithm and the architecture this skill plugs into.
- Helper for sends (NOT used here, listed for context): `.claude/skills/next-pms-task/scripts/slack_post.py`.
