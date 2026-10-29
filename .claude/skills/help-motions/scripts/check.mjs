#!/usr/bin/env node
// Runs the automated checks on every motion (or the ones named).
//
//   node check.mjs [motion ...] [--step 0.5] [--strict] [--camera-strict]
//
// Errors (exit 1): the scene throws at any sampled time; scenes.json and the
// scene files disagree; a scene uses kit API that doesn't exist; cursor keys
// that aren't plain [x, y] numbers; the shared shell block differs between
// motions. Warnings (exit 1 only with --strict): cursor not inside the camera
// element; zoomed camera frame leaving the app window for 0.2 s or more
// (--camera-strict reports shorter blips during fast push-ins too); beats after `dur`;
// `this.x = kit.h(...)` (kit.h returns a fragment, not an element).
import fs from "node:fs";
import path from "node:path";
import { parseArgs, loadConfig, listMotions, loadMotion, launchBrowser, openMotion, shellBlock, kitScript, die } from "./lib.mjs";

const args = parseArgs();
const ctx = loadConfig(args);
const names = args._.length ? args._ : listMotions(ctx);
if (!names.length) die(`no motions found in ${ctx.cfg.motionsDir}`);
const step = Number(args.step) || 0.5;
const { stage, window: win } = ctx.cfg;
const zFill = stage.width / win.width; // zoom at which the window fills the frame's width

const results = [];
const shells = new Map();
const browser = await launchBrowser(ctx);
try {
  for (const name of names) {
    const r = { name, errors: [], warnings: [] };
    results.push(r);
    let motion;
    try {
      motion = loadMotion(ctx, name);
    } catch (e) {
      r.errors.push(String(e.message || e));
      continue;
    }
    for (const sc of motion.scenes.scenes ?? []) {
      if (!(sc.dur > 0)) r.errors.push(`scenes.json: scene "${sc.id}" has no positive dur`);
      if (!sc.desc) r.warnings.push(`scenes.json: scene "${sc.id}" has no desc (it doubles as alt text)`);
      const text = motion.code[sc.id];
      if (!new RegExp(`kit\\.scene\\(\\s*['"\`]${sc.id}['"\`]`).test(text)) r.errors.push(`scene-${sc.id}.js doesn't call kit.scene('${sc.id}', ...)`);
      if (/this\.\w+\s*=\s*kit\.h\(/.test(text)) r.warnings.push(`scene-${sc.id}.js keeps kit.h(...) in a field; kit.h returns a DocumentFragment, so .style on it fails`);
      const sh = shellBlock(ctx.cfg, text);
      if (sh) shells.set(`${name}/${sc.id}`, sh);
    }

    const m = await openMotion(browser, ctx, motion);

    // API: every kit.<name> and destructured name must exist on the kit.
    const kitKeys = await m.page.evaluate(() => window.__m?.kitKeys || []);
    for (const [id, text] of Object.entries(motion.code)) {
      const used = new Set([...text.matchAll(/\bkit\.([A-Za-z_$][\w$]*)/g)].map((x) => x[1]));
      for (const d of text.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=\s*kit\b/g))
        for (const part of d[1].split(",")) { const k = part.split(":")[0].trim(); if (k) used.add(k); }
      for (const k of used) if (!kitKeys.includes(k)) r.errors.push(`scene-${id}.js uses kit.${k}, which the kit doesn't have`);
    }

    // Render at every step and at dur.
    const ts = [];
    for (let t = 0; t < motion.total; t += step) ts.push(+t.toFixed(3));
    ts.push(motion.total);
    for (const t of ts) await m.at(t);
    r.errors.push(...(await m.errors()));

    // Cursor and camera, read from the live objects.
    const info = await m.page.evaluate(
      ({ ts, win, stage, zFill }) => {
        const out = { cursors: [], camViolations: [], lastBeat: 0 };
        const M = window.__m;
        for (const { scene, cur } of M.cursors) {
          const cams = M.cameras.filter((c) => c.scene === scene).map((c) => c.cam.el);
          const onCam = cams.some((el) => el.contains(cur.el));
          const badKeys = (cur.keys || []).filter((k) => !Array.isArray(k.at) || k.at.length !== 2 || !k.at.every((v) => typeof v === "number" && Number.isFinite(v))).length;
          const times = [...(cur.keys || []).map((k) => k.t), ...(cur.clicks || []), ...(cur.holds || []).map((h) => h[1])].filter(Number.isFinite);
          out.lastBeat = Math.max(out.lastBeat, ...times, 0);
          out.cursors.push({ scene, onCam, badKeys, hasCams: cams.length > 0 });
        }
        const fine = [];
        for (let t = 0; t <= ts[ts.length - 1] + 1e-6; t += 0.05) fine.push(+t.toFixed(3));
        for (const { scene, cam } of M.cameras) {
          out.lastBeat = Math.max(out.lastBeat, ...(cam.keys || []).map((k) => k.t), 0);
          let run = null;
          for (const t of fine) {
            const { cx, cy, z } = cam.at(t);
            const bad = z >= zFill + 0.005 && (cx - stage.width / 2 / z < win.x - 0.5 || cx + stage.width / 2 / z > win.x + win.width + 0.5 || cy - stage.height / 2 / z < win.y - 0.5 || cy + stage.height / 2 / z > win.y + win.height + 0.5);
            if (bad && !run) run = { scene, from: t, to: t, z: +z.toFixed(2), cx: Math.round(cx), cy: Math.round(cy) };
            else if (bad) run.to = t;
            else if (run) { out.camViolations.push(run); run = null; }
          }
          if (run) out.camViolations.push(run);
        }
        return out;
      },
      { ts, win, stage, zFill },
    );
    for (const c of info.cursors) {
      if (c.badKeys) r.errors.push(`cursor in "${c.scene}" has ${c.badKeys} key(s) whose "at" isn't a plain [x, y] of numbers`);
      if (c.hasCams && !c.onCam) r.warnings.push(`cursor in "${c.scene}" isn't inside its camera element, so it won't move with the camera`);
    }
    for (const v of info.camViolations.filter((v) => args["camera-strict"] || v.to - v.from >= 0.2))
      r.warnings.push(`camera in "${v.scene}" shows the desk beside the zoomed window from ${v.from}s to ${v.to}s (z ${v.z}, centre ${v.cx},${v.cy})`);
    if (info.lastBeat > motion.total + 0.01) r.warnings.push(`a beat is keyed at ${info.lastBeat}s, after dur ${motion.total}s`);
    await m.page.close();
  }
} finally {
  await browser.close();
}

// Shared shell: every block must match the canonical one (config shellFile), or else the most common one.
const shellFile = ctx.abs(ctx.cfg.shellFile);
let canonical = null, canonicalFrom = "";
if (shellFile && fs.existsSync(shellFile)) {
  canonical = shellBlock(ctx.cfg, fs.readFileSync(shellFile, "utf8"));
  canonicalFrom = path.relative(ctx.root, shellFile);
} else if (shells.size > 1) {
  const counts = new Map();
  for (const s of shells.values()) counts.set(s, (counts.get(s) || 0) + 1);
  const [s, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  canonical = s;
  canonicalFrom = `the block used by ${n} scene(s)`;
}
if (canonical) {
  for (const [key, s] of shells) {
    if (s !== canonical) {
      const r = results.find((x) => x.name === key.split("/")[0]);
      const line = s.split("\n").findIndex((l, i) => l !== canonical.split("\n")[i]);
      r.errors.push(`shell block in ${key} differs from ${canonicalFrom} (first difference at shell line ${line + 1})`);
    }
  }
}

let failed = false;
for (const r of results) {
  const status = r.errors.length ? "FAIL" : r.warnings.length ? "warn" : "ok";
  console.log(`${status.padEnd(4)}  ${r.name}`);
  for (const e of r.errors) console.log(`      error: ${e}`);
  for (const w of r.warnings) console.log(`      warning: ${w}`);
  if (r.errors.length || (args.strict && r.warnings.length)) failed = true;
}
const kitInfo = kitScript(ctx);
if (kitInfo.note) console.warn("note:", kitInfo.note);
console.log(`\n${results.length} motion(s), shell blocks compared: ${shells.size}, kit: ${path.relative(ctx.root, kitInfo.file)}`);
process.exitCode = failed ? 1 : 0;
