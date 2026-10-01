#!/usr/bin/env node
/**
 * Drive the live app with a cached session so you can inspect real DOM without
 * paying for a full test run (~5-7 min of global seeding).
 *
 * Usage, from the repo root:
 *
 *   node .claude/skills/next-pms-e2e/scripts/probe.mjs <snippet.mjs> \
 *     [--role manager] [--url /next-pms/allocations/project] \
 *     [--block-writes] [--headed] [--wait 5000]
 *
 * The snippet default-exports an async function receiving a context object:
 *
 *   export default async ({ page, log, dumpControls, dumpInputs, dumpMatching, writes }) => {
 *     await dumpControls(page.getByRole("dialog"));
 *   };
 *
 * Write snippets to the scratchpad, not the repo.
 *
 * --block-writes aborts every POST/PUT/DELETE (socket.io excepted) and records
 * them in `writes`, so you can click a submit button and observe validation
 * without persisting anything. Use it unless you intend to create records:
 * this runs against shared staging data. If you do create something, delete it
 * with cleanup.mjs and verify it is gone.
 */

import fs from "fs";
import path from "path";

const argv = process.argv.slice(2);
const snippetArg = argv.find((a) => !a.startsWith("--"));
const flag = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = argv[i + 1];
  return !next || next.startsWith("--") ? true : next;
};

if (!snippetArg) {
  console.error("usage: probe.mjs <snippet.mjs> [--role manager] [--url /path] [--block-writes] [--headed]");
  process.exit(1);
}

const repoRoot = process.cwd();
const role = flag("role", "manager");
const startUrl = flag("url", "/next-pms/timesheet");
const blockWrites = flag("block-writes", false) !== false;
const headed = flag("headed", false) !== false;
const settleMs = Number(flag("wait", 5000));

// Resolve Playwright from the repo's own node_modules — a script living outside
// the package tree cannot resolve "playwright" by name.
const pwPath = path.join(repoRoot, "node_modules", "playwright", "index.mjs");
if (!fs.existsSync(pwPath)) {
  console.error(`Playwright not found at ${pwPath}. Run probe.mjs from the repo root.`);
  process.exit(1);
}
const { chromium } = await import(pwPath);

// Session states are written by globalSetup / the worker fixture. Prefer a
// browser state (-w<N>) since it carries what the UI needs; fall back to -API.
const authDir = path.join(repoRoot, "tests", "e2e", "auth");
// A stored `sid` carries an expiry (~12h). Chromium drops an expired cookie when
// it restores the state, so the probe would silently land on /login with only the
// non-session cookies - which looks exactly like the page having changed. Skip
// those, newest first.
const usable = (f) => {
  try {
    const sid = (JSON.parse(fs.readFileSync(path.join(authDir, f), "utf8")).cookies || []).find((c) => c.name === "sid");
    if (!sid) return false;
    return sid.expires === -1 || sid.expires == null || sid.expires * 1000 > Date.now();
  } catch {
    return false;
  }
};
const candidates = fs.existsSync(authDir)
  ? fs
      .readdirSync(authDir)
      .filter((f) => f.startsWith(`${role}-w`) && f.endsWith(".json"))
      .concat(fs.existsSync(path.join(authDir, `${role}-API.json`)) ? [`${role}-API.json`] : [])
      .filter(usable)
      .sort(
        (a, b) =>
          fs.statSync(path.join(authDir, b)).mtimeMs - fs.statSync(path.join(authDir, a)).mtimeMs
      )
  : [];

if (!candidates.length) {
  console.error(
    `No auth state for role "${role}" in ${authDir}.\n` +
      `Run the suite once to mint sessions, or pass a role that has one: ` +
      `${fs.existsSync(authDir) ? fs.readdirSync(authDir).join(", ") : "(dir missing)"}`
  );
  process.exit(1);
}
const statePath = path.join(authDir, candidates[0]);

// baseURL comes from the same .env the suite uses, so probes and tests agree.
const envPath = path.join(repoRoot, "tests", "e2e", ".env");
let baseURL = process.env.BASE_URL;
if (!baseURL && fs.existsSync(envPath)) {
  baseURL = fs.readFileSync(envPath, "utf8").match(/^BASE_URL=(.+)$/m)?.[1]?.trim();
}
if (!baseURL) {
  console.error("BASE_URL not set and not found in tests/e2e/.env");
  process.exit(1);
}
baseURL = baseURL.replace(/\/$/, "");

const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: !headed });
const context = await browser.newContext({
  storageState: JSON.parse(fs.readFileSync(statePath, "utf8")),
  baseURL,
});
const page = await context.newPage();

const writes = [];
if (blockWrites) {
  await page.route("**/api/**", (route) => {
    const req = route.request();
    const method = req.method();
    const url = req.url();
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method) && !/socket\.io/.test(url)) {
      const label = url.split("/api/method/")[1]?.split("?")[0] || url.slice(-60);
      writes.push({ method, url, label, body: req.postData() });
      log(`  [write blocked] ${method} ${label}`);
      return route.abort();
    }
    return route.continue();
  });
}

/** Enumerate the interactive controls in a scope (Locator or Page). */
const dumpControls = async (scope = page, label = "controls") => {
  const items = await scope
    .locator("button,[role=menuitem],[role=option],a,[aria-label]")
    .evaluateAll((els) =>
      els.slice(0, 80).map((el) => {
        const name = el.getAttribute("aria-label") || (el.innerText || "").replace(/\n/g, "/");
        return `${el.tagName}:"${name.trim().slice(0, 44)}"`;
      })
    );
  log(`\n${label} (${items.length}):\n  ${items.join(" | ")}`);
  return items;
};

/**
 * List every input in a scope with the states that actually decide whether
 * fill() works: `disabled` and `readOnly`. A disabled field makes fill() retry
 * until the test times out, which is the most common silent hang in this suite.
 */
const dumpInputs = async (scope = page, label = "inputs") => {
  const items = await scope.locator("input,textarea,select").evaluateAll((els) =>
    els.map((el, i) => ({
      i,
      tag: el.tagName,
      id: el.id || null,
      placeholder: el.getAttribute("placeholder"),
      value: el.value,
      readOnly: !!el.readOnly,
      disabled: !!el.disabled,
    }))
  );
  log(`\n${label}:`);
  for (const it of items) {
    log(
      `  [${String(it.i).padStart(2)}] ${it.tag.padEnd(8)} ${String(it.id || it.placeholder || "-").padEnd(18)}` +
        ` value=${JSON.stringify(it.value).slice(0, 24).padEnd(26)}` +
        ` ${it.disabled ? "DISABLED " : ""}${it.readOnly ? "READONLY" : ""}`
    );
  }
  return items;
};

/** Find anything whose aria-label / title / text matches a pattern. */
const dumpMatching = async (pattern, label = null) => {
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern, "i");
  const hits = await page.locator("[aria-label],[title],button,[role=menuitem]").evaluateAll(
    (els, src) => {
      const rx = new RegExp(src.source, src.flags);
      const out = new Set();
      for (const el of els) {
        const blob = `${el.getAttribute("aria-label") || ""} ${el.getAttribute("title") || ""} ${(el.innerText || "").slice(0, 40)}`;
        if (rx.test(blob)) out.add(`${el.tagName} "${blob.trim().slice(0, 60)}"`);
      }
      return [...out];
    },
    { source: re.source, flags: re.flags }
  );
  log(`\n${label || `matching ${re}`}: ${hits.length ? hits.join(" | ") : "(none)"}`);
  return hits;
};

/** First non-CSS line of the toast region — toasts carry injected styles. */
const readToast = async () => {
  const region = page.getByRole("region", { name: /notification/i });
  if (!(await region.count())) return null;
  const raw = (await region.first().innerText()) || "";
  return (
    raw
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.includes("toast-root") && !l.includes("transition")) || null
  );
};

try {
  log(`role=${role}  state=${path.basename(statePath)}  writes=${blockWrites ? "BLOCKED" : "LIVE"}`);
  await page.goto(`${baseURL}${startUrl}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(settleMs);
  log(`url=${page.url()}\n`);

  const mod = await import(path.resolve(snippetArg));
  const run = mod.default || mod.probe;
  if (typeof run !== "function") {
    throw new Error(`${snippetArg} must default-export an async function`);
  }
  await run({ page, context, log, dumpControls, dumpInputs, dumpMatching, readToast, writes, baseURL });

  if (blockWrites && writes.length) {
    log(`\nblocked ${writes.length} write(s):`);
    for (const w of writes) log(`  ${w.method} ${w.label}  body=${String(w.body || "").slice(0, 200)}`);
  }
} catch (err) {
  console.error(`\nprobe failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
