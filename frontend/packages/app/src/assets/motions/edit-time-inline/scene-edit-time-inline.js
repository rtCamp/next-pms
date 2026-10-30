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
const DATES = ['Oct 12', 'Oct 13', 'Oct 14', 'Oct 15', 'Oct 16', 'Oct 17', 'Oct 18'];
const TASK = 'Design system component refinements';
const COMMENT = 'Button states and tokens';
const RED = 'var(--color-ink-red-4)', GREEN = 'var(--color-ink-green-4)', AMBER = 'var(--color-surface-amber-3)';
const i16 = (inner) => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none;display:block">' + inner + '</svg>';
const PLUS = '<path d="M7.99805 2.75C8.27402 2.7502 8.49805 2.97398 8.49805 3.25V7.49805H12.7451C13.0213 7.49805 13.2451 7.7219 13.2451 7.99805C13.2449 8.27402 13.0211 8.49805 12.7451 8.49805H8.49805V12.7451C8.49805 13.0211 8.27402 13.2449 7.99805 13.2451C7.7219 13.2451 7.49805 13.0213 7.49805 12.7451V8.49805H3.25C2.97398 8.49805 2.7502 8.27402 2.75 7.99805C2.75 7.7219 2.97386 7.49805 3.25 7.49805H7.49805V3.25C7.49805 2.97386 7.7219 2.75 7.99805 2.75Z" fill="currentColor"/>';
const CHEV = '<path d="M11.3848 5.6582C11.5735 5.45686 11.8903 5.44622 12.0918 5.63477C12.2931 5.82353 12.3038 6.14033 12.1152 6.3418L8.36523 10.3418C8.27071 10.4426 8.1382 10.5 8 10.5C7.8618 10.5 7.72929 10.4426 7.63477 10.3418L3.88477 6.3418C3.69622 6.14033 3.70686 5.82353 3.9082 5.63477C4.10967 5.44622 4.42647 5.45686 4.61523 5.6582L8 9.26855L11.3848 5.6582Z" fill="currentColor"/>';
const TASKIC = '<g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M8 1.333V4m2.8 1.2 1.933-1.933M12 8h2.667M10.8 10.8l1.933 1.933M8 12v2.667m-4.733-1.934L5.2 10.8M1.333 8H4m-.733-4.733L5.2 5.2"/></g>';
const PEN = '<g stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2.5H5.2C3.5 2.5 2.5 3.5 2.5 5.2v5.6c0 1.7 1 2.7 2.7 2.7h5.6c1.7 0 2.7-1 2.7-2.7V9"/><path d="M12.2 2.3l1.5 1.5-5.3 5.3-2.1.6.6-2.1z"/></g>';
const TRASH = '<g stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4.2h11M6 4.2V2.8h4v1.4M3.6 4.2l.6 8.1c.1.8.6 1.2 1.4 1.2h4.8c.8 0 1.3-.4 1.4-1.2l.6-8.1M6.6 6.8v4M9.4 6.8v4"/></g>';
const CAL = '<g stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2.8" width="12" height="11.2" rx="2.4"/><path d="M5 1.6v2.4M11 1.6v2.4M2 6.4h12"/></g>';
const TIMER = '<g stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="9" r="5"/><path d="M6.4 1.6h3.2M8 9V6.4"/></g>';
const POP = { x: 802, y: 316 };
const CELLBOX = [1018, 280, 56, 28];
const ENTRY = [811, 325, 256, 74];
const PENCIL = [1047, 325, 20, 20];
const T = { open: 2.4, hov: 3.5, penc: 4.5, edit1: 4.7, grab: 5.6, drop: 6.2, save: 7.5, hov2: 8.5, penc2: 9.0, edit2: 9.3, del: 10.4 };
const RINGS = [
  [1.4, 2.5, 1013, 275, 66, 38],
  [3.0, 3.9, 806, 320, 266, 84, 7],
  [3.9, 4.75, 1042, 320, 30, 30, 7],
  [4.9, 5.6, 806, 349, 266, 38],
  [6.6, 7.5, 806, 549, 120, 38],
  [8.7, 9.4, 1042, 320, 30, 30, 7],
  [9.5, 10.4, 941, 549, 131, 38],
  [10.7, 99, 1013, 275, 66, 38],
];
const cell = (x, txt, cls, sty) => '<div class="pms-cell ' + (cls || '') + '" style="left:' + (x - 268) + 'px;' + (sty || '') + '">' + txt + '</div>';
const bar = (x, y, w, h) => '<div class="pms-bar" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + (h || 10) + 'px"></div>';
const gb = (x, y, w, h) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:8px;background:var(--color-surface-gray-3)"></div>';
const hm = (h) => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
const rule = (y) => '<div class="pms-abs" style="left:8px;top:' + y + 'px;width:256px;height:1px;background:var(--color-outline-gray-1)"></div>';
const addBtn = (y) => '<div class="pms-abs" style="left:8px;top:' + y + 'px;width:99px;height:28px;box-sizing:border-box;padding:0 8px;display:flex;align-items:center;gap:6px;font-size:14px;color:var(--color-ink-gray-7)">' + i16(PLUS) + 'Add time</div>';
const inside = (p, b) => p[0] >= b[0] && p[0] <= b[0] + b[2] && p[1] >= b[1] && p[1] <= b[1] + b[3];
kit.scene('edit-time-inline', {
  init(kit) {
    const side = SHELL('personal');
    let head = '<div class="pms-row" style="top:100px;height:40px">' + bar(32, 16, 130, 8);
    COLS.forEach((x) => { head += bar(x - 256, 16, 32, 8); });
    head += bar(1110, 16, 40, 8) + '</div>';
    let week = '<div class="pms-row" style="top:140px"><div class="pms-abs" style="left:32px;top:13px;color:var(--color-ink-gray-5)">Oct 12 - 18, 2026</div>';
    DATES.forEach((d, i) => { week += cell(COLS[i], d); });
    week += cell(1366, 'Total') + gb(1156, 8, 28, 28) + '</div>';
    const dot = (x) => '<div class="pms-abs" style="left:' + (x - 242) + 'px;top:34px;width:4px;height:4px;border-radius:50%;background:' + AMBER + '"></div>';
    const vals = (c, bold, dots) => {
      let r = '';
      COLS.forEach((x, i) => {
        if (i === 2) r += cell(x, '04:00', 'et-wed' + c, 'color:var(--color-ink-gray-8)' + (bold ? ';font-weight:500' : '')) + (dots ? '<div class="et-dot" style="display:contents">' + dot(x) + '</div>' : '');
        else if (i < 5) r += cell(x, '08:00', '', 'color:var(--color-ink-gray-8)' + (bold ? ';font-weight:500' : '')) + (dots ? dot(x) : '');
        else if (i === 5) r += cell(x, '04:00', '', 'color:var(--color-ink-gray-8)' + (bold ? ';font-weight:500' : '')) + (dots ? dot(x) : '');
        else r += cell(x, '-', '', 'color:var(--color-ink-gray-4)');
      });
      return r + cell(1366, '40:00', 'et-tot' + c, 'color:' + GREEN + ';font-weight:500');
    };
    const all = '<div class="pms-row" style="top:184px">' + bar(48, 17, 120) + vals('a', true, false) + '</div>';
    const proj = '<div class="pms-row" style="top:228px"><div class="pms-abs" style="left:26px;top:14px;display:flex;gap:6px;color:var(--color-ink-gray-3)">' + i16(CHEV) + '</div>' + bar(70, 17, 150) + vals('p', false, false) + '</div>';
    const task = '<div class="pms-row" style="top:272px"><div class="pms-abs" style="left:70px;top:12px;display:flex;align-items:center;gap:6px;color:var(--color-ink-gray-4)">' + i16(TASKIC) + '<span>' + TASK + '</span></div>' +
      '<div class="pms-abs et-hbg" style="left:778px;top:8px;width:56px;height:28px;border-radius:8px;background:var(--color-surface-gray-2);opacity:0"></div>' + vals('t', false, true) + '</div>';
    let skel = '';
    for (let i = 0; i < 12; i++) {
      let r = '<div class="pms-row" style="top:' + (316 + i * 44) + 'px">' + bar(i % 3 ? 48 : 32, 17, i % 3 ? 160 + (i * 53) % 120 : 110);
      COLS.forEach((x) => { r += bar(x - 256, 18, 32, 8); });
      skel += r + bar(1110, 18, 40, 8) + '</div>';
    }
    const stList = '<div class="pms-abs et-sL" style="left:0;top:0;width:270px;height:126px">' +
      '<div class="pms-abs" style="left:8px;top:8px;width:79px;height:20px;border-radius:9999px;background:var(--color-surface-gray-2);box-sizing:border-box;padding:0 6px;display:flex;align-items:center;font-size:12px;font-weight:420;line-height:14px;color:var(--color-ink-gray-8);font-variant-numeric:tabular-nums">' +
      '<span style="width:12px;height:12px;display:flex;align-items:center;justify-content:center;flex:none"><span style="width:4px;height:4px;border-radius:50%;background:' + AMBER + '"></span></span><span class="et-bt">04:00</span><span style="width:12px;margin:0 4px;display:flex;color:var(--color-ink-gray-4)">' + i16(TIMER).replace('width="16" height="16"', 'width="12" height="12"') + '</span></div>' +
      '<div class="pms-abs et-pbg" style="left:244px;top:8px;width:20px;height:20px;border-radius:4px;background:var(--color-surface-gray-4);opacity:0"></div>' +
      '<div class="pms-abs et-pen" style="left:244px;top:8px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-6);opacity:0">' + i16(PEN).replace('width="16" height="16"', 'width="16" height="16"') + '</div>' +
      '<div class="pms-abs" style="left:8px;top:36px;width:256px;font-size:14px;line-height:21px;color:var(--color-ink-gray-7);white-space:nowrap">' + COMMENT + '</div>' + rule(81) + addBtn(90) + '</div>';
    const stEdit = '<div class="pms-abs et-sE" style="left:0;top:0;width:270px;height:318px;visibility:hidden">' +
      '<div class="pms-abs" style="left:8px;top:16px;display:flex;gap:3px;font-size:13px;line-height:15px;color:var(--color-ink-gray-5)">Edit time<span style="color:var(--color-ink-red-3)">*</span></div>' +
      '<div class="pms-abs et-left" style="right:8px;top:16px;font-size:13px;line-height:15px;color:var(--color-ink-gray-5)">4h left</div>' +
      '<div class="pms-abs" style="left:8px;top:37px;width:256px;height:28px;border-radius:8px;background:var(--color-surface-gray-2);overflow:hidden"><div class="pms-abs et-fill" style="left:0;top:0;height:28px;width:128px;background:var(--color-surface-gray-4);border-radius:8px"><span class="pms-abs" style="right:6px;top:8px;width:2px;height:12px;border-radius:2px;background:rgba(23,23,23,.12)"></span></div>' +
      '<span class="pms-abs" style="left:10px;top:6px;font-size:13px;font-weight:420;color:var(--color-ink-gray-8)">Duration</span><span class="pms-abs et-dv" style="right:10px;top:6px;font-size:13px;font-weight:420;color:var(--color-ink-gray-8);font-variant-numeric:tabular-nums">04:00</span></div>' +
      '<div class="pms-abs" style="left:8px;top:73px;display:flex;gap:2px;font-size:12px;line-height:14px;color:var(--color-ink-gray-5)">Edit date<span style="color:var(--color-ink-red-3)">*</span></div>' +
      '<div class="pms-abs" style="left:8px;top:95px;width:256px;height:28px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;padding:0 8px;display:flex;align-items:center;justify-content:space-between;font-size:14px;color:var(--color-ink-gray-7)"><span>Oct 14, 2026</span><span style="display:flex;color:var(--color-ink-gray-7)">' + i16(CAL) + '</span></div>' +
      '<div class="pms-abs" style="left:8px;top:133px;width:256px;height:96px;border:1px solid var(--color-outline-gray-2);border-radius:10px;box-sizing:border-box;padding:8px 8px;font-size:14px;line-height:21px;color:var(--color-ink-gray-7);white-space:nowrap">' + COMMENT + '</div>' +
      '<div class="pms-btn pms-btn-soft et-save" style="left:8px;top:237px;width:110px;gap:8px;color:var(--color-ink-gray-4);padding:0 8px;justify-content:flex-start">' + i16(PLUS) + 'Save entry</div>' +
      '<div class="pms-btn" style="left:143px;top:237px;width:121px;gap:8px;background:var(--color-surface-red-2);color:var(--color-ink-red-4);padding:0 8px;justify-content:flex-start">' + i16(TRASH) + 'Delete entry</div>' +
      rule(273) + addBtn(282) + '</div>';
    const pop = '<div class="pms-pop et-pop" style="left:' + POP.x + 'px;top:' + POP.y + 'px;height:126px;opacity:0;visibility:hidden;transform:none">' + stList + stEdit + '</div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam et-cam"><div class="pms-win">' + side +
      head + week + all + proj + task + '<div class="pms-abs" style="left:0;right:0;top:0;height:900px">' + skel + '</div>' + pop + '<div class="pms-ring et-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.et-' + c);
    for (const k of ['cam', 'pop', 'sL', 'sE', 'fill', 'dv', 'left', 'save', 'ring', 'hbg', 'bt', 'pen', 'pbg']) this[k] = q(k);
    this.weds = ['weda', 'wedp', 'wedt'].map(q);
    this.dotw = q('dot');
    this.tots = ['tota', 'totp', 'tott'].map(q);
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.12, hold: 0.7 },
      { t: 2.0, cx: 1000, cy: 460, z: 1.9, hold: 2.2, drift: [0, 0, 0.003] },
      { t: 4.9, cx: 1075, cy: 540, z: 1.6, hold: 5.2 },
      { t: 10.7, cx: 1110, cy: 420, z: 1.7, drift: [0, 0, 0.004] },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0.6, at: [1500, 880] }, { t: 2.0, at: [1286, 378] }, { t: 2.9, at: [1286, 378] }, { t: 3.5, at: [1130, 452] }, { t: 3.9, at: [1130, 452] },
      { t: 4.5, at: [1296, 424] }, { t: 4.8, at: [1296, 424] }, { t: 5.4, at: [1178, 457] }, { t: 5.6, at: [1178, 457] }, { t: 6.2, at: [1146, 457] },
      { t: 6.5, at: [1146, 457] }, { t: 7.1, at: [1105, 657] }, { t: 7.9, at: [1105, 657] }, { t: 8.5, at: [1130, 452] }, { t: 8.9, at: [1130, 452] },
      { t: 9.2, at: [1296, 424] }, { t: 9.5, at: [1296, 424] }, { t: 10.2, at: [1246, 657] }, { t: 13.2, at: [1250, 662] },
    ];
    this.cur.clicks = [4.7, 5.6, 7.45, 9.3, 10.35];
    this.cur.holds = [[5.6, 6.25]];
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const W = (tt) => { const p = this.cur.position(tt); return [p[0] - 240, p[1] - 90]; };
    const edit = (t >= T.edit1 && t < T.save) || (t >= T.edit2 && t < T.del);
    const openA = eo(seg(t, T.open, T.open + 0.2)) * (1 - seg(t, T.del, T.del + 0.15));
    this.pop.style.opacity = openA;
    this.pop.style.visibility = openA > 0 ? 'visible' : 'hidden';
    this.pop.style.height = (edit ? 318 : 126) + 'px';
    this.sL.style.visibility = edit ? 'hidden' : 'visible';
    this.sE.style.visibility = edit ? 'visible' : 'hidden';
    const dragK = eio(seg(t, T.grab, T.drop));
    const hrs = t < T.save ? lerp(4, 3, dragK) : 3;
    const hq = Math.round(hrs * 4) / 4;
    this.fill.style.width = (hq / 8 * 256) + 'px';
    this.dv.textContent = hm(hq);
    this.left.textContent = (8 - hq) + 'h left';
    const changed = t >= T.edit1 && t < T.save && hq !== 4;
    this.save.style.color = changed ? 'var(--color-ink-gray-8)' : 'var(--color-ink-gray-4)';
    this.save.style.transform = 'scale(' + (1 - 0.04 * seg(t, 7.4, 7.45) * (1 - seg(t, 7.45, 7.57))) + ')';
    this.bt.textContent = hm(t < T.save ? 4 : 3);
    const hv = (tt, box) => inside(W(tt), box) ? 1 : 0;
    const smooth = (box) => { let s = 0; for (let k = 0; k < 5; k++) s += hv(t - k * 0.0375, box); return s / 5; };
    const overEntry = !edit && openA > 0 && inside(W(t), ENTRY);
    this.pen.style.opacity = overEntry ? 1 : 0;
    this.pbg.style.opacity = overEntry ? smooth(PENCIL) : 0;
    const cellHov = t < T.del ? smooth(CELLBOX) : 0;
    this.hbg.style.opacity = cellHov;
    const v = t < T.save ? '04:00' : t < T.del ? '03:00' : '-';
    this.weds.forEach((el, i) => { el.textContent = v; el.style.color = v === '-' ? 'var(--color-ink-gray-4)' : 'var(--color-ink-gray-8)'; el.style.fontWeight = (i === 0 && v !== '-') ? '500' : '400'; });
    this.dotw.style.display = t < T.del ? 'contents' : 'none';
    const tot = t < T.save ? [40, GREEN] : t < T.del ? [39, RED] : [36, RED];
    // In the app a project row's total is always green and a task row's always gray.
    this.tots.forEach((el, i) => { el.textContent = hm(tot[0]); el.style.color = [tot[1], GREEN, 'var(--color-ink-gray-6)'][i]; });
    let r = null;
    for (const g of RINGS) if (t >= g[0] && t < g[1]) r = g;
    if (r) {
      const s = this.ring.style;
      s.left = r[2] + 'px'; s.top = r[3] + 'px'; s.width = r[4] + 'px'; s.height = r[5] + 'px'; s.borderRadius = (r[6] || 11) + 'px';
      s.opacity = Math.min(eo(seg(t, r[0], r[0] + 0.25)), 1 - seg(t, r[1] - 0.15, r[1]));
    } else this.ring.style.opacity = 0;
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
