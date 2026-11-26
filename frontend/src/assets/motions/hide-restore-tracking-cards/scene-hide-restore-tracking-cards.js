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
const P_EDIT = '<path d="M8.47949 1.75C8.75549 1.75018 8.97949 1.97397 8.97949 2.25C8.97949 2.52603 8.75549 2.74982 8.47949 2.75H4.75C3.64543 2.75 2.75 3.64543 2.75 4.75V11.25C2.75 12.3546 3.64543 13.25 4.75 13.25H11.25C12.3546 13.25 13.25 12.3546 13.25 11.25V7.52051C13.2502 7.24451 13.474 7.02051 13.75 7.02051C14.026 7.02051 14.2498 7.24451 14.25 7.52051V11.25C14.25 12.9069 12.9069 14.25 11.25 14.25H4.75C3.09315 14.25 1.75 12.9069 1.75 11.25V4.75C1.75 3.09315 3.09315 1.75 4.75 1.75H8.47949ZM13.3965 1.89648C13.5918 1.70144 13.9083 1.70129 14.1035 1.89648C14.2985 2.09169 14.2985 2.40831 14.1035 2.60352L7.37109 9.33594C7.17589 9.53101 6.8593 9.53094 6.66406 9.33594C6.46884 9.14071 6.46892 8.82418 6.66406 8.62891L13.3965 1.89648Z" fill="currentColor"/>';
const P_X = '<path d="M12.1494 3.14648C12.3446 2.95126 12.6612 2.95135 12.8564 3.14648C13.0517 3.34175 13.0517 3.65825 12.8564 3.85352L8.70898 8.00098L12.8574 12.1494C13.0526 12.3446 13.0526 12.6612 12.8574 12.8564C12.6622 13.0516 12.3456 13.0517 12.1504 12.8564L8.00195 8.70801L3.85352 12.8564C3.65825 13.0517 3.34175 13.0517 3.14648 12.8564C2.95135 12.6612 2.95126 12.3446 3.14648 12.1494L7.29492 8.00098L3.14746 3.85352C2.95228 3.65827 2.95228 3.34173 3.14746 3.14648C3.34271 2.95137 3.65927 2.95132 3.85449 3.14648L8.00195 7.29395L12.1494 3.14648Z" fill="currentColor"/>';
const P_ARROW = '<path d="M4.5 11.5L11.5 4.5M5.5 4.5H11.5V10.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>';
const G = (x, y, w, h, r) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;background:var(--color-surface-gray-3)"></div>';
const GT = (x, cy, w) => G(x, cy - 5, w, 10, 5);
const GI = (x, cy) => G(x, cy - 7, 14, 14, 4);
const GD = (x, y) => G(x, y, 8, 8, 4);
const HL = (x, y, w) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:1px;background:var(--color-outline-gray-1)"></div>';
const CARD = (x, y, w, h, inner) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;box-sizing:border-box;border:1px solid var(--color-outline-gray-1);border-radius:16px;background:var(--color-surface-cards)"></div>' + (inner || '');
// Focus: a burn card as the app draws it (card-relative coordinates)
const BURN = {
  budget: { title: 'Budget burn (to date)', link: '', a: 0.24, f: 0.72, rows: [['Actual budget burn', '₹1,20,000.00', 'surface-green-5'], ['Forecasted budget burn', '₹2,40,000.00', 'surface-green-3'], ['Total project budget', '₹5,00,000.00', 'surface-gray-3']] },
  cost: { title: 'Cost burn (to date)', link: 'All Timesheets', a: 0.225, f: 0.675, rows: [['Actual cost incurred', '₹90,000.00', 'surface-green-5'], ['Forecasted cost to completion', '₹1,80,000.00', 'surface-green-3'], ['Target cost', '₹4,00,000.00', 'surface-gray-3']] },
};
const burnCard = (cls, kind, x, w) => {
  const d = BURN[kind];
  let s = '<div class="pms-abs ' + cls + '" style="left:' + x + 'px;top:463.5px;width:' + w + 'px;height:146.4px;box-sizing:border-box;border:1px solid var(--color-outline-gray-1);border-radius:16px;background:var(--color-surface-cards);font-size:14px;font-weight:420;line-height:16px;white-space:nowrap">';
  s += '<div class="pms-abs" style="left:12px;top:12px;font-weight:500;color:var(--color-ink-gray-8)">' + d.title + '</div>';
  if (d.link) s += '<div class="pms-abs" style="right:12px;top:12px;display:flex;align-items:center;gap:4px;color:var(--color-ink-gray-6)">' + d.link + sv16(P_ARROW) + '</div>';
  s += '<div class="pms-abs" style="left:12px;top:44.1px;width:' + (w - 26) + 'px;height:8px;border-radius:9999px;background:var(--color-surface-gray-2);overflow:hidden">' +
    '<div class="pms-abs" style="left:0;top:0;height:8px;width:' + ((d.a + d.f) * 100) + '%;background:var(--color-surface-green-3)"></div>' +
    '<div class="pms-abs" style="left:0;top:0;height:8px;width:' + (d.a * 100) + '%;background:var(--color-surface-green-5)"></div></div>';
  d.rows.forEach(([lab, val, col], i) => {
    const y = 72.1 + 24.1 * i;
    s += '<div class="pms-abs" style="left:12px;top:' + (y + 4) + 'px;width:8px;height:8px;border-radius:9999px;background:var(--color-' + col + ')"></div>' +
      '<div class="pms-abs" style="left:28px;top:' + y + 'px;color:var(--color-ink-gray-6)">' + lab + '</div>' +
      '<div class="pms-abs" style="right:12px;top:' + y + 'px;font-weight:500;color:var(--color-ink-gray-7)">' + val + '</div>';
  });
  s += '<div class="pms-abs ' + cls + '-x" style="left:' + (w - 37) + 'px;top:7px;width:28px;height:28px;border-radius:8px;background:var(--color-surface-gray-2);display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-8);visibility:hidden">' + sv16(P_X) + '</div>';
  return s + '</div>';
};
const ghostRows = () => {
  let s = '';
  s += CARD(260, 165, 282.3, 80) + GT(273, 186, 121) + GT(273, 221.3, 108);
  s += CARD(554.3, 165, 564.7, 80) + GT(567.3, 190.6, 102) + GT(567.3, 216.7, 107) + HL(791.6, 178, 1).replace('height:1px', 'height:54px') + GT(891.4, 190.6, 151) + GT(891.4, 216.7, 60.5) + G(1078, 178, 28, 28, 8);
  s += CARD(260, 269, 423.5, 170.5) + GT(273, 290, 84.3) + G(273, 314, 397.5, 8, 4);
  [[346.1, 139.8, 38.1], [370.2, 172.5, 29.6], [394.3, 124.5, 38.7], [418.4, 142.3, 45.1]].forEach(([cy, lw, vw]) => { s += GD(273, cy - 4) + GT(289, cy, lw) + GT(671 - vw, cy, vw); });
  s += CARD(695.5, 269, 423.5, 170.5) + GT(709, 290, 142) + GT(1008, 290, 74) + GI(1091, 290) + G(709, 314, 397.5, 8, 4);
  [[346.1, 116, 38], [370.2, 139, 38], [394.3, 121, 86]].forEach(([cy, lw, vw]) => { s += GD(709, cy - 4) + GT(725, cy, lw) + GT(1106 - vw, cy, vw); });
  [[260, 141], [550.3, 153], [840.7, 203]].forEach(([x, lw]) => { s += CARD(x, 633.8, 278.3, 80) + GT(x + 13, 655, lw) + GT(x + 13, 690, 49); });
  s += CARD(260, 737.8, 859, 131) + GT(273, 765, 67) + G(1078, 751, 28, 28, 8);
  [[281, 60], [385, 54], [493, 84], [611, 70], [725, 60], [801, 69], [936, 80]].forEach(([x, w]) => { s += GT(x, 802, w); });
  s += HL(273, 813.8, 833);
  [[281, 76], [385, 84], [551, 26], [655, 26], [761, 24]].forEach(([x, w]) => { s += GT(x, 835, w); });
  s += GI(1077, 835) + HL(281, 854.8, 817);
  s += CARD(260, 892.8, 859, 173);
  return s;
};
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
const ghostTabs = () => TABS.map(([x, w]) => GT(x, 76.5, w)).join('') + HL(240, 96, 899) + '<div class="pms-abs" style="left:430.8px;top:95px;width:57.2px;height:1px;background:var(--color-ink-gray-7)"></div>';
// dialogs are 384 wide, radius 16, centred
const D1 = [528, 349.9, 384, 200.2], D2 = [528, 120, 384, 280];
const dlgBtn = (cls, x, y, w, label, bg, col, extra) => '<div class="pms-abs ' + cls + '" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:420;white-space:nowrap;background:' + bg + ';color:' + col + ';' + (extra || '') + '">' + label + '</div>';
const dlgHead = (title) => '<div class="pms-abs" style="left:24px;top:22px;font-size:20px;font-weight:600;line-height:24px;color:var(--color-ink-gray-8);white-space:nowrap">' + title + '</div><div class="pms-abs" style="left:328px;top:20px;width:32px;height:28px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-8)">' + sv16(P_X) + '</div>';
const RING = [ // [from, to, left, top, width, height, radius] in window coordinates
  [1.0, 1.5, 1048.7, 108, 75.3, 38, 11],
  [2.8, 3.25, 642.5, 466.5, 38, 38, 11],
  [4.55, 5.05, 814, 489.1, 79, 38, 11],
  [6.9, 7.35, 957, 108, 108.3, 38, 11],
  [8.5, 9.0, 829.4, 237, 52.6, 38, 11],
  [9.75, 10.2, 834.8, 343, 58.2, 38, 11],
  [11.35, 11.8, 1063.2, 108, 60.8, 38, 11],
  [12.1, 14.7, 255, 458.5, 433.5, 156.4, 19],
];
const T = { edit: 1.45, x: 3.2, rm: 5.0, aw: 7.3, add: 8.95, save: 10.2, done: 11.8 };
const mix = (a, b, p) => 'color-mix(in srgb, var(--color-' + a + '), var(--color-' + b + ') ' + p * 100 + '%)';
const hov = (t, a, b) => eo(seg(t, a, a + 0.15)) * (1 - seg(t, b, b + 0.15));
kit.scene('hide-restore-tracking-cards', {
  init(kit) {
    const side = SHELL('project-detail');
    const title = '<div class="pms-abs" style="left:260px;top:116px;font-size:18px;font-weight:600;line-height:21px;color:var(--color-ink-gray-5);white-space:nowrap">Tracking</div>';
    const edit = '<div class="pms-btn pms-btn-solid tc-edit" style="left:1053.7px;top:113px;width:65.3px;padding:0;gap:8px;font-weight:420;justify-content:flex-start;padding-left:8px">' + sv16(P_EDIT) + 'Edit</div>';
    const addw = dlgBtn('tc-addw', 962, 113, 98.3, 'Add widgets', 'transparent', 'var(--color-ink-gray-8)', 'visibility:hidden');
    const done = dlgBtn('tc-done', 1068.2, 113, 50.8, 'Done', 'var(--color-surface-gray-2)', 'var(--color-ink-gray-8)', 'visibility:hidden');
    const cards = burnCard('tc-b', 'budget', 260, 423.5) + burnCard('tc-c2', 'cost', 695.5, 423.5) + burnCard('tc-c1', 'cost', 260, 859);
    const row = (i, label) => '<div class="pms-abs" style="left:35px;top:' + (77 + 45 * i + 14) + 'px;margin-top:-8px;font-size:14px;font-weight:500;line-height:16px;color:var(--color-ink-gray-7)">' + label + '</div>';
    const dlgBox = 'border-radius:16px;background:var(--color-surface-modal);box-shadow:0 20px 60px rgba(0,0,0,.18);opacity:0;visibility:hidden';
    const dlg1 = '<div class="pms-abs tc-d1" style="left:' + D1[0] + 'px;top:' + D1[1] + 'px;width:384px;height:' + D1[3] + 'px;' + dlgBox + '">' + dlgHead('Remove widget') +
      '<div class="pms-abs" style="left:24px;top:72px;width:336px;font-size:14px;font-weight:420;line-height:16.1px;color:var(--color-ink-gray-7)">Remove "Budget burn" from this project\'s tracking page? Everyone on the project sees this change.</div>' +
      dlgBtn('', 225, 144.2, 62, 'Cancel', 'transparent', 'var(--color-ink-gray-8)') + dlgBtn('tc-rm', 291, 144.2, 69, 'Remove', 'var(--color-surface-red-5)', 'var(--color-ink-white)') + '</div>';
    const subtle = 'display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:420;height:28px;border-radius:8px;background:var(--color-surface-gray-2);color:var(--color-ink-gray-8)';
    const dlg2 = '<div class="pms-abs tc-d2" style="left:' + D2[0] + 'px;top:' + D2[1] + 'px;width:384px;height:' + D2[3] + 'px;' + dlgBox + '">' + dlgHead('Add widgets') +
      '<div class="pms-abs" style="left:24px;top:68px;width:336px;height:136px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:12px"></div>' +
      row(0, 'Task completion') + row(1, 'Budget burn') + row(2, 'Cost burn') + HL(35, 113, 314) + HL(35, 158, 314) +
      '<div class="pms-abs tc-bt0" style="left:306.4px;top:77px;width:42.6px;' + subtle + '">Add</div>' +
      '<div class="pms-abs tc-bt1" style="left:306.4px;top:122px;width:42.6px;' + subtle + '">Add</div>' +
      '<div class="pms-abs tc-bt2" style="left:280px;top:167px;width:69px;' + subtle + ';background:var(--color-surface-red-2);color:var(--color-ink-red-4)">Remove</div>' +
      dlgBtn('', 241.8, 228, 62, 'Cancel', 'transparent', 'var(--color-ink-gray-8)') + dlgBtn('tc-save', 311.8, 228, 48.2, 'Save', 'var(--color-surface-gray-2)', 'var(--color-ink-gray-4)') + '</div>';
    const page = '<div class="pms-abs" style="inset:0">' + side + ghostTabs() + title + ghostRows() + ghostPanel() + edit + addw + done + cards +
      '<div class="pms-abs tc-ov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;visibility:hidden"></div>' + dlg1 + dlg2 + '<div class="pms-ring tc-ring"></div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam tc-cam"><div class="pms-win">' + page + '</div></div></div>'));
    const q = (c) => kit.stage.querySelector('.tc-' + c);
    for (const k of ['cam', 'edit', 'addw', 'done', 'b', 'b-x', 'c1', 'c1-x', 'c2', 'c2-x', 'ov', 'd1', 'd2', 'rm', 'bt0', 'bt1', 'bt2', 'save', 'ring']) this[k] = q(k);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.1, hold: 0.5 },
      { t: 1.2, cx: 1180, cy: 360, z: 2.0, hold: 0.7, drift: [-4, 0, 0.004] },
      { t: 2.7, cx: 900, cy: 500, z: 2.0, hold: 0.6, drift: [0, 2, 0.004] },
      { t: 3.9, cx: 960, cy: 540, z: 2.0, hold: 2.0, drift: [0, 0, 0.005] },
      { t: 6.9, cx: 1180, cy: 360, z: 2.0, hold: 0.4, drift: [-3, 0, 0.004] },
      { t: 7.9, cx: 960, cy: 390, z: 1.8, hold: 2.3, drift: [0, 0, 0.005] },
      { t: 11.0, cx: 960, cy: 430, z: 1.6, hold: 4.0, drift: [0, 0, 0.004] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1500, 900] }, { t: 1.2, at: [1326, 217] }, { t: 1.5, at: [1326, 217] },
      { t: 2.8, at: [901, 575] }, { t: 3.45, at: [901, 575] },
      { t: 4.3, at: [1093, 598] }, { t: 5.1, at: [1093, 598] }, { t: 5.6, at: [1093, 598] },
      { t: 6.55, at: [1251, 217] }, { t: 7.4, at: [1251, 217] },
      { t: 8.4, at: [1096, 346] }, { t: 9.0, at: [1096, 346] },
      { t: 9.9, at: [1104, 452] }, { t: 10.25, at: [1104, 452] },
      { t: 11.3, at: [1334, 217] }, { t: 11.85, at: [1334, 217] }, { t: 12.9, at: [1340, 262] },
    ];
    this.cur.clicks = [T.edit, T.x, T.rm, T.aw, T.add, T.save, T.done];
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const editing = t >= T.edit && t < T.done;
    const hidden = t >= T.rm + 0.15 && t < T.save + 0.15;
    this.edit.style.visibility = editing ? 'hidden' : 'visible';
    this.addw.style.visibility = editing ? 'visible' : 'hidden';
    this.done.style.visibility = editing ? 'visible' : 'hidden';
    this.edit.style.background = mix('surface-gray-7', 'surface-gray-6', Math.max(hov(t, 1.1, T.edit), hov(t, T.done, 99)));
    this.addw.style.background = mix('surface-white', 'surface-gray-3', hov(t, 6.55, T.aw));
    this.done.style.background = mix('surface-gray-2', 'surface-gray-3', hov(t, 11.2, T.done));
    this.b.style.visibility = hidden ? 'hidden' : 'visible';
    this.c2.style.visibility = hidden ? 'hidden' : 'visible';
    this.c1.style.visibility = hidden ? 'visible' : 'hidden';
    const xv = editing ? 'visible' : 'hidden';
    this['b-x'].style.visibility = xv; this['c2-x'].style.visibility = xv; this['c1-x'].style.visibility = xv;
    this['b-x'].style.background = mix('surface-gray-2', 'surface-gray-3', hov(t, 2.75, T.x + 0.05));
    const o1 = eo(seg(t, T.x, T.x + 0.15)) * (1 - seg(t, T.rm, T.rm + 0.15));
    const o2 = eo(seg(t, T.aw, T.aw + 0.15)) * (1 - seg(t, T.save, T.save + 0.15));
    const sty = (el, o, a) => { el.style.opacity = o; el.style.visibility = o > 0 ? 'visible' : 'hidden'; el.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, a, a + 0.15))) + ')'; };
    sty(this.d1, o1, T.x); sty(this.d2, o2, T.aw);
    const ov = Math.max(o1, o2);
    this.ov.style.opacity = ov; this.ov.style.visibility = ov > 0 ? 'visible' : 'hidden';
    this.rm.style.background = mix('surface-red-5', 'surface-red-6', hov(t, 4.3, T.rm));
    // Budget burn is hidden until Add is clicked, then the row shows Remove
    const staged = t >= T.add;
    const asAdd = (el, on) => { el.textContent = 'Add'; el.style.left = '306.4px'; el.style.width = '42.6px'; el.style.background = mix('surface-gray-2', 'surface-gray-3', on); el.style.color = 'var(--color-ink-gray-8)'; };
    asAdd(this.bt0, 0);
    if (staged) { this.bt1.textContent = 'Remove'; this.bt1.style.left = '280px'; this.bt1.style.width = '69px'; this.bt1.style.background = 'var(--color-surface-red-2)'; this.bt1.style.color = 'var(--color-ink-red-4)'; }
    else asAdd(this.bt1, hov(t, 8.4, T.add));
    // Save enables once a change is staged
    const sk = eo(seg(t, T.add, T.add + 0.15));
    this.save.style.background = t >= T.add + 0.15 ? mix('surface-gray-7', 'surface-gray-6', hov(t, 9.9, T.save)) : mix('surface-gray-2', 'surface-gray-7', sk);
    this.save.style.color = mix('ink-gray-4', 'ink-white', sk);
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
