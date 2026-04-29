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

2. **Apply the canonical bot-filter** (verbatim from the `/next-pms-task` SKILL.md "RESOLVED detection — exact algorithm" section):
   - A message is bot-authored if ANY of these are true:
     - `message.subtype == "bot_message"`
     - `message.bot_id` is present and non-empty
     - `message.bot_profile` is present
     - `message.text` ends with `*Sent using* @Claude`
   - Discard all bot-authored messages. Work only with the remaining human messages.

3. **Accumulate decision answers** across all human messages, newest-first:
   - For each human message, regex-match `^\d+:` at line starts; merge matched lines into `locked_decisions` (later-message keys overwrite earlier-message keys for the same number).

4. **Determine the gate signal** from the LATEST human message only:
   - `\bBLOCK\b` (case-insensitive) → return `BLOCK`.
   - `\bRESOLVED\b` (case-insensitive) → return `RESOLVED`.
   - Otherwise → return `WAITING`.

5. **Report.** Output a tight summary in this exact shape so the parent task's main agent (or the user) can act on it:

   ```
   Gate: WAITING | RESOLVED | BLOCK
   Latest human reply: <author> @ <hh:mm IST> — <first 160 chars or "(none)">
   Locked decisions: 1: ..., 2: ..., ...   (or "(none)")
   Bot replies in thread: <count>
   Human replies in thread: <count>
   ```

6. **On terminal state** (`RESOLVED` or `BLOCK`), cancel the cron driving this poll loop:
   - `CronList()` → find the job whose `prompt` starts with `/next-pms-slack-poll <thread_ts>` (substring match).
   - `CronDelete(<id>)` for each match.
   - Append a single line to the report: `Cron cancelled: <id>` (or `Cron cancellation skipped: no matching job` if there's nothing to delete — that's fine, the user may have used a different cadence mechanism).

7. **On `WAITING`**, do nothing else. The cron will fire this skill again at its next tick.

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

- Parent skill: `apps/next_pms/.claude/skills/next-pms-task/SKILL.md` — the canonical RESOLVED-detection algorithm and the architecture this skill plugs into.
- Helper for sends (NOT used here, listed for context): `apps/next_pms/.claude/skills/next-pms-task/scripts/slack_post.py`.
