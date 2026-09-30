# Privacy-first — the non-negotiable that reshapes the pipeline

A documentation screenshot is a permanent, publishable copy of whatever was on screen. When the capture site holds real production data, every shot is a potential leak. This principle is what turns "annotate screenshots" into a full pipeline: you cannot safely capture until the view shows only fake data, so recon + seeding + isolation come *before* capture, and a privacy scan gates publish.

## The rule

**Never capture screenshots on a live-data site without first proving the view shows no real data.** Either the site is a clean/empty instance, or you have seeded a fake-data family and verified (by logging in as a fictional user) that the specific view renders only that family. A view you cannot make private is a view you do not shoot.

## What a pre-publication review must scrub (every image AND every caption)

Zero tolerance on all of these — a single hit is a re-shoot, not a patch:

- Real client / company names (in tables, breadcrumbs, cards, filters, project titles).
- Real staff names and emails (rosters, owners, approvers, assignees, "Hey, {name}" greetings, member lists).
- Real money and utilisation figures (budgets, billed/cost, margins, rates, heatmap percentages, revenue/profit).
- Document IDs that map to real records (invoice, Sales Order, quotation, timesheet, project IDs).
- Employee rosters and reporting hierarchies.
- Client briefs, project descriptions, notes, and email bodies containing real content.

## The one allowed exception pattern

A **verified support/security contact** (e.g. a published security-report address) may remain, because it is meant to be public. Verify it is the genuine, intended-public contact before keeping it — never assume. Everything else that looks real is scrubbed.

## The fix for a leaked screenshot is RE-CAPTURE on fake data — not blur or crop

Blur and crop are unreliable (a caption, a tooltip, an adjacent cell, or a later un-cropped copy leaks the same fact) and they leave the annotation misaligned. The correct fix is to seed the fake-data family, re-navigate the view as a fictional user, and re-shoot. Because re-capturing on new data shifts layout, expect to re-tune the annotation box coordinates for the new shot (see `references/capture.md`).

## Privacy scan as a blocking QA gate

Make the privacy scan its own QA lens, run as a blocking gate before any publish (in addition to the doc-QA and annotation-QA lenses):

- Inspect **every image and every caption/prose example** for the scrub list above. Judge the rendered pixels, not just the markdown — a real name in a screenshot is invisible to a text grep.
- A single confirmed hit blocks the whole publish and triggers a re-shoot of that surface.
- Captions carry figures too: reconcile every money/utilisation number in a caption against both the image and the seeded model, so a scrubbed caption never contradicts an unscrubbed image (or vice-versa).

## Where real data still hides after a naive scrub

- **Aggregate widgets** (site-wide counts, utilisation heatmaps, leadership KPIs) can show real totals even when every *named* record on the page is fake — they sum the whole site. These need a clean instance or a documented deferral (see `references/data-scoping.md`).
- **Blank-linked records** leak past a User Permission (see `references/data-scoping.md` — the blank-customer bypass).
- **Search / autocomplete / recent lists** surface real records the current view didn't intend to show — check dropdowns and command palettes, not just the main grid.
