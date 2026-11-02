# Authoring rules

Defaults that make motions look like one set. The project profile can override any value here (colours, ring, timing), and its overrides win.

## Abstraction

| Level | What | Drawn as |
| --- | --- | --- |
| Focus | Every step target, everything that changes state, the result | Exactly as the app: real text, colours, icons, sizes |
| Landmark | At most 2: the breadcrumb, a page title, a column or row name | Real words, muted (#7C7C7C), no icons |
| Ghost | Everything else | Grey (#E8E8E8) shapes |

- No element is half real.
- If a target is an icon whose meaning comes from its label (a star on a named row, a + next to "Updates"), the label is Focus too.

## Ghost shapes

| Element | Shape |
| --- | --- |
| Text | 10 px pill, radius 5, real width, centred on its line |
| Secondary text | 8 px pill, radius 4 |
| Numbers in grid cells | About 32×8 pill, centred on the column (totals about 40×8) |
| Text in table cells | Text pill at the cell's real left x (tables are left-aligned, grids are centred) |
| Icon | 14 px square, radius 4 |
| Avatar | Circle |
| Buttons, inputs, badges, cards | Their real box |

## Pacing

Paced for someone who has never used the app, with no minimum length and no padding. A single drag can be about 6 s; a dialog flow about 15 s. A flow that runs past about 20 s probably holds two tasks; consider splitting it.

| Beat | Timing |
| --- | --- |
| Ring before the action | About 0.4 s |
| Cursor travel | 0.6–0.8 s |
| Hover rest before something opens | About 0.4 s |
| Reading a message the motion is about | About 1.5–2 s, ringed |
| Typing | About 18 characters per second, under 30 characters. Only characters a user can type on a normal keyboard (no ·, curly quotes, em dashes). |
| Hold after a change | 0.5–0.8 s |
| Loading state the app shows | About 0.5–0.7 s |
| Result | Ringed, held about 2–3 s from when it appears, then the loop ends |

## Camera

- Open on the whole window at about 1.1×. The desk shows around it; that's intended.
- Push to the first target at about 2×. Reframe on a dialog at 1.9–2.2× so the fields in use fit.
- Go from the opening view straight to the target in one segment. An extra key in between (zoom, stop, then move) reads as a jerk, because every key eases to a stop. To satisfy the window rule, move the target key's centre instead of adding a key.
- Once zoomed past the window's width (z ≥ stage width / window width, about 1.34), keep the frame inside the window: `cx ± 960/z` and `cy ± 540/z` stay within the window's stage box, including during eased moves. Never show a band of desk beside a zoomed window; move the centre or lower z if the targets don't fit. `check.mjs` reports it.
- If the result lands outside the visible part of a list or table, scroll it into view the way a user would: the cursor rests on the area and the content scrolls with an eased motion. Don't cut to it.
- Eased moves only, with slow drift on holds. No cuts within a task.
- End on the result.

## Cursor

- Use the pointer shape the app's CSS uses. grab/grabbing becomes an open and a closed hand drawn in the scene; col-resize becomes `ewSpans`; anything else, including `pointer`, stays the arrow.
- Every click gets the click ring (`clicks`). Every held press also gets a click at its start. Where a hand is drawn, the hand closing is the mark instead.
- Keep the cursor off text the viewer needs to read.

## Controls behave like the app

- Copy the app's transitions. Read each control's computed `transition`: hover backgrounds that fade over 0.15 s fade over 0.15 s, icons that swap instantly swap instantly. Nothing pops that fades in the app.
- Hover states follow the cursor's path, worked out in `render` (see kit-api.md).
- Copy each menu's and popover's own placement and opening; measure it. Many open instantly, with no animation, aligned to one edge of the trigger; some open over the trigger with the selected item on top of it. Never assume one style for all menus. A differently styled menu gets its own class.
- A dialog that replaces another swaps without a cross-fade.
- No hover tooltips, unless the tooltip is what the motion teaches. Even when the app shows one on hover, the cursor rests about 0.4 s and clicks.
- Show the loading state the app shows between an action and its result (spinner, dimmed table, disabled button), briefly.
- Text fields: a focused empty field shows the caret before the placeholder, and the placeholder hides only when the first character appears.
- Copy a control's variant from the dialog it's in, not from a similar control elsewhere. The same component can be outline in one dialog and subtle in another.

## Story

- **Start state:** draw the page as a user normally reaches it (opened from the navigation, with its default filters and view), including controls that state shows.
- **Teach the trap when there is one.** If the obvious path fails (a locked field, a disabled button with a hint), show the user trying it, ring the app's own message long enough to read, then do it the right way.
- **The data explains the story.** If the motion fixes something, the start data shows why it needed fixing (6 hours logged on a day that should have 8, then corrected to 8), and every number agrees before and after (totals included).
- **Finish the task.** Go through the save, confirm or drop, and end on the visible result, never on an open dialog. If the app leaves a panel or popover open after the change, close it the way the app does (its trigger again, Escape, a click outside) before showing the result.
- **One outcome per motion.** A variant (a partial approval, a rejection) gets its own motion.
- **Status rules come from the code.** When the result is a status (a badge, a rolled-up state), derive it from the app's actual logic and pick the scenario whose end state reads correctly. Don't show a status that would mislead a viewer about what happened, even if a different data setup could produce it.
- **Removals:** when the result is something gone, ring the place it was, and use the neighbour that moves in as the landmark.

## Layout and geometry

- Keep measured sizes. When content doesn't fit, scroll or slide it (clip the area and offset it), never narrow measured cells or columns to make it fit.
- Measure with the browser viewport set to the motion's window size (the config's `app.viewport` equals `window`), so every number is used as measured, with no conversion. A motion shows the idea of the task, so the project profile may ask to keep toolbars on one line and tables inside the window by narrowing Ghost widths, even where the app wraps or overflows at that size.

## Data and cast

- The page is never empty.
- Use the project profile's cast of fictional people, projects, customers and dates. Add to the cast in the profile; don't invent names inside one scene. Names are full names from many cultures, never "John Doe".
- Never real data, dev data, emails, credentials or the signed-in viewer's own name. Where the viewer authors the result (a new comment, update or note), the author's name is a Ghost pill.
- Pick numbers that read well (a Full 8 h day lowered to 4 h; 32:00 becoming 40:00).

## Review checklist

- [ ] Focus, Landmark and Ghost are applied correctly; at most two landmarks.
- [ ] The shell and reused pieces are identical to the other motions (`check.mjs`).
- [ ] The cursor lands on every control, at every zoom, and doesn't cover text being read.
- [ ] Every control behaves as in the app: placement, opening, transitions, pointer shape.
- [ ] The story makes sense: the start data explains the action, the end status is what the app would show.
- [ ] The numbers agree before and after.
- [ ] No beat is padded; no step is rushed.
- [ ] The zoomed frame never shows the desk (`check.mjs`).
- [ ] The result is ringed and readable.
- [ ] Stills were rendered with the project's kit and looked at, and one was compared with a real screenshot.
- [ ] States built from code instead of observed are listed in the hand-off.
