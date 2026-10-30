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
const DATES = ['Oct 12', 'Oct 13', 'Oct 14', 'Oct 15', 'Oct 16', 'Oct 17', 'Oct 18'];
const NOTE = 'Fixed Wednesday hours';
const MANAGER = 'Christina Chang';
const CHEV = '<path d="M11.3848 5.6582C11.5735 5.45686 11.8903 5.44622 12.0918 5.63477C12.2931 5.82353 12.3038 6.14033 12.1152 6.3418L8.36523 10.3418C8.27071 10.4426 8.1382 10.5 8 10.5C7.8618 10.5 7.72929 10.4426 7.63477 10.3418L3.88477 6.3418C3.69622 6.14033 3.70686 5.82353 3.9082 5.63477C4.10967 5.44622 4.42647 5.45686 4.61523 5.6582L8 9.26855L11.3848 5.6582Z" fill="currentColor"/>';
const XCIRC = '<svg width="16" height="16" viewBox="0 0 16 16" style="display:block"><path fill="currentColor" fill-rule="evenodd" d="M8 14.25C11.4518 14.25 14.25 11.4518 14.25 8C14.25 4.54822 11.4518 1.75 8 1.75C4.54822 1.75 1.75 4.54822 1.75 8C1.75 11.4518 4.54822 14.25 8 14.25ZM8 15.25C12.0041 15.25 15.25 12.0041 15.25 8C15.25 3.99594 12.0041 0.75 8 0.75C3.99594 0.75 0.75 3.99594 0.75 8C0.75 12.0041 3.99594 15.25 8 15.25ZM10.8536 5.14645C11.0488 5.34171 11.0488 5.65829 10.8536 5.85355L8.70711 8L10.8536 10.1464C11.0488 10.3417 11.0488 10.6583 10.8536 10.8536C10.6583 11.0488 10.3417 11.0488 10.1464 10.8536L8 8.70711L5.85355 10.8536C5.65829 11.0488 5.34171 11.0488 5.14645 10.8536C4.95118 10.6583 4.95118 10.3417 5.14645 10.1464L7.29289 8L5.14645 5.85355C4.95118 5.65829 4.95118 5.34171 5.14645 5.14645C5.34171 4.95118 5.65829 4.95118 5.85355 5.14645L8 7.29289L10.1464 5.14645C10.3417 4.95118 10.6583 4.95118 10.8536 5.14645Z"/></svg>';
const HOURG = '<svg width="16" height="16" viewBox="0 0 16 16" style="display:block"><path fill="currentColor" d="M13.0005 1C13.258 1.00026 13.4673 1.20923 13.4673 1.4668C13.4673 1.72437 13.258 1.93333 13.0005 1.93359H12.2974V4.39551C12.2972 5.69902 11.5809 6.71234 10.9214 7.37207C10.666 7.62748 10.4107 7.83766 10.1938 8C10.4107 8.16234 10.666 8.37252 10.9214 8.62793C11.5809 9.28764 12.2972 10.301 12.2974 11.6045V14.0664H13.0005C13.258 14.0667 13.4673 14.2756 13.4673 14.5332C13.4673 14.7908 13.258 14.9997 13.0005 15H3.00049C2.74276 15 2.53369 14.7909 2.53369 14.5332C2.53369 14.2755 2.74276 14.0664 3.00049 14.0664H3.70361V11.6045C3.70378 10.3008 4.41998 9.28763 5.07959 8.62793C5.33488 8.37262 5.58936 8.1623 5.80615 8C5.58942 7.83774 5.33479 7.62728 5.07959 7.37207C4.42 6.71235 3.70373 5.69921 3.70361 4.39551V1.93359H3.00049C2.74276 1.93359 2.53369 1.72453 2.53369 1.4668C2.53369 1.20906 2.74276 1 3.00049 1H13.0005ZM4.63721 1.93359V4.39551C4.63733 5.34406 5.16042 6.13348 5.73975 6.71289C6.02514 6.99824 6.31206 7.22066 6.52783 7.37109C6.63526 7.44597 6.72504 7.50206 6.78564 7.53906C6.81572 7.55742 6.83919 7.57155 6.854 7.58008C6.86109 7.58415 6.86659 7.58716 6.86963 7.58887L6.87256 7.59082L7.62256 8L6.87256 8.41016L6.87158 8.40918C6.87109 8.40945 6.87051 8.41054 6.86963 8.41113C6.86659 8.41284 6.86112 8.41583 6.854 8.41992C6.83919 8.42845 6.81572 8.44258 6.78564 8.46094C6.72502 8.49795 6.63531 8.55496 6.52783 8.62988C6.31198 8.78039 6.02514 9.00267 5.73975 9.28809C5.16046 9.86746 4.63738 10.656 4.63721 11.6045V14.0664H11.3638V11.6045C11.3636 10.6562 10.8404 9.86742 10.2612 9.28809C9.97574 9.00256 9.68806 8.78042 9.47217 8.62988C9.36479 8.55503 9.27598 8.49798 9.21533 8.46094C9.18526 8.44257 9.16187 8.42851 9.14697 8.41992C9.14001 8.41591 9.13451 8.4129 9.13135 8.41113L9.12939 8.40918L8.37744 8L9.12842 7.59082L9.13135 7.58887C9.13453 7.58709 9.13995 7.58412 9.14697 7.58008C9.16187 7.57149 9.18518 7.55747 9.21533 7.53906C9.27593 7.50206 9.36491 7.44586 9.47217 7.37109C9.68805 7.22058 9.97571 6.99843 10.2612 6.71289C10.8405 6.13349 11.3636 5.344 11.3638 4.39551V1.93359H4.63721Z"/></svg>';
const XMARK = '<svg width="16" height="16" viewBox="0 0 16 16" style="display:block"><path fill="currentColor" d="M12.1494 3.14648C12.3446 2.95126 12.6612 2.95135 12.8564 3.14648C13.0517 3.34175 13.0517 3.65825 12.8564 3.85352L8.70898 8.00098L12.8574 12.1494C13.0526 12.3446 13.0526 12.6612 12.8574 12.8564C12.6622 13.0516 12.3456 13.0517 12.1504 12.8564L8.00195 8.70801L3.85352 12.8564C3.65825 13.0517 3.34175 13.0517 3.14648 12.8564C2.95135 12.6612 2.95126 12.3446 3.14648 12.1494L7.29492 8.00098L3.14746 3.85352C2.95228 3.65827 2.95228 3.34173 3.14746 3.14648C3.34271 2.95137 3.65927 2.95132 3.85449 3.14648L8.00195 7.29395L12.1494 3.14648Z"/></svg>';
const cell = (x, txt, cls, sty) => '<div class="pms-cell ' + (cls || '') + '" style="left:' + (x - 268) + 'px;' + (sty || '') + '">' + txt + '</div>';
const bar = (x, y, w, h) => '<div class="pms-bar" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + (h || 10) + 'px"></div>';
const gh = (x, y, w, h, r) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;background:var(--color-surface-gray-3)"></div>';
const PLUS = '<path d="M7.99805 2.75C8.27402 2.7502 8.49805 2.97398 8.49805 3.25V7.49805H12.7451C13.0213 7.49805 13.2451 7.7219 13.2451 7.99805C13.2449 8.27402 13.0211 8.49805 12.7451 8.49805H8.49805V12.7451C8.49805 13.0211 8.27402 13.2449 7.99805 13.2451C7.7219 13.2451 7.49805 13.0213 7.49805 12.7451V8.49805H3.25C2.97398 8.49805 2.7502 8.27402 2.75 7.99805C2.75 7.7219 2.97386 7.49805 3.25 7.49805H7.49805V3.25C7.49805 2.97386 7.7219 2.75 7.99805 2.75Z" fill="currentColor"/>';
const TASKIC = '<g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M8 1.333V4m2.8 1.2 1.933-1.933M12 8h2.667M10.8 10.8l1.933 1.933M8 12v2.667m-4.733-1.934L5.2 10.8M1.333 8H4m-.733-4.733L5.2 5.2"/></g>';
const CLOCK = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--color-ink-gray-4)" stroke-width="1" stroke-linecap="round" style="flex:none;display:block"><circle cx="8" cy="8" r="6.25"/><path d="M8 4.5V8l2.2 1.4"/></svg>';
const i16 = (inner) => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none">' + inner + '</svg>';
const RED = 'var(--color-ink-red-4)', GREEN = 'var(--color-ink-green-4)', AMBER = 'var(--color-ink-amber-4)';
const TASK = 'Design system component refinements';
const OLDC = 'Component refinements', NEWC = 'Full day on component fixes', REASON = 'Only 6 hours logged for Wednesday';
// D shifts part 2 (submit the week) to follow part 1 (fix the hours).
const D = 10.7;
const P = { hover: 1.9, rc: 1.6, open: 2.3, rA: 2.8, rAe: 4.4, rAdd: 4.8, cAdd: 5.3, rBar: 5.9, cBar: 6.4, dragA: 6.5, dragB: 7.0,
  rCom: 7.4, cCom: 7.9, type: 8.05, rSave: 9.4, cSave: 9.9, saved: 10.0, toast: 10.2, upd: 10.3, cOut: 11.0 };
const S = { r1: 2.2 + D - 0.3, c1: 2.3 + D, open: 2.3 + D, rN: 3.0 + D, cN: 3.5 + D, type: 3.65 + D, rS: 5.3 + D, cS: 5.8 + D, close: 6.1 + D, toast: 6.3 + D, done: 6.9 + D, r2: 7.6 + D, end: 9.8 + D };
const RINGS = [
  [P.rc, P.open + 0.1, 1013, 275, 66, 38],
  [P.rA, P.rAe, 806, 393, 266, 62],
  [P.rAdd, P.cAdd, 806, 462, 109, 38],
  [P.rBar, P.cBar, 806, 378, 266, 38],
  [P.rCom, P.cCom, 806, 414, 266, 106],
  [P.rSave, P.cSave, 806, 518, 120, 38],
];
const badge = (x, y, txt, icon, w) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:20px;border-radius:9999px;background:var(--color-surface-gray-2);box-sizing:border-box;padding:0 6px;display:flex;align-items:center;justify-content:space-between;font-size:12px;line-height:14px;color:var(--color-ink-gray-8);font-variant-numeric:tabular-nums"><span>' + txt + '</span>' + icon + '</div>';
const rule = (y) => '<div class="pms-abs" style="left:8px;top:' + y + 'px;width:256px;height:1px;background:var(--color-outline-gray-1)"></div>';
const note = (y, txt) => '<div class="pms-abs" style="left:8px;top:' + y + 'px;width:256px;font-size:14px;line-height:21px;color:var(--color-ink-gray-7);white-space:nowrap">' + txt + '</div>';
const oneLine = (y, bg, txt) => bg + '<div class="pms-abs" style="left:95px;top:' + (y + 3) + 'px;width:169px;font-size:13px;line-height:15px;color:var(--color-ink-gray-6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + txt + '</div>';
const addBtn = (y) => '<div class="pms-abs" style="left:8px;top:' + y + 'px;width:99px;height:28px;box-sizing:border-box;padding:0 8px;display:flex;align-items:center;gap:6px;font-size:14px;color:var(--color-ink-gray-7)">' + i16(PLUS) + 'Add time</div>';
const XB = badge(8, 8, '06:00', '<span style="display:flex;color:var(--color-ink-red-4)">' + XCIRC.replace('width="16" height="16"', 'width="14" height="14"') + '</span>', 71);
kit.scene('resubmit-rejected-week', {
  init(kit) {
    const side = SHELL('personal');
    let head = '<div class="pms-row" style="top:100px;height:40px">' + bar(32, 16, 130, 8);
    COLS.forEach((x) => { head += bar(x - 256, 16, 32, 8); });
    head += bar(1110, 16, 40, 8) + '</div>';
    let week = '<div class="pms-row" style="top:140px">' + gh(33, 14, 14, 14, 4) +
      '<div class="pms-abs" style="left:56px;top:12px;height:20px;display:flex;align-items:center;gap:8px;white-space:nowrap">' +
      '<span style="font-size:14px;font-weight:500;line-height:16px;color:var(--color-ink-gray-5)">Oct 12 - 18, 2026</span>' +
      '<span style="position:relative;display:block;height:20px;width:max-content"><span class="rs-b1" style="display:block;height:20px;padding:0 6px;border-radius:9999px;background:var(--color-surface-red-2);color:var(--color-ink-red-4);font-size:12px;font-weight:420;line-height:20px;white-space:nowrap">Partially rejected</span>' +
      '<span class="rs-b2" style="position:absolute;left:0;top:0;display:block;height:20px;padding:0 6px;border-radius:9999px;background:var(--color-surface-amber-2);color:var(--color-ink-amber-4);font-size:12px;font-weight:420;line-height:20px;opacity:0;white-space:nowrap">Approval pending</span></span></div>';
    DATES.forEach((d, i) => { week += cell(COLS[i], d); });
    week += cell(1366, 'Total') +
      '<div class="pms-abs rs-st" style="left:1156px;top:8px;width:28px;height:28px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-red-4)">' + XCIRC + '</div>' +
      '<div class="pms-abs rs-st2" style="left:1156px;top:8px;width:28px;height:28px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-amber-4);opacity:0">' + HOURG + '</div></div>';
    // Wed (index 2) is the rejected day.
    const vals = (c, bold, rej) => {
      let r = '';
      COLS.forEach((x, i) => {
        if (i === 2) r += cell(x, rej ? '06:00' : '-', 'rs-wed' + c, rej ? 'color:' + RED : 'color:var(--color-ink-gray-4)');
        else if (i < 5) r += cell(x, '08:00', '', 'color:' + (c === 't' ? AMBER : 'var(--color-ink-gray-8)') + (bold ? ';font-weight:500' : ''));
        else r += cell(x, '-', '', 'color:var(--color-ink-gray-4)');
      });
      return r + cell(1366, '32:00', 'rs-tot' + c, 'color:' + RED + ';font-weight:500');
    };
    const all = '<div class="pms-row" style="top:184px">' + bar(48, 17, 120) + vals('a', true, false) + '</div>';
    const proj = '<div class="pms-row" style="top:228px"><div class="pms-abs" style="left:26px;top:14px;display:flex;gap:6px;color:var(--color-ink-gray-3)">' + i16(CHEV) + '</div>' + bar(70, 17, 150) + vals('p', false, false) + '</div>';
    const task = '<div class="pms-row" style="top:272px"><div class="pms-abs" style="left:70px;top:12px;display:flex;align-items:center;gap:6px;color:var(--color-ink-gray-4)">' + i16(TASKIC) + '<span>' + TASK + '</span></div><div class="pms-abs rs-hbg" style="left:778px;top:8px;width:56px;height:28px;border-radius:8px;background:var(--color-surface-gray-2);opacity:0"></div>' + vals('t', false, true) +
      '</div>';
    let skel = '';
    for (let i = 0; i < 12; i++) {
      let r = '<div class="pms-row" style="top:' + (316 + i * 44) + 'px">' + bar(i % 3 ? 48 : 32, 17, i % 3 ? 160 + (i * 53) % 120 : 110);
      COLS.forEach((x) => { r += bar(x - 256, 18, 32, 8); });
      skel += r + bar(1110, 18, 40, 8) + '</div>';
    }
    // Inline popover, three states.
    const barBox = '<div class="pms-abs" style="left:8px;top:66px;width:256px;height:28px;border-radius:8px;background:var(--color-surface-gray-2);overflow:hidden"><div class="pms-abs rs-fill" style="left:0;top:0;height:28px;width:0;background:var(--color-surface-gray-4);border-radius:8px"><span class="pms-abs" style="right:6px;top:8px;width:2px;height:12px;border-radius:2px;background:rgba(23,23,23,.12)"></span></div>' +
      '<span class="pms-abs" style="left:10px;top:6px;font-size:13px">Duration</span><span class="pms-abs rs-dv" style="right:10px;top:6px;font-size:13px;font-variant-numeric:tabular-nums">00:00</span></div>';
    const stA = '<div class="pms-abs rs-sA" style="left:0;top:0;width:270px;height:184px">' + XB + note(36 + 8 - 8 + 0, '<span style="display:block;padding-top:8px">' + OLDC + '</span>') +
      '<div class="pms-abs" style="left:8px;top:81px;width:256px;height:52px;box-sizing:border-box;border:1px solid var(--color-outline-red-1);border-radius:8px;background:var(--color-surface-red-1);padding:8px">' +
      '<div style="font-size:12px;font-weight:700;line-height:14px;color:var(--color-ink-red-4)">Rejection reason</div><div style="margin-top:2px;font-size:12px;line-height:14px;color:var(--color-ink-red-3);white-space:nowrap">' + REASON + '</div></div>' +
      rule(141) + addBtn(150) + '</div>';
    const stB = '<div class="pms-abs rs-sB" style="left:0;top:0;width:270px;height:184px;visibility:hidden">' + oneLine(8, XB, OLDC) + rule(36) +
      '<div class="pms-abs" style="left:8px;top:45px;display:flex;gap:3px;font-size:13px;line-height:15px;color:var(--color-ink-gray-5)">Add time<span style="color:var(--color-ink-red-3)">*</span></div>' +
      '<div class="pms-abs rs-left" style="right:8px;top:45px;font-size:13px;line-height:15px;color:var(--color-ink-gray-5)">8h left</div>' + barBox +
      '<div class="pms-abs" style="left:8px;top:102px;width:256px;height:96px;border:1px solid var(--color-outline-gray-2);border-radius:10px;box-sizing:border-box;padding:8px 10px;font-size:14px"><span class="rs-ph" style="color:var(--color-ink-gray-4)">Comment</span><span class="rs-cv"></span><span class="rs-caret" style="display:inline-block;width:2px;height:17px;background:var(--color-ink-gray-8);margin-left:1px;vertical-align:-3px"></span><span class="pms-abs rs-hint" style="right:8px;bottom:6px;font-size:12px;color:var(--color-ink-gray-4)">⌘+↵</span></div>' +
      '<div class="pms-btn pms-btn-soft rs-save" style="left:8px;top:206px;width:110px;gap:8px;color:var(--color-ink-gray-4)">' + i16(PLUS) + 'Save entry</div></div>';
    const NB = badge(8, 45, '08:00', CLOCK, 71);
    const stC = '<div class="pms-abs rs-sC" style="left:0;top:0;width:270px;height:184px;visibility:hidden">' + oneLine(8, XB, OLDC) + rule(36) + NB +
      '<div class="pms-abs" style="left:8px;top:73px;width:256px;font-size:14px;line-height:21px;color:var(--color-ink-gray-7);padding-top:8px;white-space:nowrap">' + NEWC + '</div>' + rule(118) + addBtn(127) + '</div>';
    const pop = '<div class="pms-pop rs-pop" style="left:802px;top:316px;height:186px;opacity:0;visibility:hidden">' + stA + stB + stC + '</div>';
    const G = (x, y, w, h, extra) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;' + extra + '"></div>';
    const dlg = '<div class="pms-abs rs-ov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;visibility:hidden"></div>' +
      '<div class="pms-abs rs-dlg" style="left:464px;top:120px;width:512px;height:364.6px;background:var(--color-surface-modal);border-radius:16px;visibility:hidden;box-shadow:0 0 1px rgba(0,0,0,.19),0 1px 2px rgba(0,0,0,.07),0 6px 15px -5px rgba(0,0,0,.11)">' +
      '<div class="pms-abs" style="left:24px;top:22px;font-size:20px;font-weight:600;line-height:24px;letter-spacing:.2px;color:var(--color-ink-gray-8);white-space:nowrap">Submit for approval</div>' +
      '<div class="pms-abs" style="left:456px;top:20px;width:32px;height:28px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-8)">' + XMARK + '</div>' +
      G(24, 68, 464, 36.1, 'border-radius:10px;background:var(--color-surface-gray-1)') +
      '<div class="pms-abs" style="left:40px;top:78px;font-size:14px;line-height:16px;color:var(--color-ink-gray-7);white-space:nowrap">Week of Oct 12 - Oct 18</div>' +
      '<div class="pms-abs" style="right:40px;top:78px;font-size:14px;font-weight:500;line-height:16px;color:var(--color-ink-green-4);font-variant-numeric:tabular-nums">40:00</div>' +
      '<div class="pms-abs" style="left:24px;top:120px;font-size:14px;line-height:16px;color:var(--color-ink-gray-5)">Note</div>' +
      '<div class="pms-abs rs-ta" style="left:24px;top:142.2px;width:464px;height:62.3px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;background:var(--color-surface-white);padding:6px 8px;font-size:14px;line-height:16px;color:var(--color-ink-gray-7);white-space:nowrap">' +
      '<span class="rs-ph2" style="color:var(--color-ink-gray-4)">Comment</span><span class="rs-tv"></span><span class="rs-caret2" style="display:inline-block;width:1.5px;height:16px;background:var(--color-ink-gray-7);vertical-align:-3px;opacity:0"></span>' +
      '<svg style="position:absolute;right:2px;bottom:2px;width:8px;height:8px" viewBox="0 0 8 8"><path d="M7 2L2 7M7 5L5 7" stroke="var(--color-ink-gray-4)" stroke-width="1" stroke-linecap="round"/></svg></div>' +
      '<div class="pms-abs" style="left:24px;top:220.5px;display:flex;gap:2px;font-size:14px;line-height:16px;color:var(--color-ink-gray-5)">Send to<span style="color:var(--color-ink-red-3)">*</span></div>' +
      '<div class="pms-abs" style="left:24px;top:242.6px;width:464px;height:32px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;background:var(--color-surface-white)">' +
      '<div class="pms-abs" style="left:7px;top:7px;width:16px;height:16px;border-radius:50%;background:var(--color-surface-gray-2);color:var(--color-ink-gray-5);font-size:11px;font-weight:500;line-height:16px;text-align:center">C</div>' +
      '<div class="pms-abs" style="left:31px;top:7px;font-size:14px;line-height:16px;color:var(--color-ink-gray-7);white-space:nowrap">' + MANAGER + '</div>' +
      '<svg class="pms-abs" style="left:439px;top:7px;color:var(--color-ink-gray-4)" width="16" height="16" viewBox="0 0 16 16" fill="none">' + CHEV + '</svg></div>' +
      '<div class="pms-abs rs-sb" style="left:24px;top:312.6px;width:464px;height:28px;border-radius:8px;background:var(--color-surface-gray-7);color:var(--color-ink-white);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:450">Submit</div>' +
      '<div class="pms-ring rs-rN" style="left:19px;top:137.2px;width:474px;height:72.3px;border-radius:11px;opacity:0"></div>' +
      '<div class="pms-ring rs-rS" style="left:19px;top:307.6px;width:474px;height:38px;border-radius:11px;opacity:0"></div></div>';
    const toastBox = (cls, txt) => '<div class="pms-abs ' + cls + '" style="right:20px;top:840px;height:40px;box-sizing:border-box;padding:6px 16px;background:var(--color-surface-gray-6);border-radius:10px;box-shadow:0 0 1px rgba(0,0,0,.35),0 6px 8px -4px rgba(0,0,0,.1);display:flex;align-items:center;gap:12px;visibility:hidden">' +
      '<div style="display:flex;align-items:center;gap:8px;flex:1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-surface-green-5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;display:block"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>' +
      '<span style="font-size:13px;line-height:19.5px;font-weight:420;color:var(--color-ink-white);white-space:nowrap">' + txt + '</span></div>' +
      '<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-white)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam rs-cam"><div class="pms-win">' + side + head + week + all + proj + task +
      '<div class="pms-abs" style="left:0;right:0;top:0;height:900px">' + skel + '</div>' + pop + dlg + toastBox('rs-toast1', 'Time Entry submitted successfully') + toastBox('rs-toast', 'Timesheet submitted for approval successfully') +
      '<div class="pms-ring rs-r1" style="left:1391px;top:143px;width:38px;height:38px;border-radius:7px;opacity:0"></div>' +
      '<div class="pms-ring rs-ring" style="opacity:0"></div>' +
      '<div class="pms-ring rs-r2" style="border-radius:9999px;opacity:0"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.rs-' + c);
    for (const k of ['cam', 'ov', 'dlg', 'ta', 'ph2', 'tv', 'caret2', 'sb', 'st', 'st2', 'b1', 'b2', 'toast', 'toast1', 'r1', 'r2', 'rN', 'rS', 'pop', 'sA', 'sB', 'sC', 'fill', 'dv', 'left', 'ph', 'cv', 'caret', 'hint', 'save', 'hbg', 'ring']) this[k] = q(k);
    this.weds = ['weda', 'wedp', 'wedt'].map(q);
    this.tots = ['tota', 'totp', 'tott'].map(q);
    // Result ring around the "Approval pending" badge, measured from the laid-out badge.
    const wr = kit.stage.querySelector('.pms-win').getBoundingClientRect(), k = wr.width / 1440, br = this.b2.getBoundingClientRect();
    const b = k > 0 && br.width > 0 ? { x: (br.left - wr.left) / k, y: (br.top - wr.top) / k, w: br.width / k, h: br.height / k } : { x: 400, y: 152, w: 106, h: 20 };
    Object.assign(this.r2.style, { left: (b.x - 5) + 'px', top: (b.y - 5) + 'px', width: (b.w + 10) + 'px', height: (b.h + 10) + 'px' });
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.12, hold: 0.6, drift: [2, 0, 0.004] },
      { t: 1.6, cx: 1210, cy: 490, z: 2.1, hold: 8.4, drift: [0, 0, 0.003] },
      { t: 10.8, cx: 960, cy: 587, z: 1.34, hold: 1.1 },
      { t: 12.6, cx: 1200, cy: 360, z: 2.0, hold: 0.5 },
      { t: 3.1 + D, cx: 960, cy: 395, z: 1.85, hold: 3.0, drift: [0, 0, 0.004] },
      { t: 6.6 + D, cx: 960, cy: 540, z: 1.12, hold: 0.7 },
      { t: 7.5 + D, cx: 960, cy: 500, z: 1.34 },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1500, 900] }, { t: 0.8, at: [1500, 900] }, { t: P.hover, at: [1286, 384] }, { t: 4.2, at: [1286, 384] },
      { t: 4.9, at: [1100, 570] }, { t: 5.6, at: [1100, 570] }, { t: 6.2, at: [1210, 486] }, { t: P.dragA, at: [1210, 486] }, { t: P.dragB, at: [1306, 486] },
      { t: 7.2, at: [1306, 486] }, { t: 7.7, at: [1140, 560] }, { t: 9.0, at: [1140, 560] }, { t: 9.6, at: [1105, 626] }, { t: 10.3, at: [1105, 626] },
      { t: 10.9, at: [1370, 710] }, { t: 11.6, at: [1370, 710] }, { t: 12.5, at: [1650, 252] }, { t: 13.2, at: [1650, 252] },
      { t: 3.4 + D, at: [1000, 384] }, { t: 5.05 + D, at: [1000, 384] }, { t: 5.75 + D, at: [1000, 538] }, { t: 6.2 + D, at: [1000, 538] },
      { t: 6.9 + D, at: [1330, 700] }, { t: S.end, at: [1336, 704] },
    ];
    this.cur.clicks = [P.cAdd, P.cBar, P.cCom, P.cSave, P.cOut, S.c1, S.cN, S.cS];
    this.cur.holds = [[P.cBar + 0.05, P.dragB + 0.05]];
    this.com = kit.typist(NEWC, P.type, 18);
    this.typ = kit.typist(NOTE, S.type, 18);
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const mix = (a, b, p) => 'color-mix(in srgb, var(--color-' + a + '), var(--color-' + b + ') ' + p * 100 + '%)';
    const press = (a) => 1 - 0.04 * seg(t, a - 0.05, a) * (1 - seg(t, a, a + 0.12));
    const fade = (a, b) => eo(seg(t, a, a + 0.25)) * (1 - ei(seg(t, b, b + 0.15)));
    const pin = eo(seg(t, P.open, P.open + 0.25)) * (1 - ei(seg(t, P.cOut, P.cOut + 0.18)));
    this.pop.style.opacity = pin; this.pop.style.visibility = pin > 0 ? 'visible' : 'hidden';
    this.pop.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, P.open, P.open + 0.25))) + ')';
    const stg = t < P.cAdd ? 0 : t < P.saved ? 1 : 2;
    this.sA.style.visibility = stg === 0 ? 'visible' : 'hidden';
    this.sB.style.visibility = stg === 1 ? 'visible' : 'hidden';
    this.sC.style.visibility = stg === 2 ? 'visible' : 'hidden';
    this.pop.style.height = [186, 242, 163][stg] + 'px';
    // The click sets 05:00, the drag fills it to 08:00.
    const hrs = t < P.cBar ? 0 : Math.round(lerp(5, 8, eio(seg(t, P.dragA, P.dragB))) * 4) / 4;
    const mins = Math.round(hrs * 60);
    this.fill.style.width = (hrs / 8 * 100) + '%';
    this.fill.style.display = hrs > 0 ? 'block' : 'none';
    this.dv.textContent = String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
    const lf = 480 - mins;
    this.left.textContent = Math.floor(lf / 60) + 'h' + (lf % 60 ? ' ' + (lf % 60) + 'm' : '') + ' left';
    const typed = this.com.at(t);
    this.cv.textContent = typed;
    this.ph.style.display = typed ? 'none' : 'inline';
    this.hint.style.opacity = typed ? 0 : 1;
    const typing = t > P.type && t < this.com.end;
    this.caret.style.opacity = t > P.cCom && t < P.saved && (typing || t < P.type || Math.floor(t / 0.53) % 2 === 0) ? 1 : 0;
    this.save.style.color = hrs > 0 ? 'var(--color-ink-gray-8)' : 'var(--color-ink-gray-4)';
    this.save.style.transform = 'scale(' + press(P.cSave) + ')';
    const hov = eio(seg(t, P.hover, P.hover + 0.15)) * (1 - eio(seg(t, 4.2, 4.35)));
    this.hbg.style.opacity = hov;
    const upd = t >= P.upd;
    this.weds.forEach((el, i) => {
      el.textContent = upd ? '08:00' : i === 2 ? '06:00' : '-';
      el.style.color = upd ? (i === 2 && t >= S.done ? AMBER : 'var(--color-ink-gray-8)') : i === 2 ? RED : 'var(--color-ink-gray-4)';
      el.style.fontWeight = upd && i === 0 ? '500' : '400';
    });
    // In the app a project row's total is always green and a task row's always gray.
    this.tots.forEach((el, i) => { el.textContent = upd ? '40:00' : '32:00'; el.style.color = [upd ? GREEN : RED, GREEN, 'var(--color-ink-gray-6)'][i]; });
    const tk1 = seg(t, P.toast, P.toast + 0.4), te1 = 1 - Math.pow(1 - tk1, 3);
    const to1 = t < P.toast + 3.2 ? 1 : 1 - seg(t, P.toast + 3.2, P.toast + 3.45);
    this.toast1.style.visibility = t >= P.toast && to1 > 0 ? 'visible' : 'hidden';
    this.toast1.style.opacity = te1 * to1;
    this.toast1.style.transform = 'translateY(' + (150 * (1 - te1)).toFixed(1) + '%) scale(' + lerp(0.95, 1, te1).toFixed(4) + ')';
    this.st.style.transform = 'scale(' + press(S.c1) + ')';
    const open = eo(seg(t, S.open, S.open + 0.15)) * (1 - ei(seg(t, S.close, S.close + 0.17)));
    this.ov.style.opacity = open; this.ov.style.visibility = open > 0 ? 'visible' : 'hidden';
    this.dlg.style.opacity = open; this.dlg.style.visibility = open > 0 ? 'visible' : 'hidden';
    this.dlg.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, S.open, S.open + 0.15))) + ')';
    const foc = t >= S.cN && t < S.close + 0.17;
    this.ta.style.outline = foc ? '2px solid var(--color-outline-gray-3)' : 'none';
    const tp = this.typ.at(t);
    this.tv.textContent = tp;
    this.ph2.style.display = tp ? 'none' : 'inline';
    const typ2 = t > S.type && t < this.typ.end;
    this.caret2.style.opacity = foc && t < S.cS && (typ2 || t < S.type || Math.floor((t - S.cN) / 0.53) % 2 === 0) ? 1 : 0;
    this.sb.style.background = mix('surface-gray-7', 'surface-gray-6',eio(seg(t, S.cS - 0.05, S.cS + 0.1)));
    this.sb.style.transform = 'scale(' + press(S.cS) + ')';
    const tk = seg(t, S.toast, S.toast + 0.4), te = 1 - Math.pow(1 - tk, 3);
    this.toast.style.visibility = t >= S.toast ? 'visible' : 'hidden';
    this.toast.style.opacity = te;
    this.toast.style.transform = 'translateY(' + (150 * (1 - te)).toFixed(1) + '%) scale(' + lerp(0.95, 1, te).toFixed(4) + ')';
    const done = t >= S.done;
    this.b1.style.opacity = done ? 0 : 1; this.b2.style.opacity = done ? 1 : 0;
    this.st.style.opacity = done ? 0 : 1; this.st2.style.opacity = done ? 1 : 0;
    let r = null;
    for (const g of RINGS) if (t >= g[0] && t < g[1]) r = g;
    if (r) {
      const s = this.ring.style;
      s.left = r[2] + 'px'; s.top = r[3] + 'px'; s.width = r[4] + 'px'; s.height = r[5] + 'px'; s.borderRadius = '11px';
      s.opacity = Math.min(eo(seg(t, r[0], r[0] + 0.25)), 1 - seg(t, r[1] - 0.15, r[1]));
    } else this.ring.style.opacity = 0;
    this.r1.style.opacity = fade(S.r1, S.c1);
    this.rN.style.opacity = fade(S.rN, S.cN);
    this.rS.style.opacity = fade(S.rS, S.cS);
    this.r2.style.opacity = eo(seg(t, S.r2, S.r2 + 0.25));
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
