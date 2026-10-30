# <App name> motion profile

Project-specific knowledge for the help-motions skill. The skill's rules apply unless this file overrides them. Keep it current: every correction from the team and every page you measure lands here.

## Look

| Token | Value |
| --- | --- |
| Desk background | #F4F4F5 |
| Window | 1440×900 at stage (240, 90), white, radius 12, soft shadow |
| Ghost | #E8E8E8 |
| Landmark text | #7C7C7C |
| Ring | 3 px #3B82F6, 5 px outside, radius + 3, 0.25 s fades |
| Dialog backdrop | <colour/opacity + blur, measured from the app> |
| Font | <family> |

## Shared shell

Current version: v1. Paste the block below verbatim into every scene, between the markers.

```js
// ==== <App> shell v1 — identical in every motion. Measured from the running app (<date>). ====
// ...SHELL implementation and PAGES...
// ==== end shell ====
```

| Page key | Path in the app | Navigation state | Notes |
| --- | --- | --- | --- |

## Cast

- People:
- Projects / records:
- Customers:
- Dates:
- The signed-in viewer's own name never appears.

## Dev data

How to add test data to a local site when a state is missing: where to run it, where the data model is defined, and how to create records so the app's validation runs.

## Pages

One section per page that has a reference motion. Each section holds the measured layout, the pieces to reuse, and the behaviours that differ from the defaults (menus, dialogs, transitions).

## Rules and corrections

The project-specific rules the team has given, newest first. Each one says what to do and why.

## States built from code (unverified)

| Motion | State | Source file |
| --- | --- | --- |
