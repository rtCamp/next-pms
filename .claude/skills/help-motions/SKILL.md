---
name: help-motions
description: Makes, fixes, reviews and checks the short silent help animations ("motions") that show how to do one task in a web app, played as live DOM by a tiny kit. Use for any task that creates or changes a motion, its scene code, the shared shell or page pieces, the motion kit or player, or that needs to measure the real app for a motion.
---

# Help motions

A **motion** is a short, silent, looping animation that shows how to do one task on one page of an app. It plays inside the app (a help panel, an empty state, an onboarding card) as live DOM, not video: a few KB of scene code on a tiny runtime, the **kit**. It is a distilled wireframe of the real page:

- **Focus:** the controls the task uses, drawn exactly as in the app.
- **Landmark:** at most two muted words that say where you are.
- **Ghost:** grey shapes for everything else.

A cursor does the task, one ring marks the next target, and a camera pushes in and out.

This skill is project-independent. Everything about one particular app (paths, login, the shared shell, colours, the cast of fake people, page knowledge) lives in that project's **profile** and **config**, not here.

## Before anything else

1. **Read the project config:** `.claude/help-motions/config.json` at the project root. No config? The project hasn't adopted motions yet; follow `references/new-project.md`.
2. **Read the project profile** (`profile` in the config, usually `.claude/help-motions/PROFILE.md`). It holds the shell, colours, cast, page notes and corrections the team has made. Profile rules override the defaults in this skill.
3. **Read the reference you need:**

| Doing | Read |
| --- | --- |
| Writing or fixing scene code | `references/kit-api.md`, then `references/authoring.md` |
| Looking at the real app, measuring it | `references/observing.md` |
| Reviewing a motion | `references/authoring.md` (rules and review checklist) |
| Adding motions to a new project, or embedding the player | `references/new-project.md` |

## Setup

Check these before the first script run. Ask the user before installing anything.

| Needs | Check | If missing |
| --- | --- | --- |
| Node 18+ | `node -v` | Ask the user to install or switch to it |
| Playwright in the project | the scripts say so when it's missing | Ask, then run the project's install (or `npm i -D playwright`) |
| A browser | the scripts try `browser.channel` (e.g. installed Chrome), then Playwright's Chromium | Ask, then run `npx playwright install chromium` |
| The local site URL (measure.mjs, login.mjs) | `app.baseUrl` in `.claude/help-motions/config.local.json` | Ask the user for it and write `{ "app": { "baseUrl": "<url>" } }` to that file, which is git-ignored |
| A signed-in session (measure.mjs) | measure.mjs says when it needs a login | Run `login.mjs` and let the user sign in in its window. Never ask for a password |

Only the URL and per-machine browser paths go in `config.local.json`. Never write personal details (URLs, emails, names, local paths) into `config.json`, the profile, motions or skill files, since they are committed.

## Tools

Node scripts in `scripts/`. They need Node 18+ and Playwright in the project (and esbuild or typescript if the kit is TypeScript; they use the project's copies). Run them from anywhere inside the project; they find the config by walking up.

| Script | What it does |
| --- | --- |
| `node <skill>/scripts/stills.mjs <motion> --every 0.5 --sheet` | Renders stills with the project's kit and a contact sheet. **Look at them** (Read the PNGs). Prints scene errors; exit 1 if the scene threw. |
| `node <skill>/scripts/check.mjs [motion...]` | Automated checks on all (or named) motions: renders every 0.5 s without errors, scenes.json vs files, kit API used exists, cursor keys plain `[x, y]`, cursor inside the camera, zoomed camera stays inside the window, beats after `dur`, shared shell identical everywhere. |
| `node <skill>/scripts/compare.mjs <motion> --ref HEAD` | Pixel diff against the last commit (or `--against <folder>`, `--scene <file>`). Use it to prove a shared change left other motions untouched, or to see what moved. |
| `node <skill>/scripts/preview.mjs` | Local player at http://127.0.0.1:4321 with scrubber, 0.25×/0.5× speed, frame stepping, `?t=3.2` to open paused, `&grid` for a 10 px grid in window coordinates, and a pointer readout in scene coordinates. Reloads when files change. |
| `node <skill>/scripts/login.mjs` | Run it in the background when measure.mjs says the app needs a login. It opens the local app in a visible browser, the user signs in there, and the session is saved for measure.mjs. Never ask for a password. |
| `node <skill>/scripts/measure.mjs --url /path --sel "text=Save"` | Opens the real app (local sites only, using the login.mjs session or env vars), runs optional `--steps "hover:…; click:…; press:Escape"`, prints rects (converted to window x) and computed styles, `--shot` screenshots. Blocks write requests. |

Outputs go to `<project>/.motion-out/` by default; keep that folder out of git.

## Workflow

1. **Understand the task.** Which page, which steps, what result the user sees at the end. If the help text that goes with the motion says something different from the app, the app wins; note the corrected text.
2. **Watch the real app do it** (`references/observing.md`). Measure positions and styles at the motion's window size (the config's viewport), read hover states and each control's CSS `transition` and `cursor`, see how menus and dialogs open and close, and what the page shows after saving. Never save or submit anything in the app. When the dev data lacks a state, follow "Missing states" in `references/observing.md`.
3. **Reuse first.** Before drawing anything, find an existing motion on the same page, a related page, or with the same dialog, and copy its pieces. Copy the shared shell block verbatim. Consistency between motions beats a fresh measurement; if a shared piece is wrong, fix it in every motion in one change.
4. **Plan the beats** with the pacing table (`references/authoring.md`). Put a short spec comment at the top of the scene: task, steps, landmarks, result.
5. **Build** from `templates/scene-template.js` or the motion you're copying. Set `scenes.json` `dur` to where the result hold ends.
6. **Look at stills** (`stills.mjs --every 0.5 --sheet`, plus every beat). Common misses: a zero-width fill showing its padding, one dialog showing through the one that replaces it, truncated labels, the cursor off its target, desk showing beside a zoomed window, a kit feature that doesn't exist.
7. **Compare** at least one still with a real screenshot of the same spot (`measure.mjs --shot`).
8. **Run `check.mjs`** and fix every error. Go through the review checklist.
9. **Record what you learned.** A new rule that applies to any app goes into this skill's references; anything about this app (a page's layout, a status rule, a correction from the team) goes into the project profile.

## Hard rules (the ones that break things)

- A scene may use only what the kit provides (`references/kit-api.md`). Anything else must be written inline in the scene.
- `kit.h(html)` returns a DocumentFragment. Append it, then query the elements; never keep it in a field and set `.style` on it.
- The cursor is appended to the camera element, its keys are plain `[x, y]` numbers in stage coordinates, and after `cur.render(t)` its transform gets `scale(1.1 / z)`.
- `render(t)` is a pure function of `t`: any time, in any order, gives the same frame. Hover states, typing and scrolling are all derived from `t`.
- The shared shell block is byte-identical in every scene and equal to the project's `shellFile`. Change the file, paste the block into every scene, run `check.mjs` and `compare.mjs` on every motion.
- Never show real or dev data, credentials or the viewer's own name on screen; use the profile's cast.
- Always check with the project's own kit (the scripts do). A stand-in kit hides real bugs.
