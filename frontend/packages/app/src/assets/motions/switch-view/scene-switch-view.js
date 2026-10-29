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
const LCOL = { name: [268, 240, 80.7], phase: [516, 160, 37.6], burn: [684, 130, 93.4], cost: [822, 140, 60.5],
  budget: [970, 130, 76.8], profit: [1108, 120, 78.7], start: [1236, 130, 60.4], mile: [1374, 140, 91.7] };
const ROW = (i) => 158 + 41 * i, ROWCY = (i) => 178 + 41 * i;
const CHEV = '<path d="M11.3848 5.6582C11.5735 5.45686 11.8903 5.44622 12.0918 5.63477C12.2931 5.82353 12.3038 6.14033 12.1152 6.3418L8.36523 10.3418C8.27071 10.4426 8.1382 10.5 8 10.5C7.8618 10.5 7.72929 10.4426 7.63477 10.3418L3.88477 6.3418C3.69622 6.14033 3.70686 5.82353 3.9082 5.63477C4.10967 5.44622 4.42647 5.45686 4.61523 5.6582L8 9.26855L11.3848 5.6582Z" fill="currentColor"/>';
const lsvg = (p, size, color) => '<svg width="' + size + '" height="' + size + '" viewBox="0 0 16 16" fill="none" style="flex:none;display:block;color:' + color + '">' + p + '</svg>';
const lg = (x, y, w, h, r) => '<div class="pms-ghost" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px"></div>';
const chevX = (k) => LCOL[k][0] + LCOL[k][2] + 4;
const thGhost = (k) => lg(LCOL[k][0], 130, Math.round(LCOL[k][2]), 10, 5) + lg(chevX(k) + 2, 128, 14, 14, 4);
const thLandmark = (k, name) => '<div class="pms-th" style="left:' + LCOL[k][0] + 'px">' + name + '</div>' + lg(chevX(k) + 2, 128, 14, 14, 4);
const NAMEW = [158, 205, 172, 118, 140, 190, 150, 132, 176, 164, 120, 186, 148, 170, 128, 196, 144, 160];
const BURNW = [61, 25, 55, 61, 52, 25, 58, 61, 25, 55, 61, 52, 25, 58, 61, 25, 55, 52];
const BUDGETW = [76, 68, 38, 76, 72, 68, 76, 38, 72, 76, 68, 72, 38, 76, 68, 72, 76, 68];
const STARTW = [41, 47, 44, 25, 42, 47, 40, 44, 25, 42, 46, 41, 47, 25, 44, 42, 40, 47];
const MILEW = [44, 25, 42, 47, 25, 41, 44, 25, 46, 42, 25, 47, 41, 25, 44, 42, 25, 40];
const PROFITW = [52, 52, 52, 52, 52, 43, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52];
const PH_ICON = '<path d="M8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1ZM8 5C6.34315 5 5 6.34315 5 8C5 9.65685 6.34315 11 8 11C9.65685 11 11 9.65685 11 8C11 6.34315 9.65685 5 8 5Z" fill="currentColor"/>';
const PH_COLOR = { 'Delivery Prep': 'var(--color-ink-gray-4)', 'Kick Off': 'var(--color-ink-blue-3)', 'Discovery': 'var(--color-ink-amber-3)', 'Development': 'var(--color-ink-cyan-3)', 'Launch': 'var(--color-ink-green-3)', 'Close Out': 'var(--color-ink-violet-3)' };
const PHASE_OF = ['Delivery Prep', 'Discovery', 'Development', 'Kick Off', 'Discovery', 'Launch', 'Close Out', 'Development', 'Discovery',
  'Delivery Prep', 'Kick Off', 'Development', 'Close Out', 'Discovery', 'Launch', 'Delivery Prep', 'Development', 'Kick Off'];
const SET_ALL = PHASE_OF.map((_, i) => i), SET_DISC = [1, 4, 8, 13];
const phaseCell = (p, phase) => '<div class="pms-td" style="left:516px;top:' + (ROWCY(p) - 8) + 'px;gap:8px">' + lsvg(PH_ICON, 16, PH_COLOR[phase]) + '<span>' + phase + '</span></div>';
const rowsLayer = (cls, set) => {
  let s = '<div class="pms-abs ' + cls + '" style="inset:0">';
  set.forEach((k, p) => {
    s += lg(LCOL.name[0] + 1, ROWCY(p) - 7, 14, 14, 4) + lg(LCOL.name[0] + 22, ROWCY(p) - 5, NAMEW[k], 10, 5) + phaseCell(p, PHASE_OF[k]) +
      lg(LCOL.burn[0], ROWCY(p) - 5, BURNW[k], 10, 5) + lg(LCOL.cost[0], ROWCY(p) - 2, LCOL.cost[1] - 8, 4, 2) + lg(LCOL.budget[0], ROWCY(p) - 5, BUDGETW[k], 10, 5) +
      lg(LCOL.profit[0], ROWCY(p) - 5, PROFITW[k], 10, 5) +
      (STARTW[k] === 25 ? lg(LCOL.start[0], ROWCY(p) - 5, 25, 10, 5) : lg(LCOL.start[0] + 1, ROWCY(p) - 7, 14, 14, 4) + lg(LCOL.start[0] + 22, ROWCY(p) - 5, STARTW[k], 10, 5)) +
      (MILEW[k] === 25 ? lg(LCOL.mile[0], ROWCY(p) - 5, 25, 10, 5) : lg(LCOL.mile[0] + 1, ROWCY(p) - 7, 14, 14, 4) + lg(LCOL.mile[0] + 22, ROWCY(p) - 5, MILEW[k], 10, 5)) +
      '<div class="pms-hair" style="left:260px;top:' + (ROW(p) + 40) + 'px;width:1160px"></div>';
  });
  return s + '</div>';
};
const listHeader = () => '<div class="pms-hair" style="left:260px;top:157px;width:1160px"></div>' +
  Object.keys(LCOL).map((k) => (k === 'phase' ? thLandmark('phase', 'Phase') : thGhost(k))).join('');
const LOADER = '<div class="pms-abs LCLS" style="left:830.25px;top:496.75px;width:19.5px;height:19.5px"><svg width="19.5" height="19.5" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-gray-8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg></div>';
const SEL_CHEV = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-gray-4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="m6 9 6 6 6-6"/></svg>';
const SELW = { Phases: 89.8, Status: 84.1, Open: 77.7, Discovery: 107.6 };
const selTrigger = (cls) => '<div class="pms-abs ' + cls + '" style="top:71px;height:28px;box-sizing:border-box;border:1px solid var(--color-surface-gray-2);border-radius:8px;background:var(--color-surface-gray-2)">' +
  '<div class="pms-abs ' + cls + '-hov" style="inset:-1px;border-radius:8px;background:var(--color-surface-gray-3);opacity:0"></div>' +
  '<div class="pms-abs ' + cls + '-txt" style="left:8px;top:5px;font-size:14px;font-weight:420;line-height:16.1px;color:var(--color-ink-gray-7);white-space:nowrap"></div>' +
  '<div class="pms-abs ' + cls + '-chev" style="top:5px">' + SEL_CHEV + '</div></div>';
const placeSel = (el, txt, chev, x, label) => { const w = SELW[label]; el.style.left = x + 'px'; el.style.width = w + 'px'; txt.textContent = label; chev.style.left = (w - 26) + 'px'; };
const RIGHT = {
  0: { cv: null, div: null, b: [[1043.5, 98.3], [1149.8, 165], [1322.8, 97.2]], x: null },
  1: { cv: 903.2, div: 1005.7, b: [[1014.7, 98.3], [1120.9, 165], [1294, 98]], x: 1392 },
  2: { cv: 900.8, div: 1003.3, b: [[1012.3, 98.3], [1118.5, 165], [1291.6, 100.4]], x: 1392 },
  saved: { cv: null, div: null, b: [[1012.3, 98.3], [1118.5, 165], [1291.6, 100.4]], x: 1392 },
};
const PH_X = 699;
const rightCover = '<div class="pms-abs" style="left:897px;top:68px;width:528px;height:34px;background:var(--color-surface-white)"></div>';
const rightLayer = (cls, k) => {
  const R = RIGHT[k];
  let s = '<div class="pms-abs ' + cls + '" style="inset:0">';
  R.b.forEach(([x, w]) => { s += lg(x, 71, w, 28, 8); });
  if (R.div != null) s += '<div class="pms-abs" style="left:' + R.div + 'px;top:71px;width:1px;height:28px;background:var(--color-outline-gray-2)"></div>';
  if (R.x != null) s += lg(R.x + 7, 78, 14, 14, 4);
  return s + '</div>';
};
const filterCover = '<div class="pms-abs" style="left:697px;top:69px;width:200px;height:32px;background:var(--color-surface-white)"></div>';
const crumbSaved = (cls, name, labelW) => '<div class="pms-abs ' + cls + '" style="left:333px;top:10px;width:' + (30.7 + labelW + 7.9 + 16 + 12) + 'px;height:36px;background:var(--color-surface-white)">' +
  '<div class="pms-abs" style="left:6.3px;top:7.8px;width:16.3px;font-size:16px;line-height:19.5px;text-align:center">📋</div>' +
  '<div class="pms-abs" style="left:30.7px;top:8.8px;font-size:16px;font-weight:500;line-height:18.4px;color:var(--color-ink-gray-8);white-space:nowrap">' + name + '</div>' +
  '<div class="pms-abs" style="left:' + (30.7 + labelW + 7.9) + 'px;top:10px">' + lsvg(CHEV, 16, 'var(--color-ink-gray-8)') + '</div></div>';
const crumbBox = (labelW) => [334.3, 14.8, 58.3 + labelW, 26.4];
const W2 = (x, y) => [x + 240, y + 90];
const inB = (b, p) => p[0] >= b[0] && p[0] < b[0] + b[2] && p[1] >= b[1] && p[1] < b[1] + b[3];
const pathAt = (KEYS, t) => {
  let p = KEYS[KEYS.length - 1].at;
  if (t <= KEYS[0].t) p = KEYS[0].at;
  else for (let i = 0; i < KEYS.length - 1; i++) if (t < KEYS[i + 1].t) { const u = eio(seg(t, KEYS[i].t, KEYS[i + 1].t)); p = [lerp(KEYS[i].at[0], KEYS[i + 1].at[0], u), lerp(KEYS[i].at[1], KEYS[i + 1].at[1], u)]; break; }
  return [p[0] - 240, p[1] - 90];
};
const ringAt = (el, RINGS, t) => {
  let g = null;
  for (const r of RINGS) if (t >= r[0] && t < r[1] + 0.25) g = r;
  const rs = el.style;
  if (g) {
    rs.left = g[2] + 'px'; rs.top = g[3] + 'px'; rs.width = g[4] + 'px'; rs.height = g[5] + 'px'; rs.borderRadius = g[6] + 'px';
    rs.opacity = Math.min(eo(seg(t, g[0], g[0] + 0.25)), 1 - seg(t, g[1], g[1] + 0.25));
  } else rs.opacity = 0;
};
const LOAD = 0.55;
const loadingAt = (t, A) => { let k = 0; for (const a of A) k = Math.max(k, eo(seg(t, a, a + 0.15)) * (1 - seg(t, a + LOAD, a + LOAD + 0.15))); return k; };

const VIEWNAME = 'Open Discovery', VIEWPX = 122.2;
const S2 = { c1: 2.05, c2: 3.3 };
const VM = { x: 334.5, y: 45, w: 220, ix: 339.5, iw: 210 };
const VM_ROWS = [{ k: 'list', y: 50, label: 'List view' }, { k: 'kanban', y: 82, label: 'Kanban view' },
  { k: 'v1', y: 151, label: VIEWNAME, saved: true }, { k: 'v2', y: 183, label: 'At risk', saved: true }, { k: 'create', y: 220, label: 'Create View' }];
const VMI = {
  list: '<path d="M9 12.3008C9.27614 12.3008 9.5 12.5246 9.5 12.8008C9.49974 13.0767 9.27598 13.3008 9 13.3008H3C2.72402 13.3008 2.50026 13.0767 2.5 12.8008C2.5 12.5246 2.72386 12.3008 3 12.3008H9ZM13 7.5C13.2761 7.5 13.4999 7.72397 13.5 8C13.5 8.27614 13.2761 8.5 13 8.5H3C2.72386 8.5 2.5 8.27614 2.5 8C2.50013 7.72397 2.72394 7.5 3 7.5H13ZM13 2.7002C13.2761 2.7002 13.5 2.92405 13.5 3.2002C13.5 3.47634 13.2761 3.7002 13 3.7002H3C2.72386 3.7002 2.5 3.47634 2.5 3.2002C2.5 2.92405 2.72386 2.7002 3 2.7002H13Z" fill="currentColor"/>',
  kanban: '<path fill-rule="evenodd" clip-rule="evenodd" d="M3.69971 3.00098C3.69971 2.72483 3.47585 2.50098 3.19971 2.50098C2.92356 2.50098 2.69971 2.72483 2.69971 3.00098V11.001C2.69971 11.2771 2.92356 11.501 3.19971 11.501C3.47585 11.501 3.69971 11.2771 3.69971 11.001V3.00098ZM8 2.50098C8.27614 2.50098 8.5 2.72483 8.5 3.00098V13.001C8.5 13.2771 8.27614 13.501 8 13.501C7.72386 13.501 7.5 13.2771 7.5 13.001V3.00098C7.5 2.72483 7.72386 2.50098 8 2.50098ZM12.7998 2.50098C13.0759 2.50098 13.2998 2.72483 13.2998 3.00098V8.00098C13.2998 8.27712 13.0759 8.50098 12.7998 8.50098C12.5237 8.50098 12.2998 8.27712 12.2998 8.00098V3.00098C12.2998 2.72483 12.5237 2.50098 12.7998 2.50098Z" fill="currentColor"/>',
  dots: '<path fill-rule="evenodd" clip-rule="evenodd" d="M4.5 8C4.5 8.82843 3.82843 9.5 3 9.5C2.17157 9.5 1.5 8.82843 1.5 8C1.5 7.17157 2.17157 6.5 3 6.5C3.82843 6.5 4.5 7.17157 4.5 8ZM8 9.5C8.82843 9.5 9.5 8.82843 9.5 8C9.5 7.17157 8.82843 6.5 8 6.5C7.17157 6.5 6.5 7.17157 6.5 8C6.5 8.82843 7.17157 9.5 8 9.5ZM13 9.5C13.8284 9.5 14.5 8.82843 14.5 8C14.5 7.17157 13.8284 6.5 13 6.5C12.1716 6.5 11.5 7.17157 11.5 8C11.5 8.82843 12.1716 9.5 13 9.5Z" fill="currentColor"/>',
  plus: '<path d="M7.99805 3.5C8.27396 3.50026 8.49805 3.72402 8.49805 4V7.49805H12C12.2761 7.49805 12.5 7.7219 12.5 7.99805C12.4997 8.27396 12.276 8.49805 12 8.49805H8.49805V12C8.49805 12.276 8.27396 12.4997 7.99805 12.5C7.7219 12.5 7.49805 12.2761 7.49805 12V8.49805H4C3.72402 8.49805 3.50026 8.27396 3.5 7.99805C3.5 7.7219 3.72386 7.49805 4 7.49805H7.49805V4C7.49805 3.72386 7.7219 3.5 7.99805 3.5Z" fill="currentColor"/>',
};
const viewMenu = (cls) => {
  let s = '<div class="pms-abs ' + cls + '" style="left:' + VM.x + 'px;top:' + VM.y + 'px;width:' + VM.w + 'px;height:208px;box-sizing:border-box;border:1px solid var(--color-outline-gray-1);background:var(--color-surface-modal);border-radius:12px;box-shadow:0 0 1px rgba(0,0,0,.2),0 1px 3px rgba(0,0,0,.05),0 10px 24px -3px rgba(0,0,0,.1)">';
  const X = (x) => x - VM.x - 1, Y = (y) => y - VM.y - 1;
  for (const r of VM_ROWS) {
    s += '<div class="pms-abs" style="left:' + X(VM.ix) + 'px;top:' + Y(r.y) + 'px;width:' + VM.iw + 'px;height:28px;border-radius:8px;background:' + (r.k === 'list' ? 'var(--color-surface-gray-3)' : 'transparent') + '"></div>' +
      '<div class="pms-abs ' + cls + '-h-' + r.k + '" style="left:' + X(VM.ix) + 'px;top:' + Y(r.y) + 'px;width:' + VM.iw + 'px;height:28px;border-radius:8px;background:var(--color-surface-gray-3);opacity:0"></div>' +
      '<div class="pms-abs" style="left:' + X(VM.ix + 8) + 'px;top:' + Y(r.y + 6) + 'px;width:16px;height:16px;font-size:14px;line-height:16px;text-align:center">' +
      (r.saved ? '📋' : r.k === 'create' ? lsvg(VMI.plus, 16, 'var(--color-ink-gray-8)') : lsvg(VMI[r.k], 16, 'var(--color-ink-gray-8)')) + '</div>' +
      '<div class="pms-abs" style="left:' + X(VM.ix + 32) + 'px;top:' + Y(r.y + 6) + 'px;font-size:14px;font-weight:420;line-height:16.1px;color:var(--color-ink-gray-8);white-space:nowrap">' + r.label + '</div>' +
      (r.saved ? '<div class="pms-abs" style="left:' + X(VM.ix + 184) + 'px;top:' + Y(r.y + 6) + 'px">' + lsvg(VMI.dots, 16, 'var(--color-ink-gray-8)') + '</div>' : '');
  }
  s += '<div class="pms-abs" style="left:' + X(VM.ix) + 'px;top:' + Y(114) + 'px;width:' + VM.iw + 'px;height:1px;background:var(--color-outline-gray-1)"></div>' +
    '<div class="pms-abs" style="left:' + X(VM.ix) + 'px;top:' + Y(215) + 'px;width:' + VM.iw + 'px;height:1px;background:var(--color-outline-gray-1)"></div>' +
    '<div class="pms-abs" style="left:' + X(VM.ix + 8) + 'px;top:' + Y(119) + 'px;height:28px;display:flex;align-items:center;font-size:13px;font-weight:500;color:var(--color-ink-gray-7);white-space:nowrap">Saved Views</div>';
  return s + '</div>';
};
const crumbList = (cls) => '<div class="pms-abs ' + cls + '" style="left:333px;top:10px;width:136px;height:36px;background:var(--color-surface-white)">' +
  '<div class="pms-abs" style="left:6.3px;top:10px">' + lsvg(VMI.list, 16, 'var(--color-ink-gray-8)') + '</div>' +
  '<div class="pms-abs" style="left:30.3px;top:8.8px;font-size:16px;font-weight:500;line-height:18.4px;color:var(--color-ink-gray-8);white-space:nowrap">List view</div>' +
  '<div class="pms-abs" style="left:105.5px;top:10px">' + lsvg(CHEV, 16, 'var(--color-ink-gray-8)') + '</div></div>';
const CRUMB0 = [334.3, 14.8, 125.1, 26.4], CRUMB1 = crumbBox(VIEWPX);
const VSW = W2(CRUMB0[0] + CRUMB0[2] / 2, 28), V1 = W2(VM.ix + 105, 165);
const KEYS2 = [{ t: 0, at: [1500, 860] }, { t: 1.0, at: [1500, 860] }, { t: 1.75, at: VSW }, { t: 2.25, at: VSW }, { t: 2.85, at: V1 },
  { t: 3.5, at: V1 }, { t: 4.2, at: [1150, 600] }];
const cur2 = (t) => pathAt(KEYS2, t);
const RINGS2 = [[1.6, S2.c1, CRUMB0[0] - 5, CRUMB0[1] - 5, CRUMB0[2] + 10, CRUMB0[3] + 10, 11], [2.85, S2.c2 - 0.12, VM.ix - 5, 151 - 5, VM.iw + 10, 38, 11],
  [3.5, 99, CRUMB1[0] - 5, CRUMB1[1] - 5, CRUMB1[2] + 10, CRUMB1[3] + 10, 11]];
kit.scene('switch-view', {
  init(kit) {
    const table = '<div class="pms-abs sw-list" style="inset:0"><div style="position:absolute;inset:0;clip-path:inset(113px 20px 0 260px)">' + listHeader() +
      rowsLayer('sw-r0', SET_ALL) + rowsLayer('sw-r1', SET_DISC) + '</div></div>' + LOADER.replace('LCLS', 'sw-spin');
    const bar = filterCover + rightCover + selTrigger('sw-fph') + selTrigger('sw-fst') + rightLayer('sw-g0', 0) + rightLayer('sw-g1', 'saved');
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam sw-cam"><div class="pms-win">' + SHELL('projects-list') + table + bar +
      crumbList('sw-c0') + crumbSaved('sw-c1', VIEWNAME, VIEWPX) + viewMenu('sw-m') + '<div class="pms-ring sw-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.sw-' + c);
    for (const c of ['cam', 'list', 'r0', 'r1', 'spin', 'fph', 'fph-hov', 'fph-txt', 'fph-chev', 'fst', 'fst-hov', 'fst-txt', 'fst-chev', 'g0', 'g1', 'c0', 'c1', 'm', 'ring']) this[c] = q(c);
    this.mh = VM_ROWS.map((r) => [r, q('m-h-' + r.k)]);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 984, cy: 540, z: 1.12, hold: 0.8, drift: [2, 0, 0.004] },
      { t: 1.7, cx: 880, cy: 365, z: 2.0, drift: [-2, 1, 0.003] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = KEYS2;
    this.cur.clicks = [S2.c1, S2.c2];
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const p = cur2(t), on = t >= S2.c2, open = t >= S2.c1 && t < S2.c2;
    this.m.style.visibility = open ? 'visible' : 'hidden';
    for (const [r, el] of this.mh) el.style.opacity = open && inB([VM.ix, r.y, VM.iw, 28], p) ? 1 : 0;
    this.c0.style.visibility = on ? 'hidden' : 'visible';
    this.c1.style.visibility = on ? 'visible' : 'hidden';
    const phL = on ? 'Discovery' : 'Phases', stL = on ? 'Open' : 'Status', stX = PH_X + SELW[phL] + 8;
    placeSel(this.fph, this['fph-txt'], this['fph-chev'], PH_X, phL);
    placeSel(this.fst, this['fst-txt'], this['fst-chev'], stX, stL);
    this['fph-hov'].style.opacity = 0; this['fst-hov'].style.opacity = 0;
    this.g0.style.visibility = on ? 'hidden' : 'visible';
    this.g1.style.visibility = on ? 'visible' : 'hidden';
    const ld = loadingAt(t, [S2.c2]);
    this.list.style.opacity = 1 - 0.5 * ld;
    this.spin.style.opacity = 0.5 * ld;
    this.spin.style.transform = 'rotate(' + ((t * 360) % 360).toFixed(1) + 'deg)';
    const after = t >= S2.c2 + LOAD;
    this.r0.style.visibility = after ? 'hidden' : 'visible';
    this.r1.style.visibility = after ? 'visible' : 'hidden';
    ringAt(this.ring, RINGS2, t);
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
