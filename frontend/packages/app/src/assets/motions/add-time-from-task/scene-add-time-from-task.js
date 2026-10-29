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
const TK_CLOCK = '<svg width="16" height="16" viewBox="0 0 12 12" fill="none" style="display:block;color:var(--color-ink-gray-4)"><g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 11A5 5 0 1 0 6 1a5 5 0 0 0 0 10"/><path d="M6 3v3l2 1"/></g></svg>';
const tkClockBtn = (i, cls) => '<div class="pms-abs ' + cls + '" style="left:' + TK.col.addTime + 'px;top:' + (tkRowTop(i) + 9.5) + 'px;width:16px;height:16px;cursor:pointer">' + TK_CLOCK + '</div>';
const tkHeader = () => {
  let s = '<div style="position:absolute;left:' + TK.left + 'px;top:' + (TK.headTop + TK.headH - 1) + 'px;width:' + (TK.right - TK.left) + 'px;height:1px;background:var(--color-outline-gray-1)"></div>';
  TK.head.forEach(([x, w]) => { s += tkTxt(x, 135.1, w); });
  return s;
};
// opts: { subject, addTime } replace that cell's Ghost with the scene's own element.
const tkRow = (i, opts) => {
  const o = opts || {}, d = TK_ROWS[i % TK_ROWS.length], top = tkRowTop(i), cy = top + 20;
  let s = '<div style="position:absolute;left:0;top:0;width:1440px;height:900px;pointer-events:none">';
  s += o.subject || tkTxt(TK.col.subject, cy, d[0]);
  s += tkTxt(TK.col.project, cy, d[1]);
  s += tkIco(TK.col.status + 8, cy) + tkTxt(TK.col.statusText, cy, d[2]);
  s += tkTxt(TK.col.expected, cy, d[3]);
  s += tkTxt(TK.col.priority, cy, d[4]);
  s += d[5] === 'date' ? tkIco(TK.col.due + 8, cy - 2) + tkTxt(TK.col.dueText, cy, 83.9) : tkTxt(TK.col.due, cy, 25);
  s += o.addTime || tkIco(TK.col.addTime + 8, top + 17.5);
  s += tkIco(TK.col.like + 8, top + 17.5);
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
const COMMENT = 'Reviewed button variants';
const ic = (p, sz, sty) => '<svg width="' + (sz || 16) + '" height="' + (sz || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;' + (sty || '') + '">' + p + '</svg>';
const IC = {
  cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
};
const ROWICON = {
  folder: '<path fill-rule="evenodd" clip-rule="evenodd" d="M10.023 2.5L8.43184 3.68632C8.25916 3.81507 8.04952 3.88462 7.83412 3.88462H2V12.5C2 13.0523 2.44772 13.5 3 13.5H13C13.5523 13.5 14 13.0523 14 12.5V2.5H10.023ZM9.49179 1.64872C9.6213 1.55216 9.77853 1.5 9.94008 1.5H14.35C14.709 1.5 15 1.79101 15 2.15V12.5C15 13.6046 14.1046 14.5 13 14.5H3C1.89543 14.5 1 13.6046 1 12.5V3.53462C1 3.17563 1.29102 2.88462 1.65 2.88462H7.83412L9.49179 1.64872Z" fill="currentColor"/>',
  task: '<g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M8 1.333V4m2.8 1.2 1.933-1.933M12 8h2.667M10.8 10.8l1.933 1.933M8 12v2.667m-4.733-1.934L5.2 10.8M1.333 8H4m-.733-4.733L5.2 5.2"/></g>',
};
const i16 = (inner, color) => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none;display:block;color:' + color + '">' + inner + '</svg>';
const ROW = 5, TASK = 'Design system component refinements', PROJECT = 'Atlas UI Stabilization';
const TOAST = { x: 1420 - 304.1, y: 840, w: 304.1 };
// Rings [from, to, x, y, w, h, r]
const RINGS = [
  [0.95, 1.85, TK.col.addTime - 5, tkRowTop(ROW) + 4.5, 26, 26, 7],
  [2.3, 3.15, 483, 219, 474, 103, 11],
  [3.15, 4.1, 723, 341, 234, 42, 11],
  [5.0, 5.9, 483, 431, 474, 94, 11],
  [7.75, 8.65, 719, 533, 238, 38, 11],
  [9.1, 99, TOAST.x - 5, TOAST.y - 5, TOAST.w + 10, 50, 13],
];
const S = { open: 1.75, dur: 3.95, com: 5.85, type: 5.95, save: 8.6, toast: 8.85, end: 11.55 };
kit.scene('add-time-from-task', {
  init(kit) {
    const page = SHELL('tasks') + tkTable({ [ROW]: { subject: tkSubjectLandmark(ROW, TASK), addTime: tkClockBtn(ROW, 'ft-clock') } }, 18);
    const filled = (cls, icon, label) => '<div class="pms-input on ' + cls + '" style="left:24px;top:' + (cls === 'ft-pin' ? 74 : 135) + 'px;width:464px;padding-left:8px;gap:8px">' + icon + '<span>' + label + '</span><span style="margin-left:auto;color:var(--color-ink-gray-4);display:flex">' + ic(IC.down, 16) + '</span></div>';
    const dlg = '<div class="pms-abs ft-ov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)"></div><div class="pms-dialog ft-dlg" style="left:464px;top:150px">' +
      '<div class="pms-abs" style="left:24px;top:16px;font-size:20px;font-weight:600">Add time</div><div class="pms-abs" style="left:462px;top:16px;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-6)">' + ic(IC.x, 16) + '</div>' +
      '<div class="pms-label" style="left:24px;top:52px">Project <b>*</b></div>' + filled('ft-pin', i16(ROWICON.folder, 'var(--color-ink-gray-7)'), PROJECT) +
      '<div class="pms-label" style="left:24px;top:113px">Task <b>*</b></div>' + filled('ft-tin', i16(ROWICON.task, 'var(--color-ink-gray-8)'), TASK) +
      '<div class="pms-label" style="left:24px;top:174px">Date <b>*</b></div><div class="pms-input on" style="left:24px;top:196px;width:224px">2026-10-15<span style="margin-left:auto;color:var(--color-ink-gray-6);display:flex">' + ic(IC.cal, 16) + '</span></div>' +
      '<div class="pms-label" style="left:264px;top:174px">Duration <b>*</b></div><div class="pms-abs ft-left" style="right:24px;top:175px;font-size:13px;color:var(--color-ink-gray-5)">8h left</div><div class="pms-abs" style="left:264px;top:196px;width:224px;height:32px;border-radius:8px;background:var(--color-surface-gray-2);overflow:hidden"><div class="pms-abs ft-dfill" style="left:0;top:0;height:32px;width:0;background:var(--color-surface-gray-4);border-radius:8px"><span class="pms-abs" style="right:8px;top:10px;width:2px;height:12px;border-radius:2px;background:rgba(23,23,23,.12)"></span></div><span class="pms-abs ft-dv" style="right:10px;top:7px;font-variant-numeric:tabular-nums">00:00</span></div>' +
      '<div class="pms-abs" style="left:24px;top:239px;width:14px;height:14px;border:1px solid var(--color-outline-gray-3);border-radius:4px"></div><div class="pms-abs" style="left:46px;top:237px;font-weight:500">Add calendar events</div>' +
      '<div class="pms-label" style="left:24px;top:264px">Comment <b>*</b></div><div class="pms-input on" style="left:24px;top:286px;width:464px;height:84px;align-items:flex-start;padding-top:8px"><span class="ft-cv"></span><span class="ft-caret" style="display:inline-block;width:2px;height:17px;background:var(--color-ink-gray-8);margin-left:1px"></span></div>' +
      '<div class="pms-btn pms-btn-soft" style="left:24px;top:388px;width:228px">Save and add another</div><div class="pms-btn pms-btn-solid ft-save" style="left:260px;top:388px;width:228px">Save and close</div></div>';
    const toast = '<div class="pms-abs ft-toast" style="left:' + TOAST.x + 'px;top:' + TOAST.y + 'px;width:' + TOAST.w + 'px;height:40px;box-sizing:border-box;padding:6px 16px;background:var(--color-surface-gray-6);border-radius:10px;box-shadow:0 0 1px rgba(0,0,0,.35),0 6px 8px -4px rgba(0,0,0,.1);display:flex;align-items:center;gap:12px">' +
      '<div style="display:flex;align-items:center;gap:8px;flex:1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--color-ink-green-3);flex:none;display:block"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>' +
      '<span style="font-size:13px;line-height:19.5px;font-weight:420;color:var(--color-ink-white);white-space:nowrap">Time Entry submitted successfully</span></div>' +
      '<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--color-ink-white);display:block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam ft-cam"><div class="pms-win">' + page + dlg + toast + '<div class="pms-ring ft-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.ft-' + c);
    for (const k of ['cam', 'clock', 'ov', 'dlg', 'dfill', 'dv', 'left', 'cv', 'caret', 'save', 'toast', 'ring']) this[k] = q(k);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.12, hold: 0.5 },
      { t: 1.3, cx: 985, cy: 470, z: 1.5, hold: 0.3, drift: [0, 0, 0.004] },
      { t: 2.3, cx: 960, cy: 440, z: 2.2, hold: 6.25, drift: [0, 0, 0.004] },
      { t: 9.45, cx: 994, cy: 604, z: 1.4, drift: [0, 0, 0.005] },
    ]);
    const CLK = [TK.col.addTime + 8 + 240, tkRowTop(ROW) + 17.5 + 90];
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1520, 880] }, { t: 0.6, at: [1520, 880] }, { t: 1.35, at: CLK }, { t: 2.85, at: CLK },
      { t: 3.55, at: [1010, 452] }, { t: 4.1, at: [1010, 452] }, { t: 4.5, at: [1038, 452] }, { t: 5.1, at: [1038, 452] },
      { t: 5.75, at: [824, 540] }, { t: 7.85, at: [824, 540] }, { t: 8.5, at: [1078, 642] }, { t: 8.7, at: [1078, 642] }, { t: 9.55, at: [1260, 700] }, { t: S.end, at: [1266, 704] },
    ];
    this.cur.clicks = [S.open, S.dur, S.com, S.save];
    this.cur.holds = [[S.dur + 0.05, 4.55]];
    this.com = kit.typist(COMMENT, S.type, 18);
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const open = eo(seg(t, S.open, S.open + 0.15)) * (1 - ei(seg(t, S.save, S.save + 0.17)));
    this.ov.style.opacity = open;
    this.ov.style.visibility = open > 0 ? 'visible' : 'hidden';
    this.dlg.style.opacity = open;
    this.dlg.style.visibility = open > 0 ? 'visible' : 'hidden';
    this.dlg.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, S.open, S.open + 0.15))) + ')';
    const hrs = t < S.dur ? 0 : Math.round(lerp(1.5, 2.5, eio(seg(t, 4.1, 4.5))) * 4) / 4;
    const mins = Math.round(hrs * 60), left = 480 - mins;
    this.dfill.style.width = (hrs / 8 * 100) + '%';
    this.dfill.style.visibility = hrs > 0 ? 'visible' : 'hidden';
    this.dv.textContent = String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
    this.left.textContent = Math.floor(left / 60) + 'h' + (left % 60 ? ' ' + (left % 60) + 'm' : '') + ' left';
    this.cv.textContent = this.com.at(t);
    const typing = t > S.type && t < this.com.end;
    this.caret.style.opacity = t > S.com && t < S.save && (typing || t < S.type || Math.floor(t / 0.53) % 2 === 0) ? 1 : 0;
    const press = (a) => 1 - 0.04 * seg(t, a - 0.05, a) * (1 - seg(t, a, a + 0.12));
    this.clock.style.transform = 'scale(' + press(S.open) + ')';
    this.save.style.transform = 'scale(' + press(S.save) + ')';
    // toast slides up 150% and scales from 0.95 over 0.4 s
    const tk = seg(t, S.toast, S.toast + 0.4), te = 1 - Math.pow(1 - tk, 3);
    this.toast.style.visibility = t >= S.toast ? 'visible' : 'hidden';
    this.toast.style.opacity = te;
    this.toast.style.transform = 'translateY(' + (150 * (1 - te)).toFixed(1) + '%) scale(' + lerp(0.95, 1, te).toFixed(4) + ')';
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
