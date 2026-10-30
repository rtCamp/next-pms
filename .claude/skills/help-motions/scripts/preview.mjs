#!/usr/bin/env node
// Serves motions in a browser with player controls, rendered with the project's kit.
//
//   node preview.mjs [--port 4321] [--host 127.0.0.1]
//
// Open http://127.0.0.1:4321/ for the list, /m/<motion> to play one.
// Controls: Space play/pause, ←/→ step 0.1 s (Shift: 1 s), the slider scrubs,
// 1/2/3 set speed 0.25×/0.5×/1×, "?t=3.2" opens paused at 3.2 s, "&grid" overlays
// a 10 px grid in window coordinates. Edits to a motion's files reload the page.
// Clicking the stage pauses and asks for a note, saved with the time, scene, point
// and element under the click to .motion-out/<motion>/notes.md for Claude to read.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { parseArgs, loadConfig, listMotions, loadMotion, buildPage, kitScript, motionsDir, ensureDir } from "./lib.mjs";

const args = parseArgs();
const ctx = loadConfig(args);
const port = Number(args.port) || 4321;
const host = args.host && args.host !== true ? args.host : "127.0.0.1";

const version = (name) => {
  const dir = path.join(motionsDir(ctx), name);
  let v = 0;
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) v = Math.max(v, fs.statSync(path.join(dir, f)).mtimeMs);
  const kit = ctx.abs(ctx.cfg.kit);
  if (kit && fs.existsSync(kit)) v = Math.max(v, fs.statSync(kit).mtimeMs);
  return String(v);
};

const notesFile = (name) => path.join(ctx.root, ".motion-out", name, "notes.md");
const noteCount = (name) => (fs.existsSync(notesFile(name)) ? fs.readFileSync(notesFile(name), "utf8").split("\n").filter((l) => l.startsWith("- ")).length : 0);

const controls = (name, total, win, notes) => `
<div id="bar">
  <button id="pp">Pause</button>
  <input id="sl" type="range" min="0" max="${total}" step="0.01" value="0">
  <span id="tm">0.00 / ${total.toFixed(2)} s</span>
  <select id="sp"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option></select>
  <label><input id="lp" type="checkbox" checked> loop</label>
  <span id="xy" title="window coordinates under the pointer"></span>
  <span id="nt" title="click the stage to add a note">${notes} note(s)</span>
  <span id="er"></span>
  <a href="/">all motions</a>
</div>
<script>
(function(){
  var M=window.__m, total=M.total||1, t=0, playing=true, speed=1, last=performance.now();
  var q=new URLSearchParams(location.search); if(q.has("t")){t=Math.min(total,+q.get("t")||0);playing=false;}
  var stage=document.getElementById("stage"), sl=document.getElementById("sl"), tm=document.getElementById("tm"), pp=document.getElementById("pp");
  var W=stage.offsetWidth, H=stage.offsetHeight, k=1;
  function fit(){k=Math.min(innerWidth/W,(innerHeight-44)/H);stage.style.transform="scale("+k+")";}
  addEventListener("resize",fit); fit();
  var cam=M.cameras.length?M.cameras[0].cam:null;
  // The grid rides the camera element, so it zooms with the scene.
  if(q.has("grid")){var g=document.createElement("div");g.style.cssText="position:absolute;left:${win.x}px;top:${win.y}px;width:${win.width}px;height:${win.height}px;pointer-events:none;z-index:999;background-image:linear-gradient(rgba(255,0,0,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,0,0,.12) 1px,transparent 1px),linear-gradient(rgba(255,0,0,.35) 1px,transparent 1px),linear-gradient(90deg,rgba(255,0,0,.35) 1px,transparent 1px);background-size:10px 10px,10px 10px,100px 100px,100px 100px";(cam?cam.el:stage).appendChild(g);}
  // Pointer readout in scene coordinates (undoing the camera), so numbers match scene code.
  function at(e){var r=stage.getBoundingClientRect(),sx=(e.clientX-r.left)/k,sy=(e.clientY-r.top)/k;
    if(cam){var f=cam.at(t);sx=f.cx+(sx-W/2)/f.z;sy=f.cy+(sy-H/2)/f.z;}return [Math.round(sx),Math.round(sy)];}
  stage.addEventListener("mousemove",function(e){var p=at(e);
    document.getElementById("xy").textContent="stage "+p[0]+","+p[1]+"  window "+(p[0]-${win.x})+","+(p[1]-${win.y});});
  function area(n){var r=n.getBoundingClientRect();return r.width*r.height;}
  stage.addEventListener("click",function(e){playing=false;show();var p=at(e),el=e.target,end=0;
    // Scene elements often skip pointer events, so take the smallest one under the click.
    el.querySelectorAll("*").forEach(function(c){var r=c.getBoundingClientRect();
      if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom&&area(c)<area(el))el=c;});
    var sc=M.scenes.find(function(s){end+=s.dur;return t<end;})||M.scenes[M.scenes.length-1];
    var note=prompt("Note for Claude at "+t.toFixed(2)+" s");if(!note)return;
    fetch("/note/${name}",{method:"POST",body:JSON.stringify({t:+t.toFixed(2),scene:sc.id,stage:p,window:[p[0]-${win.x},p[1]-${win.y}],
      el:el.tagName.toLowerCase()+(typeof el.className==="string"&&el.className.trim()?"."+el.className.trim().split(/\\s+/).join("."):""),
      text:(el.innerText||"").trim().replace(/\\s+/g," ").slice(0,60),note:note})})
      .then(function(r){return r.text();}).then(function(n){document.getElementById("nt").textContent=n+" note(s)";});});
  function show(){M.render(t);sl.value=t;tm.textContent=t.toFixed(2)+" / "+total.toFixed(2)+" s";pp.textContent=playing?"Pause":"Play";var e=window.__errors||[];document.getElementById("er").textContent=e.length?("⚠ "+e[e.length-1]).slice(0,160):"";}
  function tick(now){var dt=Math.min(0.1,(now-last)/1000);last=now;if(playing){t+=dt*speed;if(t>=total){if(document.getElementById("lp").checked)t=t%total;else{t=total;playing=false;}}}show();requestAnimationFrame(tick);}
  requestAnimationFrame(tick);
  pp.onclick=function(){playing=!playing;};
  sl.oninput=function(){t=+sl.value;playing=false;};
  document.getElementById("sp").onchange=function(e){speed=+e.target.value;};
  addEventListener("keydown",function(e){if(e.target.tagName==="SELECT")return;var s=e.shiftKey?1:0.1;
    if(e.key===" "){playing=!playing;e.preventDefault();}
    else if(e.key==="ArrowRight"){t=Math.min(total,t+s);playing=false;}
    else if(e.key==="ArrowLeft"){t=Math.max(0,t-s);playing=false;}
    else if(e.key==="1"||e.key==="2"||e.key==="3"){speed=[0.25,0.5,1][+e.key-1];document.getElementById("sp").value=String(speed);}});
  var v=null;setInterval(function(){fetch("/v/${name}").then(function(r){return r.text();}).then(function(x){if(v&&x!==v)location.reload();v=x;}).catch(function(){});},1000);
})();
</script>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${host}`);
  try {
    if (url.pathname === "/") {
      const items = listMotions(ctx)
        .map((n) => { const m = loadMotion(ctx, n); return `<li><a href="/m/${n}">${n}</a> — ${m.total.toFixed(1)} s — ${(m.scenes.scenes?.[0]?.desc || "").replace(/</g, "&lt;")}</li>`; })
        .join("");
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(`<!doctype html><meta charset=utf-8><title>Motions</title><body style="font:15px system-ui;padding:24px"><h1>Motions</h1><ul>${items || "<li>none in " + ctx.cfg.motionsDir + "</li>"}</ul>`);
    }
    const mv = url.pathname.match(/^\/v\/(.+)$/);
    if (mv) { res.writeHead(200, { "content-type": "text/plain" }); return res.end(version(decodeURIComponent(mv[1]))); }
    const mn = url.pathname.match(/^\/note\/(.+)$/);
    if (mn && req.method === "POST") {
      const name = decodeURIComponent(mn[1]);
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const n = JSON.parse(body);
        ensureDir(path.dirname(notesFile(name)));
        const line = `- ${n.t} s, scene \`${n.scene}\`, stage (${n.stage}), window (${n.window}), \`${n.el}\`${n.text ? ` "${n.text}"` : ""}: ${n.note}\n  http://${host}:${port}/m/${name}?t=${n.t}\n`;
        fs.appendFileSync(notesFile(name), line);
        console.log(`note on ${name}: ${line.trim()}`);
        res.writeHead(200, { "content-type": "text/plain" });
        res.end(String(noteCount(name)));
      });
      return;
    }
    const mm = url.pathname.match(/^\/m\/(.+)$/);
    if (mm) {
      const name = decodeURIComponent(mm[1]);
      const motion = loadMotion(ctx, name);
      const note = kitScript(ctx).note;
      const { html } = buildPage(ctx, motion, {
        stageCss: `body{background:#1e1e1e;overflow:hidden}#stage{transform-origin:0 0}#bar{position:fixed;left:0;right:0;bottom:0;height:44px;display:flex;gap:10px;align-items:center;padding:0 12px;background:#111;color:#ddd;font:13px system-ui;z-index:1000}#bar input[type=range]{flex:1}#bar a{color:#9cf}#er{color:#f88;max-width:30%;overflow:hidden;white-space:nowrap}#xy{color:#aaa;min-width:220px}`,
        extraBody: controls(name, motion.total, ctx.cfg.window, noteCount(name)) + (note ? `<script>console.warn(${JSON.stringify(note)})</script>` : ""),
      });
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      return res.end(html);
    }
    res.writeHead(404).end("not found");
  } catch (e) {
    res.writeHead(500, { "content-type": "text/plain" }).end(String(e.stack || e));
  }
});
server.listen(port, host, () => {
  console.log(`help-motions preview: http://${host}:${port}/  (${listMotions(ctx).length} motion(s) in ${ctx.cfg.motionsDir})`);
});
