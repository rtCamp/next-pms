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
const SET_ALL = PHASE_OF.map((_, i) => i), SET_OPEN = SET_ALL.filter((i) => ![6, 9, 12, 15, 17].includes(i)), SET_DISC = [1, 4, 8, 13];
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
const skeletonUnder = (cls, nRows) => { let s = '<div class="pms-abs ' + cls + '" style="inset:0">'; for (let y = ROW(nRows); y < 900; y += 46) s += '<div class="pms-abs" style="left:260px;top:' + y + 'px;width:1160px;height:45px;background:var(--color-surface-gray-4)"></div>'; return s + '</div>'; };
const SEL_CHEV = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-gray-4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="m6 9 6 6 6-6"/></svg>';
const SELW = { Phases: 89.8, Status: 84.1, Open: 77.7, Discovery: 107.6 };
const selTrigger = (cls) => '<div class="pms-abs ' + cls + '" style="top:71px;height:28px;box-sizing:border-box;border:1px solid var(--color-surface-gray-2);border-radius:8px;background:var(--color-surface-gray-2)">' +
  '<div class="pms-abs ' + cls + '-hov" style="inset:-1px;border-radius:8px;background:var(--color-surface-gray-3);opacity:0"></div>' +
  '<div class="pms-abs ' + cls + '-txt" style="left:8px;top:5px;font-size:14px;font-weight:420;line-height:16.1px;color:var(--color-ink-gray-7);white-space:nowrap"></div>' +
  '<div class="pms-abs ' + cls + '-chev" style="top:5px">' + SEL_CHEV + '</div></div>';
const placeSel = (el, txt, chev, x, label) => { const w = SELW[label]; el.style.left = x + 'px'; el.style.width = w + 'px'; txt.textContent = label; chev.style.left = (w - 26) + 'px'; };
const SEL_CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-gray-8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M20 6 9 17l-5-5"/></svg>';
const SELPOP = { Status: { w: 96.3, opts: ['Open', 'Completed', 'Cancelled', 'All'] }, Phases: { w: 112.3, opts: ['Delivery Prep', 'Kick Off', 'Discovery', 'Development', 'Launch', 'Close Out', 'All'] } };
const selPopover = (cls, x, which, selected) => {
  const P = SELPOP[which];
  let s = '<div class="pms-abs ' + cls + '" style="left:' + x + 'px;top:99px;width:' + P.w + 'px;height:' + (8 + 28 * P.opts.length) + 'px;background:var(--color-surface-modal);border-radius:12px;box-shadow:0 0 0 1px rgba(0,0,0,.05),0 0 1px rgba(0,0,0,.2),0 1px 3px rgba(0,0,0,.05),0 10px 24px -3px rgba(0,0,0,.1)">';
  P.opts.forEach((o, i) => {
    s += '<div class="pms-abs" style="left:4px;top:' + (4 + 28 * i) + 'px;width:' + (P.w - 8) + 'px;height:28px;border-radius:8px;background:' + (o === selected ? 'var(--color-surface-gray-2)' : 'transparent') + '"></div>' +
      '<div class="pms-abs ' + cls + '-h' + i + '" style="left:4px;top:' + (4 + 28 * i) + 'px;width:' + (P.w - 8) + 'px;height:28px;border-radius:8px;background:var(--color-surface-gray-2);opacity:0"></div>' +
      '<div class="pms-abs" style="left:12px;top:' + (8 + 28 * i) + 'px;font-size:14px;font-weight:420;line-height:16.1px;color:var(--color-ink-gray-8);white-space:nowrap">' + o + '</div>' +
      (o === selected ? '<div class="pms-abs" style="left:' + (P.w - 28) + 'px;top:' + (10 + 28 * i) + 'px">' + SEL_CHECK + '</div>' : '');
  });
  return s + '</div>';
};
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
const createViewBtn = (cls) => '<div class="pms-abs ' + cls + '" style="top:71px;width:94.5px;height:28px;border-radius:8px;background:var(--color-surface-gray-2)">' +
  '<div class="pms-abs ' + cls + '-h" style="inset:0;border-radius:8px;background:var(--color-surface-gray-3);opacity:0"></div>' +
  '<div class="pms-abs" style="inset:0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:420;line-height:16px;color:var(--color-ink-gray-8);white-space:nowrap">Create view</div></div>';
const filterCover = '<div class="pms-abs" style="left:697px;top:69px;width:200px;height:32px;background:var(--color-surface-white)"></div>';
const crumbSaved = (cls, name, labelW) => '<div class="pms-abs ' + cls + '" style="left:333px;top:10px;width:' + (30.7 + labelW + 7.9 + 16 + 12) + 'px;height:36px;background:var(--color-surface-white)">' +
  '<div class="pms-abs" style="left:6.3px;top:7.8px;width:16.3px;font-size:16px;line-height:19.5px;text-align:center">📋</div>' +
  '<div class="pms-abs" style="left:30.7px;top:8.8px;font-size:16px;font-weight:500;line-height:18.4px;color:var(--color-ink-gray-8);white-space:nowrap">' + name + '</div>' +
  '<div class="pms-abs" style="left:' + (30.7 + labelW + 7.9) + 'px;top:10px">' + lsvg(CHEV, 16, 'var(--color-ink-gray-8)') + '</div></div>';
const crumbBox = (labelW) => [334.3, 14.8, 58.3 + labelW, 26.4];
const W2 = (x, y) => [x + 240, y + 90];
const inB = (b, p) => p[0] >= b[0] && p[0] < b[0] + b[2] && p[1] >= b[1] && p[1] < b[1] + b[3];
const fadeIn15 = (t, inside) => { let n = 0; for (let i = 0; i < 9; i++) if (inside(t - i * 0.15 / 8)) n++; return eio(n / 9); };
const dip = (t, a) => 1 - 0.04 * seg(t, a - 0.05, a) * (1 - seg(t, a, a + 0.12));
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

const NAME = 'Open Discovery', NAMEPX = 122.2;
const S = { c1: 2.05, c2: 3.0, c3: 4.6, c4: 5.6, c5: 7.75, c6: 8.75, type: 8.95, c7: 11.15, done: 11.5 };
const DLG = { x: 464, y: 120 };
const INB = [DLG.x + 64, DLG.y + 90.1, 424, 32];
const CRB = [DLG.x + 427.8, DLG.y + 195.1, 60.2, 28];
const STATUS_X = (t) => (t >= S.c4 ? PH_X + SELW.Discovery + 8 : PH_X + SELW.Phases + 8);
const stLabel = (t) => (t >= S.c2 ? 'Open' : 'Status'), phLabel = (t) => (t >= S.c4 ? 'Discovery' : 'Phases');
const rstate = (t) => (t >= S.done ? 'saved' : t >= S.c4 ? 2 : t >= S.c2 ? 1 : 0);
const stBox = (t) => [STATUS_X(t), 71, SELW[stLabel(t)], 28], phBox = (t) => [PH_X, 71, SELW[phLabel(t)], 28];
const cvBox = (t) => { const R = RIGHT[rstate(t)]; return R.cv == null ? null : [R.cv, 71, 94.5, 28]; };
const ST0 = PH_X + SELW.Phases + 8, STPOPX = ST0 + 84.1 / 2 - 96.3 / 2, PHPOPX = PH_X + 89.8 / 2 - 112.3 / 2;
const STS = W2(ST0 + 42.05, 85), OPN = W2(ST0 + 42.05, 117), PHS = W2(PH_X + 44.9, 85), DSC = W2(PH_X + 44.9, 173);
const CVP = W2(900.8 + 47.25, 85), INP = W2(INB[0] + 232, 226), CRP = W2(CRB[0] + 30, CRB[1] + 14);
const KEYS1 = [{ t: 0, at: [1500, 860] }, { t: 1.0, at: [1500, 860] }, { t: 1.75, at: STS }, { t: 2.2, at: STS }, { t: 2.6, at: OPN },
  { t: 3.6, at: OPN }, { t: 4.2, at: PHS }, { t: 4.75, at: PHS }, { t: 5.25, at: DSC }, { t: 6.7, at: DSC }, { t: 7.35, at: CVP },
  { t: 8.0, at: CVP }, { t: 8.65, at: INP }, { t: 10.25, at: INP }, { t: 10.95, at: CRP }, { t: 11.35, at: CRP }, { t: 12.2, at: [1150, 600] }];
const cur1 = (t) => pathAt(KEYS1, t);
const DOPEN = (t) => t >= S.c5 && t < S.done + 0.1;
const CB = crumbBox(NAMEPX);
const RINGS1 = [[1.6, S.c1, ST0 - 5, 66, 84.1 + 10, 38, 11], [2.6, S.c2 - 0.12, STPOPX + 4 - 5, 103 - 5, 96.3 - 8 + 10, 38, 11],
  [4.2, S.c3, PH_X - 5, 66, 89.8 + 10, 38, 11], [5.2, S.c4 - 0.12, PHPOPX + 4 - 5, 103 + 56 - 5, 112.3 - 8 + 10, 38, 11],
  [7.3, S.c5, 900.8 - 5, 66, 104.5, 38, 11], [8.35, S.c6, INB[0] - 5, INB[1] - 5, 434, 42, 11],
  [10.7, S.c7, CRB[0] - 5, CRB[1] - 5, 70.2, 38, 11], [11.7, 99, CB[0] - 5, CB[1] - 5, CB[2] + 10, CB[3] + 10, 11]];
const XI = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:block;color:var(--color-ink-gray-8)"><path d="M12.1494 3.14648C12.3446 2.95126 12.6612 2.95135 12.8564 3.14648C13.0517 3.34175 13.0517 3.65825 12.8564 3.85352L8.70898 8.00098L12.8574 12.1494C13.0526 12.3446 13.0526 12.6612 12.8574 12.8564C12.6622 13.0516 12.3456 13.0517 12.1504 12.8564L8.00195 8.70801L3.85352 12.8564C3.65825 13.0517 3.34175 13.0517 3.14648 12.8564C2.95135 12.6612 2.95126 12.3446 3.14648 12.1494L7.29492 8.00098L3.14746 3.85352C2.95228 3.65827 2.95228 3.34173 3.14746 3.14648C3.34271 2.95137 3.65927 2.95132 3.85449 3.14648L8.00195 7.29395L12.1494 3.14648Z" fill="currentColor"/></svg>';
kit.scene('save-view', {
  init(kit) {
    const table = '<div class="pms-abs sv-list" style="inset:0"><div style="position:absolute;inset:0;clip-path:inset(113px 20px 0 260px)">' + listHeader() +
      rowsLayer('sv-r0', SET_ALL) + rowsLayer('sv-r1', SET_OPEN) + rowsLayer('sv-r2', SET_DISC) + skeletonUnder('sv-sk', SET_OPEN.length) + '</div></div>' +
      LOADER.replace('LCLS', 'sv-spin');
    const bar = filterCover + rightCover + selTrigger('sv-fph') + selTrigger('sv-fst') + rightLayer('sv-g0', 0) + rightLayer('sv-g1', 1) + rightLayer('sv-g2', 2) + rightLayer('sv-g3', 'saved') + createViewBtn('sv-cv');
    const pops = selPopover('sv-sp', STPOPX, 'Status', 'All') + selPopover('sv-pp', PHPOPX, 'Phases', 'All');
    const page = '<div class="pms-abs sv-page" style="inset:0">' + SHELL('projects-list') + table + bar + crumbSaved('sv-crumb', NAME, NAMEPX) + pops + '</div>';
    const L = (x, y) => 'left:' + x + 'px;top:' + y + 'px';
    const dlg = '<div class="pms-abs sv-ov" style="inset:0;background:rgba(0,0,0,.27)"></div>' +
      '<div class="pms-abs sv-dlg" style="' + L(DLG.x, DLG.y) + ';width:512px;height:247.1px;background:var(--color-surface-modal);border-radius:16px;box-shadow:0 0 1px rgba(0,0,0,.19),0 1px 2px rgba(0,0,0,.07),0 6px 15px -5px rgba(0,0,0,.11)">' +
      '<div class="pms-abs" style="' + L(24, 24.8) + ';font-size:16px;font-weight:500;line-height:18.4px;color:var(--color-ink-gray-9);white-space:nowrap">Create View</div>' +
      '<div class="pms-abs" style="' + L(464, 26) + '">' + XI + '</div>' +
      '<div class="pms-abs" style="' + L(24, 68) + ';font-size:14px;font-weight:420;line-height:16.1px;color:var(--color-ink-gray-5);white-space:nowrap">Name<span style="color:var(--color-ink-red-3);margin-left:1.5px">*</span></div>' +
      '<div class="pms-abs" style="' + L(24, 90.1) + ';width:32px;height:32px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;line-height:18.4px">📋</div>' +
      '<div class="pms-abs sv-in" style="' + L(64, 90.1) + ';width:424px;height:32px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;background:var(--color-surface-white);padding:0 10px;display:flex;align-items:center;font-size:14px;font-weight:420;line-height:16.1px;white-space:nowrap">' +
      '<span class="sv-ph" style="color:var(--color-ink-gray-4)">View Name</span><span class="sv-tv" style="color:var(--color-ink-gray-9)"></span><span class="sv-caret" style="display:inline-block;width:1.5px;height:16px;background:var(--color-ink-gray-9);margin-left:1px"></span></div>' +
      '<div class="pms-abs" style="' + L(34, 144.1) + ';font-size:14px;font-weight:500;line-height:21px;color:var(--color-ink-gray-8);white-space:nowrap">Make this view public</div>' +
      '<div class="pms-abs" style="' + L(440, 146.6) + ';width:26px;height:16px;border-radius:9999px;background:var(--color-surface-gray-4)"><div class="pms-abs" style="' + L(2, 2) + ';width:12px;height:12px;border-radius:9999px;background:var(--color-surface-white);box-shadow:0 1px 2px rgba(0,0,0,.1)"></div></div>' +
      '<div class="pms-abs" style="' + L(357.8, 195.1) + ';width:62px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:420;color:var(--color-ink-gray-8)">Cancel</div>' +
      '<div class="pms-abs sv-cr" style="' + L(427.8, 195.1) + ';width:60.2px;height:28px;border-radius:8px;background:var(--color-surface-gray-7);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:420;color:var(--color-ink-white)">Create</div></div>';
    const toast = '<div class="pms-abs sv-toast" style="left:1140px;top:840px;width:280px;height:40px;box-sizing:border-box;padding:6px 16px;background:var(--color-surface-gray-6);border-radius:10px;box-shadow:0 0 1px rgba(0,0,0,.35),0 6px 8px -4px rgba(0,0,0,.1);display:flex;align-items:center;gap:12px">' +
      '<div style="display:flex;align-items:center;gap:8px;flex:1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-green-3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;display:block"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>' +
      '<span style="font-size:13px;line-height:19.5px;font-weight:420;color:var(--color-ink-white)">View Created</span></div>' +
      '<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-white)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam sv-cam"><div class="pms-win">' + page + dlg + toast + '<div class="pms-ring sv-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.sv-' + c);
    for (const c of ['cam', 'page', 'list', 'r0', 'r1', 'r2', 'sk', 'spin', 'fph', 'fph-hov', 'fph-txt', 'fph-chev', 'fst', 'fst-hov', 'fst-txt', 'fst-chev',
      'g0', 'g1', 'g2', 'g3', 'cv', 'cv-h', 'crumb', 'sp', 'pp', 'ov', 'dlg', 'in', 'ph', 'tv', 'caret', 'cr', 'toast', 'ring']) this[c] = q(c);
    this.spH = SELPOP.Status.opts.map((_, i) => q('sp-h' + i)); this.ppH = SELPOP.Phases.opts.map((_, i) => q('pp-h' + i));
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.12, hold: 0.8, drift: [2, 0, 0.004] },
      { t: 1.7, cx: 880, cy: 350, z: 2.0, hold: 6.05, drift: [-2, 1, 0.003] },
      { t: 8.4, cx: 960, cy: 335, z: 2.2, hold: 3.1, drift: [0, 1, 0.003] },
      { t: 12.2, cx: 880, cy: 350, z: 2.0, drift: [-2, 0, 0.003] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = KEYS1;
    this.cur.clicks = [S.c1, S.c2, S.c3, S.c4, S.c5, S.c6, S.c7];
    this.name = kit.typist(NAME, S.type, 18);
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const p = cur1(t), saved = t >= S.done;
    placeSel(this.fph, this['fph-txt'], this['fph-chev'], PH_X, phLabel(t));
    placeSel(this.fst, this['fst-txt'], this['fst-chev'], STATUS_X(t), stLabel(t));
    this['fph-hov'].style.opacity = fadeIn15(t, (s) => !DOPEN(s) && inB(phBox(s), cur1(s)) && !(s >= S.c3 && s < S.c4));
    this['fst-hov'].style.opacity = fadeIn15(t, (s) => !DOPEN(s) && inB(stBox(s), cur1(s)) && !(s >= S.c1 && s < S.c2));
    const spOpen = t >= S.c1 && t < S.c2, ppOpen = t >= S.c3 && t < S.c4;
    this.sp.style.visibility = spOpen ? 'visible' : 'hidden';
    this.pp.style.visibility = ppOpen ? 'visible' : 'hidden';
    const hov = (H, x0, w, open) => H.forEach((el, i) => { el.style.opacity = open && inB([x0 + 4, 103 + 28 * i, w - 8, 28], p) ? 1 : 0; });
    hov(this.spH, STPOPX, 96.3, spOpen); hov(this.ppH, PHPOPX, 112.3, ppOpen);
    const rs = rstate(t);
    this.g0.style.visibility = rs === 0 ? 'visible' : 'hidden';
    this.g1.style.visibility = rs === 1 ? 'visible' : 'hidden';
    this.g2.style.visibility = rs === 2 ? 'visible' : 'hidden';
    this.g3.style.visibility = rs === 'saved' ? 'visible' : 'hidden';
    const cvb = cvBox(t);
    this.cv.style.visibility = cvb ? 'visible' : 'hidden';
    if (cvb) this.cv.style.left = cvb[0] + 'px';
    this['cv-h'].style.opacity = fadeIn15(t, (s) => s < S.c5 && cvBox(s) && inB(cvBox(s), cur1(s)));
    this.cv.style.transform = 'scale(' + dip(t, S.c5) + ')';
    const ld = loadingAt(t, [S.c2, S.c4]);
    this.list.style.opacity = 1 - 0.5 * ld;
    this.spin.style.opacity = 0.5 * ld;
    this.spin.style.transform = 'rotate(' + ((t * 360) % 360).toFixed(1) + 'deg)';
    const set = t >= S.c4 + LOAD ? 2 : t >= S.c2 + LOAD ? 1 : 0;
    this.r0.style.visibility = set === 0 ? 'visible' : 'hidden';
    this.r1.style.visibility = set === 1 ? 'visible' : 'hidden';
    this.r2.style.visibility = set === 2 ? 'visible' : 'hidden';
    this.sk.style.visibility = t >= S.c4 && t < S.c4 + LOAD ? 'visible' : 'hidden';
    this.crumb.style.visibility = saved ? 'visible' : 'hidden';
    const inK = eo(seg(t, S.c5, S.c5 + 0.1)), outK = seg(t, S.done, S.done + 0.1);
    const o = DOPEN(t) ? inK * (1 - outK) : 0;
    this.ov.style.opacity = o;
    this.page.style.filter = o > 0 ? 'blur(' + (12 * o).toFixed(2) + 'px)' : 'none';
    this.dlg.style.opacity = DOPEN(t) ? lerp(0.5, 1, inK) * (1 - outK * 0.5) : 0;
    this.dlg.style.visibility = o > 0 ? 'visible' : 'hidden';
    this.dlg.style.transform = 'scale(' + (t < S.done ? lerp(0.98, 1, inK) : lerp(1, 0.98, outK)) + ')';
    const focused = t >= S.c6 && t < S.done;
    const hv = DOPEN(t) ? fadeIn15(t, (s) => s >= S.c5 && inB(INB, cur1(s))) : 0;
    this.in.style.borderColor = focused ? 'var(--color-outline-gray-3)' : 'color-mix(in srgb, var(--color-outline-gray-2), var(--color-outline-gray-3) ' + (hv * 100).toFixed(1) + '%)';
    this.in.style.boxShadow = focused ? '0 0 0 2px var(--color-outline-gray-3), 0 1px 2px rgba(0,0,0,.1)' : hv > 0 ? '0 1px 2px rgba(0,0,0,' + (0.1 * hv).toFixed(3) + ')' : 'none';
    const typed = this.name.at(t);
    this.tv.textContent = typed;
    this.ph.style.display = typed ? 'none' : 'inline';
    const typing = t > S.type && t < this.name.end;
    this.caret.style.opacity = focused && (typing || Math.floor((t - S.c6) / 0.53) % 2 === 0) ? 1 : 0;
    this.caret.style.order = typed ? 2 : 0;
    this.ph.style.order = 1; this.tv.style.order = 1;
    const ch = fadeIn15(t, (s) => DOPEN(s) && s < S.done && inB(CRB, cur1(s)));
    this.cr.style.background = 'color-mix(in srgb, var(--color-surface-gray-7), var(--color-surface-gray-6) ' + (ch * 100).toFixed(1) + '%)';
    this.cr.style.transform = 'scale(' + dip(t, S.c7) + ')';
    const tk = seg(t, S.done, S.done + 0.4), te = 1 - Math.pow(1 - tk, 3);
    this.toast.style.visibility = saved ? 'visible' : 'hidden';
    this.toast.style.opacity = te;
    this.toast.style.transform = 'translateY(' + (150 * (1 - te)).toFixed(1) + '%) scale(' + lerp(0.95, 1, te).toFixed(4) + ')';
    ringAt(this.ring, RINGS1, t);
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
