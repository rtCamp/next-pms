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
const T = { r1: 2.4, c1: 3.4, open: 3.45, r2: 7.15, c2: 7.55, r3: 8.45, c3: 9.35, close: 9.55, change: 11.0, r4: 11.2 };
const COL = i => 885.5 + 64 * i;
const G = (x, y, w, h, r) => {
  if (r == null && w === h && w <= 18) { const d = (w - 14) / 2; x += d; y += d; w = h = 14; r = 4; }
  else if (r == null && h <= 22) { y += (h - 10) / 2; h = 10; r = 5; }
  return '<i class="gh" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px' + (r == null ? '' : ';border-radius:' + r + 'px') + '"></i>';
};
const NUM = (cx, cy, w) => G(cx - w / 2, cy - 4, w, 8, 4);
const L = (x, y, w) => '<i class="hair" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px"></i>';
const CHECK = '<svg class="ic" viewBox="0 0 16 16"><path fill="currentColor" d="M13.083 3.38232C13.2635 3.17364 13.5792 3.15115 13.7881 3.33154C13.9968 3.51208 14.0202 3.82774 13.8398 4.03662L6.42871 12.6167C6.33494 12.7251 6.19902 12.789 6.05566 12.7905C5.91224 12.7919 5.77468 12.7311 5.67871 12.6245L2.16797 8.72412C1.98372 8.51899 2.00032 8.20273 2.20508 8.01807C2.41033 7.83334 2.72738 7.84992 2.91211 8.05518L6.04199 11.5337L13.083 3.38232Z"/></svg>';
const CIRC = '<svg class="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.75"/><path d="M5.4 8.2l1.8 1.8 3.4-3.9"/></svg>';
const TICK = '<svg width="14" height="14" viewBox="0 0 14 14" style="display:block"><path d="M3.4 7.2l2.4 2.4 4.8-5.2" fill="none" stroke="var(--color-ink-white)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const DAYS = ['Mon, Oct 12', 'Tue, Oct 13', 'Wed, Oct 14', 'Thu, Oct 15', 'Fri, Oct 16'];
const fade = (t, a, b) => eo(seg(t, a, a + 0.25)) * (1 - ei(seg(t, b, b + 0.25)));
const dip = (t, c) => 1 - 0.04 * seg(t, c, c + 0.06) * (1 - seg(t, c + 0.12, c + 0.24));
const mix = (a, b, p) => 'color-mix(in srgb, var(--color-' + a + '), var(--color-' + b + ') ' + p * 100 + '%)';
const TOT = 1338.5;
const hours = (y) => { let s = ''; for (let i = 0; i < 7; i++) s += NUM(COL(i), y + 22, 32); return s + NUM(TOT, y + 22, 40); };
const row = (y, nw, bw, icon) => G(290, y + 14, 16, 16) + G(314, y + 14, 16, 16, 8) + G(338, y + 14, nw, 16) + G(346 + nw, y + 12, bw, 20, 9999) + hours(y) + (icon ? G(1382, y + 8, 28, 28, 8) : '') + L(260, y + 44, 1154);
const week = (y, w, cols) => { let s = G(272, y + 14, 16, 16) + G(296, y + 14, w, 16); if (cols) { for (let i = 0; i < 7; i++) s += NUM(COL(i), y + 22, 32); s += NUM(TOT, y + 22, 40); } return s + L(260, y + 44, 1154); };
kit.scene('partial', {
  init(kit) {
    let p = '<div class="review-page" style="position:absolute;inset:0">' + SHELL('team');
    p += G(272, 119, 195, 15);
    for (let i = 0; i < 7; i++) p += NUM(COL(i), 126.5, 32);
    p += NUM(TOT, 126.5, 40) + L(260, 143, 1154) + week(157, 118, true);
    p += '<span class="review-pend" style="position:absolute;left:422px;top:171px;font-size:14px;line-height:16px;color:var(--color-ink-gray-5);white-space:nowrap">· 1 pending approval</span>';
    p += row(202, 84, 90, false);
    p += G(290, 261, 16, 16) + G(314, 261, 16, 16, 8) + hours(247) + L(260, 291, 1154);
    p += '<div style="position:absolute;left:338px;top:259px;height:20px;display:flex;align-items:center;gap:8px"><span class="lm" style="font-size:14px;font-weight:500;line-height:16px">Julian Andrews</span><span style="position:relative;display:block;height:20px"><span class="badge review-b1" style="position:relative;background:var(--color-surface-amber-2);color:var(--color-ink-amber-4)">Approval pending</span><span class="badge review-b2" style="left:0;top:0;background:var(--color-surface-green-2);color:var(--color-ink-green-4);opacity:0">Partially approved</span></span></div>';
    p += '<div class="btn review-st" style="left:1382px;top:255px;width:28px;background:var(--color-surface-gray-7);color:var(--color-ink-white)">' + CHECK + '</div><div class="btn review-st2" style="left:1382px;top:255px;width:28px;color:var(--color-ink-green-4);opacity:0">' + CIRC + '</div>';
    p += '<div class="ring review-r1" style="left:1375px;top:248px;width:42px;height:42px;border-radius:15px"></div><div class="ring review-r4" style="border-radius:9999px"></div>';
    p += row(292, 96, 66, true);
    [[337, 128], [382, 124], [427, 132], [472, 120], [517, 126], [562, 118]].forEach(([y, w]) => { p += week(y, w, false); });
    p += '</div><div class="review-bk" style="position:absolute;inset:0;background:rgba(0,0,0,.27);opacity:0"></div>';
    let q = '<div class="review-pn" style="position:absolute;left:950px;top:10px;width:480px;height:880px;background:var(--color-surface-modal);border-radius:16px;overflow:hidden;opacity:0;box-shadow:0 0 1px rgba(0,0,0,.19),0 1px 2px rgba(0,0,0,.07),0 6px 15px -5px rgba(0,0,0,.11)">';
    q += G(14, 17, 16, 16, 8) + G(42, 16, 92, 18) + G(146, 17, 106, 16) + G(391, 16, 47, 18) + G(450, 17, 16, 16) + L(0, 50, 480);
    const tw = [148, 132, 160, 140, 152], pw = [96, 110, 88, 104, 96], dw = [210, 176, 232, 190, 168];
    DAYS.forEach((d, i) => {
      const y = 51 + 150 * i;
      q += '<div style="position:absolute;left:0;top:' + y + 'px;width:480px;height:42px;background:var(--color-surface-gray-2)"></div>' + G(14, y + 13, 16, 16);
      q += '<span class="lm" style="position:absolute;left:38px;top:' + (y + 13) + 'px;font-size:14px;font-weight:500;line-height:16px">' + d + '</span>';
      q += G(393, y + 12, 47, 18) + '<div class="cb" style="left:452px;top:' + (y + 15) + 'px;background:var(--color-surface-gray-7)">' + TICK + '</div>' + L(0, y + 42, 480);
      q += G(14, y + 59, 16, 16) + G(42, y + 59, tw[i], 16) + G(48 + tw[i], y + 59, 16, 16) + G(42, y + 79, pw[i], 14) + G(42, y + 105, dw[i], 21) + G(391, y + 52, 54, 30, 10) + L(0, y + 149, 480);
    });
    q += L(0, 822, 480) + G(14, 837, 81, 28, 8) + '<div class="btn review-ap" style="left:371px;top:837px;width:95px;background:var(--color-surface-green-5);color:var(--color-ink-white)">' + CIRC + '<span>Approve</span></div>';
    q += '<div class="ring review-r2" style="left:445px;top:659px;width:28px;height:28px;border-radius:9px"></div>';
    q += '<div class="ring review-r3" style="left:364px;top:830px;width:109px;height:42px;border-radius:15px"></div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="review-cam" style="position:absolute;left:0;top:0;width:1920px;height:1080px"><div class="win">' + p + q + '</div></div></div>'));
    const e = this.el = {};
    ['page', 'bk', 'pn', 'st', 'st2', 'b1', 'b2', 'pend', 'ap', 'r1', 'r2', 'r3', 'r4'].forEach(k => { e[k] = kit.stage.querySelector('.review-' + k); });
    e.fri = kit.stage.querySelectorAll('.review-pn .cb')[4];
    const wr = kit.stage.querySelector('.win').getBoundingClientRect(), k = wr.width / 1440, br = e.b2.getBoundingClientRect();
    const b = k > 0 && br.width > 0 ? { x: (br.left - wr.left) / k, y: (br.top - wr.top) / k, w: br.width / k, h: br.height / k } : { x: 426, y: 259, w: 114, h: 20 };
    Object.assign(e.r4.style, { left: (b.x - 7) + 'px', top: (b.y - 7) + 'px', width: (b.w + 14) + 'px', height: (b.h + 14) + 'px' });
    const cam = this.cam = new kit.Camera(kit.stage.querySelector('.review-cam'));
    cam.set([
      { t: 0, cx: 960, cy: 540, z: 1.1, hold: 1.0, drift: [2, 0, 0.006] },
      { t: 2.2, cx: 1200, cy: 360, z: 2.0, hold: 1.85, drift: [1.5, 0, 0.004] },
      { t: 5.05, cx: 1430, cy: 480, z: 2.2, hold: 0.55, drift: [0, 1.5, 0.003] },
      { t: 6.5, cx: 1430, cy: 712, z: 2.0, hold: 3.3, drift: [0, -1.5, 0.003] },
      { t: 10.8, cx: 1110, cy: 417, z: 1.65, drift: [1.5, 0, 0.004] },
    ]);
    const P = (x, y) => [x, y];
    const cur = this.cur = kit.cursor();
    kit.stage.querySelector('.review-cam').appendChild(cur.el);
    cur.keys = [
      { t: 0, at: P(1300, 560) }, { t: 2.3, at: P(1300, 560) }, { t: 3.0, at: P(1636, 359) },
      { t: 6.6, at: P(1636, 359) }, { t: 7.3, at: P(1649, 773) }, { t: 8.25, at: P(1649, 773) },
      { t: 8.95, at: P(1608.5, 951) }, { t: 9.85, at: P(1608.5, 951) }, { t: 10.65, at: P(1500, 600) },
    ];
    cur.clicks = [T.c1, T.c2, T.c3];
  },
  render(t) {
    this.cam.apply(t);
    const e = this.el;
    const o = eo(seg(t, T.open, T.open + 0.1)) * (1 - ei(seg(t, T.close, T.close + 0.15)));
    e.bk.style.opacity = o;
    e.pn.style.opacity = o;
    e.pn.style.visibility = o > 0 ? 'visible' : 'hidden';
    e.page.style.filter = o > 0 ? 'blur(' + (12 * o).toFixed(2) + 'px)' : 'none';
    const h1 = eio(seg(t, 3.0, 3.15)) * (1 - eio(seg(t, T.open, T.open + 0.15)));
    e.st.style.background = mix('surface-gray-7', 'surface-gray-6', h1);
    e.st.style.transform = 'scale(' + dip(t, T.c1) + ')';
    const done = t >= T.change;
    e.st.style.opacity = done ? 0 : 1;
    e.st2.style.opacity = done ? 1 : 0;
    e.b1.style.opacity = done ? 0 : 1;
    e.b2.style.opacity = done ? 1 : 0;
    e.pend.style.opacity = done ? 0 : 1;
    e.ap.style.background = mix('surface-green-5', 'green-700',eio(seg(t, 8.95, 9.1)));
    e.ap.style.transform = 'scale(' + dip(t, T.c3) + ')';
    e.r1.style.opacity = fade(t, T.r1, T.c1);
    const off = t >= T.c2, hv = eio(seg(t, 7.3, 7.45)) * (1 - eio(seg(t, 8.25, 8.4)));
    e.fri.style.background = off ? 'var(--color-surface-white)' : 'var(--color-surface-gray-7)';
    e.fri.style.border = off ? '1px solid ' + mix('outline-gray-4', 'outline-gray-5', hv) : 'none';
    e.fri.firstChild.style.visibility = off ? 'hidden' : 'visible';
    e.r2.style.opacity = fade(t, T.r2, T.c2);
    e.r3.style.opacity = fade(t, T.r3, T.c3);
    e.r4.style.opacity = eo(seg(t, T.r4, T.r4 + 0.25));
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / this.cam.at(t).z).toFixed(4) + ')';
  },
});
