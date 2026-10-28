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
const COLS = [916, 981, 1046, 1111, 1176, 1241, 1306];
const DATES = ['Oct 12', 'Oct 13', 'Oct 14', '15', 'Oct 16', 'Oct 17', 'Oct 18'];
const PROJECTS = ['Atlas UI Stabilization', 'Nimbus Analytics Enhancement', 'Orion Release Readiness', 'Website Redesign', 'Mobile App Development'];
const TASKS = ['Cross-browser and responsiveness fixes', 'Design system component refinements', 'Client dashboard layout improvements', 'Release notes and handover', 'Accessibility review'];
const EVENTS = [
  { name: 'Atlas sprint planning', range: '9:00 AM - 9:30 AM', len: '30m', mins: 30 },
  { name: 'Client check-in with Grant Plastics', range: '11:00 AM - 12:00 PM', len: '1hr', mins: 60 },
  { name: 'Orion readiness review', range: '2:00 PM - 3:00 PM', len: '1hr', mins: 60 },
];
const PICKS = [0, 1];
const T = { open: 1.25, pmOpen: 2.0, pmPick: 2.55, tmOpen: 3.2, tmPick: 3.75, tick: 4.5, load: 5.1, p1: 5.8, p2: 6.85, save: 9.6, shut: 10.0, ins: 10.15 };
const ic = (p, sz, sty) => '<svg width="' + (sz || 16) + '" height="' + (sz || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;' + (sty || '') + '">' + p + '</svg>';
const IC = {
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
};
const ROWICON = {
  chev: '<path d="M11.3848 5.6582C11.5735 5.45686 11.8903 5.44622 12.0918 5.63477C12.2931 5.82353 12.3038 6.14033 12.1152 6.3418L8.36523 10.3418C8.27071 10.4426 8.1382 10.5 8 10.5C7.8618 10.5 7.72929 10.4426 7.63477 10.3418L3.88477 6.3418C3.69622 6.14033 3.70686 5.82353 3.9082 5.63477C4.10967 5.44622 4.42647 5.45686 4.61523 5.6582L8 9.26855L11.3848 5.6582Z" fill="currentColor"/>',
  folder: '<path fill-rule="evenodd" clip-rule="evenodd" d="M10.023 2.5L8.43184 3.68632C8.25916 3.81507 8.04952 3.88462 7.83412 3.88462H2V12.5C2 13.0523 2.44772 13.5 3 13.5H13C13.5523 13.5 14 13.0523 14 12.5V2.5H10.023ZM9.49179 1.64872C9.6213 1.55216 9.77853 1.5 9.94008 1.5H14.35C14.709 1.5 15 1.79101 15 2.15V12.5C15 13.6046 14.1046 14.5 13 14.5H3C1.89543 14.5 1 13.6046 1 12.5V3.53462C1 3.17563 1.29102 2.88462 1.65 2.88462H7.83412L9.49179 1.64872Z" fill="currentColor"/>',
  task: '<g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M8 1.333V4m2.8 1.2 1.933-1.933M12 8h2.667M10.8 10.8l1.933 1.933M8 12v2.667m-4.733-1.934L5.2 10.8M1.333 8H4m-.733-4.733L5.2 5.2"/></g>',
};
const i16 = (inner) => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none">' + inner + '</svg>';
const cell = (x, txt, cls, sty) => '<div class="pms-cell ' + (cls || '') + '" style="left:' + (x - 268) + 'px;' + (sty || '') + '">' + txt + '</div>';
const bar = (x, y, w, h) => '<div class="pms-bar" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + (h || 10) + 'px"></div>';
const abs = (x, y, sty, inner, cls) => '<div class="pms-abs ' + (cls || '') + '" style="left:' + x + 'px;top:' + y + 'px;' + (sty || '') + '">' + (inner || '') + '</div>';
const chip = (svg, txt) => '<div style="display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 6px;border-radius:10px;background:var(--color-surface-gray-2);color:var(--color-ink-gray-6);font-size:12px;font-weight:420;white-space:nowrap">' + svg + txt + '</div>';
const CAL12 = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="2" width="9" height="8.5" rx="1.5"/><path d="M4 1v2M8 1v2M1.5 5h9"/></svg>';
const CLK12 = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 11A5 5 0 1 0 6 1a5 5 0 0 0 0 10"/><path d="M6 3v3l2 1"/></svg>';
const TICK = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--color-ink-white)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:0;top:0"><path d="M3.2 7.3l2.6 2.6 5-5.4"/></svg>';
const cbx = (x, y, cls) => '<div class="pms-abs ' + cls + '" style="left:' + x + 'px;top:' + y + 'px;width:14px;height:14px;box-sizing:border-box;border:1px solid var(--color-outline-gray-4);border-radius:3px;background:var(--color-surface-white)">' + TICK + '</div>';
const DX = 464, DY = 120;
const D = (x, y) => [240 + DX + x, 90 + DY + y];
const BOXTOP = 310.4, ROW0 = 356.5;
const spin = (t) => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="transform:rotate(' + ((t * 540) % 360).toFixed(1) + 'deg)"><circle cx="8" cy="8" r="6" stroke="var(--color-outline-gray-2)" stroke-width="2"/><path d="M8 2a6 6 0 0 1 6 6" stroke="var(--color-ink-gray-6)" stroke-width="2" stroke-linecap="round"/></svg>';
const fmtLeft = (m) => Math.floor(m / 60) + 'h' + (m % 60 ? ' ' + (m % 60) + 'm' : '') + ' left';
const RINGS = [
  [0.4, 1.2, 1324, 9, 109, 38],
  [1.45, 2.0, DX + 19, DY + 85, 474, 42],
  [2.7, 3.2, DX + 19, DY + 155, 474, 42],
  [3.9, 4.5, DX + 19, DY + 272, 169, 28],
  [5.35, 6.05, DX + 26, DY + 351, 460, 54],
  [6.4, 7.1, DX + 26, DY + 407, 460, 54],
  [7.2, 8.0, DX + 259, DY + 225, 234, 42],
  [8.0, 9.0, DX + 19, DY + 554, 474, 106, 13],
  [9.05, 9.65, DX + 255, DY + 674, 238, 38],
  [10.7, 13.1, 1078, 311, 66, 98],
];
kit.scene('calendar-events', {
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
    const resRow = (top, indent, icons, label, bold) => {
      let r = '<div class="pms-row" style="top:' + top + 'px"><div class="pms-abs" style="left:' + indent + 'px;top:12px;display:flex;align-items:center;gap:6px;color:var(--color-ink-gray-6)">' + icons + '<span style="color:var(--color-ink-gray-8)">' + label + '</span></div>';
      COLS.forEach((x, i) => { r += i === 3 ? cell(x, '01:30', '', 'color:var(--color-ink-gray-8)' + (bold ? ';font-weight:600' : '')) : cell(x, '-'); });
      return r + cell(1366, '01:30', '', 'color:var(--color-' + (bold ? 'ink-gray-6' : 'ink-green-4') + ')') + '</div>';
    };
    const ins = '<div class="pms-abs at-ins" style="left:0;right:0;top:316px;height:0;overflow:hidden">' + resRow(0, 26, i16(ROWICON.chev) + i16(ROWICON.folder), PROJECTS[0]) + resRow(44, 70, i16(ROWICON.task), TASKS[1], true) + '</div>';
    const panel = (cls, top, items, icon) => '<div class="pms-abs ' + cls + '" style="left:24px;top:' + top + 'px;width:464px;height:' + (items.length * 28.1 + 14) + 'px;box-sizing:border-box;border:1px solid var(--color-outline-gray-1);border-radius:12px;background:var(--color-surface-modal);box-shadow:0 0 1px rgba(0,0,0,.19), 0 1px 2px rgba(0,0,0,.07), 0 6px 15px -5px rgba(0,0,0,.11);visibility:hidden">' +
      items.map((s, i) => '<div class="pms-abs ' + cls + '-i" style="left:6px;top:' + (6 + i * 28.1) + 'px;width:450px;height:28.1px;border-radius:8px;display:flex;align-items:center;gap:0;font-size:14px;color:var(--color-ink-gray-8)"><span style="margin-left:9px;color:var(--color-ink-gray-6);display:flex">' + icon + '</span><span style="margin-left:13px;white-space:nowrap">' + s + '</span></div>').join('') + '</div>';
    let ev = '<div class="pms-abs at-evbox" style="left:24px;top:' + BOXTOP + 'px;width:464px;height:211.1px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;visibility:hidden">';
    ev += cbx(10, 10, 'at-cb-all') + abs(32, 8.5, 'font-weight:500;color:var(--color-ink-gray-5);white-space:nowrap;line-height:16px', 'Select all') + abs(0, 8.5, 'right:10px;left:auto;color:var(--color-ink-gray-5);font-weight:420;line-height:16px;white-space:nowrap', '<span class="at-count">0 of 3</span>');
    ev += abs(10, 36, 'width:442px;height:1px;background:var(--color-outline-gray-1)');
    EVENTS.forEach((e, i) => {
      const y = ROW0 - BOXTOP - 1 + 56 * i;
      ev += cbx(10, y + 3.5, 'at-cb-' + i) + abs(32, y + 2.5, 'font-weight:500;color:var(--color-ink-gray-8);white-space:nowrap;line-height:16px', e.name) +
        abs(30, y + 24, 'display:flex;gap:4px', chip(CAL12, 'Oct 15') + chip(CLK12, e.range));
    });
    ev += '</div>';
    const load = '<div class="pms-abs at-load" style="left:24px;top:' + BOXTOP + 'px;width:464px;height:50.1px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;visibility:hidden;display:flex;align-items:center;justify-content:center"><span class="at-spin"></span></div>';
    const dlg = '<div class="pms-abs at-ov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)"></div><div class="pms-dialog at-dlg" style="left:' + DX + 'px;top:' + DY + 'px">' +
      abs(24, 22, 'font-size:20px;font-weight:600;line-height:24px;white-space:nowrap', 'Add time') + abs(460, 20, 'width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-6)', ic(IC.x, 16)) +
      '<div class="pms-label" style="left:24px;top:68px">Project <b>*</b></div><div class="pms-input at-pin" style="left:24px;top:90px;width:464px"><span class="at-pic" style="display:none;margin-right:6px;color:var(--color-ink-gray-6)">' + i16(ROWICON.folder) + '</span><span class="at-pv">Select project</span><span style="margin-left:auto;color:var(--color-ink-gray-4);display:flex">' + ic(IC.down, 16) + '</span></div>' +
      '<div class="pms-label" style="left:24px;top:138px">Task <b>*</b></div><div class="pms-input at-tin" style="left:24px;top:160px;width:464px"><span class="at-tic" style="display:none;margin-right:6px;color:var(--color-ink-gray-6)">' + i16(ROWICON.task) + '</span><span class="at-tv">Select task</span><span style="margin-left:auto;color:var(--color-ink-gray-4);display:flex">' + ic(IC.down, 16) + '</span></div>' +
      '<div class="pms-label" style="left:24px;top:208px">Date <b>*</b></div><div class="pms-input on" style="left:24px;top:230px;width:224px;color:var(--color-ink-gray-7)">2026-10-15<span style="margin-left:auto;color:var(--color-ink-gray-6);display:flex">' + ic(IC.cal, 16) + '</span></div>' +
      '<div class="pms-label" style="left:264px;top:208px">Duration <b>*</b></div><div class="pms-abs at-left" style="right:24px;top:208px;font-size:13px;color:var(--color-ink-gray-5);line-height:15px;white-space:nowrap">2h 30m left</div><div class="pms-abs" style="left:264px;top:230px;width:224px;height:32px;border-radius:8px;background:var(--color-surface-gray-2);overflow:hidden"><div class="pms-abs at-dfill" style="left:0;top:0;height:32px;width:0;background:var(--color-surface-gray-4);border-radius:8px;visibility:hidden"></div><span class="pms-abs at-dv" style="right:10px;top:7px;font-variant-numeric:tabular-nums;font-size:14px">00:00</span></div>' +
      cbx(24, 279, 'at-cb-main') + abs(46, 278, 'font-weight:500;line-height:16px;white-space:nowrap', 'Add calendar events') +
      load + ev +
      '<div class="pms-label at-cl" style="left:24px;top:310px">Comment <b>*</b></div><div class="pms-abs at-ed" style="left:24px;top:332px;width:464px;height:96px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:10px;font-size:14px;line-height:21px;color:var(--color-ink-gray-7)"></div>' +
      '<div class="pms-btn pms-btn-soft at-b1" style="left:24px;top:452px;width:228px">Save and add another</div><div class="pms-btn pms-btn-solid at-save" style="left:260px;top:452px;width:228px"><span class="at-sp" style="display:none;margin-right:6px"></span>Save and close</div>' +
      panel('at-pm', 126, PROJECTS, i16(ROWICON.folder)) + panel('at-tm', 196, TASKS, i16(ROWICON.task)) + '</div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam at-cam"><div class="pms-win">' + side +
      head + week + proj + ins + '<div class="pms-abs at-below" style="left:0;right:0;top:316px;height:600px">' + skel + '</div>' + dlg + '<div class="pms-ring at-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.at-' + c);
    for (const k of ['cam', 'ov', 'dlg', 'pm', 'tm', 'pv', 'tv', 'pic', 'tic', 'dv', 'dfill', 'left', 'save', 'add', 'ins', 'below', 'thu', 'tot', 'ring', 'pin', 'tin', 'evbox', 'load', 'spin', 'count', 'cl', 'ed', 'b1', 'sp', 'cb-main', 'cb-all', 'cb-0', 'cb-1', 'cb-2']) this[k] = q(k);
    this.pmi = [...kit.stage.querySelectorAll('.at-pm-i')];
    this.tmi = [...kit.stage.querySelectorAll('.at-tm-i')];
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 885, cy: 540, z: 1.12, hold: 0.4 },
      { t: 1.2, cx: 1200, cy: 360, z: 2.0, hold: 0.2 },
      { t: 2.0, cx: 960, cy: 470, z: 1.5, hold: 2.4 },
      { t: 5.3, cx: 960, cy: 570, z: 1.5, hold: 4.4, drift: [0, 0, 0.004] },
      { t: 10.8, cx: 960, cy: 500, z: 1.34, hold: 2.3 },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1500, 900] }, { t: 1.05, at: [1618, 118] }, { t: 1.3, at: [1618, 118] },
      { t: 1.95, at: D(300, 106) }, { t: 2.05, at: D(300, 106) }, { t: 2.35, at: D(300, 147) }, { t: 2.6, at: D(300, 147) },
      { t: 3.1, at: D(300, 176) }, { t: 3.25, at: D(300, 176) }, { t: 3.6, at: D(300, 245) }, { t: 3.8, at: D(300, 245) },
      { t: 4.4, at: D(31, 286) }, { t: 4.6, at: D(31, 286) },
      { t: 5.7, at: D(42, 367) }, { t: 5.9, at: D(42, 367) },
      { t: 6.7, at: D(42, 423) }, { t: 6.95, at: D(42, 423) },
      { t: 7.5, at: D(500, 420) }, { t: 9.0, at: D(500, 430) },
      { t: 9.5, at: D(374, 693.5) }, { t: 9.75, at: D(374, 693.5) },
      { t: 10.6, at: [1480, 700] }, { t: 13.1, at: [1480, 700] },
    ];
    this.cur.clicks = [1.2, 2.0, 2.55, 3.2, 3.75, 4.5, 5.8, 6.85, 9.6];
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const open = eo(seg(t, T.open, T.open + 0.15)) * (1 - ei(seg(t, T.shut, T.shut + 0.15)));
    this.ov.style.opacity = open;
    this.dlg.style.opacity = open;
    this.dlg.style.visibility = open > 0 ? 'visible' : 'hidden';
    this.dlg.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, T.open, T.open + 0.15))) + ')';
    const [cx, cy] = this.cur.position(t);
    const hov = (items, top, show) => items.forEach((el, i) => {
      const y0 = 90 + DY + top + 6 + i * 28.1;
      const over = show && cx > 240 + DX + 30 && cx < 240 + DX + 482 && cy > y0 && cy < y0 + 28.1;
      el.style.background = over ? 'var(--color-surface-gray-3)' : 'transparent';
    });
    const pmOn = t >= T.pmOpen && t < T.pmPick, tmOn = t >= T.tmOpen && t < T.tmPick;
    this.pm.style.visibility = pmOn ? 'visible' : 'hidden';
    this.tm.style.visibility = tmOn ? 'visible' : 'hidden';
    hov(this.pmi, 126, pmOn); hov(this.tmi, 196, tmOn);
    const pSel = t >= T.pmPick, tSel = t >= T.tmPick;
    this.pv.textContent = pSel ? PROJECTS[0] : 'Select project';
    this.pv.style.color = pSel ? 'var(--color-ink-gray-7)' : 'var(--color-ink-gray-4)';
    this.pic.style.display = pSel ? 'flex' : 'none';
    this.pin.style.boxShadow = pmOn ? '0 0 0 1px var(--color-outline-gray-5)' : 'none';
    this.tv.textContent = tSel ? TASKS[1] : 'Select task';
    this.tv.style.color = tSel ? 'var(--color-ink-gray-7)' : 'var(--color-ink-gray-4)';
    this.tic.style.display = tSel ? 'flex' : 'none';
    this.tin.style.boxShadow = tmOn ? '0 0 0 1px var(--color-outline-gray-5)' : 'none';
    const setCb = (el, on) => { el.style.background = on ? 'var(--color-surface-gray-7)' : 'var(--color-surface-white)'; el.style.borderColor = on ? 'var(--color-surface-gray-7)' : 'var(--color-outline-gray-4)'; el.firstChild.style.display = on ? 'block' : 'none'; };
    setCb(this['cb-main'], t >= T.tick);
    const loading = t >= T.tick && t < T.load, listed = t >= T.load;
    this.load.style.visibility = loading ? 'visible' : 'hidden';
    this.spin.innerHTML = loading ? spin(t) : '';
    this.evbox.style.visibility = listed ? 'visible' : 'hidden';
    const on = [t >= T.p1, t >= T.p2, false];
    EVENTS.forEach((e, i) => setCb(this['cb-' + i], on[i]));
    setCb(this['cb-all'], false);
    const n = on.filter(Boolean).length;
    this.count.textContent = n + ' of 3';
    const mins = EVENTS.reduce((s, e, i) => s + (on[i] ? e.mins : 0), 0);
    // 2h 30m was left on Thursday before the picks.
    this.dfill.style.width = (mins / 480 * 100) + '%';
    this.dfill.style.visibility = mins > 0 ? 'visible' : 'hidden';
    this.dv.textContent = String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
    this.left.textContent = fmtLeft(150 - mins);
    let li = '';
    let k = 0;
    PICKS.forEach((i) => { if (on[i]) { li += '<div class="pms-abs" style="left:11px;top:' + (8 + 29 * k) + 'px;width:424px;height:21px;white-space:nowrap"><span style="position:absolute;left:8px;top:8px;width:5px;height:5px;border-radius:50%;background:var(--color-surface-gray-4)"></span><span style="position:absolute;left:37px;top:0">' + EVENTS[i].name + ' | ' + EVENTS[i].len + '</span></div>'; k++; } });
    if (this.ed.__li !== li) { this.ed.innerHTML = li; this.ed.__li = li; }
    const dy = t < T.tick ? 0 : t < T.load ? 66.1 : 227.1;
    this.cl.style.top = (310 + dy) + 'px';
    this.ed.style.top = (332 + dy) + 'px';
    this.b1.style.top = (452 + dy) + 'px';
    this.save.style.top = (452 + dy) + 'px';
    this.dlg.style.height = (504.5 + dy) + 'px';
    const saving = t >= T.save && t < T.shut;
    this.sp.style.display = saving ? 'flex' : 'none';
    this.sp.innerHTML = saving ? '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="transform:rotate(' + ((t * 540) % 360).toFixed(1) + 'deg)"><circle cx="8" cy="8" r="6" stroke="var(--color-ink-gray-5)" stroke-width="2"/><path d="M8 2a6 6 0 0 1 6 6" stroke="var(--color-ink-white)" stroke-width="2" stroke-linecap="round"/></svg>' : '';
    const press = (a) => 1 - 0.04 * seg(t, a - 0.05, a) * (1 - seg(t, a, a + 0.12));
    this.add.style.transform = 'scale(' + press(1.2) + ')';
    this.save.style.transform = 'scale(' + press(T.save) + ')';
    const kk = eio(seg(t, T.ins, T.ins + 0.35));
    this.ins.style.height = 88 * kk + 'px';
    this.below.style.transform = 'translateY(' + 88 * kk + 'px)';
    const done = t >= T.ins + 0.1;
    this.thu.textContent = done ? '07:00' : '05:30';
    this.tot.textContent = done ? '31:00' : '29:30';
    let r = null;
    for (const g of RINGS) if (t >= g[0] && t < g[1]) r = g;
    if (r) {
      const s = this.ring.style;
      s.left = r[2] + 'px'; s.top = r[3] + 'px'; s.width = r[4] + 'px'; s.height = r[5] + 'px'; s.borderRadius = (r[6] || 11) + 'px';
      s.opacity = Math.min(eo(seg(t, r[0], r[0] + 0.25)), 1 - seg(t, r[1] - 0.15, r[1]));
    } else this.ring.style.opacity = 0;
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
