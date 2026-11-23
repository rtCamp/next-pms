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
const COLS = [916, 981, 1046, 1111, 1176, 1241, 1306];
const DATES = ['Oct 12', 'Oct 13', 'Oct 14', '15', 'Oct 16', 'Oct 17', 'Oct 18'];
const PROJECTS = ['Website Redesign', 'Mobile App Development', 'Atlas UI Stabilization', 'Nimbus Analytics Enhancement', 'Orion Release Readiness'];
const TASKS = ['Cross-browser and responsiveness fixes', 'Design system component refinements', 'Client dashboard layout improvements'];
const COMMENT = 'Reviewed button variants';
const ic = (p, sz, sty) => '<svg width="' + (sz || 16) + '" height="' + (sz || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;' + (sty || '') + '">' + p + '</svg>';
const IC = {
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  filter: '<path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
};
const ROWICON = {
  chev: '<path d="M11.3848 5.6582C11.5735 5.45686 11.8903 5.44622 12.0918 5.63477C12.2931 5.82353 12.3038 6.14033 12.1152 6.3418L8.36523 10.3418C8.27071 10.4426 8.1382 10.5 8 10.5C7.8618 10.5 7.72929 10.4426 7.63477 10.3418L3.88477 6.3418C3.69622 6.14033 3.70686 5.82353 3.9082 5.63477C4.10967 5.44622 4.42647 5.45686 4.61523 5.6582L8 9.26855L11.3848 5.6582Z" fill="currentColor"/>',
  folder: '<path fill-rule="evenodd" clip-rule="evenodd" d="M10.023 2.5L8.43184 3.68632C8.25916 3.81507 8.04952 3.88462 7.83412 3.88462H2V12.5C2 13.0523 2.44772 13.5 3 13.5H13C13.5523 13.5 14 13.0523 14 12.5V2.5H10.023ZM9.49179 1.64872C9.6213 1.55216 9.77853 1.5 9.94008 1.5H14.35C14.709 1.5 15 1.79101 15 2.15V12.5C15 13.6046 14.1046 14.5 13 14.5H3C1.89543 14.5 1 13.6046 1 12.5V3.53462C1 3.17563 1.29102 2.88462 1.65 2.88462H7.83412L9.49179 1.64872Z" fill="currentColor"/>',
  task: '<g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M8 1.333V4m2.8 1.2 1.933-1.933M12 8h2.667M10.8 10.8l1.933 1.933M8 12v2.667m-4.733-1.934L5.2 10.8M1.333 8H4m-.733-4.733L5.2 5.2"/></g>',
};
const RINGS = [[0.5, 1.3, 1324, 9, 109, 38], [1.85, 2.62, 483, 219, 474, 42], [2.62, 3.55, 483, 280, 474, 42], [3.55, 4.45, 723, 341, 234, 42], [4.45, 5.55, 483, 431, 474, 94], [5.55, 5.95, 719, 533, 238, 38], [6.7, 8.8, 1081, 367, 60, 30]];
const cell = (x, txt, cls, sty) => '<div class="pms-cell ' + (cls || '') + '" style="left:' + (x - 268) + 'px;' + (sty || '') + '">' + txt + '</div>';
const bar = (x, y, w, h) => '<div class="pms-bar" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + (h || 10) + 'px"></div>';
const menu = (cls, top, items) => '<div class="pms-menu ' + cls + '" style="left:24px;top:' + top + 'px;width:464px;height:' + (items.length * 28 + 8) + 'px"><div class="pms-abs ' + cls + '-tint" style="left:4px;top:4px;width:456px;height:28px;border-radius:6px;background:var(--color-surface-gray-2)"></div><div style="position:relative">' + items.map((s) => '<div class="pms-opt">' + s + '</div>').join('') + '</div></div>';
const WARP = [[0.0, 0.0], [1.696, 1.17], [1.996, 1.17], [3.156, 1.97], [3.456, 1.97], [4.326, 2.57], [4.626, 2.57], [5.279, 3.02], [5.579, 3.02], [6.231, 3.47], [6.531, 3.47], [7.14, 3.89], [7.44, 3.89], [8.644, 4.72], [8.944, 4.72], [9.089, 4.82], [10.409, 5.42], [10.989, 5.82], [11.289, 5.82], [15.9, 9]];
const warp = (t) => { if (t <= 0) return t; for (let i = 1; i < WARP.length; i++) { const [n1, o1] = WARP[i], [n0, o0] = WARP[i - 1]; if (t <= n1) return n1 === n0 ? o1 : o0 + (t - n0) / (n1 - n0) * (o1 - o0); } const [n, o] = WARP[WARP.length - 1]; return o + (t - n); };
kit.scene('add-time', {
  init(kit) {
    const side = SHELL('personal', { 1: '<div class="pms-btn pms-btn-solid at-add" style="left:1329px;top:14px;width:99px;gap:6px">' + ic(IC.plus, 15) + 'Add time</div>' });
    let skel = '';
    for (let i = 0; i < 12; i++) {
      let r = '<div class="pms-row" style="top:' + i * 44 + 'px">' + bar(i % 3 ? 48 : 32, 17, i % 3 ? 160 + (i * 53) % 120 : 110);
      COLS.forEach((x) => { r += bar(x - 256, 18, 32, 8); });
      skel += r + bar(1110, 18, 40, 8) + '</div>';
    }
    const gb = (x, y, w, h) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:8px;background:var(--color-surface-gray-3)"></div>';
    let head = '<div class="pms-row" style="top:100px;height:40px">' + bar(32, 16, 130, 8);
    COLS.forEach((x) => { head += bar(x - 256, 16, 32, 8); });
    head += bar(1110, 16, 40, 8) + '</div>';
    let week = '<div class="pms-row" style="top:140px"><div class="pms-abs" style="left:32px;top:13px;color:var(--color-ink-gray-5)">This week</div>';
    DATES.forEach((d, i) => { week += cell(COLS[i], i === 3 ? 'Oct 15' : d); });
    week += cell(1366, 'Total') + gb(1156, 8, 28, 28) + '</div>';
    let proj = '<div class="pms-row" style="top:184px">' + bar(48, 17, 120);
    COLS.forEach((x, i) => { proj += i === 3 ? cell(x, '05:30', 'at-thu', 'color:var(--color-ink-gray-8)') : bar(x - 256, 18, 32, 8); });
    proj += cell(1366, '29:30', 'at-tot', 'color:var(--color-ink-red-4);font-weight:600') + '</div>';
    for (const [top, lx, w] of [[228, 48, 200], [272, 72, 160]]) {
      proj += '<div class="pms-row" style="top:' + top + 'px">' + bar(lx, 17, w);
      COLS.forEach((x, i) => { if (i < 4) proj += bar(x - 256, 18, 32, 8); });
      proj += bar(1110, 18, 40, 8) + '</div>';
    }
    const i16 = (inner) => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none">' + inner + '</svg>';
    const resRow = (top, indent, icons, label, bold) => {
      let r = '<div class="pms-row" style="top:' + top + 'px"><div class="pms-abs" style="left:' + indent + 'px;top:12px;display:flex;align-items:center;gap:6px;color:var(--color-ink-gray-6)">' + icons + '<span style="color:var(--color-ink-gray-8)">' + label + '</span></div>';
      COLS.forEach((x, i) => { r += i === 3 ? cell(x, '02:30', '', 'color:var(--color-ink-gray-8)' + (bold ? ';font-weight:600' : '')) : cell(x, '-'); });
      return r + cell(1366, '02:30', '', 'color:var(--color-' + (bold ? 'ink-gray-6' : 'ink-green-4') + ')') + '</div>';
    };
    const ins = '<div class="pms-abs at-ins" style="left:0;right:0;top:316px;height:0;overflow:hidden">' + resRow(0, 26, i16(ROWICON.chev) + i16(ROWICON.folder), 'Atlas UI Stabilization') + resRow(44, 70, i16(ROWICON.task), 'Design system component refinements', true) + '</div>';
    const dlg = '<div class="pms-abs at-ov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)"></div><div class="pms-dialog at-dlg" style="left:464px;top:150px">' +
      '<div class="pms-abs" style="left:24px;top:16px;font-size:20px;font-weight:600">Add time</div><div class="pms-abs" style="left:462px;top:16px;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-6)">' + ic(IC.x, 16) + '</div>' +
      '<div class="pms-label" style="left:24px;top:52px">Project <b>*</b></div><div class="pms-input at-pin" style="left:24px;top:74px;width:464px"><span class="at-pv">Select project</span><span style="margin-left:auto;color:var(--color-ink-gray-4);display:flex">' + ic(IC.down, 16) + '</span></div>' +
      '<div class="pms-label" style="left:24px;top:113px">Task <b>*</b></div><div class="pms-input at-tin" style="left:24px;top:135px;width:464px"><span class="at-tv">Select task</span><span style="margin-left:auto;color:var(--color-ink-gray-4);display:flex">' + ic(IC.down, 16) + '</span></div>' +
      '<div class="pms-label" style="left:24px;top:174px">Date <b>*</b></div><div class="pms-input on" style="left:24px;top:196px;width:224px">2026-10-15<span style="margin-left:auto;color:var(--color-ink-gray-6);display:flex">' + ic(IC.cal, 16) + '</span></div>' +
      '<div class="pms-label" style="left:264px;top:174px">Duration <b>*</b></div><div class="pms-abs at-left" style="right:24px;top:175px;font-size:13px;color:var(--color-ink-gray-5)">2h 30m left</div><div class="pms-abs" style="left:264px;top:196px;width:224px;height:32px;border-radius:8px;background:var(--color-surface-gray-2);overflow:hidden"><div class="pms-abs at-dfill" style="left:0;top:0;height:32px;width:0;background:var(--color-surface-gray-4);border-radius:8px"><span class="pms-abs" style="right:8px;top:10px;width:2px;height:12px;border-radius:2px;background:rgba(23,23,23,.12)"></span></div><span class="pms-abs at-dv" style="right:10px;top:7px;font-variant-numeric:tabular-nums">00:00</span></div>' +
      '<div class="pms-abs" style="left:24px;top:239px;width:14px;height:14px;border:1px solid var(--color-outline-gray-3);border-radius:4px"></div><div class="pms-abs" style="left:46px;top:237px;font-weight:500">Add calendar events</div>' +
      '<div class="pms-label" style="left:24px;top:264px">Comment <b>*</b></div><div class="pms-input on" style="left:24px;top:286px;width:464px;height:84px;align-items:flex-start;padding-top:8px"><span class="at-cv"></span><span class="at-caret" style="display:inline-block;width:2px;height:17px;background:var(--color-ink-gray-8);margin-left:1px"></span></div>' +
      '<div class="pms-btn pms-btn-soft" style="left:24px;top:388px;width:228px">Save and add another</div><div class="pms-btn pms-btn-solid at-save" style="left:260px;top:388px;width:228px">Save and close</div>' +
      menu('at-pm', 110, PROJECTS) + menu('at-tm', 171, TASKS) + '</div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam at-cam"><div class="pms-win">' + side +
      head + week + proj + ins + '<div class="pms-abs at-below" style="left:0;right:0;top:316px;height:600px">' + skel + '</div>' + dlg + '<div class="pms-ring at-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.at-' + c);
    for (const k of ['cam', 'ov', 'dlg', 'pm', 'tm', 'pm-tint', 'tm-tint', 'pv', 'tv', 'dv', 'cv', 'caret', 'save', 'add', 'ins', 'below', 'thu', 'tot', 'ring', 'pin', 'tin']) this[k] = q(k);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.12, hold: 0.4 },
      { t: 1.2, cx: 1200, cy: 360, z: 2.0, hold: 0.15 },
      { t: 1.9, cx: 960, cy: 440, z: 2.2, hold: 4.2, drift: [0, 0, 0.004] },
      { t: 6.7, cx: 1190, cy: 362, z: 2.0, drift: [-3, 0, 0.006] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1500, 900] }, { t: 1.1, at: [1618, 118] },
      { t: 1.9, at: [960, 330] }, { t: 2.2, at: [844, 368] }, { t: 2.35, at: [844, 396] }, { t: 2.5, at: [844, 424] },
      { t: 2.95, at: [960, 391] }, { t: 3.25, at: [844, 429] }, { t: 3.4, at: [844, 457] },
      { t: 3.85, at: [1010, 452] }, { t: 4.0, at: [1010, 452] }, { t: 4.3, at: [1038, 452] },
      { t: 4.65, at: [824, 540] }, { t: 5.75, at: [1078, 642] },
      { t: 6.8, at: [1450, 470] }, { t: 9, at: [1460, 476] },
    ];
    this.cur.clicks = [1.2, 2.0, 2.6, 3.05, 3.5, 3.92, 4.75, 5.85];
    this.cur.holds = [[3.95, 4.35]];
    this.com = kit.typist(COMMENT, 4.82, 40);
    for (const k of ['dfill', 'left']) this[k] = q(k);
  },
  render(t) {
    t = warp(t);
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const open = eo(seg(t, 1.3, 1.45)) * (1 - ei(seg(t, 5.95, 6.12)));
    this.ov.style.opacity = open;
    this.dlg.style.opacity = open;
    this.dlg.style.visibility = open > 0 ? 'visible' : 'hidden';
    this.dlg.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, 1.3, 1.45))) + ')';
    const menuAt = (el, tint, a, b, i) => {
      const m = eo(seg(t, a, a + 0.18)) * (1 - seg(t, b, b + 0.12));
      el.style.opacity = m; el.style.visibility = m > 0 ? 'visible' : 'hidden';
      el.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, a, a + 0.18))) + ')';
      tint.style.top = (4 + 28 * i) + 'px';
    };
    menuAt(this.pm, this['pm-tint'], 2.05, 2.62, eio(seg(t, 2.2, 2.35)) + eio(seg(t, 2.35, 2.5)));
    menuAt(this.tm, this['tm-tint'], 3.1, 3.52, eio(seg(t, 3.25, 3.4)));
    this.pv.textContent = t >= 2.62 ? PROJECTS[2] : 'Select project';
    this.pin.classList.toggle('on', t >= 2.62);
    this.tv.textContent = t >= 3.52 ? TASKS[1] : 'Select task';
    this.tin.classList.toggle('on', t >= 3.52);
    const hrs = t < 3.92 ? 0 : Math.round(lerp(1.5, 2.5, eio(seg(t, 4.0, 4.3))) * 4) / 4;
    const mins = Math.round(hrs * 60), left = 150 - mins;
    this.dfill.style.width = (hrs / 8 * 100) + '%';
    this.dfill.style.visibility = hrs > 0 ? 'visible' : 'hidden';
    this.dv.textContent = String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
    this.left.textContent = Math.floor(left / 60) + 'h' + (left % 60 ? ' ' + (left % 60) + 'm' : '') + ' left';
    this.cv.textContent = this.com.at(t);
    const typing = t > 4.82 && t < this.com.end;
    this.caret.style.opacity = t > 4.75 && t < 5.95 && (typing || t < 4.82 || Math.floor(t / 0.53) % 2 === 0) ? 1 : 0;
    const press = (a) => 1 - 0.04 * seg(t, a - 0.05, a) * (1 - seg(t, a, a + 0.12));
    this.add.style.transform = 'scale(' + press(1.2) + ')';
    this.save.style.transform = 'scale(' + press(5.85) + ')';
    const k = eio(seg(t, 6.3, 6.65));
    this.ins.style.height = 88 * k + 'px';
    this.below.style.transform = 'translateY(' + 88 * k + 'px)';
    const done = t >= 6.45;
    this.thu.textContent = done ? '08:00' : '05:30';
    this.thu.style.fontWeight = done ? '600' : '400';
    this.tot.textContent = done ? '32:00' : '29:30';
    let r = null;
    for (const g of RINGS) if (t >= g[0] && t < g[1]) r = g;
    if (r) {
      const s = this.ring.style;
      s.left = r[2] + 'px'; s.top = r[3] + 'px'; s.width = r[4] + 'px'; s.height = r[5] + 'px';
      s.opacity = Math.min(eo(seg(t, r[0], r[0] + 0.25)), 1 - seg(t, r[1] - 0.15, r[1]));
    } else this.ring.style.opacity = 0;
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
