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
const DATES = ['Oct 12', 'Oct 13', 'Oct 14', '15', 'Oct 16', 'Oct 17', 'Oct 18'];
const LIKED = ['Design system component refinements', 'Cross-browser and responsiveness fixes', 'Client dashboard layout improvements'];
const ROWICON = {
  chev: '<path d="M11.3848 5.6582C11.5735 5.45686 11.8903 5.44622 12.0918 5.63477C12.2931 5.82353 12.3038 6.14033 12.1152 6.3418L8.36523 10.3418C8.27071 10.4426 8.1382 10.5 8 10.5C7.8618 10.5 7.72929 10.4426 7.63477 10.3418L3.88477 6.3418C3.69622 6.14033 3.70686 5.82353 3.9082 5.63477C4.10967 5.44622 4.42647 5.45686 4.61523 5.6582L8 9.26855L11.3848 5.6582Z" fill="currentColor"/>',
  folder: '<path fill-rule="evenodd" clip-rule="evenodd" d="M10.023 2.5L8.43184 3.68632C8.25916 3.81507 8.04952 3.88462 7.83412 3.88462H2V12.5C2 13.0523 2.44772 13.5 3 13.5H13C13.5523 13.5 14 13.0523 14 12.5V2.5H10.023ZM9.49179 1.64872C9.6213 1.55216 9.77853 1.5 9.94008 1.5H14.35C14.709 1.5 15 1.79101 15 2.15V12.5C15 13.6046 14.1046 14.5 13 14.5H3C1.89543 14.5 1 13.6046 1 12.5V3.53462C1 3.17563 1.29102 2.88462 1.65 2.88462H7.83412L9.49179 1.64872Z" fill="currentColor"/>',
  task: '<g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M8 1.333V4m2.8 1.2 1.933-1.933M12 8h2.667M10.8 10.8l1.933 1.933M8 12v2.667m-4.733-1.934L5.2 10.8M1.333 8H4m-.733-4.733L5.2 5.2"/></g>',
};
const STAR_X = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" style="transform:scaleX(-1);color:var(--color-ink-gray-4)"><path d="m10.344 4.688 1.181-2.393a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.237 3.152"/><path d="m17.945 17.945.43 2.505a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a8 8 0 0 0 .4-.099"/><path d="m2 2 20 20"/></svg>';
const STAR_ON = '<svg width="16" height="16" viewBox="0 0 16 16" style="flex:none"><path fill="var(--color-ink-amber-2)" d="M8.84025 1.98436C8.45159 1.33854 7.51529 1.33855 7.12663 1.98437L5.56205 4.58416C5.42243 4.81617 5.19468 4.98164 4.93087 5.04274L1.97484 5.72736C1.24053 5.89743 0.951195 6.7879 1.4453 7.35711L3.43437 9.64849C3.61188 9.85298 3.69888 10.1207 3.67546 10.3905L3.41311 13.4134C3.34794 14.1643 4.10542 14.7147 4.79946 14.4206L7.59335 13.237C7.84269 13.1314 8.1242 13.1314 8.37353 13.237L11.1674 14.4206C11.8615 14.7147 12.6189 14.1643 12.5538 13.4134L12.2914 10.3905C12.268 10.1207 12.355 9.85298 12.5325 9.64849L14.5216 7.35711C15.0157 6.7879 14.7264 5.89743 13.992 5.72736L11.036 5.04274C10.7722 4.98164 10.5445 4.81617 10.4048 4.58416L8.84025 1.98436Z"/></svg>';
// Rings [from, to, x, y, w, h, radius] in window coords.
const RINGS = [[0.9, 1.75, 285, 193, 26, 26, 11], [2.25, 5.2, 257, 224, 400, 228, 11]];
const cell = (x, txt, cls, sty) => '<div class="pms-cell ' + (cls || '') + '" style="left:' + (x - 268) + 'px;' + (sty || '') + '">' + txt + '</div>';
const bar = (x, y, w, h) => '<div class="pms-bar" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + (h || 10) + 'px"></div>';
kit.scene('import-liked-tasks', {
  init(kit) {
    const side = SHELL('personal');
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
    let proj = '<div class="pms-row" style="top:184px">' +
      '<div class="pms-abs il-hov" style="left:50px;top:14px;width:16px;height:16px;border-radius:8px;background:var(--color-surface-gray-2);opacity:0"></div>' +
      '<div class="pms-abs il-off" style="left:50px;top:14px;width:16px;height:16px;display:flex">' + STAR_X + '</div>' +
      '<div class="pms-abs il-on" style="left:50px;top:14px;width:16px;height:16px;display:flex;visibility:hidden">' + STAR_ON + '</div>' + '<div class="pms-abs" style="left:74px;top:13px;font-size:14px;font-weight:500;color:var(--color-ink-gray-8);white-space:nowrap">Projects / Tasks</div>';
    COLS.forEach((x) => { proj += cell(x, '-', '', 'color:var(--color-ink-gray-4)'); });
    proj += cell(1366, '00:00', '', 'color:var(--color-ink-red-4);font-weight:500') + '</div>';
    const i16 = (inner) => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none">' + inner + '</svg>';
    const resRow = (top, indent, icons, label, after) => {
      let r = '<div class="pms-row" style="top:' + top + 'px"><div class="pms-abs" style="left:' + indent + 'px;top:12px;display:flex;align-items:center;gap:6px;color:var(--color-ink-gray-6)">' + icons + '<span style="color:var(--color-ink-gray-8)">' + label + '</span>' + (after || '') + '</div>';
      COLS.forEach((x) => { r += cell(x, '-'); });
      return r + cell(1366, '00:00', '', 'color:var(--color-' + (after ? 'ink-gray-6' : 'ink-green-4') + ')') + '</div>';
    };
    const liked = '<span style="display:flex;margin-left:2px">' + STAR_ON + '</span>';
    const ins = '<div class="pms-abs il-ins" style="left:0;right:0;top:228px;height:0;overflow:hidden">' +
      resRow(0, 26, i16(ROWICON.chev) + i16(ROWICON.folder), 'Atlas UI Stabilization') +
      resRow(44, 70, i16(ROWICON.task), LIKED[0], liked) + resRow(88, 70, i16(ROWICON.task), LIKED[1], liked) +
      resRow(132, 26, i16(ROWICON.chev) + i16(ROWICON.folder), 'Website Redesign') +
      resRow(176, 70, i16(ROWICON.task), LIKED[2], liked) + '</div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam il-cam"><div class="pms-win">' + side +
      head + week + proj + ins + '<div class="pms-abs il-below" style="left:0;right:0;top:228px;height:700px">' + skel + '</div>' + '<div class="pms-ring il-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.il-' + c);
    for (const k of ['cam', 'hov', 'off', 'on', 'ins', 'below', 'ring']) this[k] = q(k);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.12, hold: 0.4 },
      { t: 1.3, cx: 720, cy: 360, z: 2.0, hold: 0.6, drift: [0, 0, 0.004] },
      { t: 2.8, cx: 980, cy: 465, z: 1.45, drift: [0, 0, 0.004] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1500, 900] }, { t: 0.5, at: [1500, 900] }, { t: 1.3, at: [539, 297] },
      { t: 2.2, at: [539, 297] }, { t: 2.7, at: [545, 246] }, { t: 5.2, at: [549, 248] },
    ];
    this.cur.clicks = [1.7];
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    this.hov.style.opacity = eio(seg(t, 1.25, 1.4)) * (1 - eio(seg(t, 2.25, 2.4)));
    const on = t >= 1.7;
    this.off.style.visibility = on ? 'hidden' : 'visible';
    this.on.style.visibility = on ? 'visible' : 'hidden';
    const k = eio(seg(t, 1.75, 2.15));
    this.ins.style.height = 220 * k + 'px';
    this.below.style.transform = 'translateY(' + 220 * k + 'px)';
    let r = null;
    for (const g of RINGS) if (t >= g[0] && t < g[1]) r = g;
    if (r) {
      const s = this.ring.style;
      s.left = r[2] + 'px'; s.top = r[3] + 'px'; s.width = r[4] + 'px'; s.height = r[5] + 'px'; s.borderRadius = r[6] + 'px';
      s.opacity = Math.min(eo(seg(t, r[0], r[0] + 0.25)), 1 - seg(t, r[1] - 0.15, r[1]));
    } else this.ring.style.opacity = 0;
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
