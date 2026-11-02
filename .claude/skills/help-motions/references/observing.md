# Observing and measuring the real app

A motion copies the app, so every Focus element and every behaviour comes from looking at the running app, not from memory or screenshots in docs.

## Ground rules

- **Read-only.** Never save, submit, approve, reject, delete or otherwise persist anything. Opening menus and dialogs and typing into fields is fine; then cancel, press Escape and reload.
- **Put things back.** Anything you change while observing (sort, pinned columns, column order, filters, view settings, starred items) goes back exactly as it was before you finish. Say in your hand-off what you changed and that you restored it.
- **Local site only.** The scripts refuse an `app.baseUrl` that isn't localhost, 127.0.0.1 or a `*.localhost` site. The URL comes from the user (see Setup in `SKILL.md`).
- **Sign-in by the user.** Run `node <skill>/scripts/login.mjs` in the background and ask the user to sign in in the window it opens. The session is saved for measure.mjs and lasts until it expires. Never ask for a password. Env vars (`MOTIONS_USER` / `MOTIONS_PASS` or what the config names) also work, but never write them into files, motions, logs or messages.
- **Missing states.** When the dev data can't reach a state (no rejected record, nothing pending):
  1. Ask the user whether to add test data for it. Name the records and the state they produce.
  2. With a yes, add it the way the profile's "Dev data" section describes. Before writing, read the data model: the record type's fields, which are required, its links and child tables, and the validation and status rules in its code. Look at one existing record for real values. Create the fewest records that reach the state, through the app's own create and status methods, never by forcing values into the database.
  3. List what was created in the hand-off and ask whether to delete it once the motion is done.
  4. With a no, or when the state only exists right after a save (a spinner, a toast), build it from the component's source (its markup, classes, text, toasts). Mark those states as unverified in the hand-off and in the profile, so someone can check them against the live app later.
- **Find where the action really lives.** It may sit on a dashboard card, a row menu or a detail panel rather than on a page of its own. If the help text names a different path, the app wins.

## measure.mjs

```bash
node <skill>/scripts/measure.mjs --url /projects \
  --sel "text=Create view" --sel "css=[data-testid=toolbar] button" --all \
  --steps "hover:text=Columns; wait:400" \
  --shot .motion-out/columns.png
```

- **Selectors** are Playwright selectors: `text=…`, `role=button[name='Add']`, `css=…`, or plain CSS. `--all` measures up to 30 matches.
- **Steps** run in order before measuring: `hover:SEL`, `click:SEL`, `press:KEY`, `wait:MS`, `scroll:SEL`. Use `click` only to open menus, popovers and dialogs.
- **Output** for each element:
  - the rect in app coordinates;
  - the x converted to window coordinates, for both left-anchored and right-anchored placement;
  - computed styles: colours, font, radius, borders, shadow, padding, gap, transition, cursor. Add more with `--props`.
- `--eval file.js` runs your own measuring script in the page and prints its result. Use it for bulk reads, such as every column header's x and width.
- `--json` gives machine-readable output.
- **Write blocking:** requests matching `app.blockMethods` or `app.blockUrls` are blocked and listed. Configure the app's write endpoints there, so a stray click can't save.
- **Viewport:** the default is the config's `app.viewport`, which matches the motion's window size, so measurements need no conversion.

Claude-in-Chrome or another browser tool works too, as long as it follows the same rules. Read rects and styles with JavaScript (`getBoundingClientRect`, `getComputedStyle`) rather than estimating from screenshots.

## What to record for a motion

- **Path:** the exact clicks from where the user lands to the result.
- **Geometry:** for every Focus element, plus the Ghost layout around it.
- **Text:** labels, placeholders, button text, toasts and confirm messages, exactly as the app shows them.
- **Behaviour:** for hover, focus and pressed states, record colours and transition times. Record how each menu, popover and dialog opens: placement, animation (or none), alignment, and what closes it. Note loading states, what stays open after a change, and the pointer shape.
- **Result:** what the page shows after the change, including any status or count that updates elsewhere.
- **Rules behind statuses:** when the result depends on business logic (a status rollup, a lock, a permission), read the code that computes it, cite the file in the scene's spec comment, and pick the scenario whose end state reads correctly.

Put page knowledge that the next motion will need, such as a page's layout, a dialog's geometry or a status rule, in the project profile, not in the scene.
