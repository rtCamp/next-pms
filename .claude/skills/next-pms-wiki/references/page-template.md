# Feature-page template & legend rules

Every wiki page uses the same six sections in this fixed order. Copy the skeleton, fill each `<...>` placeholder, and follow the rules below. The template is adapted from the `fse-*` block-manual template, retuned for the SPA and for a two-audience (end user + admin) reader.

## The skeleton

```
# <Feature name>

## Introduction
<What it is, who uses it, when — 2 to 4 lines. Name the audience (employee / PM / admin) and the SPA route.>

## What you can do
<One ### subsection per panel / section / modal. Each is a two-column table of the controls in that surface:>

### <Panel or modal name>
| Control | Description |
|---|---|
| **<verbatim UI label>** | <what it does> |

## How to use
<A numbered workflow. The final step is the primary action — Save / Submit / Publish / Allocate / Add.>
1. <step>
2. <step>
...
N. <primary action>

## Behaviour & states
<Empty states, loading, permission-gated variants, success/error toasts. Cover at least the common empty state.>

## Roles & permissions
<Which roles see this page and any per-role differences. Cite the role model (§6 / references/coverage.md) — document the intended model, not a test account's inflated roles.>

## Screenshots
<One ### per captured surface: the image embed, then a numbered legend.>

### <Surface name>
![<alt text>](public/<slug>/<slug>-<variant>.png)
1. **<verbatim UI label>** — <description>.
2. **<verbatim UI label>** — <description>.
...
```

## Filename & embed conventions

- **Page filename** = the feature title with spaces → hyphens (GitHub-wiki convention): `Team-Timesheet.md`, `Projects-List-&-Kanban.md`.
- **Image embed** uses a relative wiki path: `![<alt>](public/<slug>/<slug>-<variant>.png)`, matching the existing wiki's `![](public/...png)` style. `slug` = the page slug (e.g. `timesheet-team`); `variant` = the surface (e.g. `overview`, `addtime`, `approve`).
- Images ship into the wiki repo under `public/<area>/`; the clean sources are archived repo-external so a later box fix re-runs `annotate.py` without re-shooting.

## Numbered-legend rules (the load-bearing part)

The legend is why the screenshot teaches anything, so these are strict:

- **Format:** `N. **<verbatim UI label>** — <description>.` Bold the literal on-screen label; the number `N` matches the box drawn on that surface.
- **One numbering shared with the boxes.** Every box number appears exactly once in the legend, and every legend number is drawn on ≥1 box — nothing numbered that isn't listed, nothing listed that isn't drawn. A number MAY repeat across several boxes only when its legend item names a **group of same-type controls** (e.g. one "column headers" item over several header boxes).
- **Labels verbatim from the live screen.** Quote UI labels exactly as they appear — interior spacing, trailing punctuation (a trailing colon), casing. Cross-check against source constants (`constants.ts`, `columns.ts`, `schema.ts`), but **if the live screen and a constant disagree, the screen wins** — the reader sees the screen.
- **English, no hard-wrapping.** Prose in English; one physical line per paragraph or bullet (soft-wrap only). No manual mid-sentence line breaks.

## What must never appear

- **No AI / tooling attribution** anywhere on the page.
- **No developer / API / architecture detail** — no whitelisted endpoints, no store internals, no doctype field names as such. This wiki is user- and admin-facing. If a page would need to reference an excluded rtCamp-internal feature (RAG stats, Reports), omit the reference entirely.

## Worked labelling notes (from the first pages)

- **Personal Timesheet:** the breadcrumb is "Timesheets" (plural), then a "Personal" view selector. Add-time-off dialog title is "Add time off"; fields From / To (two columns), "Leave duration" (Full Day / First Half / Second Half), "Leave type", "Reason", submit "Add time-off". Submit dialog: "Note" (optional), "Send to" (required approver), "Submit". The submit-dialog total can read `00:00` when the week's hours are time-off only (grid Total `36:00` = leave) — describe it neutrally, don't call it a bug.
- Where a modal has side-by-side fields (Date | Duration), the legend still numbers each field separately, matching the two column boxes.
