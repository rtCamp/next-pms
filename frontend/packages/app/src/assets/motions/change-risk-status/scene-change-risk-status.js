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
const NOTE = 'Fix shipped and verified';
const HDR_SHIFT = 11.6;
const ic = (p, sz, sty) => '<svg width="' + (sz || 16) + '" height="' + (sz || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;' + (sty || '') + '">' + p + '</svg>';
const IC = { x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', plus: '<path d="M5 12h14"/><path d="M12 5v14"/>' };
const A = (x, y, w, h, extra) => '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;' + (extra || '') + '">';
const G = (x, y, w, h, r) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;background:var(--color-surface-gray-3)"></div>';
const T = (x, cy, w) => G(x, cy - 5, w, 10, 5);
const S2 = (x, cy, w) => G(x, cy - 4, w, 8, 4);
const I = (x, cy) => G(x, cy - 7, 14, 14, 4);
const HL = (x, y, w) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:1px;background:var(--color-outline-gray-1)"></div>';
const dotCol = { 'To-do': 'var(--color-gray-500)', 'In Progress': 'var(--color-amber-500)', Escalated: 'var(--color-blue-500)', Blocked: 'var(--color-red-500)', Mitigated: 'var(--color-green-500)' };
const dot = (s) => '<span style="position:relative;display:inline-block;flex:none;width:14px;height:14px;border-radius:50%;background:' + dotCol[s] + '"><span style="position:absolute;left:4px;top:4px;width:6px;height:6px;border-radius:50%;background:var(--color-white)"></span></span>';
const bars = '<svg width="14" height="14" viewBox="0 0 14 14" style="flex:none"><rect x="9.5" y="1.7" width="1.3" height="10.5" fill="currentColor"/><rect x="6" y="5.2" width="1.3" height="7" fill="currentColor"/><rect x="2.5" y="8.7" width="1.3" height="3.5" fill="currentColor"/></svg>';
const dots3 = '<svg width="16" height="16" viewBox="0 0 16 16" style="display:block"><circle cx="3.5" cy="8" r="1.2" fill="currentColor"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="12.5" cy="8" r="1.2" fill="currentColor"/></svg>';
const warn = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
const chev = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const check = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none"><path d="M3.5 8.5l3 3 6-7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const statusBadge = (s) => '<div style="display:flex;align-items:center;gap:8px;height:23px;padding:0 8px;border-radius:12px;background:var(--color-surface-gray-2);font-size:13px;color:var(--color-ink-gray-7);white-space:nowrap;box-sizing:border-box">' + dot(s) + s + '</div>';
const levelBadge = () => '<div style="display:flex;align-items:center;gap:4px;height:23px;padding:0 8px;border-radius:12px;background:var(--color-surface-red-2);font-size:13px;color:var(--color-red-600);white-space:nowrap;box-sizing:border-box">' + bars + 'High risk</div>';
const BORDER ='border:1px solid var(--color-outline-gray-1)';
const TABS = [[260, 62.7], [346.7, 60.1], [430.8, 57.2], [512, 51.7], [587.7, 35.3], [647, 48.4], [719.4, 39.2], [782.5, 35.9], [842.4, 42.1], [908.5, 65.3], [997.7, 65.7]];
const ghostTabs = () => TABS.map(([x, w]) => T(x, 76.5, w)).join('') + HL(240, 96, 899) + '<div class="pms-abs" style="left:587.7px;top:95px;width:35.3px;height:1px;background:var(--color-ink-gray-7)"></div>';
const ghostPanel = () => {
  let s = '<div class="pms-abs" style="left:1139px;top:57px;width:1px;height:843px;background:var(--color-outline-gray-1)"></div>';
  s += T(1160, 77.8, 136) + HL(1140, 95.5, 300);
  const sec = (cy, w) => G(1161, cy - 7, 14, 14, 4) + T(1188, cy, w);
  s += sec(116.3, 64) + sec(163.3, 95) + G(1392, 149.4, 28, 28, 8);
  [[197.4, 123.3, 80.3], [231.5, 86.9, 32.9], [265.6, 64.6, 120.1], [299.7, 90.8, 35.7], [333.8, 94, 88.3]].forEach(([cy, a, b]) => { s += T(1160, cy, a) + T(1295.3, cy, b); });
  s += HL(1140, 357.9, 300) + sec(378.9, 35) + G(1166, 406, 14, 14, 7);
  s += HL(1140, 443, 300) + sec(464, 83) + T(1160, 492, 85) + T(1335.8, 492, 84) + G(1160, 510.1, 260, 8, 4);
  s += HL(1140, 534.1, 300) + sec(555.1, 111) + T(1160, 583.2, 68) + T(1331.4, 583.2, 89) + G(1160, 601.3, 260, 8, 4);
  s += HL(1140, 625.3, 300) + sec(646.3, 63);
  s += T(1160, 682.4, 109) + G(1276.7, 666.4, 143.3, 32, 8) + T(1160, 732.4, 95) + G(1276.7, 716.4, 143.3, 32, 8);
  s += T(1160, 778.4, 103) + G(1270.8, 770.7, 83, 16, 8) + G(1392, 764.4, 28, 28, 8);
  [[808.4, 107, 58], [840.4, 80, 109], [872.4, 62, 50]].forEach(([cy, nw, rw]) => { s += G(1160, cy - 10, 20, 20, 10) + T(1188, cy, nw) + T(1188 + nw + 8, cy, rw); });
  return s;
};
const ROWS_Y = [287.9, 329, 370.1, 411.2];
const chrome = () => ghostTabs() + ghostPanel();
const list = () => {
  let s = T(260, 127, 46) + G(1035, 113, 84, 28, 8);
  s += G(260, 155, 144, 28, 8) + G(412, 155, 144, 28, 8) + G(564, 155, 120, 28, 8) + G(692, 155, 120, 28, 8) + G(950.5, 155, 97, 28, 8) + G(1055.7, 155, 63.6, 28, 8);
  const group = (y, w) => HL(260, y + 42, 859) + I(269, y + 21) + T(292, y + 21, w) + G(368.7, y + 12, 20, 18, 9);
  const cols = (y) => { let r = HL(260, y + 32, 859); [[272, 76], [408, 76], [733, 56], [881, 52], [963, 34]].forEach(([x, w]) => { r += S2(x, y + 16, w); }); return r; };
  s += group(197.1, 69) + cols(247.9);
  const rowGhost = (y, i) => {
    const cy = y + 20;
    let r = HL(260, y + 40.1, 859);
    r += T(276, cy, [56, 70, 64][i]) + T(412, cy, [150, 190, 120][i]) + G(729, cy - 8, 16, 16, 8) + T(753, cy, [70, 62, 76][i]) + T(877, cy, [38, 50, 30][i]) + I(959, cy) + T(981, cy, [60, 76, 60][i]);
    return r + I(1086, cy);
  };
  for (let i = 0; i < 3; i++) s += rowGhost(ROWS_Y[i], i);
  const y = ROWS_Y[3], cy = y + 20;
  s += '<div class="rs-rowhover" style="position:absolute;left:260px;top:' + y + 'px;width:859px;height:41.1px;background:var(--color-surface-gray-1);opacity:0"></div>' + HL(260, y + 40.1, 859);
  const tx = (x, w, sty) => '<div style="position:absolute;left:' + x + 'px;top:' + (cy - 8) + 'px;width:' + w + 'px;height:16px;line-height:16px;font-size:14px;white-space:nowrap;overflow:hidden;' + sty + '">';
  s += tx(276, 120, 'font-weight:500;color:var(--color-ink-gray-8)') + 'Design</div>' + tx(412, 293, 'color:var(--color-ink-gray-6)') + 'Late handoff specs</div>';
  s += '<div style="position:absolute;left:729px;top:' + (cy - 8) + 'px;width:16px;height:16px;border-radius:50%;background:var(--color-surface-blue-2);color:var(--color-ink-blue-3);font-size:9px;line-height:16px;text-align:center;font-weight:500">H</div>' + tx(753, 100, 'color:var(--color-ink-gray-6)') + 'Henry Johnson</div>';
  s += tx(877, 60, 'color:var(--color-ink-gray-6)') + 'High</div>' + '<div style="position:absolute;left:959px;top:' + (cy - 8) + 'px;display:flex;align-items:center;gap:8px;height:16px;font-size:14px;color:var(--color-ink-gray-6);white-space:nowrap">' + dot('In Progress') + 'In Progress</div>';
  s += '<div class="rs-dots" style="position:absolute;left:1083.3px;top:' + (y + 5.99) + 'px;width:28px;height:28px;border-radius:8px;background:var(--color-surface-gray-3);opacity:0"></div><div style="position:absolute;left:1089.3px;top:' + (y + 11.99) + 'px;color:var(--color-ink-gray-8)">' + dots3 + '</div>' +
    '<div class="rs-menu2" style="position:absolute;left:1017.5px;top:449px;width:160px;height:70px;box-sizing:border-box;border-radius:12px;background:var(--color-surface-modal);box-shadow:0 0 1px rgba(0,0,0,.2),0 1px 3px rgba(0,0,0,.05),0 10px 24px -3px rgba(0,0,0,.1);visibility:hidden"><div class="rs-edithl" style="position:absolute;left:7px;top:7px;width:146px;height:28px;border-radius:8px;background:var(--color-surface-gray-3);opacity:0"></div><div style="position:absolute;left:15px;top:7px;line-height:28px;font-size:14px;color:var(--color-ink-gray-7)">Edit</div><div style="position:absolute;left:15px;top:35px;line-height:28px;font-size:14px;color:var(--color-ink-red-3)">Delete</div></div>';
  s += group(472.3, 70) + cols(523.1) + T(660, 595, 76);
  return s;
};
const entry = (y) => {
  let s = G(260, y, 20, 20, 10) + T(288, y + 10, 71) + T(367.4, y + 10, 119) + T(1067, y + 10, 50);
  s += A(285, y + 28, 832, 97, BORDER +';border-radius:8px;box-sizing:content-box') + '</div>';
  return s;
};
const detail = () => {
  let s = I(267, 127) + T(296, 127, 100);
  s += '<div class="rs-hg">' + G(541.8, 115.5, 88, 23, 12) + G(633.8, 115, 182.5, 24, 12) + G(820.3, 115, 155.8, 24, 12) + '</div>';
  s += '<div class="rs-hbadge" style="position:absolute;left:980.2px;top:115.5px">' + statusBadge('In Progress') + '</div>';
  s += I(1098.3, 127);
  s += T(260, 173.5, 180) + T(260, 213.2, 110) + T(260, 240.9, 120) + T(260, 283.6, 167) + I(1098.3, 283.6) + S2(260, 317.4, 128);
  s += '<div style="position:absolute;left:260px;top:347.7px;height:18.4px;line-height:18.4px;font-size:16px;font-weight:500;color:var(--color-ink-gray-7)">Updates</div>';
  s += '<div class="rs-plus" style="position:absolute;left:1091.3px;top:342.9px;width:28px;height:28px;border-radius:8px;background:var(--color-surface-gray-3);opacity:0"></div>';
  s += '<div style="position:absolute;left:1097.3px;top:348.9px;color:var(--color-ink-gray-8)">' + ic(IC.plus, 16) + '</div>';
  s += '<div class="rs-new" style="position:absolute;left:0;top:0;visibility:hidden">' +
    G(260, 382.9, 20, 20, 10) + T(288, 392.9, 71) + T(367.4, 392.9, 119) + T(1064, 392.9, 55) +
    A(268, 410.9, 1, 115, 'background:var(--color-outline-gray-1)') + '</div>' +
    A(285, 410.9, 832, 97, BORDER + ';border-radius:8px;background:var(--color-surface-white)') + '</div>' +
    '<div style="position:absolute;left:302px;top:430.4px">' + statusBadge('Mitigated') + '</div>' +
    '<div style="position:absolute;left:' + (302 + 95.5 + 4) + 'px;top:430.4px;width:88px">' + levelBadge() + '</div>' +
    I(1081.3, 442) +
    '<div style="position:absolute;left:302px;top:463.9px;height:21px;line-height:21px;font-size:14px;color:var(--color-ink-gray-7);white-space:nowrap">' + NOTE + '</div></div>';
  s += '<div class="rs-old" style="position:absolute;left:0;top:0">' + entry(382.9) + G(302, 430.4, 107.1, 23, 12) + G(413.1, 430.4, 88, 23, 12) + I(1081.3, 442) + T(302, 474.4, 80) + '</div>';
  return s;
};
const dialog = () => {
  const lab = (y, t, req) => '<div style="position:absolute;left:24px;top:' + y + 'px;line-height:16.1px;font-size:14px;color:var(--color-ink-gray-5)">' + t + (req ? '<span style="color:var(--color-ink-red-3)">*</span>' : '') + '</div>';
  const sel = (cls, y, inner) => '<div class="' + cls + '" style="position:absolute;left:24px;top:' + y + 'px;width:392px;height:28px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;background:var(--color-surface-white);padding:0 8px;display:flex;align-items:center;gap:8px;font-size:14px;color:var(--color-ink-gray-8);white-space:nowrap">' + inner + '</div>';
  let s = '<div style="position:absolute;left:24px;top:22px;line-height:24px;font-size:20px;font-weight:600;color:var(--color-ink-gray-8)">Add update</div>';
  s += '<div style="position:absolute;left:384px;top:20px;width:32px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-8)">' + ic(IC.x, 16) + '</div>';
  s += lab(61, 'Status') + sel('rs-sel', 83.1, '<span class="rs-seldot"></span><span class="rs-selv"></span><span style="margin-left:auto;display:flex">' + chev + '</span>');
  s += lab(127.1, 'Risk') + sel('rs-sel2', 149.2, '<span style="color:var(--color-red-600);display:flex;align-items:center;gap:4px">' + bars + 'High risk</span><span style="margin-left:auto;display:flex">' + chev + '</span>');
  s += lab(193.2, 'Note', true);
  s += '<div style="position:absolute;left:24px;top:215.3px;width:392px;height:96px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:10px;background:var(--color-surface-white)"><div class="rs-ph" style="position:absolute;left:8px;top:8px;line-height:21px;font-size:14px;color:var(--color-ink-gray-4)">Add a note...</div><div style="position:absolute;left:8px;top:8px;line-height:21px;font-size:14px;color:var(--color-ink-gray-7);white-space:nowrap"><span class="rs-nv"></span><span class="rs-caret" style="display:inline-block;width:1.5px;height:16px;background:var(--color-ink-gray-8);vertical-align:-3px;margin-left:1px"></span></div></div>';
  s += '<div class="rs-add" style="position:absolute;left:24px;top:343.3px;width:392px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px;font-weight:450;background:var(--color-surface-gray-7);color:var(--color-ink-white)"><svg class="rs-spin" width="13.5" height="13.5" viewBox="0 0 16 16" fill="none" style="display:none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity=".25" stroke-width="2"/><path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Add update</span></div>';
  const opts = ['To-do', 'In Progress', 'Escalated', 'Blocked', 'Mitigated'];
  s += '<div class="rs-menu" style="position:absolute;left:21px;top:53px;width:140.4px;height:148px;box-sizing:border-box;padding:4px;border-radius:12px;background:var(--color-surface-modal);box-shadow:0 0 0 1px var(--color-outline-gray-1),0 0 1px rgba(0,0,0,.2),0 1px 3px rgba(0,0,0,.05),0 10px 24px -3px rgba(0,0,0,.1);visibility:hidden"><div class="rs-hl" style="position:absolute;left:4px;top:32px;width:132.4px;height:28px;border-radius:8px;background:var(--color-surface-gray-2)"></div>' +
    opts.map((o, i) => '<div style="position:absolute;left:4px;top:' + (4 + 28 * i) + 'px;width:132.4px;height:28px;display:flex;align-items:center;gap:8px;padding:0 8px;box-sizing:border-box;font-size:14px;color:var(--color-ink-gray-8);white-space:nowrap">' + dot(o) + o + (o === 'In Progress' ? '<span class="rs-chk" style="margin-left:auto;display:flex">' + check + '</span>' : '') + '</div>').join('') + '</div>';
  return s;
};
const editDialog = () => {
  const lab = (y, t) => '<div style="position:absolute;left:24px;top:' + y + 'px;line-height:16.1px;font-size:14px;color:var(--color-ink-gray-5)">' + t + '</div>';
  const gb = (y, h, r) => G(24, y, 392, h, r);
  const locked = (y) => '<div style="position:absolute;left:24px;top:' + y + 'px;width:392px;height:32px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;background:var(--color-surface-gray-1)"></div>';
  let s = '<div style="position:absolute;left:24px;top:22px;line-height:24px;font-size:20px;font-weight:600;color:var(--color-ink-gray-8)">Edit risk</div>';
  s += '<div style="position:absolute;left:384px;top:20px;width:32px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-8)">' + ic(IC.x, 16) + '</div>';
  s += '<div class="rs-eload" style="position:absolute;left:0;top:0;width:440px;height:234px"><svg class="rs-espin" width="16" height="16" viewBox="0 0 16 16" fill="none" style="position:absolute;left:212px;top:101px;color:var(--color-ink-gray-8)"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity=".25" stroke-width="1.6"/><path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' + gb(180, 28, 8) + '</div>';
  s += '<div class="rs-eform" style="position:absolute;left:0;top:0;width:440px;height:725.6px">';
  s += T(24, 69, 82).replace('height:10px', 'height:8px') + gb(83.1, 32, 8);
  s += lab(131.1, 'Risk level') + locked(153.2) + '<div style="position:absolute;left:35px;top:161.7px;display:flex;align-items:center;gap:4px;font-size:13px;line-height:15px;color:var(--color-red-600)">' + bars + 'High risk</div>';
  s += lab(201.2, 'Status') + locked(223.3) + '<div style="position:absolute;left:35px;top:231.2px;display:flex;align-items:center;gap:8px;font-size:14px;line-height:16.1px;color:var(--color-ink-gray-7);white-space:nowrap">' + dot('In Progress') + 'In Progress</div>';
  s += '<div style="position:absolute;left:24px;top:271.3px;width:392px;height:32px;box-sizing:border-box;border-radius:12px;background:var(--color-surface-violet-1)"></div><div style="position:absolute;left:34px;top:279.3px;color:var(--color-ink-violet-4)">' + warn + '</div><div style="position:absolute;left:58px;top:280.4px;width:348px;line-height:13.8px;font-size:12px;color:var(--color-ink-gray-8)">To change status or risk level, add a new risk update instead.</div>';
  s += T(24, 327.4, 62).replace('height:10px', 'height:8px') + gb(341.4, 32, 8);
  s += T(24, 397.4, 58).replace('height:10px', 'height:8px') + gb(411.5, 96, 10);
  s += T(24, 531.5, 92).replace('height:10px', 'height:8px') + gb(545.6, 96, 10);
  s += gb(673.6, 28, 8) + '</div>';
  return s;
};
// rings in window coords, [from, to, x, y, w, h, radius]
const OFF = 6.1;
const RINGS = [
  [0.4, 1.2, 1078.3, 412.2, 38, 38, 11],
  [1.45, 1.95, 1019.5, 451, 156, 38, 11],
  [3.0, 3.6, 519, 338.3, 402, 42, 11],
  [3.7, 5.55, 519, 386.3, 402, 42, 15],
  [5.65, 6.15, 879, 135, 42, 38, 11],
  [6.85, 7.6, 255, 406.2, 869, 51.1, 3],
  [2.2 + OFF, 2.85 + OFF, 1086.3, 337.9, 38, 38, 11],
  [3.3 + OFF, 3.95 + OFF, 519, 198.1, 402, 38, 11],
  [4.4 + OFF, 5.1 + OFF, 520, 284, 142.4, 38, 11],
  [5.4 + OFF, 6.0 + OFF, 519, 330.3, 402, 106, 13],
  [7.7 + OFF, 8.3 + OFF, 519, 458.3, 402, 38, 11],
  [9.5 + OFF, 12.0 + OFF, 986.8, 110.5, 105.5, 33, 17],
];
const T_ROW = 1.5, T_PLUS = 2.8, T_SEL = 3.95, T_PICK = 5.1, T_NOTE = 6.0, T_SAVE = 8.3, T_DONE = 8.85;
const shiftKeys = (ks) => ks.map((k) => Object.assign({}, k, { t: k.t + OFF }));
kit.scene('change-risk-status', {
  init(kit) {
    const side = SHELL('project-detail');
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam rs-cam"><div class="pms-win">' + side + chrome() +
      '<div class="rs-list">' + list() + '</div><div class="rs-detail" style="visibility:hidden">' + detail() + '</div>' +
      '<div class="pms-abs rs-ov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0"></div>' +
      '<div class="pms-abs rs-edlg" style="left:500px;top:120px;width:440px;height:233.9px;background:var(--color-surface-modal);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.18);opacity:0;visibility:hidden">' + editDialog() + '</div>' +
      '<div class="pms-abs rs-dlg" style="left:500px;top:120px;width:440px;height:395.3px;background:var(--color-surface-modal);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.18);opacity:0;visibility:hidden">' + dialog() + '</div>' +
      '<div class="pms-ring rs-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.rs-' + c);
    for (const k of ['cam', 'list', 'detail', 'ov', 'dlg', 'edlg', 'eload', 'eform', 'espin', 'dots', 'menu2', 'edithl', 'ring', 'rowhover', 'plus', 'hbadge', 'hg', 'new', 'old', 'sel', 'seldot', 'selv', 'menu', 'hl', 'chk', 'ph', 'nv', 'caret', 'add', 'spin']) this[k] = q(k);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.1, hold: 0.3 },
      { t: 1.0, cx: 960, cy: 530, z: 1.6, hold: 1.0 },
      { t: 3.0, cx: 960, cy: 427, z: 2.0, hold: 2.5, drift: [0, 0, 0.004] },
      { t: 7.0, cx: 930, cy: 530, z: 1.6, hold: 0.5 },
      { t: 2.3 + OFF, cx: 1010, cy: 440, z: 1.8, hold: 0.45 },
      { t: 3.5 + OFF, cx: 960, cy: 410, z: 2.0, hold: 5.0, drift: [0, 0, 0.004] },
      { t: 9.6 + OFF, cx: 930, cy: 385, z: 1.9, hold: 3.0, drift: [3, 0, 0.004] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1500, 900] }, { t: 0.35, at: [1500, 900] }, { t: 1.0, at: [1337.3, 521.2] }, { t: 1.4, at: [1337.3, 521.2] },
      { t: 1.8, at: [1337.5, 560] }, { t: 2.5, at: [1337.5, 560] }, { t: 3.1, at: [960, 449] }, { t: 3.5, at: [960, 449] },
      { t: 4.0, at: [1150, 497] }, { t: 5.5, at: [1150, 497] }, { t: 6.05, at: [1140, 244] }, { t: 6.4, at: [1140, 244] },
      { t: 7.1, at: [860, 522] }, { t: 7.65, at: [860, 522] },
      ...shiftKeys([
        { t: 2.35, at: [1345, 447] }, { t: 3.0, at: [1345, 447] }, { t: 3.65, at: [960, 307] }, { t: 4.15, at: [960, 307] },
        { t: 4.75, at: [830, 393] }, { t: 5.3, at: [830, 393] }, { t: 5.85, at: [960, 473] }, { t: 7.5, at: [960, 473] },
        { t: 8.1, at: [960, 567] }, { t: 8.9, at: [960, 567] }, { t: 9.7, at: [1120, 560] }, { t: 12.3, at: [1120, 560] },
      ]),
    ];
    this.cur.clicks = [1.2, 1.95, 6.15, T_ROW + OFF, T_PLUS + OFF, T_SEL + OFF, T_PICK + OFF, T_NOTE + OFF, T_SAVE + OFF];
    this.typ = kit.typist(NOTE, 6.1 + OFF, 18);
  },
  render(t0) {
    this.camera.apply(t0);
    const z = this.camera.at(t0).z;
    // part 1: the locked Edit risk form
    const menuOn = t0 >= 1.2 && t0 < 1.95;
    this.menu2.style.visibility = menuOn ? 'visible' : 'hidden';
    this.edithl.style.opacity = menuOn && t0 >= 1.75 ? 1 : 0;
    this.dots.style.opacity = t0 >= 0.95 && t0 < 1.95 ? (menuOn ? 1 : eo(seg(t0, 0.95, 1.1))) : 0;
    const eopen = eo(seg(t0, 1.95, 2.1)) * (1 - ei(seg(t0, 6.15, 6.32)));
    this.edlg.style.opacity = eopen;
    this.edlg.style.visibility = eopen > 0 ? 'visible' : 'hidden';
    this.edlg.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t0, 1.95, 2.1))) + ')';
    const loaded = t0 >= 2.4;
    this.eload.style.display = loaded ? 'none' : 'block';
    this.eform.style.display = loaded ? 'block' : 'none';
    this.edlg.style.height = (loaded ? 725.6 : 233.9) + 'px';
    this.espin.style.transform = 'rotate(' + (t0 * 540) + 'deg)';
    // part 2: the Add update flow, local time t = t0 - OFF
    const t = t0 - OFF;
    this.list.style.visibility = t < T_ROW ? 'visible' : 'hidden';
    this.detail.style.visibility = t < T_ROW ? 'hidden' : 'visible';
    this.rowhover.style.opacity = (t0 >= 0.9 && t0 < 1.95) || (t >= 0.9 && t < T_ROW) ? 1 : 0;
    this.plus.style.opacity = seg(t, 2.3, 2.45) * (1 - seg(t, 3.05, 3.2));
    const open = eo(seg(t, T_PLUS, T_PLUS + 0.15)) * (1 - ei(seg(t, T_DONE, T_DONE + 0.17)));
    this.ov.style.opacity = Math.max(open, eopen);
    this.dlg.style.opacity = open;
    this.dlg.style.visibility = open > 0 ? 'visible' : 'hidden';
    this.dlg.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, T_PLUS, T_PLUS + 0.15))) + ')';
    const menuOpen = t >= T_SEL && t < T_PICK;
    this.menu.style.visibility = menuOpen ? 'visible' : 'hidden';
    const cy = lerp(307, 393, eio(seg(t, 4.15, 4.75)));
    const idx = t < 4.2 ? 1 : Math.max(0, Math.min(4, Math.floor((cy - 267) / 28)));
    this.hl.style.top = (4 + 28 * idx) + 'px';
    const picked = t >= T_PICK ? 'Mitigated' : 'In Progress';
    this.seldot.innerHTML = dot(picked);
    this.seldot.style.display = 'flex';
    this.selv.textContent = picked;
    this.sel.style.borderColor = menuOpen ? 'var(--color-outline-gray-3)' : 'var(--color-outline-gray-2)';
    this.nv.textContent = t >= 6.1 ? this.typ.at(t0) : '';
    this.ph.style.display = t >= 6.1 ? 'none' : 'block';
    const typing = t > 6.1 && t < this.typ.end - OFF;
    this.caret.style.opacity = t >= T_NOTE && t < T_SAVE + 0.2 && (typing || Math.floor(t / 0.53) % 2 === 0) ? 1 : 0;
    const loading = t >= T_SAVE && t < T_DONE + 0.17;
    this.add.style.background = loading ? 'var(--color-surface-gray-2)' : 'var(--color-surface-gray-7)';
    this.add.style.color = loading ? 'var(--color-ink-gray-4)' : 'var(--color-ink-white)';
    this.spin.style.display = loading ? 'block' : 'none';
    this.spin.style.transform = 'rotate(' + (t * 540) + 'deg)';
    const press = (a) => 1 - 0.04 * seg(t, a - 0.05, a) * (1 - seg(t, a, a + 0.12));
    this.add.style.transform = 'scale(' + press(T_SAVE) + ')';
    const done = t >= T_DONE;
    this.new.style.visibility = done ? 'visible' : 'hidden';
    this.old.style.transform = 'translateY(' + (done ? 147 : 0) + 'px)';
    this.hg.style.transform = 'translateX(' + (done ? HDR_SHIFT : 0) + 'px)';
    this.hbadge.style.left = done ? '991.8px' : '980.2px';
    this.hbadge.innerHTML = statusBadge(done ? 'Mitigated' : 'In Progress');
    let r = null;
    for (const g of RINGS) if (t0 >= g[0] && t0 < g[1]) r = g;
    if (r) {
      const s = this.ring.style;
      s.left = r[2] + 'px'; s.top = r[3] + 'px'; s.width = r[4] + 'px'; s.height = r[5] + 'px'; s.borderRadius = r[6] + 'px';
      s.opacity = Math.min(eo(seg(t0, r[0], r[0] + 0.25)), 1 - seg(t0, r[1] - 0.15, r[1]));
    } else this.ring.style.opacity = 0;
    this.cur.render(t0);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
