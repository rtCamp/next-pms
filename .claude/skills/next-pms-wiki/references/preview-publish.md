# Preview & publish mechanics

How the assembled pages reach reviewers safely, and how they eventually reach the public wiki. The default deliverable is a **private preview**, never a public push — publishing is always sign-off-gated, and it is blocked outright while any screenshot still shows real data.

## GitHub wiki vs. a normal-repo preview — the link mismatch

A GitHub **wiki** resolves intra-wiki links **extensionless**: `[Roles](Roles-and-Access)`. Authored pages use that form, because that is what the live wiki needs.

A **normal repository file view** (which is how a private preview repo renders `.md` files) does NOT resolve extensionless links — they 404. So a preview copy needs every intra-wiki link rewritten to add `.md` (and preserve any `#anchor`): `](Roles-and-Access)` → `](Roles-and-Access.md)`. This rewrite touches ONLY the preview copy; the canonical wiki pages stay extensionless.

Rewrite only real page targets — skip `http(s)://` links, image paths (`public/...`), and pure `#anchor` links. A small script does this deterministically (see the packaging pattern below).

## Use a PRIVATE preview repo for internal review

Review happens on a **private** preview repository, not the public wiki:

- Reviewers see the pages and screenshots rendered, can comment inline, and can approve — without anything becoming public.
- A landing page (copy `Home.md` → `README.md`) gives the normal-repo view a front door.
- The preview PR body must state plainly what is NOT yet publication-ready (see the warning below).

## NEVER push real-data screenshots to the public wiki

- Real-data screenshots may go to the **private** preview repo for layout/annotation review ONLY, and the PR must loudly flag them as pending re-capture.
- They must be **re-captured on the fake-data family** (see `references/seeding.md`) before anything reaches the public `*.wiki.git`.
- The public push is a separate, explicitly sign-off-gated step. Never force-push a wiki. The skill's default deliverable is built pages + a private preview, not a public push.

## The `make_preview_pr.sh` packaging pattern

Package the built wiki into a PR on the private preview repo with a re-runnable script. The pattern (adapt paths/repo per project):

1. **Sanity-check** the source: confirm the wiki source dir exists and count the `.md` pages against the expected number (a miscount means a missing or stray page).
2. **Fresh clone** the private preview repo into a scratch dir; set the committer identity explicitly (name + email) rather than inheriting it; cut a dated branch off the repo default.
3. **Sync content:** copy `*.md` and the `public/` screenshot tree in; copy `Home.md` → `README.md` for the landing view.
4. **Rewrite intra-wiki links** to add `.md` (preview-only), skipping http(s)/image/anchor links (small Python pass over the copied files).
5. **Commit** with a Conventional-Commits message and **no AI/tooling attribution** — the message reads as the author's own.
6. **Push the branch and open the PR** with a body that (a) summarises the content changes and (b) carries a prominent "⚠️ Not publication-ready — screenshots still show live data, pending re-capture on the demo family" warning plus a "still pending" list (deferred LEAKS-ALL views, open decisions, etc.).

Keep the script idempotent (recreate the work dir, use a dated branch) so it is safe to re-run as pages change.

## What the preview PR body must always disclose

- Which screenshots still show live data and must be re-captured before public publish.
- Which views were **deferred** because they aggregate the whole site with no isolation lever (they need a clean/empty instance).
- Any open decisions the doc encodes (a target permission model from an unmerged issue, a pending feature-exclusion list) — so a reviewer knows what is provisional.

## Commit and PR identity (rtBot)

Commits to the preview repo, and the PRs that carry them, go out as **rtBot** (`43742164+rtBot@users.noreply.github.com`), without making rtBot gh's default account. Set the identity in the clone's local git config, push through a token-scoped credential helper (`gh auth token --user rtBot`), and open or edit PRs with `GH_TOKEN="$(gh auth token --user rtBot)" gh pr ...`. `sync_preview_rtbot.sh <branch> "<subject>" [base]` does the clone, mirror, `.md` link rewrite, identity audit and push in one step. A merged PR is closed, so start a new branch and PR instead of pushing to its branch.
