const { seg, lerp, eo, ei, eio } = kit;
// ==== Next PMS shell v1 ====
// Measured from the running app at its 2023 px desktop width and drawn in a 1440x900 window.
// Sidebar 240 wide, top bar 57 high, filter row at y 71. Right-anchored x = app x - 2023 + 1440.
// Ghost shapes: text = 10 px pill r5 (secondary 8 px r4), icon = 14 px square r4, buttons keep their real box.
// Breadcrumb is a Landmark (real words, muted, no icons). Everything else in the shell is Ghost.
// projects-list: Create view and its divider sit in the hidden `.pms-sh-changed` group, which a scene shows when
// the list gets unsaved changes. Its Ghost filters are narrower than the app's so they fit the 1440 window.
const SHELL = (() => {
  const g = (x, y, w, h, r) => '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;background:var(--color-surface-gray-3)"></div>';
  const txt = (x, cy, w) => g(x, cy - 5, w, 10, 5);
  const ico = (x, y) => g(x + 1, y + 1, 14, 14, 4);
  const NAV = { dashboards: ['Dashboards', 73, [['Leadership', 73], ['Manager', 58]]], timesheet: ['Timesheet', 64, [['Personal', 57], ['Team', 36], ['Projects', 54]]], allocations: ['Allocations', 68, [['Team', 36], ['Projects', 54]]] };
  const PAGES = {
    personal: { group: 'timesheet', active: 'Personal', crumb: ['Timesheets', 'Personal'],
      buttons: [[1197, 123], [1329, 99, 'solid']],
      filters: [[260, 274], [542, 143]], right: [[1323, 97]] },
    team: { group: 'timesheet', active: 'Team', crumb: ['Timesheets', 'Team'],
      buttons: [[1197, 123], [1329, 99, 'solid']],
      filters: [[260, 174], [442, 198], [648, 143]], right: [[1323, 97]] },
    'project-timesheet': { group: 'timesheet', active: 'Projects', crumb: ['Timesheets', 'Project'],
      buttons: [[1197, 123], [1329, 99, 'solid']],
      filters: [[260, 174]], right: [[1323, 97]] },
    'alloc-team': { group: 'allocations', active: 'Team', crumb: ['Allocations', 'Team'],
      buttons: [[1294, 134, 'solid']],
      filters: [[260, 174], [442, 168], [618, 168], [794, 122], [924, 139]], right: [[1195, 28, 'icon'], [1227, 56, 'text'], [1287, 28, 'icon'], [1323, 97]] },
    'alloc-project': { group: 'allocations', active: 'Projects', crumb: ['Allocations', 'Project'],
      buttons: [[1294, 134, 'solid']],
      filters: [[260, 174], [442, 122], [572, 139]], right: [[1195, 28, 'icon'], [1227, 56, 'text'], [1287, 28, 'icon'], [1323, 97]] },
    'projects-kanban': { top: 'Projects', crumb: ['Projects', 'Kanban view'],
      buttons: [[1311, 117, 'solid']],
      filters: [[260, 176], [444, 176], [628, 112], [748, 90], [846, 84]], right: [[1323, 97]] },
    'projects-list': { top: 'Projects', crumb: ['Projects', 'List view'],
      buttons: [[1311, 117, 'solid']],
      filters: [[260, 160], [428, 160], [596, 95], [699, 90], [797, 84]], right: [[1044, 98], [1150, 165], [1323, 97]],
      changed: [[932.1, 94.5], 1034.5] },
    'dashboard-manager': { group: 'dashboards', active: 'Manager', crumb: ['Dashboard', 'Management'],
      buttons: [], filters: [], right: [] },
    'project-detail': { crumb: ['Projects', 'Atlas UI Stabilization'], buttons: [], filters: [], right: [] },
    tasks: { top: 'Tasks', crumb: ['Tasks'],
      buttons: [[1327, 101, 'solid']],
      filters: [[260, 176], [444, 176], [628, 176]], right: [[1065, 98], [1171, 144], [1323, 97]] },
  };
  // focus: { [buttonIndex]: html } replaces a top-bar ghost button with the scene's own Focus element.
  // focus.cv (projects-list) replaces the hidden Create view ghost.
  return (page, focus) => {
    const P = PAGES[page], F = focus || {};
    let s = '<div style="position:absolute;left:0;top:0;width:240px;height:900px;background:var(--color-surface-menu-bar);border-right:1px solid var(--color-outline-gray-1);box-sizing:border-box">';
    s += g(16, 16, 32, 32, 8) + txt(56, 23.5, 66) + g(56, 37, 56, 8, 4) + ico(208, 24);
    [[64, 46, 'Search'], [92, 83, 'Notifications'], [120, 54, 'Projects'], [148, 38, 'Tasks']].forEach(([y, w, name]) => {
      if (name === P.top) s += '<div style="position:absolute;left:8px;top:' + y + 'px;width:223px;height:28px;border-radius:8px;background:var(--color-surface-white);box-shadow:0 0 0 1px var(--color-outline-gray-1)"></div>';
      s += ico(16, y + 6) + txt(40, y + 14, w);
    });
    let y = 196;
    for (const key of ['dashboards', 'timesheet', 'allocations']) {
      const label = key === 'dashboards' ? ['Dashboards', 73] : NAV[key].slice(0, 2);
      s += ico(24, y + 6) + txt(44, y + 14, label[1]);
      if (key === P.group) {
        NAV[key][2].forEach(([name, w], i) => {
          const iy = y + 28 + 30 * i;
          if (name === P.active) s += '<div style="position:absolute;left:8px;top:' + iy + 'px;width:223px;height:28px;border-radius:8px;background:var(--color-surface-white);box-shadow:0 0 0 1px var(--color-outline-gray-1)"></div>';
          s += ico(32, iy + 6) + txt(56, iy + 14, w);
          if (i === NAV[key][2].length - 1) y = iy;
        });
      }
      y += 48;
    }
    s += ico(24, 834) + txt(48, 842, 28) + ico(24, 870) + txt(48, 878, 53) + '</div>';
    // top bar
    s += '<div style="position:absolute;left:240px;right:0;top:56px;height:1px;background:var(--color-outline-gray-1)"></div>';
    const c = P.crumb;
    s += '<div style="position:absolute;left:257px;top:18px;display:flex;gap:7px;font-size:16px;font-weight:500;line-height:20px;color:var(--color-ink-gray-5);white-space:nowrap"><span>' + c[0] + '</span>' + (c.length > 1 ? '<span style="color:var(--color-ink-gray-4)">/</span><span style="margin-left:6px">' + c[1] + '</span>' : '') + '</div>';
    P.buttons.forEach(([x, w], i) => { s += F[i] || g(x, 14, w, 28, 8); });
    P.filters.forEach(([x, w]) => { s += g(x, 71, w, 28, 8); });
    P.right.forEach(([x, w, k]) => { s += k === 'icon' ? ico(x + 6, 77) : k === 'text' ? txt(x + 12, 85, w - 24) : g(x, 71, w, 28, 8); });
    if (P.changed) s += '<div class="pms-sh-changed" style="position:absolute;left:0;top:0;visibility:hidden">' + (F.cv || g(P.changed[0][0], 71, P.changed[0][1], 28, 8)) +
      '<div style="position:absolute;left:' + P.changed[1] + 'px;top:71px;width:1px;height:28px;background:var(--color-outline-gray-2)"></div></div>';
    return s;
  };
})();
// ==== end shell ====
// Tasks list table: header row at y 113, body rows from y 158 at a 41 px pitch. Narrower Ghost columns fit the 1440 window.
const TK = {
  headTop: 113.1, headH: 45, bodyTop: 158.1, pitch: 41, left: 260, right: 1420, divL: 268, divR: 1412,
  col: { subject: 276, project: 556, status: 764, statusText: 788, expected: 922, priority: 1030, due: 1128, dueText: 1148, addTime: 1246, like: 1302, actions: 1358 },
  head: [[268, 46.5], [556, 43.3], [764, 38.9], [922, 87.8], [1030, 44.4], [1128, 55.3]],
};
// Ghost widths per row: [subject, project, status text, expected time, priority, due ('na' | 'date')]
const TK_ROWS = [
  [164.4, 167, 55.1, 22.7, 53.5, 'date'], [218, 135.5, 55.1, 17, 27.6, 'na'], [108.5, 164.6, 105.6, 25.7, 30.7, 'date'],
  [245, 200, 55.1, 26.3, 45.2, 'na'], [190, 118.8, 35.8, 17.2, 27.6, 'na'], [261.5, 135.5, 55.1, 22.7, 27.6, 'na'],
  [261.5, 135.5, 55.1, 17.2, 53.5, 'na'], [140, 164.6, 55.1, 26.3, 30.7, 'date'], [205, 118.8, 105.6, 22.7, 27.6, 'na'],
  [176, 167, 55.1, 25.7, 53.5, 'date'], [230, 200, 35.8, 17, 27.6, 'na'], [150, 164.6, 55.1, 26.3, 45.2, 'date'],
  [257.4, 135.5, 55.1, 17.2, 27.6, 'na'], [198, 118.8, 72.4, 22.7, 30.7, 'date'], [120, 167, 55.1, 25.7, 53.5, 'date'],
  [236, 200, 55.1, 26.3, 27.6, 'na'], [172, 164.6, 105.6, 17, 30.7, 'date'], [210, 118.8, 55.1, 22.7, 27.6, 'na'],
];
const tkG = (x, y, w, h, r) => '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;background:var(--color-surface-gray-3)"></div>';
const tkTxt = (x, cy, w) => tkG(x, cy - 5, w, 10, 5);
const tkIco = (cx, cy) => tkG(cx - 7, cy - 7, 14, 14, 4);
const tkRowTop = (i) => TK.bodyTop + TK.pitch * i;
const tkHeader = () => {
  let s = '<div style="position:absolute;left:' + TK.left + 'px;top:' + (TK.headTop + TK.headH - 1) + 'px;width:' + (TK.right - TK.left) + 'px;height:1px;background:var(--color-outline-gray-1)"></div>';
  TK.head.forEach(([x, w]) => { s += tkTxt(x, 135.1, w); });
  return s;
};
// opts: { subject, like } replace that cell's Ghost with the scene's own element.
const tkRow = (i, opts) => {
  const o = opts || {}, d = TK_ROWS[i % TK_ROWS.length], top = tkRowTop(i), cy = top + 20;
  let s = '<div style="position:absolute;left:0;top:0;width:1440px;height:900px;pointer-events:none">';
  s += o.subject || tkTxt(TK.col.subject, cy, d[0]);
  s += tkTxt(TK.col.project, cy, d[1]);
  s += tkIco(TK.col.status + 8, cy) + tkTxt(TK.col.statusText, cy, d[2]);
  s += tkTxt(TK.col.expected, cy, d[3]);
  s += tkTxt(TK.col.priority, cy, d[4]);
  s += d[5] === 'date' ? tkIco(TK.col.due + 8, cy - 2) + tkTxt(TK.col.dueText, cy, 83.9) : tkTxt(TK.col.due, cy, 25);
  s += tkIco(TK.col.addTime + 8, top + 17.5);
  s += o.like || tkIco(TK.col.like + 8, top + 17.5);
  s += tkIco(TK.col.actions + 14, top + 14.7);
  s += '<div style="position:absolute;left:' + TK.divL + 'px;top:' + (top + 40) + 'px;width:' + (TK.divR - TK.divL) + 'px;height:1px;background:var(--color-outline-gray-1)"></div>';
  return s + '</div>';
};
const tkSubjectLandmark = (i, text) => '<div style="position:absolute;left:' + TK.col.subject + 'px;top:' + (tkRowTop(i) + 11.9) + 'px;font-size:14px;font-weight:500;line-height:16.1px;color:var(--color-ink-gray-5);white-space:nowrap">' + text + '</div>';
const tkTable = (rowOpts, n) => {
  let s = '<div style="position:absolute;left:0;top:0;width:1440px;height:900px;overflow:hidden">' + tkHeader();
  for (let i = 0; i < n; i++) s += tkRow(i, rowOpts[i]);
  return s + '</div>';
};
const TASK = 'Design system component refinements', ROW = 5;
const STAR_OUT = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:block;color:var(--color-ink-gray-4)"><path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" d="M9.54802 5.09979L7.98344 2.5L6.41886 5.0998C6.13961 5.56382 5.68411 5.89476 5.1565 6.01695L2.20047 6.70157L4.18954 8.99296C4.54456 9.40194 4.71854 9.93741 4.67172 10.477L4.40937 13.4999L7.20326 12.3162C7.70193 12.105 8.26496 12.105 8.76362 12.3162L11.5575 13.4999L11.2952 10.477C11.2483 9.93741 11.4223 9.40194 11.7773 8.99296L13.7664 6.70157L10.8104 6.01695C10.2828 5.89476 9.82728 5.56382 9.54802 5.09979ZM8.84025 1.98436C8.45159 1.33854 7.51529 1.33855 7.12663 1.98437L5.56205 4.58416C5.42243 4.81617 5.19468 4.98164 4.93087 5.04274L1.97484 5.72736C1.24053 5.89743 0.951195 6.7879 1.4453 7.35711L3.43437 9.64849C3.61188 9.85298 3.69888 10.1207 3.67546 10.3905L3.41311 13.4134C3.34794 14.1643 4.10542 14.7147 4.79946 14.4206L7.59335 13.237C7.84269 13.1314 8.1242 13.1314 8.37353 13.237L11.1674 14.4206C11.8615 14.7147 12.6189 14.1643 12.5538 13.4134L12.2914 10.3905C12.268 10.1207 12.355 9.85298 12.5325 9.64849L14.5216 7.35711C15.0157 6.7879 14.7264 5.89743 13.992 5.72736L11.036 5.04274C10.7722 4.98164 10.5445 4.81617 10.4048 4.58416L8.84025 1.98436Z"/></svg>';
const STAR_FILL = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:block;color:var(--color-ink-amber-2)"><path fill="currentColor" d="M7.35745 2.27099C7.64895 1.78662 8.35117 1.78662 8.64266 2.27099L10.4227 5.22888L13.786 6.00781C14.3367 6.13536 14.5537 6.80321 14.1831 7.23011L11.9201 9.83712L12.2185 13.2764C12.2674 13.8396 11.6993 14.2524 11.1788 14.0318L8.00006 12.6852L4.82133 14.0318C4.3008 14.2524 3.73269 13.8396 3.78157 13.2764L4.08006 9.83712L1.81701 7.23011C1.44643 6.80321 1.66343 6.13536 2.21416 6.00781L5.57736 5.22888L7.35745 2.27099Z"/></svg>';
const starBtn = '<div class="pms-abs sa-star" style="left:' + TK.col.like + 'px;top:' + (tkRowTop(ROW) + 9.5) + 'px;width:16px;height:16px;cursor:pointer"><div class="pms-abs sa-off" style="left:0;top:0">' + STAR_OUT + '</div><div class="pms-abs sa-on" style="left:0;top:0;visibility:hidden">' + STAR_FILL + '</div></div>';
const S = { click: 1.75, end: 4.8 };
// Ring [from, to, x, y, w, h, r]
const RINGS = [[0.95, 99, TK.col.like - 5, tkRowTop(ROW) + 4.5, 26, 26, 7]];
kit.scene('star-task', {
  init(kit) {
    const page = SHELL('tasks') + tkTable({ [ROW]: { subject: tkSubjectLandmark(ROW, TASK), like: starBtn } }, 18);
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam sa-cam"><div class="pms-win">' + page + '<div class="pms-ring sa-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.sa-' + c);
    for (const k of ['cam', 'star', 'off', 'on', 'ring']) this[k] = q(k);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.12, hold: 0.45 },      { t: 1.2, cx: 1070, cy: 470, z: 1.6, hold: 3.6, drift: [2, 0, 0.004] },
    ]);
    const ST = [TK.col.like + 8 + 240, tkRowTop(ROW) + 17.5 + 90];
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1520, 880] }, { t: 0.5, at: [1520, 880] }, { t: 1.3, at: ST }, { t: 2.15, at: ST }, { t: 2.95, at: [ST[0] + 80, ST[1] + 60] }, { t: S.end, at: [ST[0] + 84, ST[1] + 62] },
    ];
    this.cur.clicks = [S.click];
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const on = t >= S.click;
    this.off.style.visibility = on ? 'hidden' : 'visible';
    this.on.style.visibility = on ? 'visible' : 'hidden';
    const press = 1 - 0.04 * seg(t, S.click - 0.05, S.click) * (1 - seg(t, S.click, S.click + 0.12));
    this.star.style.transform = 'scale(' + press + ')';
    let r = null;
    for (const g of RINGS) if (t >= g[0] && t < g[1]) r = g;
    if (r) {
      const s = this.ring.style;
      s.left = r[2] + 'px'; s.top = r[3] + 'px'; s.width = r[4] + 'px'; s.height = r[5] + 'px'; s.borderRadius = r[6] + 'px';
      s.opacity = Math.min(eo(seg(t, r[0], r[0] + 0.25)), 1 - seg(t, r[1] - 0.15, r[1]));
    } else this.ring.style.opacity = 0;
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
