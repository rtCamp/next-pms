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
const MANAGER = 'Christina Chang';
const TASK = 'Design system component refinements';
const CHEV = '<path d="M11.3848 5.6582C11.5735 5.45686 11.8903 5.44622 12.0918 5.63477C12.2931 5.82353 12.3038 6.14033 12.1152 6.3418L8.36523 10.3418C8.27071 10.4426 8.1382 10.5 8 10.5C7.8618 10.5 7.72929 10.4426 7.63477 10.3418L3.88477 6.3418C3.69622 6.14033 3.70686 5.82353 3.9082 5.63477C4.10967 5.44622 4.42647 5.45686 4.61523 5.6582L8 9.26855L11.3848 5.6582Z" fill="currentColor"/>';
const SEND = '<svg width="16" height="16" viewBox="0 0 16 16" style="display:block"><path fill="currentColor" d="M13.3783 1.60894C13.9755 1.39366 14.5533 1.97152 14.3381 2.56878L9.96154 14.718C9.72742 15.3678 8.81259 15.3826 8.55768 14.7408L6.46882 9.4755L1.20833 7.39009C0.566378 7.13533 0.581312 6.22184 1.23112 5.98761L13.3783 1.60894ZM2.19096 6.703L6.7326 8.50461L8.95543 6.28454C9.15075 6.08969 9.46744 6.0894 9.66254 6.28454C9.85751 6.47979 9.85688 6.79716 9.66185 6.99234L7.4404 9.21102L9.24339 13.7568L13.2167 2.72898L2.19096 6.703Z"/></svg>';
const HOURG = '<svg width="16" height="16" viewBox="0 0 16 16" style="display:block"><path fill="currentColor" d="M13.0005 1C13.258 1.00026 13.4673 1.20923 13.4673 1.4668C13.4673 1.72437 13.258 1.93333 13.0005 1.93359H12.2974V4.39551C12.2972 5.69902 11.5809 6.71234 10.9214 7.37207C10.666 7.62748 10.4107 7.83766 10.1938 8C10.4107 8.16234 10.666 8.37252 10.9214 8.62793C11.5809 9.28764 12.2972 10.301 12.2974 11.6045V14.0664H13.0005C13.258 14.0667 13.4673 14.2756 13.4673 14.5332C13.4673 14.7908 13.258 14.9997 13.0005 15H3.00049C2.74276 15 2.53369 14.7909 2.53369 14.5332C2.53369 14.2755 2.74276 14.0664 3.00049 14.0664H3.70361V11.6045C3.70378 10.3008 4.41998 9.28763 5.07959 8.62793C5.33488 8.37262 5.58936 8.1623 5.80615 8C5.58942 7.83774 5.33479 7.62728 5.07959 7.37207C4.42 6.71235 3.70373 5.69921 3.70361 4.39551V1.93359H3.00049C2.74276 1.93359 2.53369 1.72453 2.53369 1.4668C2.53369 1.20906 2.74276 1 3.00049 1H13.0005ZM4.63721 1.93359V4.39551C4.63733 5.34406 5.16042 6.13348 5.73975 6.71289C6.02514 6.99824 6.31206 7.22066 6.52783 7.37109C6.63526 7.44597 6.72504 7.50206 6.78564 7.53906C6.81572 7.55742 6.83919 7.57155 6.854 7.58008C6.86109 7.58415 6.86659 7.58716 6.86963 7.58887L6.87256 7.59082L7.62256 8L6.87256 8.41016L6.87158 8.40918C6.87109 8.40945 6.87051 8.41054 6.86963 8.41113C6.86659 8.41284 6.86112 8.41583 6.854 8.41992C6.83919 8.42845 6.81572 8.44258 6.78564 8.46094C6.72502 8.49795 6.63531 8.55496 6.52783 8.62988C6.31198 8.78039 6.02514 9.00267 5.73975 9.28809C5.16046 9.86746 4.63738 10.656 4.63721 11.6045V14.0664H11.3638V11.6045C11.3636 10.6562 10.8404 9.86742 10.2612 9.28809C9.97574 9.00256 9.68806 8.78042 9.47217 8.62988C9.36479 8.55503 9.27598 8.49798 9.21533 8.46094C9.18526 8.44257 9.16187 8.42851 9.14697 8.41992C9.14001 8.41591 9.13451 8.4129 9.13135 8.41113L9.12939 8.40918L8.37744 8L9.12842 7.59082L9.13135 7.58887C9.13453 7.58709 9.13995 7.58412 9.14697 7.58008C9.16187 7.57149 9.18518 7.55747 9.21533 7.53906C9.27593 7.50206 9.36491 7.44586 9.47217 7.37109C9.68805 7.22058 9.97571 6.99843 10.2612 6.71289C10.8405 6.13349 11.3636 5.344 11.3638 4.39551V1.93359H4.63721Z"/></svg>';
const XMARK = '<svg width="16" height="16" viewBox="0 0 16 16" style="display:block"><path fill="currentColor" d="M12.1494 3.14648C12.3446 2.95126 12.6612 2.95135 12.8564 3.14648C13.0517 3.34175 13.0517 3.65825 12.8564 3.85352L8.70898 8.00098L12.8574 12.1494C13.0526 12.3446 13.0526 12.6612 12.8574 12.8564C12.6622 13.0516 12.3456 13.0517 12.1504 12.8564L8.00195 8.70801L3.85352 12.8564C3.65825 13.0517 3.34175 13.0517 3.14648 12.8564C2.95135 12.6612 2.95126 12.3446 3.14648 12.1494L7.29492 8.00098L3.14746 3.85352C2.95228 3.65827 2.95228 3.34173 3.14746 3.14648C3.34271 2.95137 3.65927 2.95132 3.85449 3.14648L8.00195 7.29395L12.1494 3.14648Z"/></svg>';
const TASKIC = '<g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M8 1.333V4m2.8 1.2 1.933-1.933M12 8h2.667M10.8 10.8l1.933 1.933M8 12v2.667m-4.733-1.934L5.2 10.8M1.333 8H4m-.733-4.733L5.2 5.2"/></g>';
const i16 = (inner) => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none">' + inner + '</svg>';
const GREEN = 'var(--color-ink-green-4)', AMBER = 'var(--color-ink-amber-4)';
const cell = (x, txt, cls, sty) => '<div class="pms-cell ' + (cls || '') + '" style="left:' + (x - 268) + 'px;' + (sty || '') + '">' + txt + '</div>';
const bar = (x, y, w, h) => '<div class="pms-bar" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + (h || 10) + 'px"></div>';
const gh = (x, y, w, h, r) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;background:var(--color-surface-gray-3)"></div>';
const T = { r1: 1.9, c1: 2.6, rS: 3.7, cS: 4.4, close: 4.7, toast: 4.9, done: 5.5, r2: 6.6, end: 9.0 };
kit.scene('submit-week', {
  init(kit) {
    const side = SHELL('personal');
    let head = '<div class="pms-row" style="top:100px;height:40px">' + bar(32, 16, 130, 8);
    COLS.forEach((x) => { head += bar(x - 256, 16, 32, 8); });
    head += bar(1110, 16, 40, 8) + '</div>';
    const pill = (cls, bg, ink, txt, hidden) => '<span class="sw-' + cls + '" style="' + (hidden ? 'position:absolute;left:0;top:0;opacity:0;' : '') + 'display:block;height:20px;padding:0 6px;border-radius:9999px;background:var(--color-' + bg + ');color:var(--color-' + ink + ');font-size:12px;font-weight:420;line-height:20px;white-space:nowrap">' + txt + '</span>';
    let week = '<div class="pms-row" style="top:140px">' + gh(33, 14, 14, 14, 4) +
      '<div class="pms-abs" style="left:56px;top:12px;height:20px;display:flex;align-items:center;gap:8px;white-space:nowrap">' +
      '<span style="font-size:14px;font-weight:500;line-height:16px;color:var(--color-ink-gray-5)">Oct 12 - 18, 2026</span>' +
      '<span style="position:relative;display:block;height:20px;width:max-content">' + pill('b1', 'surface-gray-2', 'ink-gray-6', 'Not submitted') + pill('b2', 'surface-amber-2', 'ink-amber-4', 'Approval pending', true) + '</span></div>';
    DATES.forEach((d, i) => { week += cell(COLS[i], d); });
    week += cell(1366, 'Total') +
      '<div class="pms-abs sw-st" style="left:1156px;top:8px;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:var(--color-surface-gray-7);color:var(--color-ink-white)">' + SEND + '</div>' +
      '<div class="pms-abs sw-st2" style="left:1156px;top:8px;width:28px;height:28px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-amber-4);opacity:0">' + HOURG + '</div></div>';
    const vals = (c, bold, total, color) => {
      let r = '';
      COLS.forEach((x, i) => { r += i < 5 ? cell(x, '08:00', 'sw-v' + c, 'color:var(--color-ink-gray-8)' + (bold ? ';font-weight:500' : '')) : cell(x, '-', '', 'color:var(--color-ink-gray-4)'); });
      return r + cell(1366, total, '', 'color:' + color + (bold ? ';font-weight:500' : ''));
    };
    // In the app a project row's total is always green and a task row's always gray.
    const all = '<div class="pms-row" style="top:184px">' + bar(48, 17, 120) + vals('a', true, '40:00', GREEN) + '</div>';
    const proj = '<div class="pms-row" style="top:228px"><div class="pms-abs" style="left:26px;top:14px;display:flex;gap:6px;color:var(--color-ink-gray-3)">' + i16(CHEV) + '</div>' + bar(70, 17, 150) + vals('p', false, '40:00', GREEN) + '</div>';
    const task = '<div class="pms-row" style="top:272px"><div class="pms-abs" style="left:70px;top:12px;display:flex;align-items:center;gap:6px;color:var(--color-ink-gray-4)">' + i16(TASKIC) + '<span>' + TASK + '</span></div>' + vals('t', false, '40:00', 'var(--color-ink-gray-6)') + '</div>';
    let skel = '';
    for (let i = 0; i < 12; i++) {
      let r = '<div class="pms-row" style="top:' + (316 + i * 44) + 'px">' + bar(i % 3 ? 48 : 32, 17, i % 3 ? 160 + (i * 53) % 120 : 110);
      COLS.forEach((x) => { r += bar(x - 256, 18, 32, 8); });
      skel += r + bar(1110, 18, 40, 8) + '</div>';
    }
    const G = (x, y, w, h, extra) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;' + extra + '"></div>';
    const dlg = '<div class="pms-abs sw-ov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;visibility:hidden"></div>' +
      '<div class="pms-abs sw-dlg" style="left:464px;top:120px;width:512px;height:364.6px;background:var(--color-surface-modal);border-radius:16px;visibility:hidden;box-shadow:0 0 1px rgba(0,0,0,.19),0 1px 2px rgba(0,0,0,.07),0 6px 15px -5px rgba(0,0,0,.11)">' +
      '<div class="pms-abs" style="left:24px;top:22px;font-size:20px;font-weight:600;line-height:24px;letter-spacing:.2px;color:var(--color-ink-gray-8);white-space:nowrap">Submit for approval</div>' +
      '<div class="pms-abs" style="left:456px;top:20px;width:32px;height:28px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-8)">' + XMARK + '</div>' +
      G(24, 68, 464, 36.1, 'border-radius:10px;background:var(--color-surface-gray-1)') +
      '<div class="pms-abs" style="left:40px;top:78px;font-size:14px;line-height:16px;color:var(--color-ink-gray-7);white-space:nowrap">Week of Oct 12 - Oct 18</div>' +
      '<div class="pms-abs" style="right:40px;top:78px;font-size:14px;font-weight:500;line-height:16px;color:var(--color-ink-green-4);font-variant-numeric:tabular-nums">40:00</div>' +
      '<div class="pms-abs" style="left:24px;top:120px;font-size:14px;line-height:16px;color:var(--color-ink-gray-5)">Note</div>' +
      '<div class="pms-abs" style="left:24px;top:142.2px;width:464px;height:62.3px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;background:var(--color-surface-white);padding:6px 8px;font-size:14px;line-height:16px;color:var(--color-ink-gray-4);white-space:nowrap">Comment' +
      '<svg style="position:absolute;right:2px;bottom:2px;width:8px;height:8px" viewBox="0 0 8 8"><path d="M7 2L2 7M7 5L5 7" stroke="var(--color-ink-gray-4)" stroke-width="1" stroke-linecap="round"/></svg></div>' +
      '<div class="pms-abs" style="left:24px;top:220.5px;display:flex;gap:2px;font-size:14px;line-height:16px;color:var(--color-ink-gray-5)">Send to<span style="color:var(--color-ink-red-3)">*</span></div>' +
      '<div class="pms-abs" style="left:24px;top:242.6px;width:464px;height:32px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;background:var(--color-surface-white)">' +
      '<div class="pms-abs" style="left:7px;top:7px;width:16px;height:16px;border-radius:50%;background:var(--color-surface-gray-2);color:var(--color-ink-gray-5);font-size:11px;font-weight:500;line-height:16px;text-align:center">C</div>' +
      '<div class="pms-abs" style="left:31px;top:7px;font-size:14px;line-height:16px;color:var(--color-ink-gray-7);white-space:nowrap">' + MANAGER + '</div>' +
      '<svg class="pms-abs" style="left:439px;top:7px;color:var(--color-ink-gray-4)" width="16" height="16" viewBox="0 0 16 16" fill="none">' + CHEV + '</svg></div>' +
      '<div class="pms-abs sw-sb" style="left:24px;top:312.6px;width:464px;height:28px;border-radius:8px;background:var(--color-surface-gray-7);color:var(--color-ink-white);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:450">Submit</div>' +
      '<div class="pms-ring sw-rS" style="left:19px;top:307.6px;width:474px;height:38px;border-radius:11px;opacity:0"></div></div>';
    const toast = '<div class="pms-abs sw-toast" style="right:20px;top:840px;height:40px;box-sizing:border-box;padding:6px 16px;background:var(--color-surface-gray-6);border-radius:10px;box-shadow:0 0 1px rgba(0,0,0,.35),0 6px 8px -4px rgba(0,0,0,.1);display:flex;align-items:center;gap:12px;visibility:hidden">' +
      '<div style="display:flex;align-items:center;gap:8px;flex:1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-surface-green-5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;display:block"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>' +
      '<span style="font-size:13px;line-height:19.5px;font-weight:420;color:var(--color-ink-white);white-space:nowrap">Timesheet submitted for approval successfully</span></div>' +
      '<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-white)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam sw-cam"><div class="pms-win">' + side + head + week + all + proj + task +
      '<div class="pms-abs" style="left:0;right:0;top:0;height:900px">' + skel + '</div>' + dlg + toast +
      '<div class="pms-ring sw-r1" style="left:1391px;top:143px;width:38px;height:38px;border-radius:11px;opacity:0"></div>' +
      '<div class="pms-ring sw-r2" style="border-radius:9999px;opacity:0"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.sw-' + c);
    for (const k of ['cam', 'ov', 'dlg', 'sb', 'st', 'st2', 'b1', 'b2', 'toast', 'r1', 'r2', 'rS']) this[k] = q(k);
    this.taskVals = [...kit.stage.querySelectorAll('.sw-vt')];
    // Result ring around the "Approval pending" badge, measured from the laid-out badge.
    const wr = kit.stage.querySelector('.pms-win').getBoundingClientRect(), k = wr.width / 1440, br = this.b2.getBoundingClientRect();
    const b = k > 0 && br.width > 0 ? { x: (br.left - wr.left) / k, y: (br.top - wr.top) / k, w: br.width / k, h: br.height / k } : { x: 400, y: 152, w: 106, h: 20 };
    Object.assign(this.r2.style, { left: (b.x - 5) + 'px', top: (b.y - 5) + 'px', width: (b.w + 10) + 'px', height: (b.h + 10) + 'px' });
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.12, hold: 0.6, drift: [2, 0, 0.004] },
      { t: 1.6, cx: 1200, cy: 360, z: 2.0, hold: 1.1 },
      { t: 3.4, cx: 960, cy: 395, z: 1.85, hold: 1.2, drift: [0, 0, 0.004] },
      { t: 5.2, cx: 960, cy: 540, z: 1.12, hold: 0.6 },
      { t: 6.4, cx: 960, cy: 500, z: 1.34 },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1500, 900] }, { t: 0.8, at: [1500, 900] }, { t: 2.0, at: [1650, 252] }, { t: 2.7, at: [1650, 252] },
      { t: 3.6, at: [1000, 538] }, { t: 4.6, at: [1000, 538] }, { t: 5.3, at: [1330, 700] }, { t: T.end, at: [1336, 704] },
    ];
    this.cur.clicks = [T.c1, T.cS];
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const mix = (a, b, p) => 'color-mix(in srgb, var(--color-' + a + '), var(--color-' + b + ') ' + p * 100 + '%)';
    const press = (a) => 1 - 0.04 * seg(t, a - 0.05, a) * (1 - seg(t, a, a + 0.12));
    const fade = (a, b) => eo(seg(t, a, a + 0.25)) * (1 - ei(seg(t, b, b + 0.15)));
    this.st.style.background = mix('surface-gray-7', 'surface-gray-6', eio(seg(t, T.r1 + 0.1, T.r1 + 0.25)) * (1 - eio(seg(t, T.c1, T.c1 + 0.15))));
    this.st.style.transform = 'scale(' + press(T.c1) + ')';
    const open = eo(seg(t, T.c1, T.c1 + 0.15)) * (1 - ei(seg(t, T.close, T.close + 0.17)));
    this.ov.style.opacity = open; this.ov.style.visibility = open > 0 ? 'visible' : 'hidden';
    this.dlg.style.opacity = open; this.dlg.style.visibility = open > 0 ? 'visible' : 'hidden';
    this.dlg.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, T.c1, T.c1 + 0.15))) + ')';
    this.sb.style.background = mix('surface-gray-7', 'surface-gray-6', eio(seg(t, T.cS - 0.05, T.cS + 0.1)));
    this.sb.style.transform = 'scale(' + press(T.cS) + ')';
    const tk = seg(t, T.toast, T.toast + 0.4), te = 1 - Math.pow(1 - tk, 3);
    this.toast.style.visibility = t >= T.toast ? 'visible' : 'hidden';
    this.toast.style.opacity = te;
    this.toast.style.transform = 'translateY(' + (150 * (1 - te)).toFixed(1) + '%) scale(' + lerp(0.95, 1, te).toFixed(4) + ')';
    const done = t >= T.done;
    this.b1.style.opacity = done ? 0 : 1; this.b2.style.opacity = done ? 1 : 0;
    this.st.style.opacity = done ? 0 : 1; this.st2.style.opacity = done ? 1 : 0;
    for (const el of this.taskVals) el.style.color = done ? AMBER : 'var(--color-ink-gray-8)';
    this.r1.style.opacity = fade(T.r1, T.c1);
    this.rS.style.opacity = fade(T.rS, T.cS);
    this.r2.style.opacity = eo(seg(t, T.r2, T.r2 + 0.25));
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
