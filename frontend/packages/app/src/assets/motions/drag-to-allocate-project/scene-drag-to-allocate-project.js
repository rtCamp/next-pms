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
const WEEKS = ['Oct 12 - 18', 'Oct 19 - 25', 'Oct 26 - Nov 1', 'Nov 2 - 8'];
const mix = (a, b, p) => 'color-mix(in srgb, var(--color-' + a + '), var(--color-' + b + ') ' + p * 100 + '%)';
// Rows are 61 px (60 plus the 1 px header border), the Add member row is 41. Orion Release Readiness is expanded at y 175.
// Rings: [from, to, x, y, w, h] in window coords, 5 px outside their target.
const RINGS = [[2.0, 4.95, 1008, 306, 196, 42], [5.9, 7.2, 473, 166, 494, 182], [7.2, 8.25, 473, 517, 494, 42], [8.3, 9.45, 878, 766, 80, 38], [10.45, 99, 1009, 306, 196, 42]];
// Drag: Julian Andrews' member row under Orion Release Readiness, from Mon Oct 26 to Fri Oct 30, 38 px a day.
const HY = 297, PX = 1013, PY = HY + 14, SPAN = 4 * 38;
const T = { arrive: 2.1, press: 2.6, d0: 2.75, d1: 4.35, release: 4.9, open: 4.95, alloc: 9.4, close: 9.5, fill: 10.0 };
const ic = (p, sz) => '<svg width="' + (sz || 16) + '" height="' + (sz || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none">' + p + '</svg>';
const IC = {
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
};
const box = (x, y, w, h, r) => '<div class="pms-ghost" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px' + (r !== undefined ? ';border-radius:' + r + 'px' : '') + '"></div>';
const label = (x, y, txt, req) => '<div class="pms-label" style="left:' + x + 'px;top:' + y + 'px">' + txt + (req ? ' <b>*</b>' : '') + '</div>';
const chev = '<span style="margin-left:auto;color:var(--color-ink-gray-4);display:flex">' + ic(IC.down) + '</span>';
const pill = (x, y, w, bg, ink, txt, cls, shadow) => '<div class="pms-pill' + (cls ? ' ' + cls : '') + '" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;background:var(--color-' + bg + ');color:var(--color-' + ink + ')' + (shadow ? ';box-shadow:0 0 1px rgba(0,0,0,.14), 0 1px 3px rgba(0,0,0,.14)' : '') + '">' + txt + '</div>';
const rule = (x, y, w) => '<div class="pms-abs" style="left:' + x + 'px;width:' + w + 'px;top:' + y + 'px;height:1px;background:var(--color-outline-gray-1)"></div>';
// Project and member header cells share one layout: pl-3 chevron, pl-8 for members, name line at y 12, subtext line at y 35.
const name = (y, text, w) => text ? '<div class="pms-abs" style="left:296px;top:' + (y + 12) + 'px;color:var(--color-ink-gray-4)">' + text + '</div>' : box(296, y + 15, w, 11, 5);
const projectHead = (y, text, w) => rule(240, y + 60, 240) + box(252, y + 12.5, 16, 16, 4) + box(272, y + 12.5, 16, 16, 4) + name(y, text, w) + box(296, y + 35.5, 110, 9, 4);
const memberHead = (y, text, w) => rule(240, y + 60, 240) + box(272, y + 12.5, 16, 16, 8) + name(y, text, w) + box(296, y + 35.5, 110, 9, 4);
kit.scene('drag-to-allocate-project', {
  init(kit) {
    const side = SHELL('alloc-project', { 0: '<div class="pms-btn pms-btn-solid" style="left:1294px;top:14px;width:134px">' + ic(IC.plus, 15) + 'Add allocation</div>' });
    let grid = '<div class="pms-abs" style="left:480px;right:0;top:236px;height:224px;background:' + mix('surface-gray-1', 'surface-white', 0.5) + '"></div><div class="pms-abs" style="left:240px;right:0;top:113px;height:1px;background:var(--color-outline-gray-1)"></div>' + box(257, 136, 72, 14, 5);
    for (let w = 0; w < 4; w++) {
      const x0 = 480 + 266 * w;
      grid += '<div class="pms-abs" style="left:' + (x0 + 190) + 'px;top:114px;width:76px;height:786px;background:var(--color-surface-gray-1)"></div><div class="pms-abs" style="left:' + x0 + 'px;top:114px;width:1px;height:786px;background:var(--color-outline-gray-1)"></div>';
      grid += '<div class="pms-abs" style="left:' + x0 + 'px;top:120px;width:266px;text-align:center;font-size:12px;color:var(--color-ink-gray-4)">' + WEEKS[w] + '</div>';
    }
    for (let d = 0; d < 28; d++) {
      const n = d < 20 ? 12 + d : d - 19;
      grid += '<div class="pms-abs" style="left:' + (480 + 38 * d) + 'px;top:150px;width:38px;text-align:center;font-size:13px;color:var(--color-ink-gray-4)">' + n + '</div>';
    }
    grid += rule(240, 175, 1200);
    grid += projectHead(175, 'Orion Release Readiness') + pill(748, 189, 186, 'surface-blue-2', 'ink-blue-3', '40h / week');
    grid += memberHead(236, '', 96) + pill(748, 250, 186, 'surface-white', 'ink-gray-5', '8h/day for 5 days', '', true);
    grid += memberHead(HY, 'Julian Andrews');
    grid += memberHead(358, '', 122);
    grid += rule(240, 459, 1200) + '<div class="pms-abs" style="left:272px;top:431px;height:16px;display:flex;align-items:center;gap:8px;font-weight:500;line-height:16px;white-space:nowrap">' + ic(IC.plus) + 'Add member</div>';
    for (let i = 0; i < 3; i++) {
      const y = 460 + 61 * i;
      grid += projectHead(y, '', 109 + i * 13);
      for (let w = 0; w < 4; w++) if ((w + i) % 3 !== 2) grid += box(480 + 266 * w + 2, y + 14, 186, 32);
    }
    const dlg = '<div class="pms-abs at-ov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)"></div><div class="pms-dialog at-dlg" style="left:464px;top:88px;height:724px">' +
      '<div class="pms-abs" style="left:14px;top:14px;font-size:16px;font-weight:600">Add allocation</div><div class="pms-abs" style="right:14px;top:14px;color:var(--color-ink-gray-6)">' + ic(IC.x) + '</div>' +
      label(14, 58, 'Project', 1) + '<div class="pms-input on" style="left:14px;top:83px;width:484px"><span>Orion Release Readiness</span>' + chev + '</div>' +
      label(14, 129, 'Customer') + '<div class="pms-input" style="left:14px;top:153px;width:484px;background:var(--color-surface-gray-2);border-color:var(--color-surface-gray-2);color:var(--color-ink-gray-5)"><span>Grant Plastics Ltd.</span>' + chev + '</div>' +
      label(14, 199, 'Employee', 1) + '<div class="pms-input on" style="left:14px;top:223px;width:484px"><span class="pms-av">J</span><span>Julian Andrews</span>' + chev + '</div>' +
      label(14, 269, 'Recurrence') + '<div class="pms-abs" style="left:14px;top:294px;width:484px;height:28px;border-radius:10px;background:var(--color-surface-gray-2)"><div class="pms-abs" style="left:1px;top:1px;width:240px;height:26px;border-radius:10px;background:var(--color-surface-white);box-shadow:0 1px 2px rgba(0,0,0,.1)"></div><div class="pms-abs" style="left:0;top:5px;width:242px;text-align:center">One time</div><div class="pms-abs" style="left:242px;top:5px;width:242px;text-align:center">Recurring</div></div>' +
      box(14, 342, 100, 10, 5) + box(14, 362, 14, 14, 4) + box(34, 364, 110, 10, 5) + box(14, 384, 14, 14, 4) + box(34, 386, 104, 10, 5) +
      label(14, 410, 'Start and end date', 1) + '<div class="pms-input on" style="left:14px;top:434px;width:484px"><span>Oct 26, 2026 - Oct 30, 2026</span><span style="margin-left:auto;color:var(--color-ink-gray-6);display:flex">' + ic(IC.cal) + '</span></div>' +
      label(14, 478, 'Hours / day', 1) + '<div class="pms-abs" style="left:14px;top:502px;width:237px;height:32px;border-radius:8px;background:var(--color-surface-gray-2);overflow:hidden"><div class="pms-abs" style="left:0;top:0;height:32px;width:100%;background:var(--color-surface-gray-4);border-radius:8px"><span class="pms-abs" style="right:8px;top:10px;width:2px;height:12px;border-radius:2px;background:rgba(23,23,23,.12)"></span></div><span class="pms-abs" style="right:10px;top:7px;font-variant-numeric:tabular-nums">08:00</span></div>' +
      label(261, 478, 'Total hours') + '<div class="pms-input on" style="left:261px;top:502px;width:237px"><span>40</span></div>' +
      '<div class="pms-abs" style="left:0;top:546px;width:512px;height:180px">' + box(14, 8, 14, 14, 4) + box(34, 10, 130, 10, 5) + box(14, 42, 40, 10, 5) + box(14, 61, 484, 61) + box(14, 144, 14, 14, 4) + box(34, 146, 110, 10, 5) + box(356, 137, 52, 28) + '<div class="pms-btn pms-btn-solid at-alloc" style="left:419px;top:137px;width:70px">Allocate</div></div></div>';
    const wash = '<div class="pms-abs at-wash" style="left:480px;top:176px;right:0;bottom:0;background:color-mix(in srgb, var(--color-surface-white) 50%, transparent)"></div>';
    const hover = '<div class="pms-abs at-hov" style="left:' + PX + 'px;top:' + PY + 'px;width:36px;height:32px;border-radius:8px;background:var(--color-surface-gray-3);color:var(--color-ink-gray-8);display:flex;align-items:center;justify-content:center">' + ic(IC.plus) + '</div>';
    const draft = '<div class="pms-pill at-draft" style="left:' + PX + 'px;top:' + PY + 'px;width:34px;padding-right:10px;gap:6px;background:var(--color-surface-gray-2);color:var(--color-ink-gray-5);box-shadow:0 0 0 2px var(--color-outline-gray-3)"><span style="min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis">Add allocation</span><span class="at-dh" style="flex:none">8h</span></div>';
    const end = '<div class="pms-abs at-end" style="left:' + (PX + 2) + 'px;top:' + (PY + 36) + 'px;height:28px;display:flex;align-items:center;gap:4px;font-size:13px;font-weight:500;color:var(--color-ink-gray-6);white-space:nowrap"><span style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-8)">' + ic(IC.x) + '</span><span class="at-ed">Oct 26</span></div>';
    const tip = '<div class="pms-tip at-tip" style="left:' + (PX + 17) + 'px;top:' + (PY - 26) + 'px">Click to add allocation<span class="pms-abs" style="left:50%;bottom:-3px;width:7px;height:7px;margin-left:-3.5px;background:var(--color-surface-gray-7);transform:rotate(45deg)"></span></div>';
    const added = pill(1014, PY, 0, 'surface-white', 'ink-gray-5', '8h/day for 5 days', 'at-newb', true) + pill(1014, 189, 0, 'surface-blue-2', 'ink-blue-3', '40h / week', 'at-news');
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam at-cam"><div class="pms-win">' + side + grid + wash + added + hover + draft + end + tip + dlg + '<div class="pms-ring at-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.at-' + c);
    for (const k of ['wash', 'hov', 'draft', 'dh', 'end', 'ed', 'tip', 'newb', 'news', 'cam', 'ov', 'dlg', 'alloc', 'ring']) this[k] = q(k);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.12, hold: 0.6, drift: [2, 0, 0.004] },
      { t: 1.6, cx: 1120, cy: 461, z: 1.55, hold: 3.4, drift: [1.5, 0, 0.003] },
      { t: 5.8, cx: 960, cy: 420, z: 1.9, hold: 1.8, drift: [0, 1.5, 0.003] },
      { t: 8.4, cx: 960, cy: 720, z: 1.9, hold: 1.2 },
      { t: 10.6, cx: 1120, cy: 461, z: 1.55, drift: [1.5, 0, 0.004] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1500, 900] }, { t: 1.4, at: [1500, 900] }, { t: 2.1, at: [1271, 417] }, { t: 2.75, at: [1271, 417] }, { t: 4.35, at: [1423, 417] },
      { t: 8.4, at: [1423, 417] }, { t: 9.1, at: [1158, 875] }, { t: 9.9, at: [1158, 875] }, { t: 10.8, at: [1500, 640] },
    ];
    // The press shows a click ring because the app keeps the arrow cursor while dragging.
    this.cur.clicks = [T.press, T.alloc];
    this.cur.holds = [[T.press, T.release]];
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    // The draft appears on press, follows the pointer, then snaps to whole days on release.
    const pressed = t >= T.press, gone = t >= T.close + 0.15;
    const dx = SPAN * eio(seg(t, T.d0, T.d1));
    const n = Math.min(4, Math.max(0, Math.floor((19 + dx) / 38))) + 1;
    const w = t >= T.release ? 38 * n - 4 : 34 + dx;
    this.hov.style.opacity = pressed ? 0 : eo(seg(t, T.arrive, T.arrive + 0.1));
    for (const el of [this.draft, this.end, this.tip]) el.style.visibility = pressed && !gone ? 'visible' : 'hidden';
    this.draft.style.width = w + 'px';
    this.dh.textContent = n * 8 + 'h';
    this.ed.textContent = 'Oct ' + (25 + n);
    this.tip.style.transform = 'translateX(' + (w / 2 - 17) + 'px) translateX(-50%)';
    this.wash.style.opacity = eo(seg(t, T.d0, T.d0 + 0.15)) * (1 - seg(t, T.close, T.close + 0.15));
    const open = eo(seg(t, T.open, T.open + 0.15)) * (1 - ei(seg(t, T.close, T.close + 0.15)));
    this.ov.style.opacity = open;
    this.dlg.style.opacity = open;
    this.dlg.style.visibility = open > 0 ? 'visible' : 'hidden';
    this.dlg.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, T.open, T.open + 0.15))) + ')';
    this.alloc.style.background = t >= 9.1 && t < T.close ? 'var(--color-surface-gray-6)' : 'var(--color-surface-gray-7)';
    this.alloc.style.transform = 'scale(' + (1 - 0.04 * seg(t, T.alloc - 0.05, T.alloc) * (1 - seg(t, T.alloc, T.alloc + 0.12))) + ')';
    for (const el of [this.newb, this.news]) {
      el.style.width = eio(seg(t, T.fill, T.fill + 0.4)) * 186 + 'px';
      el.style.visibility = t > T.fill ? 'visible' : 'hidden';
    }
    let g = null;
    for (const x of RINGS) if (t >= x[0] && t < x[1]) g = x;
    const s = this.ring.style;
    if (g) {
      s.left = g[2] + 'px'; s.top = g[3] + 'px'; s.width = g[4] + 'px'; s.height = g[5] + 'px';
      s.opacity = Math.min(eo(seg(t, g[0], g[0] + 0.25)), 1 - seg(t, g[1] - 0.15, g[1]));
    } else s.opacity = 0;
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
