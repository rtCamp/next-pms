#!/usr/bin/env node
// Pixel-compares a motion against another version of itself, to prove a
// shared change (shell, page pieces, kit) left it untouched, or to show what moved.
//
//   node compare.mjs <motion> --ref HEAD            # vs the last commit (git show)
//   node compare.mjs <motion> --against <folder>    # vs another motion folder
//   node compare.mjs <motion> --scene <file.js>     # vs the same motion with this scene file
//   options: --every 0.5 | --times a,b   --out DIR   --tolerance 0
//
// Prints, per time, "same" or the changed pixel count and bounding box, writes
// a diff image for each changed frame, and exits 1 if anything differs.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parseArgs, loadConfig, loadMotion, parseTimes, launchBrowser, openMotion, ensureDir, die } from "./lib.mjs";

const args = parseArgs();
const ctx = loadConfig(args);
const name = args._[0] || die("usage: node compare.mjs <motion> (--ref GITREF | --against DIR | --scene FILE)");
const cur = loadMotion(ctx, name);

let other;
if (args.ref) {
  const rel = path.relative(ctx.root, cur.dir);
  const show = (f) => {
    try {
      return execFileSync("git", ["show", `${args.ref}:${path.posix.join(rel.split(path.sep).join("/"), f)}`], { cwd: ctx.root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    } catch {
      return undefined;
    }
  };
  const scenesTxt = show("scenes.json") ?? die(`${args.ref} has no ${rel}/scenes.json`);
  const ov = { "scenes.json": scenesTxt, "base.css": show("base.css") ?? "" };
  for (const sc of JSON.parse(scenesTxt).scenes ?? []) ov[`scene-${sc.id}.js`] = show(`scene-${sc.id}.js`) ?? die(`${args.ref} has no scene-${sc.id}.js`);
  other = loadMotion(ctx, cur.dir, ov);
  other.name = `${cur.name}@${args.ref}`;
} else if (args.against) {
  other = loadMotion(ctx, args.against);
} else if (args.scene) {
  const id = (cur.scenes.scenes ?? [])[0]?.id;
  other = loadMotion(ctx, cur.dir, { [`scene-${id}.js`]: fs.readFileSync(path.resolve(args.scene), "utf8") });
  other.name = `${cur.name}+${path.basename(args.scene)}`;
} else die("give --ref, --against or --scene");

const times = parseTimes(args.times || args.every ? args : { every: 1 }, Math.min(cur.total, other.total));
const out = ensureDir(path.resolve(args.out && args.out !== true ? args.out : path.join(ctx.root, ".motion-out", `${cur.name}-compare`)));
const tol = Number(args.tolerance) || 0;

const browser = await launchBrowser(ctx);
let differs = false;
try {
  const a = await openMotion(browser, ctx, other);
  const b = await openMotion(browser, ctx, cur);
  const differ = await browser.newPage();
  for (const t of times) {
    await a.at(t);
    await b.at(t);
    const [ia, ib] = await Promise.all([a.page.locator("#stage").screenshot(), b.page.locator("#stage").screenshot()]);
    const res = await differ.evaluate(
      async ({ A, B, tol }) => {
        const load = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = "data:image/png;base64," + s; });
        const [x, y] = await Promise.all([load(A), load(B)]);
        const w = Math.max(x.width, y.width), h = Math.max(x.height, y.height);
        const cv = (img) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.drawImage(img, 0, 0); return g.getImageData(0, 0, w, h); };
        const da = cv(x), db = cv(y);
        const diff = new ImageData(w, h);
        let n = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
        for (let i = 0; i < da.data.length; i += 4) {
          const d = Math.max(Math.abs(da.data[i] - db.data[i]), Math.abs(da.data[i + 1] - db.data[i + 1]), Math.abs(da.data[i + 2] - db.data[i + 2]));
          const p = i / 4, px = p % w, py = (p - px) / w;
          diff.data[i + 3] = 255;
          if (d > tol) {
            n++; diff.data[i] = 255; x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py);
          } else { const g = (db.data[i] + db.data[i + 1] + db.data[i + 2]) / 3; diff.data[i] = diff.data[i + 1] = diff.data[i + 2] = 128 + g / 2; }
        }
        let png = null;
        if (n) { const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").putImageData(diff, 0, 0); png = c.toDataURL("image/png").split(",")[1]; }
        return { n, box: n ? [x0, y0, x1, y1] : null, png };
      },
      { A: ia.toString("base64"), B: ib.toString("base64"), tol },
    );
    if (res.n) {
      differs = true;
      const f = path.join(out, `diff_${t.toFixed(2)}.png`);
      fs.writeFileSync(f, Buffer.from(res.png, "base64"));
      console.log(`t=${t.toFixed(2)}  ${res.n} px differ, box ${res.box.join(",")}  → ${f}`);
    } else console.log(`t=${t.toFixed(2)}  same`);
  }
  const errs = [...(await a.errors()).map((e) => `${other.name}: ${e}`), ...(await b.errors()).map((e) => `${cur.name}: ${e}`)];
  for (const e of errs) console.error("error:", e);
  if (errs.length) differs = true;
} finally {
  await browser.close();
}
console.log(differs ? `\n${cur.name}: DIFFERS from ${other.name}` : `\n${cur.name}: identical to ${other.name} at ${times.length} time(s)`);
process.exitCode = differs ? 1 : 0;
