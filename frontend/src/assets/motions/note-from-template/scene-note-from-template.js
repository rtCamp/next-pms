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
const sv16 = (p, c) => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none;display:block;color:' + (c || 'currentColor') + '">' + p + '</svg>';
const P_X = '<path d="M12.1494 3.14648C12.3446 2.95126 12.6612 2.95135 12.8564 3.14648C13.0517 3.34175 13.0517 3.65825 12.8564 3.85352L8.70898 8.00098L12.8574 12.1494C13.0526 12.3446 13.0526 12.6612 12.8574 12.8564C12.6622 13.0516 12.3456 13.0517 12.1504 12.8564L8.00195 8.70801L3.85352 12.8564C3.65825 13.0517 3.34175 13.0517 3.14648 12.8564C2.95135 12.6612 2.95126 12.3446 3.14648 12.1494L7.29492 8.00098L3.14746 3.85352C2.95228 3.65827 2.95228 3.34173 3.14746 3.14648C3.34271 2.95137 3.65927 2.95132 3.85449 3.14648L8.00195 7.29395L12.1494 3.14648Z" fill="currentColor"/>';
const P_PLUS = '<path d="M8 3.5V12.5M3.5 8H12.5" stroke="currentColor" stroke-linecap="round"/>';
const P_DOWN = '<path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>';
const P_SEARCH = '<circle cx="7" cy="7" r="4.5" stroke="currentColor"/><path d="M10.5 10.5L13.5 13.5" stroke="currentColor" stroke-linecap="round"/>';
const G = (x, y, w, h, r, c) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;background:' + (c || 'var(--color-surface-gray-3)') + '"></div>';
const GT = (x, cy, w, c) => G(x, cy - 5, w, 10, 5, c);
const GS = (x, cy, w, c) => G(x, cy - 4, w, 8, 4, c);
const GI = (x, cy) => G(x, cy - 7, 14, 14, 4);
const HL = (x, y, w) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:1px;background:var(--color-outline-gray-1)"></div>';
const ghostPanel = () => {
  let s = '<div class="pms-abs" style="left:1139px;top:57px;width:1px;height:843px;background:var(--color-outline-gray-1)"></div>';
  s += GT(1160, 77.8, 136) + HL(1140, 95.5, 300);
  const sec = (cy, w) => G(1161, cy - 7, 14, 14, 4) + GT(1188, cy, w);
  s += sec(116.3, 64) + sec(163.3, 95) + G(1392, 149.4, 28, 28, 8);
  [[197.4, 123.3, 80.3], [231.5, 86.9, 32.9], [265.6, 64.6, 120.1], [299.7, 90.8, 35.7], [333.8, 94, 88.3]].forEach(([cy, a, b]) => { s += GT(1160, cy, a) + GT(1295.3, cy, b); });
  s += HL(1140, 357.9, 300) + sec(378.9, 35) + G(1166, 406, 14, 14, 7);
  s += HL(1140, 443, 300) + sec(464, 83) + GT(1160, 492, 85) + GT(1335.8, 492, 84) + G(1160, 510.1, 260, 8, 4);
  s += HL(1140, 534.1, 300) + sec(555.1, 111) + GT(1160, 583.2, 68) + GT(1331.4, 583.2, 89) + G(1160, 601.3, 260, 8, 4);
  s += HL(1140, 625.3, 300) + sec(646.3, 63);
  s += GT(1160, 682.4, 109) + G(1276.7, 666.4, 143.3, 32, 8) + GT(1160, 732.4, 95) + G(1276.7, 716.4, 143.3, 32, 8);
  s += GT(1160, 778.4, 103) + G(1270.8, 770.7, 83, 16, 8) + G(1392, 764.4, 28, 28, 8);
  [[808.4, 107, 58], [840.4, 80, 109], [872.4, 62, 50]].forEach(([cy, nw, rw]) => { s += G(1160, cy - 10, 20, 20, 10) + GT(1188, cy, nw) + GT(1188 + nw + 8, cy, rw); });
  return s;
};
const TABS = [[260, 62.7], [346.7, 60.1], [430.8, 57.2], [512, 51.7], [587.7, 35.3], [647, 48.4], [719.4, 39.2], [782.5, 35.9], [842.4, 42.1], [908.5, 65.3], [997.7, 65.7]];
const ghostTabs = () => TABS.map(([x, w]) => GT(x, 76.5, w)).join('') + HL(240, 96, 899) + '<div class="pms-abs" style="left:647px;top:95px;width:48.4px;height:1px;background:var(--color-ink-gray-7)"></div>';
const ghostCards = () => {
  let s = '';
  [199, 475].forEach((y) => [260, 553.3, 846.7].forEach((x, i) => {
    s += '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:273.3px;height:256px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:12px;background:var(--color-surface-white);box-shadow:0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)"></div>';
    s += GT(x + 15, y + 28, [128, 96, 150][i]) + GT(x + 15, y + 72, 220) + GT(x + 15, y + 94, 190) + GT(x + 15, y + 116, 205) + GT(x + 15, y + 138, 120);
    s += G(x + 15, y + 222, 20, 20, 10) + GT(x + 43, y + 232, 70) + GT(x + 273.3 - 15 - 28, y + 232, 28);
  }));
  return s;
};
const ROWS = [0, 1, 2, 3, 4, 5].map((i) => [508, 318.1 + 55.1 * i, 424, 51.1]);
const dlgRow = (i) => {
  const target = i === 1;
  const f = target ? 'var(--color-surface-gray-4)' : undefined;
  let s = '<div class="pms-abs nt-r' + i + '" style="left:0;top:' + (55.1 * i) + 'px;width:424px;height:51.1px;border-radius:10px">';
  s += target ? '<div class="pms-abs" style="left:12px;top:8px;font-size:14px;font-weight:500;line-height:16.1px;color:var(--color-ink-gray-8);white-space:nowrap">Weekly status</div>' : GT(12, 16, [180, 96, 120, 70, 110, 150][i]);
  s += GS(12, 36, [90, 150, 110, 80, 130, 60][i], f) + G(336 - [70, 62, 40, 56, 48, 60][i], 14.6, [70, 62, 40, 56, 48, 60][i], 21.8, 5, f) + G(358, 18, 14, 14, 4, f) + G(391, 18, 14, 14, 4, f);
  return s + '</div>';
};
const mix = (a, b, p) => 'color-mix(in srgb, var(--color-' + a + '), var(--color-' + b + ') ' + p * 100 + '%)';
const hov = (t, a, b) => eo(seg(t, a, a + 0.15)) * (1 - seg(t, b, b + 0.15));
const T = { create: 1.5, item: 2.5, row: 4.65, use: 5.85, load: 6.5 };
const RING = [ // [from, to, left, top, width, height, radius] in window coordinates
  [1.0, 1.5, 1005.8, 108, 118.2, 38, 11],
  [2.0, 2.5, 961, 147, 156, 38, 11],
  [4.15, 4.65, 503, 368.2, 434, 61.1, 13],
  [5.4, 5.85, 823.8, 657.1, 113.3, 38, 11],
  [7.0, 9.4, 296, 108, 788, 376, 11],
];
kit.scene('note-from-template', {
  init(kit) {
    const side = SHELL('project-detail');
    const title = '<div class="pms-abs" style="left:260px;top:116px;font-size:18px;font-weight:600;line-height:21px;color:var(--color-ink-gray-5);white-space:nowrap">Notes</div>';
    const create = '<div class="pms-btn pms-btn-solid nt-create" style="left:1010.8px;top:113px;width:108.2px;padding:0 8px;gap:8px;font-weight:420;justify-content:flex-start">' + sv16(P_PLUS) + 'Create' + sv16(P_DOWN) + '</div>';
    const list = '<div class="pms-abs nt-list" style="inset:0">' + ghostTabs() + title + G(896.5, 113, 106.3, 28, 8) + G(260, 157, 256, 28, 8) + G(524, 157, 256, 28, 8) + G(993, 157, 126, 28, 8) + ghostCards() + create + '</div>';
    const item = (y, label) => '<div class="pms-abs nt-i" style="left:6px;top:' + y + 'px;width:146px;height:28px;border-radius:8px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;font-size:14px;font-weight:420;white-space:nowrap;color:var(--color-ink-gray-7)">' + label + '</div>';
    const menu = '<div class="pms-abs nt-menu" style="left:959px;top:145px;width:160px;height:98px;box-sizing:border-box;border:1px solid var(--color-outline-gray-1);border-radius:12px;background:var(--color-surface-modal);box-shadow:0 0 1px rgba(0,0,0,.2), 0 1px 3px rgba(0,0,0,.05), 0 10px 24px -3px rgba(0,0,0,.1);visibility:hidden">' +
      item(6, 'New from template') + item(34, 'New blank note') + item(62, 'Create template') + '</div>';
    const btn = (cls, x, w, label, extra) => '<div class="pms-abs ' + cls + '" style="left:' + x + 'px;top:542.1px;width:' + w + 'px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:420;white-space:nowrap;' + extra + '">' + label + '</div>';
    const dlg = '<div class="pms-abs nt-d" style="left:496px;top:120px;width:448px;height:594.1px;border-radius:16px;background:var(--color-surface-modal);box-shadow:0 0 1px rgba(0,0,0,.19), 0 1px 2px rgba(0,0,0,.07), 0 6px 15px -5px rgba(0,0,0,.11);opacity:0;visibility:hidden">' +
      '<div class="pms-abs" style="left:24px;top:20px;font-size:20px;font-weight:500;line-height:30px;color:var(--color-ink-gray-9);white-space:nowrap">Add Template</div>' +
      '<div class="pms-abs" style="left:412px;top:27px;color:var(--color-ink-gray-8)">' + sv16(P_X) + '</div>' +
      '<div class="pms-abs" style="left:24px;top:70px;width:400px;height:32px;box-sizing:border-box;border-radius:8px;background:var(--color-surface-gray-2)"></div>' +
      '<div class="pms-abs" style="left:34px;top:78px;color:var(--color-ink-gray-5)">' + sv16(P_SEARCH) + '</div>' + GT(65, 86, 96) +
      '<div class="pms-abs" style="left:24px;top:122px;width:400px;height:32px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;background:var(--color-surface-white)"></div>' +
      GT(33, 138, 92) + '<div class="pms-abs" style="left:392px;top:130px;color:var(--color-ink-gray-5)">' + sv16(P_DOWN) + '</div>' +
      GT(24, 184, 68) + G(98, 177, 14, 14, 7) +
      '<div class="pms-abs" style="left:12px;top:198.1px;width:424px;height:320px;overflow:hidden">' + [0, 1, 2, 3, 4, 5].map(dlgRow).join('') + '</div>' +
      btn('', 262.8, 62, 'Cancel', 'color:var(--color-ink-gray-8)') + btn('nt-use', 332.8, 103.3, 'Use template', '') + '</div>';
    const bar = (cy, w) => GT(330, cy, w);
    const sect = (hy, label, a, b) => '<div class="pms-abs" style="left:306px;top:' + hy + 'px;font-size:18px;font-weight:600;line-height:24px;color:var(--color-ink-gray-7);white-space:nowrap">' + label + '</div>' +
      [[hy + 44, a], [hy + 72, b]].map(([cy, w]) => G(316, cy - 2, 4, 4, 2, 'var(--color-surface-gray-4)') + bar(cy, w)).join('');
    const editor = '<div class="pms-abs nt-ed" style="inset:0;visibility:hidden">' + G(306, 77, 20, 20, 10) + GT(334, 87, 84) +
      '<div class="pms-abs" style="left:994px;top:73px;width:80px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:420;background:var(--color-surface-gray-2);color:var(--color-ink-gray-4)">Save note</div>' +
      '<div class="pms-abs" style="left:306px;top:117px;font-size:30px;font-weight:600;line-height:37.5px;color:var(--color-ink-gray-7);white-space:nowrap">Weekly status</div>' +
      sect(164, 'Progress', 250, 190) + sect(276, 'Next steps', 210, 270) + sect(388, 'Blockers', 180, 230) + '</div>';
    const spin = '<div class="pms-abs nt-spin" style="left:680px;top:107px;width:20px;height:20px;box-sizing:border-box;border:2px solid var(--color-outline-gray-2);border-top-color:var(--color-ink-gray-5);border-radius:50%;visibility:hidden"></div>';
    const page = '<div class="pms-abs" style="inset:0">' + side + ghostPanel() + list + editor + spin + menu +
      '<div class="pms-abs nt-ov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;visibility:hidden"></div>' + dlg + '<div class="pms-ring nt-ring"></div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam nt-cam"><div class="pms-win">' + page + '</div></div></div>'));
    const q = (c) => kit.stage.querySelector('.nt-' + c);
    for (const k of ['cam', 'list', 'create', 'menu', 'ov', 'd', 'use', 'ed', 'spin', 'ring']) this[k] = q(k);
    this.items = [...kit.stage.querySelectorAll('.nt-i')];
    this.rows = [0, 1, 2, 3, 4, 5].map((i) => q('r' + i));
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.1, hold: 0.5 },
      { t: 1.2, cx: 1180, cy: 360, z: 2.0, hold: 1.3, drift: [-4, 0, 0.004] },
      { t: 3.5, cx: 960, cy: 520, z: 1.5, hold: 2.4, drift: [0, 0, 0.004] },
      { t: 7.0, cx: 930, cy: 430, z: 1.6, hold: 3.0, drift: [0, 0, 0.004] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1500, 900] }, { t: 1.2, at: [1305, 217] }, { t: 1.55, at: [1305, 217] },
      { t: 2.1, at: [1279, 256] }, { t: 2.5, at: [1279, 256] },
      { t: 4.1, at: [940, 489] }, { t: 4.7, at: [940, 489] },
      { t: 5.35, at: [1150, 770] }, { t: 5.9, at: [1150, 770] },
      { t: 7.0, at: [1440, 600] },
    ];
    this.cur.clicks = [T.create, T.item, T.row, T.use];
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const [cx, cy] = this.cur.position(t);
    const wx = cx - 240, wy = cy - 90;
    const inRoute = t < T.use;
    const editor = t >= T.load;
    this.list.style.visibility = inRoute ? 'visible' : 'hidden';
    this.ed.style.visibility = editor ? 'visible' : 'hidden';
    this.spin.style.visibility = !inRoute && !editor ? 'visible' : 'hidden';
    this.spin.style.transform = 'rotate(' + (t * 720) % 360 + 'deg)';
    this.create.style.background = mix('surface-gray-7', 'surface-gray-6', hov(t, 1.1, 1.6));
    const menuOn = t >= T.create && t < T.item;
    this.menu.style.visibility = menuOn ? 'visible' : 'hidden';
    this.items.forEach((el, i) => {
      const over = wx > 966 && wx < 1112 && wy > 152 + 28 * i && wy < 180 + 28 * i;
      el.style.background = over ? 'var(--color-surface-gray-3)' : 'transparent';
    });
    const open = t >= T.item && t < T.use;
    const o = eo(seg(t, T.item, T.item + 0.15)) * (1 - seg(t, T.use, T.use + 0.15));
    this.ov.style.opacity = o;
    this.ov.style.visibility = o > 0 ? 'visible' : 'hidden';
    this.d.style.visibility = open ? 'visible' : 'hidden';
    this.d.style.opacity = open ? lerp(0.5, 1, seg(t, T.item, T.item + 0.1)) : 0;
    this.d.style.transform = 'scale(' + lerp(0.98, 1, seg(t, T.item, T.item + 0.1)) + ')';
    this.rows.forEach((el, i) => {
      const [rx, ry, rw, rh] = ROWS[i];
      const over = wx > rx && wx < rx + rw && wy > ry && wy < ry + rh;
      el.style.background = i === 1 && t >= T.row ? 'var(--color-surface-gray-3)' : over ? 'var(--color-surface-gray-2)' : 'transparent';
    });
    const sk = eo(seg(t, T.row, T.row + 0.15));
    const overUse = wx > 828.8 && wx < 932.1 && wy > 662.1 && wy < 690.1;
    this.use.style.background = t >= T.row + 0.15 ? mix('surface-gray-7', 'surface-gray-6', overUse ? 1 : 0) : mix('surface-gray-2', 'surface-gray-7', sk);
    this.use.style.color = mix('ink-gray-4', 'ink-white', sk);
    let r = null;
    for (const g of RING) if (t >= g[0] && t < g[1]) r = g;
    if (r) {
      const s = this.ring.style;
      s.left = r[2] + 'px'; s.top = r[3] + 'px'; s.width = r[4] + 'px'; s.height = r[5] + 'px'; s.borderRadius = r[6] + 'px';
      s.opacity = Math.min(eo(seg(t, r[0], r[0] + 0.25)), 1 - seg(t, r[1] - 0.15, r[1]));
    } else this.ring.style.opacity = 0;
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
