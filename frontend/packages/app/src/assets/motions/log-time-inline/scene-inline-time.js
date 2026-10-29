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
const COLS = [916, 981, 1046, 1111, 1176, 1241, 1306];
const DATES = ['Oct 12', 'Oct 13', 'Oct 14', 'Oct 15', 'Oct 16', 'Oct 17', 'Oct 18'];
const TASK = 'Design system component refinements';
const COMMENT = 'Integration tests';
const RED = 'var(--color-ink-red-4)', GREEN = 'var(--color-ink-green-4)';
const PLUS = '<path d="M7.99805 2.75C8.27402 2.7502 8.49805 2.97398 8.49805 3.25V7.49805H12.7451C13.0213 7.49805 13.2451 7.7219 13.2451 7.99805C13.2449 8.27402 13.0211 8.49805 12.7451 8.49805H8.49805V12.7451C8.49805 13.0211 8.27402 13.2449 7.99805 13.2451C7.7219 13.2451 7.49805 13.0213 7.49805 12.7451V8.49805H3.25C2.97398 8.49805 2.7502 8.27402 2.75 7.99805C2.75 7.7219 2.97386 7.49805 3.25 7.49805H7.49805V3.25C7.49805 2.97386 7.7219 2.75 7.99805 2.75Z" fill="currentColor"/>';
const i16 = (inner) => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none">' + inner + '</svg>';
const CHEV = '<path d="M11.3848 5.6582C11.5735 5.45686 11.8903 5.44622 12.0918 5.63477C12.2931 5.82353 12.3038 6.14033 12.1152 6.3418L8.36523 10.3418C8.27071 10.4426 8.1382 10.5 8 10.5C7.8618 10.5 7.72929 10.4426 7.63477 10.3418L3.88477 6.3418C3.69622 6.14033 3.70686 5.82353 3.9082 5.63477C4.10967 5.44622 4.42647 5.45686 4.61523 5.6582L8 9.26855L11.3848 5.6582Z" fill="currentColor"/>';
const TASKIC = '<g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M8 1.333V4m2.8 1.2 1.933-1.933M12 8h2.667M10.8 10.8l1.933 1.933M8 12v2.667m-4.733-1.934L5.2 10.8M1.333 8H4m-.733-4.733L5.2 5.2"/></g>';
const POP = { x: 802, y: 316 };
const RINGS = [[1.6, 3.1, 1014, 276, 64, 36], [3.2, 5.6, 807, 321, 264, 36], [5.7, 8.0, 807, 357, 264, 104], [8.1, 9.15, 807, 461, 118, 36], [9.5, 11.0, 1012, 274, 68, 40], [11.0, 13.5, 1334, 186, 64, 128]];
const cell = (x, txt, cls, sty) => '<div class="pms-cell ' + (cls || '') + '" style="left:' + (x - 268) + 'px;' + (sty || '') + '">' + txt + '</div>';
const bar = (x, y, w, h) => '<div class="pms-bar" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + (h || 10) + 'px"></div>';
const gb = (x, y, w, h) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:8px;background:var(--color-surface-gray-3)"></div>';
kit.scene('inline-time', {
  init(kit) {
    const side = SHELL('personal');
    let head = '<div class="pms-row" style="top:100px;height:40px">' + bar(32, 16, 130, 8);
    COLS.forEach((x) => { head += bar(x - 256, 16, 32, 8); });
    head += bar(1110, 16, 40, 8) + '</div>';
    let week = '<div class="pms-row" style="top:140px"><div class="pms-abs" style="left:32px;top:13px;color:var(--color-ink-gray-5)">Last week</div>';
    DATES.forEach((d, i) => { week += cell(COLS[i], d); });
    week += cell(1366, 'Total') + gb(1156, 8, 28, 28) + '</div>';
    const vals = (cls, bold) => {
      let r = '';
      COLS.forEach((x, i) => {
        if (i === 2) r += cell(x, '-', 'it-wed' + cls, 'color:var(--color-ink-gray-4)');
        else if (i < 5) r += cell(x, '08:00', '', 'color:var(--color-ink-gray-8)' + (bold ? ';font-weight:500' : ''));
        else r += cell(x, '-', '', 'color:var(--color-ink-gray-4)');
      });
      return r + cell(1366, '32:00', 'it-tot' + cls, 'color:' + RED + ';font-weight:500');
    };
    const all = '<div class="pms-row" style="top:184px">' + bar(48, 17, 120) + vals('a', true) + '</div>';
    const proj = '<div class="pms-row" style="top:228px"><div class="pms-abs" style="left:26px;top:14px;display:flex;gap:6px;color:var(--color-ink-gray-3)">' + i16(CHEV) + '</div>' + bar(70, 17, 150) + vals('p') + '</div>';
    const task = '<div class="pms-row" style="top:272px"><div class="pms-abs" style="left:70px;top:12px;display:flex;align-items:center;gap:6px;color:var(--color-ink-gray-4)">' + i16(TASKIC) + '<span>' + TASK + '</span></div>' + vals('t') + '<div class="pms-abs it-hbg" style="left:778px;top:8px;width:56px;height:28px;border-radius:8px;background:var(--color-surface-gray-2)"></div><div class="pms-abs it-hov" style="left:778px;top:8px;width:56px;height:28px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-8)">' + i16(PLUS) + '</div></div>';
    let skel = '';
    for (let i = 0; i < 12; i++) {
      let r = '<div class="pms-row" style="top:' + (316 + i * 44) + 'px">' + bar(i % 3 ? 48 : 32, 17, i % 3 ? 160 + (i * 53) % 120 : 110);
      COLS.forEach((x) => { r += bar(x - 256, 18, 32, 8); });
      skel += r + bar(1110, 18, 40, 8) + '</div>';
    }
    const pop = '<div class="pms-pop it-pop" style="left:' + POP.x + 'px;top:' + POP.y + 'px">' +
      '<div class="pms-abs" style="left:8px;top:8px;width:256px;height:28px;border-radius:8px;background:var(--color-surface-gray-2);overflow:hidden"><div class="pms-abs it-fill" style="left:0;top:0;height:28px;width:0;background:var(--color-surface-gray-4);border-radius:8px"><span class="pms-abs" style="right:6px;top:8px;width:2px;height:12px;border-radius:2px;background:rgba(23,23,23,.12)"></span></div>' +
      '<span class="pms-abs" style="left:10px;top:6px;font-size:13px">Duration</span><span class="pms-abs it-dv" style="right:10px;top:6px;font-size:13px;font-variant-numeric:tabular-nums">00:00</span></div>' +
      '<div class="pms-abs" style="left:8px;top:44px;width:256px;height:96px;border:1px solid var(--color-outline-gray-2);border-radius:10px;box-sizing:border-box;padding:8px 10px;font-size:14px"><span class="it-ph" style="color:var(--color-ink-gray-4)">Comment</span><span class="it-cv"></span><span class="it-caret" style="display:inline-block;width:2px;height:17px;background:var(--color-ink-gray-8);margin-left:1px;vertical-align:-3px"></span><span class="pms-abs it-hint" style="right:8px;bottom:6px;font-size:12px;color:var(--color-ink-gray-4)">⌘+↵</span></div>' +
      '<div class="pms-btn pms-btn-soft it-save" style="left:8px;top:148px;width:110px;gap:8px;color:var(--color-ink-gray-4)">' + i16(PLUS) + 'Save entry</div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam it-cam"><div class="pms-win">' + side +
      head + week + all + proj + task + '<div class="pms-abs" style="left:0;right:0;top:0;height:900px">' + skel + '</div>' + pop + '<div class="pms-ring it-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.it-' + c);
    for (const k of ['cam', 'pop', 'fill', 'dv', 'ph', 'cv', 'caret', 'hint', 'save', 'ring', 'hov', 'hbg']) this[k] = q(k);
    this.weds = ['weda', 'wedp', 'wedt'].map(q);
    this.tots = ['tota', 'totp', 'tott'].map(q);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.12, hold: 0.8 },
      { t: 2.0, cx: 1210, cy: 470, z: 2.1, hold: 8.2, drift: [0, 0, 0.003] },
      { t: 11.0, cx: 1170, cy: 375, z: 1.9, drift: [-2, 0, 0.004] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0.8, at: [1500, 900] }, { t: 2.2, at: [1288, 386] },
      { t: 3.4, at: [1288, 386] }, { t: 4.1, at: [1242, 428] }, { t: 4.7, at: [1242, 428] }, { t: 5.4, at: [1304, 428] },
      { t: 5.8, at: [1304, 428] }, { t: 6.5, at: [1150, 482] }, { t: 8.2, at: [1150, 484] }, { t: 8.8, at: [1104, 568] },
      { t: 9.4, at: [1104, 568] }, { t: 10.4, at: [1440, 470] }, { t: 13.5, at: [1450, 476] },
    ];
    this.cur.clicks = [4.3, 6.6, 9.0];
    this.cur.holds = [[4.7, 5.45]];
    this.com = kit.typist(COMMENT, 6.8, 18);
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const open = eo(seg(t, 2.6, 2.85)) * (1 - ei(seg(t, 9.15, 9.35)));
    this.pop.style.opacity = open;
    this.pop.style.visibility = open > 0 ? 'visible' : 'hidden';
    this.pop.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, 2.6, 2.85))) + ')';
    const hrs = t < 4.3 ? 0 : Math.round(lerp(6, 8, eio(seg(t, 4.75, 5.4))) * 4) / 4;
    const mins = Math.round(hrs * 60);
    this.fill.style.width = (hrs / 8 * 100) + '%';
    this.fill.style.visibility = hrs > 0 ? 'visible' : 'hidden';
    this.dv.textContent = String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
    const typed = this.com.at(t);
    this.cv.textContent = typed;
    this.ph.style.display = typed ? 'none' : 'inline';
    this.hint.style.opacity = typed ? 0 : 1;
    const typing = t > 6.8 && t < this.com.end;
    this.caret.style.opacity = t > 6.6 && t < 9.15 && (typing || t < 6.8 || Math.floor(t / 0.53) % 2 === 0) ? 1 : 0;
    this.save.style.color = hrs > 0 ? 'var(--color-ink-gray-8)' : 'var(--color-ink-gray-4)';
    this.save.style.transform = 'scale(' + (1 - 0.04 * seg(t, 8.95, 9.0) * (1 - seg(t, 9.0, 9.12))) + ')';
    const done = t >= 9.4;
    const hov = t >= 2.2 && t < 9.4;
    this.hov.style.opacity = hov ? 1 : 0;
    this.hbg.style.opacity = eio(seg(t, 2.2, 2.35)) * (1 - eio(seg(t, 9.4, 9.55)));
    this.weds[2].style.opacity = hov ? 0 : 1;
    for (const el of this.weds) { el.textContent = done ? '08:00' : '-'; el.style.color = done ? 'var(--color-ink-gray-8)' : 'var(--color-ink-gray-4)'; el.style.fontWeight = done ? '500' : '400'; }
    // In the app a project row's total is always green and a task row's always gray.
    this.tots.forEach((el, i) => { el.textContent = done ? '40:00' : '32:00'; el.style.color = [done ? GREEN : RED, GREEN, 'var(--color-ink-gray-6)'][i]; });
    let r = null;
    for (const g of RINGS) if (t >= g[0] && t < g[1]) r = g;
    if (r) {
      const s = this.ring.style;
      s.left = r[2] + 'px'; s.top = r[3] + 'px'; s.width = r[4] + 'px'; s.height = r[5] + 'px';
      s.opacity = Math.min(eo(seg(t, r[0], r[0] + 0.25)), 1 - seg(t, r[1] - 0.15, r[1]));
    } else this.ring.style.opacity = 0;
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
