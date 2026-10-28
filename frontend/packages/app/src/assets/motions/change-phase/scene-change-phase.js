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

// Projects Kanban kit. Board at y 113, columns 284 wide and 16 apart, cards from y 153, 10 apart and 171 high.
const COLX = [268, 568, 868, 1168], CARD_Y = 153, STEP = 181;
const PI = {
  rag: '<path d="M8 4.5C9.93 4.5 11.5 6.06 11.5 8C11.5 9.93 9.93 11.5 8 11.5C6.06 11.5 4.5 9.93 4.5 8C4.5 6.06 6.06 4.5 8 4.5Z" fill="currentColor"/>',
  phase: '<path d="M8 1C11.87 1 15 4.13 15 8C15 11.87 11.87 15 8 15C4.13 15 1 11.87 1 8C1 4.13 4.13 1 8 1ZM8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11C9.66 11 11 9.66 11 8C11 6.34 9.66 5 8 5Z" fill="currentColor"/>',
  plus: '<path d="M8 3.5C8.27 3.5 8.5 3.72 8.5 4V7.5H12C12.28 7.5 12.5 7.72 12.5 8C12.5 8.27 12.28 8.5 12 8.5H8.5V12C8.5 12.28 8.27 12.5 8 12.5C7.72 12.5 7.5 12.28 7.5 12V8.5H4C3.72 8.5 3.5 8.27 3.5 8C3.5 7.72 3.72 7.5 4 7.5H7.5V4C7.5 3.72 7.72 3.5 8 3.5Z" fill="currentColor"/>',
  cal: '<path fill-rule="evenodd" clip-rule="evenodd" d="M4.23 0.64C4.50 0.64 4.73 0.86 4.73 1.14V2.21V2.21L5.00 2.21H10.99C11.08 2.21 11.17 2.21 11.26 2.21C11.26 2.21 11.26 2.21 11.26 2.21V1.14C11.26 0.86 11.49 0.64 11.76 0.64C12.04 0.64 12.26 0.86 12.26 1.14V2.21C12.26 2.22 12.26 2.22 12.26 2.22C12.88 2.25 13.28 2.31 13.63 2.48C14.10 2.72 14.48 3.11 14.72 3.58C14.99 4.11 14.99 4.81 14.99 6.21V11.01C14.99 12.41 14.99 13.11 14.72 13.65C14.48 14.12 14.10 14.50 13.63 14.74C13.09 15.01 12.39 15.01 10.99 15.01H5.00C3.60 15.01 2.90 15.01 2.36 14.74C1.89 14.50 1.51 14.12 1.27 13.65C1.00 13.11 1.00 12.41 1.00 11.01V6.21C1.00 4.81 1.00 4.11 1.27 3.58C1.51 3.11 1.89 2.72 2.36 2.48C2.71 2.31 3.11 2.25 3.73 2.22L3.73 2.21V1.14C3.73 0.86 3.95 0.64 4.23 0.64ZM5.00 3.21H10.99C11.71 3.21 12.18 3.21 12.55 3.24C12.91 3.27 13.07 3.32 13.17 3.37C13.45 3.52 13.68 3.75 13.83 4.03C13.88 4.13 13.93 4.30 13.96 4.65C13.99 4.98 13.99 5.41 13.99 6.02C13.97 6.02 13.94 6.02 13.91 6.02H2.08C2.05 6.02 2.02 6.02 2.00 6.02C2.00 5.41 2.00 4.98 2.03 4.65C2.06 4.30 2.11 4.13 2.16 4.03C2.31 3.75 2.54 3.52 2.82 3.37C2.92 3.32 3.08 3.27 3.44 3.24C3.81 3.21 4.28 3.21 5.00 3.21ZM2.00 7.01V11.01C2.00 11.73 2.00 12.21 2.03 12.57C2.06 12.93 2.11 13.09 2.16 13.19C2.31 13.47 2.54 13.70 2.82 13.85C2.92 13.90 3.08 13.95 3.44 13.98C3.81 14.01 4.28 14.01 5.00 14.01H10.99C11.71 14.01 12.18 14.01 12.55 13.98C12.91 13.95 13.07 13.90 13.17 13.85C13.45 13.70 13.68 13.47 13.83 13.19C13.88 13.09 13.93 12.93 13.96 12.57C13.99 12.21 13.99 11.73 13.99 11.01V7.01C13.97 7.01 13.94 7.02 13.91 7.02H2.08C2.05 7.02 2.02 7.01 2.00 7.01Z" fill="currentColor"/>',
  pm: '<path d="M6.29 7.87C6.61 7.85 6.90 7.99 7.08 8.21L7.16 8.31L8 9.58L8.83 8.31C8.99 8.07 9.26 7.89 9.57 7.87H9.70L10.06 7.91C11.81 8.18 13.25 9.49 13.64 11.26L13.73 11.68C14.07 13.19 12.92 14.63 11.37 14.63H4.62C3.07 14.63 1.92 13.19 2.26 11.68L2.35 11.26C2.77 9.38 4.38 8.00 6.29 7.87ZM8.41 10.77C8.32 10.91 8.16 11.00 8 11.00C7.83 11.00 7.67 10.91 7.58 10.77L6.33 8.87C4.87 8.98 3.65 10.04 3.33 11.48L3.23 11.90C3.04 12.79 3.71 13.63 4.62 13.63H11.37C12.28 13.63 12.96 12.79 12.76 11.90L12.66 11.48C12.34 10.04 11.12 8.98 9.66 8.87L8.41 10.77ZM8 1.86C9.44 1.86 10.62 3.04 10.62 4.48C10.62 5.93 9.44 7.11 8 7.11C6.55 7.11 5.37 5.93 5.37 4.48C5.37 3.04 6.55 1.86 8 1.86ZM8 2.86C7.10 2.86 6.37 3.59 6.37 4.48C6.37 5.38 7.10 6.11 8 6.11C8.89 6.11 9.62 5.38 9.62 4.48C9.62 3.59 8.89 2.86 8 2.86Z" fill="currentColor"/>',
  lead: '<path fill-rule="evenodd" clip-rule="evenodd" d="M7.19 1.93C7.30 1.67 7.17 1.38 6.92 1.28C6.66 1.18 6.37 1.30 6.27 1.56L4.27 6.56C4.16 6.82 4.29 7.11 4.54 7.21C4.80 7.31 5.09 7.19 5.19 6.93L7.19 1.93ZM12.31 2.74C12.04 2.74 11.81 2.97 11.81 3.24C11.81 3.52 12.04 3.74 12.31 3.74C13.42 3.74 14.31 4.64 14.31 5.74V11.74C14.31 12.85 13.42 13.74 12.31 13.74H4.31C3.21 13.74 2.31 12.85 2.31 11.74V8.74C2.31 8.47 2.09 8.24 1.81 8.24C1.54 8.24 1.31 8.47 1.31 8.74V11.74C1.31 13.40 2.66 14.74 4.31 14.74H12.31C13.97 14.74 15.31 13.40 15.31 11.74V5.74C15.31 4.09 13.97 2.74 12.31 2.74ZM7.92 2.17C8.12 1.97 8.44 1.97 8.63 2.17L10.63 4.17C10.72 4.26 10.78 4.39 10.78 4.52C10.78 4.65 10.72 4.78 10.63 4.87L8.63 6.87C8.44 7.07 8.12 7.07 7.92 6.87C7.73 6.68 7.73 6.36 7.92 6.17L9.57 4.52L7.92 2.87C7.73 2.68 7.73 2.36 7.92 2.17ZM3.53 2.87C3.73 2.68 3.73 2.36 3.53 2.17C3.33 1.97 3.02 1.97 2.82 2.17L0.82 4.17C0.63 4.36 0.63 4.68 0.82 4.87L2.82 6.87C3.02 7.07 3.33 7.07 3.53 6.87C3.73 6.68 3.73 6.36 3.53 6.17L1.88 4.52L3.53 2.87Z" fill="currentColor"/>',
  bill: '<path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 2C1.22 2 1 2.22 1 2.5V7.5C1 7.77 1.22 8 1.5 8H6.5C6.77 8 7 7.77 7 7.5V2.5C7 2.22 6.77 2 6.5 2H1.5ZM2 7V3H6V7H2ZM12.5 4C11.11 4 10 5.11 10 6.5C10 7.88 11.11 9 12.5 9C13.88 9 15 7.88 15 6.5C15 5.11 13.88 4 12.5 4ZM9 6.5C9 4.56 10.56 3 12.5 3C14.43 3 16 4.56 16 6.5C16 8.43 14.43 10 12.5 10C10.56 10 9 8.43 9 6.5ZM7.5 9C7.67 9 7.83 9.09 7.92 9.24L10.92 14.24C11.02 14.39 11.02 14.58 10.93 14.74C10.84 14.9 10.68 15 10.5 15H4.5C4.31 15 4.15 14.9 4.06 14.74C3.97 14.58 3.97 14.39 4.07 14.24L7.07 9.24C7.16 9.09 7.32 9 7.5 9ZM9.61 14L7.5 10.47L5.38 14H9.61Z" fill="currentColor"/>',
};
const svg16 = (p, color) => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none;display:block;color:' + color + '">' + p + '</svg>';
const gh = (x, y, w, h, r) => '<div class="pms-ghost" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px"></div>';
// Ghost card: the card's real box, inside text pills (10 px, r5) on each line, icon squares (14, r4), avatar circles (16).
const ghostCard = (x, y, title, rows) => {
  let s = '<div class="pms-card" style="left:' + x + 'px;top:' + y + 'px"><div class="pms-card-bg"></div><div class="pms-card-hd"></div>' + gh(16, 14, 14, 14, 4) + gh(39, 16, title, 10, 5);
  rows.forEach(([w, av], i) => { const cy = 60 + 30 * i; s += gh(18, cy - 7, 14, 14, 4) + (av ? gh(41, cy - 8, 16, 16, 8) + gh(65, cy - 5, w, 10, 5) : gh(41, cy - 5, w, 10, 5)); });
  return s + '</div>';
};
// Focus card: exactly as the app draws it.
const av = (l) => '<span class="pms-av">' + l + '</span>';
const focusCard = (cls, p) => '<div class="pms-card ' + cls + '"><div class="pms-card-bg ' + cls + '-bg"></div><div class="pms-card-hd"></div>' +
  '<div class="pms-abs" style="left:15px;top:13px">' + svg16(PI.rag, 'var(--color-ink-green-3)') + '</div><div class="pms-card-tt">' + p.name + '</div>' +
  '<div class="pms-card-row" style="top:52px">' + svg16(PI.cal, 'var(--color-ink-gray-6)') + '<span>' + p.dates + '</span></div>' +
  '<div class="pms-card-row" style="top:82px">' + svg16(PI.pm, 'var(--color-ink-gray-6)') + av(p.pm[0]) + '<span>' + p.pm + '</span></div>' +
  '<div class="pms-card-row" style="top:112px">' + svg16(PI.lead, 'var(--color-ink-gray-6)') + av(p.lead[0]) + '<span>' + p.lead + '</span></div>' +
  '<div class="pms-card-row" style="top:142px">' + svg16(PI.bill, 'var(--color-ink-gray-6)') + '<span>' + p.bill + '</span></div></div>';
// Column headers: Focus (icon in the phase colour, name, + button), Landmark (muted name only), Ghost.
const colFocus = (i, name, color) => '<div class="pms-abs" style="left:' + (COLX[i] + 6) + 'px;top:119px">' + svg16(PI.phase, color) + '</div><div class="pms-col-tt" style="left:' + (COLX[i] + 30) + 'px">' + name + '</div><div class="pms-abs" style="left:' + (COLX[i] + 262) + 'px;top:119px">' + svg16(PI.plus, 'var(--color-ink-gray-8)') + '</div>';
const colLandmark = (i, name) => gh(COLX[i] + 7, 120, 14, 14, 4) + '<div class="pms-col-tt" style="left:' + (COLX[i] + 30) + 'px;color:var(--color-ink-gray-5)">' + name + '</div>' + gh(COLX[i] + 263, 120, 14, 14, 4);
const colGhost = (i, w) => gh(COLX[i] + 7, 120, 14, 14, 4) + gh(COLX[i] + 30, 122, w, 10, 5) + gh(COLX[i] + 263, 120, 14, 14, 4);

// cubic-bezier easing for the app's own curves (CSS ease and dnd-kit's sort curve)
const bez = (x1, y1, x2, y2) => (x) => {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const f = (a, b, u) => 3 * a * u * (1 - u) * (1 - u) + 3 * b * u * u * (1 - u) + u * u * u;
  let lo = 0, hi = 1; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (f(x1, x2, m) < x) lo = m; else hi = m; }
  return f(y1, y2, (lo + hi) / 2);
};
const EASE = bez(0.25, 0.1, 0.25, 1), SORT = bez(0.25, 1, 0.5, 1);
const ATLAS = { name: 'Atlas UI Stabilization', dates: 'Oct 12 - Dec 18', pm: 'Christina Chang', lead: 'Frank Martinez', bill: 'Fixed Cost' };
// Grab Atlas UI Stabilization in Kick Off, drag it to the top of Discovery, release.
const T = { arrive: 1.75, press: 2.2, d0: 2.3, d1: 3.65, rel: 4.05, leave: 4.75, gone: 5.35 };
const G0 = [690, 174], G1 = [1000, 186];   // pointer on the card header, window coords, and the end point over Discovery
const pointer = (t) => { const p = eio(seg(t, T.d0, T.d1)); return [lerp(G0[0], G1[0], p), lerp(G0[1], G1[1], p)]; };
T.cross = (() => { let lo = T.d0, hi = T.d1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (pointer(m)[0] < COLX[2]) lo = m; else hi = m; } return hi; })();
const W2S = (x, y) => [x + 240, y + 90];   // window -> stage (the camera layer)
// Rings: [from, to, x, y, w, h, radius] in window coords, one at a time.
const RINGS = [[1.5, 2.4, 563, 148, 294, 181, 23], [3.0, 4.15, 863, 108, 294, 38, 11], [4.45, 99, 863, 108, 294, 221, 23]];
kit.scene('change-phase', {
  init(kit) {
    const side = SHELL('projects-kanban');
    let board = colGhost(0, 86) + colLandmark(1, 'Kick Off') + colFocus(2, 'Discovery', 'var(--color-ink-amber-3)') + colGhost(3, 82);
    board += ghostCard(268, 153, 165, [[100], [84, 1], [96, 1], [80]]) + ghostCard(268, 334, 150, [[25], [92, 1], [25], [84]]) + ghostCard(268, 515, 172, [[96], [25], [25], [80]]);
    board += '<div class="phase-web">' + ghostCard(0, 0, 118, [[104], [88, 1], [90, 1], [124]]) + '</div>';
    board += '<div class="phase-nim">' + ghostCard(0, 0, 205, [[100], [96, 1], [84, 1], [80]]) + '</div>';
    board += ghostCard(1168, 153, 170, [[100], [90, 1], [25], [80]]) + ghostCard(1168, 334, 140, [[96], [25], [88, 1], [124]]);
    const card = focusCard('phase-card', ATLAS);
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam phase-cam"><div class="pms-win">' + side + board + card + '<div class="pms-ring phase-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.phase-' + c);
    for (const k of ['cam', 'card', 'card-bg', 'web', 'nim', 'ring']) this[k] = q(k);
    this.web.style.cssText = 'position:absolute;left:568px;top:0;width:284px;height:171px';
    this.nim.style.cssText = 'position:absolute;left:868px;top:0;width:284px;height:171px';
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.12, hold: 0.7, drift: [2, 0, 0.004] },
      { t: 1.5, cx: 1100, cy: 400, z: 2.0, hold: 2.9, drift: [4, 0, 0.002] },
      { t: 5.3, cx: 1180, cy: 410, z: 2.0, drift: [1.5, 0, 0.003] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    // Hand cursor, as the app's Kanban card shows it (grab on hover, grabbing while dragged). The kit's cursor only has the arrow and the resize shape.
    const HAND = (p, palm) => '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:0;top:0;display:block">' + palm + '<g stroke-width="4" style="stroke:var(--color-surface-white)">' + p + '</g><g fill="none" stroke-width="1.6" style="stroke:var(--color-ink-gray-8)">' + p + '</g></svg>';
    const OPEN = '<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>';
    const GRAB = '<path d="M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4"/><path d="M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5"/><path d="M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0"/>';
    this.hand = document.createElement('div');   // kit.h returns a fragment in this player, so build the element directly
    this.hand.style.cssText = 'position:absolute;left:-14px;top:-12px;width:28px;height:28px;visibility:hidden';
    this.hand.innerHTML = '<div class="ph-open" style="position:absolute;inset:0">' + HAND(OPEN, '<path d="M6 14V6.5h12V12l3-3v5a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3L3.5 16l2.5-2z" style="fill:var(--color-surface-white)"/>') + '</div><div class="ph-grab" style="position:absolute;inset:0">' + HAND(GRAB, '<path d="M4 13h2V8.5h14V12h2v2a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" style="fill:var(--color-surface-white)"/>') + '</div>';
    this.cur.el.appendChild(this.hand);
    this.handOpen = this.hand.querySelector('.ph-open');
    this.handGrab = this.hand.querySelector('.ph-grab');

    // During the drag the cursor is keyed every frame from the pointer path the card follows, so the card stays under it.
    const keys = [{ t: 0, at: [1500, 900] }, { t: 1.0, at: [1500, 900] }, { t: T.arrive, at: W2S(G0[0], G0[1]) }];
    for (let i = 0, n = Math.round((T.d1 - T.d0) * 60); i <= n; i++) { const t = T.d0 + i / 60; keys.push({ t, at: W2S(...pointer(t)), bow: 0 }); }
    keys.push({ t: T.leave, at: W2S(G1[0], G1[1]) }, { t: T.gone, at: W2S(760, 420) });
    this.cur.keys = keys;
    this.cur.holds = [[T.press, T.rel]];
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    // The dragged card follows the pointer, then settles into its slot at the top of Discovery (250 ms, ease).
    const [px, py] = pointer(t);
    let x = 568 + px - G0[0], y = CARD_Y + py - G0[1];
    if (t >= T.rel) { const k = EASE(seg(t, T.rel, T.rel + 0.25)); x = lerp(x, COLX[2], k); y = lerp(y, CARD_Y, k); }
    this.card.style.left = x + 'px';
    this.card.style.top = y + 'px';
    const lift = eio(seg(t, T.d0, T.d0 + 0.15)) * (1 - eio(seg(t, T.rel + 0.25, T.rel + 0.4)));
    this.card.style.boxShadow = '0 0 1px rgba(0,0,0,' + (0.19 * lift).toFixed(3) + '), 0 1px 2px rgba(0,0,0,' + (0.07 * lift).toFixed(3) + '), 0 6px 15px -5px rgba(0,0,0,' + (0.11 * lift).toFixed(3) + ')';
    // Hover greys the card the moment the cursor is on it (no transition in the app), white while dragged.
    const hover = (t >= T.arrive - 0.02 && t < T.d0) || (t >= T.rel + 0.25 && t < T.leave + 0.12);
    this['card-bg'].style.background = hover ? 'var(--color-surface-gray-2)' : 'var(--color-surface-cards)';
    // The cards around it make room: Website Redesign moves up in Kick Off, Nimbus Analytics Enhancement moves down in Discovery.
    const k = SORT(seg(t, T.cross, T.cross + 0.25));
    this.web.style.transform = 'translateY(' + lerp(CARD_Y + STEP, CARD_Y, k) + 'px)';
    this.nim.style.transform = 'translateY(' + lerp(CARD_Y, CARD_Y + STEP, k) + 'px)';
    let g = null;
    for (const r of RINGS) if (t >= r[0] && t < r[1]) g = r;
    const s = this.ring.style;
    if (g) {
      s.left = g[2] + 'px'; s.top = g[3] + 'px'; s.width = g[4] + 'px'; s.height = g[5] + 'px'; s.borderRadius = g[6] + 'px';
      s.opacity = Math.min(eo(seg(t, g[0], g[0] + 0.25)), 1 - seg(t, g[1] - 0.25, g[1]));
    } else s.opacity = 0;
    this.cur.render(t);
    // Over the card the cursor is an open hand, pressed and dragging a closed hand, elsewhere the kit's arrow.
    const held = t >= T.press && t < T.rel, over = t >= T.arrive && t < T.leave + 0.15;
    const shape = held ? 'grab' : over ? 'open' : '';
    for (const c of this.cur.el.children) if (c !== this.hand) c.style.visibility = shape ? 'hidden' : 'visible';
    this.hand.style.visibility = shape ? 'visible' : 'hidden';
    this.handOpen.style.display = shape === 'open' ? 'block' : 'none';
    this.handGrab.style.display = shape === 'grab' ? 'block' : 'none';
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
