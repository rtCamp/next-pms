#!/usr/bin/env node
// Measures the real app at a normal desktop size: positions, sizes and the
// styles a motion must copy. Read-only by design: requests that would change
// data are blocked (config app.blockMethods / app.blockUrls), and it never saves.
//
//   node measure.mjs --url /path [--sel "css or text=..."]... [--all]
//        [--steps "hover:text=Create view; wait:400; click:css=button[aria-label=Sort]; press:Escape"]
//        [--props transform,outline] [--shot file.png] [--clip SELECTOR] [--eval file.js|"js expr"]
//        [--viewport 1440x900] [--json]
//
// Selectors are Playwright selectors ("text=Save", "role=button[name='Add']",
// "css=.x" or plain CSS). Prints each match's text, its rect in app coordinates,
// the same x converted to motion window coordinates (left- and right-anchored),
// and its computed styles. Credentials come from the env vars named in config
// app.login (never from files).
import fs from "node:fs";
import path from "node:path";
import { parseArgs, list, loadConfig, launchBrowser, localApp, authStateFile, die } from "./lib.mjs";

const args = parseArgs();
const ctx = loadConfig(args);
const app = localApp(ctx.cfg);
if (!args.url || args.url === true) die('usage: node measure.mjs --url /path [--sel SELECTOR]... [--steps "hover:SEL; click:SEL; wait:MS; press:KEY"]');
const [vw, vh] = args.viewport && args.viewport !== true ? String(args.viewport).split("x").map(Number) : [app.viewport.width, app.viewport.height];
const win = ctx.cfg.window;

const PROPS = [
  "color", "backgroundColor", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing",
  "borderRadius", "borderTop", "borderBottom", "borderLeft", "boxShadow", "padding", "gap", "opacity",
  "transition", "cursor", "display", "textAlign", "whiteSpace",
  ...list(args.props).flatMap((p) => String(p).split(",")),
];

const stateFile = authStateFile(app);

const browser = await launchBrowser(ctx);
try {
  const context = await browser.newContext({
    viewport: { width: vw, height: vh },
    storageState: fs.existsSync(stateFile) ? stateFile : undefined,
  });

  // Read-only guard.
  const blocked = [];
  const blockMethods = (app.blockMethods || []).map((m) => m.toUpperCase());
  const blockUrls = (app.blockUrls || []).map((r) => new RegExp(r));
  const allowUrls = (app.allowUrls || []).map((r) => new RegExp(r));
  await context.route("**/*", (route) => {
    const r = route.request();
    const u = r.url();
    const isAllowed = allowUrls.some((re) => re.test(u));
    if (!isAllowed && (blockMethods.includes(r.method()) || blockUrls.some((re) => re.test(u)))) {
      blocked.push(`${r.method()} ${u}`);
      return route.abort();
    }
    return route.continue();
  });

  const page = await context.newPage();
  const goto = async (u) => page.goto(new URL(u, app.baseUrl).toString(), { waitUntil: "networkidle" }).catch(() => page.waitForLoadState("load"));

  // Log in when needed.
  const L = app.login;
  const loggedIn = async () => {
    if (!L) return true;
    if (L.check) {
      const res = await page.request.get(new URL(L.check, app.baseUrl).toString()).catch(() => null);
      return !!res && res.ok() && !(L.checkFails && (await res.text()).includes(L.checkFails));
    }
    return !page.url().includes(L.url || "/login");
  };
  await goto(args.url);
  if (L && !(await loggedIn())) {
    const user = process.env[L.userEnv || "MOTIONS_USER"];
    const pass = process.env[L.passEnv || "MOTIONS_PASS"];
    if (!user || !pass) die(`the app needs a login: run login.mjs and sign in yourself, or set ${L.userEnv || "MOTIONS_USER"} and ${L.passEnv || "MOTIONS_PASS"} in the environment.`);
    if (L.type === "request") {
      const body = JSON.parse(JSON.stringify(L.body || {}).replaceAll("$USER", user).replaceAll("$PASS", pass));
      const res = await page.request.post(new URL(L.url, app.baseUrl).toString(), { form: body });
      if (!res.ok()) die(`login request failed: ${res.status()}`);
    } else {
      await goto(L.url || "/login");
      await page.fill(L.userSelector, user);
      await page.fill(L.passSelector, pass);
      await page.click(L.submitSelector);
      await page.waitForLoadState("networkidle").catch(() => {});
    }
    await context.storageState({ path: stateFile });
    await goto(args.url);
  }
  await page.waitForTimeout(Number(args.settle) || 800);

  // Steps: hover / click / press / wait / scroll, in order.
  const steps = list(args.steps).flatMap((s) => String(s).split(";")).map((s) => s.trim()).filter(Boolean);
  for (const s of steps) {
    const [verb, ...rest] = s.split(":");
    const arg = rest.join(":").trim();
    if (verb === "hover") await page.locator(arg).first().hover();
    else if (verb === "click") await page.locator(arg).first().click();
    else if (verb === "press") await page.keyboard.press(arg);
    else if (verb === "wait") await page.waitForTimeout(Number(arg) || 300);
    else if (verb === "scroll") await page.locator(arg).first().scrollIntoViewIfNeeded();
    else die(`unknown step "${s}" (use hover:, click:, press:, wait:, scroll:)`);
    if (verb !== "wait") await page.waitForTimeout(450);
  }

  const out = { url: page.url(), viewport: { width: vw, height: vh }, window: win, elements: [] };
  for (const sel of list(args.sel)) {
    const loc = page.locator(String(sel));
    const n = Math.min(await loc.count(), args.all ? 30 : 1);
    if (!n) { out.elements.push({ selector: sel, found: 0 }); continue; }
    for (let i = 0; i < n; i++) {
      const info = await loc.nth(i).evaluate((el, PROPS) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const styles = {};
        for (const p of PROPS) styles[p] = cs[p];
        return { tag: el.tagName.toLowerCase(), text: (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 80), cls: String(el.className || "").slice(0, 160), rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }, styles };
      }, PROPS);
      info.selector = sel;
      info.windowX = { leftAnchored: info.rect.x, rightAnchored: +(info.rect.x - vw + win.width).toFixed(1) };
      out.elements.push(info);
    }
  }
  if (args.eval && args.eval !== true) {
    const code = fs.existsSync(args.eval) ? fs.readFileSync(args.eval, "utf8") : args.eval;
    out.eval = await page.evaluate(code);
  }
  if (args.shot && args.shot !== true) {
    const opts = { path: path.resolve(args.shot) };
    if (args.clip && args.clip !== true) await page.locator(String(args.clip)).first().screenshot(opts);
    else await page.screenshot(opts);
    out.shot = opts.path;
  }
  out.blockedRequests = blocked;

  if (args.json) console.log(JSON.stringify(out, null, 2));
  else {
    console.log(`${out.url}  viewport ${vw}×${vh}  (window x for right-anchored = app x − ${vw} + ${win.width})`);
    for (const e of out.elements) {
      if (e.found === 0) { console.log(`\n${e.selector}: not found`); continue; }
      console.log(`\n${e.selector}  <${e.tag}> "${e.text}"`);
      console.log(`  rect x ${e.rect.x}  y ${e.rect.y}  w ${e.rect.w}  h ${e.rect.h}   window x: ${e.windowX.leftAnchored} (left-anchored) / ${e.windowX.rightAnchored} (right-anchored)`);
      for (const [k, v] of Object.entries(e.styles)) if (v && !["none", "normal", "0px", "auto", "rgba(0, 0, 0, 0)"].includes(v) && !/^0px none/.test(v)) console.log(`  ${k}: ${v}`);
    }
    if (out.eval !== undefined) console.log("\neval:", JSON.stringify(out.eval, null, 2));
    if (out.shot) console.log("\nscreenshot:", out.shot);
    if (blocked.length) console.log(`\nblocked ${blocked.length} write request(s):\n  ` + blocked.join("\n  "));
  }
  await context.close();
} finally {
  await browser.close();
}
