// Shared helpers for the help-motions scripts. Node 18+, no dependencies of
// its own: Playwright (and esbuild or typescript, for a .ts kit) are loaded
// from the project the scripts run in.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CONFIG_REL = ".claude/help-motions/config.json";

// ---------- args ----------

/** --key value / --flag / positional. Repeated keys collect into arrays. */
export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { out._.push(a); continue; }
    const [k, inline] = a.slice(2).split(/=(.*)/s);
    const v = inline !== undefined ? inline : argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    if (k in out) out[k] = [].concat(out[k], v);
    else out[k] = v;
  }
  return out;
}

export const list = (v) => (v === undefined || v === true ? [] : [].concat(v));

/** "0,1.5,3" or every=0.5 → sorted unique numbers within [0, dur]. */
export function parseTimes({ times, every }, dur) {
  let ts = [];
  if (times !== undefined && times !== true) ts = String(times).split(",").map(Number);
  if (every !== undefined) {
    const step = Number(every) || 0.5;
    for (let t = 0; t < dur - 1e-6; t += step) ts.push(+t.toFixed(3));
    ts.push(dur);
  }
  if (!ts.length) ts = [0, +(dur / 2).toFixed(2), dur];
  return [...new Set(ts.filter((t) => Number.isFinite(t)).map((t) => Math.min(Math.max(t, 0), dur)))].sort((a, b) => a - b);
}

export function die(msg, code = 1) {
  console.error(`help-motions: ${msg}`);
  process.exit(code);
}

// ---------- config ----------

const DEFAULTS = {
  motionsDir: "motions",
  kit: null,
  profile: ".claude/help-motions/PROFILE.md",
  shellFile: null,
  stage: { width: 1920, height: 1080 },
  window: { x: 240, y: 90, width: 1440, height: 900 },
  shell: { begin: "^// ==== .*shell", end: "// ==== end shell ====" },
  fontCss: null,
  themeCss: null,
  browser: { executablePath: null },
  app: {
    baseUrl: null,
    viewport: { width: 1920, height: 1080 },
    login: null,
    blockMethods: ["PUT", "PATCH", "DELETE"],
    blockUrls: [],
    allowUrls: [],
  },
};

function merge(a, b) {
  if (!b || typeof b !== "object" || Array.isArray(b)) return b === undefined ? a : b;
  const out = { ...a };
  for (const k of Object.keys(b)) out[k] = a && typeof a[k] === "object" && !Array.isArray(a[k]) ? merge(a[k], b[k]) : b[k];
  return out;
}

/** Finds the project root (the folder holding .claude/help-motions/config.json) from cwd upward. */
export function loadConfig(args = {}) {
  let file = args.config && args.config !== true ? path.resolve(args.config) : null;
  if (!file) {
    let dir = process.cwd();
    for (;;) {
      const f = path.join(dir, CONFIG_REL);
      if (fs.existsSync(f)) { file = f; break; }
      const up = path.dirname(dir);
      if (up === dir) break;
      dir = up;
    }
  }
  if (!file) {
    die(`no ${CONFIG_REL} found from ${process.cwd()} upward. Copy ${path.join(SKILL_DIR, "templates/config.json")} there and edit it (see references/new-project.md).`);
  }
  const root = path.resolve(path.dirname(file), "..", "..");
  // config.local.json holds per-developer values (app.baseUrl) and stays out of git.
  const local = path.join(path.dirname(file), "config.local.json");
  const cfg = merge(merge(DEFAULTS, JSON.parse(fs.readFileSync(file, "utf8"))), fs.existsSync(local) ? JSON.parse(fs.readFileSync(local, "utf8")) : undefined);
  return { root, cfg, file, abs: (p) => (p ? path.resolve(root, p) : p) };
}

// ---------- project modules ----------

export function requireFromProject(root, names) {
  const req = createRequire(path.join(root, "noop.js"));
  const tried = [];
  for (const n of [].concat(names)) {
    try { return req(n); } catch (e) { tried.push(n); }
    // Common monorepo layout: tools live in a frontend/ or web/ workspace.
    for (const sub of ["frontend", "web", "app", "client"]) {
      try { return createRequire(path.join(root, sub, "noop.js"))(n); } catch {}
    }
  }
  return null;
}

export async function launchBrowser(ctx, { headless = true } = {}) {
  const pw = requireFromProject(ctx.root, ["playwright", "@playwright/test", "playwright-core"]);
  if (!pw) die("Playwright isn't installed in this project. Ask the user before installing it (npm i -D playwright, or the project's install command if it already lists Playwright).");
  const executablePath = process.env.HELP_MOTIONS_CHROMIUM || ctx.cfg.browser?.executablePath || undefined;
  const channel = ctx.cfg.browser?.channel;
  const opts = { headless, executablePath, args: ["--no-sandbox", "--font-render-hinting=none"] };
  // The configured browser (e.g. installed Chrome) first, then Playwright's own Chromium.
  if (channel && !executablePath) {
    try { return await pw.chromium.launch({ ...opts, channel }); } catch {}
  }
  try {
    return await pw.chromium.launch(opts);
  } catch {
    die(`no browser found${channel ? ` (tried "${channel}" and Playwright's Chromium)` : ""}. Ask the user before running npx playwright install chromium, or set browser.executablePath in config.local.json.`);
  }
}

/** The config's app, refusing any site that isn't on this machine so a script never touches a live site. */
export function localApp(cfg) {
  if (!cfg.app.baseUrl) die('app.baseUrl isn\'t set. Ask the user for their local site URL and write it to .claude/help-motions/config.local.json as { "app": { "baseUrl": "<url>" } }.');
  const host = new URL(cfg.app.baseUrl).hostname;
  if (host !== "localhost" && host !== "127.0.0.1" && !host.endsWith(".localhost")) {
    die(`app.baseUrl ${cfg.app.baseUrl} isn't a local site. Point it at localhost, 127.0.0.1 or a *.localhost site.`);
  }
  return cfg.app;
}

/** Where the logged-in session from login.mjs is kept. */
export function authStateFile(app) {
  return path.join(os.tmpdir(), `help-motions-auth-${Buffer.from(app.baseUrl).toString("hex").slice(0, 40)}.json`);
}

// ---------- kit ----------

/** Returns browser JS that defines `window.__MotionKit = { createKit, ... }`, and which kit was used. */
export function kitScript(ctx) {
  const wanted = ctx.abs(ctx.cfg.kit);
  let file = wanted && fs.existsSync(wanted) ? wanted : path.join(SKILL_DIR, "runtime/kit.js");
  const note = wanted && file !== wanted ? `project kit ${ctx.cfg.kit} not found; using the skill's runtime/kit.js` : null;
  const src = fs.readFileSync(file, "utf8");
  const isTs = /\.tsx?$/.test(file);

  const esbuild = requireFromProject(ctx.root, "esbuild");
  if (esbuild) {
    const out = esbuild.transformSync(src, { loader: isTs ? "ts" : "js", format: "iife", globalName: "__MotionKit", target: "es2020" });
    return { js: out.code, file, note };
  }
  if (isTs) {
    const ts = requireFromProject(ctx.root, "typescript");
    if (!ts) die(`the kit ${file} is TypeScript and neither esbuild nor typescript is installed in the project.`);
    const cjs = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    return { js: `var __MotionKit=(function(){var exports={},module={exports};${cjs}\nreturn module.exports;})();`, file, note };
  }
  // Plain ESM .js: drop the export keywords and collect the names.
  const names = [...src.matchAll(/^export\s+(?:const|let|var|class|function)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  const body = src.replace(/^export\s+(?=(const|let|var|class|function)\b)/gm, "");
  return { js: `var __MotionKit=(function(){${body}\nreturn {${names.join(",")}};})();`, file, note };
}

// ---------- motions ----------

export function motionsDir(ctx) {
  return ctx.abs(ctx.cfg.motionsDir);
}

export function listMotions(ctx) {
  const dir = motionsDir(ctx);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, "scenes.json")))
    .map((d) => d.name)
    .sort();
}

/** name (folder in motionsDir) or a path to a motion folder. */
export function loadMotion(ctx, nameOrPath, overrides = {}) {
  let dir = path.resolve(nameOrPath);
  if (!fs.existsSync(path.join(dir, "scenes.json"))) dir = path.join(motionsDir(ctx), nameOrPath);
  if (!fs.existsSync(path.join(dir, "scenes.json"))) throw new Error(`no motion "${nameOrPath}" (looked for scenes.json in ${dir}). Known: ${listMotions(ctx).join(", ") || "none"}`);
  const read = (f) => (overrides[f] !== undefined ? overrides[f] : fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), "utf8") : null);
  const scenes = JSON.parse(read("scenes.json"));
  const code = {};
  for (const sc of scenes.scenes ?? []) {
    const f = `scene-${sc.id}.js`;
    const text = read(f);
    if (text == null) throw new Error(`${dir}: scenes.json lists "${sc.id}" but ${f} is missing`);
    code[sc.id] = text;
  }
  return { name: path.basename(dir), dir, scenes, css: read("base.css") ?? "", code, total: (scenes.scenes ?? []).reduce((s, x) => s + (x.dur ?? 0), 0) };
}

// ---------- page ----------

const esc = (s) => JSON.stringify(s).replace(/</g, "\\u003c");

/**
 * A page that plays the motion like the player does, instrumented for the
 * scripts: window.__m = { total, render(T), kitKeys, cameras, cursors }, window.__errors.
 */
/** The `:root` and `.dark` token blocks of the project's theme CSS, so motions written with `var(--color-…)` render. */
function themeTokens(ctx) {
  const file = ctx.abs(ctx.cfg.themeCss);
  if (!file) return "";
  if (!fs.existsSync(file)) die(`themeCss ${ctx.cfg.themeCss} not found.`);
  const src = fs.readFileSync(file, "utf8");
  return [":root", ".dark"].map((sel) => {
    const start = src.search(new RegExp(`(^|\\s)${sel.replace(".", "\\.")}\\s*\\{`));
    if (start < 0) return "";
    let depth = 0, i = src.indexOf("{", start);
    const open = i;
    for (; i < src.length; i++) { if (src[i] === "{") depth++; else if (src[i] === "}" && --depth === 0) break; }
    return sel + src.slice(open, i + 1);
  }).join("\n");
}

export function buildPage(ctx, motion, { extraHead = "", extraBody = "", stageCss = "" } = {}) {
  const kit = kitScript(ctx);
  const theme = themeTokens(ctx);
  const W = motion.scenes.width ?? ctx.cfg.stage.width;
  const H = motion.scenes.height ?? ctx.cfg.stage.height;
  const fam = motion.scenes.fonts?.sans?.family ?? "system-ui";
  const fontLink = ctx.cfg.fontCss ? `<link rel="stylesheet" href="${ctx.cfg.fontCss}">` : "";
  return {
    kit,
    html: `<!doctype html><html><head><meta charset="utf-8">${fontLink}
<style>html,body{margin:0;background:#fff}#stage{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${motion.scenes.background ?? "#F4F4F5"};font-family:'${fam}',system-ui,sans-serif;--sans:'${fam}',system-ui,sans-serif}${stageCss}</style>
<style>${theme}</style><style>${motion.css}</style>${extraHead}</head><body><div id="stage"></div>
<script>window.__errors=[];addEventListener("error",e=>__errors.push(String(e.message||e)));addEventListener("unhandledrejection",e=>__errors.push(String(e.reason)));</script>
<script>${kit.js}</script>
<script>
(function(){
  var S=${esc(motion.scenes)}, CODE=${esc(motion.code)};
  var stage=document.getElementById("stage"), cams=[], curs=[], defs=[];
  var kitKeys=Object.keys(__MotionKit.createKit(document.createElement("div")));
  (S.scenes||[]).forEach(function(sc){
    var holder=document.createElement("div"); holder.style.cssText="position:absolute;inset:0;display:none"; stage.appendChild(holder);
    var kit=__MotionKit.createKit(holder);
    var Cam=kit.Camera; kit.Camera=class extends Cam{constructor(el){super(el);cams.push({scene:sc.id,cam:this});}};
    var mk=kit.cursor; kit.cursor=function(){var c=mk.apply(kit,arguments);curs.push({scene:sc.id,cur:c});return c;};
    try{
      new Function("kit",CODE[sc.id]+"\\n//# sourceURL=scene-"+sc.id+".js")(kit);
      var def=kit.scenes.get(sc.id); if(!def) throw new Error("scene did not call kit.scene('"+sc.id+"', ...)");
      if(def.init) def.init.call(def,kit);
      defs.push({id:sc.id,def:def,holder:holder,dur:sc.dur||0});
    }catch(e){__errors.push(sc.id+": "+(e&&e.stack||e));}
  });
  var total=defs.reduce(function(s,d){return s+d.dur;},0);
  function render(T){
    var start=0, shown=false;
    defs.forEach(function(d,i){
      var last=i===defs.length-1, on=(T>=start&&T<start+d.dur)||(last&&!shown&&T>=start);
      d.holder.style.display=on?"block":"none";
      if(on){shown=true; try{d.def.render.call(d.def,Math.min(T-start,d.dur));}catch(e){__errors.push(d.id+" @"+T.toFixed(2)+": "+(e&&e.message||e));}}
      start+=d.dur;
    });
  }
  window.__m={total:total,scenes:defs.map(function(d){return {id:d.id,dur:d.dur};}),render:render,kitKeys:kitKeys,cameras:cams,cursors:curs};
  render(0); window.__ready=true;
})();
</script>${extraBody}</body></html>`,
  };
}

/** Opens a motion page in a fresh browser page sized to the stage. */
export async function openMotion(browser, ctx, motion, opts = {}) {
  const { html, kit } = buildPage(ctx, motion, opts);
  const W = motion.scenes.width ?? ctx.cfg.stage.width;
  const H = motion.scenes.height ?? ctx.cfg.stage.height;
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: opts.scale ?? 1 });
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(e.message));
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  const tmp = path.join(os.tmpdir(), `help-motion-${process.pid}-${motion.name}-${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmp, html);
  await page.goto("file://" + tmp);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  fs.rmSync(tmp, { force: true });
  return {
    page,
    kit,
    W,
    H,
    async at(t) {
      await page.evaluate((t) => window.__m && window.__m.render(t), t);
    },
    async errors() {
      const inPage = await page.evaluate(() => window.__errors || []).catch(() => []);
      return [...new Set([...inPage, ...consoleErrors])];
    },
  };
}

export function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
  return d;
}

/** Extracts the shared shell block (between the configured markers) from scene text. */
export function shellBlock(cfg, text) {
  const begin = new RegExp(cfg.shell.begin, "m");
  const m = begin.exec(text);
  if (!m) return null;
  const endAt = text.indexOf(cfg.shell.end, m.index);
  if (endAt < 0) return null;
  const head = text.slice(m.index, endAt + cfg.shell.end.length);
  return head;
}
