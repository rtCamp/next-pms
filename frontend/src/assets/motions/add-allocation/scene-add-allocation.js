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
const PROJECTS = ['Atlas UI Stabilization', 'Nimbus Analytics Enhancement', 'Orion Release Readiness', 'Website Redesign', 'Mobile App Development'];
const PEOPLE = [['H', 'Henry Johnson'], ['J', 'Julian Andrews'], ['S', 'Shanthi Priya']];
const WEEKS = ['Oct 12 - 18', 'Oct 19 - 25', 'Oct 26 - Nov 1', 'Nov 2 - 8'];
const CAL = [[27, 28, 29, 30, 1, 2, 3], [4, 5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16, 17], [18, 19, 20, 21, 22, 23, 24], [25, 26, 27, 28, 29, 30, 31]];
// Hours / day, Repeat for and Total hours split the row with gap-3: two columns of 236, or three of 153.3 once Recurring.
const COL2 = 236, COL3 = 153.3;
const RINGS = [[0.4, 1.2, 1289, 9, 144, 38], [1.55, 2.5, 473, 166, 494, 42], [2.5, 3.45, 473, 236, 494, 42], [3.45, 4.15, 473, 377, 494, 38], [4.15, 5.7, 473, 517, 494, 42], [5.7, 8.55, 473, 585, COL3 + 10, 42], [8.55, 9.2, 474 + COL3 + 12, 585, COL3 + 10, 42], [9.2, 9.65, 878, 766, 80, 38], [10.4, 12.6, 628, 244, 730, 44]];
const ic = (p, sz) => '<svg width="' + (sz || 16) + '" height="' + (sz || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none">' + p + '</svg>';
const IC = {
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
};
const box = (x, y, w, h, r) => '<div class="pms-ghost" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px' + (r !== undefined ? ';border-radius:' + r + 'px' : '') + '"></div>';
const label = (x, y, txt, req, cls) => '<div class="pms-label ' + (cls || '') + '" style="left:' + x + 'px;top:' + y + 'px">' + txt + (req ? ' <b>*</b>' : '') + '</div>';
const chev = '<span style="margin-left:auto;color:var(--color-ink-gray-4);display:flex">' + ic(IC.down) + '</span>';
const menu = (cls, top, items) => '<div class="pms-menu ' + cls + '" style="left:14px;top:' + top + 'px;width:484px;height:' + (items.length * 28 + 8) + 'px"><div class="pms-abs ' + cls + '-tint" style="left:4px;top:4px;width:476px;height:28px;border-radius:6px;background:var(--color-surface-gray-2)"></div><div style="position:relative">' + items.join('') + '</div></div>';
const WARP = [[0.0, 0.0], [1.445, 1.07], [1.695, 1.07], [2.707, 1.82], [2.957, 1.82], [3.767, 2.42], [4.017, 2.42], [4.625, 2.87], [4.875, 2.87], [5.482, 3.32], [5.732, 3.32], [6.34, 3.77], [6.59, 3.77], [7.534, 4.47], [7.784, 4.47], [8.527, 5.02], [8.777, 5.02], [9.317, 5.42], [9.567, 5.42], [10.309, 5.97], [10.559, 5.97], [14.407, 8.82], [14.657, 8.82], [15.535, 9.47], [15.785, 9.47], [20.01, 12.6]];
const warp = (t) => { if (t <= 0) return t; for (let i = 1; i < WARP.length; i++) { const [n1, o1] = WARP[i], [n0, o0] = WARP[i - 1]; if (t <= n1) return n1 === n0 ? o1 : o0 + (t - n0) / (n1 - n0) * (o1 - o0); } const [n, o] = WARP[WARP.length - 1]; return o + (t - n); };
kit.scene('add-allocation', {
  init(kit) {
    const side = SHELL('alloc-team', { 0: '<div class="pms-btn pms-btn-solid at-add" style="left:1294px;top:14px;width:134px">' + ic(IC.plus, 15) + 'Add allocation</div>' });
    // The timeline is scrolled 3 days (114 px) so it starts on today, Oct 15, and Nov 2 - 8 fits the window.
    // It's clipped at the name column, x 480, and drawn in that clip's coordinates.
    let grid = '', tl = '';
    grid += '<div class="pms-abs" style="left:240px;right:0;top:113px;height:1px;background:var(--color-outline-gray-1)"></div>' + box(257, 136, 72, 14, 5);
    for (let w = 0; w < 4; w++) {
      const x0 = 266 * w - 114;
      tl += '<div class="pms-abs" style="left:' + (x0 + 190) + 'px;top:144px;width:76px;height:756px;border-radius:8px 8px 0 0;background:var(--color-surface-gray-1)"></div><div class="pms-abs" style="left:' + x0 + 'px;top:114px;width:1px;height:786px;background:var(--color-outline-gray-1)"></div>';
      tl += '<div class="pms-abs" style="left:' + x0 + 'px;top:120px;width:266px;text-align:center;font-size:12px;color:var(--color-ink-gray-4)">' + WEEKS[w] + '</div>';
    }
    for (let d = 0; d < 28; d++) {
      const n = d < 20 ? 12 + d : d - 19;
      tl += '<div class="pms-abs" style="left:' + (38 * d - 114) + 'px;top:150px;width:38px;text-align:center;font-size:13px;color:var(--color-ink-gray-4)">' + n + '</div>';
    }
    grid += '<div class="pms-abs" style="left:240px;right:0;top:175px;height:1px;background:var(--color-outline-gray-1)"></div>';
    for (let i = 0; i < 4; i++) {
      const y = 175 + 61 * i;
      grid += '<div class="pms-abs" style="left:240px;width:240px;top:' + (y + 60) + 'px;height:1px;background:var(--color-outline-gray-1)"></div>';
      grid += i === 1 ? '<div class="pms-abs" style="left:296px;top:' + (y + 11) + 'px;color:var(--color-ink-gray-4)">Julian Andrews</div>' + box(296, y + 34, 110, 9, 4) : box(296, y + 13, 96 + i * 13, 11, 5) + box(296, y + 34, 110, 9, 4);
      grid += box(272, y + 20, 16, 16, 8);
      for (let w = 0; w < 4; w++) {
        const x = 266 * w - 112;
        if (i === 1 && w >= 1) {
          tl += '<div class="pms-pill" style="left:' + x + 'px;top:' + (y + 14) + 'px;width:186px;background:var(--color-surface-amber-2);color:var(--color-ink-amber-4)">4h free<div class="pms-pill at-full' + w + '" style="left:0;top:0;width:0;background:var(--color-surface-green-2);color:var(--color-ink-green-4)">Full</div></div>';
        } else tl += box(x, y + 14, 186, 32);
      }
    }
    grid += '<div class="pms-abs" style="left:480px;top:0;right:0;bottom:0;overflow:hidden">' + tl + '</div>';
    const opts1 = PROJECTS.map((p) => '<div class="pms-opt">' + p + '</div>');
    const opts2 = PEOPLE.map((p) => '<div class="pms-opt"><span class="pms-av">' + p[0] + '</span>' + p[1] + '</div>');
    let cal = '<div class="pms-menu at-cal" style="left:14px;top:472px;width:240px;height:268px;padding:0"><div class="pms-abs" style="left:14px;top:13px;font-size:13px;font-weight:600">Oct 2026</div><div class="pms-abs" style="right:10px;top:10px;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--color-ink-gray-6)">' + ic(IC.left, 14) + 'Today' + ic(IC.right, 14) + '</div>';
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d, c) => { cal += '<div class="pms-abs" style="left:' + (8 + 32 * c) + 'px;top:44px;width:32px;text-align:center;font-size:11px;color:var(--color-ink-gray-4)">' + d + '</div>'; });
    CAL.forEach((row, r) => row.forEach((n, c) => {
      const muted = r === 0 && c < 4;
      cal += '<div class="pms-abs at-d' + (muted ? 'x' : n) + '" style="left:' + (8 + 32 * c) + 'px;top:' + (64 + 32 * r) + 'px;width:30px;height:30px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--color-' + (muted ? 'ink-gray-3' : 'ink-gray-8') + ')' + (n === 15 && !muted ? ';font-weight:700' : '') + '">' + n + '</div>';
    }));
    cal += '<div class="pms-abs" style="right:8px;bottom:8px;height:24px;padding:0 10px;border:1px solid var(--color-outline-gray-2);border-radius:6px;display:flex;align-items:center;font-size:12px">Clear</div></div>';
    const dlg = '<div class="pms-abs at-ov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)"></div><div class="pms-dialog at-dlg" style="left:464px;top:88px;height:724px">' +
      '<div class="pms-abs" style="left:14px;top:14px;font-size:16px;font-weight:600">Add allocation</div><div class="pms-abs" style="right:14px;top:14px;color:var(--color-ink-gray-6)">' + ic(IC.x) + '</div>' +
      label(14, 58, 'Employee', 1) + '<div class="pms-input at-ein" style="left:14px;top:83px;width:484px"><span class="pms-av at-eav">J</span><span class="at-ev">Select Employee</span>' + chev + '</div>' +
      label(14, 129, 'Project', 1) + '<div class="pms-input at-pin" style="left:14px;top:153px;width:484px"><span class="at-pv">Select Project</span>' + chev + '</div>' +
      label(14, 199, 'Customer') + '<div class="pms-input" style="left:14px;top:223px;width:484px;background:var(--color-surface-gray-2);border-color:var(--color-surface-gray-2)"><span class="at-cv">Select Customer</span>' + chev + '</div>' +
      label(14, 269, 'Recurrence') + '<div class="pms-abs" style="left:14px;top:294px;width:484px;height:28px;border-radius:10px;background:var(--color-surface-gray-2)"><div class="pms-abs at-knob" style="left:1px;top:1px;width:240px;height:26px;border-radius:10px;background:var(--color-surface-white);box-shadow:0 1px 2px rgba(0,0,0,.1)"></div><div class="pms-abs at-s1" style="left:0;top:5px;width:242px;text-align:center">One time</div><div class="pms-abs at-s2" style="left:242px;top:5px;width:242px;text-align:center">Recurring</div></div>' +
      box(14, 342, 100, 10, 5) + box(14, 362, 14, 14, 4) + box(34, 364, 110, 10, 5) + box(14, 384, 14, 14, 4) + box(34, 386, 104, 10, 5) +
      label(14, 410, 'Start and end date', 1) + '<div class="pms-input on" style="left:14px;top:434px;width:484px"><span class="at-dv">Oct 15, 2026 - Oct 15, 2026</span><span style="margin-left:auto;color:var(--color-ink-gray-6);display:flex">' + ic(IC.cal) + '</span></div>' +
      label(14, 478, 'Hours / day', 1, 'at-hl') + '<div class="pms-abs at-hs" style="left:14px;top:502px;width:' + COL2 + 'px;height:32px;border-radius:8px;background:var(--color-surface-white);box-shadow:0 0 0 1px var(--color-outline-gray-2);overflow:hidden"><div class="pms-abs at-hf" style="left:0;top:0;height:32px;width:0;background:var(--color-surface-gray-3);border-radius:8px"><span class="pms-abs" style="right:8px;top:10px;width:2px;height:12px;border-radius:2px;background:color-mix(in srgb, var(--color-surface-gray-7) 9%, transparent)"></span></div><span class="pms-abs at-hv" style="right:10px;top:0;width:40px;height:32px;display:flex;align-items:center;justify-content:center;font-size:14px;font-variant-numeric:tabular-nums">00:00</span></div>' +
      label(26 + COL3, 478, 'Repeat for', 1, 'at-rl') + '<div class="pms-input on at-rin" style="left:' + (26 + COL3) + 'px;top:502px;width:' + COL3 + 'px"><span class="at-rv">1</span><span class="at-rc" style="display:inline-block;width:2px;height:17px;background:var(--color-ink-gray-8);margin-left:-5px"></span><span class="at-ru" style="margin-left:auto;font-size:12px;color:var(--color-ink-gray-5)">week</span></div>' +
      label(26 + COL2, 478, 'Total hours', 0, 'at-tl') + '<div class="pms-input on at-tin" style="left:' + (26 + COL2) + 'px;top:502px;width:' + COL2 + 'px"><span class="at-tv">0</span></div>' +
      '<div class="pms-abs at-warn" style="left:14px;top:546px;width:484px;height:0;border-radius:8px;background:var(--color-violet-50);overflow:hidden"><div class="pms-abs" style="left:10px;top:8px;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--color-ink-gray-8);width:464px"><span style="color:var(--color-ink-violet-4);display:flex">' + ic(IC.warn, 15) + '</span><span>This allocation causes over-allocation on 10 days (+10h total)</span><span style="margin-left:auto;color:var(--color-ink-gray-7);display:flex">' + ic(IC.down, 15) + '</span></div></div>' +
      '<div class="pms-abs at-low" style="left:0;top:546px;width:512px;height:180px">' + box(14, 8, 14, 14, 4) + box(34, 10, 130, 10, 5) + box(14, 42, 40, 10, 5) + box(14, 61, 484, 61) + box(14, 144, 14, 14, 4) + box(34, 146, 110, 10, 5) + box(356, 137, 52, 28) + '<div class="pms-btn pms-btn-solid at-alloc" style="left:419px;top:137px;width:70px">Allocate</div></div>' +
      menu('at-em', 121, opts2) + menu('at-pm', 191, opts1) + cal + '</div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam at-cam"><div class="pms-win">' + side + grid +
      dlg + '<div class="pms-ring at-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.at-' + c);
    for (const k of ['cam', 'ov', 'dlg', 'pm', 'em', 'pm-tint', 'em-tint', 'pv', 'pin', 'cv', 'ev', 'eav', 'ein', 'knob', 's1', 's2', 'cal', 'dv', 'hs', 'hf', 'hv', 'rl', 'rin', 'rv', 'rc', 'ru', 'tl', 'tin', 'tv', 'warn', 'low', 'add', 'alloc', 'ring', 'full1', 'full2', 'full3', 'd15', 'd19', 'd20', 'd21', 'd22', 'd23']) this[k] = q(k);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.12, hold: 0.4 },
      { t: 1.0, cx: 1200, cy: 360, z: 2.0, hold: 0.2 },
      { t: 1.75, cx: 960, cy: 420, z: 1.9, hold: 2.25 },
      { t: 4.4, cx: 960, cy: 660, z: 1.9, hold: 3.95 },
      { t: 8.75, cx: 960, cy: 700, z: 1.9, hold: 0.95 },
      { t: 10.3, cx: 1067, cy: 400, z: 1.76, drift: [0, 0, 0.004] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1500, 900] }, { t: 1.0, at: [1601, 118] },
      { t: 1.75, at: [960, 277] }, { t: 2.05, at: [824, 317] }, { t: 2.2, at: [824, 345] },
      { t: 2.8, at: [960, 347] }, { t: 3.05, at: [824, 387] }, { t: 3.18, at: [824, 415] }, { t: 3.3, at: [824, 443] },
      { t: 3.7, at: [1081, 486] }, { t: 4.4, at: [1004, 628] },
      { t: 4.95, at: [774, 825] }, { t: 5.35, at: [902, 825] },
      { t: 5.9, at: [796, 696] }, { t: 6.15, at: [796, 696] }, { t: 6.45, at: [815, 696] }, { t: 7.5, at: [815, 696] }, { t: 7.75, at: [796, 696] },
      { t: 8.75, at: [960, 696] }, { t: 9.4, at: [1158, 875] },
      { t: 10.4, at: [1300, 500] }, { t: 12.6, at: [1310, 506] },
    ];
    this.cur.clicks = [1.1, 1.85, 2.45, 2.9, 3.35, 3.8, 4.5, 5.05, 5.45, 6.0, 6.1, 7.45, 8.85, 9.5]; // 6.1 and 7.45 start the slider drags: a click ring marks each press
    this.cur.holds = [[6.1, 6.5], [7.45, 7.8]];
  },
  render(t) {
    t = warp(t);
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const open = eo(seg(t, 1.2, 1.35)) * (1 - ei(seg(t, 9.6, 9.75)));
    this.ov.style.opacity = open;
    this.dlg.style.opacity = open;
    this.dlg.style.visibility = open > 0 ? 'visible' : 'hidden';
    this.dlg.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, 1.2, 1.35))) + ')';
    const pop = (el, a, b) => {
      const m = eo(seg(t, a, a + 0.17)) * (1 - seg(t, b, b + 0.12));
      el.style.opacity = m; el.style.visibility = m > 0 ? 'visible' : 'hidden';
      el.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, a, a + 0.17))) + ')';
    };
    pop(this.em, 1.9, 2.47);
    this['em-tint'].style.top = (4 + 28 * eio(seg(t, 2.05, 2.2))) + 'px';
    pop(this.pm, 2.95, 3.37);
    this['pm-tint'].style.top = (4 + 28 * (eio(seg(t, 3.05, 3.18)) + eio(seg(t, 3.18, 3.3)))) + 'px';
    pop(this.cal, 4.55, 5.6);
    this.pv.textContent = t >= 3.37 ? PROJECTS[2] : 'Select Project';
    this.pin.classList.toggle('on', t >= 3.37);
    this.cv.textContent = t >= 3.5 ? 'Grant Plastics Ltd.' : 'Select Customer';
    this.cv.style.color = 'var(--color-' + (t >= 3.5 ? 'ink-gray-5' : 'ink-gray-4') + ')';
    this.ev.textContent = t >= 2.47 ? PEOPLE[1][1] : 'Select Employee';
    this.eav.style.display = t >= 2.47 ? 'flex' : 'none';
    this.ein.classList.toggle('on', t >= 2.47);
    const r = eio(seg(t, 3.8, 3.95));
    this.knob.style.left = lerp(1, 243, r) + 'px';
    this.s1.style.color = 'var(--color-' + (r < 0.5 ? 'ink-gray-8' : 'ink-gray-5') + ')';
    this.s2.style.color = 'var(--color-' + (r < 0.5 ? 'ink-gray-5' : 'ink-gray-8') + ')';
    const p = eio(seg(t, 3.85, 4.05));
    const w = lerp(COL2, COL3, p);
    this.hs.style.width = w + 'px';
    this.rl.style.opacity = p; this.rin.style.opacity = p;
    this.tl.style.left = lerp(26 + COL2, 38 + 2 * COL3, p) + 'px';
    this.tin.style.left = lerp(26 + COL2, 38 + 2 * COL3, p) + 'px';
    this.tin.style.width = w + 'px';
    this.dv.textContent = t < 5.05 ? 'Oct 15, 2026 - Oct 15, 2026' : t < 5.45 ? 'Oct 19, 2026' : 'Oct 19, 2026 - Oct 23, 2026';
    const dark = (el, on) => { el.style.background = on ? 'var(--color-surface-gray-7)' : 'transparent'; el.style.color = on ? 'var(--color-ink-white)' : 'var(--color-ink-gray-8)'; };
    dark(this.d15, t < 5.05);
    dark(this.d19, t >= 5.05);
    dark(this.d23, t >= 5.45);
    for (const k of ['d20', 'd21', 'd22']) this[k].style.background = t >= 5.45 ? 'var(--color-surface-gray-2)' : 'transparent';
    let hrs = 0;
    if (t >= 6.0) hrs = 4;
    if (t >= 6.15) hrs = lerp(4, 5, eio(seg(t, 6.15, 6.45)));
    if (t >= 7.5) hrs = lerp(5, 4, eio(seg(t, 7.5, 7.75)));
    hrs = Math.round(hrs * 4) / 4;
    const mins = Math.round(hrs * 60);
    this.hf.style.width = (hrs / 8 * 100) + '%';
    this.hf.style.visibility = hrs > 0 ? 'visible' : 'hidden';
    this.hv.textContent = String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
    const rep = t >= 9.0 ? 2 : 1;
    this.rv.textContent = String(rep);
    this.ru.textContent = rep === 1 ? 'week' : 'weeks';
    this.rc.style.opacity = t > 8.85 && t < 9.3 && (t < 9.0 || Math.floor(t / 0.53) % 2 === 0) ? 1 : 0;
    this.tv.textContent = String(Math.round(hrs * 5 * (rep + 1) * 100) / 100);
    const wp = eio(seg(t, 6.95, 7.1)) * (1 - eio(seg(t, 8.25, 8.4)));
    this.warn.style.height = 32 * wp + 'px';
    this.low.style.transform = 'translateY(' + 48 * wp + 'px)';
    this.dlg.style.height = (724 + 48 * wp) + 'px';
    const press = (a) => 1 - 0.04 * seg(t, a - 0.05, a) * (1 - seg(t, a, a + 0.12));
    this.add.style.transform = 'scale(' + press(1.1) + ')';
    this.alloc.style.transform = 'scale(' + press(9.5) + ')';
    this.full1.style.width = eio(seg(t, 10.35, 10.75)) * 100 + '%';
    this.full2.style.width = eio(seg(t, 10.5, 10.9)) * 100 + '%';
    this.full3.style.width = eio(seg(t, 10.65, 11.05)) * 100 + '%';
    // a fill at width 0 still shows its padding as a green sliver: hide it until it starts
    this.full1.style.visibility = t > 10.35 ? 'visible' : 'hidden';
    this.full2.style.visibility = t > 10.5 ? 'visible' : 'hidden';
    this.full3.style.visibility = t > 10.65 ? 'visible' : 'hidden';
    let g = null;
    for (const x of RINGS) if (t >= x[0] && t < x[1]) g = x;
    const s = this.ring.style;
    if (g) {
      s.left = g[2] + 'px'; s.top = g[3] + 'px'; s.width = g[4] + 'px'; s.height = g[5] + 'px';
      s.opacity = Math.min(eo(seg(t, g[0], g[0] + 0.25)), 1 - seg(t, g[1] - 0.15, g[1]));
    } else s.opacity = 0;
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
