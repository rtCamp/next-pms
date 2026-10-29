const { seg, lerp, eo, ei, eio } = kit;
// ==== Next PMS shell v1.7 ====
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
// Tasks list with narrower Ghost columns so the whole row fits the 1440 window, as in add-time-from-task.
const TL = {
  bodyTop: 158.1, pitch: 41, divL: 268, divR: 1412,
  col: { subject: 276, project: 556, status: 764, statusText: 788, expected: 922, priority: 1030, due: 1128, dueText: 1148, addTime: 1254, like: 1310, actions: 1372 },
  head: [[268, 46.5], [556, 43.3], [764, 38.9], [922, 87.8], [1030, 44.4], [1128, 55.3]],
};
// Ghost widths per row: [subject, project, status text, expected time, priority, due ('na' | 'date')]
const TL_ROWS = [
  [164.4, 167, 55.1, 22.7, 53.5, 'date'], [218, 135.5, 55.1, 17, 27.6, 'na'], [108.5, 164.6, 105.6, 25.7, 30.7, 'date'],
  [258.1, 200, 55.1, 26.3, 45.2, 'na'], [190, 118.8, 35.8, 17.2, 27.6, 'na'], [261.5, 135.5, 55.1, 22.7, 27.6, 'na'],
  [261.5, 135.5, 55.1, 17.2, 53.5, 'na'], [140, 164.6, 55.1, 26.3, 30.7, 'date'], [205, 118.8, 105.6, 22.7, 27.6, 'na'],
  [176, 167, 55.1, 25.7, 53.5, 'date'], [230, 200, 35.8, 17, 27.6, 'na'], [150, 164.6, 55.1, 26.3, 45.2, 'date'],
  [257.4, 135.5, 55.1, 17.2, 27.6, 'na'], [198, 118.8, 72.4, 22.7, 30.7, 'date'], [120, 167, 55.1, 25.7, 53.5, 'date'],
  [236, 200, 55.1, 26.3, 27.6, 'na'], [172, 164.6, 105.6, 17, 30.7, 'date'], [210, 118.8, 55.1, 22.7, 27.6, 'na'],
];
const tlG = (x, y, w, h, r) => '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;background:var(--color-surface-gray-3)"></div>';
const tlTxt = (x, cy, w) => tlG(x, cy - 5, w, 10, 5);
const tlIco = (cx, cy) => tlG(cx - 7, cy - 7, 14, 14, 4);
const tlLine = (x, y, w) => '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:1px;background:var(--color-outline-gray-1)"></div>';
const tlTable = (focusRow, subject) => {
  let s = tlLine(260, TL.bodyTop - 1, 1160);
  TL.head.forEach(([x, w]) => { s += tlTxt(x, 135.1, w); });
  TL_ROWS.forEach((d, i) => {
    const top = TL.bodyTop + TL.pitch * i, cy = top + 20;
    s += i === focusRow ? subject : tlTxt(TL.col.subject, cy, d[0]);
    s += tlTxt(TL.col.project, cy, d[1]) + tlIco(TL.col.status + 8, cy) + tlTxt(TL.col.statusText, cy, d[2]);
    s += tlTxt(TL.col.expected, cy, d[3]) + tlTxt(TL.col.priority, cy, d[4]);
    s += d[5] === 'date' ? tlIco(TL.col.due + 8, cy - 2) + tlTxt(TL.col.dueText, cy, 83.9) : tlTxt(TL.col.due, cy, 25);
    s += tlIco(TL.col.addTime, top + 17.5) + tlIco(TL.col.like, top + 17.5) + tlIco(TL.col.actions, top + 14.7) + tlLine(TL.divL, top + 40, TL.divR - TL.divL);
  });
  return s;
};
const ROW = 3, TASK = 'Chart legend behaviour fix across tabs', PROJECT = 'Nimbus Analytics Enhancement';
const WORKERS = [['Ananya Bharadwaj', '08:00'], ['Frank Martinez', '06:30'], ['Henry Johnson', '04:00']];
const LOGS = [
  ['Ananya Bharadwaj', '04:00', 'Oct 15', 'Fixed legend overflow on the Revenue tab'],
  ['Frank Martinez', '06:30', 'Oct 14', 'Kept legend selection when switching tabs'],
  ['Henry Johnson', '04:00', 'Oct 13', 'Tested the legends in Safari and Firefox'],
  ['Ananya Bharadwaj', '04:00', 'Oct 12', 'Reproduced the legend bug on every tab'],
];
const ic = (p, sz, sty) => '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;display:block;' + (sty || '') + '">' + p + '</svg>';
const WORKING = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:block;color:var(--color-ink-gray-8)"><g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M8 1.333V4m2.8 1.2 1.933-1.933M12 8h2.667M10.8 10.8l1.933 1.933M8 12v2.667m-4.733-1.934L5.2 10.8M1.333 8H4m-.733-4.733L5.2 5.2"/></g></svg>';
const avatar = (name) => '<div style="width:16px;height:16px;border-radius:50%;flex:none;background:var(--color-surface-gray-2);color:var(--color-ink-gray-5);font-size:11px;font-weight:500;display:flex;align-items:center;justify-content:center">' + name[0] + '</div>';
const DLG = { x: 496, y: 48, w: 448, h: 481.4, loadingH: 120 };
// Rings [from, to, x, y, w, h, r] in window coordinates
const RINGS = [
  [1.3, 1.9, TL.col.subject - 5, TL.bodyTop + TL.pitch * ROW + 7, 268.1, 26, 6],
  [2.75, 4.6, 511, 130.6, 418, 45, 7],
  [4.75, 99, 511, 225.6, 418, 289, 11],
];
const T = { click: 1.75, loaded: 2.3, end: 7.6 };
kit.scene('open-task-log', {
  init(kit) {
    const subject = '<div class="ol-subject" style="position:absolute;left:' + TL.col.subject + 'px;top:' + (TL.bodyTop + TL.pitch * ROW + 11.9) + 'px;font-size:14px;font-weight:500;line-height:16.1px;color:var(--color-ink-gray-8);white-space:nowrap">' + TASK + '</div>';
    const cards = WORKERS.map(([n, h]) => '<div style="display:flex;gap:8px;align-items:flex-start;border:1px solid var(--color-outline-gray-1);border-radius:8px;padding:6px 8px;flex:none">' + avatar(n) +
      '<div><div style="font-size:13px;font-weight:500;line-height:15px;color:var(--color-ink-gray-7);margin-bottom:4px">' + n + '</div><div style="font-size:12px;line-height:13.8px;color:var(--color-ink-gray-5)">' + h + '</div></div></div>').join('');
    const logs = LOGS.map(([n, h, d, c], i) => '<div class="pms-abs" style="left:0;top:' + (78 * i) + 'px;width:408px;height:66px">' +
      '<div style="position:absolute;left:0;top:0;height:20px;border-radius:9999px;background:var(--color-surface-gray-2);display:flex;align-items:center;gap:5px;padding:0 8px 0 6px;font-size:12px;color:var(--color-ink-gray-6)">' + avatar(n) + h + '</div>' +
      '<div style="position:absolute;right:0;top:2px;font-size:14px;line-height:16.1px;color:var(--color-ink-gray-6)">' + d + '</div>' +
      '<div style="position:absolute;left:0;top:32px;font-size:14px;line-height:21px;color:var(--color-ink-gray-7);white-space:nowrap">' + c + '</div>' +
      (i < LOGS.length - 1 ? '<div style="position:absolute;left:0;top:65px;width:408px;height:1px;background:var(--color-outline-gray-1)"></div>' : '') + '</div>').join('');
    const at = (x, y) => 'position:absolute;left:' + (x - DLG.x) + 'px;top:' + (y - DLG.y) + 'px;';
    const dlg = '<div class="pms-abs ol-ov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)"></div>' +
      '<div class="pms-abs ol-dlg" style="left:' + DLG.x + 'px;top:' + DLG.y + 'px;width:' + DLG.w + 'px;border-radius:16px;overflow:hidden;background:var(--color-surface-modal);box-shadow:0 0 1px rgba(0,0,0,.19),0 1px 2px rgba(0,0,0,.07),0 6px 15px -5px rgba(0,0,0,.11)">' +
      '<div style="' + at(516, 74) + '">' + WORKING + '</div>' +
      '<div style="' + at(540, 72.8) + 'font-size:16px;font-weight:600;line-height:18.4px;color:var(--color-ink-gray-8);white-space:nowrap">' + TASK + '</div>' +
      '<div style="' + at(900, 74) + 'color:var(--color-ink-gray-8)">' + ic('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 16) + '</div>' +
      '<div class="ol-spin" style="' + at(710, 118) + 'width:20px;height:20px">' + ic('<path d="M21 12a9 9 0 1 1-6.219-8.56"/>', 20, 'color:var(--color-ink-gray-5)') + '</div>' +
      '<div class="ol-body">' +
      '<div style="' + at(540, 99.6) + 'height:20px;border-radius:9999px;background:var(--color-surface-gray-2);display:flex;align-items:center;gap:4px;padding:0 6px;color:var(--color-ink-gray-6)">' + ic('<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>', 12) +
      '<span style="max-width:168px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:13.8px">' + PROJECT + '</span></div>' +
      '<div style="' + at(516, 135.6) + 'display:flex;align-items:center;gap:6px;font-size:13px;line-height:15px;white-space:nowrap"><div style="display:flex;gap:3px"><span style="display:flex;gap:4px"><span style="font-weight:500;color:var(--color-ink-gray-9)">18:30</span><span style="color:var(--color-ink-gray-5)">Actual</span></span><span style="color:var(--color-ink-gray-5)">/</span><span style="display:flex;gap:4px"><span style="color:var(--color-ink-gray-7)">24:00</span><span style="color:var(--color-ink-gray-5)">Est.</span></span></div>' +
      ic('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>', 12, 'color:var(--color-ink-gray-4)') + '</div>' +
      '<div style="' + at(890, 135.6) + 'width:34px;text-align:right;font-size:13px;line-height:15px;color:var(--color-ink-gray-6)">77%</div>' +
      '<div style="' + at(516, 162.6) + 'width:408px;height:8px;border-radius:4px;background:var(--color-surface-gray-2);overflow:hidden"><div style="width:77%;height:8px;background:var(--color-surface-gray-4);border-radius:4px 0 0 4px"></div></div>' +
      '<div style="' + at(516, 200.6) + 'font-size:14px;font-weight:500;line-height:16.1px;color:var(--color-ink-gray-8)">Time entries</div>' +
      '<div style="' + at(780, 200.6) + 'width:112px;text-align:right;font-size:14px;line-height:16.1px;color:var(--color-ink-gray-7)">Last 15 days</div>' +
      '<div style="' + at(900, 200.6) + 'color:var(--color-ink-gray-8)">' + ic('<path d="m6 9 6 6 6-6"/>', 16) + '</div>' +
      '<div style="' + at(516, 230.6) + 'width:408px;display:flex;gap:6px;overflow:hidden;-webkit-mask-image:linear-gradient(to right,black calc(100% - 24px),transparent);mask-image:linear-gradient(to right,black calc(100% - 24px),transparent)">' + cards + '</div>' +
      '<div style="' + at(516, 293.4) + 'width:408px;height:216px;overflow:hidden">' + logs + '</div>' +
      '</div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam ol-cam"><div class="pms-win">' + SHELL('tasks') + tlTable(ROW, subject) + dlg + '<div class="pms-ring ol-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.ol-' + c);
    for (const k of ['cam', 'ov', 'dlg', 'spin', 'body', 'ring']) this[k] = q(k);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.1, hold: 0.4 },
      { t: 1.25, cx: 800, cy: 450, z: 1.8, hold: 0.7, drift: [2, 0, 0.004] },
      { t: 2.6, cx: 960, cy: 380, z: 2.0, hold: 1.8, drift: [0, 0, 0.004] },
      { t: 5.0, cx: 960, cy: 400, z: 2.0, drift: [0, 1, 0.004] },
    ]);
    const SUBJ = [TL.col.subject + 54 + 240, TL.bodyTop + TL.pitch * ROW + 20 + 90];
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1300, 760] }, { t: 0.7, at: [1300, 760] }, { t: 1.45, at: SUBJ }, { t: 2.2, at: SUBJ },
      { t: 2.9, at: [1215, 610] }, { t: T.end, at: [1220, 614] },
    ];
    this.cur.clicks = [T.click];
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    // frappe-ui dialog-content-in: 100 ms ease-out from opacity 0.5 and scale 0.98
    const k = eo(seg(t, T.click, T.click + 0.1));
    const shown = t >= T.click;
    this.ov.style.visibility = this.dlg.style.visibility = shown ? 'visible' : 'hidden';
    this.ov.style.opacity = k;
    this.dlg.style.opacity = lerp(0.5, 1, k);
    this.dlg.style.transform = 'scale(' + lerp(0.98, 1, k) + ')';
    const loaded = t >= T.loaded;
    this.dlg.style.height = (loaded ? DLG.h : DLG.loadingH) + 'px';
    this.body.style.display = loaded ? 'block' : 'none';
    this.spin.style.display = loaded ? 'none' : 'block';
    this.spin.style.transform = 'rotate(' + ((t * 360) % 360).toFixed(1) + 'deg)';
    let r = null;
    for (const g of RINGS) if (t >= g[0] && t < g[1]) r = g;
    if (r) {
      const s = this.ring.style;
      s.left = r[2] + 'px'; s.top = r[3] + 'px'; s.width = r[4] + 'px'; s.height = r[5] + 'px'; s.borderRadius = r[6] + 'px';
      s.opacity = Math.min(eo(seg(t, r[0], r[0] + 0.25)), 1 - seg(t, r[1] - 0.25, r[1]));
    } else this.ring.style.opacity = 0;
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
