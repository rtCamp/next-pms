#!/usr/bin/env node
// Renders stills of a motion with the project's kit, so you can look at every beat.
//
//   node stills.mjs <motion> [--every 0.5 | --times 0,1.2,3] [--out DIR] [--sheet] [--scale 1]
//
// <motion> is a folder name in motionsDir or a path to a motion folder.
// Writes <out>/<motion>_<t>.png (and <motion>_sheet.png with --sheet), prints
// any errors, and exits 1 if the scene threw.
import fs from "node:fs";
import path from "node:path";
import { parseArgs, loadConfig, loadMotion, parseTimes, launchBrowser, openMotion, ensureDir, die } from "./lib.mjs";

const args = parseArgs();
const ctx = loadConfig(args);
const name = args._[0] || die("usage: node stills.mjs <motion> [--every 0.5 | --times a,b] [--out DIR] [--sheet]");
const motion = loadMotion(ctx, name);
const times = parseTimes(args, motion.total);
const out = ensureDir(path.resolve(args.out && args.out !== true ? args.out : path.join(ctx.root, ".motion-out", motion.name)));
const scale = Number(args.scale) || 1;

const browser = await launchBrowser(ctx);
try {
  const m = await openMotion(browser, ctx, motion, { scale });
  if (m.kit.note) console.warn("note:", m.kit.note);
  const files = [];
  for (const t of times) {
    await m.at(t);
    const f = path.join(out, `${motion.name}_${t.toFixed(2)}.png`);
    await m.page.locator("#stage").screenshot({ path: f });
    files.push({ t, f });
  }
  if (args.sheet) {
    const cols = Math.min(4, files.length);
    const cells = files
      .map(({ t, f }) => `<figure><img src="data:image/png;base64,${fs.readFileSync(f).toString("base64")}"><figcaption>${t.toFixed(2)} s</figcaption></figure>`)
      .join("");
    const sheet = await browser.newPage({ viewport: { width: cols * 490 + 10, height: 100 } });
    await sheet.setContent(`<style>body{margin:0;padding:5px;font:14px system-ui;display:grid;grid-template-columns:repeat(${cols},480px);gap:10px;background:#ddd}figure{margin:0}img{width:480px;display:block}figcaption{padding:2px 0}</style>${cells}`);
    const f = path.join(out, `${motion.name}_sheet.png`);
    await sheet.screenshot({ path: f, fullPage: true });
    console.log("sheet", f);
  }
  const errors = await m.errors();
  console.log(`kit: ${path.relative(ctx.root, m.kit.file)}`);
  console.log(`${motion.name}: ${files.length} stills in ${out} (dur ${motion.total} s)`);
  for (const { f } of files) console.log("  " + f);
  if (errors.length) {
    console.error("errors:");
    for (const e of errors) console.error("  " + e);
    process.exitCode = 1;
  } else console.log("errors: none");
} finally {
  await browser.close();
}
