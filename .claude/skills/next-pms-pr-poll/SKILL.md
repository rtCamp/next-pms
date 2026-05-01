---
name: next-pms-pr-poll
description: >
  Polls a next-pms PR every 15 min for unaddressed inline review comments and
  drives the auto-fix-and-notify-Slack cycle when any are found. Companion to
  next-pms-slack-poll — that one watches the Slack thread, this one watches the
  GitHub PR. Maintainers don't always ping Slack after a review, so the GH-poll
  closes that gap. Self-cancels its own cron when the parent task's Slack
  thread reaches RESOLVED or BLOCK (signals provided by the slack-poll skill).
  Trigger phrases: /next-pms-pr-poll <pr_number> <thread_ts>, "poll PR #1284
  for review comments". Project-scoped to apps/next_pms.
---

# next-pms-pr-poll

GitHub-side companion to `/next-pms-slack-poll`. Both crons are armed by `/next-pms-task` step 6.7 after the PR is opened. Together they cover both signal paths: the maintainer either pings the Slack thread, or leaves inline comments on the PR (or both).

## Slash invocation

```
/next-pms-pr-poll <pr_number> <thread_ts> [channel_id]
```

- `<pr_number>` — e.g. `1284`. Required.
- `<thread_ts>` — Slack parent ts of the task thread (e.g. `1777459176.259489`). Required so the skill can post status updates back to the same thread.
- `[channel_id]` — defaults to `C0AUXBY5WMB`.

## Preconditions

1. **Working directory** is `apps/next_pms` (or a child) — abort otherwise.
2. **`gh` CLI** authenticated. `gh auth status` must show a logged-in account. If not, surface the gap and stop.
3. **`SLACK_WEBHOOK_URL`** must be exported in env (used by `scripts/slack_post.py`).
4. **`CronList` + `CronDelete`** available if the cron self-cancellation step is reached. Load via ToolSearch if deferred.

If a precondition fails, stop and surface — do not silently proceed.

## Step-by-step

1. **Fetch PR state.**
   ```bash
   gh pr view <pr_number> --json reviews,comments,state,statusCheckRollup
   gh api repos/:owner/:repo/pulls/<pr_number>/comments --paginate
   gh pr checks <pr_number>
   ```

2. **Filter to unaddressed inline comments by the maintainer (`ayushnirwal`).**
   - Comment is in scope if: `user.login == "ayushnirwal"` AND comment is not `outdated` (line still exists at the comment's line) AND I haven't replied to it yet.
   - Comments by `copilot-pull-request-reviewer` are addressed via the existing CLAUDE.md §6 Copilot triage path — out of scope for this skill.
   - Comments by `rtBot` (myself) are skipped.

3. **If zero unaddressed comments:**
   - Check whether the parent Slack thread has reached a terminal state. Run `/next-pms-slack-poll <thread_ts>` (or read the thread directly with `slack_read_thread` + the canonical bot-filter from `/next-pms-task` SKILL.md "RESOLVED detection").
   - On `RESOLVED` or `BLOCK` → **cancel both crons**: `CronList()` → for each job whose `prompt` field starts with `/next-pms-pr-poll <pr_number>` or `/next-pms-slack-poll <thread_ts>`, call `CronDelete(<id>)`.
   - On `WAITING` → do nothing; let the cron fire again at the next tick.

4. **If ≥ 1 unaddressed comment:**
   - Run the auto-fix cycle (this is a write-capable skill — unlike `next-pms-slack-poll`):
     1. For each comment, decide **Valid** vs **Not valid**:
        - **Valid** = factual accuracy issue, convention deviation, AC mismatch, code-quality concern (DRY/KISS/SOLID), naming/structure feedback, library-component-not-used, hardcoded-value-flagged.
        - **Not valid** = the maintainer's suggestion contradicts a locked decision answer in the plan thread, AC, or `next-pms-conventions` SKILL.md. (Rare. Document the rationale.)
     2. **Valid → fix:** edit files, run `npm run build:app` inside `fm shell`, browser-check the affected route via a `general-purpose` Agent + Claude-in-Chrome MCP, commit on the same branch with a `refactor(...)` or `fix(...)` Conventional-Commits message, push.
     3. **Not valid → reply on the inline thread** with the rationale. Use:
        ```bash
        gh api repos/:owner/:repo/pulls/<pr_number>/comments/<comment_id>/replies \
            --method POST -f body='<rationale>'
        ```
        Cite the AC bullet, locked decision answer, or convention-skill section.

5. **After all valid fixes are pushed, post ONE Slack update** in the existing thread using this template (helper: `.claude/skills/next-pms-task/scripts/slack_post.py --thread-ts <ts>`):

   ```
   ✅ Picked up GH review comments → fixed → pushed.

   Commit `<sha>` on `<branch>` addresses <N> inline review threads on PR <url>:
   • <one-line per fix>
   …
   • <declined> — <one-line rationale>

   Browser-verified on <route>: <key checks green>.

   Reply `RESOLVED` to close, or post more feedback (Slack or GitHub) and I'll pick it up on the next 15-min poll.
   ```

6. **Leave both crons armed.** They self-cancel only on terminal Slack state (step 3). Each new round of feedback runs through steps 1–5 again.

## Output discipline

- **Write-capable** (unlike `next-pms-slack-poll`): edits files, commits, pushes, posts Slack. Bounded — does NOT replan, does NOT rewrite `plan_issue_<n>.md`, does NOT re-post the plan chunks.
- **No Slack message draft for review.** Post directly via the webhook helper. Maintainer reviews on the live thread.
- **Browser-check before push.** A failed browser-check = the fix is incomplete. Don't push half-finished work.
- **Conventional Commits.** `refactor(<scope>): address PR <pr> review feedback` or `fix(<scope>): address PR <pr> review feedback`. Sign with the project default Co-Authored-By footer.
- **One commit per polling cycle.** Even if there are 12 fixes in a round, group them into one commit so the PR diff stays scannable.

## Constraints + non-goals

- Cadence is fixed at the cron set by the parent `/next-pms-task`. Don't create a new cron from inside this skill.
- Don't auto-resolve PR threads on GitHub — let the maintainer resolve them after re-review.
- Don't `gh pr merge` — only the maintainer merges.
- Don't touch CI / `.github/workflows/*.yml` — those are out-of-scope per CLAUDE.md §6 ignore-list.
- If `gh` rate-limits or returns 5xx, surface the error and let the cron fire again. Don't retry in-skill.
- If a fix needs more than mechanical edits (e.g. a redesign decision the maintainer raised), DON'T auto-fix — instead, post a Slack reply asking the maintainer to clarify, and leave the polling cron running.

## How `/next-pms-task` arms this

In `/next-pms-task` step 6.7 (after `gh pr create`):

```python
CronCreate(
    cron="*/15 * * * *",
    prompt=f"/next-pms-pr-poll {pr_number} {parent_ts} C0AUXBY5WMB",
    recurring=True,
)
```

Both crons (Slack + PR) run in parallel. Slack-poll surfaces gate state and free-form maintainer notes; PR-poll surfaces inline review comments and drives the fix-and-notify cycle.

## Companion files

Paths are repo-relative (`apps/next_pms` is the working root).

- Parent skill: `.claude/skills/next-pms-task/SKILL.md` — orchestrates the task pipeline and arms both polling crons.
- Slack companion: `.claude/skills/next-pms-slack-poll/SKILL.md` — read-only Slack thread poll.
- Webhook helper: `.claude/skills/next-pms-task/scripts/slack_post.py` — used by step 5 to post the status update.
