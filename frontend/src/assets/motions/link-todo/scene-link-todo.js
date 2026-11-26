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
const P_PLUS = '<path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>';
const P_DOWN = '<path d="M4 6.25L8 10.25L12 6.25" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>';
const P_LEFT = '<path d="M10 3.75L6 8L10 12.25" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>';
const P_RIGHT = '<path d="M6 3.75L10 8L6 12.25" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>';
const P_OPEN = '<path fill="currentColor" fill-rule="evenodd" d="M8 13A5 5 0 1 0 8 3a5 5 0 0 0 0 10Zm0 2A7 7 0 1 0 8 1a7 7 0 0 0 0 14Z" clip-rule="evenodd"/>';
const P_CAL = '<path fill-rule="evenodd" clip-rule="evenodd" d="M4.23265 0.640137C4.50879 0.640137 4.73265 0.863994 4.73265 1.14014V2.21638V2.21646L5.00391 2.21638H10.9951C11.0886 2.21638 11.179 2.21638 11.2664 2.21646C11.2664 2.21644 11.2664 2.21641 11.2664 2.21638V1.14014C11.2664 0.863994 11.4902 0.640137 11.7664 0.640137C12.0425 0.640137 12.2664 0.863994 12.2664 1.14014V2.21638C12.2664 2.22071 12.2663 2.22502 12.2662 2.22932C12.8806 2.25212 13.289 2.31506 13.6301 2.48887C14.1005 2.72855 14.483 3.111 14.7226 3.58141C14.9951 4.11619 14.9951 4.81625 14.9951 6.21638V11.0164C14.9951 12.4165 14.9951 13.1166 14.7226 13.6514C14.483 14.1218 14.1005 14.5042 13.6301 14.7439C13.0953 15.0164 12.3952 15.0164 10.9951 15.0164H5.00391C3.60377 15.0164 2.90371 15.0164 2.36893 14.7439C1.89852 14.5042 1.51607 14.1218 1.27639 13.6514C1.00391 13.1166 1.00391 12.4165 1.00391 11.0164V6.21639C1.00391 4.81625 1.00391 4.11619 1.27639 3.58141C1.51607 3.111 1.89852 2.72855 2.36893 2.48887C2.71004 2.31506 3.11841 2.25212 3.73281 2.22933L3.73265 2.21638V1.14014C3.73265 0.863994 3.9565 0.640137 4.23265 0.640137ZM5.00391 3.21638H10.9951C11.7117 3.21638 12.189 3.21716 12.5557 3.24712C12.9107 3.27613 13.0732 3.32743 13.1761 3.37987C13.4583 3.52368 13.6878 3.75315 13.8316 4.0354C13.8841 4.13832 13.9354 4.30078 13.9644 4.65582C13.9916 4.98926 13.9947 5.41411 13.9951 6.02714C13.9702 6.02334 13.9448 6.02137 13.9189 6.02137H2.08015C2.05424 6.02137 2.02879 6.02334 2.00395 6.02714C2.00429 5.41411 2.0074 4.98926 2.03465 4.65582C2.06365 4.30078 2.11496 4.13832 2.1674 4.0354C2.31121 3.75315 2.54068 3.52368 2.82292 3.37987C2.92584 3.32743 3.0883 3.27613 3.44334 3.24712C3.81006 3.21716 4.28734 3.21638 5.00391 3.21638ZM2.00391 7.01559V11.0164C2.00391 11.733 2.00468 12.2102 2.03465 12.5769C2.06365 12.932 2.11496 13.0944 2.1674 13.1974C2.31121 13.4796 2.54068 13.7091 2.82292 13.8529C2.92584 13.9053 3.0883 13.9566 3.44334 13.9856C3.81006 14.0156 4.28734 14.0164 5.00391 14.0164H10.9951C11.7117 14.0164 12.189 14.0156 12.5557 13.9856C12.9107 13.9566 13.0732 13.9053 13.1761 13.8529C13.4583 13.7091 13.6878 13.4796 13.8316 13.1974C13.8841 13.0944 13.9354 12.932 13.9644 12.5769C13.9943 12.2102 13.9951 11.7329 13.9951 11.0164V7.01559C13.9703 7.0194 13.9448 7.02137 13.9189 7.02137H2.08015C2.05423 7.02137 2.02877 7.0194 2.00391 7.01559Z" fill="currentColor"/>';
const P_DOTS = '<path fill-rule="evenodd" clip-rule="evenodd" d="M4.5 8C4.5 8.82843 3.82843 9.5 3 9.5C2.17157 9.5 1.5 8.82843 1.5 8C1.5 7.17157 2.17157 6.5 3 6.5C3.82843 6.5 4.5 7.17157 4.5 8ZM8 9.5C8.82843 9.5 9.5 8.82843 9.5 8C9.5 7.17157 8.82843 6.5 8 6.5C7.17157 6.5 6.5 7.17157 6.5 8C6.5 8.82843 7.17157 9.5 8 9.5ZM13 9.5C13.8284 9.5 14.5 8.82843 14.5 8C14.5 7.17157 13.8284 6.5 13 6.5C12.1716 6.5 11.5 7.17157 11.5 8C11.5 8.82843 12.1716 9.5 13 9.5Z" fill="currentColor"/>';
const P_MILE = '<path fill-rule="evenodd" clip-rule="evenodd" d="M7.50519 0.788033C7.77856 0.514665 8.22177 0.514667 8.49514 0.788033L15.2123 7.50519C15.4857 7.77856 15.4857 8.22177 15.2123 8.49514L11.8537 11.8537L8.49514 15.2123C8.22177 15.4857 7.77856 15.4857 7.50519 15.2123L4.14661 11.8537L0.788033 8.49514C0.514665 8.22177 0.514667 7.77856 0.788033 7.50519L4.14661 4.14661L7.50519 0.788033ZM8.00016 1.70727L4.85372 4.85372L1.70727 8.00016L4.85372 11.1466L8.00017 14.2931L11.1466 11.1466L14.2931 8.00016L8.00016 1.70727Z" fill="currentColor"/>';
const P_ZAP = '<path fill-rule="evenodd" clip-rule="evenodd" d="M7.52006 1.2421C8.01928 0.631261 9.00203 1.10627 8.83347 1.87695L8.03545 5.52574L14.3198 6.412C14.4986 6.43721 14.6499 6.55685 14.7157 6.72501C14.7814 6.89316 14.7514 7.0837 14.6372 7.22351L8.47994 14.7574C7.98072 15.3683 6.99797 14.8932 7.16653 14.1226L7.96455 10.4738L1.68018 9.58751C1.50139 9.5623 1.35009 9.44266 1.28434 9.2745C1.21858 9.10635 1.24859 8.91581 1.36285 8.77601L7.52006 1.2421ZM7.6334 2.68367L2.69904 8.7213L8.638 9.55885C8.77578 9.57828 8.89922 9.65424 8.97867 9.76847C9.05811 9.88269 9.08636 10.0249 9.05664 10.1608L8.3666 13.3158L13.301 7.27821L7.362 6.44066C7.22422 6.42123 7.10078 6.34527 7.02133 6.23105C6.94189 6.11682 6.91364 5.97465 6.94336 5.83873L7.6334 2.68367Z" fill="currentColor"/>';
const P_LEAF = '<path d="M11.7773 1.05615C11.9646 1.05109 12.1393 1.15171 12.2295 1.31592C13.6048 3.82105 13.947 6.91093 13.2842 9.4165C12.6193 11.9293 10.8976 13.9605 8.10352 14.0532C7.82767 14.0623 7.59626 13.8456 7.58691 13.5698C7.57789 13.2939 7.79438 13.0633 8.07031 13.0542C10.277 12.981 11.7229 11.4073 12.3174 9.16064C12.8449 7.16681 12.6638 4.72601 11.748 2.60889C10.9087 3.78251 9.76533 4.36843 8.66699 4.854C7.38975 5.41865 6.23469 5.83827 5.36523 6.78857L5.19531 6.98584C4.66851 7.63509 4.27734 8.50095 4.27734 9.41064C4.27754 10.512 4.76382 11.4979 5.53223 12.1665C6.59106 11.3216 7.73558 10.1168 8.67383 8.42432C8.80771 8.18286 9.11203 8.09518 9.35352 8.229C9.59502 8.36288 9.6817 8.66718 9.54785 8.90869C8.43804 10.9107 7.05619 12.2841 5.81836 13.2075C5.8088 13.2143 5.79999 13.222 5.79004 13.228C5.54619 13.4089 5.30936 13.574 5.08008 13.7212C4.3807 14.1701 3.76343 14.4691 3.31738 14.6567C3.09422 14.7506 2.91308 14.8166 2.78613 14.8599C2.72284 14.8814 2.67301 14.8979 2.6377 14.9087C2.62002 14.9141 2.60584 14.9184 2.5957 14.9214C2.59065 14.9229 2.58612 14.9234 2.58301 14.9243C2.58156 14.9247 2.58011 14.925 2.5791 14.9253L2.57812 14.9263H2.57715C2.3109 14.9995 2.03516 14.8429 1.96191 14.5767C1.88895 14.3106 2.04555 14.0357 2.31152 13.9624L2.31641 13.9604C2.32189 13.9589 2.33185 13.9566 2.34473 13.9526C2.37051 13.9447 2.41081 13.9317 2.46387 13.9136C2.5705 13.8772 2.72955 13.819 2.92969 13.7349C3.33048 13.5663 3.8956 13.293 4.54004 12.8794C4.59569 12.8437 4.65124 12.8059 4.70801 12.7681C3.82704 11.9224 3.27753 10.7309 3.27734 9.41064C3.27734 8.22098 3.78225 7.13956 4.41797 6.35596C5.49286 5.03062 7.00265 4.49698 8.2627 3.93994C9.55174 3.37006 10.6627 2.75709 11.3408 1.34033L11.375 1.27979C11.464 1.14554 11.6135 1.06081 11.7773 1.05615Z" fill="currentColor"/>';
const G = (x, y, w, h, r) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;background:var(--color-surface-gray-3)"></div>';
const GT = (x, cy, w) => G(x, cy - 5, w, 10, 5);
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
const ghostTabs = () => TABS.map(([x, w]) => GT(x, 76.5, w)).join('') + HL(240, 96, 899) + '<div class="pms-abs" style="left:766.7px;top:95px;width:42.1px;height:1px;background:var(--color-ink-gray-7)"></div>';
const ROW = 81.09375;
const ghostRow = (T, tw) => {
  let s = GT(260, T + 24, tw) + G(260, T + 42.1, 16, 16, 8) + GT(282, T + 50.1, 66) + GI(367, T + 50.1) + GT(387, T + 50.1, 95) + GI(508, T + 50.1) + GT(528, T + 50.1, 95) + G(649.4, T + 46.1, 8, 8, 4) + GT(663, T + 50.1, 46);
  s += G(1055, T + 30, 20, 20, 10) + GI(1098, T + 40);
  return s + '<div class="pms-abs" style="left:260px;top:' + (T + 80.1) + 'px;width:859px;height:1px;background:var(--color-outline-gray-2)"></div>';
};
const ghostList = () => [60, 90, 52, 70, 48, 118, 36, 118, 42].map((w, k) => ghostRow(165 + ROW * k, w)).join('');
const newRow = () => {
  const T = 165;
  const dot = '<span style="color:var(--color-ink-gray-5)">·</span>';
  const cal = (txt) => '<span style="display:flex;align-items:center;gap:6px">' + sv(P_CAL, 14) + txt + '</span>';
  return '<div class="pms-abs lt-new" style="left:0;top:0;width:1440px;height:900px;visibility:hidden">' +
    '<div class="pms-abs" style="left:260px;top:' + (T + 16) + 'px;font-size:14px;font-weight:500;line-height:16.1px;color:var(--color-ink-gray-8);white-space:nowrap">Confirm UAT sign-off</div>' +
    '<div class="pms-abs" style="left:260px;top:' + (T + 36.1) + 'px;height:28px;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:420;line-height:15px;color:var(--color-ink-gray-5);white-space:nowrap">' +
    '<span style="display:flex;align-items:center;gap:6px"><span style="width:16px;height:16px;border-radius:8px;background:var(--color-surface-gray-3)"></span><span style="width:65.6px;height:8px;border-radius:4px;background:var(--color-surface-gray-3)"></span></span>' + dot +
    cal('12 Oct, 12:00 am') + dot + cal('16 Oct, 12:00 am') + dot +
    '<span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:4px;background:var(--color-surface-amber-5)"></span>Medium</span>' + dot +
    '<span class="lt-chip" style="position:relative;height:28px;padding:0 8px;border-radius:8px;display:flex;align-items:center;gap:6px;color:var(--color-ink-gray-5)">' + sv(P_MILE, 14) + 'UAT sign-off' +
    '<div class="pms-ring lt-cr" style="left:-5px;top:-5px;right:-5px;bottom:-5px;opacity:0"></div></span></div>' +
    '<div class="pms-abs" style="left:1055px;top:' + (T + 30) + 'px;color:var(--color-ink-gray-5)">' + sv(P_OPEN, 20) + '</div>' +
    '<div class="pms-abs" style="left:1097px;top:' + (T + 32) + 'px;color:var(--color-ink-gray-8)">' + sv(P_DOTS, 16) + '</div>' +
    '<div class="pms-abs" style="left:260px;top:' + (T + 80.1) + 'px;width:859px;height:1px;background:var(--color-outline-gray-2)"></div></div>';
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
const LINKS = [['Milestones', 7, [['Beta release', 36.8, P_MILE], ['UAT sign-off', 64.9, P_MILE]]], ['Touchpoints', 93, [['Weekly check-in', 122.8, P_ZAP]]], ['Growth initiatives', 150.9, [['Analytics upsell', 180.7, P_LEAF]]]];
const dropdown = (x, y) => {
  let s = '<div class="pms-abs lt-dd" style="left:' + x + 'px;top:' + y + 'px;width:352px;height:214px;border-radius:12px;background:var(--color-surface-white);box-shadow:inset 0 0 0 1px var(--color-surface-gray-2),0 1px 3px rgba(0,0,0,.05),0 10px 24px -3px rgba(0,0,0,.1);visibility:hidden">';
  LINKS.forEach(([name, hy, opts]) => {
    s += '<div class="pms-abs" style="left:15px;top:' + (hy + 8) + 'px;font-size:12px;font-weight:600;line-height:14px;color:var(--color-ink-gray-5);white-space:nowrap">' + name + '</div>';
    opts.forEach(([label, oy, p]) => {
      s += '<div class="pms-abs' + (label === 'UAT sign-off' ? ' lt-opt' : '') + '" style="left:7px;top:' + oy + 'px;width:338px;height:28.1px;border-radius:8px"></div>' +
        '<div class="pms-abs" style="left:17px;top:' + (oy + 6.1) + 'px;color:var(--color-ink-gray-6)">' + sv(p, 16) + '</div>' +
        '<div class="pms-abs" style="left:45px;top:' + (oy + 6) + 'px;font-size:14px;font-weight:420;line-height:16.1px;color:var(--color-ink-gray-8);white-space:nowrap">' + label + '</div>';
    });
  });
  return s + '</div>';
};
const RING = [ // [from, to, left, top, width, height, radius] in window coordinates
  [0.8, 1.55, 1006, 108, 118, 38, 11],
  [1.95, 2.55, 483, 261, 474, 42, 11],
  [4.1, 4.55, 822.7, 507.1, 79.7, 42, 11],
  [4.95, 5.45, 864, 680, 42, 42, 11],
  [5.8, 6.25, 661.3, 547.1, 73.5, 42, 11],
  [6.7, 7.15, 830, 357, 42, 42, 11],
  [7.55, 8.05, 483, 605.1, 362, 42, 11],
  [8.45, 8.95, 490, 705.9, 348, 38.1, 11],
  [9.35, 9.8, 483, 677.1, 474, 38, 11],
];
const T = { nt: 1.5, title: 2.5, type: 2.7, start: 4.5, d12: 5.4, end: 6.2, d16: 7.1, link: 8.0, opt: 8.9, create: 9.75, done: 10.35, ring: 10.85 };
const S = (x, y) => [x + 240, y + 90];
const mix = (a, b, p) => 'color-mix(in srgb, var(--color-' + a + '), var(--color-' + b + ') ' + p * 100 + '%)';
const hov = (t, a, b) => eo(seg(t, a, a + 0.15)) * (1 - seg(t, b, b + 0.15));
const ctl = (extra) => 'display:flex;align-items:center;box-sizing:border-box;border-radius:8px;background:var(--color-surface-gray-2);font-size:14px;font-weight:420;white-space:nowrap;color:var(--color-ink-gray-8);' + extra;
const dateBtn = (cls, label) => '<div class="' + cls + '" style="' + ctl('height:32px;padding:0 8px;gap:8px;flex:none;color:var(--color-ink-gray-7)') + '"><span class="' + cls + '-tx">' + label + '</span>' + sv(P_CAL, 16) + '</div>';
kit.scene('link-todo', {
  init(kit) {
    const side = SHELL('project-detail');
    const title = '<div class="pms-abs" style="left:260px;top:116.7px;font-size:18px;font-weight:600;line-height:20.7px;color:var(--color-ink-gray-5);white-space:nowrap">ToDos</div>';
    const nt = '<div class="pms-btn pms-btn-solid lt-nt" style="left:1011px;top:113px;width:108px;padding:0;gap:8px;font-weight:420;justify-content:flex-start;padding-left:8px">' + sv(P_PLUS, 16) + 'New ToDo</div>';
    const field = 'margin-top:16px;height:16.1px;font-size:14px;line-height:16.1px;';
    const controls = '<div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;width:464px">' +
      '<div style="' + ctl('width:99.7px;height:28px;padding:0 8px;gap:8px;flex:none') + '">' + sv(P_OPEN, 14, 'var(--color-ink-gray-5)') + '<span>Open</span><span style="margin-left:auto">' + sv(P_DOWN, 16) + '</span></div>' +
      '<div style="' + ctl('position:relative;width:224px;height:32px;flex:none') + '"><span class="pms-abs" style="left:8.3px;top:8px;width:16px;height:16px;border-radius:8px;background:var(--color-surface-gray-3)"></span><span class="pms-abs" style="left:32px;top:11px;width:66px;height:10px;border-radius:5px;background:var(--color-surface-gray-3)"></span><span class="pms-abs" style="right:4px;top:8px">' + sv(P_DOWN, 16, 'var(--color-ink-gray-5)') + '</span></div>' +
      dateBtn('lt-start', 'Start') + dateBtn('lt-end', 'End') +
      '<div style="' + ctl('width:111.2px;height:28px;padding:0 8px;gap:8px;flex:none') + '"><span style="width:8px;height:8px;border-radius:4px;background:var(--color-surface-amber-5)"></span><span>Medium</span><span style="margin-left:auto">' + sv(P_DOWN, 16) + '</span></div>' +
      '<div class="lt-link" style="' + ctl('position:relative;width:352px;height:32px;flex:none') + '">' +
      '<span class="pms-abs lt-lk-ph" style="left:8px;top:0;width:312px;height:32px;line-height:32px;overflow:hidden;color:var(--color-ink-gray-4)">Link to milestone, touchpoint or growth initiative</span>' +
      '<span class="pms-abs lt-lk-sel" style="left:9px;top:0;height:32px;display:none;align-items:center;gap:7px;color:var(--color-ink-gray-6)">' + sv(P_MILE, 16) + '<span style="color:var(--color-ink-gray-8)">UAT sign-off</span></span>' +
      '<span class="pms-abs lt-lk-x" style="left:305px;top:9px;display:none;color:var(--color-ink-gray-5)">' + sv(P_X, 14) + '</span>' +
      '<span class="pms-abs" style="left:328px;top:8px;color:var(--color-ink-gray-5)">' + sv(P_DOWN, 16) + '</span></div></div>';
    const dlg = '<div class="pms-abs lt-d" style="left:464px;width:512px;box-sizing:border-box;padding:0 24px;border-radius:16px;background:var(--color-surface-modal);box-shadow:0 0 1px rgba(0,0,0,.19),0 1px 2px rgba(0,0,0,.07),0 6px 15px -5px rgba(0,0,0,.11);opacity:0;visibility:hidden">' +
      '<div style="position:relative;height:24px;margin-top:21.9px;font-size:20px;font-weight:600;line-height:24px;color:var(--color-ink-gray-8);white-space:nowrap">Add ToDo<div class="pms-abs" style="left:432px;top:-2px;width:32px;height:28px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-8)">' + sv(P_X, 16) + '</div></div>' +
      '<div style="margin-top:18px;height:16.1px;font-size:14px;line-height:16.1px;color:var(--color-ink-gray-7)">Title<span style="color:var(--color-ink-red-4);margin-left:2px">*</span></div>' +
      '<div style="margin-top:6px;height:32px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;padding:0 10px;display:flex;align-items:center;font-size:14px;font-weight:420;white-space:nowrap"><span class="lt-ti-ph" style="color:var(--color-ink-gray-4)">Add a title</span><span class="lt-ti-tx" style="color:var(--color-ink-gray-8)"></span><span class="lt-ti-caret" style="width:1px;height:16px;background:var(--color-ink-gray-8);visibility:hidden"></span></div>' +
      '<div style="' + field + 'color:var(--color-ink-gray-5)">Description</div>' +
      '<div style="margin-top:6px;height:160px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:10px;padding:11px 8px;font-size:14px;line-height:16.1px;color:var(--color-ink-gray-4)">Add a description...</div>' +
      controls +
      '<div class="lt-create" style="' + ctl('margin-top:40px;height:28px;justify-content:center;gap:8px;background:var(--color-surface-gray-7);color:var(--color-ink-white)') + '"><span class="lt-sp" style="display:none">' + sv('<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="22 16" stroke-linecap="round"/>', 16) + '</span><span>Create</span></div>' +
      '<div style="height:28px"></div></div>';
    const newr = newRow();
    const page = '<div class="pms-abs" style="inset:0">' + side + ghostTabs() + title + '<div class="pms-abs lt-list" style="left:0;top:0;width:1440px;height:900px">' + ghostList() + '</div>' + newr + ghostPanel() + nt +
      '<div class="pms-abs lt-ov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;visibility:hidden"></div>' + dlg +
      popup('lt-p1', 828, 548, 12) + popup('lt-p2', 666, 225, 16) + dropdown(488, 646) + '<div class="pms-ring lt-ring"></div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam lt-cam"><div class="pms-win">' + page + '</div></div></div>'));
    const q = (c) => kit.stage.querySelector('.lt-' + c);
    for (const k of ['cam', 'nt', 'ov', 'd', 'list', 'new', 'ring', 'cr', 'ti-ph', 'ti-tx', 'ti-caret', 'start', 'start-tx', 'end', 'end-tx', 'link', 'lk-ph', 'lk-sel', 'lk-x', 'p1', 'p2', 'dd', 'opt', 'create', 'sp']) this[k] = q(k);
    this.d12 = this.p1.querySelector('[data-pick]');
    this.d16 = this.p2.querySelector('[data-pick]');
    this.ty = kit.typist('Confirm UAT sign-off', T.type, 18);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.1, hold: 0.2 },
      { t: 1.1, cx: 1180, cy: 380, z: 2.0, hold: 0.7, drift: [-4, 0, 0.004] },
      { t: 2.6, cx: 960, cy: 600, z: 1.45, hold: 7.6, drift: [0, 0, 0.002] },
      { t: 11.0, cx: 960, cy: 420, z: 1.8, hold: 3.0, drift: [0, 0, 0.003] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1420, 640] }, { t: 1.15, at: S(1065, 127) }, { t: 1.9, at: S(1065, 127) },
      { t: 2.45, at: S(900, 282) }, { t: 3.9, at: S(900, 282) },
      { t: 4.4, at: S(862.5, 528) }, { t: 4.6, at: S(862.5, 528) },
      { t: 5.3, at: S(885, 701) }, { t: 5.5, at: S(885, 701) },
      { t: 6.1, at: S(698, 568) }, { t: 6.3, at: S(698, 568) },
      { t: 7.0, at: S(851, 378) }, { t: 7.2, at: S(851, 378) },
      { t: 7.9, at: S(740, 626) }, { t: 8.1, at: S(740, 626) },
      { t: 8.8, at: S(740, 725) }, { t: 9.0, at: S(740, 725) },
      { t: 9.65, at: S(720, 696) }, { t: 10.6, at: S(720, 696) },
      { t: 11.4, at: S(1300, 400) },
    ];
    this.cur.clicks = [T.nt, T.title, T.start, T.d12, T.end, T.d16, T.link, T.opt, T.create];
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const o = eo(seg(t, T.nt, T.nt + 0.15)) * (1 - seg(t, T.done, T.done + 0.15));
    const grown = t >= T.d16;
    const h = grown ? 576 : 540.2;
    this.d.style.top = (450 - h / 2) + 'px';
    this.d.style.height = h + 'px';
    this.d.style.opacity = o;
    this.d.style.visibility = o > 0 ? 'visible' : 'hidden';
    this.d.style.transform = 'scale(' + lerp(0.98, 1, eo(seg(t, T.nt, T.nt + 0.15))) + ')';
    this.ov.style.opacity = o;
    this.ov.style.visibility = o > 0 ? 'visible' : 'hidden';
    this.nt.style.background = mix('surface-gray-7', 'surface-gray-6', hov(t, 1.2, T.nt));
    // title text and caret
    const typed = this.ty.at(t);
    this['ti-tx'].textContent = typed;
    this['ti-ph'].style.display = t >= T.type ? 'none' : '';
    const typing = t >= T.type && t < this.ty.end + 0.1;
    this['ti-caret'].style.visibility = t >= T.title && t < T.start && (typing || Math.floor(t * 2) % 2 === 0) ? 'visible' : 'hidden';
    // dates
    this['start-tx'].textContent = t >= T.d12 ? '2026-10-12 12:00 am' : 'Start';
    this['end-tx'].textContent = t >= T.d16 ? '2026-10-16 12:00 am' : 'End';
    this.start.style.background = mix('surface-gray-2', 'surface-gray-3', Math.max(hov(t, 4.4, T.start), 0));
    this.end.style.background = mix('surface-gray-2', 'surface-gray-3', hov(t, 6.1, T.end));
    const vis = (el, on) => { el.style.visibility = on ? 'visible' : 'hidden'; };
    vis(this.p1, t >= T.start && t < T.d12);
    vis(this.p2, t >= T.end && t < T.d16);
    this.d12.style.background = t >= 5.3 && t < T.d12 ? 'var(--color-surface-gray-2)' : 'transparent';
    this.d16.style.background = t >= 7.0 && t < T.d16 ? 'var(--color-surface-gray-2)' : 'transparent';
    // link field and dropdown
    const picked = t >= T.opt;
    vis(this.dd, t >= T.link && t < T.opt);
    this.opt.style.background = t >= 8.8 && t < T.opt ? 'var(--color-surface-gray-3)' : 'transparent';
    this['lk-ph'].style.display = picked ? 'none' : '';
    this['lk-sel'].style.display = picked ? 'flex' : 'none';
    this['lk-x'].style.display = picked ? 'block' : 'none';
    this.link.style.outline = t >= T.link && t < T.create ? '2px solid var(--color-outline-gray-3)' : 'none';
    // create button and saving state
    const saving = t >= T.create && t < T.done;
    this.sp.style.display = saving ? 'block' : 'none';
    this.sp.firstChild.style.transform = 'rotate(' + (t * 420) % 360 + 'deg)';
    this.create.style.background = mix('surface-gray-7', 'surface-gray-6', hov(t, 9.65, T.create));
    // list shows the new ToDo on top
    const done = t >= T.done;
    this.list.style.transform = 'translateY(' + (done ? ROW : 0) + 'px)';
    this.new.style.visibility = done ? 'visible' : 'hidden';
    this.cr.style.opacity = eo(seg(t, T.ring, T.ring + 0.25));
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
