# Adopting motions in a project

## 1. Files

```
.claude/skills/help-motions/        this skill, copied as is (no project details inside)
.claude/help-motions/config.json    from templates/config.json, edited
.claude/help-motions/config.local.json  per developer, git-ignored: { "app": { "baseUrl": "…" } }
.claude/help-motions/PROFILE.md     from templates/PROFILE.md, filled in as you learn the app
<motionsDir>/<name>/                one folder per motion: scenes.json, base.css, scene-<id>.js
<kit>                               the runtime the app plays motions with
```

Add `.motion-out/` and `.claude/help-motions/config.local.json` to `.gitignore`. The scripts write stills, sheets and diffs to `.motion-out/`. `config.local.json` is merged over `config.json` and holds what differs per developer, so nothing personal is committed.

## 2. Config

| Key | Meaning |
| --- | --- |
| `motionsDir` | Folder of motion folders, relative to the project root |
| `kit` | The project's kit file (`.js` ESM or `.ts`). If missing, the scripts use this skill's `runtime/kit.js` and say so |
| `profile` | The project profile |
| `stage`, `window` | Stage size and the app window's box on the stage, in stage pixels |
| `shell.begin` / `shell.end` | Regex for the shell block's first line, and its exact end line |
| `shellFile` | The canonical shell block (e.g. `.claude/help-motions/shell.js`). `check.mjs` requires every scene's block to equal it. Without it, the most common block wins. |
| `fontCss` | Optional stylesheet URL for the app font, so stills match |
| `browser.executablePath` | Optional Chromium path, if Playwright's own isn't installed (`HELP_MOTIONS_CHROMIUM` overrides) |
| `themeCss` | Optional CSS file whose `:root` and `.dark` blocks define the colour tokens motions use (`var(--color-…)`). The scripts add those blocks to the page they render on. |
| `browser.channel` | Optional installed browser to use instead, such as `"chrome"`, so no Playwright browser download is needed |
| `app.baseUrl` | Where the developer's local app runs. Goes in `config.local.json`, never in `config.json` |
| `app.viewport` | The desktop size to measure at |
| `app.login` | `{ "type": "form", url, userSelector, passSelector, submitSelector, userEnv, passEnv }`, or `{ "type": "request", url, body: { "usr": "$USER", "pwd": "$PASS" }, check }` for an API login. `check` is a URL that fails when logged out. login.mjs needs `check`, and opens `page` (default `/login`) for the user to sign in. |
| `app.blockMethods`, `app.blockUrls`, `app.allowUrls` | The read-only guard for measure.mjs. Block the app's write endpoints by regex, and allow the login endpoint. |

## 3. Runtime in the app

Copy `runtime/kit.js` (and `runtime/player.js` if the app has no player) into the app's source. A TypeScript port is fine, but keep exactly the same API. Then point `config.kit` at it.

The player mounts one motion in a container:

```js
import { createKit } from "./kit.js";
import { mountMotion } from "./player.js";
const player = mountMotion(el, { createKit, scenes, css, code: { [id]: sceneText } });
// player.pause(), .play(), .seek(t), .destroy()
```

With Vite, a registry can load the files raw:

```js
const files = import.meta.glob("./motions/*/*", { query: "?raw", import: "default", eager: false });
```

Load `scenes.json`, `base.css` and the scene files on demand when the help entry opens. Keep motions out of the main bundle.

A React wrapper mounts in `useEffect` and calls `destroy()` on cleanup. On top of the player, it adds:

- play/pause, replay and progress controls on hover or focus;
- an `onError` fallback to the text help;
- the `desc` as the accessible label.

The player already does the rest:

- loops while visible;
- pauses off screen and in hidden tabs;
- starts paused on the last frame for people who prefer reduced motion.

## 4. Playwright

The scripts need `playwright` (or `@playwright/test`) installed in the project:

```bash
npm i -D playwright && npx playwright install chromium
```

`browser.channel: "chrome"` uses an installed Chrome instead of the download. The scripts fall back to Playwright's Chromium when the channel can't start.

If the kit is TypeScript, they also need `esbuild` or `typescript` from the project. Vite projects already have esbuild.

## 5. First motions

1. **Measure the app frame.** Measure the navigation, top bar and breadcrumb at the window size with `measure.mjs` (and `--eval` for bulk reads). Write them as the `SHELL` block, Ghost except the breadcrumb Landmark. Record each page's sidebar state and top-bar layout as a `PAGES` entry. Put the block in the profile and in the first scene.
2. **Make the reference motion for a page.** The first motion on a page measures it fully and becomes that page's reference. Later motions on the page copy its pieces.
3. **Fill the profile as you go.** Add colours, cast, page notes, dialog geometry, status rules and every correction the team makes.
4. **Run `check.mjs` on every change.** Use `compare.mjs --ref HEAD` on all motions after any shared change.
