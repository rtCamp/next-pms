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
const WEEKS = ['Oct 12 - 18', 'Oct 19 - 25', 'Oct 26 - Nov 1', 'Nov 2 - 8'];
const ic = (p, sz) => '<svg width="' + (sz || 16) + '" height="' + (sz || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none">' + p + '</svg>';
const box = (x, y, w, h, r) => '<div class="pms-ghost" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px' + (r !== undefined ? ';border-radius:' + r + 'px' : '') + '"></div>';
const LINE = 'var(--color-outline-gray-1)';
const mix = (a, b, p) => 'color-mix(in srgb, var(--color-' + a + '), var(--color-' + b + ') ' + p * 100 + '%)';
// Rows are 61 px (60 plus the 1 px header border), the Add member row is 41. Orion Release Readiness is expanded at y 175.
const BAR_L = 748, BAR_Y = 311, COL = 38;
const barW = (n) => n * COL - 4;
const WARP = [[0.0, 0.0], [2.352, 1.47], [2.652, 1.47], [5.132, 3.02], [5.432, 3.02], [7.032, 4.02], [7.332, 4.02], [8.292, 4.62], [8.592, 4.62], [13.04, 7.4]];
const warp = (t) => { if (t <= 0) return t; for (let i = 1; i < WARP.length; i++) { const [n1, o1] = WARP[i], [n0, o0] = WARP[i - 1]; if (t <= n1) return n1 === n0 ? o1 : o0 + (t - n0) / (n1 - n0) * (o1 - o0); } const [n, o] = WARP[WARP.length - 1]; return o + (t - n); };
kit.scene('resize-allocation-project', {
  init(kit) {
    const side = SHELL('alloc-project');
    let grid = '<div class="pms-abs" style="left:480px;right:0;top:236px;height:224px;background:' + mix('surface-gray-1', 'surface-white', 0.5) + '"></div>';
    grid += '<div class="pms-abs" style="left:240px;right:0;top:113px;height:1px;background:' + LINE + '"></div>' + box(257, 136, 72, 14, 5);
    for (let w = 0; w < 4; w++) {
      const x0 = 480 + 266 * w;
      grid += '<div class="pms-abs" style="left:' + (x0 + 190) + 'px;top:144px;width:76px;height:756px;border-radius:8px 8px 0 0;background:color-mix(in srgb, var(--color-surface-gray-3) 20%, transparent)"></div><div class="pms-abs" style="left:' + x0 + 'px;top:114px;width:1px;height:786px;background:' + LINE + '"></div>';
      grid += '<div class="pms-abs" style="left:' + x0 + 'px;top:120px;width:266px;text-align:center;font-size:12px;color:var(--color-ink-gray-4)">' + WEEKS[w] + '</div>';
    }
    for (let d = 0; d < 28; d++) {
      const n = d < 20 ? 12 + d : d - 19;
      grid += '<div class="pms-abs" style="left:' + (480 + COL * d) + 'px;top:150px;width:38px;text-align:center;font-size:13px;color:var(--color-ink-gray-4)">' + n + '</div>';
    }
    grid += '<div class="pms-abs" style="left:240px;right:0;top:175px;height:1px;background:' + LINE + '"></div>';
    const rowLine = (y, w) => '<div class="pms-abs" style="left:240px;width:' + w + 'px;top:' + y + 'px;height:1px;background:' + LINE + '"></div>';
    const summary = (x, w, txt, cls) => '<div class="pms-pill' + (cls ? ' ' + cls : '') + '" style="left:' + x + 'px;top:189px;width:' + w + 'px;background:var(--color-surface-blue-2);color:var(--color-ink-blue-3)">' + txt + '</div>';
    // Header cells share one layout: pl-3 chevron on projects, pl-8 on members, name line at y 12, subtext line at y 35.
    const head = (y, text, w, isProject) => rowLine(y + 60, 240) + (isProject ? box(252, y + 12.5, 16, 16, 4) + box(272, y + 12.5, 16, 16, 4) : box(272, y + 12.5, 16, 16, 8)) +
      (text ? '<div class="pms-abs" style="left:296px;top:' + (y + 12) + 'px;color:var(--color-ink-gray-4)">' + text + '</div>' : box(296, y + 15, w, 11, 5)) + box(296, y + 35.5, 110, 9, 4);
    // The expanded project: weekly summary bars on its row, a member row under it for each allocated member.
    grid += head(175, 'Orion Release Readiness', 0, true) + summary(482, 186, '40h / week') + summary(BAR_L, 186, '20h / week') + summary(1014, 0, '20h / week', 'at-full');
    grid += head(236, '', 96) + box(482, 250, 186, 32);
    grid += head(297, 'Julian Andrews', 0);
    grid += head(358, '', 122) + box(482, 372, 186, 32);
    grid += '<div class="pms-abs" style="left:272px;top:431px;height:16px;display:flex;align-items:center;gap:8px;font-weight:500;line-height:16px;white-space:nowrap">' + ic('<path d="M5 12h14"/><path d="M12 5v14"/>') + 'Add member</div>' + rowLine(459, 1200);
    for (let i = 0; i < 4; i++) {
      const y = 460 + 61 * i;
      grid += head(y, '', 109 + i * 13, true);
      for (let w = 0; w < 4; w++) if ((w + i) % 3 !== 2) grid += box(480 + 266 * w + 2, y + 14, 186, 32);
    }
    const overlay = '<div class="pms-abs at-ov" style="left:480px;top:175px;right:0;bottom:0;background:color-mix(in srgb, var(--color-surface-white) 50%, transparent)"></div>';
    const bar = '<div class="pms-abs at-bar" style="left:' + BAR_L + 'px;top:' + BAR_Y + 'px;width:' + barW(5) + 'px;height:32px;border-radius:9px;background:var(--color-surface-white);box-shadow:0 0 1px rgba(0,0,0,.14),0 1px 3px rgba(0,0,0,.14);display:flex;align-items:center;padding-left:10px;font-size:13px;font-weight:500;color:var(--color-ink-gray-5);white-space:nowrap;overflow:visible">' +
      '<span class="at-lab">4h/day for 5 days</span>' +
      '<span class="pms-abs at-g1" style="left:4px;top:8px;width:2px;height:16px;border-radius:2px;background:var(--color-surface-gray-4)"></span><span class="pms-abs at-g2" style="right:4px;top:8px;width:2px;height:16px;border-radius:2px;background:var(--color-surface-gray-4)"></span>' +
      '<span class="pms-abs at-rbar" style="inset:-6px;border:3px solid var(--accent);border-radius:12px;opacity:0"></span>' + '<span class="pms-abs at-dash" style="inset:0;border:1px dashed var(--color-surface-amber-3);border-radius:9px"></span>' +
      '<div class="pms-abs at-btns" style="right:0;top:36px;display:flex;gap:4px;align-items:center"><div style="height:28px;padding:0 8px;display:flex;align-items:center;font-size:14px;color:var(--color-ink-gray-8)">Cancel</div><div class="at-save" style="position:relative;height:28px;padding:0 8px;border-radius:8px;background:var(--color-surface-gray-7);color:var(--color-ink-white);display:flex;align-items:center;font-size:14px">Save<span class="pms-abs at-rsave" style="inset:-6px;border:3px solid var(--accent);border-radius:11px;opacity:0"></span></div></div></div>';
    const lab = (x, y, w) => box(x, y, w, 10, 5);
    const dlg = '<div class="pms-abs at-dov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)"></div><div class="pms-abs at-dlg" style="left:464px;top:88px;width:512px;height:724px;background:var(--color-surface-modal);border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.18)">' +
      '<div class="pms-abs" style="left:14px;top:14px;font-size:16px;font-weight:500;color:var(--color-ink-gray-7)">Edit allocation</div><div class="pms-abs" style="right:14px;top:14px;color:var(--color-ink-gray-6)">' + ic('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>') + '</div>' +
      lab(14, 61, 56) + box(14, 83, 484, 32) + lab(14, 132, 64) + box(14, 153, 484, 32) + lab(14, 202, 70) + box(14, 223, 484, 32) + lab(14, 272, 76) + box(14, 294, 484, 28, 10) + lab(14, 345, 96) +
      '<div class="pms-abs" style="left:14px;top:360px;display:flex;align-items:center;gap:8px;font-size:14px;color:var(--color-ink-gray-6)"><div class="at-cb" style="width:14px;height:14px;border:1px solid var(--color-outline-gray-4);border-radius:4px;box-sizing:border-box;color:var(--color-ink-white);display:flex;align-items:center;justify-content:center">' + ic('<path d="M20 6 9 17l-5-5"/>', 11) + '</div>Include weekends<span class="pms-abs at-rcb" style="inset:-6px;border:3px solid var(--accent);border-radius:11px;opacity:0;z-index:1"></span></div>' +
      box(14, 384, 14, 14, 4) + lab(34, 386, 104) +
      '<div class="pms-label" style="left:14px;top:410px">Start and end date<b>*</b></div>' + lab(414, 413, 84) + '<div class="pms-input on" style="left:14px;top:434px;width:484px">Oct 19, 2026 - Oct 30, 2026<span style="margin-left:auto;color:var(--color-ink-gray-6);display:flex">' + ic('<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>') + '</span></div>' +
      lab(14, 481, 76) + box(14, 502, 237, 32) +
      '<div class="pms-label" style="left:261px;top:478px">Total hours</div><div class="pms-input on" style="left:261px;top:502px;width:237px"><span class="at-tot">40</span></div>' +
      box(14, 554, 14, 14, 4) + lab(34, 556, 130) + lab(14, 588, 40) + box(14, 607, 484, 61) + box(14, 690, 14, 14, 4) + lab(34, 692, 110) + box(300, 683, 70, 28) +
      '<div class="pms-btn pms-btn-solid at-sc" style="right:14px;top:683px">Save Changes<span class="pms-abs at-rsc" style="inset:-6px;border:3px solid var(--accent);border-radius:11px;opacity:0"></span></div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam at-cam"><div class="pms-win">' + side + grid + overlay + bar + dlg + '<div class="pms-abs at-rpill" style="left:1008px;top:183px;width:198px;height:44px;border:3px solid var(--accent);border-radius:11px;box-sizing:border-box;opacity:0"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.at-' + c);
    for (const k of ['cam', 'ov', 'bar', 'lab', 'g1', 'g2', 'dash', 'btns', 'save', 'full', 'rbar', 'rsave', 'rcb', 'rsc', 'rpill', 'dov', 'dlg', 'cb', 'tot', 'sc']) this[k] = q(k);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.12, hold: 0.35 },
      { t: 1.0, cx: 1070, cy: 430, z: 1.6, hold: 2.2 },
      { t: 3.75, cx: 960, cy: 700, z: 1.9, hold: 1.05 },
      { t: 5.4, cx: 1070, cy: 430, z: 1.6, drift: [-2, 0, 0.004] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1500, 900] }, { t: 1.0, at: [1080, 417] }, { t: 1.4, at: [1169, 417] },
      { t: 1.55, at: [1169, 417] }, { t: 2.45, at: [1435, 417] },
      { t: 2.95, at: [1412, 451] }, { t: 3.95, at: [725, 547] }, { t: 4.55, at: [1150, 875] },
      { t: 5.5, at: [1340, 240] }, { t: 7.4, at: [1350, 246] },
    ];
    this.cur.holds = [[1.5, 2.5]];
    this.cur.clicks = [1.5, 3.05, 4.05, 4.65];
  },
  render(t) {
    t = warp(t);
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const dx = 266 * eio(seg(t, 1.55, 2.45));
    const n = 5 + Math.round(dx / COL);
    this.bar.style.width = barW(5) + dx + 'px';
    this.lab.textContent = '4h/day for ' + n + ' day' + (n !== 1 ? 's' : '');
    const editing = seg(t, 2.45, 2.6) * (1 - seg(t, 4.9, 5.05));
    this.ov.style.opacity = editing;
    this.dash.style.opacity = editing;
    const hover = seg(t, 0.95, 1.1) * (1 - seg(t, 4.9, 5.05));
    this.g1.style.opacity = hover;
    this.g2.style.opacity = hover;
    const b = eo(seg(t, 2.5, 2.65)) * (1 - seg(t, 3.1, 3.22));
    this.btns.style.opacity = b;
    this.btns.style.transform = 'translateY(' + lerp(-4, 0, eo(seg(t, 2.5, 2.65))) + 'px)';
    this.btns.style.visibility = b > 0 ? 'visible' : 'hidden';
    this.save.style.transform = 'scale(' + (1 - 0.04 * seg(t, 3.0, 3.05) * (1 - seg(t, 3.05, 3.17))) + ')';
    this.full.style.width = eio(seg(t, 5.2, 5.6)) * 186 + 'px';
    this.full.style.visibility = t > 5.2 ? 'visible' : 'hidden';
    const d = eo(seg(t, 3.2, 3.35)) * (1 - seg(t, 4.75, 4.9));
    this.dov.style.opacity = d; this.dlg.style.opacity = d;
    this.dlg.style.visibility = d > 0 ? 'visible' : 'hidden';
    this.dlg.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, 3.2, 3.35))) + ')';
    const on = t >= 4.07;
    this.cb.style.background = on ? 'var(--color-surface-gray-7)' : 'var(--color-surface-white)';
    this.cb.style.borderColor = on ? 'var(--color-surface-gray-7)' : 'var(--color-outline-gray-4)';
    this.tot.textContent = t >= 4.1 ? '48' : '40';
    this.sc.style.transform = 'scale(' + (1 - 0.04 * seg(t, 4.6, 4.65) * (1 - seg(t, 4.65, 4.77))) + ')';
    const fade = (el, a, b) => { el.style.opacity = Math.max(0, Math.min(eo(seg(t, a, a + 0.25)), 1 - seg(t, b - 0.15, b))); };
    fade(this.rbar, 0.9, 2.5);
    fade(this.rsave, 2.6, 3.15);
    fade(this.rcb, 3.6, 4.3);
    fade(this.rsc, 4.3, 4.75);
    fade(this.rpill, 5.2, 7.4);
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
