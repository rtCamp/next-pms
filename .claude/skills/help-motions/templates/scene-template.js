// Starter scene. Copy to <motionsDir>/<name>/scene-<id>.js, set the id in
// kit.scene() and scenes.json, then replace the demo page and beats.
//
// SPEC (keep this comment up to date)
//   Task:      <what the user does, on which page>
//   Steps:     1. <beat>  2. <beat>  3. <beat>
//   Landmarks: <at most two muted words, e.g. the breadcrumb>
//   Result:    <the visible end state that gets the last ring>
//
// Coordinates: elements and rings use WINDOW coordinates (inside .win).
// Cursor and camera keys use STAGE coordinates (window + WX, WY).
const { seg, lerp, eo, eio } = kit;

// ==== <Project> shell vX — paste the project's shared shell block here verbatim (see PROFILE.md). ====
const SHELL = () => "";
// ==== end shell ====

const WX = 240,
  WY = 90; // window origin on the stage
const S = (x, y) => [x + WX, y + WY]; // window → stage, for cursor and camera keys

// Ghost / landmark helpers (colours come from the project profile).
const GHOST = "#E8E8E8",
  LANDMARK = "#7C7C7C",
  RING = "#3B82F6";
const g = (x, y, w, h, r) =>
  `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${r}px;background:${GHOST}"></div>`;
const txt = (x, cy, w) => g(x, cy - 5, w, 10, 5);

// One ring element per target; fade each in and out over 0.25 s.
function ring(x, y, w, h, r) {
  const el = document.createElement("div");
  el.style.cssText = `position:absolute;left:${x - 5}px;top:${y - 5}px;width:${w + 10}px;height:${h + 10}px;border:3px solid ${RING};border-radius:${r + 3}px;box-sizing:border-box;opacity:0;pointer-events:none;z-index:40`;
  return el;
}
const fade = (t, a, b) =>
  Math.min(eo(seg(t, a, a + 0.25)), 1 - seg(t, b - 0.25, b));

kit.scene("demo", {
  init(kit) {
    kit.stage.append(
      kit.h(`
      <div class="ground" style="position:absolute;inset:0"></div>
      <div class="cam" style="position:absolute;left:0;top:0;width:1920px;height:1080px">
        <div class="win" style="position:absolute;left:${WX}px;top:${WY}px;width:1440px;height:900px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.06),0 8px 30px rgba(0,0,0,.08)">
          ${SHELL("page-key")}
          ${txt(260, 85, 120)}
        </div>
      </div>`),
    );
    // kit.h returns a fragment: query the real elements after appending.
    this.cam = new kit.Camera(kit.stage.querySelector(".cam"));
    this.win = kit.stage.querySelector(".win");

    // Focus element built with createElement so we can keep a reference.
    this.btn = document.createElement("div");
    this.btn.textContent = "Save";
    this.btn.style.cssText =
      "position:absolute;left:1300px;top:14px;width:96px;height:28px;border-radius:8px;background:#171717;color:#fff;font-size:14px;display:flex;align-items:center;justify-content:center";
    this.win.append(this.btn);
    this.r1 = ring(1300, 14, 96, 28, 8);
    this.win.append(this.r1);

    // Cursor rides the camera so it moves with it; keys are plain [x, y].
    const cur = (this.cur = kit.cursor());
    this.cam.el.append(cur.el);
    cur.keys = [
      { t: 0, at: S(900, 500) },
      { t: 1.6, at: S(900, 500) },
      { t: 2.3, at: S(1348, 28) },
    ];
    cur.clicks = [2.7];

    this.cam.set([
      { t: 0, cx: 960, cy: 540, z: 1.1, hold: 1.2, drift: [0, 0, 0.004] },
      { t: 2.0, cx: 1200, cy: 360, z: 2.0, hold: 2.5 }, // frame x 720–1680, y 90–630: inside the window
    ]);
  },
  render(t) {
    this.cam.apply(t);
    this.r1.style.opacity = fade(t, 2.0, 5.5);
    this.btn.style.transform = `scale(${1 - 0.04 * seg(t, 2.66, 2.7) * (1 - seg(t, 2.7, 2.84))})`;
    this.cur.render(t);
    // Keep the pointer about the same size on screen at every zoom.
    this.cur.el.style.transform += ` scale(${(1.1 / this.cam.at(t).z).toFixed(4)})`;
  },
});
