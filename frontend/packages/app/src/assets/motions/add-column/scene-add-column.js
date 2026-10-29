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
// Projects List view kit. The table is clipped at x 1420, header row 45 high, body rows 41 high.
const LCOL = { name: [268, 240, 80.7], phase: [516, 160, 37.6], burn: [684, 130, 93.4], cost: [822, 140, 60.5],
  budget: [970, 130, 76.8], profit: [1108, 120, 78.7], start: [1236, 130, 60.4], mile: [1374, 140, 91.7] };
const ROW = (i) => 158 + 41 * i, ROWCY = (i) => 178 + 41 * i, NROWS = 18;
const CHEV = '<path d="M11.3848 5.6582C11.5735 5.45686 11.8903 5.44622 12.0918 5.63477C12.2931 5.82353 12.3038 6.14033 12.1152 6.3418L8.36523 10.3418C8.27071 10.4426 8.1382 10.5 8 10.5C7.8618 10.5 7.72929 10.4426 7.63477 10.3418L3.88477 6.3418C3.69622 6.14033 3.70686 5.82353 3.9082 5.63477C4.10967 5.44622 4.42647 5.45686 4.61523 5.6582L8 9.26855L11.3848 5.6582Z" fill="currentColor"/>';
const PIN = '<path d="M14.357 4.1148C15.2626 5.02053 15.3377 6.4648 14.5303 7.45906L11.0217 11.7783C10.8611 11.9762 10.7533 12.2117 10.7089 12.4627L10.4209 14.0916C10.2804 14.8882 9.30126 15.1976 8.72914 14.6261L5.42769 11.3247L3.60883 13.1435C3.41357 13.3388 3.09698 13.3388 2.90172 13.1435C2.70665 12.9483 2.70655 12.6316 2.90172 12.4364L4.72059 10.6176L1.37357 7.27054C0.802238 6.6984 1.11158 5.71928 1.90804 5.57873L3.52527 5.29285C3.78181 5.24754 4.02297 5.13678 4.2234 4.97037L8.47433 1.44036C9.4677 0.615971 10.9257 0.683751 11.8386 1.59642L14.357 4.1148ZM11.1315 2.30353C10.5837 1.756 9.70906 1.71561 9.11307 2.21031L4.86215 5.73894C4.528 6.01636 4.12629 6.20277 3.6986 6.27824L2.08068 6.56343L9.43624 13.9176L9.72351 12.2893C9.79739 11.8707 9.97687 11.4779 10.2449 11.1479L13.7535 6.8286C14.238 6.23206 14.1933 5.36538 13.6499 4.82191L11.1315 2.30353Z" fill="currentColor"/>';
const lsvg = (p, size, color) => '<svg width="' + size + '" height="' + size + '" viewBox="0 0 16 16" fill="none" style="flex:none;display:block;color:' + color + '">' + p + '</svg>';
const lg = (x, y, w, h, r) => '<div class="pms-ghost" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px"></div>';
const chevX = (k) => LCOL[k][0] + LCOL[k][2] + 4;
// Header cell: Ghost (label pill + chevron square), Landmark (muted words + chevron square), Focus (as the app).
const thGhost = (k) => lg(LCOL[k][0], 130, Math.round(LCOL[k][2]), 10, 5) + lg(chevX(k) + 2, 128, 14, 14, 4);
const thLandmark = (k, name) => '<div class="pms-th" style="left:' + LCOL[k][0] + 'px">' + name + '</div>' + lg(chevX(k) + 2, 128, 14, 14, 4);
const thFocus = (k, name) => '<div class="pms-th" style="left:' + LCOL[k][0] + 'px;color:var(--color-ink-gray-5)">' + name + '</div><div class="pms-abs" style="left:' + (chevX(k) + 2) + 'px;top:128px">' + lsvg(CHEV, 14, 'var(--color-ink-gray-6)') + '</div>';
// Body cells: text pill (10 px, r5) at the cell's left, icon square (14, r4), and the Cost burn bar at its real 4 px box.
const tdText = (k, i, w) => lg(LCOL[k][0], ROWCY(i) - 5, w, 10, 5);
const tdIconText = (k, i, w) => lg(LCOL[k][0] + 1, ROWCY(i) - 7, 14, 14, 4) + lg(LCOL[k][0] + 22, ROWCY(i) - 5, w, 10, 5);
const tdBar = (k, i) => lg(LCOL[k][0], ROWCY(i) - 2, LCOL[k][1] - 8, 4, 2);
const tdFocus = (k, i, s) => '<div class="pms-td" style="left:' + LCOL[k][0] + 'px;top:' + (ROWCY(i) - 8) + 'px">' + s + '</div>';

// Columns panel kit. It opens and closes instantly and stays open after a pin, a remove or an add.
const CP = { x: 904.5, y: 103, w: 237.2, lx: 910.5, ly: 109, lw: 225.2, row: 32 };
const CP_COLS = [['name', 'Project name'], ['phase', 'Phase'], ['burn', 'Burn rate/week'], ['cost', 'Cost burn'], ['budget', 'Total budget'],
  ['profit', 'Profit margin'], ['start', 'Start date'], ['mile', 'Next milestone'], ['end', 'End date'], ['pm', 'Project manager'],
  ['lead', 'Lead engineer'], ['client', 'Client name'], ['contract', 'Contract end date']];
const CPI = {
  cols: '<path fill-rule="evenodd" d="M8.07548 1.4998C8.05087 1.49607 8.02566 1.49414 8 1.49414C7.97434 1.49414 7.94914 1.49607 7.92452 1.4998H3C1.89543 1.4998 1 2.39523 1 3.4998V12.4998C1 13.6044 1.89543 14.4998 3 14.4998H7.92511C7.94954 14.5035 7.97455 14.5054 8 14.5054C8.02545 14.5054 8.05046 14.5035 8.07489 14.4998H13C14.1046 14.4998 15 13.6044 15 12.4998V3.4998C15 2.39523 14.1046 1.4998 13 1.4998H8.07548ZM7.5 2.4998H3C2.44772 2.4998 2 2.94752 2 3.4998V12.4998C2 13.0521 2.44772 13.4998 3 13.4998H7.5L7.5 2.4998ZM8.5 13.4998L8.5 2.4998H13C13.5523 2.4998 14 2.94752 14 3.4998V12.4998C14 13.0521 13.5523 13.4998 13 13.4998H8.5Z" fill="currentColor"/>',
  grip: '<path fill-rule="evenodd" d="M4.25 3C4.25 3.69036 4.80964 4.25 5.5 4.25C6.19036 4.25 6.75 3.69036 6.75 3C6.75 2.30964 6.19036 1.75 5.5 1.75C4.80964 1.75 4.25 2.30964 4.25 3ZM5.5 9.25C4.80964 9.25 4.25 8.69036 4.25 8C4.25 7.30964 4.80964 6.75 5.5 6.75C6.19036 6.75 6.75 7.30964 6.75 8C6.75 8.69036 6.19036 9.25 5.5 9.25ZM5.5 14.25C4.80964 14.25 4.25 13.6904 4.25 13C4.25 12.3096 4.80964 11.75 5.5 11.75C6.19036 11.75 6.75 12.3096 6.75 13C6.75 13.6904 6.19036 14.25 5.5 14.25ZM10.5 9.25C9.80964 9.25 9.25 8.69036 9.25 8C9.25 7.30964 9.80964 6.75 10.5 6.75C11.1904 6.75 11.75 7.30964 11.75 8C11.75 8.69036 11.1904 9.25 10.5 9.25ZM9.25 13C9.25 13.6904 9.80964 14.25 10.5 14.25C11.1904 14.25 11.75 13.6904 11.75 13C11.75 12.3096 11.1904 11.75 10.5 11.75C9.80964 11.75 9.25 12.3096 9.25 13ZM10.5 4.25C9.80964 4.25 9.25 3.69036 9.25 3C9.25 2.30964 9.80964 1.75 10.5 1.75C11.1904 1.75 11.75 2.30964 11.75 3C11.75 3.69036 11.1904 4.25 10.5 4.25Z" fill="currentColor"/>',
  unpin: '<path fill-rule="evenodd" d="M12.3705 4.61033L11.4595 5.52132L11.809 8.89575C11.8528 9.3187 12.0038 9.72349 12.2476 10.0718L13.1964 11.4272H5.55359L4.55359 12.4272H7.53076V14.9961C7.53076 15.2723 7.75462 15.4961 8.03076 15.4961C8.3069 15.4961 8.53076 15.2723 8.53076 14.9961V12.4272H13.1964C14.0054 12.4272 14.4795 11.5165 14.0156 10.8537L13.0668 9.49838C12.9205 9.28937 12.83 9.04649 12.8037 8.79272L12.3705 4.61033ZM1.8197 13.749C1.62381 13.935 1.31418 13.9319 1.12203 13.7398C0.92677 13.5445 0.92677 13.2279 1.12203 13.0327L2.0546 12.1001C1.76195 11.7749 1.68728 11.2663 1.97606 10.8537L2.91824 9.50777C3.06767 9.29429 3.15891 9.04557 3.18298 8.78611L3.69329 3.28425C3.81255 1.99851 4.89135 1.01514 6.18261 1.01514H9.74365C10.6574 1.01514 11.4657 1.50781 11.902 2.25276L13.122 1.03268C13.3173 0.837415 13.6339 0.837415 13.8291 1.03268C14.0151 1.21868 14.024 1.51478 13.8556 1.71122C13.8524 1.71424 13.8493 1.71731 13.8462 1.72042L1.84615 13.7204C1.8369 13.7297 1.82808 13.7392 1.8197 13.749ZM9.74365 2.01514C10.3864 2.01514 10.9421 2.42138 11.1532 3.00148L2.95344 11.2013L3.73747 10.0812C3.98652 9.72544 4.1386 9.3109 4.1787 8.87846L4.68902 3.3766C4.76057 2.60516 5.40785 2.01514 6.18261 2.01514H9.74365Z" fill="currentColor"/>',
  x: '<path d="M12.1494 3.14648C12.3446 2.95126 12.6612 2.95135 12.8564 3.14648C13.0517 3.34175 13.0517 3.65825 12.8564 3.85352L8.70898 8.00098L12.8574 12.1494C13.0526 12.3446 13.0526 12.6612 12.8574 12.8564C12.6622 13.0516 12.3456 13.0517 12.1504 12.8564L8.00195 8.70801L3.85352 12.8564C3.65825 13.0517 3.34175 13.0517 3.14648 12.8564C2.95135 12.6612 2.95126 12.3446 3.14648 12.1494L7.29492 8.00098L3.14746 3.85352C2.95228 3.65827 2.95228 3.34173 3.14746 3.14648C3.34271 2.95137 3.65927 2.95132 3.85449 3.14648L8.00195 7.29395L12.1494 3.14648Z" fill="currentColor"/>',
  plus: '<path d="M7.99805 3.5C8.27396 3.50026 8.49805 3.72402 8.49805 4V7.49805H12C12.2761 7.49805 12.5 7.7219 12.5 7.99805C12.4997 8.27396 12.276 8.49805 12 8.49805H8.49805V12C8.49805 12.276 8.27396 12.4997 7.99805 12.5C7.7219 12.5 7.49805 12.2761 7.49805 12V8.49805H4C3.72402 8.49805 3.50026 8.27396 3.5 7.99805C3.5 7.7219 3.72386 7.49805 4 7.49805H7.49805V4C7.49805 3.72386 7.7219 3.5 7.99805 3.5Z" fill="currentColor"/>',
  reset: '<path d="M9.63064 1.56336C8.22819 1.20608 6.74403 1.3164 5.40603 1.88172C4.25614 2.36767 3.27307 3.1664 2.56131 4.17762L2.36209 2.74793C2.32413 2.47457 2.07195 2.28347 1.79861 2.32117C1.52509 2.35915 1.33387 2.61211 1.37185 2.88562L1.74197 5.55164L1.76541 5.6493C1.8428 5.86857 2.06619 6.01045 2.30545 5.97742L4.97146 5.6073L5.0701 5.58387C5.28942 5.50649 5.43127 5.28313 5.39822 5.04383C5.36497 4.80441 5.16753 4.6279 4.93533 4.61316L4.83377 4.61707L3.32791 4.82605C3.93596 3.93262 4.79055 3.22804 5.79471 2.80359C6.93132 2.32328 8.19218 2.22959 9.38357 2.53308L9.62088 2.59851C10.8022 2.95502 11.8317 3.68887 12.5545 4.68348L12.6951 4.88562C13.4216 5.983 13.7413 7.2999 13.5994 8.60828L13.5681 8.85242C13.3824 10.0677 12.8037 11.1918 11.9178 12.0507L11.7371 12.2186C10.8179 13.0349 9.65474 13.5301 8.42459 13.6249C7.11231 13.7259 5.80544 13.3649 4.73123 12.6044C3.657 11.8438 2.88244 10.7312 2.54178 9.45984C2.47024 9.19325 2.19611 9.03495 1.92947 9.10633C1.6628 9.17778 1.5046 9.45195 1.57596 9.71863C1.97696 11.2152 2.88866 12.5244 4.1531 13.4198C5.41771 14.3151 6.95586 14.7409 8.50076 14.622C9.94933 14.5104 11.3188 13.9269 12.4012 12.9657L12.6131 12.7684C13.6562 11.7574 14.3377 10.4345 14.5564 9.00379L14.5935 8.71668C14.7607 7.17638 14.3843 5.62579 13.5291 4.33387L13.364 4.09559C12.5131 2.92456 11.3008 2.06123 9.90994 1.64148L9.63064 1.56336Z" fill="currentColor"/>',
};
const cpSvg = (p, w, h, color) => '<svg width="' + w + '" height="' + h + '" viewBox="0 0 16 16" fill="none" style="display:block;flex:none;color:' + color + '">' + p + '</svg>';
// Layout for a list state: order = keys in table order, pinned = keys pinned (shown first, in that order).
const cpLayout = (order, pinned, changed) => {
  const P = pinned || [], lab = Object.fromEntries(CP_COLS), rows = [];
  let y = CP.ly;
  P.forEach((k) => { rows.push({ key: k, label: lab[k], y, pinned: true }); y += CP.row; });
  const sep = P.length ? y + 6 : null;
  if (P.length) y += 13;
  order.filter((k) => !P.includes(k)).forEach((k) => { rows.push({ key: k, label: lab[k], y, pinned: false }); y += CP.row; });
  const reset = P.length > 0 || !!changed, rule = y + 6, add = rule + 7;
  return { rows, sep, rule, add, reset: reset ? add + 32.5 : null, h: (y - CP.ly) + 6 + 6 + (reset ? 67.5 : 35.5) + 6 };
};
// The Columns button. Hooks: .<cls>-hov (hover layer, opacity 0..1).
const columnsButton = (cls) => '<div class="pms-abs ' + cls + '" style="left:1043.5px;top:71px;width:98.3px;height:28px;border-radius:8px;background:var(--color-surface-gray-2)">' +
  '<div class="pms-abs ' + cls + '-hov" style="inset:0;border-radius:8px;background:var(--color-surface-gray-3);opacity:0"></div>' +
  '<div class="pms-abs" style="left:8px;top:6px">' + cpSvg(CPI.cols, 16, 16, 'var(--color-ink-gray-8)') + '</div>' +
  '<div class="pms-abs" style="left:32px;top:6px;font-size:14px;font-weight:420;line-height:16px;color:var(--color-ink-gray-8);white-space:nowrap">Columns</div></div>';
// The panel for one list state, positioned in window coords. Hooks (opacity 0..1): .<cls>-tint-<key> (row hover),
// .<cls>-pinbg-<key> and .<cls>-xbg-<key> (button hover layers), .<cls>-addbg and .<cls>-resetbg (footer row hover layers).
// Pass changed=true for any state that differs from the default columns, so "Reset to Default" shows.
const columnsPanel = (cls, order, pinned, changed) => {
  const L = cpLayout(order, pinned, changed);
  let s = '<div class="pms-abs ' + cls + '" style="left:' + CP.x + 'px;top:' + CP.y + 'px;width:' + CP.w + 'px;height:' + L.h + 'px;background:var(--color-surface-modal);border-radius:12px;box-shadow:0 0 0 1px rgba(0,0,0,.05),0 0 1px rgba(0,0,0,.2),0 1px 3px rgba(0,0,0,.05),0 10px 24px -3px rgba(0,0,0,.1)">';
  const X = (x) => x - CP.x, Y = (y) => y - CP.y;
  for (const r of L.rows) {
    s += '<div class="pms-abs" style="left:' + X(CP.lx) + 'px;top:' + Y(r.y) + 'px;width:' + CP.lw + 'px;height:32px">' +
      '<div class="pms-abs ' + cls + '-tint-' + r.key + '" style="inset:0;border-radius:8px;background:var(--color-surface-gray-2);opacity:0"></div>' +
      '<div class="pms-abs" style="left:8px;top:9px">' + cpSvg(CPI.grip, 14, 14, 'var(--color-ink-gray-5)') + '</div>' +
      '<div class="pms-abs" style="left:30px;top:8px;font-size:14px;font-weight:420;line-height:16px;color:var(--color-ink-gray-8);white-space:nowrap">' + r.label + '</div>' +
      '<div class="pms-abs ' + cls + '-pinbg-' + r.key + '" style="left:173.2px;top:6px;width:20px;height:20px;border-radius:8px;background:var(--color-surface-gray-3);opacity:0"></div>' +
      '<div class="pms-abs" style="left:177.2px;top:9px">' + (r.pinned ? cpSvg(CPI.unpin, 12, 14, 'var(--color-ink-gray-8)') : cpSvg(PIN, 12, 14, 'var(--color-ink-gray-4)')) + '</div>' +
      '<div class="pms-abs ' + cls + '-xbg-' + r.key + '" style="left:197.2px;top:6px;width:20px;height:20px;border-radius:8px;background:var(--color-surface-gray-3);opacity:0"></div>' +
      '<div class="pms-abs" style="left:201.2px;top:9px">' + cpSvg(CPI.x, 12, 14, 'var(--color-ink-gray-8)') + '</div></div>';
  }
  if (L.sep != null) s += '<div class="pms-abs" style="left:' + X(CP.lx) + 'px;top:' + Y(L.sep) + 'px;width:' + CP.lw + 'px;height:1px;background:var(--color-outline-gray-1)"></div>';
  s += '<div class="pms-abs" style="left:' + X(CP.lx) + 'px;top:' + Y(L.rule) + 'px;width:' + CP.lw + 'px;height:1px;background:var(--color-outline-gray-1)"></div>';
  const foot = (y, icon, text, hk) => '<div class="pms-abs ' + cls + '-' + hk + 'bg" style="left:' + X(CP.lx) + 'px;top:' + Y(y) + 'px;width:' + CP.lw + 'px;height:28px;border-radius:8px;background:var(--color-surface-gray-3);opacity:0"></div>' +
    '<div class="pms-abs" style="left:' + X(CP.lx + 8) + 'px;top:' + Y(y + 6) + 'px">' + cpSvg(icon, 16, 16, 'var(--color-ink-gray-5)') + '</div>' +
    '<div class="pms-abs" style="left:' + X(CP.lx + 32) + 'px;top:' + Y(y + 6) + 'px;font-size:14px;font-weight:420;line-height:16px;color:var(--color-ink-gray-5);white-space:nowrap">' + text + '</div>';
  s += foot(L.add, CPI.plus, 'Add Column', 'add');
  if (L.reset != null) s += foot(L.reset, CPI.reset, 'Reset to Default', 'reset');
  return s + '</div>';
};
// Hover geometry for render(): which row and button box hold window point p, in a layout from cpLayout.
const cpHit = (L, p) => {
  for (const r of L.rows) {
    if (p[0] < CP.lx || p[0] > CP.lx + CP.lw || p[1] < r.y || p[1] >= r.y + 32) continue;
    const inPin = p[0] >= CP.lx + 173.2 && p[0] < CP.lx + 193.2 && p[1] >= r.y + 6 && p[1] < r.y + 26;
    const inX = p[0] >= CP.lx + 197.2 && p[0] < CP.lx + 217.2 && p[1] >= r.y + 6 && p[1] < r.y + 26;
    return { row: r.key, btn: inPin ? 'pin' : inX ? 'x' : null };
  }
  return { row: null, btn: null };
};

// Add Column list kit. It opens and closes instantly, 8 px below the Add Column row, and holds the hidden columns only.
// Columns the List view kit has not listed yet, right of Next milestone, and the new column.
Object.assign(LCOL, { end: [1522, 120, 54.2], pm: [1650, 200, 100.6], lead: [1858, 200, 87.6], client: [2066, 180, 73.2],
  contract: [2254, 160, 110.6], ptype: [2422, 120, 74.2] });
const AC_OPTS = ['Project type', 'Lifetime value to date', 'Client POC'];
// The table scroller is 1160 wide in the window (260..1420) and its content ends 8 px after the last column.
const TBL_VIEW = 1160, tblMax = (lastKey) => LCOL[lastKey][0] + LCOL[lastKey][1] + 8 - 260 - TBL_VIEW;
// The Add Column list, opened from a panel layout L. Hooks: .<cls>-opt-<i> (highlight), .<cls>-caret.
const acListY = (L) => L.add + 28 + 8;
const addColumnList = (cls, L, opts) => {
  let s = '<div class="pms-abs ' + cls + '" style="left:' + CP.lx + 'px;top:' + acListY(L) + 'px;width:225px;height:' + (46 + 28.1 * opts.length).toFixed(1) + 'px;background:var(--color-surface-modal);border-radius:12px;box-shadow:0 0 1px rgba(0,0,0,.2),0 1px 3px rgba(0,0,0,.05),0 10px 24px -3px rgba(0,0,0,.1)">' +
    '<div class="pms-abs" style="left:6px;top:6px;width:213px;height:28px;border-radius:8px;background:var(--color-surface-gray-3)"></div>' +
    '<div class="pms-abs ' + cls + '-caret" style="left:13.5px;top:12px;width:1px;height:16px;background:var(--color-ink-gray-8)"></div>' +
    '<div class="pms-abs" style="left:14px;top:12px;font-size:14px;font-weight:420;line-height:16px;color:color-mix(in srgb, var(--color-ink-gray-8) 50%, transparent);white-space:nowrap">Search</div>' +
    '<div class="pms-abs" style="left:198.7px;top:12px">' + cpSvg(CPI.x, 16, 16, 'var(--color-ink-gray-8)') + '</div>';
  opts.forEach((o, i) => {
    s += '<div class="pms-abs ' + cls + '-opt-' + i + '" style="left:6px;top:' + (40 + 28.1 * i).toFixed(1) + 'px;width:213px;height:28.1px;border-radius:8px;background:var(--color-surface-gray-3);opacity:0"></div>' +
      '<div class="pms-abs" style="left:16px;top:' + (46 + 28.1 * i).toFixed(1) + 'px;font-size:14px;font-weight:420;line-height:16px;color:var(--color-ink-gray-7);white-space:nowrap">' + o + '</div>';
  });
  return s + '</div>';
};
// Hover geometry in window coords: the footer row a point is on, and the option a point is on (or -1).
const acFootHit = (L, p, reset) => {
  if (p[0] < CP.lx || p[0] >= CP.lx + CP.lw) return null;
  if (p[1] >= L.add && p[1] < L.add + 28) return 'add';
  if (reset && p[1] >= L.add + 32.5 && p[1] < L.add + 60.5) return 'reset';
  return null;
};
const acOptHit = (L, p, n) => {
  const y0 = acListY(L) + 40;
  if (p[0] < CP.lx + 6 || p[0] >= CP.lx + 219 || p[1] < y0) return -1;
  const i = Math.floor((p[1] - y0) / 28.1);
  return i < n ? i : -1;
};

const T = { r1: 1.75, c1: 2.35, r2: 3.3, c2: 3.75, r3: 4.6, c3: 5.25, r4: 6.5, c4: 6.9, s0: 8.1, s1: 9.3, r5: 9.3 };
const NAMEW = [158, 205, 172, 118, 140, 190, 150, 132, 176, 164, 120, 186, 148, 170, 128, 196, 144, 160];
const PHASEW = [89, 53, 88, 66, 89, 89, 53, 88, 89, 66, 89, 53, 89, 88, 89, 66, 89, 53];
const BURNW = [61, 25, 55, 61, 52, 25, 58, 61, 25, 55, 61, 52, 25, 58, 61, 25, 55, 52];
const BUDGETW = [76, 68, 38, 76, 72, 68, 76, 38, 72, 76, 68, 72, 38, 76, 68, 72, 76, 68];
const PROFITW = [46, 46, 46, 46, 46, 38, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46];
const STARTW = [41, 47, 44, 25, 42, 47, 40, 44, 25, 42, 46, 41, 47, 25, 44, 42, 40, 47];
const MILEW = [44, 25, 42, 47, 25, 41, 44, 25, 46, 42, 25, 47, 41, 25, 44, 42, 25, 40];
const ENDW = [82, 25, 82, 44, 82, 25, 41, 82, 25, 82, 44, 25, 82, 82, 25, 41, 82, 25];
const PMW = [92, 74, 25, 88, 70, 92, 25, 74, 88, 70, 92, 25, 74, 88, 70, 25, 92, 74];
const LEADW = [86, 25, 78, 92, 25, 70, 86, 78, 25, 92, 70, 86, 25, 78, 92, 70, 25, 86];
const CLIENTW = [118, 90, 104, 92, 118, 104, 90, 118, 92, 104, 90, 118, 104, 92, 118, 90, 104, 92];
const CONTRW = [82, 25, 44, 82, 25, 82, 44, 25, 82, 41, 25, 82, 44, 82, 25, 82, 41, 25];
const PTYPE = ['External', 'Internal', 'External', 'External', 'Internal', 'External', 'External', 'Internal', 'External', 'External',
  'Internal', 'External', 'External', 'Internal', 'External', 'External', 'Internal', 'External'];
const ORDER0 = CP_COLS.map((c) => c[0]);
CP_COLS.push(['ptype', 'Project type']);
const ORDER1 = ORDER0.concat('ptype');
const L0 = cpLayout(ORDER0, []), L1 = cpLayout(ORDER1, [], true);
const SCROLL = tblMax('ptype');
const W2S = (x, y) => [x + 240, y + 90];
const COLB = W2S(1092.7, 85), ADDB = W2S(CP.lx + 72, L0.add + 14), OPTB = W2S(CP.lx + 62, acListY(L0) + 54), TBLP = W2S(1010, 430);
const KEYS = [{ t: 0, at: [1500, 860] }, { t: 1.2, at: [1500, 860] }, { t: 1.95, at: COLB }, { t: 2.65, at: COLB }, { t: 3.35, at: ADDB },
  { t: 3.95, at: ADDB }, { t: 4.65, at: OPTB }, { t: 5.8, at: OPTB }, { t: 6.5, at: COLB }, { t: 7.2, at: COLB }, { t: 7.9, at: TBLP }];
// The cursor path in window coords, evaluated in render() to drive hover states.
const curAt = (t) => {
  let p = KEYS[KEYS.length - 1].at;
  if (t <= KEYS[0].t) p = KEYS[0].at;
  else for (let i = 0; i < KEYS.length - 1; i++) if (t < KEYS[i + 1].t) { const u = eio(seg(t, KEYS[i].t, KEYS[i + 1].t)); p = [lerp(KEYS[i].at[0], KEYS[i + 1].at[0], u), lerp(KEYS[i].at[1], KEYS[i + 1].at[1], u)]; break; }
  return [p[0] - 240, p[1] - 90];
};
const OPEN = (t) => t >= T.c1 && t < T.c4;
const LIST = (t) => t >= T.c2 && t < T.c3;
const ADDED = (t) => t >= T.c3;
const LAY = (t) => (ADDED(t) ? L1 : L0);
const inCols = (p) => p[0] >= 1043.5 && p[0] < 1141.8 && p[1] >= 71 && p[1] < 99;
// A hover that fades over 0.15 s: the share of the last 0.15 s the pointer spent inside.
const fade15 = (t, inside) => { let n = 0; for (let i = 0; i < 9; i++) if (inside(t - i * 0.15 / 8)) n++; return eio(n / 9); };
// Rings [from, to, x, y, w, h, r] in window coords. The option ring is gone by the click, since the list closes under it at once.
const RINGS = [[T.r1, T.c1, 1038.5, 66, 108.3, 38, 11], [T.r2, T.c2, CP.lx - 5, L0.add - 5, CP.lw + 10, 38, 11],
  [T.r3, T.c3 - 0.25, CP.lx + 1, acListY(L0) + 35, 223, 38.1, 11], [T.r4, T.c4, 1038.5, 66, 108.3, 38, 11],
  [T.r5, 99, LCOL.ptype[0] - SCROLL - 5, 116, LCOL.ptype[1] + 10, 800, 11]];
kit.scene('add-column', {
  init(kit) {
    let cols = '';
    for (const k of Object.keys(LCOL)) {
      let s = '<div class="ac-col ac-col-' + k + '" style="position:absolute;left:0;top:0">';
      s += k === 'name' ? thLandmark('name', 'Project name') : k === 'ptype' ? thFocus('ptype', 'Project type') : thGhost(k);
      for (let i = 0; i < NROWS; i++) {
        const dateish = (W) => (W[i] === 25 ? tdText(k, i, 25) : tdIconText(k, i, W[i]));
        if (k === 'name') s += tdIconText(k, i, NAMEW[i]);
        else if (k === 'phase') s += tdIconText(k, i, PHASEW[i]);
        else if (k === 'burn') s += tdText(k, i, BURNW[i]);
        else if (k === 'cost') s += tdBar(k, i);
        else if (k === 'budget') s += tdText(k, i, BUDGETW[i]);
        else if (k === 'profit') s += tdText(k, i, PROFITW[i]);
        else if (k === 'start') s += dateish(STARTW);
        else if (k === 'mile') s += dateish(MILEW);
        else if (k === 'end') s += dateish(ENDW);
        else if (k === 'pm') s += tdText(k, i, PMW[i]);
        else if (k === 'lead') s += tdText(k, i, LEADW[i]);
        else if (k === 'client') s += tdText(k, i, CLIENTW[i]);
        else if (k === 'contract') s += dateish(CONTRW);
        else if (k === 'ptype') s += tdFocus(k, i, PTYPE[i]);
      }
      cols += s + '</div>';
    }
    let lines = '<div class="pms-hair" style="left:260px;top:157px;width:1160px"></div>';
    for (let i = 0; i < NROWS; i++) lines += '<div class="pms-hair" style="left:260px;top:' + (ROW(i) + 40) + 'px;width:1160px"></div>';
    const table = '<div style="position:absolute;inset:0;clip-path:inset(113px 20px 0 260px)">' + lines + '<div class="ac-scroll" style="position:absolute;left:0;top:0">' + cols + '</div></div>';
    const ui = columnsButton('ac-cb') + columnsPanel('ac-p0', ORDER0, [], false) + columnsPanel('ac-p1', ORDER1, [], true) + addColumnList('ac-list', L0, AC_OPTS);
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam ac-cam"><div class="pms-win">' + SHELL('projects-list') + table + ui + '<div class="pms-ring ac-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.ac-' + c);
    for (const c of ['cam', 'scroll', 'cb-hov', 'p0', 'p1', 'list', 'list-caret', 'p0-addbg', 'p1-addbg', 'p1-resetbg', 'ring', 'col-ptype']) this[c] = q(c);
    this.opts = AC_OPTS.map((_, i) => q('list-opt-' + i));
    this.hooks = (p, order) => order.map((k) => [k, q(p + '-tint-' + k), q(p + '-pinbg-' + k), q(p + '-xbg-' + k)]);
    this.h0 = this.hooks('p0', ORDER0); this.h1 = this.hooks('p1', ORDER1);
    this.shc = kit.stage.querySelector('.pms-sh-changed');
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.12, hold: 0.8, drift: [2, 0, 0.004] },      { t: 1.8, cx: 1190, cy: 360, z: 2.0, hold: 0.6, drift: [-3, 2, 0.002] },
      { t: 3.3, cx: 1190, cy: 560, z: 2.0, hold: 2.6, drift: [-2, 1, 0.002] },
      { t: 6.5, cx: 1190, cy: 380, z: 2.0, hold: 0.5, drift: [-2, 0, 0.002] },
      { t: 8.0, cx: 1195, cy: 440, z: 2.0, drift: [-1, 0, 0.003] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = KEYS;
    this.cur.clicks = [T.c1, T.c2, T.c3, T.c4];
  },
  render(t) {
    this.camera.apply(t);
    // Create view and the divider appear the moment the column is added.
    this.shc.style.visibility = t >= T.c3 ? 'visible' : 'hidden';
    const z = this.camera.at(t).z;
    const p = curAt(t);
    this['cb-hov'].style.opacity = fade15(t, (s) => inCols(curAt(s)));
    // The panel opens and closes instantly, and after the pick the 14-column layout replaces the first at once.
    const open = OPEN(t), added = ADDED(t), list = LIST(t);
    this.p0.style.visibility = open && !added ? 'visible' : 'hidden';
    this.p1.style.visibility = open && added ? 'visible' : 'hidden';
    const L = LAY(t), hit = open ? cpHit(L, p) : { row: null, btn: null };
    for (const [hooks, HL] of [[this.h0, L0], [this.h1, L1]]) for (const [k, tint, pin, x] of hooks) {
      const live = HL === L;
      tint.style.opacity = live && hit.row === k ? 1 : 0;
      const on = (b) => (s) => OPEN(s) && LAY(s) === HL && (() => { const h = cpHit(HL, curAt(s)); return h.row === k && h.btn === b; })();
      pin.style.opacity = live ? fade15(t, on('pin')) : 0;
      x.style.opacity = live ? fade15(t, on('x')) : 0;
    }
    const foot = (HL, reset, which) => (s) => OPEN(s) && LAY(s) === HL && acFootHit(HL, curAt(s), reset) === which;
    this['p0-addbg'].style.opacity = fade15(t, foot(L0, false, 'add'));
    this['p1-addbg'].style.opacity = fade15(t, foot(L1, true, 'add'));
    this['p1-resetbg'].style.opacity = fade15(t, foot(L1, true, 'reset'));
    // The Add Column list opens and closes instantly, its highlight follows the pointer at once, and the caret blinks.
    this.list.style.visibility = list ? 'visible' : 'hidden';
    const oi = list ? acOptHit(L0, p, AC_OPTS.length) : -1;
    this.opts.forEach((el, i) => { el.style.opacity = oi === i ? 1 : 0; });
    this['list-caret'].style.opacity = ((t - T.c2) % 1.0) < 0.5 ? 1 : 0;
    // Project type exists from the pick, then the scroller glides to its right end.
    this['col-ptype'].style.visibility = added ? 'visible' : 'hidden';
    this.scroll.style.transform = 'translateX(' + (-SCROLL * eio(seg(t, T.s0, T.s1))).toFixed(2) + 'px)';
    let g = null;
    for (const r of RINGS) if (t >= r[0] && t < r[1] + 0.25) g = r;
    const s = this.ring.style;
    if (g) {
      s.left = g[2] + 'px'; s.top = g[3] + 'px'; s.width = g[4] + 'px'; s.height = g[5] + 'px'; s.borderRadius = g[6] + 'px';
      s.opacity = Math.min(eo(seg(t, g[0], g[0] + 0.25)), 1 - seg(t, g[1], g[1] + 0.25));
    } else s.opacity = 0;
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
