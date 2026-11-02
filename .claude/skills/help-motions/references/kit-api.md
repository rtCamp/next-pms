# Motion files and the kit API

## A motion is three files

`<motionsDir>/<name>/`:

**`scenes.json`**

```json
{ "width": 1920, "height": 1080,
  "background": "#F4F4F5", "fonts": { "sans": { "family": "Inter" } },
  "scenes": [{ "id": "add-time", "name": "Add a time entry", "dur": 12.5,
               "desc": "One sentence saying what happens. It doubles as the alt text." }] }
```

- `dur` is the loop length in seconds: last beat plus the result hold.
- One scene per motion is the norm. Several scenes play back to back.
- Add no other keys. Nothing reads them.

**`base.css`**: the stage styles. Copy it from a motion on the same page. Class names are project conventions (see the profile). Rules may target the stage root as `#stage` (the scripts give the stage that id); the player scopes the whole file to its own stage, so motions never clash.

**`scene-<id>.js`**: plain JS, run with a `kit` variable in scope:

```js
const { seg, lerp, eo, ei, eio } = kit;
// shared SHELL block, verbatim
kit.scene('<id>', {
  init(kit) { /* build the DOM once */ },
  render(t) { /* set styles for time t (seconds) */ },
});
```

There are no imports, no assets, no images, no fonts as files, no network. Everything is DOM, inline SVG and CSS.

## The kit: the only API a scene may use

Anything not listed here doesn't exist, so write it inline in the scene. `check.mjs` fails a scene that calls kit API the project's kit doesn't have.

| API | Notes |
| --- | --- |
| `seg(t, a, b)` | Position of t between a and b, clamped to 0..1 |
| `lerp(a, b, k)` | Linear blend |
| `eo`, `ei`, `eio` | Cubic ease out / in / in-out, on 0..1 |
| `kit.stage` | The 1920×1080 stage element of this scene |
| `kit.h(html)` | **Returns a DocumentFragment.** Use it only inside `append(...)`, then `querySelector` what you need. To keep a reference, build the element with `document.createElement`. |
| `new kit.Camera(el)` | `.set([{ t, cx, cy, z, hold?, drift?: [dx, dy, dz] }])`, `.apply(t)`, `.at(t)` returns `{ cx, cy, z }`. It stays on a key for `hold` seconds, then eases in-out to the next. `drift` is per-second motion while holding. |
| `kit.cursor()` | `.el`, `.keys = [{ t, at: [x, y] }]` (eased between keys), `.clicks = [t, ...]` (press dip and click ripple), `.holds = [[a, b], ...]` (held press, e.g. drags), `.ewSpans = [[a, b], ...]` (left-right resize pointer), `.render(t)` |
| `kit.typist(text, start, cps)` | `.at(t)` returns the text typed so far; `.end` is when it finishes |
| `kit.scene(id, def)` | Registers the scene |

The reference implementation is `runtime/kit.js` in this skill. A project's own port (often `kit.ts`) must keep exactly this surface.

## Coordinates

- **Stage:** 1920×1080. The app window sits on a desk at the config's `window` box, usually 1440×900 at stage (240, 90).
- **Window coordinates** (inside the window element): use these for elements and rings.
- **Stage coordinates** (window + window origin): use these for cursor keys and camera keys. A helper `S(x, y) => [x + 240, y + 90]` keeps this straight.
- The camera transforms one "camera" element that holds the whole stage-sized scene: the desk, the window, and the cursor.

## Patterns that work

**Cursor on the camera, constant size**

```js
const cur = (this.cur = kit.cursor());
this.cam.el.append(cur.el);          // moves with the camera
cur.keys = [{ t: 0, at: S(700, 480) }, { t: 1.4, at: S(1210, 28) }];
cur.clicks = [1.8];
// render:
this.cur.render(t);
this.cur.el.style.transform += ` scale(${(1.1 / this.cam.at(t).z).toFixed(4)})`;
```

**Ring:** a 3 px border element 5 px outside the target, with radius = the target's radius + 3. Only one is visible at a time, and each fades in and out over 0.25 s. Ring ~0.4 s before the action. The result gets the last ring, held to the end.

**Hover follows the cursor.** Derive hover from the cursor's keyed path, not from flags set in time ranges. Then a scrub to any `t` is right:

```js
const [x, y] = this.cur.position(t);          // stage coords
const over = x > bx && x < bx + bw && y > by && y < by + bh;
el.style.background = over ? '#EDEDED' : 'transparent';   // or fade with the app's transition time
```

**Typing:** `const ty = kit.typist('Fix shipped', 6.1, 18)`. In render, set `field.textContent = ty.at(t)`. Show the caret from the click until the field blurs, blinking only while idle.

**Scrolling content:** translate the scrolled inner element by an eased amount between two times. The cursor rests over the area first, as a user's would.

**Retiming:** to slow down or shift beats in a finished scene, put a time-warp table at the top and start `render` with `t = warp(t)`, rather than editing every time value:

```js
const KNOTS = [[0, 0], [2, 2], [3.5, 2.6], [12, 11.1]];  // [new time, old time]
const warp = (t) => { for (let i = 1; i < KNOTS.length; i++) { const [a, oa] = KNOTS[i - 1], [b, ob] = KNOTS[i]; if (t <= b) return lerp(oa, ob, seg(t, a, b)); } return KNOTS[KNOTS.length - 1][1]; };
```

**Other pointer shapes:** the kit has only the arrow and the left-right resize pointer. For grab/grabbing, draw an open and a closed hand in the scene, follow `cur.position(t)`, and hide the arrow while it shows.

**Shared shell:** the sidebar, top bar and breadcrumb come from one `SHELL` block, delimited by marker comments (config `shell.begin` / `shell.end`) and pasted verbatim into every scene. It takes a page key (and optionally the scene's own Focus element for a top-bar button). Pages it doesn't know yet get added inside the block, the header version is bumped, and the block is re-pasted into every motion in the same change.

## Lessons that apply everywhere

- `this.x = kit.h(...)` followed by `this.x.style` crashes the player: it's a fragment.
- A fill drawn at width 0 still shows its padding. Hide it until it starts growing.
- When one dialog replaces another, hide the first completely; don't cross-fade.
- Render with the project's kit. A look-alike kit hides real bugs (`check.mjs` and `stills.mjs` always use the configured kit).
- Keys built from functions (`at: () => ...`) render nothing in the real kit. Keys are plain numbers.
