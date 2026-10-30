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
const G = (x, y, w, h, r) => {
  if (r == null && w === h && w <= 18) { const d = (w - 14) / 2; x += d; y += d; w = h = 14; r = 4; }
  else if (r == null && h <= 22) { y += (h - 10) / 2; h = 10; r = 5; }
  return '<i class="gh" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px' + (r == null ? '' : ';border-radius:' + r + 'px') + '"></i>';
};
const L = (x, y, w) => '<i class="hair" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px"></i>';
const CHECK = '<svg class="ic" viewBox="0 0 16 16"><path fill="currentColor" d="M13.083 3.38232C13.2635 3.17364 13.5792 3.15115 13.7881 3.33154C13.9968 3.51208 14.0202 3.82774 13.8398 4.03662L6.42871 12.6167C6.33494 12.7251 6.19902 12.789 6.05566 12.7905C5.91224 12.7919 5.77468 12.7311 5.67871 12.6245L2.16797 8.72412C1.98372 8.51899 2.00032 8.20273 2.20508 8.01807C2.41033 7.83334 2.72738 7.84992 2.91211 8.05518L6.04199 11.5337L13.083 3.38232Z"/></svg>';
const fade = (t, a, b) => eo(seg(t, a, a + 0.25)) * (1 - ei(seg(t, b, b + 0.25)));
const dip = (t, c) => 1 - 0.04 * seg(t, c, c + 0.06) * (1 - seg(t, c + 0.12, c + 0.24));
const T = { sc0: 1.4, sc1: 2.6, r1: 4.25, c1: 5.0, open: 5.05, r2: 7.15, c2: 7.9, done: 8.5, r3: 8.75 };
const SCROLL = 517.7;
const DX = 464, DY = 120;
const Y0 = 1097.9;
const NAME = 'Shanthi Priya';
const XMARK16 = '<svg style="display:block;width:16px;height:16px" viewBox="0 0 16 16"><path fill="currentColor" d="M12.1494 3.14648C12.3446 2.95126 12.6612 2.95135 12.8564 3.14648C13.0517 3.34175 13.0517 3.65825 12.8564 3.85352L8.70898 8.00098L12.8574 12.1494C13.0526 12.3446 13.0526 12.6612 12.8574 12.8564C12.6622 13.0516 12.3456 13.0517 12.1504 12.8564L8.00195 8.70801L3.85352 12.8564C3.65825 13.0517 3.34175 13.0517 3.14648 12.8564C2.95135 12.6612 2.95126 12.3446 3.14648 12.1494L7.29492 8.00098L3.14746 3.85352C2.95228 3.65827 2.95228 3.34173 3.14746 3.14648C3.34271 2.95137 3.65927 2.95132 3.85449 3.14648L8.00195 7.29395L12.1494 3.14648Z"/></svg>';
const SPIN = '<svg style="display:block;width:13.5px;height:13.5px" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity=".25"/><path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>';
const BADGE = (x, y, w, bg, fg, txt) => '<span style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:24px;box-sizing:border-box;padding:0 8px;border-radius:9999px;background:' + bg + ';color:' + fg + ';display:flex;align-items:center;gap:4px;font-size:13px;font-weight:420;line-height:15px;letter-spacing:.26px;white-space:nowrap">' + txt + '</span>';
const TXT = (x, y, size, weight, lh, color, txt, extra) => '<span style="position:absolute;left:' + x + 'px;top:' + y + 'px;font-size:' + size + 'px;font-weight:' + weight + ';line-height:' + lh + 'px;letter-spacing:' + (size * 0.02).toFixed(2) + 'px;color:' + color + ';white-space:nowrap' + (extra || '') + '">' + txt + '</span>';
const AV = (x, y, d) => '<span style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + d + 'px;height:' + d + 'px;border-radius:9999px;background:var(--color-surface-gray-2);color:var(--color-ink-gray-5);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:500;line-height:16px">' + NAME[0] + '</span>';
const CARD = (x, y, w, h) => '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;box-sizing:border-box;border:1px solid var(--color-outline-gray-1);border-radius:12px;background:var(--color-surface-white)"></div>';
const ghostRow = (y, nw, line) => G(1073.3, y + 14.5, 24, 24, 9999) + G(1109.3, y + 10, nw, 16) + G(1109.3, y + 32.1, 168.5, 8, 4) + G(1315.7, y + 14.5, 75.3, 24, 9999) + (line ? L(1058.3, y + 53.1, 344.7) : '');
const dashboard = () => {
  let s = '';
  [[260, 98.8, 12.5, 0], [553, 182.6, 36.6, 62.6], [846, 140.5, 12.9, 62.6], [1139, 157, 12.1, 0]].forEach(([x, lw, vw, sw]) => {
    s += CARD(x, 121.7, 281, 73.1) + G(x + 13, 134.7, lw, 16) + G(x + 13, 165.3, vw + 8, 12, 6) + (sw ? G(x + 13 + vw + 8 + 4, 164.3, sw, 16) : '');
  });
  s += CARD(260, 206.8, 769.3, 300) + G(273, 222, 70.3, 14) + G(349.3, 221, 16, 16) + G(840.3, 219.8, 176, 28, 8);
  [437, 509.4, 690.4, 835.2, 980].forEach((x) => { s += G(x, 264.3, 18, 8, 4); });
  const hl = [56, 40, 48, 56, 150, 44, 64, 52];
  for (let i = 0; i < 8; i++) {
    const y = 280.8 + 25 * i;
    if (y + 16 > 466.8) break;
    s += G(275, y + 8.5, hl[i], 8, 4);
    for (let j = 0; j < 16; j++) s += G(437 + 36.2 * j, y + 9, 34.2, 7, 2);
  }
  [[471, 88], [605, 101.2], [752.2, 80.1]].forEach(([x, w]) => { s += G(x - 10, 483.3, 6, 6, 3) + G(x, 482.3, w, 8, 4); });
  s += CARD(1041.3, 206.8, 378.7, 300) + G(1054.3, 222, 99.5, 14) + G(1363.1, 221.3, 43.9, 16);
  s += '<div style="position:absolute;left:1041.3px;top:206.8px;width:378.7px;height:300px;overflow:hidden">';
  for (let i = 0; i < 4; i++) {
    const y = 246.2 - 206.8 + 84.1 * i;
    s += G(21, y + 8, 16, 16) + G(53, y, 142.5, 16) + G(366 - [88, 53, 53, 62][i], y + 5, [88, 53, 53, 62][i], 8, 4) + G(53, y + 25, 300, 8, 4) + G(53, y + 44.5, 150, 8, 4);
  }
  s += '</div>';
  s += CARD(260, 518.8, 1160, 255.1) + G(297, 556, 156.3, 12, 6) + G(461, 553.8, 16, 16) + G(1093.2, 553.8, 16, 16) + G(1127.2, 556.7, 39.8, 10, 5) + G(1185, 553.8, 16, 16) + G(1215, 547.8, 176, 28, 8);
  for (let i = 0; i < 14; i++) {
    const x = 273 + 81 * i;
    s += G(x + 28.5, 599.9, 24, 8, 4) + G(x + 50, 633.9, 18, 8, 4);
    if (i % 7 >= 5) s += '<div style="position:absolute;left:' + x + 'px;top:619.9px;width:81px;height:140px;background:var(--color-surface-gray-1)"></div>' + G(x + 50, 633.9, 18, 8, 4);
    if (i) s += '<i style="position:absolute;left:' + x + 'px;top:619.9px;width:1px;height:140px;background:var(--color-outline-gray-1)"></i>';
  }
  s += L(273, 619.9, 1134);
  s += CARD(260, 785.9, 1160, 300) + G(273, 805.9, 139.7, 14) + G(1231, 798.9, 176, 28, 8);
  [[277, 49.8], [838.9, 64.1], [946.4, 69.1], [1104.4, 114.6], [1258, 145]].forEach(([x, w]) => { s += G(x, 841.4, w, 10); });
  s += L(273, 860.9, 1134);
  [[870.8, 196], [911.8, 152]].forEach(([y, nw]) => {
    s += G(281, y, 16, 16) + G(305, y + 0.05, nw, 16) + G(866.9, y + 0.05, 32, 16) + G(946.4, y + 6, 107, 4, 2) + G(1191.7, y + 0.05, 24, 16) + G(1375.7, y + 0.05, 24, 16) + L(273, y + 32, 1134);
  });
  s += CARD(260, 1097.9, 769.3, 300) + G(277, 1119.9, 90.6, 14) + G(903.6, 1114.9, 108.8, 28, 8);
  [[281, 57.6], [593, 55.4], [682.6, 85.8], [803.5, 68.9], [920.3, 32.1]].forEach(([x, w]) => { s += G(x, 1157.4, w, 10); });
  s += L(277, 1176.9, 735.3);
  [84, 52, 60, 48, 70].forEach((nw, i) => {
    const y = 1186.8 + 41 * i;
    s += G(285, y, 16, 16, 9999) + G(309, y, nw, 16) + G(623.1, y, 24, 16) + G(743.1, y, 24, 16) + G(839.5, y, 32, 16) + G(919.5, y, 32, 16) + G(988.3, y, 16, 16) + L(277, y + 32, 735.3);
  });
  return s;
};
const leaveCard = () => {
  const title = (y) => '<span style="position:absolute;left:1058.3px;top:' + y + 'px;font-size:16px;font-weight:600;line-height:18.4px;letter-spacing:.32px;color:var(--color-ink-gray-5);white-space:nowrap">Upcoming time-offs</span>';
  const name = (x, y) => TXT(x, y, 14, 500, 16.1, 'var(--color-ink-gray-8)', NAME) + TXT(x, y + 18.1, 13, 420, 15, 'var(--color-ink-gray-6)', '15 Oct 2026 → 16 Oct 2026');
  let b = '<div class="lv-before" style="position:absolute;inset:0">' + title(Y0 + 20);
  b += BADGE(1221.1, Y0 + 17, 84.6, 'var(--color-surface-amber-2)', 'var(--color-ink-amber-4)', '<i style="display:block;width:6px;height:6px;border-radius:9999px;background:var(--color-surface-amber-3);flex:none"></i>1 pending');
  const u = Y0 + 49;
  b += '<div style="position:absolute;left:1058.3px;top:' + u + 'px;width:344.7px;height:78px;background:var(--color-surface-amber-1);border-left:3px solid var(--color-outline-amber-2);box-sizing:border-box"></div>' + L(1058.3, u + 78, 344.7);
  b += AV(1073.3, u + 27, 24) + name(1109.3, u + 22.45);
  b += BADGE(1341.8, u + 10, 49.2, 'var(--color-surface-amber-2)', 'var(--color-ink-amber-4)', 'Open');
  b += '<div class="btn lv-ap" style="left:1329px;top:' + (u + 40) + 'px;width:28px;background:var(--color-surface-green-5);color:var(--color-ink-white)">' + CHECK + '</div>';
  b += '<div class="btn" style="left:1363px;top:' + (u + 40) + 'px;width:28px;background:var(--color-surface-red-5);color:var(--color-ink-white)">' + XMARK16 + '</div>';
  b += ghostRow(u + 79, 104, true) + ghostRow(u + 133.1, 96, false) + '</div>';
  const v = Y0 + 43.4;
  let a = '<div class="lv-after" style="position:absolute;inset:0;visibility:hidden">' + title(Y0 + 17);
  a += L(1058.3, v + 53.1, 344.7) + AV(1073.3, v + 14.5, 24) + name(1109.3, v + 10);
  a += BADGE(1315.7, v + 14.5, 75.3, 'var(--color-surface-green-2)', 'var(--color-ink-green-4)', 'Approved');
  a += ghostRow(v + 54.1, 104, true) + ghostRow(v + 108.2, 96, false) + '</div>';
  return CARD(1041.3, Y0, 378.7, 300) + b + a;
};
kit.scene('approve-leave', {
  init(kit) {
    let p = '<div class="lv-page" style="position:absolute;inset:0">' + SHELL('dashboard-manager');
    p += G(260, 77, 117.8, 20.7);
    p += '<div style="position:absolute;left:240px;top:121.7px;width:1200px;height:758.3px;overflow:hidden"><div class="lv-scroll" style="position:absolute;left:-240px;top:-121.7px;width:1440px;height:1400px">' + dashboard() + leaveCard() + '</div></div>';
    p += '<div class="pms-ring lv-r1" style="border-radius:11px"></div><div class="pms-ring lv-r3" style="border-radius:9999px"></div>';
    p += '</div><div class="lv-bk" style="position:absolute;inset:0;background:rgba(0,0,0,.27);opacity:0"></div>';
    let d = '<div class="lv-dl" style="position:absolute;left:' + DX + 'px;top:' + DY + 'px;width:512px;height:337.4px;background:var(--color-surface-modal);border-radius:16px;visibility:hidden;box-shadow:0 0 1px rgba(0,0,0,.19),0 1px 2px rgba(0,0,0,.07),0 6px 15px -5px rgba(0,0,0,.11)">';
    d += TXT(24, 22, 20, 600, 24, 'var(--color-ink-gray-8)', 'Approve leave request', ';letter-spacing:.2px');
    d += '<div style="position:absolute;left:464px;top:26px;color:var(--color-ink-gray-8)">' + XMARK16 + '</div>';
    d += '<div style="position:absolute;left:24px;top:72px;width:464px;height:117.2px;box-sizing:border-box;border:1px solid var(--color-outline-gray-1);border-radius:12px;background:var(--color-surface-gray-1)"></div>';
    d += AV(37, 87.55, 28) + TXT(77, 85, 14, 500, 16.1, 'var(--color-ink-gray-8)', NAME) + TXT(77, 103.1, 13, 420, 15, 'var(--color-ink-gray-6)', 'Casual Leave · Full day');
    d += '<div style="position:absolute;right:37px;top:85px;display:flex;flex-direction:column;align-items:flex-end;gap:2px;white-space:nowrap"><span style="font-size:14px;font-weight:420;line-height:16.1px;letter-spacing:.28px;color:var(--color-ink-gray-8)">15 Oct – 16 Oct 2026</span><span style="font-size:13px;font-weight:420;line-height:15px;letter-spacing:.26px;color:var(--color-ink-gray-6)">2 days</span></div>';
    d += L(37, 130.1, 438) + TXT(37, 143.1, 13, 420, 15, 'var(--color-ink-gray-6)', 'Reason') + TXT(37, 160.1, 14, 420, 16.1, 'var(--color-ink-gray-8)', 'Family wedding in Kochi');
    d += TXT(24, 205.2, 14, 420, 16.1, 'var(--color-ink-gray-6)', 'Approving submits this leave application. It cannot be undone from<br>Next PMS.', ';white-space:normal;width:464px');
    d += '<i class="gh lv-cancel" style="left:298.1px;top:277.4px;width:66.5px;height:32px;border-radius:8px"></i>';
    d += '<div class="btn lv-al" style="left:372.6px;top:277.4px;width:115.4px;height:32px;background:var(--color-surface-green-5);color:var(--color-ink-white);font-weight:500;letter-spacing:.28px"><span class="lv-spin" style="display:none">' + SPIN + '</span><span>Approve leave</span></div>';
    d += '<div class="pms-ring lv-r2" style="left:367.6px;top:272.4px;width:125.4px;height:42px;border-radius:11px"></div></div>';
    const toast = '<div class="lv-toast" style="position:absolute;left:1140px;top:840px;width:280px;height:40px;box-sizing:border-box;padding:6px 16px;background:var(--color-surface-gray-6);border-radius:10px;box-shadow:0 0 1px rgba(0,0,0,.35),0 6px 8px -4px rgba(0,0,0,.1);display:flex;align-items:center;gap:12px;visibility:hidden">' +
      '<div style="display:flex;align-items:center;gap:8px;flex:1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-green-3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;display:block"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>' +
      '<span style="font-size:13px;line-height:19.5px;font-weight:420;color:var(--color-ink-white);white-space:nowrap">Leave application approved</span></div>' +
      '<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-white)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam lv-cam"><div class="pms-win">' + p + d + toast + '</div></div></div>'));
    const e = this.el = {};
    ['page', 'scroll', 'before', 'after', 'ap', 'bk', 'dl', 'cancel', 'al', 'spin', 'toast', 'r1', 'r2', 'r3'].forEach(k => { e[k] = kit.stage.querySelector('.lv-' + k); });
    const top = Y0 - SCROLL;
    Object.assign(e.r1.style, { left: '1324px', top: (top + 49 + 40 - 5) + 'px', width: '38px', height: '38px' });
    Object.assign(e.r3.style, { left: '1310.7px', top: (top + 43.4 + 14.5 - 5) + 'px', width: '85.3px', height: '34px' });
    const cam = this.cam = new kit.Camera(kit.stage.querySelector('.lv-cam'));
    cam.set([
      { t: 0, cx: 960, cy: 540, z: 1.1, hold: 2.9, drift: [2, 0, 0.004] },
      { t: 3.9, cx: 1190, cy: 710, z: 2.0, hold: 1.25, drift: [1, 0, 0.004] },
      { t: 6.0, cx: 960, cy: 380, z: 2.0, hold: 2.6, drift: [0, 1, 0.003] },
      { t: 9.6, cx: 1190, cy: 710, z: 2.0, drift: [1, 0, 0.004] },
    ]);
    const AP = [1583, top + 49 + 54 + 90];
    const cur = this.cur = kit.cursor();
    kit.stage.querySelector('.lv-cam').appendChild(cur.el);
    cur.keys = [
      { t: 0, at: [1250, 700] }, { t: 0.6, at: [1250, 700] }, { t: 1.2, at: [1180, 760] },
      { t: 3.9, at: [1180, 760] }, { t: 4.6, at: AP }, { t: 6.8, at: AP }, { t: 7.5, at: [1134.3, 503.4] },
      { t: 8.6, at: [1134.3, 503.4] }, { t: 9.4, at: [1215, 880] },
    ];
    cur.clicks = [T.c1, T.c2];
  },
  render(t) {
    this.cam.apply(t);
    const e = this.el;
    e.scroll.style.transform = 'translateY(' + (-SCROLL * eio(seg(t, T.sc0, T.sc1))).toFixed(2) + 'px)';
    // frappe-ui dialog-content-in: 100 ms, opacity .5 to 1 and scale .98 to 1
    const open = t >= T.c1 && t < T.done + 0.1;
    const inK = eo(seg(t, T.open, T.open + 0.1)), outK = seg(t, T.done, T.done + 0.1);
    const o = open ? inK * (1 - outK) : 0;
    e.bk.style.opacity = o;
    e.page.style.filter = o > 0 ? 'blur(' + (12 * o).toFixed(2) + 'px)' : 'none';
    e.dl.style.visibility = o > 0 ? 'visible' : 'hidden';
    e.dl.style.opacity = open ? lerp(0.5, 1, inK) * (1 - outK * 0.5) : 0;
    e.dl.style.transform = 'scale(' + (t < T.done ? lerp(0.98, 1, inK) : lerp(1, 0.98, outK)) + ')';
    const h1 = eio(seg(t, 4.6, 4.75)) * (1 - eio(seg(t, T.open, T.open + 0.15)));
    e.ap.style.background = 'color-mix(in srgb, var(--color-surface-green-5), var(--color-ink-green-4) ' + (h1 * 100).toFixed(1) + '%)';
    e.ap.style.transform = 'scale(' + dip(t, T.c1) + ')';
    // while loading the button shows a spinner, has no hover and Cancel moves left
    const loading = t >= T.c2;
    const h2 = loading ? 0 : eio(seg(t, 7.5, 7.65));
    e.al.style.background = 'color-mix(in srgb, var(--color-surface-green-5), var(--color-ink-green-4) ' + (h2 * 100).toFixed(1) + '%)';
    e.al.style.color = loading ? 'var(--color-ink-green-2)' : 'var(--color-ink-white)';
    e.spin.style.display = loading ? 'block' : 'none';
    e.spin.style.transform = 'rotate(' + ((t * 360) % 360).toFixed(1) + 'deg)';
    e.al.style.left = (loading ? 351.1 : 372.6) + 'px';
    e.al.style.width = (loading ? 136.9 : 115.4) + 'px';
    e.cancel.style.left = (loading ? 276.6 : 298.1) + 'px';
    e.al.style.transform = 'scale(' + dip(t, T.c2) + ')';
    e.r2.style.left = (loading ? 346.1 : 367.6) + 'px';
    e.r2.style.width = (loading ? 146.9 : 125.4) + 'px';
    const done = t >= T.done;
    e.before.style.visibility = done ? 'hidden' : 'visible';
    e.after.style.visibility = done ? 'visible' : 'hidden';
    const tk = seg(t, T.done, T.done + 0.4), te = 1 - Math.pow(1 - tk, 3);
    e.toast.style.visibility = done ? 'visible' : 'hidden';
    e.toast.style.opacity = te;
    e.toast.style.transform = 'translateY(' + (150 * (1 - te)).toFixed(1) + '%) scale(' + lerp(0.95, 1, te).toFixed(4) + ')';
    e.r1.style.opacity = fade(t, T.r1, T.c1);
    e.r2.style.opacity = fade(t, T.r2, T.c2);
    e.r3.style.opacity = eo(seg(t, T.r3, T.r3 + 0.25));
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / this.cam.at(t).z).toFixed(4) + ')';
  },
});
