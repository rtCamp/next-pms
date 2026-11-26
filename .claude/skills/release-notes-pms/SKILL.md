---
name: release-notes-pms
description: Draft crisp, user-facing release notes for a Frappe app release (built for rtCamp/next-pms) from the git range between two version tags. Use when the user asks for release notes, a changelog, "what's new" or "what changed in vX.Y.Z", or to draft the GitHub release for next_pms or a similar rtCamp Frappe app.
argument-hint: "[version, e.g. v2.17.0]"
---

Write release notes for one version bump. Read-only on git and GitHub. Never commit, tag, push or edit a GitHub release. Needs `gh` logged in (`gh auth status`). If it isn't, ask the user to log in.

## 1. Find the range

Releases are cut by merging `develop` into the release branch (for example `version-16`), and the tag sits on that merge. So the tags are not ancestors of `develop`, and `--first-parent` on a tag range returns only the release merge.

- **New version:** the version the user names (`$ARGUMENTS`). Otherwise read `__version__` in `next_pms/__init__.py` on the current branch and compare it with the latest GitHub release (`gh release view --json tagName -q .tagName`):
  - **Higher than the latest release:** the version bump is merged, so `__version__` is the new version.
  - **Same as the latest release:** the bump isn't merged yet. Take the latest release as the previous version and `HEAD` as the end, list the PRs in range, then ask the user which version to use before writing anything. Suggest the next minor if any PR in range adds a feature or a breaking change (a `feat` or `feat!` title, or a New features or Breaking item): v2.16.0 → v2.17.0. Otherwise suggest the next patch: v2.16.0 → v2.16.1.

  Do not search bump commit subjects; they vary (`chore: Bump App Version`, `bump app version to 2.16.2`, `... to v2.11.0`).
- **End of range:** the new tag if it exists (`git rev-parse -q --verify refs/tags/vX.Y.Z`), otherwise `HEAD`. Never use `HEAD` when the tag exists, because `HEAD` may be past it.
- **Stop and ask** if the version has no tag and `__version__` is neither that version nor the latest release (for example the user asks for v1.4.0, the code says 1.3.0 and the latest release is v1.2.0). Drafting would mislabel the release or merge two releases into one.
- **Previous version:** the newest semver tag below the new version (`git tag --sort=-v:refname`).
- **Release date:** `git log -1 --format=%ad --date=short <end>`. When the end is `HEAD`, say in chat that the date is provisional.
- **PRs in range:**

  ```bash
  git log <prev>..<end> --merges --format='%h %s' | grep 'Merge pull request #' | grep -v 'from rtCamp/develop$'
  git log <prev>..<end> --no-merges --format='%h %s' | grep -E '\(#[0-9]+\)$'   # squash merges
  ```

  Ignore `Merge branch 'develop' into ...` lines.
- **Reverts:** if a PR and its revert are both in range, the change never shipped. Leave both out, do not credit their authors for them, and mention them in chat. `git diff --stat <prev> <end>` confirms what actually shipped.

## 2. Gather facts per PR

For each PR: `gh pr view <n> --json number,title,author,body,closingIssuesReferences,commits`. `closingIssuesReferences` has no titles, so run `gh issue view <n> --json title` for each linked issue. The PR body is the main source of user-facing detail (look for "Breaking" or "Fixes" lines). Commit bodies (`.commits[].messageBody`) often state the symptom a fix addresses. If the purpose is still unclear, check `gh pr diff <n> --name-only`. If the PR's prose and its tables disagree, follow the prose and flag the conflict in chat.

Co-authors are the `Co-authored-by:` trailers in commit messages: `git log <prev>..<end> --no-merges --format='%(trailers:key=Co-authored-by,valueonly)' | sort -u`. Drop AI and bot trailers (for example `Claude ... <noreply@anthropic.com>`). Trailers give a name and email, not a login, so match each person to their GitHub login from the commit authors of any PR in the range, or ask the user.

Style reference (read only): `gh release view <prev> --json body -q .body`. Match its structure and length.

## 3. Classify

| Kind of change | Goes to |
|---|---|
| New user-facing capability | **New features** (4-bullet block) |
| Small enhancement to an existing screen or flow | **Improvements** (one line) |
| Bug fix that users would notice | **Fixes** (one line) |
| Changes existing behaviour, access, data, config, required fields or integrations | also **Breaking changes & required actions** |
| CI, tests, tooling, version bumps, refactors, internal or unannounced tool removals (for example MCP tools) | Leave out of the notes. Still credit the authors as contributors. |

Classify changes, not PRs. One large PR can feed several sections (a feature, breaking changes, improvements and fixes); split it. List each change once: a breaking change goes only under Breaking, even if the PR calls it a fix. If one change restores or adds something for some people and takes something away from others, write it as one breaking pair whose "What changed" covers both.

- **Breaking** means something that worked in the previous release now works differently or is refused, or someone must act. Write one pair per action someone must take; merge changes that share an action. A change that only adds access or options is not breaking. If the PR names no action, write the one the change implies and flag it in chat.
- State a breaking change only as far as the PR says it goes. If the PR says a role loses write access, do not write that it loses access.
- **Fixes** are for bugs users could hit in a released version. A bug introduced and fixed within this release's own work never shipped; leave it out.

When a call is genuinely unclear, such as whether something counts as breaking or whether an internal change should be mentioned, ask the user before writing.

## 4. Writing rules

- **Crisp.** People skim. Use one line per bullet, a few words each. No sub-bullets, no implementation detail (doctype names, API names, fixtures).
- Write in plain user language and name things as the user sees them in the UI.
- Name features by the user benefit ("Record the tech stack of every project").
- Fixes: write the symptom the user saw, then what is now correct. If the PR doesn't say what users saw, read the diff before writing.
- Keep currency-neutral wording (write "0.00", not "₹0.00" or "$0.00").
- **Contributors:** only `@`-tag the PR authors and commit co-authors, comma-separated. No reviewers, no issue raisers, no bots (the `claude` login, `dependabot`, any login ending in `[bot]`), no extra wording.
- Add a Ref comment after each item: `<!-- Ref: #123 -->` for the issue the item itself closes, or `<!-- Ref: PR #456 -->` if it closes none (for example a fix found while building a bigger PR). Don't borrow a sibling item's issue.
- **References:** list each issue used in a Ref with its title. List a PR, as `[PR #n](url) — <PR title>`, only when some Ref names the PR without an issue.
- If a section is empty, write `None.` for Breaking changes and drop the other empty sections, References included. Always keep Contributors.
- If nothing is user-facing, the notes are the heading, date, `None.` and Contributors. Tell the user What's new will show the release with no content.

Bullet style:

```markdown
<!-- Too wordy -->
- **Allocations** — We have refactored the allocation hover card component so that it now also fetches and renders the notes field from the Resource Allocation doctype.
<!-- Right -->
- **Allocation notes in the hover card** — see the note without opening the allocation.
```

## 5. Template (section order is fixed)

The next-pms app's **What's new** page reads these notes straight from the GitHub release. It shows a release only if its notes contain the `**Release date:**` line, which marks them as user-facing. Without that line the release is hidden and users get no unread dot for it. The page removes the `# vX.Y.Z` heading, the release-date line, **Contributors**, **References**, and any section that only says `None.`. Everything else is shown to every user as written, so keep internal detail out of the other sections.

Repeat the breaking-change pair and the feature block once per change, each with its own Ref.

```markdown
# vX.Y.Z
<!-- Version follows semantic versioning and matches the git release tag. -->

**Release date:** YYYY-MM-DD

## Breaking changes & required actions
- **What changed:** <one line>
- **What you must do:** <one line, concrete>
<!-- Ref: #<issue>, or PR #<n> if no issue -->

## New features
### <Feature, named as a user benefit>
- **The problem:** <one line>
- **What's new:** <one line>
- **Why it matters:** <one line>
- **Who it affects:** <roles; an action only if the PR states one, else "no action needed">
<!-- Ref: #<issue>, or PR #<n> if no issue -->

## Improvements
- **<What's better>** — <one short clause>.
<!-- Ref: #<issue>, or PR #<n> if no issue -->

## Fixes
- **<What the user experienced>** — <what's now correct>.
<!-- Ref: #<issue>, or PR #<n> if no issue -->

## Contributors
@author1, @author2

## References
- [#123](https://github.com/<owner>/<repo>/issues/123) — <issue title>
- [PR #456](https://github.com/<owner>/<repo>/pull/456) — <PR title>
```

## 6. Output

- Write to the repo root as `release_notes_vX.Y.Z.md`. Leave it untracked: do not name it `plan_*`, because git ignores that pattern, and do not stage or commit it.
- Check the file before handing over, and fix it if a check fails:
  - `grep -cE '^# v[0-9]+\.[0-9]+\.[0-9]+$' release_notes_vX.Y.Z.md` returns 1, and the heading matches the tag.
  - `grep -cE '^\*\*Release date:\*\* [0-9]{4}-[0-9]{2}-[0-9]{2}$' release_notes_vX.Y.Z.md` returns 1.
  - Every PR from step 1 is either in a Ref or in your list of what was left out.
- In chat, give the file path, a one-line summary per section, what was left out and why (including revert pairs), and any judgment calls for the user to confirm.
- Remind the user to paste the notes into the GitHub release as they are. If a published release is missing from What's new, its notes lack the release-date line. Adding the line on GitHub fixes it, and sites pick up the change within 6 hours.
