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
const NAME = 'Retainer upsell';
const NOTE = 'Client approved the scope';
const S = (x, y) => [x + 240, y + 90];
const ic = (p, sz, sty) => '<svg width="' + (sz || 16) + '" height="' + (sz || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;' + (sty || '') + '">' + p + '</svg>';
const IC = { x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', plus: '<path d="M5 12h14"/><path d="M12 5v14"/>' };
const A = (x, y, w, h, extra) => '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;' + (extra || '') + '">';
const G = (x, y, w, h, r) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;background:var(--color-surface-gray-3)"></div>';
const T = (x, cy, w) => G(x, cy - 5, w, 10, 5);
const S2 = (x, cy, w) => G(x, cy - 4, w, 8, 4);
const I = (x, cy) => G(x, cy - 7, 14, 14, 4);
const HL = (x, y, w) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:1px;background:var(--color-outline-gray-1)"></div>';
const DOTCOL = { Ideation: 'var(--color-ink-gray-4)', 'In Progress': 'var(--color-ink-amber-3)' };
const dot = (s) => '<svg width="16" height="16" viewBox="0 0 16 16" style="flex:none;color:' + DOTCOL[s] + '"><circle cx="8" cy="8" r="3.5" fill="currentColor"/></svg>';
const pill = (s) => '<div style="display:flex;align-items:center;gap:8px;height:24px;padding:0 8px;border-radius:12px;background:var(--color-surface-gray-2);font-size:13px;letter-spacing:.26px;color:var(--color-ink-gray-7);white-space:nowrap;box-sizing:border-box">' + dot(s) + s + '</div>';
const bars = '<svg width="14" height="14" viewBox="0 0 14 14" style="flex:none"><rect x="9.5" y="1.7" width="1.3" height="10.5" fill="currentColor" opacity=".35"/><rect x="6" y="5.2" width="1.3" height="7" fill="currentColor"/><rect x="2.5" y="8.7" width="1.3" height="3.5" fill="currentColor"/></svg>';
const dots3 = '<svg width="16" height="16" viewBox="0 0 16 16" style="display:block"><circle cx="3.5" cy="8" r="1.2" fill="currentColor"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="12.5" cy="8" r="1.2" fill="currentColor"/></svg>';
const warn = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
const chev = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const check = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none"><path d="M3.5 8.5l3 3 6-7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const info = (x, y) => '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="position:absolute;left:' + x + 'px;top:' + y + 'px;color:var(--color-ink-gray-4)"><circle cx="6" cy="6" r="5" stroke="currentColor"/><path d="M6 5.4v2.8" stroke="currentColor" stroke-linecap="round"/><circle cx="6" cy="3.7" r=".6" fill="currentColor"/></svg>';
const BORDER = 'border:1px solid var(--color-outline-gray-1)';
const TABS = [[260, 62.7], [346.7, 60.1], [430.8, 57.2], [512, 51.7], [587.7, 35.3], [647, 48.4], [719.4, 39.2], [782.5, 35.9], [842.4, 42.1], [908.5, 65.3], [997.7, 65.7]];
const ghostTabs = () => TABS.map(([x, w]) => T(x, 76.5, w)).join('') + HL(240, 96, 899) + '<div class="pms-abs" style="left:647px;top:95px;width:48.4px;height:1px;background:var(--color-ink-gray-7)"></div>';
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
const chrome = () => ghostTabs() + ghostPanel();
const ROW_Y = 287.9, ROW_CY = ROW_Y + 23.5;
const list = () => {
  let s = T(260, 127, 63) + G(1034.8, 113, 84.2, 28, 8);
  s += G(260, 155, 176, 28, 8) + G(444, 155, 176, 28, 8) + G(626, 163, 12, 12, 6) + G(646, 155, 128, 28, 8) + G(782, 155, 144, 28, 8) + G(1055.4, 155, 63.6, 28, 8);
  const group = (y, w, cw) => HL(260, y + 41.8, 859) + I(269, y + 21) + T(292, y + 21, w) + G(y < 300 ? 459.3 : 470.2, y + 12, cw, 17.8, 9);
  const cols = (y, xs) => { let r = HL(260, y + 31, 859); xs.forEach(([x, w]) => { r += S2(x, y + 15.5, w); }); return r; };
  s += group(197.1, 159.3, 16.9) + cols(247.9, [[272, 46], [480, 56], [608, 108], [744, 36], [880, 38], [988, 100]]);
  [1, 2].forEach((i) => {
    const y = ROW_Y + 48 * i, cy = y + 23.5;
    s += HL(260, y + 47, 859) + T(272, cy, [96, 120][i - 1]) + T(480, cy, [70, 90][i - 1]) + G(608, cy - 11.5, 83.4, 23, 12) + I(745, cy) + T(766, cy, [64, 50][i - 1]) + G(880, cy - 8, 16, 16, 8) + T(902, cy, [60, 50][i - 1]) + T(988, cy, 40) + G(1087, y + 9.5, 28, 28, 8) + '<div class="pms-abs" style="left:1093px;top:' + (y + 15.5) + 'px;color:var(--color-ink-gray-8)">' + dots3 + '</div>';
  });
  s += '<div class="gs-rowhover" style="position:absolute;left:260px;top:' + ROW_Y + 'px;width:859px;height:48px;background:var(--color-surface-gray-1);opacity:0"></div>' + HL(260, ROW_Y + 47, 859);
  s += '<div style="position:absolute;left:272px;top:' + (ROW_CY - 8) + 'px;height:16px;line-height:16px;font-size:14px;font-weight:500;color:var(--color-ink-gray-8);white-space:nowrap">' + NAME + '</div>';
  s += T(480, ROW_CY, 66) + G(608, ROW_CY - 11.5, 83.4, 23, 12) + G(880, ROW_CY - 8, 16, 16, 8) + T(902, ROW_CY, 56) + T(988, ROW_CY, 40);
  s += '<div style="position:absolute;left:744px;top:' + (ROW_CY - 8) + 'px;display:flex;align-items:center;gap:8px;height:16px;font-size:14px;color:var(--color-ink-gray-6);white-space:nowrap">' + dot('Ideation') + 'Ideation</div>';
  s += '<div class="gs-dots" style="position:absolute;left:1087px;top:' + (ROW_Y + 9.5) + 'px;width:28px;height:28px;border-radius:8px;background:var(--color-surface-gray-3);opacity:0"></div><div style="position:absolute;left:1093px;top:' + (ROW_Y + 15.5) + 'px;color:var(--color-ink-gray-8)">' + dots3 + '</div>' +
    '<div class="gs-menu2" style="position:absolute;left:1021px;top:329px;width:160px;height:70px;box-sizing:border-box;border-radius:12px;background:var(--color-surface-modal);box-shadow:0 0 1px rgba(0,0,0,.2),0 1px 3px rgba(0,0,0,.05),0 10px 24px -3px rgba(0,0,0,.1);visibility:hidden"><div class="gs-edithl" style="position:absolute;left:7px;top:7px;width:146px;height:28px;border-radius:8px;background:var(--color-surface-gray-3);opacity:0"></div><div style="position:absolute;left:15px;top:7px;line-height:28px;font-size:14px;color:var(--color-ink-gray-7)">Edit</div><div style="position:absolute;left:15px;top:35px;line-height:28px;font-size:14px;color:var(--color-ink-red-3)">Delete</div></div>';
  s += group(451.9, 170.2, 19.7) + cols(502.7, [[272, 46], [480, 56], [608, 38], [744, 100], [880, 80]]) + S2(604.5, 573.5, 170);
  return s;
};
const entryHead = (y) => G(260, y, 20, 20, 10) + T(288, y + 10, 71.4) + T(367.4, y + 10, 119) + T(1070.7, y + 10, 48.3);
const detail = () => {
  let s = I(267, 127) + T(296, 127, 135);
  s += '<div class="gs-hg">' + G(910.3, 115.5, 83.4, 23, 12) + '</div>';
  s += '<div class="gs-hbadge" style="position:absolute;left:997.7px;top:115px"></div>';
  s += I(1098, 127);
  s += T(260, 173.5, 200) + T(260, 213.2, 160) + S2(260, 238, 176) + T(260, 277.4, 167) + I(1096, 277.4) + S2(260, 310.9, 150) + T(260, 350.4, 95) + I(1098, 350.4);
  s += T(260, 388.5, 40) + G(260, 400.5, 16, 16, 8) + S2(282, 408.5, 66) + S2(356, 408.5, 50) + G(1055, 388.4, 20, 20, 10) + I(1098, 398.4) + HL(260, 423.5, 859);
  s += T(260, 451.7, 52);
  [[477, 56, 78], [501.1, 86, 40], [525.2, 106, 48], [549.3, 76, 40]].forEach(([cy, a, b]) => { s += S2(260, cy, a) + S2(393.2, cy, b); });
  s += '<div style="position:absolute;left:260px;top:580px;height:18.4px;line-height:18.4px;font-size:16px;font-weight:500;letter-spacing:.32px;color:var(--color-ink-gray-7)">Updates</div>' + G(330, 583.2, 12, 12, 6);
  s += '<div class="gs-plus" style="position:absolute;left:1091px;top:575.3px;width:28px;height:28px;border-radius:8px;background:var(--color-surface-gray-3);opacity:0"></div>';
  s += '<div style="position:absolute;left:1097px;top:581.3px;color:var(--color-ink-gray-8)">' + ic(IC.plus, 16) + '</div>';
  s += '<div class="gs-new" style="position:absolute;left:0;top:0;visibility:hidden">' + entryHead(615.3) +
    A(268, 643.3, 1, 107, 'background:var(--color-outline-gray-1)') + '</div>' +
    A(285, 643.3, 832, 89, BORDER + ';border-radius:8px;box-sizing:content-box;background:var(--color-surface-white)') + '</div>' +
    '<div style="position:absolute;left:302px;top:662.3px">' + pill('In Progress') + '</div>' + G(415.1, 662.8, 83.4, 23, 12) + I(1081, 674.3) +
    '<div style="position:absolute;left:302px;top:696.3px;height:21px;line-height:21px;font-size:14px;color:var(--color-ink-gray-7);white-space:nowrap">' + NOTE + '</div></div>';
  s += '<div class="gs-old" style="position:absolute;left:0;top:0">' + entryHead(615.3) +
    A(285, 643.3, 832, 60, BORDER + ';border-radius:8px;box-sizing:content-box') + '</div>' + G(302, 662.3, 89.3, 24, 12) + G(395.3, 662.8, 83.4, 23, 12) + I(1081, 674.3) +
    T(260, 748.5, 58) + G(324.4, 742.4, 12, 12, 6);
  [769.6, 808.4, 847.1, 885.9].forEach((y, i) => { s += A(264, y, 1, 38.8, 'background:var(--color-outline-gray-1)') + '</div>' + G(260.5, y + 8, 8, 8, 4) + T(281, y + 11.4, [190, 150, 200, 170][i]); });
  s += '</div>';
  return s;
};
const dialog = () => {
  const lab = (y, t, req) => '<div style="position:absolute;left:24px;top:' + y + 'px;line-height:16.1px;font-size:14px;color:var(--color-ink-gray-5)">' + t + (req ? '<span style="margin-left:2px;color:var(--color-ink-red-3)">*</span>' : '') + '</div>';
  const sel = (cls, y, inner) => '<div class="' + cls + '" style="position:absolute;left:24px;top:' + y + 'px;width:392px;height:28px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;background:var(--color-surface-white);padding:0 8px;display:flex;align-items:center;gap:8px;font-size:14px;color:var(--color-ink-gray-7);white-space:nowrap">' + inner + '</div>';
  let s = '<div style="position:absolute;left:24px;top:22px;line-height:24px;font-size:20px;font-weight:600;color:var(--color-ink-gray-8)">Add update</div>';
  s += '<div style="position:absolute;left:384px;top:20px;width:32px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-8)">' + ic(IC.x, 16) + '</div>';
  s += lab(61, 'Status') + sel('gs-sel', 83.1, '<span class="gs-selv"></span><span style="margin-left:auto;display:flex">' + chev + '</span>');
  s += lab(127.1, 'Priority for Client') + sel('', 149.2, '<span>Medium</span><span style="margin-left:auto;display:flex">' + chev + '</span>');
  s += lab(193.2, 'Billable outcome') + info(139.2, 195.2);
  s += '<div style="position:absolute;left:24px;top:215.3px;width:392px;height:32px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;background:var(--color-surface-white);padding:0 10px;display:flex;align-items:center;font-size:14px;color:var(--color-ink-gray-4)">0</div>';
  s += lab(263.3, 'Note', true);
  s += '<div style="position:absolute;left:24px;top:285.4px;width:392px;height:96px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:10px;background:var(--color-surface-white)"><div class="gs-ph" style="position:absolute;left:8px;top:8px;line-height:21px;font-size:14px;color:var(--color-ink-gray-4)">Add a note...</div><div style="position:absolute;left:8px;top:8px;line-height:21px;font-size:14px;color:var(--color-ink-gray-7);white-space:nowrap"><span class="gs-nv"></span><span class="gs-caret" style="display:inline-block;width:1.5px;height:16px;background:var(--color-ink-gray-8);vertical-align:-3px;margin-left:1px"></span></div></div>';
  s += '<div class="gs-add" style="position:absolute;left:24px;top:413.4px;width:392px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px;font-weight:450;background:var(--color-surface-gray-7);color:var(--color-ink-white)"><svg class="gs-spin" width="13.5" height="13.5" viewBox="0 0 16 16" fill="none" style="display:none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity=".25" stroke-width="2"/><path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Add update</span></div>';
  const opts = ['Closed', 'Ideation', 'In Progress', 'On Hold'];
  s += '<div class="gs-menu" style="position:absolute;left:21px;top:53px;width:98.4px;height:120px;box-sizing:border-box;padding:4px;border-radius:12px;background:var(--color-surface-modal);box-shadow:0 0 0 1px var(--color-outline-gray-1),0 0 1px rgba(0,0,0,.2),0 1px 3px rgba(0,0,0,.05),0 10px 24px -3px rgba(0,0,0,.1);visibility:hidden"><div class="gs-hl" style="position:absolute;left:4px;top:32px;width:90.4px;height:28px;border-radius:8px;background:var(--color-surface-gray-2)"></div>' +
    opts.map((o, i) => '<div style="position:absolute;left:4px;top:' + (4 + 28 * i) + 'px;width:90.4px;height:28px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;font-size:14px;color:var(--color-ink-gray-8);white-space:nowrap">' + o + (o === 'Ideation' ? '<span class="gs-chk" style="margin-left:auto;display:flex">' + check + '</span>' : '') + '</div>').join('') + '</div>';
  return s;
};
const editDialog = () => {
  const lab = (y, t) => '<div style="position:absolute;left:24px;top:' + y + 'px;line-height:16.1px;font-size:14px;color:var(--color-ink-gray-5)">' + t + '</div>';
  const locked = (y) => '<div style="position:absolute;left:24px;top:' + y + 'px;width:392px;height:32px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;background:var(--color-surface-gray-1)"></div>';
  let s = '<div style="position:absolute;left:24px;top:22px;line-height:24px;font-size:20px;font-weight:600;color:var(--color-ink-gray-8)">Edit growth initiative</div>';
  s += '<div style="position:absolute;left:384px;top:20px;width:32px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-8)">' + ic(IC.x, 16) + '</div>';
  s += '<div class="gs-eload" style="position:absolute;left:0;top:0;width:440px;height:234px"><svg class="gs-espin" width="16" height="16" viewBox="0 0 16 16" fill="none" style="position:absolute;left:212px;top:101px;color:var(--color-ink-gray-8)"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity=".25" stroke-width="1.6"/><path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' + G(24, 180, 392, 28, 8) + '</div>';
  s += '<div class="gs-eform" style="position:absolute;left:0;top:0;width:440px;height:698px">';
  s += '<div style="position:absolute;left:0;top:0;width:440px;height:630px;overflow:hidden">';
  s += S2(24, 69, 50) + G(24, 83.1, 392, 32, 8) + S2(24, 139.1, 56) + G(24, 153.2, 392, 32, 8) + S2(24, 209.2, 70) + G(24, 223.3, 392, 96, 10);
  s += lab(335.3, 'Priority for Client') + locked(357.4) + '<div style="position:absolute;left:35px;top:361.9px;display:flex;align-items:center;gap:4px;height:23px;padding:0 8px;border-radius:12px;background:var(--color-surface-amber-2);font-size:13px;color:var(--color-amber-700);box-sizing:border-box">' + bars + 'Medium</div>';
  s += lab(405.4, 'Status') + locked(427.5) + '<div style="position:absolute;left:35px;top:431.5px;display:flex;align-items:center;gap:8px;height:24px;font-size:14px;color:var(--color-ink-gray-5);white-space:nowrap">' + dot('Ideation') + 'Ideation</div>';
  s += lab(475.5, 'Billable outcome') + locked(497.6) + '<div style="position:absolute;left:35px;top:505.5px;line-height:16.1px;font-size:14px;color:var(--color-ink-gray-5)">&#8377;0.00</div>';
  s += '<div style="position:absolute;left:24px;top:545.6px;width:392px;height:43.6px;box-sizing:border-box;border-radius:12px;background:var(--color-surface-violet-1)"></div><div style="position:absolute;left:34px;top:559.4px;color:var(--color-ink-violet-4)">' + warn + '</div><div style="position:absolute;left:58px;top:553.6px;width:348px;line-height:13.8px;font-size:12px;color:var(--color-ink-gray-8)">To change status, priority or billable outcome, add a new update instead.</div>';
  s += S2(24, 613.2, 92) + G(24, 627.3, 392, 96, 10);
  s += '</div>';
  s += '<div style="position:absolute;left:24px;top:646px;width:392px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:450;background:var(--color-surface-gray-7);color:var(--color-ink-white)">Save</div>';
  s += '</div>';
  return s;
};
// rings in window coords, [from, to, x, y, w, h, radius]
const RINGS = [
  [0.4, 1.2, 1082, 292.4, 38, 38, 11],
  [1.45, 1.95, 1023, 331, 156, 38, 11],
  [3.0, 5.4, 519, 660.6, 402, 53.6, 15],
  [5.55, 6.15, 879, 135, 42, 38, 11],
  [6.7, 7.55, 255, 282.9, 869, 58, 3],
  [8.55, 9.15, 1086, 570.3, 38, 38, 11],
  [9.55, 10.1, 519, 198.1, 402, 38, 11],
  [10.5, 11.2, 520, 228, 100.4, 38, 11],
  [11.85, 12.45, 519, 400.4, 402, 106, 13],
  [14.2, 14.85, 519, 528.4, 402, 38, 11],
  [15.8, 16.9, 972.9, 110, 119.1, 34, 15],
  [16.95, 18.3, 280, 638.3, 844, 101, 11],
];
const T_ROW = 7.55, T_PLUS = 9.0, T_SEL = 10.1, T_PICK = 11.2, T_NOTE = 12.3, T_SAVE = 14.85, T_DONE = 15.4, HDR_SHIFT = 19.8, NEW_H = 139;
const hover = (cur, t, x, y, w, h, n) => {
  let c = 0;
  for (let i = 0; i < n; i++) {
    const [px, py] = cur.position(t - i * 0.03);
    if (px - 240 >= x && px - 240 < x + w && py - 90 >= y && py - 90 < y + h) c++;
  }
  return c / n;
};
kit.scene('change-growth-status', {
  init(kit) {
    const side = SHELL('project-detail');
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam gs-cam"><div class="pms-win">' + side + chrome() +
      '<div class="gs-list">' + list() + '</div><div class="gs-detail" style="visibility:hidden">' + detail() + '</div>' +
      '<div class="pms-abs gs-ov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0"></div>' +
      '<div class="pms-abs gs-edlg" style="left:500px;top:120px;width:440px;height:233.9px;background:var(--color-surface-modal);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.18);opacity:0;visibility:hidden">' + editDialog() + '</div>' +
      '<div class="pms-abs gs-dlg" style="left:500px;top:120px;width:440px;height:465.4px;background:var(--color-surface-modal);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.18);opacity:0;visibility:hidden">' + dialog() + '</div>' +
      '<div class="pms-ring gs-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.gs-' + c);
    for (const k of ['cam', 'list', 'detail', 'ov', 'dlg', 'edlg', 'eload', 'eform', 'espin', 'dots', 'menu2', 'edithl', 'ring', 'rowhover', 'plus', 'hbadge', 'hg', 'new', 'old', 'sel', 'selv', 'menu', 'hl', 'chk', 'ph', 'nv', 'caret', 'add', 'spin']) this[k] = q(k);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.1, hold: 0.3 },
      { t: 1.0, cx: 960, cy: 450, z: 1.6, hold: 1.0 },
      { t: 3.0, cx: 960, cy: 640, z: 1.6, hold: 2.4 },
      { t: 6.0, cx: 1000, cy: 440, z: 1.6, hold: 1.65 },
      { t: 8.6, cx: 1040, cy: 620, z: 1.6, hold: 0.4 },
      { t: 9.9, cx: 960, cy: 440, z: 2.0, hold: 5.6, drift: [0, 0, 0.004] },
      { t: 16.6, cx: 1040, cy: 520, z: 1.5, hold: 1.8, drift: [0, 0, 0.004] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1500, 900] }, { t: 0.35, at: [1500, 900] }, { t: 1.0, at: S(1101, 311.4) }, { t: 1.4, at: S(1101, 311.4) },
      { t: 1.8, at: S(1101, 350) }, { t: 2.7, at: S(1101, 350) }, { t: 3.4, at: [1200, 700] }, { t: 5.4, at: [1200, 700] },
      { t: 6.05, at: S(900, 154) }, { t: 6.4, at: S(900, 154) }, { t: 7.0, at: S(560, 311.9) }, { t: 7.65, at: S(560, 311.9) },
      { t: 8.35, at: S(1105, 589.3) }, { t: 9.1, at: S(1105, 589.3) }, { t: 9.65, at: S(720, 217.1) }, { t: 10.35, at: S(720, 217.1) },
      { t: 10.95, at: S(570, 247) }, { t: 11.25, at: S(570, 247) }, { t: 11.95, at: S(720, 453.4) }, { t: 13.9, at: S(720, 453.4) },
      { t: 14.55, at: S(720, 547.4) }, { t: 15.5, at: S(720, 547.4) }, { t: 16.3, at: S(1128, 470) }, { t: 18.4, at: S(1128, 470) },
    ];
    this.cur.clicks = [1.2, 1.95, 6.15, T_ROW, T_PLUS, T_SEL, T_PICK, T_NOTE, T_SAVE];
    this.typ = kit.typist(NOTE, 12.5, 18);
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    // part 1: the locked Edit form
    const menuOn = t >= 1.2 && t < 1.95;
    const eopen = eo(seg(t, 1.95, 2.1)) * (1 - ei(seg(t, 6.15, 6.32)));
    const open = eo(seg(t, T_PLUS, T_PLUS + 0.15)) * (1 - ei(seg(t, T_DONE, T_DONE + 0.17)));
    const free = Math.max(open, eopen) < 0.05 ? 1 : 0;
    this.menu2.style.visibility = menuOn ? 'visible' : 'hidden';
    this.edithl.style.opacity = menuOn ? hover(this.cur, t, 1028, 336, 146, 28, 1) : 0;
    this.dots.style.opacity = menuOn ? 1 : hover(this.cur, t, 1087, ROW_Y + 9.5, 28, 28, 6) * free;
    this.edlg.style.opacity = eopen;
    this.edlg.style.visibility = eopen > 0 ? 'visible' : 'hidden';
    this.edlg.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, 1.95, 2.1))) + ')';
    const loaded = t >= 2.4;
    this.eload.style.display = loaded ? 'none' : 'block';
    this.eform.style.display = loaded ? 'block' : 'none';
    this.edlg.style.height = (loaded ? 698 : 233.9) + 'px';
    this.espin.style.transform = 'rotate(' + (t * 540) + 'deg)';
    // part 2: the Add update flow
    this.list.style.visibility = t < T_ROW ? 'visible' : 'hidden';
    this.detail.style.visibility = t < T_ROW ? 'hidden' : 'visible';
    this.rowhover.style.opacity = hover(this.cur, t, 260, ROW_Y, 859, 48, 1) * free;
    this.plus.style.opacity = hover(this.cur, t, 1091, 575.3, 28, 28, 6) * free;
    this.ov.style.opacity = Math.max(open, eopen);
    this.dlg.style.opacity = open;
    this.dlg.style.visibility = open > 0 ? 'visible' : 'hidden';
    this.dlg.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, T_PLUS, T_PLUS + 0.15))) + ')';
    const menuOpen = t >= T_SEL && t < T_PICK;
    this.menu.style.visibility = menuOpen ? 'visible' : 'hidden';
    const [px, py] = this.cur.position(t);
    const inMenu = px - 240 >= 525 && px - 240 < 615.4 && py - 90 >= 177 && py - 90 < 289;
    this.hl.style.top = (4 + 28 * (inMenu ? Math.floor((py - 90 - 177) / 28) : 1)) + 'px';
    this.selv.textContent = t >= T_PICK ? 'In Progress' : 'Ideation';
    this.sel.style.borderColor = menuOpen ? 'var(--color-outline-gray-3)' : 'var(--color-outline-gray-2)';
    this.nv.textContent = t >= 12.5 ? this.typ.at(t) : '';
    this.ph.style.display = this.nv.textContent ? 'none' : 'block';
    const typing = t > 12.5 && t < this.typ.end;
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
    this.old.style.transform = 'translateY(' + (done ? NEW_H : 0) + 'px)';
    this.hg.style.transform = 'translateX(' + (done ? -HDR_SHIFT : 0) + 'px)';
    this.hbadge.style.left = (done ? 977.9 : 997.7) + 'px';
    this.hbadge.innerHTML = pill(done ? 'In Progress' : 'Ideation');
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
