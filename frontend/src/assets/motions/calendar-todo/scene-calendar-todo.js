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
const sv = (p, s, c) => '<svg width="' + s + '" height="' + s + '" viewBox="0 0 16 16" fill="none" style="flex:none;display:block;color:' + (c || 'currentColor') + '">' + p + '</svg>';
const P_X = '<path d="M12.1494 3.14648C12.3446 2.95126 12.6612 2.95135 12.8564 3.14648C13.0517 3.34175 13.0517 3.65825 12.8564 3.85352L8.70898 8.00098L12.8574 12.1494C13.0526 12.3446 13.0526 12.6612 12.8574 12.8564C12.6622 13.0516 12.3456 13.0517 12.1504 12.8564L8.00195 8.70801L3.85352 12.8564C3.65825 13.0517 3.34175 13.0517 3.14648 12.8564C2.95135 12.6612 2.95126 12.3446 3.14648 12.1494L7.29492 8.00098L3.14746 3.85352C2.95228 3.65827 2.95228 3.34173 3.14746 3.14648C3.34271 2.95137 3.65927 2.95132 3.85449 3.14648L8.00195 7.29395L12.1494 3.14648Z" fill="currentColor"/>';
const P_ADD = '<path d="M7.99805 3.5C8.27396 3.50026 8.49805 3.72402 8.49805 4V7.49805H12C12.2761 7.49805 12.5 7.7219 12.5 7.99805C12.4997 8.27396 12.276 8.49805 12 8.49805H8.49805V12C8.49805 12.276 8.27396 12.4997 7.99805 12.5C7.7219 12.5 7.49805 12.2761 7.49805 12V8.49805H4C3.72402 8.49805 3.50026 8.27396 3.5 7.99805C3.5 7.7219 3.72386 7.49805 4 7.49805H7.49805V4C7.49805 3.72386 7.7219 3.5 7.99805 3.5Z" fill="currentColor"/>';
const P_DOWN = '<path d="M4 6.25L8 10.25L12 6.25" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>';
const P_LEFT = '<path d="M10 3.75L6 8L10 12.25" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>';
const P_RIGHT = '<path d="M6 3.75L10 8L6 12.25" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>';
const P_OPEN = '<path fill="currentColor" fill-rule="evenodd" d="M8 13A5 5 0 1 0 8 3a5 5 0 0 0 0 10Zm0 2A7 7 0 1 0 8 1a7 7 0 0 0 0 14Z" clip-rule="evenodd"/>';
const P_TASKS = '<path d="M6.51172 1.41357C7.93179 1.09273 9.41817 1.23913 10.748 1.83154C11.0012 1.94435 11.1154 2.2414 11.0029 2.49463C10.89 2.74799 10.5922 2.8624 10.3389 2.74951C9.20691 2.24531 7.94212 2.11999 6.7334 2.39307C5.52452 2.66624 4.43611 3.32302 3.63086 4.26514C2.82561 5.20728 2.34625 6.3849 2.26465 7.62158C2.18318 8.85794 2.50354 10.0879 3.17773 11.1274C3.85223 12.1671 4.84541 12.9615 6.00781 13.3911C7.17041 13.8206 8.44134 13.8626 9.62988 13.5112C10.8184 13.1598 11.8614 12.4336 12.6035 11.4409C13.3455 10.4484 13.7472 9.24263 13.748 8.00342V7.42822C13.7482 7.15107 13.9728 6.92642 14.25 6.92627C14.5273 6.92627 14.7518 7.15098 14.752 7.42822V8.00342C14.7511 9.45944 14.28 10.8763 13.4082 12.0425C12.5364 13.2087 11.3104 14.0623 9.91406 14.4751C8.51802 14.8877 7.02571 14.8379 5.66016 14.3335C4.29447 13.8289 3.12838 12.8957 2.33594 11.6743C1.54358 10.4529 1.1669 9.00795 1.2627 7.55518C1.35856 6.10247 1.92132 4.71954 2.86719 3.61279C3.81312 2.50607 5.09165 1.73453 6.51172 1.41357ZM13.8945 2.64502C14.0904 2.44898 14.4082 2.4486 14.6045 2.64404C14.8006 2.83997 14.8012 3.15775 14.6055 3.354L8.35547 9.61084C8.2613 9.7051 8.13324 9.75827 8 9.7583C7.8669 9.75823 7.73865 9.70496 7.64453 9.61084L5.76953 7.73584C5.57397 7.53977 5.57385 7.22188 5.76953 7.02588C5.96557 6.82984 6.28431 6.83002 6.48047 7.02588L7.99902 8.54443L13.8945 2.64502Z" fill="currentColor"/>';
const P_CAL = '<path fill-rule="evenodd" clip-rule="evenodd" d="M4.23265 0.640137C4.50879 0.640137 4.73265 0.863994 4.73265 1.14014V2.21638V2.21646L5.00391 2.21638H10.9951C11.0886 2.21638 11.179 2.21638 11.2664 2.21646C11.2664 2.21644 11.2664 2.21641 11.2664 2.21638V1.14014C11.2664 0.863994 11.4902 0.640137 11.7664 0.640137C12.0425 0.640137 12.2664 0.863994 12.2664 1.14014V2.21638C12.2664 2.22071 12.2663 2.22502 12.2662 2.22932C12.8806 2.25212 13.289 2.31506 13.6301 2.48887C14.1005 2.72855 14.483 3.111 14.7226 3.58141C14.9951 4.11619 14.9951 4.81625 14.9951 6.21638V11.0164C14.9951 12.4165 14.9951 13.1166 14.7226 13.6514C14.483 14.1218 14.1005 14.5042 13.6301 14.7439C13.0953 15.0164 12.3952 15.0164 10.9951 15.0164H5.00391C3.60377 15.0164 2.90371 15.0164 2.36893 14.7439C1.89852 14.5042 1.51607 14.1218 1.27639 13.6514C1.00391 13.1166 1.00391 12.4165 1.00391 11.0164V6.21639C1.00391 4.81625 1.00391 4.11619 1.27639 3.58141C1.51607 3.111 1.89852 2.72855 2.36893 2.48887C2.71004 2.31506 3.11841 2.25212 3.73281 2.22933L3.73265 2.21638V1.14014C3.73265 0.863994 3.9565 0.640137 4.23265 0.640137ZM5.00391 3.21638H10.9951C11.7117 3.21638 12.189 3.21716 12.5557 3.24712C12.9107 3.27613 13.0732 3.32743 13.1761 3.37987C13.4583 3.52368 13.6878 3.75315 13.8316 4.0354C13.8841 4.13832 13.9354 4.30078 13.9644 4.65582C13.9916 4.98926 13.9947 5.41411 13.9951 6.02714C13.9702 6.02334 13.9448 6.02137 13.9189 6.02137H2.08015C2.05424 6.02137 2.02879 6.02334 2.00395 6.02714C2.00429 5.41411 2.0074 4.98926 2.03465 4.65582C2.06365 4.30078 2.11496 4.13832 2.1674 4.0354C2.31121 3.75315 2.54068 3.52368 2.82292 3.37987C2.92584 3.32743 3.0883 3.27613 3.44334 3.24712C3.81006 3.21716 4.28734 3.21638 5.00391 3.21638ZM2.00391 7.01559V11.0164C2.00391 11.733 2.00468 12.2102 2.03465 12.5769C2.06365 12.932 2.11496 13.0944 2.1674 13.1974C2.31121 13.4796 2.54068 13.7091 2.82292 13.8529C2.92584 13.9053 3.0883 13.9566 3.44334 13.9856C3.81006 14.0156 4.28734 14.0164 5.00391 14.0164H10.9951C11.7117 14.0164 12.189 14.0156 12.5557 13.9856C12.9107 13.9566 13.0732 13.9053 13.1761 13.8529C13.4583 13.7091 13.6878 13.4796 13.8316 13.1974C13.8841 13.0944 13.9354 12.932 13.9644 12.5769C13.9943 12.2102 13.9951 11.7329 13.9951 11.0164V7.01559C13.9703 7.0194 13.9448 7.02137 13.9189 7.02137H2.08015C2.05423 7.02137 2.02877 7.0194 2.00391 7.01559Z" fill="currentColor"/>';
const P_MILE = '<path fill-rule="evenodd" clip-rule="evenodd" d="M7.50519 0.788033C7.77856 0.514665 8.22177 0.514667 8.49514 0.788033L15.2123 7.50519C15.4857 7.77856 15.4857 8.22177 15.2123 8.49514L11.8537 11.8537L8.49514 15.2123C8.22177 15.4857 7.77856 15.4857 7.50519 15.2123L4.14661 11.8537L0.788033 8.49514C0.514665 8.22177 0.514667 7.77856 0.788033 7.50519L4.14661 4.14661L7.50519 0.788033ZM8.00016 1.70727L4.85372 4.85372L1.70727 8.00016L4.85372 11.1466L8.00017 14.2931L11.1466 11.1466L14.2931 8.00016L8.00016 1.70727Z" fill="currentColor"/>';
const G = (x, y, w, h, r) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;background:var(--color-surface-gray-3)"></div>';
const GT = (x, cy, w) => G(x, cy - 5, w, 10, 5);
const GS = (x, cy, w) => G(x, cy - 4, w, 8, 4);
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
const TABS = [[260, 62.7], [346.7, 60.1], [430.8, 57.2], [512, 35.3], [571.3, 48.4], [643.7, 39.2], [706.9, 35.9], [766.7, 42.1], [832.8, 65.3], [922.1, 65.7]];
const ghostTabs = () => TABS.map(([x, w]) => GT(x, 76.5, w)).join('') + HL(240, 96, 899) + '<div class="pms-abs" style="left:346.7px;top:95px;width:60.1px;height:1px;background:var(--color-ink-gray-7)"></div>';
const COL = 128.4;
const WEEKS = [[206.1, 71], [277.1, 71], [348.1, 89], [437.1, 71], [508.1, 70]];
const calendar = () => {
  let s = '<div class="pms-abs" style="left:882px;top:206.1px;width:257px;height:372px;background:var(--color-surface-gray-1)"></div>';
  s += GT(268, 143, 106) + GI(384, 143) + GI(741, 143) + GT(770, 143, 39) + GI(824, 143);
  s += G(853.4, 129, 178.5, 28, 10) + G(1040.4, 129, 58.6, 28, 8) + GI(1106, 143);
  for (let i = 0; i < 7; i++) s += GT(240 + COL * i + COL / 2 - 12, 189, 24);
  s += HL(240, 205.1, 899);
  WEEKS.forEach(([y, h], r) => {
    if (r < 4) s += HL(240, y + h - 1, 899);
    for (let i = 0; i < 7; i++) {
      if (i < 6) s += '<div class="pms-abs" style="left:' + (240 + COL * (i + 1) - 1) + 'px;top:' + y + 'px;width:1px;height:' + (h - (r < 4 ? 1 : 0)) + 'px;background:var(--color-outline-gray-1)"></div>';
      s += GT(240 + COL * i + 102, y + 18, 14);
    }
  });
  return s + G(240 + COL * 2 + 6, 382.1, 115.4, 23, 8) + G(240 + COL * 4 + 6, 382.1, 115.4, 23, 8);
};
const ROW1 = 689.1, ROW2 = 742.1;
const todoCell = () => {
  let s = '<div class="pms-abs ct-rowh" style="left:260px;top:715.6px;width:859px;height:52.5px;background:var(--color-surface-gray-1);opacity:0"></div>';
  s += '<div class="pms-abs" style="left:264px;top:595.1px;width:192.3px;height:28px;border-radius:10px;background:var(--color-surface-gray-2)"></div>';
  s += '<div class="pms-abs" style="left:265px;top:596.1px;width:89.5px;height:26px;border-radius:10px;background:var(--color-surface-white);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:420;line-height:16.1px;color:var(--color-ink-gray-8)">Milestones</div>';
  s += GT(366, 609, 79) + G(1032.8, 595.1, 82.2, 28, 8);
  s += GS(268, 649, 26) + GS(530, 649, 29) + GS(583.2, 649, 60) + GS(659.5, 649, 76) + GS(751.8, 649, 65) + GI(823.5, 649) + GS(915.8, 649, 48) + GS(1047, 649, 58);
  s += '<div class="pms-abs" style="left:851.3px;top:641.6px;font-size:13px;font-weight:420;line-height:15px;color:var(--color-ink-gray-5);white-space:nowrap">ToDos</div>';
  s += HL(260, 661.6, 859) + HL(260, 714.6, 859);
  s += GI(268, ROW1) + GT(290, ROW1, 72) + GT(530, ROW1, 37) + GT(583.2, ROW1, 36) + GT(659.5, ROW1, 36) + GT(751.8, ROW1, 14) + GI(860.3, ROW1) + GT(883.3, ROW1, 8) + G(915.8, ROW1 - 8, 16, 16, 8) + GT(937.8, ROW1, 38);
  s += '<div class="pms-abs" style="left:268px;top:' + (ROW2 - 7) + 'px;color:var(--color-ink-gray-8)">' + sv(P_MILE, 14) + '</div>';
  s += '<div class="pms-abs" style="left:290px;top:734px;font-size:14px;font-weight:500;line-height:16.1px;color:var(--color-ink-gray-8);white-space:nowrap">UAT sign-off</div>';
  s += GT(530, ROW2, 37) + GT(583.2, ROW2, 36) + GT(659.5, ROW2, 36) + GT(751.8, ROW2, 14) + G(915.8, ROW2 - 8, 16, 16, 8) + GT(937.8, ROW2, 80);
  s += '<div class="pms-abs ct-plus" style="left:851.3px;top:728.1px;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-8)">' + sv(P_ADD, 16) + '</div>';
  s += '<div class="pms-abs ct-cnt" style="left:851.3px;top:728.1px;width:45.7px;height:28px;box-sizing:border-box;padding:0 8px;border-radius:8px;display:none;align-items:center;gap:8px;font-size:14px;font-weight:420;line-height:16.1px;color:var(--color-ink-gray-8)">' + sv(P_TASKS, 16) + '<span>1</span></div>';
  return s;
};
const DAYS = [[27, 28, 29, 30, 1, 2, 3], [4, 5, 6, 7, 8, 9, 10], [11, 12, 13, 14, 15, 16, 17], [18, 19, 20, 21, 22, 23, 24], [25, 26, 27, 28, 29, 30, 31]];
const popup = (cls, x, y, pick) => {
  let s = '<div class="pms-abs ' + cls + '" style="left:' + x + 'px;top:' + y + 'px;width:242px;height:323px;border-radius:12px;background:var(--color-surface-white);box-shadow:inset 0 0 0 1px var(--color-outline-gray-1),0 1px 3px rgba(0,0,0,.05),0 10px 24px -3px rgba(0,0,0,.1);font-size:13px;font-weight:420;visibility:hidden">';
  s += '<div class="pms-abs" style="left:17px;top:15.5px;font-weight:500;line-height:15px;color:var(--color-ink-gray-7)">Oct 2026</div>';
  s += '<div class="pms-abs" style="left:177px;top:9px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-6)">' + sv(P_LEFT, 16) + '</div>';
  s += '<div class="pms-abs" style="left:205px;top:9px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-6)">' + sv(P_RIGHT, 16) + '</div>';
  const cell = (cx, cy, c, st) => '<div class="pms-abs" style="left:' + cx + 'px;top:' + cy + 'px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px;' + st + '">' + c + '</div>';
  ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d, i) => { s += cell(9 + 32 * i, 45, d, 'height:24px;font-size:12px;font-weight:500;color:var(--color-ink-gray-4)'); });
  DAYS.forEach((row, r) => row.forEach((d, c) => {
    const prev = r === 0 && d > 20;
    const st = prev ? 'color:var(--color-ink-gray-3)' : d === 29 ? 'font-weight:700;color:var(--color-ink-gray-8)' : 'color:var(--color-ink-gray-8)';
    s += cell(9 + 32 * c, 73 + 32 * r, d, st + (d === pick && !prev ? '" data-pick="1' : ''));
  }));
  s += '<div class="pms-abs" style="left:9px;top:241px;width:224px;height:28px;border-radius:8px;background:var(--color-surface-gray-2);display:flex;align-items:center;justify-content:space-between;padding:0 9px;box-sizing:border-box;font-size:14px;color:var(--color-ink-gray-4)"><span>Select Time</span>' + sv(P_DOWN, 16) + '</div>';
  s += HL(0, 277, 242);
  const btn = (bx, w, l) => '<div class="pms-abs" style="left:' + bx + 'px;top:286px;width:' + w + 'px;height:28px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--color-ink-gray-8)">' + l + '</div>';
  return s + btn(9, 47.8, 'Now') + btn(60.8, 84.1, 'Tomorrow') + '</div>';
};
const RING = [ // [from, to, left, top, width, height, radius] in window coordinates
  [1.25, 1.7, 846.3, 723.1, 38, 38, 11],
  [2.3, 3.7, 483, 587.1, 362, 42, 11],
  [3.85, 4.35, 483, 261, 474, 42, 11],
  [5.85, 6.25, 822.7, 507.1, 79.7, 42, 11],
  [6.65, 7.15, 864, 680, 42, 42, 11],
  [7.5, 7.95, 661.3, 547.1, 73.5, 42, 11],
  [8.4, 8.85, 830, 357, 42, 42, 11],
  [9.25, 9.75, 483, 677.1, 474, 38, 11],
  [10.5, 99, 846.3, 723.1, 55.7, 38, 11],
];
const T = { plus: 1.65, title: 4.35, type: 4.55, start: 6.2, d12: 7.1, end: 7.9, d16: 8.8, create: 9.7, done: 10.3 };
const S = (x, y) => [x + 240, y + 90];
const mix = (a, b, p) => 'color-mix(in srgb, var(--color-' + a + '), var(--color-' + b + ') ' + p * 100 + '%)';
const hov = (t, a, b) => eo(seg(t, a, a + 0.15)) * (1 - seg(t, b, b + 0.15));
const ctl = (extra) => 'display:flex;align-items:center;box-sizing:border-box;border-radius:8px;background:var(--color-surface-gray-2);font-size:14px;font-weight:420;white-space:nowrap;color:var(--color-ink-gray-8);' + extra;
const dateBtn = (cls, label) => '<div class="' + cls + '" style="' + ctl('height:32px;padding:0 8px;gap:8px;flex:none;color:var(--color-ink-gray-7)') + '"><span class="' + cls + '-tx">' + label + '</span>' + sv(P_CAL, 16) + '</div>';
kit.scene('calendar-todo', {
  init(kit) {
    const field = 'margin-top:16px;height:16.1px;font-size:14px;line-height:16.1px;';
    const controls = '<div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;width:464px">' +
      '<div style="' + ctl('width:99.7px;height:28px;padding:0 8px;gap:8px;flex:none') + '">' + sv(P_OPEN, 14, 'var(--color-ink-gray-5)') + '<span>Open</span><span style="margin-left:auto">' + sv(P_DOWN, 16) + '</span></div>' +
      '<div style="' + ctl('position:relative;width:224px;height:32px;flex:none') + '"><span class="pms-abs" style="left:8.3px;top:8px;width:16px;height:16px;border-radius:8px;background:var(--color-surface-gray-3)"></span><span class="pms-abs" style="left:32px;top:11px;width:66px;height:10px;border-radius:5px;background:var(--color-surface-gray-3)"></span><span class="pms-abs" style="right:4px;top:8px">' + sv(P_DOWN, 16, 'var(--color-ink-gray-5)') + '</span></div>' +
      dateBtn('ct-start', 'Start') + dateBtn('ct-end', 'End') +
      '<div style="' + ctl('width:111.2px;height:28px;padding:0 8px;gap:8px;flex:none') + '"><span style="width:8px;height:8px;border-radius:4px;background:var(--color-surface-amber-5)"></span><span>Medium</span><span style="margin-left:auto">' + sv(P_DOWN, 16) + '</span></div>' +
      '<div style="' + ctl('position:relative;width:352px;height:32px;flex:none') + '">' +
      '<span class="pms-abs" style="left:9px;top:0;height:32px;display:flex;align-items:center;gap:7px;color:var(--color-ink-gray-6)">' + sv(P_MILE, 16) + '<span style="color:var(--color-ink-gray-8)">UAT sign-off</span></span>' +
      '<span class="pms-abs" style="left:305px;top:9px;color:var(--color-ink-gray-5)">' + sv(P_X, 14) + '</span>' +
      '<span class="pms-abs" style="left:328px;top:8px;color:var(--color-ink-gray-5)">' + sv(P_DOWN, 16) + '</span></div></div>';
    const dlg = '<div class="pms-abs ct-d" style="left:464px;width:512px;box-sizing:border-box;padding:0 24px;border-radius:16px;background:var(--color-surface-modal);box-shadow:0 0 1px rgba(0,0,0,.19),0 1px 2px rgba(0,0,0,.07),0 6px 15px -5px rgba(0,0,0,.11);opacity:0;visibility:hidden">' +
      '<div style="position:relative;height:24px;margin-top:21.9px;font-size:20px;font-weight:600;line-height:24px;color:var(--color-ink-gray-8);white-space:nowrap">Add ToDo<div class="pms-abs" style="left:432px;top:-2px;width:32px;height:28px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-8)">' + sv(P_X, 16) + '</div></div>' +
      '<div style="margin-top:18px;height:16.1px;font-size:14px;line-height:16.1px;color:var(--color-ink-gray-7)">Title<span style="color:var(--color-ink-red-4);margin-left:2px">*</span></div>' +
      '<div style="margin-top:6px;height:32px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;padding:0 10px;display:flex;align-items:center;font-size:14px;font-weight:420;white-space:nowrap"><span class="ct-ti-tx" style="color:var(--color-ink-gray-8)"></span><span class="ct-ti-caret" style="width:1px;height:16px;margin-right:-1px;background:var(--color-ink-gray-8);visibility:hidden"></span><span class="ct-ti-ph" style="color:var(--color-ink-gray-4)">Add a title</span></div>' +
      '<div style="' + field + 'color:var(--color-ink-gray-5)">Description</div>' +
      '<div style="margin-top:6px;height:160px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:10px;padding:11px 8px;font-size:14px;line-height:16.1px;color:var(--color-ink-gray-4)">Add a description...</div>' +
      controls +
      '<div class="ct-create" style="' + ctl('margin-top:40px;height:28px;justify-content:center;gap:8px;background:var(--color-surface-gray-7);color:var(--color-ink-white)') + '"><span class="ct-sp" style="display:none">' + sv('<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="22 16" stroke-linecap="round"/>', 16) + '</span><span>Create</span></div>' +
      '<div style="height:28px"></div></div>';
    const page = '<div class="pms-abs" style="inset:0">' + SHELL('project-detail') + ghostTabs() + calendar() + todoCell() + ghostPanel() +
      '<div class="pms-abs ct-ov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;visibility:hidden"></div>' + dlg +
      popup('ct-p1', 828, 548, 12) + popup('ct-p2', 666, 225, 16) + '<div class="pms-ring ct-ring"></div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam ct-cam"><div class="pms-win">' + page + '</div></div></div>'));
    const q = (c) => kit.stage.querySelector('.ct-' + c);
    for (const k of ['cam', 'ov', 'd', 'ring', 'ti-tx', 'ti-caret', 'ti-ph', 'start', 'start-tx', 'end', 'end-tx', 'p1', 'p2', 'create', 'sp', 'plus', 'cnt', 'rowh']) this[k] = q(k);
    this.d12 = this.p1.querySelector('[data-pick]');
    this.d16 = this.p2.querySelector('[data-pick]');
    this.ty = kit.typist('Confirm test plan', T.type, 18);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.1, hold: 0.3 },
      { t: 1.1, cx: 880, cy: 670, z: 1.7, hold: 0.6 },
      { t: 2.4, cx: 960, cy: 600, z: 1.45, hold: 7.9 },
      { t: 11.1, cx: 880, cy: 670, z: 1.7 },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: S(1000, 400) }, { t: 0.45, at: S(1000, 400) }, { t: 1.3, at: S(865.3, 742.1) }, { t: 3.55, at: S(865.3, 742.1) },
      { t: 4.3, at: S(900, 282) }, { t: 5.3, at: S(900, 282) },
      { t: 6.1, at: S(862.5, 528) }, { t: 6.3, at: S(862.5, 528) },
      { t: 7.0, at: S(885, 701) }, { t: 7.2, at: S(885, 701) },
      { t: 7.8, at: S(698, 568) }, { t: 8.0, at: S(698, 568) },
      { t: 8.7, at: S(851, 378) }, { t: 8.9, at: S(851, 378) },
      { t: 9.6, at: S(720, 696) }, { t: 10.55, at: S(720, 696) },
      { t: 11.4, at: S(1000, 545) },
    ];
    this.cur.clicks = [T.plus, T.title, T.start, T.d12, T.end, T.d16, T.create];
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const o = eo(seg(t, T.plus, T.plus + 0.15)) * (1 - seg(t, T.done, T.done + 0.15));
    const grown = t >= T.d16;
    const h = grown ? 576 : 540.2;
    this.d.style.top = (450 - h / 2) + 'px';
    this.d.style.height = h + 'px';
    this.d.style.opacity = o;
    this.d.style.visibility = o > 0 ? 'visible' : 'hidden';
    this.d.style.transform = 'scale(' + lerp(0.98, 1, eo(seg(t, T.plus, T.plus + 0.15))) + ')';
    this.ov.style.opacity = o;
    this.ov.style.visibility = o > 0 ? 'visible' : 'hidden';
    // + button and row hover, then the count that replaces it
    const added = t >= T.done;
    this.rowh.style.opacity = hov(t, 1.15, 3.3);
    this.plus.style.display = added ? 'none' : 'flex';
    this.plus.style.background = 'color-mix(in srgb, var(--color-surface-gray-3) ' + hov(t, 1.2, 1.8) * 100 + '%, transparent)';
    this.cnt.style.display = added ? 'flex' : 'none';
    // title text and caret
    const typed = this.ty.at(t);
    this['ti-tx'].textContent = typed;
    this['ti-ph'].style.display = typed ? 'none' : '';
    const typing = t >= T.type && t < this.ty.end + 0.1;
    this['ti-caret'].style.visibility = t >= T.title && t < T.start && (typing || Math.floor(t * 2) % 2 === 0) ? 'visible' : 'hidden';
    // dates
    this['start-tx'].textContent = t >= T.d12 ? '2026-10-12 12:00 am' : 'Start';
    this['end-tx'].textContent = t >= T.d16 ? '2026-10-16 12:00 am' : 'End';
    this.start.style.background = mix('surface-gray-2', 'surface-gray-3', hov(t, 6.1, T.start));
    this.end.style.background = mix('surface-gray-2', 'surface-gray-3', hov(t, 7.8, T.end));
    const vis = (el, on) => { el.style.visibility = on ? 'visible' : 'hidden'; };
    vis(this.p1, t >= T.start && t < T.d12);
    vis(this.p2, t >= T.end && t < T.d16);
    this.d12.style.background = t >= 7.0 && t < T.d12 ? 'var(--color-surface-gray-2)' : 'transparent';
    this.d16.style.background = t >= 8.7 && t < T.d16 ? 'var(--color-surface-gray-2)' : 'transparent';
    // create button and saving state
    const saving = t >= T.create && t < T.done;
    this.sp.style.display = saving ? 'block' : 'none';
    this.sp.firstChild.style.transform = 'rotate(' + (t * 420) % 360 + 'deg)';
    this.create.style.background = mix('surface-gray-7', 'surface-gray-6', hov(t, 9.6, T.create));
    // rings
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
